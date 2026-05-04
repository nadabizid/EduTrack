import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';

const daysLeft = d => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;
const FIL_BADGE = {'ING-A1':'inga1','ING-A2':'inga2','ING-A3':'inga3'};
const NOTIF_ICONS = { new_project:'🎯', slot_assigned:'📅', group_invite:'👥' };

export default function DashboardPage() {
  const { user, notifs } = useAuth();
  const navigate = useNavigate();
  const isT = user?.role === 'teacher';
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/projects').then(r=>setProjects(r.data)).finally(()=>setLoading(false));
  },[]);

  const open     = projects.filter(p=>p.status==='open');
  const enrolled = projects.filter(p=>p.my_group_id);
  const unreadN  = notifs.filter(n=>!n.is_read).length;

  const teacherStats = [
    { val:projects.length, lbl:'Projets créés', col:'var(--blue)' },
    { val:open.length, lbl:'Projets ouverts', col:'var(--green)' },
    { val:projects.reduce((a,p)=>a+parseInt(p.group_count||0),0), lbl:'Groupes inscrits', col:'var(--violet)' },
    { val:projects.reduce((a,p)=>a+parseInt(p.slot_count||0),0), lbl:'Créneaux planifiés', col:'var(--amber)' },
  ];

  const studentStats = [
    { val:open.length, lbl:'Projets disponibles', col:'var(--blue)' },
    { val:enrolled.length, lbl:'Mes inscriptions', col:'var(--green)' },
    { val:unreadN, lbl:'Notifications', col:'var(--violet)' },
  ];

  const stats = isT ? teacherStats : studentStats;

  return (
    <>
      <Topbar title="Tableau de bord" sub={isT ? `Enseignant · ${user?.email}` : `${user?.filiere} · ${user?.email}`}/>
      <div className="content">
        <div style={{marginBottom:22}}>
          <h2 className="sg" style={{fontSize:20,fontWeight:700,marginBottom:3}}>
            Bonjour, {user?.full_name?.split(' ').slice(-1)[0]} 👋
          </h2>
          <p style={{fontSize:12.5,color:'var(--muted)'}}>
            {isT ? 'Gérez vos projets et planifiez les soutenances.' : `Espace étudiant — filière ${user?.filiere}.`}
          </p>
        </div>

        {loading ? <div className="loading"><div className="spinner"/></div> : (
          <>
            {/* Stats */}
            <div style={{display:'grid',gridTemplateColumns:`repeat(${stats.length},1fr)`,gap:12,marginBottom:22}}>
              {stats.map((s,i)=>(
                <div key={i} className="stat">
                  <div className="stat-val" style={{color:s.col}}>{s.val}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>

            <div className="g2" style={{alignItems:'start'}}>
              {/* Projects */}
              <div className="card">
                <div className="card-title">
                  {isT ? 'Mes projets récents' : 'Projets disponibles'}
                  <button className="btn sm ghost"
                    onClick={()=>navigate(isT?'/teacher/projects':'/student/projects')}>
                    Voir tout →
                  </button>
                </div>
                {projects.length===0 && (
                  <div style={{color:'var(--muted)',fontSize:12.5,padding:'8px 0'}}>Aucun projet.</div>
                )}
                {projects.slice(0,5).map(p=>{
                  const days = daysLeft(p.deadline);
                  return (
                    <div key={p.id} style={{display:'flex',gap:10,padding:'9px 0',borderBottom:'1px solid var(--br)',alignItems:'center'}}>
                      <div style={{width:30,height:30,borderRadius:8,flexShrink:0,fontSize:14,background:'var(--s3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {p.type==='pfe'?'🎓':'📋'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12.5,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:2}}>
                          {p.title}
                        </div>
                        <div style={{fontSize:10.5,color:'var(--muted)',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                          <span className={`badge ${FIL_BADGE[p.filiere]||'open'}`}>{p.filiere}</span>
                          {days!==null&&(
                            <span style={{color:days<=5?'var(--red)':days<=14?'var(--amber)':'var(--muted)'}}>
                              {days<=0?'Expiré':`${days}j`}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`badge ${p.status}`}>{p.status==='open'?'Ouvert':'Fermé'}</span>
                    </div>
                  );
                })}
              </div>

              {/* Notifications */}
              <div className="card">
                <div className="card-title">Notifications récentes</div>
                {notifs.length===0 && (
                  <div style={{color:'var(--muted)',fontSize:12.5,padding:'8px 0'}}>Aucune notification.</div>
                )}
                {notifs.slice(0,6).map(n=>(
                  <div key={n.id} style={{display:'flex',gap:9,padding:'9px 0',borderBottom:'1px solid var(--br)',opacity:n.is_read?0.55:1}}>
                    <div style={{width:28,height:28,borderRadius:7,background:'var(--s3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>
                      {NOTIF_ICONS[n.type]||'🔔'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11.5,fontWeight:n.is_read?400:600,marginBottom:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {n.title}
                      </div>
                      <div style={{fontSize:10.5,color:'var(--muted)',lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                        {n.body}
                      </div>
                    </div>
                    {!n.is_read&&<div style={{width:5,height:5,borderRadius:'50%',background:'var(--blue)',flexShrink:0,marginTop:4}}/>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
