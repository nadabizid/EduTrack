import { Topbar } from '../components/Layout';

export default function UniversityCalendarPage() {
  const events = [
    { id: 1, title: 'Date de rentrée (étudiants anciens)', date: '2025-09-15', type: 'rentree' },
    { id: 2, title: 'Date de rentrée (nouveaux étudiants)', date: '2025-09-20', type: 'rentree' },
    { id: 3, title: 'Clôture des inscriptions pédagogiques', date: '2025-10-05', type: 'admin' },
    { id: 4, title: 'Vacances de la Toussaint', date: '2025-11-01', dateEnd: '2025-11-07', type: 'vacances' },
    { id: 5, title: 'Début des examens session 1', date: '2025-12-10', type: 'exam' },
    { id: 6, title: 'Fin du 1er semestre', date: '2025-12-20', type: 'admin' },
    { id: 7, title: 'Vacances d’hiver', date: '2025-12-23', dateEnd: '2026-01-04', type: 'vacances' },
    { id: 8, title: 'Début du 2ème semestre', date: '2026-01-12', type: 'rentree' },
    { id: 9, title: 'Vacances de printemps', date: '2026-03-20', dateEnd: '2026-03-27', type: 'vacances' },
    { id: 10, title: 'Début des examens session 2', date: '2026-05-20', type: 'exam' },
    { id: 11, title: 'Fin de l’année universitaire', date: '2026-06-15', type: 'admin' },
  ];

  const getTypeStyle = (type) => {
    switch(type) {
      case 'rentree': return { background: 'rgba(16,185,129,.1)', color: 'var(--green)' };
      case 'exam': return { background: 'rgba(239,68,68,.1)', color: 'var(--red)' };
      case 'vacances': return { background: 'rgba(245,158,11,.1)', color: 'var(--amber)' };
      default: return { background: 'var(--s2)', color: 'var(--muted2)' };
    }
  };

  return (
    <>
      <Topbar title="Calendrier universitaire" sub="Année 2025-2026" />
      <div className="content">
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: 20 }}>
            <h2 className="sg" style={{ fontSize: 18, fontWeight: 600 }}>🗓️ Événements et dates clés</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map((ev) => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0', borderBottom: '1px solid var(--br)' }}>
                <div style={{ width: 100, fontWeight: 500 }}>
                  {new Date(ev.date).toLocaleDateString('fr-FR')}
                  {ev.dateEnd && ` – ${new Date(ev.dateEnd).toLocaleDateString('fr-FR')}`}
                </div>
                <div style={{ flex: 1 }}>{ev.title}</div>
                <div>
                  <span className="badge" style={getTypeStyle(ev.type)}>
                    {ev.type === 'rentree' ? 'Rentrée' : ev.type === 'exam' ? 'Examens' : ev.type === 'vacances' ? 'Vacances' : 'Administratif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}