const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

function generateSchedule({ groups, availability, duration_minutes, format, room, meet_link_base }) {
  const slots = [];
  let gi = 0;
  const dur = parseInt(duration_minutes)||20;
  const sorted = [...availability].sort((a,b)=>
    new Date(`${a.avail_date}T${a.start_time}`) - new Date(`${b.avail_date}T${b.start_time}`)
  );
  for (const av of sorted) {
    if (gi >= groups.length) break;
    const [sh,sm] = av.start_time.split(':').map(Number);
    const [eh,em] = av.end_time.split(':').map(Number);
    let cur = sh*60+sm;
    const end = eh*60+em;
    while (cur+dur <= end && gi < groups.length) {
      const sH = String(Math.floor(cur/60)).padStart(2,'0');
      const sM = String(cur%60).padStart(2,'0');
      const eMin = cur+dur;
      const eH = String(Math.floor(eMin/60)).padStart(2,'0');
      const eM = String(eMin%60).padStart(2,'0');
      slots.push({
        group_id:   groups[gi].id,
        slot_date:  av.avail_date,
        start_time: `${sH}:${sM}`,
        end_time:   `${eH}:${eM}`,
        format, order_num: gi+1,
        room:       format==='presentiel'?(room||null):null,
        meet_link:  format==='meet'
          ?(meet_link_base?`${meet_link_base}-g${gi+1}`:`https://meet.google.com/auto-${gi+1}`):null,
      });
      cur += dur; gi++;
    }
  }
  return slots;
}

// POST /api/soutenances/generate
router.post('/generate', auth, async (req,res) => {
  if (req.user.role!=='teacher'&&req.user.role!=='admin')
    return res.status(403).json({ error:'Réservé aux enseignants' });
  const { project_id, duration_minutes=20, format='presentiel', room, meet_link_base } = req.body;
  if (!project_id) return res.status(400).json({ error:'project_id requis' });
  try {
    const { rows:[proj] } = await pool.query(
      'SELECT * FROM projects WHERE id=$1 AND teacher_id=$2',[project_id,req.user.id]
    );
    if (!proj) return res.status(403).json({ error:'Non autorisé' });
    const { rows:groups } = await pool.query(
      `SELECT * FROM groups WHERE project_id=$1 ORDER BY created_at`,[project_id]
    );
    if (!groups.length) return res.status(400).json({ error:'Aucun groupe inscrit' });
    const { rows:availability } = await pool.query(
      `SELECT * FROM teacher_availability WHERE project_id=$1 ORDER BY avail_date,start_time`,[project_id]
    );
    if (!availability.length) return res.status(400).json({ error:'Aucune disponibilité définie' });
    const slots = generateSchedule({ groups, availability, duration_minutes, format, room, meet_link_base });
    if (slots.length < groups.length)
      return res.status(400).json({ error:`Créneaux insuffisants: ${slots.length}/${groups.length} groupes couverts. Ajoutez des disponibilités.` });
    await pool.query('DELETE FROM soutenance_slots WHERE project_id=$1',[project_id]);
    for (const s of slots) {
      await pool.query(`
        INSERT INTO soutenance_slots (project_id,group_id,slot_date,start_time,end_time,format,room,meet_link,order_num)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,[project_id,s.group_id,s.slot_date,s.start_time,s.end_time,s.format,s.room,s.meet_link,s.order_num]);
    }
    // Notify each group's members
    for (const slot of slots) {
      const g = groups.find(x=>x.id===slot.group_id);
      const { rows:members } = await pool.query(
        `SELECT user_id FROM group_members WHERE group_id=$1`,[slot.group_id]
      );
      for (const m of members) {
        await pool.query(
          `INSERT INTO notifications (user_id,type,title,body,ref_id) VALUES ($1,'slot_assigned',$2,$3,$4)`,
          [m.user_id,'Créneau de soutenance assigné !',
           `${g?.name||'Votre groupe'} — ${slot.slot_date} · ${slot.start_time.slice(0,5)}–${slot.end_time.slice(0,5)} · ${slot.format==='meet'?'Google Meet':'Salle '+(slot.room||'?')}`,
           project_id]
        );
      }
    }
    res.json({ generated:slots.length });
  } catch(e){ console.error(e); res.status(500).json({ error:'Erreur serveur' }); }
});

// POST /api/soutenances/manual
router.post('/manual', auth, async (req,res) => {
  if (req.user.role!=='teacher'&&req.user.role!=='admin')
    return res.status(403).json({ error:'Réservé aux enseignants' });
  const { project_id,group_id,slot_date,start_time,end_time,format='presentiel',room,meet_link } = req.body;
  if (!project_id||!slot_date||!start_time||!end_time)
    return res.status(400).json({ error:'Champs requis manquants' });
  try {
    const { rows:[s] } = await pool.query(`
      INSERT INTO soutenance_slots (project_id,group_id,slot_date,start_time,end_time,format,room,meet_link)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `,[project_id,group_id||null,slot_date,start_time,end_time,format,room||null,meet_link||null]);
    if (group_id) {
      const { rows:members } = await pool.query(`SELECT user_id FROM group_members WHERE group_id=$1`,[group_id]);
      for (const m of members) {
        await pool.query(
          `INSERT INTO notifications (user_id,type,title,body,ref_id) VALUES ($1,'slot_assigned',$2,$3,$4)`,
          [m.user_id,'Créneau de soutenance assigné !',
           `${slot_date} · ${start_time.slice(0,5)}–${end_time.slice(0,5)} · ${format==='meet'?'Google Meet':'Salle '+(room||'?')}`,
           project_id]
        );
      }
    }
    res.status(201).json(s);
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

// PATCH /api/soutenances/:id
router.patch('/:id', auth, async (req,res) => {
  const { group_id,slot_date,start_time,end_time,format,room,meet_link } = req.body;
  try {
    const { rows:[s] } = await pool.query(`
      UPDATE soutenance_slots SET
        group_id=COALESCE($2,group_id), slot_date=COALESCE($3,slot_date),
        start_time=COALESCE($4,start_time), end_time=COALESCE($5,end_time),
        format=COALESCE($6,format), room=COALESCE($7,room), meet_link=COALESCE($8,meet_link)
      WHERE id=$1 RETURNING *
    `,[req.params.id,group_id,slot_date,start_time,end_time,format,room,meet_link]);
    res.json(s);
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

// DELETE /api/soutenances/:id
router.delete('/:id', auth, async (req,res) => {
  try {
    await pool.query('DELETE FROM soutenance_slots WHERE id=$1',[req.params.id]);
    res.json({ deleted:true });
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

// GET /api/soutenances/my/:projectId
router.get('/my/:projectId', auth, async (req,res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, g.name AS group_name
      FROM soutenance_slots s
      JOIN groups g ON g.id=s.group_id
      JOIN group_members gm ON gm.group_id=g.id
      WHERE s.project_id=$1 AND gm.user_id=$2 LIMIT 1
    `,[req.params.projectId, req.user.id]);
    res.json(rows[0]||null);
  } catch(e){ res.status(500).json({ error:'Erreur serveur' }); }
});

module.exports = router;
