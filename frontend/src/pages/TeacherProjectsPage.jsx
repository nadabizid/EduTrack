import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '../components/Layout';
import { toast } from '../components/Toast';
import api from '../api/client';

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}) : '—';
const daysLeft = d => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;
const FILIERES = ['ING-A1','ING-A2','ING-A3'];
const FIL_COL  = {'ING-A1':'var(--blue)','ING-A2':'var(--green)','ING-A3':'var(--amber)'};

function NewProjectModal({ onClose, onCreate }) {
  const [f, setF] = useState({
    title:'', description:'', filiere:'ING-A1', type:'mini_project',
    deadline:'', max_group_size:3, allow_solo:false
  });
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const { data } = await api.post('/projects', f);
      onCreate(data);
      toast('Projet créé — étudiants notifiés !');
      onClose();
    } catch(err){ toast(err.response?.data?.error||'Erreur','error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Créer un nouveau projet</div>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="field"><label>Titre *</label>
            <input value={f.title} onChange={e=>setF({...f,title:e.target.value})} placeholder="Ex: Application de gestion scolaire" required/>
          </div>
          <div className="field"><label>Description</label>
            <textarea value={f.description} onChange={e=>setF({...f,description:e.target.value})} placeholder="Objectifs, livrables, contraintes techniques…"/>
          </div>
          <div className="g2">
            <div className="field"><label>Filière cible *</label>
              <select value={f.filiere} onChange={e=>setF({...f,filiere:e.target.value})}>
                {FILIERES.map(fi=><option key={fi}>{fi}</option>)}
              </select>
            </div>
            <div className="field"><label>Type</label>
              <select value={f.type} onChange={e=>setF({...f,type:e.target.value})}>
                <option value="mini_project">Mini-Projet</option>
                <option value="pfe">PFE</option>
              </select>
            </div>
          </div>
          <div className="g2">
            <div className="field"><label>Date limite dépôt</label>
              <input type="datetime-local" value={f.deadline} onChange={e=>setF({...f,deadline:e.target.value})}/>
            </div>
            <div className="field"><label>Max membres / groupe</label>
              <input type="number" min="1" max="5" value={f.max_group_size} onChange={e=>setF({...f,max_group_size:parseInt(e.target.value)})}/>
            </div>
          </div>
          <label className="checkbox-row">
            <input type="checkbox" checked={f.allow_solo} onChange={e=>setF({...f,allow_solo:e.target.checked})}/>
            Autoriser les monômes (travail seul)
          </label>
          <div style={{display:'flex',gap:9,marginTop:4}}>
            <button type="button" className="btn" style={{flex:1,justifyContent:'center'}} onClick={onClose}>Annuler</button>
            <button type="submit" className="btn primary" style={{flex:2,justifyContent:'center'}} disabled={busy}>
              {busy?'Création…':'🎯 Créer & notifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeacherProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then(r=>setProjects(r.data)).finally(()=>setLoading(false));
  },[]);

  const closeProject = async id => {
    try {
      await api.patch(`/projects/${id}`,{status:'closed'});
      setProjects(ps=>ps.map(p=>p.id===id?{...p,status:'closed'}:p));
      toast('Projet fermé aux inscriptions');
    } catch { toast('Erreur','error'); }
  };

  const FIL_BADGE = {'ING-A1':'inga1','ING-A2':'inga2','ING-A3':'inga3'};

  return (<>
    <Topbar title="Mes projets" actions={
      <button className="btn primary" onClick={()=>setModal(true)}>+ Nouveau projet</button>
    }/>
    <div className="content">
      {loading ? <div className="loading"><div className="spinner"/></div> : (<>
        <div className="g4" style={{marginBottom:22}}>
          {[
            {v:projects.length, l:'Projets créés', c:'var(--blue)'},
            {v:projects.filter(p=>p.status==='open').length, l:'Ouverts', c:'var(--green)'},
            {v:projects.reduce((a,p)=>a+parseInt(p.group_count||0),0), l:'Groupes inscrits', c:'var(--violet)'},
            {v:projects.reduce((a,p)=>a+parseInt(p.slot_count||0),0), l:'Créneaux planifiés', c:'var(--amber)'},
          ].map((s,i)=>(
            <div key={i} className="stat">
              <div className="stat-val" style={{color:s.c}}>{s.v}</div>
              <div className="stat-lbl">{s.l}</div>
            </div>
          ))}
        </div>

        {projects.length===0 ? (
          <div className="empty">
            <div className="empty-ico">📋</div>
            <div className="empty-ttl">Aucun projet créé</div>
            <div className="empty-sub">Créez votre premier projet pour notifier les étudiants de la filière concernée.</div>
            <button className="btn primary" onClick={()=>setModal(true)}>+ Créer un projet</button>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {projects.map(p=>{
              const days = daysLeft(p.deadline);
              return (
                <div key={p.id} className="card" style={{
                  borderLeft:`3px solid ${FIL_COL[p.filiere]||'var(--br)'}`,
                  padding:'16px 18px'
                }}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{
                      width:40,height:40,borderRadius:10,flexShrink:0,
                      background:'var(--s3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18
                    }}>{p.type==='pfe'?'🎓':'📋'}</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',gap:7,marginBottom:6,flexWrap:'wrap',alignItems:'center'}}>
                        <span className={`badge ${FIL_BADGE[p.filiere]||'open'}`}>{p.filiere}</span>
                        <span className={`badge ${p.type==='pfe'?'pfe':'mini'}`}>{p.type==='pfe'?'PFE':'Mini-Projet'}</span>
                        <span className={`badge ${p.status}`}>{p.status==='open'?'Ouvert':'Fermé'}</span>
                      </div>
                      <div className="sg" style={{fontWeight:600,fontSize:15,marginBottom:4}}>{p.title}</div>
                      {p.description&&<p style={{fontSize:12.5,color:'var(--muted)',lineHeight:1.55,marginBottom:8}}>{p.description.slice(0,160)}{p.description.length>160?'…':''}</p>}
                      <div style={{display:'flex',gap:16,fontSize:12,color:'var(--muted)',flexWrap:'wrap'}}>
                        <span>👥 {p.group_count} groupe{p.group_count!==1?'s':''}</span>
                        <span>📅 {p.slot_count} créneau{p.slot_count!==1?'x':''}</span>
                        {p.deadline&&<span style={{color:days!==null&&days<=5?'var(--red)':days!==null&&days<=14?'var(--amber)':'var(--muted)'}}>
                          ⏰ {days!==null?(days<=0?'Deadline dépassée':`${days}j restants`):fmtDate(p.deadline)}
                        </span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:7,flexShrink:0,flexDirection:'column',alignItems:'flex-end'}}>
                      <div style={{display:'flex',gap:7}}>
                        <button className="btn sm" onClick={()=>navigate(`/teacher/planning?p=${p.id}`)}>📅 Planning</button>
                        <button className="btn sm" onClick={()=>navigate(`/teacher/groups?p=${p.id}`)}>👥 Groupes</button>
                      </div>
                      {p.status==='open'&&(
                        <button className="btn sm danger" onClick={()=>closeProject(p.id)}>Fermer</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>)}
    </div>
    {modal&&<NewProjectModal onClose={()=>setModal(false)} onCreate={p=>setProjects(ps=>[p,...ps])}/>}
  </>);
}
