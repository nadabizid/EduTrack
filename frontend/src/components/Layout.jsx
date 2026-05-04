import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const ini = n => n?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';
const ago = d => {
  const s = Math.floor((Date.now()-new Date(d))/1000);
  if(s<60) return 'À l\'instant';
  if(s<3600) return `${Math.floor(s/60)} min`;
  if(s<86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}j`;
};
const NOTIF_ICONS = { new_project:{e:'🎯',bg:'rgba(64,128,255,.12)'}, slot_assigned:{e:'📅',bg:'rgba(16,185,129,.12)'}, group_invite:{e:'👥',bg:'rgba(139,92,246,.12)'} };

// ── Sidebar ──────────────────────────────────────────────────
export function Sidebar() {
  const { user, logout, unread } = useAuth();
  const navigate = useNavigate();
  const isT = user?.role === 'teacher';
  const filClass = { 'ING-A1':'blue','ING-A2':'green','ING-A3':'amber' }[user?.filiere||''] || 'blue';

  const L = ({to,children}) => (
    <NavLink to={to} className={({isActive})=>`sb-link${isActive?' active':''}`}>{children}</NavLink>
  );

  return (
    <nav className="sidebar">
      <div className="sb-logo">
        <div className="sb-mark">ET</div>
        <div><div className="sb-brand">EduTrack</div><div className="sb-sub">ISSAT Sousse</div></div>
      </div>

      <div className="sb-nav">
        <L to="/dashboard"><I d="M3 3h6v6H3zM9 3h6v6H9zM3 9h6v6H3zM9 9h6v6H9z" fill/>Tableau de bord</L>

        {isT ? (<>
          <div className="sb-section">Gestion</div>
          <L to="/teacher/projects"><I d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>Mes projets</L>
          <L to="/teacher/planning"><I d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>Planning soutenances</L>
          <L to="/teacher/groups"><I d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>Groupes & dépôts</L>
        </>) : (<>
          <div className="sb-section">Académique</div>
          <L to="/student/projects">
            <I d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
            Projets
            {unread>0&&<span className="sb-badge">{unread}</span>}
          </L>
          <L to="/student/groups"><I d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>Liste des groupes</L>
          <L to="/student/soutenance"><I d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>Ma soutenance</L>
          <div className="sb-section">Campus</div>
          <L to="/student/schedule"><I d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>Emploi du temps</L>
          <L to="/student/news"><I d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9"/>Actualités</L>
        </>)}
      </div>

      <div className="sb-user" onClick={()=>{logout();navigate('/login')}} title="Se déconnecter">
        <div className={`av ${filClass}`}>{ini(user?.full_name)}</div>
        <div style={{flex:1,minWidth:0}}>
          <div className="av-name">{user?.full_name}</div>
          <div className="av-sub">{isT ? 'Enseignant' : user?.filiere}</div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{opacity:.35,flexShrink:0}}>
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
      </div>
    </nav>
  );
}

// ── Topbar ────────────────────────────────────────────────────
export function Topbar({ title, actions, sub }) {
  const { notifs, unread, markAllRead } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown',h);
    return ()=>document.removeEventListener('mousedown',h);
  },[]);
  return (
    <div className="topbar">
      <div>
        <div className="tb-title">{title}</div>
        {sub&&<div style={{fontSize:11.5,color:'var(--muted)',marginTop:1}}>{sub}</div>}
      </div>
      <div className="tb-right">
        {actions}
        <div className="bell-wrap" ref={ref}>
          <button className="btn icon ghost" onClick={()=>{setOpen(o=>!o);if(!open)markAllRead();}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </button>
          {unread>0&&<div className="bell-dot"/>}
          {open&&(
            <div className="notif-panel">
              <div className="notif-head">
                <span className="sg" style={{fontSize:12.5,fontWeight:600}}>Notifications</span>
                <span style={{fontSize:10.5,color:'var(--muted)',cursor:'pointer'}} onClick={markAllRead}>Tout lire</span>
              </div>
              {notifs.length===0&&<div style={{padding:'18px',textAlign:'center',color:'var(--muted)',fontSize:12.5}}>Aucune notification</div>}
              {notifs.slice(0,8).map(n=>{
                const ic = NOTIF_ICONS[n.type]||{e:'🔔',bg:'rgba(245,158,11,.1)'};
                return (
                  <div key={n.id} className={`ni${!n.is_read?' unread':''}`}>
                    <div className="ni-icon" style={{background:ic.bg}}>{ic.e}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:n.is_read?400:600,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.title}</div>
                      <div style={{fontSize:11,color:'var(--muted)',lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{n.body}</div>
                      <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>{ago(n.created_at)}</div>
                    </div>
                    {!n.is_read&&<div style={{width:5,height:5,borderRadius:'50%',background:'var(--blue)',flexShrink:0,marginTop:5}}/>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Tiny SVG icon helper
const I = ({d,fill}) => (
  <svg className="sb-icon" viewBox="0 0 24 24" fill={fill?'currentColor':'none'} stroke={fill?'none':'currentColor'} strokeWidth="1.8">
    <path d={d} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
