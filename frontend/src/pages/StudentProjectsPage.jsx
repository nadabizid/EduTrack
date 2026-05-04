import { useState, useEffect } from 'react';
import { Topbar } from '../components/Layout';
import { toast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const daysLeft = d => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;
const LINK_TYPES = [{v:'github',l:'GitHub',i:'⬡'},{v:'drive',l:'Google Drive',i:'📁'},{v:'figma',l:'Figma',i:'🎨'},{v:'other',l:'Autre',i:'🔗'}];
const detectType = u => u.includes('github.com')?'github':u.includes('drive.google')?'drive':u.includes('figma.com')?'figma':'other';

function RegisterModal({ project, onClose, onDone }) {
  const [name,   setName]   = useState('');
  const [emails, setEmails] = useState(['','']);
  const [busy,   setBusy]   = useState(false);

  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const me = emails.filter(e=>e.trim());
      const { data } = await api.post('/groups',{ project_id:project.id, name:name||undefined, member_emails:me });
      if (data.invite_results?.length) {
        const fails = data.invite_results.filter(r=>r.error);
        if (fails.length) toast(`${fails.length} invitation(s) échouée(s) : ${fails.map(f=>f.email).join(', ')}`, 'info');
      }
      toast('Groupe créé !');
      onDone(data.group);
      onClose();
    } catch(err){ toast(err.response?.data?.error||'Erreur','error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">S'inscrire au projet</div>
        <div style={{background:'var(--s2)',borderRadius:9,padding:'11px 13px',marginBottom:16}}>
          <div className="sg" style={{fontWeight:600,marginBottom:2}}>{project.title}</div>
          <div style={{fontSize:12,color:'var(--muted)'}}>
            {project.teacher_name} · Max {project.max_group_size} membres
            {project.allow_solo&&' · Monôme autorisé'}
          </div>
        </div>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:13}}>
          <div className="field"><label>Nom du groupe (optionnel)</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Les Innovateurs"/>
          </div>
          <div>
            <div style={{fontSize:10.5,color:'var(--muted)',fontFamily:'Space Grotesk',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>
              Inviter des camarades (max {project.max_group_size-1})
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {emails.map((em,i)=>(
                <div key={i} style={{display:'flex',gap:7}}>
                  <input type="email" value={em} placeholder={`camarade${i+1}@issat.tn`}
                    onChange={e=>{const n=[...emails];n[i]=e.target.value;setEmails(n);}}/>
                  {emails.length>1&&<button type="button" className="btn sm danger" onClick={()=>setEmails(emails.filter((_,j)=>j!==i))}>✕</button>}
                </div>
              ))}
              {emails.length < project.max_group_size-1&&(
                <button type="button" className="btn sm ghost" onClick={()=>setEmails([...emails,''])}>+ Ajouter</button>
              )}
            </div>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:7}}>💡 Vous pouvez aussi inviter des membres plus tard depuis "Liste des groupes".</div>
          </div>
          <div style={{display:'flex',gap:9,marginTop:4}}>
            <button type="button" className="btn" style={{flex:1,justifyContent:'center'}} onClick={onClose}>Annuler</button>
            <button type="submit" className="btn primary" style={{flex:2,justifyContent:'center'}} disabled={busy}>
              {busy?'Création…':'✓ Créer mon groupe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubmitLinkModal({ group, onClose, onDone }) {
  const [url,  setUrl]  = useState(group.link_url||'');
  const [type, setType] = useState(group.link_type||'github');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const { data } = await api.patch(`/groups/${group.id}/submit`,{link_url:url,link_type:type});
      toast('Lien déposé !'); onDone(data); onClose();
    } catch(err){ toast(err.response?.data?.error||'Erreur','error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Déposer le lien du projet</div>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="field"><label>Type de lien</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
              {LINK_TYPES.map(t=>(
                <button key={t.v} type="button" onClick={()=>setType(t.v)} style={{
                  padding:'9px 11px',borderRadius:9,cursor:'pointer',transition:'all .12s',
                  border:`1px solid ${type===t.v?'var(--blue)':'var(--br)'}`,
                  background:type===t.v?'rgba(64,128,255,.08)':'var(--s2)',
                  color:type===t.v?'var(--blue)':'var(--muted2)',
                  display:'flex',alignItems:'center',gap:7,fontSize:12.5,fontWeight:500,
                }}>
                  <span>{t.i}</span>{t.l}
                </button>
              ))}
            </div>
          </div>
          <div className="field"><label>URL *</label>
            <input type="url" required value={url} placeholder="https://github.com/…"
              onChange={e=>{setUrl(e.target.value);setType(detectType(e.target.value));}}/>
          </div>
          <div style={{display:'flex',gap:9}}>
            <button type="button" className="btn" style={{flex:1,justifyContent:'center'}} onClick={onClose}>Annuler</button>
            <button type="submit" className="btn primary" style={{flex:2,justifyContent:'center'}} disabled={busy}>
              {busy?'Dépôt…':'📤 Déposer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentProjectsPage() {
  const { user, fetchNotifs } = useAuth();
  const [projects,  setProjects]  = useState([]);
  const [myGroups,  setMyGroups]  = useState({});
  const [loading,   setLoading]   = useState(true);
  const [regModal,  setRegModal]  = useState(null);
  const [linkModal, setLinkModal] = useState(null);

  const load = async () => {
    const { data } = await api.get('/projects');
    setProjects(data);
    const map = {};
    for (const p of data) {
      if (p.my_group_id) {
        try {
          const { data: g } = await api.get(`/groups/mine/${p.id}`);
          if (g) map[p.id] = g;
        } catch {}
      }
    }
    setMyGroups(map);
  };

  useEffect(()=>{ load().finally(()=>setLoading(false)); },[]);

  const handleRegistered = (projId, grp) => {
    setMyGroups(m=>({...m,[projId]:grp}));
    setProjects(ps=>ps.map(p=>p.id===projId?{...p,my_group_id:grp.id}:p));
    fetchNotifs();
  };

  const FIL_BADGE = {'ING-A1':'inga1','ING-A2':'inga2','ING-A3':'inga3'};

  return (<>
    <Topbar title="Projets disponibles" sub={`Filière ${user?.filiere}`}/>
    <div className="content">
      {loading ? <div className="loading"><div className="spinner"/></div> : (
        projects.length===0 ? (
          <div className="empty">
            <div className="empty-ico">🎯</div>
            <div className="empty-ttl">Aucun projet disponible</div>
            <div className="empty-sub">Votre enseignant n'a pas encore publié de projet pour la filière {user?.filiere}.</div>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {projects.map(p=>{
              const days  = daysLeft(p.deadline);
              const myGrp = myGroups[p.id];
              const late  = days!==null&&days<=0;
              return (
                <div key={p.id} className="card" style={{
                  padding:'16px 18px',
                  borderLeft:`3px solid ${myGrp?'var(--green)':p.status==='open'?'var(--blue)':'var(--br)'}`,
                }}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{width:42,height:42,borderRadius:11,flexShrink:0,background:'var(--s3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                      {p.type==='pfe'?'🎓':'📋'}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',gap:7,marginBottom:6,flexWrap:'wrap',alignItems:'center'}}>
                        <span className={`badge ${FIL_BADGE[p.filiere]||'open'}`}>{p.filiere}</span>
                        <span className={`badge ${p.type==='pfe'?'pfe':'mini'}`}>{p.type==='pfe'?'PFE':'Mini-Projet'}</span>
                        <span className={`badge ${p.status}`}>{p.status==='open'?'Ouvert':'Fermé'}</span>
                        {myGrp&&<span className="badge done">✓ Inscrit</span>}
                      </div>
                      <div className="sg" style={{fontWeight:700,fontSize:15,marginBottom:4}}>{p.title}</div>
                      <div style={{fontSize:12.5,color:'var(--muted)',marginBottom:8}}>👨‍🏫 {p.teacher_name} · 👥 max {p.max_group_size} membres{p.allow_solo?' · monôme OK':''}</div>

                      {p.deadline&&(
                        <div style={{
                          display:'inline-flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:7,marginBottom:10,fontSize:12.5,
                          background:late?'rgba(239,68,68,.07)':days<=5?'rgba(245,158,11,.07)':'var(--s2)',
                          border:`1px solid ${late?'rgba(239,68,68,.2)':days<=5?'rgba(245,158,11,.2)':'var(--br)'}`,
                          color:late?'var(--red)':days<=5?'var(--amber)':'var(--muted2)',
                        }}>
                          {late?'🔴':days<=5?'🟡':'📅'}
                          {late?'Deadline dépassée':`Deadline : ${fmtDate(p.deadline)}${days!==null&&!late?` (${days}j restants)`:''}`}
                        </div>
                      )}

                      {/* My group */}
                      {myGrp&&(
                        <div style={{background:'rgba(16,185,129,.05)',border:'1px solid rgba(16,185,129,.15)',borderRadius:9,padding:'10px 12px',marginBottom:10}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                            <span className="sg" style={{fontSize:13,fontWeight:600,color:'var(--green)'}}>✓ {myGrp.name}</span>
                            {myGrp.link_url?<span className="badge done">Lien déposé</span>:<span className="badge pending">Lien manquant</span>}
                          </div>
                          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                            {myGrp.members?.map(m=>(
                              <span key={m.id} style={{fontSize:11.5,background:'var(--s3)',padding:'2px 8px',borderRadius:20,color:'var(--muted2)'}}>{m.full_name}</span>
                            ))}
                          </div>
                          {myGrp.link_url&&(
                            <a href={myGrp.link_url} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:5,marginTop:6,fontSize:12,color:'var(--blue)',textDecoration:'none'}}>
                              🔗 {myGrp.link_url.length>60?myGrp.link_url.slice(0,60)+'…':myGrp.link_url}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {!myGrp&&p.status==='open'&&!late&&(
                          <button className="btn primary" onClick={()=>setRegModal(p)}>👥 S'inscrire / Créer un groupe</button>
                        )}
                        {myGrp&&!myGrp.link_url&&!late&&(
                          <button className="btn primary" onClick={()=>setLinkModal({grp:myGrp,projId:p.id})}>📤 Déposer le lien</button>
                        )}
                        {myGrp&&myGrp.link_url&&(
                          <button className="btn" onClick={()=>setLinkModal({grp:myGrp,projId:p.id})}>✏️ Modifier le lien</button>
                        )}
                        {late&&!myGrp&&<span style={{fontSize:12.5,color:'var(--red)',padding:'7px 0'}}>⛔ Inscriptions fermées</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>

    {regModal&&<RegisterModal project={regModal} onClose={()=>setRegModal(null)} onDone={g=>handleRegistered(regModal.id,g)}/>}
    {linkModal&&<SubmitLinkModal group={linkModal.grp} onClose={()=>setLinkModal(null)} onDone={updated=>setMyGroups(m=>({...m,[linkModal.projId]:updated}))}/>}
  </>);
}
