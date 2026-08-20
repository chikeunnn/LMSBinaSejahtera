'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { Users, UserPlus, Edit, Trash2, Shield, Eye, Lock, Key, CheckCircle2 } from 'lucide-react';

export default function AdminUsersPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    email: '',
    full_name: '',
    role: 'student',
    class_id: '',
    is_active: true
  });

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const [{ data: profData }, { data: clsData }] = await Promise.all([
        supabase.from('profiles').select('*, classes(name)').order('created_at', { ascending: false }),
        supabase.from('classes').select('*').order('name', { ascending: true })
      ]);

      const uniqueClassesMap = new Map();
      (clsData || []).forEach(c => {
        const cleanName = c.name?.trim();
        if (cleanName && !uniqueClassesMap.has(cleanName)) {
          uniqueClassesMap.set(cleanName, c);
        }
      });

      setUsers(profData || []);
      setClasses(Array.from(uniqueClassesMap.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (u = null) => {
    if (u) {
      setEditingUser(u);
      setForm({
        email: u.email || '',
        full_name: u.full_name || '',
        role: u.role || 'student',
        class_id: u.class_id || '',
        is_active: u.is_active !== false
      });
    } else {
      setEditingUser(null);
      setForm({
        email: '',
        full_name: '',
        role: 'student',
        class_id: classes[0]?.id || '',
        is_active: true
      });
    }
    setModalOpen(true);
  };

  const handleOpenDetail = (u) => {
    setDetailUser(u);
    setDetailModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setSaving(true);
    const supabase = createClient();

    try {
      if (editingUser) {
        await supabase.from('profiles').update({
          full_name: form.full_name.trim(),
          role: form.role,
          class_id: form.role === 'student' ? (form.class_id || null) : null,
          is_active: form.is_active,
          updated_at: new Date().toISOString()
        }).eq('id', editingUser.id);
      } else {
        const uId = crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`;
        await supabase.from('profiles').insert({
          id: uId,
          email: form.email.trim().toLowerCase(),
          full_name: form.full_name.trim(),
          role: form.role,
          class_id: form.role === 'student' ? (form.class_id || null) : null,
          is_active: form.is_active,
          created_at: new Date().toISOString()
        });
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u) => {
    const supabase = createClient();
    await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id);
    fetchData();
  };

  const handleDelete = async (u) => {
    if (!confirm(`Hapus pengguna ${u.full_name || u.email}?`)) return;
    const supabase = createClient();
    await supabase.from('profiles').delete().eq('id', u.id);
    fetchData();
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Manajemen Seluruh Akun Pengguna</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Pusat kelola akun Guru, Siswa, dan Administrator sekolah
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
          <UserPlus size={16} /> Tambah Akun Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card card-padding" style={{ marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SearchInput placeholder="Cari nama pengguna atau email..." value={search} onChange={setSearch} />
        </div>

        <select
          className="form-input"
          style={{ width: 'auto', minWidth: 150 }}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="all">Semua Peran</option>
          <option value="student">Siswa</option>
          <option value="teacher">Guru</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState icon={Users} title="Data Pengguna Tidak Ditemukan" description="Tidak ada akun pengguna yang sesuai kriteria." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Pengguna</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Peran</th>
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
                        <span className="badge" style={{
                          background: u.role === 'admin' ? '#FEF2F2' : u.role === 'teacher' ? '#EDE9FE' : '#EFF6FF',
                          color: u.role === 'admin' ? '#DC2626' : u.role === 'teacher' ? '#7C3AED' : '#2563EB',
                          fontWeight: 700, textTransform: 'capitalize'
                        }}>
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
                            cursor: 'pointer'
                          }}
                        >
                          {isActive ? 'Aktif' : 'Non-aktif'}
                        </button>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenDetail(u)} className="btn btn-ghost btn-sm" title="Lihat Detail Rincian Akun">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleOpenModal(u)} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                            <Edit size={14} /> Edit
                          </button>
                          <button onClick={() => handleDelete(u)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
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
        </div>
      )}

      {/* Add / Edit User Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? `Edit Akun: ${editingUser.full_name}` : 'Tambah Akun Pengguna Baru'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!editingUser && (
            <div className="form-group">
              <label className="form-label" htmlFor="usr_email">Alamat Email *</label>
              <input id="usr_email" type="email" required className="form-input" placeholder="contoh: nama@sekolah.sch.id" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="usr_name">Nama Lengkap *</label>
            <input id="usr_name" type="text" required className="form-input" placeholder="Nama lengkap pengguna" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="usr_role">Peran (Role) *</label>
            <select id="usr_role" className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="student">Siswa (Student)</option>
              <option value="teacher">Guru (Teacher)</option>
              <option value="admin">Admin (Super Admin)</option>
            </select>
          </div>

          {form.role === 'student' && (
            <div className="form-group">
              <label className="form-label" htmlFor="usr_class">Pilih Kelas</label>
              <select id="usr_class" className="form-input" value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
                <option value="">-- Tanpa Kelas --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
            {saving ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Buat Akun Baru')}
          </button>
        </form>
      </Modal>

      {/* User Detail Modal */}
      <Modal open={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Rincian Detail Akun Pengguna">
        {detailUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <Avatar name={detailUser.full_name || detailUser.email} src={detailUser.avatar_url} size={54} />
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{detailUser.full_name || 'Tanpa Nama'}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{detailUser.email}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                    {detailUser.role}
                  </span>
                  <span style={{ fontSize: 12, color: detailUser.is_active !== false ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
                    ● {detailUser.is_active !== false ? 'Akun Aktif' : 'Non-aktif'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>ID Pengguna:</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)' }}>{detailUser.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Kelas Assigned:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{detailUser.classes?.name || 'Tanpa Kelas'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Terdaftar Sejak:</span>
                <span style={{ color: 'var(--text-primary)' }}>{new Date(detailUser.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Status Enkripsi Password:</span>
                <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Lock size={14} /> Terenkripsi Supabase Auth (Argon2/Bcrypt)
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
