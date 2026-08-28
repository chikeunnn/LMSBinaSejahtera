'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Filter, GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';

function getStudentClassInfo(student, classesList = []) {
  if (!student) return { name: 'Belum Ada Kelas', grade: null };

  if (student.classes && student.classes.name) {
    const clsName = student.classes.name;
    const grade = student.classes.grade || extractGradeNum(clsName);
    return { name: clsName, grade };
  }

  if (student.class_id) {
    const found = classesList.find(c =>
      String(c.id) === String(student.class_id) ||
      String(c.name).toLowerCase() === String(student.class_id).toLowerCase() ||
      String(c.code).toLowerCase() === String(student.class_id).toLowerCase()
    );

    if (found) {
      const grade = found.grade || extractGradeNum(found.name);
      return { name: found.name, grade };
    }

    const g = extractGradeNum(student.class_id);
    if (g) return { name: `Kelas ${g}`, grade: g };

    return { name: String(student.class_id), grade: extractGradeNum(student.class_id) };
  }

  if (student.class_name) {
    const g = extractGradeNum(student.class_name);
    return { name: student.class_name, grade: g };
  }

  return { name: 'Belum Ada Kelas', grade: null };
}

function extractGradeNum(str) {
  if (!str) return null;
  const s = String(str);
  if (s.includes('7')) return 7;
  if (s.includes('8')) return 8;
  if (s.includes('9')) return 9;
  return null;
}

export default function TeacherStudentsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const [{ data: stdData }, { data: clsData }] = await Promise.all([
        supabase.from('profiles').select('*, classes(id, name, grade)').eq('role', 'student').order('full_name', { ascending: true }),
        supabase.from('classes').select('*').order('name', { ascending: true })
      ]);

      setStudents(stdData || []);
      setClasses(clsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Grade Counts based on actual registrations
  const countGrade = (gradeNum) => students.filter(s => getStudentClassInfo(s, classes).grade === gradeNum).length;
  const countUnassigned = students.filter(s => getStudentClassInfo(s, classes).grade === null).length;

  // Filter Logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = (s.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.nis || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedClassFilter === 'ALL') return true;
    if (selectedClassFilter === 'UNASSIGNED') return getStudentClassInfo(s, classes).grade === null;
    if (['7', '8', '9'].includes(selectedClassFilter)) {
      return getStudentClassInfo(s, classes).grade === parseInt(selectedClassFilter);
    }

    return String(s.class_id) === String(selectedClassFilter);
  });

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Daftar Siswa Sekolah & Kelas</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Pantau dan kelola seluruh siswa yang terdaftar berdasarkan tingkat kelas di LMS Bina Sejahtera
        </p>
      </div>

      {/* Metrics Row - Total + Grades breakdown based on actual student sign-ups */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{students.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Siswa Terdaftar</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{countGrade(7)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Siswa Kelas 7</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{countGrade(8)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Siswa Kelas 8</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{countGrade(9)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Siswa Kelas 9</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: countUnassigned > 0 ? '#FEE2E2' : '#E0F2FE', color: countUnassigned > 0 ? '#DC2626' : '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {countUnassigned > 0 ? <AlertCircle size={22} /> : <CheckCircle2 size={22} />}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{countUnassigned}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{countUnassigned > 0 ? 'Belum Masuk Kelas' : 'Status: Terpetakan'}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card card-padding" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="Cari berdasarkan nama, email, atau NISN..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 180 }}
              value={selectedClassFilter}
              onChange={e => setSelectedClassFilter(e.target.value)}
            >
              <option value="ALL">Semua Tingkat Kelas</option>
              <option value="7">Siswa Kelas 7</option>
              <option value="8">Siswa Kelas 8</option>
              <option value="9">Siswa Kelas 9</option>
              <option value="UNASSIGNED">Belum Masuk Kelas</option>
              {classes.length > 0 && <option disabled>── Rombel Khusus ──</option>}
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student List Grid */}
      {loading ? (
        <div className="skeleton" style={{ height: 250, borderRadius: 16 }} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState icon={Users} title="Siswa Tidak Ditemukan" description="Tidak ada siswa yang sesuai dengan kriteria filter Anda." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredStudents.map(s => {
            const classInfo = getStudentClassInfo(s, classes);
            const isAssigned = classInfo.grade !== null || classInfo.name !== 'Belum Ada Kelas';

            return (
              <div key={s.id} className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar name={s.full_name || s.email} src={s.avatar_url} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.full_name || 'Tanpa Nama'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.email}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      className="badge"
                      style={{
                        fontSize: 11,
                        background: isAssigned ? '#EFF6FF' : '#FEF2F2',
                        color: isAssigned ? '#2563EB' : '#DC2626',
                        fontWeight: 700
                      }}
                    >
                      🏫 {classInfo.name}
                    </span>
                    {s.nis && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        NIS: {s.nis}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
