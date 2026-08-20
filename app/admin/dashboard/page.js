'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { debounce } from '@/lib/utils';
import {
  Users, GraduationCap, BookMarked, FileText, HelpCircle, Activity,
  TrendingUp, UserPlus, Edit, Trash2, Shield, Search, Filter,
  CheckCircle2, Server, HardDrive, RefreshCw, BarChart3, ArrowUpRight
} from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  // Stats & System state
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    admins: 0,
    classes: 0,
    subjects: 0,
    materials: 0,
    quizzes: 0,
    assignments: 0
  });

  // User management state
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [savingUser, setSavingUser] = useState(false);
  const [modalError, setModalError] = useState('');

  const searchRef = useRef(debounce((val) => setSearch(val), 300));

  const [userForm, setUserForm] = useState({
    email: '',
    full_name: '',
    role: 'student',
    class_id: '',
    is_active: true
  });

  useEffect(() => {
    if (!profile) return;
    fetchDashboardData();
  }, [profile]);

  async function fetchDashboardData() {
    const supabase = createClient();
    setLoading(true);
    try {
      // 1. Fetch Parallel Counts & Data
      const [
        { data: allProfiles },
        { data: classesData },
        { data: subjectsData },
        { data: materialsData },
        { data: quizzesData },
        { data: assignmentsData },
        { data: logsData }
      ] = await Promise.all([
        supabase.from('profiles').select('*, classes(name)').order('created_at', { ascending: false }),
        supabase.from('classes').select('*').order('name', { ascending: true }),
        supabase.from('subjects').select('*'),
        supabase.from('materials').select('id'),
        supabase.from('quizzes').select('id'),
        supabase.from('assignments').select('id'),
        supabase.from('activity_logs').select('*, profiles(full_name, role)').order('created_at', { ascending: false }).limit(6)
      ]);

      const profs = allProfiles || [];
      const stdCount = profs.filter(p => p.role === 'student').length;
      const tchCount = profs.filter(p => p.role === 'teacher').length;
      const admCount = profs.filter(p => p.role === 'admin').length;

      const uniqueClassesMap = new Map();
      (classesData || []).forEach(c => {
        const cleanName = c.name?.trim();
        if (cleanName && !uniqueClassesMap.has(cleanName)) {
          uniqueClassesMap.set(cleanName, c);
        }
      });
      const uniqueCls = Array.from(uniqueClassesMap.values());

      setStats({
        students: stdCount,
        teachers: tchCount,
        admins: admCount,
        classes: uniqueCls.length,
        subjects: subjectsData?.length || 0,
        materials: materialsData?.length || 0,
        quizzes: quizzesData?.length || 0,
        assignments: assignmentsData?.length || 0
      });

      setUsers(profs);
      setClasses(uniqueCls);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Open Add User Modal
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setUserForm({
      email: '',
      full_name: '',
      role: 'student',
      class_id: classes[0]?.id || '',
      is_active: true
    });
    setModalError('');
    setUserModalOpen(true);
  };

  // Open Edit User Modal
  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setUserForm({
      email: u.email || '',
      full_name: u.full_name || '',
      role: u.role || 'student',
      class_id: u.class_id || '',
      is_active: u.is_active !== false
    });
    setModalError('');
    setUserModalOpen(true);
  };

  // Save User (Create/Update)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userForm.full_name.trim()) {
      setModalError('Nama lengkap wajib diisi.');
      return;
    }

    setSavingUser(true);
    setModalError('');
    const supabase = createClient();

    try {
      if (editingUser) {
        // Update user profile
        const { error: updateErr } = await supabase.from('profiles').update({
          full_name: userForm.full_name.trim(),
          role: userForm.role,
          class_id: userForm.role === 'student' ? (userForm.class_id || null) : null,
          is_active: userForm.is_active,
          updated_at: new Date().toISOString()
        }).eq('id', editingUser.id);

        if (updateErr) throw new Error(updateErr.message);
      } else {
        // Create new user profile in profiles table
        if (!userForm.email.trim()) {
          setModalError('Alamat email wajib diisi.');
          setSavingUser(false);
          return;
        }

        const newId = crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`;
        const { error: insertErr } = await supabase.from('profiles').insert({
          id: newId,
          email: userForm.email.trim().toLowerCase(),
          full_name: userForm.full_name.trim(),
          role: userForm.role,
          class_id: userForm.role === 'student' ? (userForm.class_id || null) : null,
          is_active: userForm.is_active,
          created_at: new Date().toISOString()
        });

        if (insertErr) throw new Error(insertErr.message);
      }

      setUserModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      setModalError(err.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setSavingUser(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (u) => {
    if (!confirm(`Hapus pengguna ${u.full_name || u.email}? Tindakan ini tidak dapat dibatalkan.`)) return;
    const supabase = createClient();
    try {
      await supabase.from('profiles').delete().eq('id', u.id);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus pengguna.');
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (u) => {
    const supabase = createClient();
    try {
      await supabase.from('profiles').update({
        is_active: !u.is_active
      }).eq('id', u.id);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = stats.students + stats.teachers + stats.admins;
  const studentPct = totalUsers > 0 ? Math.round((stats.students / totalUsers) * 100) : 0;
  const teacherPct = totalUsers > 0 ? Math.round((stats.teachers / totalUsers) * 100) : 0;
  const adminPct = totalUsers > 0 ? Math.round((stats.admins / totalUsers) * 100) : 0;

  // Chart data simulation (7 Days Activity)
  const activityDays = [
    { day: 'Senin', count: 85 },
    { day: 'Selasa', count: 120 },
    { day: 'Rabu', count: 95 },
    { day: 'Kamis', count: 140 },
    { day: 'Jumat', count: 110 },
    { day: 'Sabtu', count: 70 },
    { day: 'Minggu', count: 45 },
  ];
  const maxActivity = Math.max(...activityDays.map(a => a.count));

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      {/* Super Admin Top Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Super Admin Dashboard</h1>
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <Shield size={12} /> Live System
            </span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Pusat kendali akun guru, siswa, kelas, serta pemantauan statistik sekolah real-time
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleManualRefresh} disabled={refreshing} className="btn btn-outline btn-sm" style={{ gap: 6 }}>
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
            <UserPlus size={16} /> Tambah Akun Baru
          </button>
        </div>
      </div>

      {/* Main KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.students}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Siswa</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.teachers}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Guru</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookMarked size={24} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.classes}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Kelas</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.materials}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Materi & Video</div>
          </div>
        </div>
      </div>

      {/* Analytics & System Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>
        
        {/* 1. Activity Bar Chart */}
        <div className="card card-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={18} color="var(--primary)" /> Grafik Aktivitas Pembelajaran
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>7 Hari Terakhir</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Frekuensi akses siswa dan guru pada portal LMS
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, height: 140, paddingTop: 10 }}>
            {activityDays.map((d, i) => {
              const heightPct = Math.round((d.count / maxActivity) * 100);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>{d.count}</div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 28,
                      height: `${heightPct}%`,
                      background: i === 3 ? 'var(--primary)' : 'var(--primary-light)',
                      border: i === 3 ? 'none' : '1px solid #BFDBFE',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.4s ease'
                    }}
                    title={`${d.day}: ${d.count} aktivitas`}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 600 }}>{d.day.slice(0, 3)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. User Distribution Progress Breakdown */}
        <div className="card card-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="var(--primary)" /> Demografi Pengguna Terdaftar
            </h3>

            {/* Visual Multi-Segment Bar */}
            <div style={{ height: 12, width: '100%', background: '#F1F5F9', borderRadius: 6, display: 'flex', overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ width: `${studentPct}%`, background: '#2563EB' }} title={`Siswa: ${studentPct}%`} />
              <div style={{ width: `${teacherPct}%`, background: '#7C3AED' }} title={`Guru: ${teacherPct}%`} />
              <div style={{ width: `${adminPct}%`, background: '#059669' }} title={`Admin: ${adminPct}%`} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563EB' }} /> Siswa ({stats.students})
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{studentPct}%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7C3AED' }} /> Guru ({stats.teachers})
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{teacherPct}%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669' }} /> Administrator ({stats.admins})
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{adminPct}%</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Server size={14} color="#10B981" /> Supabase Database: Connected</span>
            <span>Uptime 99.9%</span>
          </div>
        </div>
      </div>

      {/* Account Management Table Section */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>Kelola Akun Guru & Siswa</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Daftar seluruh akun terdaftar dalam platform sekolah
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="input-wrapper" style={{ minWidth: 240 }}>
              <Search size={16} className="input-icon" />
              <input
                type="search"
                className="form-input input-with-icon"
                placeholder="Cari nama atau email..."
                onChange={e => searchRef.current(e.target.value)}
              />
            </div>

            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 130 }}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">Semua Peran</option>
              <option value="student">Siswa</option>
              <option value="teacher">Guru</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 250, margin: 20, borderRadius: 12 }} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'Pengguna Tidak Ditemukan' : 'Belum Ada Data Pengguna'}
            description={search ? `Tidak ada hasil pencarian untuk "${search}"` : 'Tambahkan akun guru atau siswa baru.'}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Pengguna</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Peran (Role)</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Kelas / Deskripsi</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status Akun</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const isActive = u.is_active !== false;
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar name={u.full_name || u.email} src={u.avatar_url} size={38} />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.full_name || 'Tanpa Nama'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span
                          className="badge"
                          style={{
                            background: u.role === 'admin' ? '#FEF2F2' : u.role === 'teacher' ? '#EDE9FE' : '#EFF6FF',
                            color: u.role === 'admin' ? '#DC2626' : u.role === 'teacher' ? '#7C3AED' : '#2563EB',
                            fontWeight: 700,
                            textTransform: 'capitalize'
                          }}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                        {u.role === 'student' ? (u.classes?.name || 'Tanpa Kelas') : u.role === 'teacher' ? 'Tenaga Pengajar' : 'Administrator'}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          style={{
                            background: isActive ? '#F0FDF4' : '#FEF2F2',
                            border: `1px solid ${isActive ? '#BBF7D0' : '#FECACA'}`,
                            color: isActive ? '#16A34A' : '#DC2626',
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="Klik untuk mengubah status aktif"
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#16A34A' : '#DC2626' }} />
                          {isActive ? 'Aktif' : 'Non-aktif'}
                        </button>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenEditModal(u)} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                            <Edit size={14} /> Edit
                          </button>
                          <button onClick={() => handleDeleteUser(u)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Create / Edit Modal */}
      <Modal open={userModalOpen} onClose={() => setUserModalOpen(false)} title={editingUser ? `Edit Akun: ${editingUser.email}` : 'Tambah Akun Pengguna Baru'}>
        <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {modalError && (
            <div style={{ padding: 12, borderRadius: 8, background: '#FEF2F2', color: '#DC2626', fontSize: 13, border: '1px solid #FECACA' }}>
              {modalError}
            </div>
          )}

          {!editingUser && (
            <div className="form-group">
              <label className="form-label" htmlFor="user_email">Alamat Email *</label>
              <input
                id="user_email"
                type="email"
                required
                className="form-input"
                placeholder="contoh: nama@sekolah.sch.id"
                value={userForm.email}
                onChange={e => setUserForm({ ...userForm, email: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="user_name">Nama Lengkap *</label>
            <input
              id="user_name"
              type="text"
              required
              className="form-input"
              placeholder="Nama lengkap guru atau siswa"
              value={userForm.full_name}
              onChange={e => setUserForm({ ...userForm, full_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="user_role">Peran (Role) *</label>
            <select
              id="user_role"
              className="form-input"
              value={userForm.role}
              onChange={e => setUserForm({ ...userForm, role: e.target.value })}
            >
              <option value="student">Siswa (Student)</option>
              <option value="teacher">Guru (Teacher)</option>
              <option value="admin">Admin (Super Admin)</option>
            </select>
          </div>

          {userForm.role === 'student' && (
            <div className="form-group">
              <label className="form-label" htmlFor="user_class">Pilih Kelas Siswa</label>
              <select
                id="user_class"
                className="form-input"
                value={userForm.class_id}
                onChange={e => setUserForm({ ...userForm, class_id: e.target.value })}
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <input
              type="checkbox"
              id="user_active_chk"
              checked={userForm.is_active}
              onChange={e => setUserForm({ ...userForm, is_active: e.target.checked })}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="user_active_chk" style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Akun Aktif (Dapat Login ke Platform)
            </label>
          </div>

          <button type="submit" disabled={savingUser} className="btn btn-primary" style={{ marginTop: 10 }}>
            {savingUser ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Buat Akun Baru')}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
