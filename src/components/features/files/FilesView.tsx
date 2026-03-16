'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Sparkles, Search, X, FolderOpen } from 'lucide-react';
import { formatBytes, fileIcon, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

export function FilesView({ profile, initialFiles }: any) {
  const [files, setFiles] = useState(initialFiles);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [summarizingId, setSummarizingId] = useState<string|null>(null);
  const [selected, setSelected] = useState<any>(null);

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted[0]) return;
    const f = accepted[0];
    const plan = profile?.plan_tier || 'free';
    const maxMb = plan === 'pro' ? 200 : plan === 'plus' ? 50 : 10;
    if (f.size > maxMb * 1024 * 1024) { toast.error(`Max ${maxMb}MB for ${plan} plan`); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', f);
      const res = await fetch('/api/files/upload', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Upload failed'); return; }
      const { file } = await res.json();
      setFiles((p: any[]) => [file, ...p]);
      toast.success(`${f.name} uploaded!`);
    } finally { setUploading(false); }
  }, [profile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

  const summarize = async (fileId: string) => {
    setSummarizingId(fileId);
    try {
      const res = await fetch(`/api/files/${fileId}/summarize`, { method: 'POST' });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); return; }
      const { file } = await res.json();
      setFiles((p: any[]) => p.map(f => f.id === fileId ? file : f));
      if (selected?.id === fileId) setSelected(file);
      toast.success('Summary ready!');
    } finally { setSummarizingId(null); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this file?')) return;
    await fetch(`/api/files/${id}`, { method: 'DELETE' });
    setFiles((p: any[]) => p.filter(f => f.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success('Deleted');
  };

  const filtered = files.filter((f: any) => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Files</h1>
        <p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)' }}>{files.length} file{files.length !== 1 ? 's' : ''} · AI summaries available</p>
      </div>

      <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 18%)'}`, borderRadius: '14px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: isDragActive ? 'hsl(205 90% 48% / 0.05)' : 'transparent', transition: 'all 0.15s', marginBottom: '20px' }}>
        <input {...getInputProps()} />
        <Upload size={28} color={isDragActive ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 45%)'} style={{ margin: '0 auto 10px' }} />
        {uploading ? <p style={{ fontSize: '14px', fontWeight: 500 }}>Uploading…</p> : <><p style={{ fontSize: '14px', fontWeight: 500, color: 'hsl(0 0% 80%)' }}>{isDragActive ? 'Drop to upload' : 'Drop a file or click to browse'}</p><p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', marginTop: '4px' }}>PDF, DOCX, XLSX, PPTX, TXT, CSV · Max {profile?.plan_tier === 'pro' ? '200MB' : profile?.plan_tier === 'plus' ? '50MB' : '10MB'}</p></>}
      </div>

      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 50%)', pointerEvents: 'none' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…" style={{ paddingLeft: '32px' }} />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex' }}><X size={14} /></button>}
      </div>

      {filtered.length === 0 ? (
        <div className="empty" style={{ paddingTop: '48px' }}>
          <FolderOpen size={40} color="hsl(240 5% 35%)" />
          <p style={{ fontSize: '14px', color: 'hsl(240 5% 50%)' }}>{search ? 'No matching files' : 'No files uploaded yet'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {filtered.map((f: any) => (
            <div key={f.id} className="card card-hover" style={{ padding: '16px' }} onClick={() => setSelected(selected?.id === f.id ? null : f)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '32px' }}>{fileIcon(f.file_type)}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={e => { e.stopPropagation(); summarize(f.id); }} disabled={summarizingId === f.id} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'hsl(205, 90%, 60%)', display: 'flex' }} title="AI Summary"><Sparkles size={14} /></button>
                  <button onClick={e => { e.stopPropagation(); del(f.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'hsl(240 5% 50%)', display: 'flex' }}><Trash2 size={14} /></button>
                </div>
              </div>
              <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>{f.name}</p>
              <p style={{ fontSize: '11px', color: 'hsl(240 5% 50%)' }}>{formatBytes(f.size_bytes)}</p>
              <p style={{ fontSize: '10px', color: 'hsl(240 5% 40%)', marginTop: '3px' }}>{timeAgo(f.created_at)}</p>
              {f.ai_summary && <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid hsl(240 6% 14%)' }}><p style={{ fontSize: '11px', color: 'hsl(240 5% 55%)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{f.ai_summary}</p></div>}
              {summarizingId === f.id && <p style={{ fontSize: '11px', color: 'hsl(205, 90%, 60%)', marginTop: '6px' }}>Summarizing…</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
