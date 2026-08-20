'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { HelpCircle, Plus, Trash2, Edit, CheckCircle2, AlertCircle, Eye, Users, FileText, Check, GraduationCap, Hash, Clock } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

export default function TeacherQuizzesPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [questionFormModalOpen, setQuestionFormModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Quiz Form
  const [quizForm, setQuizForm] = useState({
    subject_id: '',
    title: '',
    duration: 30,
    passing_score: 70,
    is_published: true
  });

  // Question Form
  const [qForm, setQForm] = useState({
    question_text: '',
    points: 10,
    options: [
      { text: 'Jawaban A', is_correct: true },
      { text: 'Jawaban B', is_correct: false },
      { text: 'Jawaban C', is_correct: false },
      { text: 'Jawaban D', is_correct: false },
    ]
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const [{ data: subData }, { data: quizData }] = await Promise.all([
        supabase.from('subjects').select('*, classes(name)'),
        supabase.from('quizzes').select(`
          *,
          subjects(name, class_id, code, classes(name)),
          quiz_questions(id),
          quiz_attempts(id)
        `).order('created_at', { ascending: false })
      ]);
      setSubjects(subData || []);
      setQuizzes(quizData || []);
    } catch (e) {
      console.error('Error fetching quizzes:', e);
    } finally {
      setLoading(false);
    }
  }

  // --- QUIZ CRUD ---
  const handleOpenCreateQuiz = () => {
    setEditingQuiz(null);
    setQuizForm({
      subject_id: subjects[0]?.id || '',
      title: '',
      duration: 30,
      passing_score: 70,
      is_published: true
    });
    setSaveError('');
    setQuizModalOpen(true);
  };

  const handleOpenEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      subject_id: quiz.subject_id || subjects[0]?.id || '',
      title: quiz.title || '',
      duration: quiz.duration || 30,
      passing_score: quiz.passing_score || 70,
      is_published: quiz.is_published !== false
    });
    setSaveError('');
    setQuizModalOpen(true);
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (!quizForm.title.trim()) {
      setSaveError('Judul Kuis wajib diisi.');
      return;
    }
    setSaving(true);
    setSaveError('');
    const supabase = createClient();

    try {
      let targetSubjectId = quizForm.subject_id;
      if (!targetSubjectId && subjects.length > 0) targetSubjectId = subjects[0].id;

      if (!targetSubjectId) {
        const { data: newSub } = await supabase.from('subjects').insert({
          name: 'Mata Pelajaran Umum',
          teacher_id: profile.id,
          status: 'active'
        }).select('id').single();
        targetSubjectId = newSub?.id;
      }

      const payload = {
        subject_id: targetSubjectId,
        title: quizForm.title.trim(),
        duration: parseInt(quizForm.duration) || 30,
        passing_score: parseInt(quizForm.passing_score) || 70,
        is_published: quizForm.is_published,
        created_by: profile.id
      };

      if (editingQuiz) {
        const { error: updateErr } = await supabase.from('quizzes').update(payload).eq('id', editingQuiz.id);
        if (updateErr) throw new Error(updateErr.message);
      } else {
        const { error: insertErr } = await supabase.from('quizzes').insert(payload);
        if (insertErr) throw new Error(insertErr.message);
      }

      setQuizModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setSaveError(err.message || 'Gagal menyimpan kuis.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kuis ini beserta seluruh soal dan nilainya?')) return;
    const supabase = createClient();
    await supabase.from('quizzes').delete().eq('id', id);
    fetchData();
  };

  // --- KELOLA SOAL (QUESTIONS LIST) ---
  const handleOpenQuestionsList = async (quiz) => {
    setActiveQuiz(quiz);
    setQuestionsModalOpen(true);
    fetchQuestions(quiz.id);
  };

  async function fetchQuestions(quizId) {
    const supabase = createClient();
    setLoadingQuestions(true);
    try {
      const { data: qData } = await supabase
        .from('quiz_questions')
        .select('*, quiz_options(*)')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: true });
      setActiveQuizQuestions(qData || []);
    } catch (e) {
      console.error('Error fetching questions:', e);
    } finally {
      setLoadingQuestions(false);
    }
  }

  // --- QUESTION FORM (CREATE / EDIT) ---
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQForm({
      question_text: '',
      points: 10,
      options: [
        { text: 'Jawaban A', is_correct: true },
        { text: 'Jawaban B', is_correct: false },
        { text: 'Jawaban C', is_correct: false },
        { text: 'Jawaban D', is_correct: false },
      ]
    });
    setQuestionFormModalOpen(true);
  };

  const handleOpenEditQuestion = (q) => {
    setEditingQuestion(q);
    const existingOpts = q.quiz_options || [];
    setQForm({
      question_text: q.question_text || '',
      points: q.points || 10,
      options: existingOpts.length === 4 ? existingOpts.map(o => ({
        id: o.id,
        text: o.option_text,
        is_correct: o.is_correct
      })) : [
        { text: existingOpts[0]?.option_text || 'Jawaban A', is_correct: existingOpts[0]?.is_correct ?? true },
        { text: existingOpts[1]?.option_text || 'Jawaban B', is_correct: existingOpts[1]?.is_correct ?? false },
        { text: existingOpts[2]?.option_text || 'Jawaban C', is_correct: existingOpts[2]?.is_correct ?? false },
        { text: existingOpts[3]?.option_text || 'Jawaban D', is_correct: existingOpts[3]?.is_correct ?? false },
      ]
    });
    setQuestionFormModalOpen(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!qForm.question_text.trim() || !activeQuiz) return;

    const hasCorrect = qForm.options.some(o => o.is_correct);
    if (!hasCorrect) {
      alert('Harap pilih salah satu pilihan jawaban sebagai Kunci Jawaban Benar.');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      if (editingQuestion) {
        // Update question text
        const { error: qErr } = await supabase
          .from('quiz_questions')
          .update({
            question_text: qForm.question_text.trim(),
            points: parseInt(qForm.points) || 10
          })
          .eq('id', editingQuestion.id);

        if (qErr) throw qErr;

        // Delete old options & insert new ones
        await supabase.from('quiz_options').delete().eq('question_id', editingQuestion.id);

        await supabase.from('quiz_options').insert(
          qForm.options.map(opt => ({
            question_id: editingQuestion.id,
            option_text: opt.text,
            is_correct: opt.is_correct
          }))
        );
      } else {
        // Insert new question
        const { data: qData, error: qErr } = await supabase.from('quiz_questions').insert({
          quiz_id: activeQuiz.id,
          question_text: qForm.question_text.trim(),
          question_type: 'multiple_choice',
          points: parseInt(qForm.points) || 10
        }).select().single();

        if (qErr) throw qErr;

        if (qData) {
          await supabase.from('quiz_options').insert(
            qForm.options.map(opt => ({
              question_id: qData.id,
              option_text: opt.text,
              is_correct: opt.is_correct
            }))
          );
        }
      }

      setQuestionFormModalOpen(false);
      fetchQuestions(activeQuiz.id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan soal: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    const supabase = createClient();
    await supabase.from('quiz_questions').delete().eq('id', questionId);
    fetchQuestions(activeQuiz.id);
    fetchData();
  };

  // --- RIWAYAT NILAI SISWA ---
  const handleOpenResultsModal = async (quiz) => {
    setActiveQuiz(quiz);
    setResultsModalOpen(true);
    setLoadingAttempts(true);
    const supabase = createClient();

    try {
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('*, profiles(full_name, email, nis)')
        .eq('quiz_id', quiz.id)
        .order('created_at', { ascending: false });

      setQuizAttempts(attemptsData || []);
    } catch (e) {
      console.error('Error fetching attempts:', e);
    } finally {
      setLoadingAttempts(false);
    }
  };

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      {/* Header section */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Kelola Kuis & Soal Interaktif</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Buat kuis interaktif, atur soal, dan lihat riwayat nilai siswa secara real-time
          </p>
        </div>
        <button onClick={handleOpenCreateQuiz} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
          <Plus size={16} /> Buat Kuis Baru
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      ) : quizzes.length === 0 ? (
        <EmptyState icon={HelpCircle} title="Belum Ada Kuis" description="Buat kuis pertama untuk menguji pemahaman siswa." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {quizzes.map(q => {
            const questionCount = q.quiz_questions?.length || 0;
            const attemptCount = q.quiz_attempts?.length || 0;
            return (
              <div key={q.id} className="card card-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      <GraduationCap size={12} /> {q.subjects?.classes?.name || 'Semua Kelas'}
                    </span>
                    {q.subjects?.code && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        <Hash size={12} /> {q.subjects.code}
                      </span>
                    )}
                    <span className={`badge ${q.is_published ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: 'auto', fontSize: 11 }}>
                      {q.is_published ? 'Publik' : 'Draft'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{q.title}</h3>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>
                    {q.subjects?.name || 'Mata Pelajaran'}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} /> {q.duration} Menit
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={13} /> KKM: {q.passing_score}
                    </span>
                    <span>📄 {questionCount} Soal</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleOpenQuestionsList(q)} className="btn btn-primary btn-sm" style={{ flex: 1, gap: 6, justifyContent: 'center' }}>
                      <FileText size={14} /> Kelola Soal ({questionCount})
                    </button>
                    <button onClick={() => handleOpenResultsModal(q)} className="btn btn-secondary btn-sm" style={{ gap: 6 }} title="Riwayat Nilai Siswa">
                      <Users size={14} /> Nilai ({attemptCount})
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => handleOpenEditQuiz(q)} className="btn btn-ghost btn-sm" style={{ fontSize: 12, gap: 4 }}>
                      <Edit size={14} /> Edit Kuis
                    </button>
                    <button onClick={() => handleDeleteQuiz(q.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)', fontSize: 12, gap: 4 }}>
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. MODAL CREATE / EDIT QUIZ HEADER */}
      <Modal open={quizModalOpen} onClose={() => setQuizModalOpen(false)} title={editingQuiz ? 'Edit Data Kuis' : 'Buat Kuis Pembelajaran Baru'}>
        <form onSubmit={handleSaveQuiz} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {saveError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'var(--error-light)', borderRadius: 8, border: '1px solid #FECACA' }}>
              <AlertCircle size={16} color="var(--error)" />
              <span style={{ fontSize: 13, color: 'var(--error)' }}>{saveError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="qz_sub_id">Mata Pelajaran & Kelas Target</label>
            <select id="qz_sub_id" className="form-input" value={quizForm.subject_id} onChange={e => setQuizForm({ ...quizForm, subject_id: e.target.value })}>
              <option value="">-- Pilih Mata Pelajaran --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.classes?.name || 'Tanpa Kelas'} {s.code ? `[${s.code}]` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="qz_title">Judul Kuis</label>
            <input id="qz_title" type="text" required className="form-input" placeholder="Contoh: Kuis Harian Bab 1" value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="qz_dur">Durasi (Menit)</label>
              <input id="qz_dur" type="number" className="form-input" value={quizForm.duration} onChange={e => setQuizForm({ ...quizForm, duration: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="qz_pass">Nilai KKM (0-100)</label>
              <input id="qz_pass" type="number" className="form-input" value={quizForm.passing_score} onChange={e => setQuizForm({ ...quizForm, passing_score: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
            {saving ? 'Menyimpan...' : editingQuiz ? 'Simpan Perubahan' : 'Terbitkan Kuis'}
          </button>
        </form>
      </Modal>

      {/* 2. MODAL KELOLA DAFTAR SOAL (QUESTIONS LIST) */}
      <Modal open={questionsModalOpen} onClose={() => setQuestionsModalOpen(false)} title={`Daftar Soal Kuis: ${activeQuiz?.title || ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Total Soal: <strong>{activeQuizQuestions.length}</strong> butir
            </div>
            <button onClick={handleOpenAddQuestion} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
              <Plus size={15} /> Tambah Soal Baru
            </button>
          </div>

          {loadingQuestions ? (
            <div className="skeleton" style={{ height: 120, borderRadius: 10 }} />
          ) : activeQuizQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', background: '#F8FAFC', borderRadius: 12, border: '1px dashed var(--border)' }}>
              <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>Belum ada soal dibuat</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Klik tombol '+ Tambah Soal Baru' untuk memasukkan soal kuis ini.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
              {activeQuizQuestions.map((q, idx) => (
                <div key={q.id} style={{ background: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>
                      Soal #{idx + 1}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleOpenEditQuestion(q)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 12 }} title="Edit Soal">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)', padding: '4px 8px', fontSize: 12 }} title="Hapus Soal">
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, whiteSpace: 'pre-wrap' }}>
                    {q.question_text}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6 }}>
                    {q.quiz_options?.map((opt, i) => (
                      <div
                        key={opt.id || i}
                        style={{
                          padding: '6px 10px', borderRadius: 6, fontSize: 12,
                          background: opt.is_correct ? '#D1FAE5' : 'white',
                          border: `1px solid ${opt.is_correct ? '#6EE7B7' : '#E2E8F0'}`,
                          color: opt.is_correct ? '#065F46' : 'var(--text-primary)',
                          fontWeight: opt.is_correct ? 700 : 400,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}
                      >
                        <span>{opt.option_text}</span>
                        {opt.is_correct && <Check size={14} color="#059669" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* 3. MODAL TAMBAH / EDIT SOAL (FORM) */}
      <Modal open={questionFormModalOpen} onClose={() => setQuestionFormModalOpen(false)} title={editingQuestion ? 'Edit Soal Kuis' : `Tambah Soal Baru (${activeQuiz?.title})`}>
        <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="q_text">Teks Pertanyaan Soal</label>
            <textarea id="q_text" rows={3} required className="form-input" placeholder="Ketik pertanyaan soal di sini..." value={qForm.question_text} onChange={e => setQForm({ ...qForm, question_text: e.target.value })} />
          </div>

          <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Pilihan Jawaban & Kunci Jawaban Benar</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>(Klik tombol radio untuk menandai kunci)</span>
            </div>

            {qForm.options.map((opt, i) => {
              const optionLetter = String.fromCharCode(65 + i);
              return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: opt.is_correct ? '#10B981' : '#E2E8F0', color: opt.is_correct ? 'white' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                    {optionLetter}
                  </div>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder={`Ketik teks pilihan ${optionLetter}...`}
                    value={opt.text}
                    onChange={e => {
                      const newOpts = [...qForm.options];
                      newOpts[i].text = e.target.value;
                      setQForm({ ...qForm, options: newOpts });
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newOpts = qForm.options.map((o, idx) => ({ ...o, is_correct: idx === i }));
                      setQForm({ ...qForm, options: newOpts });
                    }}
                    style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: opt.is_correct ? '#D1FAE5' : '#F1F5F9',
                      color: opt.is_correct ? '#065F46' : '#64748B',
                      border: `1.5px solid ${opt.is_correct ? '#10B981' : '#CBD5E1'}`,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      transition: 'all 0.15s'
                    }}
                  >
                    {opt.is_correct ? <>✓ Kunci Benar</> : <>Set Kunci</>}
                  </button>
                </div>
              );
            })}
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
            {saving ? 'Menyimpan...' : editingQuestion ? 'Simpan Perubahan Soal' : 'Simpan Soal Baru'}
          </button>
        </form>
      </Modal>

      {/* 4. MODAL RIWAYAT NILAI SISWA */}
      <Modal open={resultsModalOpen} onClose={() => setResultsModalOpen(false)} title={`Riwayat Nilai Siswa: ${activeQuiz?.title || ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            KKM Kuis: <strong>{activeQuiz?.passing_score || 70} Nilai</strong>
          </div>

          {loadingAttempts ? (
            <div className="skeleton" style={{ height: 160, borderRadius: 10 }} />
          ) : quizAttempts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', background: '#F8FAFC', borderRadius: 12 }}>
              <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>Belum ada siswa yang mengerjakan</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Siswa yang telah menyelesaikan kuis akan muncul di daftar ini.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Nama Siswa</th>
                    <th style={{ padding: '10px 12px' }}>NIS / Email</th>
                    <th style={{ padding: '10px 12px' }}>Nilai</th>
                    <th style={{ padding: '10px 12px' }}>Status KKM</th>
                    <th style={{ padding: '10px 12px' }}>Waktu Selesai</th>
                  </tr>
                </thead>
                <tbody>
                  {quizAttempts.map((att, i) => {
                    const studentName = att.profiles?.full_name || 'Siswa';
                    const studentSub = att.profiles?.nis || att.profiles?.email || '-';
                    const score = att.score || 0;
                    const isPassed = score >= (activeQuiz?.passing_score || 70);
                    return (
                      <tr key={att.id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{studentName}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{studentSub}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, fontSize: 15, color: isPassed ? '#059669' : '#DC2626' }}>
                          {score} / 100
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span className={`badge ${isPassed ? 'badge-success' : 'badge-warning'}`}>
                            {isPassed ? 'LULUS' : 'BELUM LULUS'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          {formatDateShort(att.created_at || att.completed_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

    </DashboardLayout>
  );
}
