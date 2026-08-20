'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HelpCircle, ArrowLeft, Clock, CheckCircle, AlertTriangle, Award, RefreshCw
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';

export default function StudentQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id;
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [attempt, setAttempt] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile || !quizId) return;
    fetchQuiz();
  }, [profile, quizId]);

  // Timer countdown
  useEffect(() => {
    if (!quiz || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz, isSubmitted, timeLeft]);

  async function fetchQuiz() {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data: qData } = await supabase
        .from('quizzes')
        .select('*, subjects(name)')
        .eq('id', quizId)
        .single();

      if (qData) {
        setQuiz(qData);
        setTimeLeft((qData.duration || 30) * 60);

        // Fetch questions & options
        const { data: qQuestions } = await supabase
          .from('quiz_questions')
          .select('*, quiz_options(*)')
          .eq('quiz_id', quizId)
          .order('order_number', { ascending: true });

        setQuestions(qQuestions || []);

        // Check if student already completed this quiz
        const { data: existingAttempt } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('student_id', profile.id)
          .eq('quiz_id', quizId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .maybeSingle();

        if (existingAttempt) {
          setAttempt(existingAttempt);
          setIsSubmitted(true);
          setScoreResult(existingAttempt.score);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectOption = (questionId, optionId) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitted || submitting) return;
    setSubmitting(true);
    const supabase = createClient();

    try {
      let earnedPoints = 0;
      let totalPoints = 0;
      let correctCount = 0;

      // Grade answers
      const answersToInsert = [];
      questions.forEach(q => {
        const selectedOptId = selectedAnswers[q.id];
        const correctOpt = q.quiz_options?.find(o => o.is_correct === true || o.is_correct === 'true');
        const qPoints = q.points || 10;
        totalPoints += qPoints;

        const isCorrect = selectedOptId && correctOpt && String(selectedOptId) === String(correctOpt.id);
        if (isCorrect) {
          earnedPoints += qPoints;
          correctCount += 1;
        }

        answersToInsert.push({
          question_id: q.id,
          selected_option_id: selectedOptId || null,
          is_correct: !!isCorrect
        });
      });

      const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

      // Save attempt
      const { data: newAttempt } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          student_id: profile.id,
          score: finalScore,
          total_points: totalPoints,
          completed_at: new Date().toISOString(),
          status: 'completed'
        })
        .select()
        .single();

      if (newAttempt && answersToInsert.length > 0) {
        await supabase.from('quiz_answers').insert(
          answersToInsert.map(a => ({ ...a, attempt_id: newAttempt.id }))
        );
      }

      setScoreResult(finalScore);
      setIsSubmitted(true);

    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <DashboardLayout profile={profile} unreadCount={unreadCount}>
        <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 350, borderRadius: 16 }} />
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return (
      <DashboardLayout profile={profile} unreadCount={unreadCount}>
        <div className="card card-padding" style={{ textAlign: 'center' }}>
          <h2>Kuis Tidak Ditemukan</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <Link
        href={quiz.subject_id ? `/student/subjects/${quiz.subject_id}` : '/student/subjects'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 500 }}
      >
        <ArrowLeft size={16} /> Kembali ke {quiz.subjects?.name || 'Mata Pelajaran'}
      </Link>

      {/* Quiz Title Header */}
      <div className="card card-padding" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: 6 }}>📝 Kuis Online</span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{quiz.title}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{quiz.description || 'Pilihlah jawaban yang paling tepat.'}</p>
        </div>

        {!isSubmitted && (
          <div style={{ padding: '10px 18px', background: timeLeft < 300 ? 'var(--error-light)' : 'var(--primary-light)', borderRadius: 12, border: `1px solid ${timeLeft < 300 ? 'var(--error)' : 'var(--primary)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color={timeLeft < 300 ? 'var(--error)' : 'var(--primary)'} />
            <span style={{ fontSize: 16, fontWeight: 800, color: timeLeft < 300 ? 'var(--error)' : 'var(--primary)' }}>
              {formatTimer(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {/* Quiz Submission Result Card */}
      {isSubmitted ? (
        <div className="card card-padding" style={{ maxWidth: 520, margin: '0 auto 24px', padding: 28 }}>
          {/* Header Status Card */}
          <div style={{
            background: scoreResult >= (quiz.passing_score || 70) ? '#F0FDF4' : '#FEF2F2',
            border: `1.5px solid ${scoreResult >= (quiz.passing_score || 70) ? '#86EFAC' : '#FCA5A5'}`,
            borderRadius: 16, padding: '24px 20px', textAlign: 'center', marginBottom: 20
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: scoreResult >= (quiz.passing_score || 70) ? '#DCFCE7' : '#FEE2E2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
              border: `2px solid ${scoreResult >= (quiz.passing_score || 70) ? '#22C55E' : '#EF4444'}`
            }}>
              <Award size={30} color={scoreResult >= (quiz.passing_score || 70) ? '#15803D' : '#B91C1C'} />
            </div>

            <div style={{ fontSize: 12, fontWeight: 800, color: scoreResult >= (quiz.passing_score || 70) ? '#15803D' : '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {scoreResult >= (quiz.passing_score || 70) ? 'LULUS KKM' : 'BELUM LULUS KKM'}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{scoreResult}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#64748B' }}>/ 100</span>
            </div>

            <p style={{ fontSize: 13, color: scoreResult >= (quiz.passing_score || 70) ? '#166534' : '#991B1B', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
              {scoreResult >= (quiz.passing_score || 70)
                ? 'Selamat! Nilai Anda telah memenuhi kriteria kelulusan minimal (KKM).'
                : 'Nilai Anda belum mencapai KKM. Silakan pelajari kembali materi ini.'}
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href={quiz.subject_id ? `/student/subjects/${quiz.subject_id}` : '/student/subjects'}>
              <button className="btn btn-primary btn-full" style={{ padding: '12px 20px', fontSize: 14, fontWeight: 700, borderRadius: 10 }}>
                Kembali ke Pelajaran
              </button>
            </Link>
          </div>
        </div>
      ) : (
        /* Questions List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {questions.map((q, idx) => (
            <div key={q.id} className="card card-padding">
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
                Soal Nomor {idx + 1}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.5 }}>
                {q.question_text}
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.quiz_options?.map(opt => {
                  const isSelected = selectedAnswers[q.id] === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      style={{
                        padding: '12px 16px', borderRadius: 10,
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--primary-light)' : 'var(--bg)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--text-muted)'}`,
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}>
                        {opt.option_text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit Quiz Button */}
          <div style={{ padding: '20px 0', textAlign: 'right' }}>
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="btn btn-primary btn-lg"
              style={{ padding: '14px 36px' }}
            >
              {submitting ? 'Mengirim Kuis...' : 'Selesaikan Kuis'}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
