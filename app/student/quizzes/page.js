'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { HelpCircle, Clock, CheckCircle2, AlertCircle, Award, ChevronRight, RefreshCw } from 'lucide-react';

export default function StudentQuizzesPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active quiz playing state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [question_id]: option_id }
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      let { data } = await supabase
        .from('quizzes')
        .select('*, subjects(name, class_id, code)')
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) {
        const { data: rawQuizzes } = await supabase.from('quizzes').select('*, subjects(name)');
        data = rawQuizzes || [];
      }

      setQuizzes(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleStartQuiz = async (quiz) => {
    const supabase = createClient();
    setLoading(true);
    try {
      // Fetch quiz questions & options
      const { data: qData } = await supabase
        .from('quiz_questions')
        .select('*, quiz_options(*)')
        .eq('quiz_id', quiz.id);

      if (!qData || qData.length === 0) {
        alert('Kuis ini belum memiliki butir soal.');
        setLoading(false);
        return;
      }

      setActiveQuiz(quiz);
      setQuestions(qData);
      setCurrentQIndex(0);
      setUserAnswers({});
      setQuizModalOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId, optionId) => {
    setUserAnswers({ ...userAnswers, [questionId]: optionId });
  };

  const handleSubmitQuiz = async () => {
    if (!confirm('Apakah Anda yakin ingin menyelesaikan kuis ini?')) return;
    setSubmitting(true);
    const supabase = createClient();

    try {
      let earnedPoints = 0;
      let totalPoints = 0;
      let correctCount = 0;

      questions.forEach(q => {
        const selectedOptId = userAnswers[q.id];
        const correctOpt = q.quiz_options?.find(o => o.is_correct === true || o.is_correct === 'true');
        const qPoints = q.points || 10;
        totalPoints += qPoints;

        if (selectedOptId && correctOpt && String(selectedOptId) === String(correctOpt.id)) {
          earnedPoints += qPoints;
          correctCount += 1;
        }
      });

      const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const isPassed = finalScore >= (activeQuiz.passing_score || 70);

      // Save attempt to database
      await supabase.from('quiz_attempts').insert({
        quiz_id: activeQuiz.id,
        user_id: profile.id,
        score: finalScore,
        total_questions: questions.length,
        correct_answers: correctCount,
        is_passed: isPassed
      });

      setQuizResult({
        score: finalScore,
        passing_score: activeQuiz.passing_score || 70,
        is_passed: isPassed,
        total_questions: questions.length,
        correct_answers: correctCount
      });

      setQuizModalOpen(false);
      setResultModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim kuis. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Kuis & Ujian Interaktif</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Uji pemahaman materi pembelajaran Anda dengan mengerjakan kuis pilihan ganda
        </p>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Belum Ada Kuis Aktif"
          description="Saat ini belum ada kuis yang diterbitkan oleh guru Anda."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {quizzes.map(q => (
            <div key={q.id} className="card card-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
                  📘 {q.subjects?.name || 'Mata Pelajaran'}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{q.title}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 16, marginBottom: 16 }}>
                  <span>⏱️ {q.duration} Menit</span>
                  <span>🎯 KKM: {q.passing_score}</span>
                </div>
              </div>

              <button onClick={() => handleStartQuiz(q)} className="btn btn-primary btn-full" style={{ gap: 6 }}>
                Kerjakan Kuis Sekarang <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quiz Modal */}
      <Modal open={quizModalOpen} onClose={() => setQuizModalOpen(false)} title={`Kuis: ${activeQuiz?.title}`}>
        {questions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-light)', padding: '10px 14px', borderRadius: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                Soal Nomor {currentQIndex + 1} / {questions.length}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={14} /> Durasi: {activeQuiz?.duration} Menit
              </span>
            </div>

            {/* Question Card */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.5 }}>
                {questions[currentQIndex].question_text}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {questions[currentQIndex].quiz_options?.map(opt => {
                  const isSelected = userAnswers[questions[currentQIndex].id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectAnswer(questions[currentQIndex].id, opt.id)}
                      style={{
                        padding: '12px 16px', borderRadius: 10, textAlign: 'left',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--primary-light)' : 'white',
                        fontWeight: isSelected ? 700 : 500, fontSize: 14,
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        transition: 'all 0.15s', cursor: 'pointer'
                      }}
                    >
                      {opt.option_text}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(prev => prev - 1)}
              >
                Kembali
              </button>

              {currentQIndex < questions.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setCurrentQIndex(prev => prev + 1)}
                >
                  Soal Berikutnya
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={submitting}
                  onClick={handleSubmitQuiz}
                  style={{ background: '#16A34A' }}
                >
                  Selesaikan & Kirim Jawaban
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Result Modal */}
      <Modal open={resultModalOpen} onClose={() => setResultModalOpen(false)} title="Hasil Kuis Anda">
        {quizResult && (
          <div style={{ padding: '4px 0' }}>
            {/* Header Status Card */}
            <div style={{
              background: quizResult.is_passed ? '#F0FDF4' : '#FEF2F2',
              border: `1.5px solid ${quizResult.is_passed ? '#86EFAC' : '#FCA5A5'}`,
              borderRadius: 16, padding: '24px 20px', textAlign: 'center', marginBottom: 16
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: quizResult.is_passed ? '#DCFCE7' : '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                border: `2px solid ${quizResult.is_passed ? '#22C55E' : '#EF4444'}`
              }}>
                <Award size={30} color={quizResult.is_passed ? '#15803D' : '#B91C1C'} />
              </div>

              <div style={{ fontSize: 12, fontWeight: 800, color: quizResult.is_passed ? '#15803D' : '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {quizResult.is_passed ? 'LULUS KKM' : 'BELUM LULUS KKM'}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{quizResult.score}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#64748B' }}>/ 100</span>
              </div>

              <p style={{ fontSize: 13, color: quizResult.is_passed ? '#166534' : '#991B1B', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
                {quizResult.is_passed
                  ? 'Selamat! Nilai Anda telah memenuhi kriteria kelulusan minimal (KKM).'
                  : 'Nilai Anda belum mencapai KKM. Silakan pelajari kembali materi ini.'}
              </p>
            </div>

            {/* Stat Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>Jawaban Benar</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  {quizResult.correct_answers} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>/ {quizResult.total_questions} Soal</span>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>Batas KKM</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  {quizResult.passing_score} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>Nilai</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setResultModalOpen(false)}
              className="btn btn-primary btn-full"
              style={{ padding: '12px 20px', fontSize: 14, fontWeight: 700, borderRadius: 10 }}
            >
              Tutup & Kembali
            </button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
