const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../db');
const auth   = require('../middleware/auth');
const SECRET = process.env.JWT_SECRET || 'edutrack3_secret';
const sign   = u => jwt.sign({ id:u.id, email:u.email, role:u.role, filiere:u.filiere }, SECRET, { expiresIn:'7d' });

router.post('/login', async (req,res) => {
  const { email, password } = req.body;
  if (!email||!password) return res.status(400).json({ error:'Champs requis' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1',[email]);
    if (!rows.length) return res.status(401).json({ error:'Identifiants incorrects' });
    const user = rows[0];
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ error:'Identifiants incorrects' });
    const { password:_, ...safe } = user;
    res.json({ token: sign(safe), user: safe });
  } catch(e){ console.error(e); res.status(500).json({ error:'Erreur serveur' }); }
});

router.post('/register', async (req,res) => {
  const { full_name, email, password, role='student', filiere } = req.body;
  if (!full_name||!email||!password) return res.status(400).json({ error:'Champs requis' });
  if (role==='student' && !['ING-A1','ING-A2','ING-A3'].includes(filiere))
    return res.status(400).json({ error:'Filière invalide. Choisir ING-A1, ING-A2 ou ING-A3' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name,email,password,role,filiere) VALUES ($1,$2,$3,$4,$5)
       RETURNING id,full_name,email,role,filiere,created_at`,
      [full_name, email, hash, role, filiere||null]
    );
    res.status(201).json({ token: sign(rows[0]), user: rows[0] });
  } catch(e){
    if (e.code==='23505') return res.status(409).json({ error:'Email déjà utilisé' });
    res.status(500).json({ error:'Erreur serveur' });
  }
});

router.get('/me', auth, async (req,res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,full_name,email,role,filiere,avatar_url,created_at FROM users WHERE id=$1',[req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error:'Introuvable' });
    res.json(rows[0]);
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

module.exports = router;
