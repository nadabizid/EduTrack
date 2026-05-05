import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const FILIERES = ['ING-A1','ING-A2','ING-A3'];
const DEMO = [
  { label:'Enseignant', email:'karim@issat.tn', role:'teacher' },
  { label:'ING-A1', email:'ahmed@issat.tn', role:'student' },
  { label:'ING-A2', email:'nour@issat.tn', role:'student' },
  { label:'ING-A3', email:'mariem@issat.tn', role:'student' },
];
const FIL_COLOR = {'ING-A1':'var(--blue)','ING-A2':'var(--green)','ING-A3':'var(--amber)'};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email:'', password:'', full_name:'', filiere:'ING-A1', role:'student' });
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (mode==='login') {
        const u = await login(form.email, form.password);
        navigate(u.role==='teacher'?'/teacher/projects':'/student/projects');
      } else {
        const res = await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
        const data = await res.json();
        if (!res.ok) { setErr(data.error); return; }
        localStorage.setItem('token',data.token);
        localStorage.setItem('user',JSON.stringify(data.user));
        navigate('/student/projects');
      }
    } catch(er){ setErr(er.response?.data?.error||'Erreur de connexion'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      {/* Glows */}
      <div style={{position:'fixed',top:'-15%',left:'-10%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(64,128,255,0.07) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',bottom:'-15%',right:'-5%',width:420,height:420,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 70%)',pointerEvents:'none'}}/>

      <div style={{width:'100%',maxWidth:400,position:'relative'}}>
        {/* Header */}
        <div style={{textAlign:'center',marginBottom:28}}>
<img src="/logo-app.png" alt="Logo" style={{width:48,height:48,borderRadius:13,margin:'0 auto 12px',objectFit:'cover'}} />          <div style={{fontFamily:'Space Grotesk',fontWeight:800,fontSize:24,marginBottom:4}}>EduTrack</div>
          <div style={{fontSize:12.5,color:'var(--muted)'}}>ISSAT Sousse · Gestion des Projets & Soutenances</div>
        </div>

        <div className="card" style={{padding:26,border:'1px solid var(--br2)'}}>
          {/* Mode toggle */}
          <div className="tabs" style={{marginBottom:20}}>
            <button className={`tab${mode==='login'?' active':''}`} onClick={()=>setMode('login')}>Connexion</button>
            <button className={`tab${mode==='register'?' active':''}`} onClick={()=>setMode('register')}>Inscription</button>
          </div>

          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:13}}>
            {mode==='register'&&(
              <div className="field">
                <label>Nom complet</label>
                <input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="Prénom Nom" required/>
              </div>
            )}
            <div className="field">
              <label>Email universitaire</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="prenom@issat.tn" required/>
            </div>
            <div className="field">
              <label>Mot de passe</label>
              <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" required/>
            </div>
            {mode==='register'&&(
              <div className="field">
                <label>Filière</label>
                <select value={form.filiere} onChange={e=>setForm({...form,filiere:e.target.value})}>
                  {FILIERES.map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
            )}

            {err&&<div style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,padding:'8px 11px',fontSize:12.5,color:'var(--red)'}}>{err}</div>}

            <button className="btn primary" type="submit" disabled={busy}
              style={{width:'100%',justifyContent:'center',padding:'10px',fontFamily:'Space Grotesk',fontWeight:700,fontSize:13.5,marginTop:2}}>
              {busy?(mode==='login'?'Connexion…':'Inscription…'):(mode==='login'?'Se connecter →':'Créer mon compte →')}
            </button>
          </form>

          {mode==='login'&&(
            <div style={{marginTop:20,paddingTop:16,borderTop:'1px solid var(--br)'}}>
              <div style={{fontSize:9.5,color:'var(--muted)',fontFamily:'Space Grotesk',fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:9}}>Comptes démo · mot de passe: password123</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {DEMO.map(d=>(
                  <button key={d.email} className="btn" style={{justifyContent:'flex-start',padding:'7px 10px',gap:7}}
                    onClick={()=>setForm({...form,email:d.email,password:'password123'})}>
                    <span style={{fontSize:9.5,fontFamily:'Space Grotesk',fontWeight:600,color:FIL_COLOR[d.label]||'var(--violet)',textTransform:'uppercase',minWidth:46}}>{d.label}</span>
                    <span style={{fontSize:11,color:'var(--muted2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
