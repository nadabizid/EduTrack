import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Topbar } from '../components/Layout';
import api from '../api/client';

const ini = n => n?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : null;
const LINK_ICON = {github:'⬡',drive:'📁',figma:'🎨',other:'🔗'};

export default function TeacherGroupsPage() {
  const [sp]       = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [selId,    setSelId]    = useState(sp.get('p')||'');
  const [groups,   setGroups]   = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(()=>{
    api.get('/projects').then(r=>{
      setProjects(r.data);
      if(!selId&&r.data.length) setSelId(String(r.data[0].id));
    });
  },[]);

  useEffect(()=>{
    if(!selId) return;
    setLoading(true);
    api.get(`/groups/project/${selId}`).then(r=>setGroups(r.data)).finally(()=>setLoading(false));
  },[selId]);

  const submitted = groups.filter(g=>g.link_url).length;

  return (<>
    <Topbar title="Groupes & dépôts"/>
    <div className="content">
      <div style={{display:'flex',gap:10,marginBottom:18,alignItems:'center'}}>
        <span style={{fontSize:12.5,color:'var(--muted)',flexShrink:0}}>Projet :</span>
        <select value={selId} onChange={e=>setSelId(e.target.value)} style={{maxWidth:340}}>
          {projects.map(p=><option key={p.id} value={p.id}>{p.title} ({p.filiere})</option>)}
        </select>
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> : (<>
        <div className="g3" style={{marginBottom:18}}>
          {[{v:groups.length,l:'Groupes',c:'var(--blue)'},{v:submitted,l:'Dépôts effectués',c:'var(--green)'},{v:groups.length-submitted,l:'Dépôts manquants',c:'var(--amber)'}].map((s,i)=>(
            <div key={i} className="stat"><div className="stat-val" style={{color:s.c}}>{s.v}</div><div className="stat-lbl">{s.l}</div></div>
          ))}
        </div>

        {groups.length===0 ? (
          <div className="empty"><div className="empty-ico">👥</div><div className="empty-ttl">Aucun groupe inscrit</div><div className="empty-sub">Les étudiants s'inscrivent depuis leur espace.</div></div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:9}}>
            {groups.map(g=>(
              <div key={g.id} className="card" style={{padding:'14px 16px'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,var(--blue),var(--violet))',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Space Grotesk',fontWeight:700,fontSize:12,color:'#fff',flexShrink:0}}>
                    {ini(g.creator_name)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                      <span className="sg" style={{fontWeight:600,fontSize:14}}>{g.name}</span>
                      {g.link_url?<span className="badge done">✓ Déposé</span>:<span className="badge pending">En attente</span>}
                    </div>
                    <div style={{display:'flex',gap:6,marginBottom:g.link_url?8:0,flexWrap:'wrap'}}>
                      {g.members?.map(m=>(
                        <div key={m.id} style={{display:'flex',alignItems:'center',gap:5,background:'var(--s2)',border:'1px solid var(--br)',borderRadius:20,padding:'3px 9px'}}>
                          <div style={{width:18,height:18,borderRadius:'50%',background:'linear-gradient(135deg,var(--blue),var(--violet))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontFamily:'Space Grotesk',fontWeight:700,color:'#fff'}}>{ini(m.full_name)}</div>
                          <span style={{fontSize:11.5}}>{m.full_name}</span>
                        </div>
                      ))}
                    </div>
                    {g.link_url&&(
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <span style={{fontSize:13}}>{LINK_ICON[g.link_type]||'🔗'}</span>
                        <a href={g.link_url} target="_blank" rel="noreferrer" style={{fontSize:12.5,color:'var(--blue)',textDecoration:'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:380}}>
                          {g.link_url}
                        </a>
                        {fmtDate(g.submitted_at)&&<span style={{fontSize:11,color:'var(--muted)',flexShrink:0}}>· {fmtDate(g.submitted_at)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>)}
    </div>
  </>);
}
