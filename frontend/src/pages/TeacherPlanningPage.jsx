import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Topbar } from '../components/Layout';
import { toast } from '../components/Toast';
import api from '../api/client';

const fmtT = t => t?.slice(0,5)||'';
const fmtD = d => d ? new Date(d+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}) : '';

export default function TeacherPlanningPage() {
  const [sp]       = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [selId,    setSelId]    = useState(sp.get('p')||'');
  const [project,  setProject]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState('avail');
  const [avails,   setAvails]   = useState([{avail_date:'',start_time:'08:00',end_time:'17:00'}]);
  const [gen,      setGen]      = useState({duration_minutes:20,format:'presentiel',room:'',meet_link_base:''});
  const [generating,setGenerating]=useState(false);
  const [manual,   setManual]   = useState({group_id:'',slot_date:'',start_time:'',end_time:'',format:'presentiel',room:'',meet_link:''});
  const [addingM,  setAddingM]  = useState(false);

  useEffect(()=>{
    api.get('/projects').then(r=>{
      setProjects(r.data);
      if(!selId&&r.data.length) setSelId(String(r.data[0].id));
    });
  },[]);

  useEffect(()=>{
    if(!selId) return;
    setLoading(true);
    api.get(`/projects/${selId}`).then(r=>{
      setProject(r.data);
      if(r.data.availability?.length){
        setAvails(r.data.availability.map(a=>({
          avail_date:a.avail_date?.slice(0,10),
          start_time:fmtT(a.start_time),
          end_time:fmtT(a.end_time)
        })));
      }
    }).finally(()=>setLoading(false));
  },[selId]);

  const saveAvail = async () => {
    const valid = avails.filter(a=>a.avail_date&&a.start_time&&a.end_time);
    if(!valid.length) return toast('Ajoutez au moins une disponibilité','error');
    try { await api.post(`/projects/${selId}/availability`,{slots:valid}); toast('Disponibilités enregistrées'); }
    catch(e){ toast(e.response?.data?.error||'Erreur','error'); }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/soutenances/generate',{project_id:parseInt(selId),...gen});
      toast(`✓ ${data.generated} créneaux générés !`);
      const r = await api.get(`/projects/${selId}`);
      setProject(r.data); setTab('slots');
    } catch(e){ toast(e.response?.data?.error||'Erreur','error'); }
    finally { setGenerating(false); }
  };

  const addManual = async () => {
    setAddingM(true);
    try {
      await api.post('/soutenances/manual',{project_id:parseInt(selId),...manual,group_id:manual.group_id||null});
      toast('Créneau ajouté');
      const r = await api.get(`/projects/${selId}`); setProject(r.data);
      setManual({group_id:'',slot_date:'',start_time:'',end_time:'',format:'presentiel',room:'',meet_link:''});
    } catch(e){ toast(e.response?.data?.error||'Erreur','error'); }
    finally { setAddingM(false); }
  };

  const delSlot = async id => {
    try {
      await api.delete(`/soutenances/${id}`);
      setProject(p=>({...p,slots:p.slots.filter(s=>s.id!==id)}));
      toast('Créneau supprimé');
    } catch { toast('Erreur','error'); }
  };

  const slots  = project?.slots||[];
  const groups = project?.groups||[];

  return (<>
    <Topbar title="Planning des soutenances"/>
    <div className="content">
      <div style={{display:'flex',gap:10,marginBottom:18,alignItems:'center'}}>
        <span style={{fontSize:12.5,color:'var(--muted)',flexShrink:0}}>Projet :</span>
        <select value={selId} onChange={e=>setSelId(e.target.value)} style={{maxWidth:340}}>
          {projects.map(p=><option key={p.id} value={p.id}>{p.title} ({p.filiere})</option>)}
        </select>
      </div>

      {loading ? <div className="loading"><div className="spinner"/></div> : !project ? (
        <div className="empty"><div className="empty-ico">📅</div><div className="empty-ttl">Sélectionnez un projet</div></div>
      ) : (<>
        {/* Info bar */}
        <div className="card" style={{padding:'12px 16px',marginBottom:16,display:'flex',gap:20,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:13,fontWeight:600}}>{project.title}</span>
          <span className={`badge ${{'ING-A1':'inga1','ING-A2':'inga2','ING-A3':'inga3'}[project.filiere]}`}>{project.filiere}</span>
          <span style={{fontSize:12,color:'var(--muted)'}}>👥 {groups.length} groupe{groups.length!==1?'s':''}</span>
          <span style={{fontSize:12,color:slots.length>=groups.length&&groups.length>0?'var(--green)':'var(--amber)'}}>
            📅 {slots.length}/{groups.length} planifiés
          </span>
        </div>

        <div className="tabs">
          {[['avail','📋 Disponibilités'],['gen','🤖 Génération auto'],['manual','✏️ Manuel'],[`slots`,`📅 Créneaux (${slots.length})`]].map(([k,l])=>(
            <button key={k} className={`tab${tab===k?' active':''}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>

        {/* Availability */}
        {tab==='avail'&&(
          <div className="card">
            <div className="card-title">
              Mes disponibilités
              <button className="btn sm" onClick={()=>setAvails([...avails,{avail_date:'',start_time:'08:00',end_time:'17:00'}])}>+ Ajouter</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
              {avails.map((a,i)=>(
                <div key={i} style={{display:'flex',gap:9,alignItems:'flex-end',background:'var(--s2)',padding:'11px',borderRadius:9,border:'1px solid var(--br)'}}>
                  <div className="field" style={{flex:2}}><label>Date</label>
                    <input type="date" value={a.avail_date} onChange={e=>{const n=[...avails];n[i]={...n[i],avail_date:e.target.value};setAvails(n);}}/>
                  </div>
                  <div className="field" style={{flex:1}}><label>Début</label>
                    <input type="time" value={a.start_time} onChange={e=>{const n=[...avails];n[i]={...n[i],start_time:e.target.value};setAvails(n);}}/>
                  </div>
                  <div className="field" style={{flex:1}}><label>Fin</label>
                    <input type="time" value={a.end_time} onChange={e=>{const n=[...avails];n[i]={...n[i],end_time:e.target.value};setAvails(n);}}/>
                  </div>
                  <button className="btn sm danger" style={{flexShrink:0}} onClick={()=>setAvails(avails.filter((_,j)=>j!==i))}>✕</button>
                </div>
              ))}
            </div>
            <button className="btn primary" onClick={saveAvail}>💾 Enregistrer</button>
          </div>
        )}

        {/* Generate */}
        {tab==='gen'&&(
          <div className="card">
            <div className="card-title">Génération automatique du planning</div>
            <div style={{background:'rgba(64,128,255,.05)',border:'1px solid rgba(64,128,255,.15)',borderRadius:9,padding:'11px 13px',marginBottom:16,fontSize:12.5,color:'var(--muted2)',lineHeight:1.6}}>
              🤖 L'algorithme répartit automatiquement les <strong style={{color:'var(--text)'}}>{groups.length} groupes</strong> sur vos disponibilités selon la durée choisie, sans aucun conflit.
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:13,maxWidth:420}}>
              <div className="field"><label>Durée par soutenance (min)</label>
                <input type="number" min="10" max="120" value={gen.duration_minutes} onChange={e=>setGen({...gen,duration_minutes:parseInt(e.target.value)})}/>
              </div>
              <div className="field"><label>Format</label>
                <select value={gen.format} onChange={e=>setGen({...gen,format:e.target.value})}>
                  <option value="presentiel">Présentiel (salle)</option>
                  <option value="meet">Google Meet</option>
                </select>
              </div>
              {gen.format==='presentiel'
                ? <div className="field"><label>Numéro de salle</label><input placeholder="Ex: B-12, Amphi A" value={gen.room} onChange={e=>setGen({...gen,room:e.target.value})}/></div>
                : <div className="field"><label>Base lien Meet</label><input placeholder="https://meet.google.com/xxx" value={gen.meet_link_base} onChange={e=>setGen({...gen,meet_link_base:e.target.value})}/></div>}
            </div>
            <div style={{marginTop:16,display:'flex',gap:10,alignItems:'center'}}>
              <button className="btn primary" onClick={generate} disabled={generating||!groups.length}>
                {generating?'⏳ Génération…':`🚀 Générer (${groups.length} groupes)`}
              </button>
              {slots.length>0&&<span style={{fontSize:11.5,color:'var(--amber)'}}>⚠ Remplace les {slots.length} créneaux existants</span>}
            </div>
          </div>
        )}

        {/* Manual */}
        {tab==='manual'&&(
          <div className="card">
            <div className="card-title">Ajouter un créneau manuellement</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11,maxWidth:560}}>
              <div className="field" style={{gridColumn:'1/-1'}}><label>Groupe (optionnel)</label>
                <select value={manual.group_id} onChange={e=>setManual({...manual,group_id:e.target.value})}>
                  <option value="">— Non assigné —</option>
                  {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Date *</label><input type="date" value={manual.slot_date} onChange={e=>setManual({...manual,slot_date:e.target.value})}/></div>
              <div className="field"><label>Format</label>
                <select value={manual.format} onChange={e=>setManual({...manual,format:e.target.value})}>
                  <option value="presentiel">Présentiel</option>
                  <option value="meet">Google Meet</option>
                </select>
              </div>
              <div className="field"><label>Heure début *</label><input type="time" value={manual.start_time} onChange={e=>setManual({...manual,start_time:e.target.value})}/></div>
              <div className="field"><label>Heure fin *</label><input type="time" value={manual.end_time} onChange={e=>setManual({...manual,end_time:e.target.value})}/></div>
              {manual.format==='presentiel'
                ? <div className="field" style={{gridColumn:'1/-1'}}><label>Salle</label><input placeholder="B-12" value={manual.room} onChange={e=>setManual({...manual,room:e.target.value})}/></div>
                : <div className="field" style={{gridColumn:'1/-1'}}><label>Lien Meet</label><input placeholder="https://meet.google.com/…" value={manual.meet_link} onChange={e=>setManual({...manual,meet_link:e.target.value})}/></div>}
            </div>
            <button className="btn primary" style={{marginTop:13}} onClick={addManual} disabled={addingM}>
              {addingM?'Ajout…':'+ Ajouter ce créneau'}
            </button>
          </div>
        )}

        {/* Slots list */}
        {tab==='slots'&&(
          slots.length===0 ? (
            <div className="empty"><div className="empty-ico">📅</div><div className="empty-ttl">Aucun créneau planifié</div></div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {slots.map((s,i)=>(
                <div key={s.id} className={`pslot${s.format==='meet'?' meet':' assigned'}`}>
                  <div style={{width:32,height:32,borderRadius:9,background:'rgba(64,128,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Space Grotesk',fontWeight:700,fontSize:12,color:'var(--blue)',flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{s.group_name||<span style={{color:'var(--muted)'}}>Non assigné</span>}</div>
                    <div style={{fontSize:11.5,color:'var(--muted)',display:'flex',gap:12,flexWrap:'wrap'}}>
                      <span>📅 {fmtD(s.slot_date)}</span>
                      <span>🕐 {fmtT(s.start_time)}–{fmtT(s.end_time)}</span>
                      {s.format==='presentiel'?<span>🏫 Salle {s.room||'?'}</span>:<span style={{color:'var(--violet)'}}>📹 Meet</span>}
                    </div>
                    {s.meet_link&&<a href={s.meet_link} target="_blank" rel="noreferrer" style={{fontSize:10.5,color:'var(--violet)',textDecoration:'none'}}>🔗 {s.meet_link}</a>}
                  </div>
                  <span className={`badge ${s.format}`}>{s.format==='meet'?'Meet':'Présentiel'}</span>
                  <button className="btn sm ghost" style={{color:'var(--red)'}} onClick={()=>delSlot(s.id)}>✕</button>
                </div>
              ))}
            </div>
          )
        )}
      </>)}
    </div>
  </>);
}
