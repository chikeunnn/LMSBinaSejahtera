'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { School, Plus, Edit, Trash2, RefreshCw, Sparkles, CheckCircle2, Key, Copy } from 'lucide-react';

export default function AdminClassesPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [classes, setClasses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState({ name: '', grade: 7, code: '', academic_year: '2026/2027' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!profile) return;
    fetchData();
    handleCleanDuplicates();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data } = await supabase.from('classes').select('*').order('grade', { ascending: true }).order('name', { ascending: true });
      
      const uniqueMap = new Map();
      (data || []).forEach(c => {
        const cleanName = c.name?.trim();
        if (cleanName && !uniqueMap.has(cleanName)) {
          // Generate class code if missing
          const defaultCode = `K${c.grade || 7}-${cleanName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'BS'}`;
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

  const handleCleanDuplicates = async () => {
    setCleaning(true);
    setMessage('');
    const supabase = createClient();
    try {
      const { data: allCls } = await supabase.from('classes').select('*');
      if (!allCls || allCls.length === 0) return;

      const seenNames = new Map();
      const duplicateIdsToDelete = [];

      for (const c of allCls) {
        const cleanName = c.name?.trim();
        if (!cleanName) continue;
        if (!seenNames.has(cleanName)) {
          seenNames.set(cleanName, c.id);
        } else {
          const keptId = seenNames.get(cleanName);
          await supabase.from('profiles').update({ class_id: keptId }).eq('class_id', c.id);
          duplicateIdsToDelete.push(c.id);
        }
      }

      if (duplicateIdsToDelete.length > 0) {
        for (const dupId of duplicateIdsToDelete) {
          await supabase.from('classes').delete().eq('id', dupId);
        }
        setMessage(`Berhasil menghapus ${duplicateIdsToDelete.length} data kelas duplikat! Database kini rapi.`);
      } else {
        setMessage('Daftar kelas sudah bersih dan tidak ada duplikat.');
      }
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setCleaning(false);
    }
  };

  const handleSeedStandardClasses = async () => {
    if (!confirm('Generasi daftar kelas standar resmi sekolah (Kelas 7A-7C, 8A-8C, 9A-9C)?')) return;
    const supabase = createClient();
    try {
      const standardClasses = [
        { name: 'Kelas 7A', grade: 7, code: 'K7A-2026', academic_year: '2026/2027' },
        { name: 'Kelas 7B', grade: 7, code: 'K7B-2026', academic_year: '2026/2027' },
        { name: 'Kelas 7C', grade: 7, code: 'K7C-2026', academic_year: '2026/2027' },
        { name: 'Kelas 8A', grade: 8, code: 'K8A-2026', academic_year: '2026/2027' },
        { name: 'Kelas 8B', grade: 8, code: 'K8B-2026', academic_year: '2026/2027' },
        { name: 'Kelas 8C', grade: 8, code: 'K8C-2026', academic_year: '2026/2027' },
        { name: 'Kelas 9A', grade: 9, code: 'K9A-2026', academic_year: '2026/2027' },
        { name: 'Kelas 9B', grade: 9, code: 'K9B-2026', academic_year: '2026/2027' },
        { name: 'Kelas 9C', grade: 9, code: 'K9C-2026', academic_year: '2026/2027' }
      ];

      for (const cls of standardClasses) {
        const { data: existing } = await supabase.from('classes').select('id').eq('name', cls.name).maybeSingle();
        if (!existing) {
          await supabase.from('classes').insert(cls);
        }
      }
      handleCleanDuplicates();
    } catch (e) {
      console.error(e);
    }
  };

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
    const supabase = createClient();

    const classCode = form.code.trim().toUpperCase() || `K${form.grade}-${form.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;

    try {
      if (editingClass) {
        await supabase.from('classes').update({
          name: form.name.trim(),
          grade: parseInt(form.grade),
          code: classCode,
          academic_year: form.academic_year
        }).eq('id', editingClass.id);
      } else {
        await supabase.from('classes').insert({
          name: form.name.trim(),
          grade: parseInt(form.grade),
          code: classCode,
          academic_year: form.academic_year
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

  const handleDelete = async (id) => {
    if (!confirm('Hapus kelas ini?')) return;
    const supabase = createClient();
    await supabase.from('classes').delete().eq('id', id);
    fetchData();
  };

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Manajemen Kelas & Kode Gabung Siswa</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Kelola daftar kelas resmi dan Kode Kelas unik bagi siswa untuk bergabung ke kelasnya
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleCleanDuplicates} disabled={cleaning} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
            <Sparkles size={15} className={cleaning ? 'spin' : ''} />
            {cleaning ? 'Membersihkan...' : 'Bersihkan Duplikat'}
          </button>
          <button onClick={handleSeedStandardClasses} className="btn btn-outline btn-sm" style={{ gap: 6 }}>
            <RefreshCw size={15} /> Generasi Kelas 7, 8, 9
          </button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
            <Plus size={16} /> Tambah Kelas Baru
          </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: 14, borderRadius: 10, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', marginBottom: 20, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {loading ? (
        <div className="grid grid-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState icon={School} title="Belum Ada Kelas" description="Klik 'Generasi Kelas 7, 8, 9' di atas untuk membuat kelas standar otomatis." />
      ) : (
        <div className="grid grid-3">
          {classes.map(c => {
            const displayCode = c.code || `K${c.grade}-2026`;
            return (
              <div key={c.id} className="card card-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="badge badge-primary" style={{ fontSize: 11 }}>
                      Tingkat Kelas {c.grade}
                    </span>
                    <button
                      onClick={() => handleCopyCode(displayCode, c.id)}
                      style={{
                        background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB',
                        padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700,
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
                  <button onClick={() => handleOpenModal(c)} className="btn btn-secondary btn-sm" style={{ flex: 1, gap: 4 }}>
                    <Edit size={14} /> Edit Kode/Nama
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Class */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingClass ? 'Edit Kelas & Kode' : 'Tambah Kelas Baru'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="cls_name">Nama Kelas *</label>
            <input id="cls_name" type="text" required className="form-input" placeholder="Contoh: Kelas 7, Kelas 8, Kelas 9" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cls_code">Kode Kelas Unik (Untuk Gabung Siswa)</label>
            <input id="cls_code" type="text" className="form-input" placeholder="Contoh: K7-2026, K8-2026" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
          </div>

          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="cls_grade">Tingkat (Grade)</label>
              <input id="cls_grade" type="number" required className="form-input" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cls_year">Tahun Ajaran</label>
              <input id="cls_year" type="text" required className="form-input" value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} />
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
