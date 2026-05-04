const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// GET /api/projects
router.get('/', auth, async (req,res) => {
  try {
    let rows;
    if (req.user.role === 'teacher') {
      ({ rows } = await pool.query(`
        SELECT p.*,
          (SELECT COUNT(*) FROM groups g WHERE g.project_id=p.id)::int AS group_count,
          (SELECT COUNT(*) FROM soutenance_slots s WHERE s.project_id=p.id)::int AS slot_count
        FROM projects p WHERE p.teacher_id=$1 ORDER BY p.created_at DESC
      `, [req.user.id]));
    } else {
      const { rows: [u] } = await pool.query('SELECT filiere FROM users WHERE id=$1',[req.user.id]);
      ({ rows } = await pool.query(`
        SELECT p.*,
          u.full_name AS teacher_name,
          (SELECT COUNT(*) FROM groups g WHERE g.project_id=p.id)::int AS group_count,
          (SELECT g.id FROM groups g JOIN group_members gm ON gm.group_id=g.id
           WHERE g.project_id=p.id AND gm.user_id=$2 LIMIT 1) AS my_group_id
        FROM projects p
        JOIN users u ON u.id=p.teacher_id
        WHERE p.filiere=$1
        ORDER BY p.status='open' DESC, p.created_at DESC
      `, [u.filiere, req.user.id]));
    }
    res.json(rows);
  } catch(e){ console.error(e); res.status(500).json({ error:'Erreur serveur' }); }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req,res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.full_name AS teacher_name, u.email AS teacher_email,
        (SELECT json_agg(json_build_object(
          'id',g.id,'name',g.name,'created_by',g.created_by,
          'link_url',g.link_url,'link_type',g.link_type,'submitted_at',g.submitted_at,
          'creator_name',(SELECT full_name FROM users WHERE id=g.created_by),
          'members',(
            SELECT json_agg(json_build_object('id',u2.id,'full_name',u2.full_name,'email',u2.email))
            FROM group_members gm JOIN users u2 ON u2.id=gm.user_id WHERE gm.group_id=g.id
          )
        ) ORDER BY g.created_at)
        FROM groups g WHERE g.project_id=p.id) AS groups,
        (SELECT json_agg(json_build_object(
          'id',s.id,'slot_date',s.slot_date,'start_time',s.start_time,
          'end_time',s.end_time,'format',s.format,'room',s.room,
          'meet_link',s.meet_link,'order_num',s.order_num,'group_id',s.group_id,
          'group_name',(SELECT name FROM groups WHERE id=s.group_id)
        ) ORDER BY s.slot_date,s.start_time)
        FROM soutenance_slots s WHERE s.project_id=p.id) AS slots,
        (SELECT json_agg(json_build_object(
          'id',a.id,'avail_date',a.avail_date,'start_time',a.start_time,'end_time',a.end_time
        )) FROM teacher_availability a WHERE a.project_id=p.id) AS availability
      FROM projects p JOIN users u ON u.id=p.teacher_id WHERE p.id=$1
    `,[req.params.id]);
    if (!rows.length) return res.status(404).json({ error:'Introuvable' });
    res.json(rows[0]);
  } catch(e){ console.error(e); res.status(500).json({ error:'Erreur serveur' }); }
});

// POST /api/projects — teacher only
router.post('/', auth, async (req,res) => {
  if (req.user.role!=='teacher'&&req.user.role!=='admin')
    return res.status(403).json({ error:'Réservé aux enseignants' });
  const { title, description, filiere, type='mini_project', deadline, max_group_size=3, allow_solo=false } = req.body;
  if (!title||!filiere) return res.status(400).json({ error:'title et filiere requis' });
  if (!['ING-A1','ING-A2','ING-A3'].includes(filiere))
    return res.status(400).json({ error:'Filière invalide' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO projects (teacher_id,title,description,filiere,type,deadline,max_group_size,allow_solo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `,[req.user.id,title,description||null,filiere,type,deadline||null,max_group_size,allow_solo]);
    const proj = rows[0];
    // Notify all students of this filiere
    const { rows: students } = await pool.query(
      `SELECT id FROM users WHERE role='student' AND filiere=$1`,[filiere]
    );
    const { rows: [teacher] } = await pool.query('SELECT full_name FROM users WHERE id=$1',[req.user.id]);
    for (const s of students) {
      await pool.query(
        `INSERT INTO notifications (user_id,type,title,body,ref_id) VALUES ($1,'new_project',$2,$3,$4)`,
        [s.id, `Nouveau projet — ${filiere}`,
         `"${title}" publié par ${teacher.full_name}. Inscrivez-vous avant la deadline !`, proj.id]
      );
    }
    res.status(201).json(proj);
  } catch(e){ console.error(e); res.status(500).json({ error:'Erreur serveur' }); }
});

// PATCH /api/projects/:id
router.patch('/:id', auth, async (req,res) => {
  try {
    const { rows:[check] } = await pool.query('SELECT teacher_id FROM projects WHERE id=$1',[req.params.id]);
    if (!check) return res.status(404).json({ error:'Introuvable' });
    if (check.teacher_id!==req.user.id&&req.user.role!=='admin')
      return res.status(403).json({ error:'Non autorisé' });
    const { title,description,deadline,status,max_group_size,allow_solo } = req.body;
    const { rows } = await pool.query(`
      UPDATE projects SET
        title=COALESCE($2,title), description=COALESCE($3,description),
        deadline=COALESCE($4,deadline), status=COALESCE($5,status),
        max_group_size=COALESCE($6,max_group_size), allow_solo=COALESCE($7,allow_solo)
      WHERE id=$1 RETURNING *
    `,[req.params.id,title,description,deadline,status,max_group_size,allow_solo]);
    res.json(rows[0]);
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

// POST /api/projects/:id/availability
router.post('/:id/availability', auth, async (req,res) => {
  const { slots } = req.body;
  if (!Array.isArray(slots)||!slots.length) return res.status(400).json({ error:'slots[] requis' });
  try {
    await pool.query('DELETE FROM teacher_availability WHERE project_id=$1',[req.params.id]);
    for (const s of slots) {
      await pool.query(
        `INSERT INTO teacher_availability (project_id,avail_date,start_time,end_time) VALUES ($1,$2,$3,$4)`,
        [req.params.id,s.avail_date,s.start_time,s.end_time]
      );
    }
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

module.exports = router;
