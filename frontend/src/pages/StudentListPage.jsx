import { Topbar } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

// Données statiques fictives (étudiants par filière)
const studentsByFiliere = {
  'ING-A1': [
    { id: 1, name: 'Ahmed Ben Ali', email: 'ahmed.benali@issat.tn', groupe: 'G1' },
    { id: 2, name: 'Sarra Miled', email: 'sarra.miled@issat.tn', groupe: 'G1' },
    { id: 3, name: 'Mohamed Frikha', email: 'mohamed.frikha@issat.tn', groupe: 'G2' },
    { id: 4, name: 'Ines Gharbi', email: 'ines.gharbi@issat.tn', groupe: 'G2' },
    { id: 5, name: 'Oussama Khmiri', email: 'oussama.khmiri@issat.tn', groupe: 'G3' },
    { id: 6, name: 'Nour Ben Salem', email: 'nour.bensalem@issat.tn', groupe: 'G3' },
  ],
  'ING-A2': [
    { id: 7, name: 'Amira Zouari', email: 'amira.zouari@issat.tn', groupe: 'G1' },
    { id: 8, name: 'Yassine Boughanmi', email: 'yassine.boughanmi@issat.tn', groupe: 'G1' },
    { id: 9, name: 'Hind Chebbi', email: 'hind.chebbi@issat.tn', groupe: 'G2' },
  ],
  'ING-A3': [
    { id: 10, name: 'Khaled Bouazizi', email: 'khaled.bouazizi@issat.tn', groupe: 'G1' },
    { id: 11, name: 'Mariem Sassi', email: 'mariem.sassi@issat.tn', groupe: 'G1' },
    { id: 12, name: 'Fares Jlassi', email: 'fares.jlassi@issat.tn', groupe: 'G2' },
  ],
};

export default function StudentListPage() {
  const { user } = useAuth();
  const filiere = user?.filiere || 'ING-A1';
  const students = studentsByFiliere[filiere] || [];

  return (
    <>
      <Topbar title="Liste des étudiants" sub={`Filière ${filiere}`} />
      <div className="content">
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="sg" style={{ fontSize: 18, fontWeight: 600 }}>👥 Effectif total : {students.length} étudiants</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid var(--br)' }}>N°</th>
                  <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid var(--br)' }}>Nom complet</th>
                  <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid var(--br)' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid var(--br)' }}>Groupe</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--br)' }}>
                    <td style={{ padding: '10px' }}>{idx + 1}</td>
                    <td style={{ padding: '10px' }}>{student.name}</td>
                    <td style={{ padding: '10px' }}>{student.email}</td>
                    <td style={{ padding: '10px' }}>
                      <span className="badge" style={{ background: 'var(--s2)' }}>{student.groupe}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}