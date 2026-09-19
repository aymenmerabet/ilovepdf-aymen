import React from 'react';
import { FolderClock, Download, Eye, FileText, Sparkles } from 'lucide-react';
import { formatBytes } from '../translations';

export default function UserFiles({ files, t, onSelectTool }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] flex items-center gap-3">
            <FolderClock className="w-8 h-8 text-rose-500" />
            {t.my_files_title}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t.my_files_desc}
          </p>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">
            Aucun fichier traité pour le moment
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Utilisez l'un de nos outils pour fusionner, compresser ou convertir vos documents.
          </p>
          <button
            onClick={() => onSelectTool(null)}
            className="btn-primary text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Découvrir les outils</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="glass-panel p-5 flex items-center justify-between hover:border-rose-500/50 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-[var(--text-main)] truncate" title={file.filename}>
                    {file.filename}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                    <span>{formatBytes(file.size)}</span>
                    {file.pages && <span>• {file.pages} pages</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <a
                  href={file.download_url}
                  download={file.filename}
                  className="p-2 rounded-xl bg-[var(--bg-card-subtle)] text-[var(--text-main)] hover:bg-rose-500 hover:text-white transition-colors"
                  title="Télécharger"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
