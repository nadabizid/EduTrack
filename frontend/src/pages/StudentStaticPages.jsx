import { useState, useEffect } from 'react';
import { Topbar } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';

const fmtDate = d => d ? new Date(d+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '—';
const fmtT = t => t?.slice(0,5)||'';

// ── Soutenance ────────────────────────────────────────────────
export function StudentSoutenancePage() {
  const [projects, setProjects] = useState([]);
  const [slots,    setSlots]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(()=>{
    api.get('/projects').then(async ({ data:projs })=>{
      const enrolled = projs.filter(p=>p.my_group_id);
      setProjects(enrolled);
      const mySlots = [];
      for (const p of enrolled) {
        try {
          const { data:s } = await api.get(`/soutenances/my/${p.id}`);
          if (s) mySlots.push({...s,project:p});
        } catch {}
      }
      setSlots(mySlots);
    }).finally(()=>setLoading(false));
  },[]);

  return (<>
    <Topbar title="Ma soutenance"/>
    <div className="content">
      {loading ? <div className="loading"><div className="spinner"/></div> : (
        projects.length===0 ? (
          <div className="empty">
            <div className="empty-ico">📅</div>
            <div className="empty-ttl">Aucune soutenance planifiée</div>
            <div className="empty-sub">Inscrivez-vous à un projet pour voir votre créneau ici dès qu'il sera assigné.</div>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:680}}>
            {projects.map(p=>{
              const slot = slots.find(s=>s.project?.id===p.id);
              return (
                <div key={p.id} className="card" style={{borderColor:slot?'rgba(16,185,129,.2)':'var(--br)'}}>
                  <div style={{fontSize:12,color:'var(--muted)',marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                    <span>{p.type==='pfe'?'🎓':'📋'}</span> {p.title}
                  </div>
                  {slot ? (
                    <div>
                      <div style={{
                        background:slot.format==='meet'?'rgba(139,92,246,.06)':'rgba(64,128,255,.06)',
                        border:`1px solid ${slot.format==='meet'?'rgba(139,92,246,.2)':'rgba(64,128,255,.2)'}`,
                        borderRadius:11,padding:'16px 18px',marginBottom:11,
                      }}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                          <div style={{
                            width:40,height:40,borderRadius:11,
                            background:slot.format==='meet'?'rgba(139,92,246,.14)':'rgba(64,128,255,.14)',
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,
                          }}>{slot.format==='meet'?'📹':'🏫'}</div>
                          <div>
                            <div className="sg" style={{fontWeight:700,fontSize:15}}>{slot.group_name}</div>
                            <span className={`badge ${slot.format}`}>{slot.format==='meet'?'Google Meet':'Présentiel'}</span>
                          </div>
                        </div>
                        <div className="g2">
                          <InfoBox label="Date" value={fmtDate(slot.slot_date)}/>
                          <InfoBox label="Horaire" value={`${fmtT(slot.start_time)} – ${fmtT(slot.end_time)}`}/>
                          {slot.format==='presentiel'&&slot.room&&<InfoBox label="Salle" value={`🏫 ${slot.room}`}/>}
                          {slot.format==='meet'&&slot.meet_link&&(
                            <div style={{background:'var(--s1)',borderRadius:9,padding:'10px 12px',gridColumn:'1/-1'}}>
                              <div style={{fontSize:9.5,color:'var(--muted)',fontFamily:'Space Grotesk',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>Lien Google Meet</div>
                              <a href={slot.meet_link} target="_blank" rel="noreferrer"
                                style={{color:'var(--violet)',fontSize:13,fontWeight:500,textDecoration:'none',display:'flex',alignItems:'center',gap:5}}>
                                📹 Rejoindre la réunion
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.65,background:'var(--s2)',borderRadius:8,padding:'9px 12px'}}>
                        💡 Soyez présent <strong style={{color:'var(--text)'}}>10 minutes avant</strong>.{' '}
                        {slot.format==='meet'?'Testez votre micro et caméra à l\'avance.':'Présentez-vous à la salle indiquée avec votre matériel prêt.'}
                      </div>
                    </div>
                  ) : (
                    <div style={{background:'rgba(245,158,11,.05)',border:'1px solid rgba(245,158,11,.15)',borderRadius:9,padding:'12px 14px',display:'flex',gap:9,alignItems:'center',fontSize:12.5,color:'var(--amber)'}}>
                      <span style={{fontSize:18}}>⏳</span>
                      <div>
                        <strong>En attente de planification</strong>
                        <div style={{fontSize:11.5,color:'var(--muted)',marginTop:1}}>
                          Vous recevrez une notification dès que votre enseignant planifiera le planning.
                        </div>
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

const InfoBox = ({label,value}) => (
  <div style={{background:'var(--s1)',borderRadius:9,padding:'10px 12px'}}>
    <div style={{fontSize:9.5,color:'var(--muted)',fontFamily:'Space Grotesk',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>{label}</div>
    <div className="sg" style={{fontWeight:600,fontSize:14}}>{value}</div>
  </div>
);

// ── Schedule ──────────────────────────────────────────────────
const SCHEDULE = {
  'ING-A1': [
    {day:0,slot:0,label:'Algorithmique avancée',room:'B-12',color:'var(--blue)'},
    {day:0,slot:2,label:'TP Algo',room:'Lab 3',color:'var(--blue)'},
    {day:1,slot:1,label:'Développement Web',room:'Lab 3',color:'var(--green)'},
    {day:1,slot:3,label:'GL Cours',room:'Amphi A',color:'var(--violet)'},
    {day:2,slot:0,label:'Bases de données',room:'C-04',color:'var(--cyan)'},
    {day:2,slot:2,label:'Mini-Projet',room:'Encadrement',color:'var(--amber)'},
    {day:3,slot:0,label:'Réseaux',room:'Amphi A',color:'var(--violet)'},
    {day:3,slot:1,label:'TP BD',room:'Lab 1',color:'var(--cyan)'},
    {day:4,slot:0,label:'Mathématiques',room:'D-08',color:'var(--muted2)'},
    {day:4,slot:2,label:'TP Réseaux',room:'Lab 2',color:'var(--violet)'},
  ],
  'ING-A2': [
    {day:0,slot:0,label:'Architecture logicielle',room:'A-01',color:'var(--blue)'},
    {day:1,slot:0,label:'IA & Machine Learning',room:'Lab 4',color:'var(--green)'},
    {day:2,slot:1,label:'Sécurité informatique',room:'B-05',color:'var(--red)'},
    {day:3,slot:0,label:'DevOps & Cloud',room:'Lab 3',color:'var(--violet)'},
    {day:4,slot:2,label:'Mini-Projet',room:'Encadrement',color:'var(--amber)'},
    {day:0,slot:3,label:'Probabilités & Stat',room:'D-12',color:'var(--muted2)'},
    {day:2,slot:3,label:'TP IA',room:'Lab 4',color:'var(--green)'},
    {day:1,slot:2,label:'TP DevOps',room:'Lab 5',color:'var(--violet)'},
  ],
  'ING-A3': [
    {day:0,slot:0,label:'Mémoire / PFE',room:'Bureau encadrant',color:'var(--amber)'},
    {day:1,slot:0,label:'Systèmes embarqués',room:'Lab Élec',color:'var(--cyan)'},
    {day:2,slot:0,label:'Traitement du signal',room:'Amphi B',color:'var(--blue)'},
    {day:3,slot:1,label:'Management de projet',room:'A-03',color:'var(--violet)'},
    {day:4,slot:0,label:'Entrepreneuriat',room:'Salle conf.',color:'var(--green)'},
    {day:0,slot:2,label:'TP Systèmes',room:'Lab Élec',color:'var(--cyan)'},
    {day:2,slot:2,label:'Recherche opérationnelle',room:'D-10',color:'var(--muted2)'},
  ],
};
const DAYS  = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
const SLOTS = ['08h00','10h00','14h00','16h00'];

export function StudentSchedulePage() {
  const { user } = useAuth();
  const classes  = SCHEDULE[user?.filiere]||SCHEDULE['ING-A1'];

  return (<>
    <Topbar title="Emploi du temps" sub={`${user?.filiere} — Semestre 2 · 2024/2025`}/>
    <div className="content">
      <div style={{overflowX:'auto'}}>
        <div style={{minWidth:640}}>
          {/* Legend */}
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            {[{c:'var(--blue)',l:'Cours magistral'},{c:'var(--green)',l:'Cours / Projet'},{c:'var(--violet)',l:'TP / Lab'},{c:'var(--amber)',l:'Projet / PFE'},{c:'var(--cyan)',l:'Spécialité'}].map(x=>(
              <div key={x.l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--muted2)'}}>
                <div style={{width:10,height:10,borderRadius:3,background:x.c,flexShrink:0}}/>
                {x.l}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{display:'grid',gridTemplateColumns:'56px repeat(5,1fr)',gap:2,borderRadius:12,overflow:'hidden',border:'1px solid var(--br)'}}>
            {/* Header */}
            <div style={{background:'var(--s2)',padding:'9px 6px'}}/>
            {DAYS.map(d=>(
              <div key={d} style={{background:'var(--s2)',padding:'9px 8px',fontFamily:'Space Grotesk',fontWeight:600,fontSize:11.5,textAlign:'center',borderBottom:'1px solid var(--br)'}}>{d}</div>
            ))}
            {/* Rows */}
            {SLOTS.map((h,si)=>(
              [
                <div key={h} style={{background:'var(--s1)',padding:'8px 4px',fontSize:10,textAlign:'center',color:'var(--muted)',borderRight:'1px solid var(--br)',minHeight:72,display:'flex',alignItems:'center',justifyContent:'center'}}>{h}</div>,
                ...DAYS.map((_,di)=>{
                  const cls = classes.find(c=>c.day===di&&c.slot===si);
                  return (
                    <div key={`${si}-${di}`} style={{background:'var(--s1)',padding:'5px 6px',minHeight:72,borderBottom:'1px solid var(--br)',borderRight:'1px solid var(--br)'}}>
                      {cls&&(
                        <div style={{
                          height:'100%',borderLeft:`2.5px solid ${cls.color}`,
                          background:`${cls.color}0d`,
                          borderRadius:'0 6px 6px 0',padding:'5px 7px',
                          display:'flex',flexDirection:'column',justifyContent:'center',
                        }}>
                          <div style={{fontSize:11,fontWeight:600,color:cls.color,lineHeight:1.3,marginBottom:2}}>{cls.label}</div>
                          <div style={{fontSize:10,color:'var(--muted)'}}>{cls.room}</div>
                        </div>
                      )}
                    </div>
                  );
                })
              ]
            ))}
          </div>
        </div>
      </div>
    </div>
  </>);
}

// ── News ──────────────────────────────────────────────────────
const NEWS = [
  {
    id:1, type:'event', emoji:'🎓',
    title:'Journée Portes Ouvertes ISSAT Sousse 2025',
    date:'15 Mai 2025', tag:'Événement',
    tagColor:'var(--blue)',
    body:'L\'ISSAT Sousse organise sa journée portes ouvertes annuelle. Venez découvrir les formations, rencontrer les enseignants et visiter les laboratoires. Programme complet disponible sur le site officiel.',
    img:null,
  },
  {
    id:2, type:'deadline', emoji:'⏰',
    title:'Rappel : Date limite dépôts Mini-Projets ING-A1',
    date:'10 Mai 2025', tag:'Important',
    tagColor:'var(--red)',
    body:'Les groupes ING-A1 doivent déposer leur lien de projet (GitHub / Drive) avant le 28 Mai 2025 à 23h59. Tout dépôt après cette date ne sera pas accepté. Contactez votre encadrant en cas de problème.',
    img:null,
  },
  {
    id:3, type:'news', emoji:'🏆',
    title:'ISSAT primé au concours national d\'innovation technologique',
    date:'5 Mai 2025', tag:'Actualité',
    tagColor:'var(--amber)',
    body:'Une équipe d\'étudiants ING-A3 a remporté le 2ème prix au concours national d\'innovation organisé par le Ministère de l\'Enseignement Supérieur. Félicitations à toute l\'équipe et à leur encadrant !',
    img:null,
  },
  {
    id:4, type:'info', emoji:'📚',
    title:'Accès aux ressources numériques — Nouveau portail',
    date:'2 Mai 2025', tag:'Information',
    tagColor:'var(--green)',
    body:'La bibliothèque universitaire met à disposition un nouveau portail de ressources numériques avec plus de 50 000 ouvrages et revues scientifiques accessibles depuis le campus et à distance avec vos identifiants ISSAT.',
    img:null,
  },
  {
    id:5, type:'event', emoji:'🎤',
    title:'Conférence : Intelligence Artificielle & Emploi — 20 Mai',
    date:'28 Avr 2025', tag:'Conférence',
    tagColor:'var(--violet)',
    body:'Dr. Sami Karoui (Ingénieur IA chez Vermeg) donnera une conférence sur l\'impact de l\'IA sur le marché de l\'emploi IT en Tunisie. Ouvert à tous les étudiants, inscription obligatoire via l\'administration.',
    img:null,
  },
  {
    id:6, type:'info', emoji:'🗓️',
    title:'Calendrier des examens S2 2024/2025 publié',
    date:'25 Avr 2025', tag:'Examens',
    tagColor:'var(--cyan)',
    body:'Le calendrier des examens du deuxième semestre 2024/2025 est désormais disponible sur le portail étudiant. Les examens se dérouleront du 16 au 30 Juin 2025. Consultez le planning détaillé par filière.',
    img:null,
  },
];

export function StudentNewsPage() {
  const [search, setSearch] = useState('');
  const filtered = NEWS.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  return (<>
    <Topbar title="Actualités" sub="ISSAT Sousse · Campus"/>
    <div className="content">
      {/* Search */}
      <div style={{marginBottom:18,maxWidth:380}}>
        <input placeholder="🔍 Rechercher une actualité…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {filtered.map(n=>(
          <div key={n.id} className="card" style={{padding:'18px 20px',display:'flex',gap:16,alignItems:'flex-start'}}>
            <div style={{
              width:46,height:46,borderRadius:13,flexShrink:0,
              background:'var(--s3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,
            }}>{n.emoji}</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:7,flexWrap:'wrap'}}>
                <span style={{
                  fontSize:9.5,fontFamily:'Space Grotesk',fontWeight:700,
                  padding:'2px 8px',borderRadius:20,textTransform:'uppercase',letterSpacing:'.05em',
                  background:`${n.tagColor}18`,color:n.tagColor,
                }}>{n.tag}</span>
                <span style={{fontSize:11,color:'var(--muted)'}}>{n.date}</span>
              </div>
              <div className="sg" style={{fontWeight:700,fontSize:15,marginBottom:6}}>{n.title}</div>
              <p style={{fontSize:13,color:'var(--muted)',lineHeight:1.65}}>{n.body}</p>
            </div>
          </div>
        ))}
        {filtered.length===0&&(
          <div className="empty">
            <div className="empty-ico">📰</div>
            <div className="empty-ttl">Aucun résultat</div>
            <div className="empty-sub">Essayez un autre mot-clé.</div>
          </div>
        )}
      </div>
    </div>
  </>);
}
