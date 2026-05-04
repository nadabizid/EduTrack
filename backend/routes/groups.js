const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// GET /api/groups/project/:projectId
router.get('/project/:projectId', auth, async (req,res) => {
  try {
    const { rows } = await pool.query(`
      SELECT g.*,
        (SELECT full_name FROM users WHERE id=g.created_by) AS creator_name,
        (SELECT json_agg(json_build_object(
          'id',u.id,'full_name',u.full_name,'email',u.email
        ) ORDER BY gm.joined_at)
        FROM group_members gm JOIN users u ON u.id=gm.user_id
        WHERE gm.group_id=g.id) AS members
      FROM groups g WHERE g.project_id=$1 ORDER BY g.created_at
    `,[req.params.projectId]);
    res.json(rows);
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

// GET /api/groups/mine/:projectId — my group for a project
router.get('/mine/:projectId', auth, async (req,res) => {
  try {
    const { rows } = await pool.query(`
      SELECT g.*,
        (SELECT json_agg(json_build_object('id',u.id,'full_name',u.full_name,'email',u.email))
         FROM group_members gm JOIN users u ON u.id=gm.user_id WHERE gm.group_id=g.id) AS members
      FROM groups g
      JOIN group_members gm ON gm.group_id=g.id
      WHERE g.project_id=$1 AND gm.user_id=$2
      LIMIT 1
    `,[req.params.projectId, req.user.id]);
    res.json(rows[0]||null);
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

// POST /api/groups — create group (student)
router.post('/', auth, async (req,res) => {
  if (req.user.role!=='student') return res.status(403).json({ error:'Réservé aux étudiants' });
  const { project_id, name, member_emails=[] } = req.body;
  if (!project_id) return res.status(400).json({ error:'project_id requis' });
  try {
    // Check project open
    const { rows:[p] } = await pool.query('SELECT * FROM projects WHERE id=$1',[project_id]);
    if (!p||p.status!=='open') return res.status(400).json({ error:'Projet fermé' });
    // Check student filiere matches
    const { rows:[me] } = await pool.query('SELECT filiere FROM users WHERE id=$1',[req.user.id]);
    if (me.filiere!==p.filiere) return res.status(403).json({ error:'Ce projet n\'est pas pour votre filière' });
    // Check not already in a group
    const { rows:existing } = await pool.query(`
      SELECT 1 FROM groups g JOIN group_members gm ON gm.group_id=g.id
      WHERE g.project_id=$1 AND gm.user_id=$2
    `,[project_id,req.user.id]);
    if (existing.length) return res.status(409).json({ error:'Vous êtes déjà dans un groupe pour ce projet' });

    const groupName = name||`Groupe ${Date.now().toString().slice(-4)}`;
    const { rows:[grp] } = await pool.query(
      `INSERT INTO groups (project_id,name,created_by) VALUES ($1,$2,$3) RETURNING *`,
      [project_id,groupName,req.user.id]
    );
    // Add creator
    await pool.query(`INSERT INTO group_members (group_id,user_id) VALUES ($1,$2)`,[grp.id,req.user.id]);

    // Add invited members
    const added = [];
    for (const email of member_emails.filter(e=>e?.trim())) {
      try {
        const { rows:[invitee] } = await pool.query('SELECT id,full_name FROM users WHERE email=$1',[email.trim()]);
        if (!invitee) { added.push({ email, error:'Utilisateur introuvable' }); continue; }
        // Check size
        const { rows:[cnt] } = await pool.query(
          `SELECT COUNT(*)::int AS c FROM group_members WHERE group_id=$1`,[grp.id]
        );
        if (cnt.c >= p.max_group_size) { added.push({ email, error:'Groupe plein' }); continue; }
        // Check not already in another group
        const { rows:inOther } = await pool.query(`
          SELECT 1 FROM groups g2 JOIN group_members gm2 ON gm2.group_id=g2.id
          WHERE g2.project_id=$1 AND gm2.user_id=$2
        `,[project_id,invitee.id]);
        if (inOther.length) { added.push({ email, error:'Déjà dans un groupe' }); continue; }
        await pool.query(`INSERT INTO group_members (group_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[grp.id,invitee.id]);
        await pool.query(
          `INSERT INTO notifications (user_id,type,title,body,ref_id) VALUES ($1,'group_invite',$2,$3,$4)`,
          [invitee.id,'Vous avez été ajouté à un groupe',`Vous faites maintenant partie du groupe "${groupName}".`,grp.id]
        );
        added.push({ email, full_name:invitee.full_name, ok:true });
      } catch(err){ added.push({ email, error:'Erreur' }); }
    }

    // Fetch complete group
    const { rows:[full] } = await pool.query(`
      SELECT g.*,
        (SELECT json_agg(json_build_object('id',u.id,'full_name',u.full_name,'email',u.email))
         FROM group_members gm JOIN users u ON u.id=gm.user_id WHERE gm.group_id=g.id) AS members
      FROM groups g WHERE g.id=$1
    `,[grp.id]);
    res.status(201).json({ group:full, invite_results:added });
  } catch(e){ console.error(e); res.status(500).json({ error:'Erreur serveur' }); }
});

// POST /api/groups/:id/invite — add member to existing group
router.post('/:id/invite', auth, async (req,res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error:'email requis' });
  try {
    const { rows:[grp] } = await pool.query('SELECT * FROM groups WHERE id=$1',[req.params.id]);
    if (!grp) return res.status(404).json({ error:'Groupe introuvable' });
    // Must be member
    const { rows:isMember } = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2`,[grp.id,req.user.id]
    );
    if (!isMember.length) return res.status(403).json({ error:'Vous n\'êtes pas dans ce groupe' });
    // Check size
    const { rows:[p] } = await pool.query('SELECT max_group_size FROM projects WHERE id=$1',[grp.project_id]);
    const { rows:[cnt] } = await pool.query(
      `SELECT COUNT(*)::int AS c FROM group_members WHERE group_id=$1`,[grp.id]
    );
    if (cnt.c >= p.max_group_size) return res.status(400).json({ error:`Groupe plein (max ${p.max_group_size})` });
    const { rows:[invitee] } = await pool.query('SELECT id,full_name FROM users WHERE email=$1',[email.trim()]);
    if (!invitee) return res.status(404).json({ error:'Utilisateur introuvable' });
    await pool.query(
      `INSERT INTO group_members (group_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[grp.id,invitee.id]
    );
    await pool.query(
      `INSERT INTO notifications (user_id,type,title,body,ref_id) VALUES ($1,'group_invite',$2,$3,$4)`,
      [invitee.id,'Vous avez été ajouté à un groupe',`Vous faites maintenant partie du groupe "${grp.name}".`,grp.id]
    );
    res.json({ ok:true, member:{ id:invitee.id, full_name:invitee.full_name } });
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

// PATCH /api/groups/:id/submit — any group member can submit
router.patch('/:id/submit', auth, async (req,res) => {
  const { link_url, link_type='other' } = req.body;
  if (!link_url) return res.status(400).json({ error:'link_url requis' });
  try {
    const { rows:[grp] } = await pool.query('SELECT * FROM groups WHERE id=$1',[req.params.id]);
    if (!grp) return res.status(404).json({ error:'Groupe introuvable' });
    const { rows:m } = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2`,[grp.id,req.user.id]
    );
    if (!m.length) return res.status(403).json({ error:'Non membre' });
    const { rows:[proj] } = await pool.query('SELECT deadline FROM projects WHERE id=$1',[grp.project_id]);
    if (proj.deadline && new Date() > new Date(proj.deadline))
      return res.status(400).json({ error:'Deadline dépassée' });
    const { rows:[updated] } = await pool.query(
      `UPDATE groups SET link_url=$2,link_type=$3,submitted_at=NOW() WHERE id=$1 RETURNING *`,
      [grp.id,link_url,link_type]
    );
    res.json(updated);
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

module.exports = router;
