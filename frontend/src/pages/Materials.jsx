import { useState, useEffect } from 'react';
import { Topbar } from '../components/Layout';
import { toast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function UploadModal({ onClose, onDone }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast('Veuillez sélectionner un fichier', 'info');
    setBusy(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('subject', subject);
    try {
      await api.post('/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast('Support ajouté avec succès !');
      onDone();
      onClose();
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors de l’upload', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Ajouter un support de cours</div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Titre *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="field">
            <label>Description (optionnelle)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" />
          </div>
          <div className="field">
            <label>Matière (ex: Mathématiques, Algorithmique)</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="field">
            <label>Fichier (PDF ou TXT) *</label>
            <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files[0])} required />
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Annuler</button>
            <button type="submit" className="btn primary" style={{ flex: 2, justifyContent: 'center' }} disabled={busy}>
              {busy ? 'Ajout…' : '✓ Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuizModal({ quiz, onClose }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = (qIdx, value) => {
    setAnswers(prev => ({ ...prev, [qIdx]: value }));
  };

  const checkAnswers = () => {
    setSubmitted(true);
    let score = 0;
    quiz.forEach((q, idx) => {
      if (answers[idx] === q.correct) score++;
    });
    toast(`🎉 Score : ${score} / ${quiz.length}`, 'success');
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700, width: '90%' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">📋 Quiz généré</div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto', marginBottom: 16 }}>
          {quiz.map((q, idx) => (
            <div key={idx} style={{ marginBottom: 20, borderBottom: '1px solid var(--br)', paddingBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{idx + 1}. {q.question}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 12 }}>
                {q.options.map((opt, optIdx) => {
                  const letter = letters[optIdx];
                  const isSelected = answers[idx] === letter;
                  const isCorrect = submitted && letter === q.correct;
                  const isWrong = submitted && isSelected && letter !== q.correct;
                  return (
                    <label
                      key={optIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '5px 8px',
                        borderRadius: 8,
                        background: isCorrect ? 'rgba(16,185,129,.1)' : isWrong ? 'rgba(239,68,68,.1)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name={`q${idx}`}
                        value={letter}
                        checked={isSelected}
                        onChange={() => handleAnswer(idx, letter)}
                        disabled={submitted}
                      />
                      <span>
                        <strong>{letter}.</strong> {opt}
                      </span>
                      {isCorrect && <span style={{ marginLeft: 'auto', color: 'var(--green)' }}>✓</span>}
                      {isWrong && <span style={{ marginLeft: 'auto', color: 'var(--red)' }}>✗</span>}
                    </label>
                  );
                })}
              </div>
              {submitted && answers[idx] !== q.correct && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--green)' }}>
                  ✅ Réponse correcte : {q.correct}. {q.options[letters.indexOf(q.correct)]}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          {!submitted ? (
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={checkAnswers}>
              ✅ Vérifier mes réponses
            </button>
          ) : (
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSubmitted(false)}>
              ✏️ Refaire le quiz
            </button>
          )}
          <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

export default function MaterialsPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [quiz, setQuiz] = useState(null);

  const loadMaterials = async () => {
    try {
      const { data } = await api.get('/materials');
      setMaterials(data);
    } catch (err) {
      console.error(err);
      toast('Erreur lors du chargement des supports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleGenerateQuiz = async (materialId) => {
    setGenerating(true);
    try {
      const { data } = await api.post(`/ai/generate-quiz/${materialId}`, { numQuestions: 5 });
      setQuiz(data);
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors de la génération', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const downloadFile = (id) => {
    window.open(`/api/materials/download/${id}`, '_blank');
  };

  const isTeacher = user?.role === 'teacher';

  return (
    <>
      <Topbar title="Supports de cours" sub="Ressources pédagogiques" />
      <div className="content">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : materials.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">📚</div>
            <div className="empty-ttl">Aucun support pour le moment</div>
            <div className="empty-sub">
              {isTeacher
                ? 'Cliquez sur "Ajouter un support" pour partager vos ressources.'
                : 'Votre enseignant n’a pas encore ajouté de supports.'}
            </div>
            {isTeacher && (
              <button className="btn primary" style={{ marginTop: 16 }} onClick={() => setUploadModal(true)}>
                + Ajouter un support
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isTeacher && (
              <div style={{ textAlign: 'right', marginBottom: 8 }}>
                <button className="btn primary" onClick={() => setUploadModal(true)}>+ Ajouter un support</button>
              </div>
            )}
            {materials.map((mat) => (
              <div key={mat.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    📄
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 7, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="badge open">{mat.subject || 'Général'}</span>
                      <span className="badge" style={{ background: 'var(--s2)' }}>{fmtDate(mat.created_at)}</span>
                    </div>
                    <div className="sg" style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{mat.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 8 }}>
                      👨‍🏫 {mat.teacher_name} · {mat.description || 'Aucune description'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn" onClick={() => downloadFile(mat.id)}>📥 Télécharger</button>
                      <button
                        className="btn primary"
                        onClick={() => handleGenerateQuiz(mat.id)}
                        disabled={generating}
                      >
                        {generating ? '⏳ Génération...' : '🤖 Générer un quiz'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploadModal && (
        <UploadModal
          onClose={() => setUploadModal(false)}
          onDone={() => loadMaterials()}
        />
      )}
      {quiz && (
        <QuizModal
          quiz={quiz}
          onClose={() => setQuiz(null)}
        />
      )}
    </>
  );
}