import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  HardDrive,
  FileUp,
  FileCheck2,
  Activity,
  Trash2,
  Download,
  Eye,
  Search,
  RefreshCw,
  Server,
  CheckCircle,
  X
} from 'lucide-react';
import { formatBytes } from '../translations';

export default function AdminDashboard({ t }) {
  const [stats, setStats] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [previewFile, setPreviewFile] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      const filesRes = await fetch(`/api/admin/files?filter_type=${filterType}&search=${encodeURIComponent(search)}`);
      const filesData = await filesRes.json();
      if (filesData.success) {
        setFiles(filesData.files);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterType, search]);

  const handleDeleteFile = async (fileId, fileName) => {
    if (!window.confirm(`${t.delete_confirm}\n(${fileName})`)) return;
    
    try {
      const res = await fetch(`/api/admin/files/${fileId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Fichier "${fileName}" supprimé.`);
        fetchDashboardData();
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm(t.cleanup_confirm)) return;
    try {
      const res = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_age_hours: 24 })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        fetchDashboardData();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      alert('Erreur lors du nettoyage.');
    }
  };

  const toolBadgeColors = {
    merge: { label: 'Fusion PDF', bg: '#ffe4e6', color: '#e11d48' },
    split: { label: 'Division PDF', bg: '#dbeafe', color: '#2563eb' },
    compress: { label: 'Compression', bg: '#d1fae5', color: '#059669' },
    pdf_to_images: { label: 'PDF → Images', bg: '#fef3c7', color: '#d97706' },
    images_to_pdf: { label: 'Images → PDF', bg: '#ffedd5', color: '#ea580c' },
    organize: { label: 'Organisation', bg: '#f3e8ff', color: '#9333ea' },
    protect: { label: 'Sécurité & Lock', bg: '#e2e8f0', color: '#475569' },
    watermark: { label: 'Filigrane', bg: '#cffafe', color: '#0891b2' },
    extract_text: { label: 'Texte OCR', bg: '#e0e7ff', color: '#4f46e5' }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {t.admin_title}
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            {t.admin_subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn-secondary text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={handleCleanup}
            className="btn-danger text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.btn_cleanup}</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs sm:text-sm font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase">
              {t.stat_total_uploads}
            </span>
            <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">
              {stats?.total_uploads || 0}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Fichiers sources
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <FileUp className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase">
              {t.stat_total_processed}
            </span>
            <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">
              {stats?.total_processed || 0}
            </div>
            <div className="text-[11px] text-emerald-500 font-semibold mt-0.5">
              Opérations terminées
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase">
              {t.stat_storage_used}
            </span>
            <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">
              {formatBytes(stats?.total_storage_bytes || 0)}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Uploads ({formatBytes(stats?.uploads_storage_bytes || 0)})
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase">
              Moteur Backend
            </span>
            <div className="text-xl font-bold text-emerald-500 mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              En Ligne
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              FastAPI + PyMuPDF
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Tool Distribution */}
      {stats?.tool_usage && Object.keys(stats.tool_usage).length > 0 && (
        <div className="glass-panel p-5 mb-8">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" />
              Répartition des outils les plus utilisés
            </h3>
            <span className="text-xs text-[var(--text-tertiary)] font-semibold">
              Total : {stats.total_processed} opérations
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(stats.tool_usage).map(([toolKey, count]) => {
              const info = toolBadgeColors[toolKey] || { label: toolKey, bg: '#e2e8f0', color: '#475569' };
              const percent = stats.total_processed > 0 ? Math.round((count / stats.total_processed) * 100) : 0;
              return (
                <div key={toolKey} className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                  <div className="text-xs font-semibold text-[var(--text-secondary)] truncate mb-1">{info.label}</div>
                  <div className="text-base font-bold text-[var(--text-primary)]">{count} <span className="text-[11px] font-normal text-[var(--text-tertiary)]">({percent}%)</span></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="glass-panel overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-3.5">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {t.file_manager} ({files.length})
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Gestion de tous les fichiers hébergés sur le serveur.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            {/* Filter Tabs */}
            <div className="flex bg-[var(--bg-surface-elevated)] p-1 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold w-full sm:w-auto justify-center">
              {[
                { id: 'all', label: t.all_files },
                { id: 'uploads', label: t.uploads_only },
                { id: 'processed', label: t.processed_only }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filterType === tab.id
                      ? 'bg-[var(--bg-surface)] text-rose-500 shadow-sm border border-[var(--border-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] rtl:right-3 rtl:left-auto" />
              <input
                type="text"
                placeholder={t.search_placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Custom Table */}
        <div className="overflow-x-auto">
          {files.length === 0 ? (
            <div className="p-10 text-center text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
              {t.no_files_found}
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t.th_filename}</th>
                  <th>{t.th_tool}</th>
                  <th>{t.th_size}</th>
                  <th>{t.th_date}</th>
                  <th>{t.th_ip}</th>
                  <th className="text-right rtl:text-left">{t.th_actions}</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => {
                  const toolInfo = file.tool_used ? toolBadgeColors[file.tool_used] : null;
                  const dateStr = file.created_at ? new Date(file.created_at).toLocaleString('fr-FR') : '-';

                  return (
                    <tr key={file.id}>
                      <td>
                        <div className="flex items-center gap-2 max-w-xs">
                          <span 
                            className="w-2 h-2 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: file.is_processed ? '#10b981' : '#3b82f6' }}
                          ></span>
                          <span className="font-semibold text-xs sm:text-sm truncate text-[var(--text-primary)]" title={file.original_name}>
                            {file.original_name}
                          </span>
                        </div>
                      </td>

                      <td>
                        {toolInfo ? (
                          <span
                            className="status-badge"
                            style={{ backgroundColor: toolInfo.bg, color: toolInfo.color }}
                          >
                            {toolInfo.label}
                          </span>
                        ) : (
                          <span className="status-badge bg-blue-500/10 text-blue-600">
                            Upload Original
                          </span>
                        )}
                      </td>

                      <td className="text-xs font-mono text-[var(--text-secondary)]">
                        {formatBytes(file.size_bytes)}
                      </td>

                      <td className="text-xs text-[var(--text-tertiary)]">
                        {dateStr}
                      </td>

                      <td className="text-xs font-mono text-[var(--text-tertiary)]">
                        {file.client_ip || '127.0.0.1'}
                      </td>

                      <td className="text-right rtl:text-left">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <a
                            href={`/api/files/download/${file.id}`}
                            download={file.original_name}
                            className="p-1.5 rounded-lg bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:bg-rose-500 hover:text-white transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 rounded-lg bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:bg-blue-500 hover:text-white transition-colors"
                            title="Aperçu"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteFile(file.id, file.original_name)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[var(--text-primary)] truncate max-w-md">
                  {previewFile.original_name}
                </h4>
                <span className="text-xs text-[var(--text-tertiary)] font-mono">
                  ({formatBytes(previewFile.size_bytes)})
                </span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-950/80 flex items-center justify-center min-h-[400px]">
              {previewFile.file_type === 'pdf' ? (
                <iframe
                  src={`/api/files/preview/${previewFile.id}`}
                  className="w-full h-[600px] rounded-lg border-0 shadow-lg"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={`/api/files/preview/${previewFile.id}`}
                  alt="Preview"
                  className="max-h-[550px] object-contain rounded shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
