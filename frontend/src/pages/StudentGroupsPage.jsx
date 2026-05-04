import { useState, useEffect } from 'react';
import { Topbar } from '../components/Layout';
import { toast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';

const ini = n => n?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';
const LINK_ICON = {github:'⬡',drive:'📁',figma:'🎨',other:'🔗'};
const AV_COLORS = [
  'linear-gradient(135deg,#4080ff,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#f97316)',
  'linear-gradient(135deg,#ef4444,#ec4899)',
  'linear-gradient(135deg,#8b5cf6,#06b6d4)',
];

export default function StudentGroupsPage() {
  const { user } = useAuth();
  const [projects,  setProjects]  = useState([]);
  const [selId,     setSelId]     = useState('');
  const [groups,    setGroups]    = useState([]);
  const [myGrpId,   setMyGrpId]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [inviting,  setInviting]  = useState(false);
  const [invEmail,  setInvEmail]  = useState('');

  useEffect(()=>{
    api.get('/projects').then(r=>{
      const open = r.data.filter(p=>p.status==='open');
      setProjects(open);
      if(!selId&&open.length) setSelId(String(open[0].id));
    });
  },[]);

  useEffect(()=>{
    if(!selId) return;
    setLoading(true);
    Promise.all([
      api.get(`/groups/project/${selId}`),
      api.get(`/groups/mine/${selId}`),
    ]).then(([gRes,mRes])=>{
      setGroups(gRes.data);
      setMyGrpId(mRes.data?.id||null);
    }).finally(()=>setLoading(false));
  },[selId]);

  const handleInvite = async (grpId) => {
    if (!invEmail.trim()) return;
    setInviting(true);
    try {
      await api.post(`/groups/${grpId}/invite`,{email:invEmail.trim()});
      toast(`${invEmail} ajouté !`);
      setInvEmail('');
      const { data } = await api.get(`/groups/project/${selId}`);
      setGroups(data);
    } catch(err){ toast(err.response?.data?.error||'Erreur','error'); }
    finally { setInviting(false); }
  };

  const currProj = projects.find(p=>String(p.id)===selId);

  return (<>
    <Topbar title="Liste des groupes" sub={currProj?`${currProj.title} · ${currProj.filiere}`:''}/>
    <div className="content">
      {/* Project selector */}
      <div style={{display:'flex',gap:10,marginBottom:18,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{fontSize:12.5,color:'var(--muted)',flexShrink:0}}>Projet :</span>
        <select value={selId} onChange={e=>setSelId(e.target.value)} style={{maxWidth:360}}>
          {projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        {currProj&&(
          <span style={{fontSize:12,color:'var(--muted)'}}>
            · {groups.length} groupe{groups.length!==1?'s':''} · max {currProj.max_group_size} membres
          </span>
        )}
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> : (
        groups.length===0 ? (
          <div className="empty">
            <div className="empty-ico">👥</div>
            <div className="empty-ttl">Aucun groupe formé</div>
            <div className="empty-sub">Soyez le premier à créer un groupe pour ce projet !</div>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
            {groups.map((g,gi)=>{
              const isMyGrp = g.id===myGrpId;
              const isMember = g.members?.some(m=>m.id===user?.id);
              const isFull   = g.members?.length>=(currProj?.max_group_size||3);

              return (
                <div key={g.id} className="card" style={{
                  padding:'16px 18px',
                  borderColor: isMyGrp?'rgba(16,185,129,.25)':'var(--br)',
                  background: isMyGrp?'rgba(16,185,129,.03)':'var(--s1)',
                }}>
                  {/* Header */}
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <div style={{
                      width:40,height:40,borderRadius:11,flexShrink:0,
                      background:AV_COLORS[gi%AV_COLORS.length],
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontFamily:'Space Grotesk',fontWeight:800,fontSize:14,color:'#fff',
                    }}>{String(gi+1).padStart(2,'0')}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="sg" style={{fontWeight:700,fontSize:14,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.name}</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {isMyGrp&&<span className="badge done">Mon groupe</span>}
                        {g.link_url?<span className="badge done">✓ Déposé</span>:<span className="badge pending">En attente</span>}
                        <span style={{fontSize:10.5,color:isFull?'var(--red)':'var(--muted)'}}>
                          {g.members?.length||0}/{currProj?.max_group_size||3}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Members */}
                  <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
                    {g.members?.map((m,mi)=>(
                      <div key={m.id} style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{
                          width:26,height:26,borderRadius:'50%',flexShrink:0,
                          background:AV_COLORS[(gi+mi)%AV_COLORS.length],
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontFamily:'Space Grotesk',fontWeight:700,fontSize:9,color:'#fff',
                        }}>{ini(m.full_name)}</div>
                        <span style={{fontSize:12.5,color:m.id===user?.id?'var(--text)':'var(--muted2)',fontWeight:m.id===user?.id?500:400}}>
                          {m.full_name}{m.id===user?.id?' (vous)':''}
                        </span>
                      </div>
                    ))}
                    {/* Empty slots */}
                    {Array.from({length:(currProj?.max_group_size||3)-(g.members?.length||0)}).map((_,i)=>(
                      <div key={`empty-${i}`} style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:26,height:26,borderRadius:'50%',border:'1.5px dashed var(--br2)',background:'transparent'}}/>
                        <span style={{fontSize:12,color:'var(--muted)',fontStyle:'italic'}}>Place disponible</span>
                      </div>
                    ))}
                  </div>

                  {/* Link */}
                  {g.link_url&&(
                    <div style={{borderTop:'1px solid var(--br)',paddingTop:10,marginBottom:10}}>
                      <a href={g.link_url} target="_blank" rel="noreferrer"
                        style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--blue)',textDecoration:'none'}}>
                        <span>{LINK_ICON[g.link_type]||'🔗'}</span>
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {g.link_url.replace(/^https?:\/\//,'')}
                        </span>
                      </a>
                    </div>
                  )}

                  {/* Invite if my group and not full */}
                  {isMyGrp&&!isFull&&(
                    <div style={{borderTop:'1px solid var(--br)',paddingTop:10}}>
                      <div style={{fontSize:10.5,color:'var(--muted)',fontFamily:'Space Grotesk',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:7}}>Inviter un camarade</div>
                      <div style={{display:'flex',gap:7}}>
                        <input type="email" placeholder="email@issat.tn" value={invEmail}
                          onChange={e=>setInvEmail(e.target.value)}
                          onKeyDown={e=>e.key==='Enter'&&handleInvite(g.id)}
                          style={{flex:1,fontSize:12}}/>
                        <button className="btn sm primary" disabled={inviting} onClick={()=>handleInvite(g.id)}>
                          {inviting?'…':'Inviter'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  </>);
}
