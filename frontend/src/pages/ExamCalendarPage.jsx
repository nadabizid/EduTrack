import { Topbar } from '../components/Layout';

export default function ExamCalendarPage() {
  // Données statiques fictives
  const exams = [
    { id: 1, course: 'Algorithmique Avancée', date: '2025-06-10', time: '09:00-11:00', room: 'Amphi A', coefficient: 2 },
    { id: 2, course: 'Bases de Données', date: '2025-06-12', time: '14:00-16:00', room: 'Salle 204', coefficient: 1.5 },
    { id: 3, course: 'Génie Logiciel', date: '2025-06-15', time: '09:00-12:00', room: 'Amphi B', coefficient: 3 },
    { id: 4, course: 'Programmation Web', date: '2025-06-18', time: '14:00-16:00', room: 'Salle Info 1', coefficient: 2 },
    { id: 5, course: 'Anglais Technique', date: '2025-06-20', time: '10:00-11:30', room: 'Salle 101', coefficient: 1 },
  ];

  return (
    <>
      <Topbar title="Calendrier des examens" sub="Session principale – Juin 2025" />
      <div className="content">
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="sg" style={{ fontSize: 18, fontWeight: 600 }}>📅 Épreuves écrites</h2>
            <span className="badge" style={{ background: 'var(--amber)' }}>⚠️ Dates sujettes à modification</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--s2)' }}>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Matière</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Horaire</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Salle</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Coeff.</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} style={{ borderBottom: '1px solid var(--br)' }}>
                    <td style={{ padding: '10px' }}><strong>{exam.course}</strong></td>
                    <td style={{ padding: '10px' }}>{new Date(exam.date).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding: '10px' }}>{exam.time}</td>
                    <td style={{ padding: '10px' }}>{exam.room}</td>
                    <td style={{ padding: '10px' }}>{exam.coefficient}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
            📢 Les rattrapages auront lieu du 1er au 10 juillet 2025.
          </div>
        </div>
      </div>
    </>
  );
}