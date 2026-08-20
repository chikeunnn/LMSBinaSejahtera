'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Filter, BookOpen, CheckCircle, GraduationCap } from 'lucide-react';

export default function TeacherStudentsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
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
        supabase.from('profiles').select('*, classes(name, grade)').eq('role', 'student').order('full_name', { ascending: true }),
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

  // Filter Logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.nis?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedClass === 'ALL') return matchesSearch;
    return matchesSearch && (s.class_id === selectedClass || s.classes?.grade === parseInt(selectedClass));
  });

  const countGrade = (gradeNum) => students.filter(s => s.classes?.grade === gradeNum).length;

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Daftar Siswa Sekolah</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Pantau dan kelola seluruh siswa yang terdaftar di LMS Bina Sejahtera
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{students.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Siswa Terdaftar</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{countGrade(7)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Siswa Kelas 7</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{countGrade(8)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Siswa Kelas 8</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{countGrade(9)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Siswa Kelas 9</div>
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
              style={{ width: 'auto' }}
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="ALL">Semua Tingkat Kelas</option>
              <option value="7">Kelas 7</option>
              <option value="8">Kelas 8</option>
              <option value="9">Kelas 9</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List Grid */}
      {loading ? (
        <div className="skeleton" style={{ height: 250, borderRadius: 16 }} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState icon={Users} title="Siswa Tidak Ditemukan" description="Tidak ada siswa yang sesuai dengan kriteria pencarian Anda." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredStudents.map(s => (
            <div key={s.id} className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={s.full_name || s.email} src={s.avatar_url} size={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.full_name || 'Tanpa Nama'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.email}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                  <span className="badge badge-primary" style={{ fontSize: 11 }}>
                    🏫 {s.classes?.name || `Kelas ${s.classes?.grade || 'Umum'}`}
                  </span>
                  {s.nis && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      NIS: {s.nis}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
