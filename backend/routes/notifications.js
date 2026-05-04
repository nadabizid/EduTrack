const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

router.get('/', auth, async (req,res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,[req.user.id]
    );
    res.json({ notifications:rows, unread:rows.filter(n=>!n.is_read).length });
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

router.patch('/read-all', auth, async (req,res) => {
  try {
    await pool.query(`UPDATE notifications SET is_read=TRUE WHERE user_id=$1`,[req.user.id]);
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

router.patch('/:id/read', auth, async (req,res) => {
  try {
    await pool.query(`UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2`,[req.params.id,req.user.id]);
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

module.exports = router;
