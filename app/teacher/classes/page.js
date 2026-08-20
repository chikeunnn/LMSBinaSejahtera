'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { School, Plus, Edit, Trash2, Key, CheckCircle2, Sparkles } from 'lucide-react';

export default function TeacherClassesPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [classes, setClasses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState({ name: '', grade: 7, code: '', academic_year: '2026/2027' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data } = await supabase
        .from('classes')
        .select('*')
        .order('grade', { ascending: true })
        .order('name', { ascending: true });

      const uniqueMap = new Map();
      (data || []).forEach(c => {
        const cleanName = c.name?.trim();
        if (cleanName && !uniqueMap.has(cleanName)) {
          const defaultCode = `K${c.grade || 7}${cleanName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'BS'}-2026`;
          uniqueMap.set(cleanName, {
            ...c,
            code: c.code || defaultCode
          });
        }
      });

      setClasses(Array.from(uniqueMap.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenModal = (cls = null) => {
    if (cls) {
      setEditingClass(cls);
      setForm({ name: cls.name, grade: cls.grade, code: cls.code || '', academic_year: cls.academic_year || '2026/2027' });
    } else {
      setEditingClass(null);
      setForm({ name: '', grade: 7, code: '', academic_year: '2026/2027' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setMessage('');
    const supabase = createClient();

    const cleanName = form.name.trim();
    const classCode = form.code.trim().toUpperCase() || `K${form.grade}-${cleanName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;

    try {
      if (editingClass) {
        const { error } = await supabase.from('classes').update({
          name: cleanName,
          grade: parseInt(form.grade),
          code: classCode,
          academic_year: form.academic_year
        }).eq('id', editingClass.id);

        if (error) throw error;
        setMessage(`Berhasil memperbarui ${cleanName}!`);
      } else {
        const { error } = await supabase.from('classes').insert({
          name: cleanName,
          grade: parseInt(form.grade),
          code: classCode,
          academic_year: form.academic_year
        });

        if (error) throw error;
        setMessage(`Berhasil menambahkan ${cleanName} baru!`);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan kelas: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus kelas "${name}"? Siswa di kelas ini tidak akan terhapus, tetapi akan perlu memilih kelas baru.`)) return;
    const supabase = createClient();
    try {
      await supabase.from('classes').delete().eq('id', id);
      setMessage(`Kelas "${name}" berhasil dihapus.`);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus kelas: ' + e.message);
    }
  };

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <School size={24} color="var(--primary)" /> Kelola Kelas & Kode Gabung Siswa
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Buat kelas baru (7A - 9C atau kelas tambahan) dan bagikan Kode Kelas ke siswa Anda
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
          <Plus size={16} /> Buat Kelas Baru
        </button>
      </div>

      {message && (
        <div style={{ padding: 14, borderRadius: 10, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', marginBottom: 20, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Grid Kelas */}
      {loading ? (
        <div className="grid grid-3">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={School}
          title="Belum Ada Kelas"
          description="Klik tombol 'Buat Kelas Baru' di atas untuk mulai membuat kelas sekolah Anda."
        />
      ) : (
        <div className="grid grid-3">
          {classes.map(c => {
            const displayCode = c.code || `K${c.grade}-2026`;
            return (
              <div key={c.id} className="card card-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="badge badge-primary" style={{ fontSize: 11, fontWeight: 700 }}>
                      Tingkat Kelas {c.grade}
                    </span>
                    <button
                      onClick={() => handleCopyCode(displayCode, c.id)}
                      style={{
                        background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB',
                        padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                      }}
                      title="Salin Kode Kelas ini untuk dibagikan ke siswa"
                    >
                      <Key size={12} /> {copiedId === c.id ? 'Tersalin!' : `Kode: ${displayCode}`}
                    </button>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{c.name}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tahun Ajaran: {c.academic_year || '2026/2027'}</div>
                </div>

                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 16 }}>
                  <button onClick={() => handleOpenModal(c)} className="btn btn-outline btn-sm" style={{ flex: 1, gap: 4 }}>
                    <Edit size={14} /> Edit Data
                  </button>
                  <button onClick={() => handleDelete(c.id, c.name)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Edit / Tambah Kelas */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingClass ? 'Edit Kelas & Kode' : 'Tambah Kelas Baru'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="cls_name">Nama Kelas *</label>
            <input
              id="cls_name"
              type="text"
              required
              className="form-input"
              placeholder="Contoh: Kelas 7A, Kelas 7B, Kelas 7C, Kelas 8A"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cls_code">Kode Kelas Unik (Untuk Diberikan ke Siswa)</label>
            <input
              id="cls_code"
              type="text"
              className="form-input"
              placeholder="Contoh: K7A-2026, K7B-2026, K8A-2026"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              style={{ textTransform: 'uppercase', fontWeight: 700 }}
            />
          </div>

          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="cls_grade">Tingkat (Grade)</label>
              <select
                id="cls_grade"
                className="form-input"
                value={form.grade}
                onChange={e => setForm({ ...form, grade: e.target.value })}
              >
                <option value={7}>Kelas 7</option>
                <option value={8}>Kelas 8</option>
                <option value={9}>Kelas 9</option>
                <option value={10}>Kelas 10</option>
                <option value={11}>Kelas 11</option>
                <option value={12}>Kelas 12</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cls_year">Tahun Ajaran</label>
              <input
                id="cls_year"
                type="text"
                required
                className="form-input"
                value={form.academic_year}
                onChange={e => setForm({ ...form, academic_year: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
            {saving ? 'Menyimpan...' : 'Simpan Data Kelas'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
