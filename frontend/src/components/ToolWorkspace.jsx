import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Upload,
  FileText,
  Trash2,
  ArrowLeft,
  CheckCircle,
  Download,
  RotateCw,
  Lock,
  Layers,
  Sparkles,
  Sliders,
  MoveUp,
  MoveDown,
  Copy,
  Check
} from 'lucide-react';
import { formatBytes } from '../translations';

export default function ToolWorkspace({ tool, t, onBack, onFileProcessed }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [extractedText, setExtractedText] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Options
  const [compressLevel, setCompressLevel] = useState('medium');
  const [splitMode, setSplitMode] = useState('all');
  const [splitRanges, setSplitRanges] = useState('');
  const [password, setPassword] = useState('');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIEL');
  const [addPageNumbers, setAddPageNumbers] = useState(true);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [imageOrientation, setImageOrientation] = useState('portrait');
  const [pagesState, setPagesState] = useState([]);

  const fileInputRef = useRef(null);

  const handleFileUpload = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }

    try {
      setIsProcessing(true);
      setProgress(30);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setProgress(100);

      if (data.success) {
        if (tool.multiple) {
          setFiles(prev => [...prev, ...data.files]);
        } else {
          setFiles(data.files);
          if (tool.id === 'organize' && data.files[0]?.preview) {
            const pState = data.files[0].preview.map((p, idx) => ({
              page_index: idx,
              page_number: p.page_number,
              rotation: 0,
              keep: true,
              thumbnail: p.thumbnail
            }));
            setPagesState(pState);
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors du téléchargement des fichiers.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (index, direction) => {
    const newFiles = [...files];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIndex];
    newFiles[targetIndex] = temp;
    setFiles(newFiles);
  };

  const rotatePage = (index) => {
    setPagesState(prev => {
      const copy = [...prev];
      copy[index].rotation = (copy[index].rotation + 90) % 360;
      return copy;
    });
  };

  const toggleKeepPage = (index) => {
    setPagesState(prev => {
      const copy = [...prev];
      copy[index].keep = !copy[index].keep;
      return copy;
    });
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(20);

    try {
      let endpoint = '';
      let payload = {};

      if (tool.id === 'merge') {
        endpoint = '/api/tools/merge';
        payload = { file_ids: files.map(f => f.id) };
      } else if (tool.id === 'split') {
        endpoint = '/api/tools/split';
        payload = { file_id: files[0].id, mode: splitMode, ranges: splitRanges };
      } else if (tool.id === 'compress') {
        endpoint = '/api/tools/compress';
        payload = { file_id: files[0].id, level: compressLevel };
      } else if (tool.id === 'pdf_to_images') {
        endpoint = '/api/tools/pdf-to-images';
        payload = { file_id: files[0].id, format: 'png', dpi: 150 };
      } else if (tool.id === 'images_to_pdf') {
        endpoint = '/api/tools/images-to-pdf';
        payload = { file_ids: files.map(f => f.id), orientation: imageOrientation };
      } else if (tool.id === 'organize') {
        endpoint = '/api/tools/organize';
        payload = {
          file_id: files[0].id,
          page_actions: pagesState.map(p => ({
            page_index: p.page_index,
            rotation: p.rotation,
            keep: p.keep
          }))
        };
      } else if (tool.id === 'protect') {
        endpoint = '/api/tools/protect';
        payload = { file_id: files[0].id, password };
      } else if (tool.id === 'watermark') {
        endpoint = '/api/tools/watermark';
        payload = {
          file_id: files[0].id,
          watermark_text: watermarkText,
          add_page_numbers: addPageNumbers,
          opacity: watermarkOpacity
        };
      } else if (tool.id === 'extract_text') {
        endpoint = '/api/tools/extract-text';
        payload = { file_id: files[0].id };
      }

      setProgress(60);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setProgress(100);

      if (data.success) {
        if (tool.id === 'extract_text') {
          setExtractedText(data);
        } else {
          setResult(data);
          onFileProcessed && onFileProcessed(data);
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          } catch(e) {}
        }
      } else {
        alert(data.detail || 'Erreur lors du traitement.');
      }
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Icon = tool.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 pb-5 border-b border-[var(--border-subtle)]">
        <button
          onClick={onBack}
          className="btn-secondary text-xs sm:text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t.back_tools}</span>
        </button>

        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: tool.color }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {tool.title}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {tool.description}
            </p>
          </div>
        </div>
      </div>

      {/* 1. SUCCESS VIEW */}
      {result ? (
        <div className="glass-panel p-8 sm:p-12 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-5 border border-emerald-500/20">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {t.success_title}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6">
            Votre document a été traité avec succès.
          </p>

          {/* Compressed stats */}
          {result.saved_percent !== undefined && (
            <div className="grid grid-cols-2 gap-3 mb-6 bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <div>
                <span className="text-xs text-[var(--text-tertiary)] uppercase font-semibold">Taille Initiale</span>
                <p className="text-base font-bold text-[var(--text-primary)] mt-0.5">{formatBytes(result.initial_size)}</p>
              </div>
              <div>
                <span className="text-xs text-[var(--text-tertiary)] uppercase font-semibold">Nouvelle Taille</span>
                <p className="text-base font-bold text-emerald-500 mt-0.5">
                  {formatBytes(result.final_size)} (-{result.saved_percent}%)
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href={result.download_url}
              download={result.filename}
              className="btn-primary w-full sm:w-auto text-sm py-3 px-6"
            >
              <Download className="w-4 h-4" />
              <span>{t.download_btn}</span>
            </a>

            <button
              onClick={() => {
                setResult(null);
                setFiles([]);
              }}
              className="btn-secondary w-full sm:w-auto py-3 px-5 text-sm"
            >
              <span>{t.back_tools}</span>
            </button>
          </div>
        </div>
      ) : extractedText ? (
        /* 2. TEXT EXTRACTION VIEW */
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Texte extrait ({extractedText.total_words} mots)</h3>
              <p className="text-xs text-[var(--text-secondary)]">{extractedText.total_pages} pages</p>
            </div>
            <button
              onClick={() => copyText(extractedText.pages.map(p => p.text).join('\n\n'))}
              className="btn-secondary text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier tout'}</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
            {extractedText.pages.map((p) => (
              <div key={p.page_number} className="bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
                <div className="text-xs font-bold text-rose-500 mb-1">Page {p.page_number}</div>
                <p className="text-xs sm:text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed font-mono">
                  {p.text || '(Aucun texte détecté)'}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={() => { setExtractedText(null); setFiles([]); }}
              className="btn-secondary text-xs"
            >
              {t.back_tools}
            </button>
          </div>
        </div>
      ) : (
        /* 3. UPLOAD & CONFIGURATION */
        <div className="space-y-6">
          
          {/* Dropzone */}
          {files.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`upload-dropzone ${isDragging ? 'active' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={tool.multiple}
                accept={tool.accepts}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-white shadow-md"
                style={{ backgroundColor: tool.color }}
              >
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                {t.drop_files_here}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-4">
                {t.or_browse}
              </p>
              <div className="inline-block px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-tertiary)]">
                {t.supported_formats}
              </div>
            </div>
          ) : (
            /* Files List */
            <div className="glass-panel p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">
                    Fichiers sélectionnés ({files.length})
                  </h4>
                  {tool.multiple && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-rose-500 hover:underline ml-2"
                    >
                      + Ajouter d'autres
                    </button>
                  )}
                </div>
                {tool.multiple && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={tool.accepts}
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                )}
              </div>

              {/* Uploaded File Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {files.map((file, idx) => (
                  <div
                    key={file.id}
                    className="bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border-subtle)] flex flex-col justify-between"
                  >
                    <div>
                      {file.preview && file.preview[0] && (
                        <div className="h-28 bg-white dark:bg-slate-900 rounded-lg mb-2.5 overflow-hidden flex items-center justify-center border border-[var(--border-subtle)]">
                          <img
                            src={file.preview[0].thumbnail}
                            alt="Preview"
                            className="h-full object-contain"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate" title={file.filename}>
                          {file.filename}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                        <span>{formatBytes(file.size)}</span>
                        {file.page_count > 0 && <span>{file.page_count} pages</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border-subtle)]">
                      {tool.multiple && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveFile(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-[var(--bg-surface)] disabled:opacity-30"
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveFile(idx, 1)}
                            disabled={idx === files.length - 1}
                            className="p-1 rounded hover:bg-[var(--bg-surface)] disabled:opacity-30"
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organize Visual Grid */}
          {tool.id === 'organize' && pagesState.length > 0 && (
            <div className="glass-panel p-5">
              <h4 className="font-bold text-sm text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                Gérer les pages ({pagesState.length} pages)
              </h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {pagesState.map((page, idx) => (
                  <div
                    key={idx}
                    className={`bg-[var(--bg-surface-elevated)] p-2 rounded-xl border text-center ${
                      page.keep ? 'border-[var(--border-subtle)]' : 'opacity-40 border-red-500/50'
                    }`}
                  >
                    <div className="h-24 bg-white dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center mb-1.5 border border-[var(--border-subtle)]">
                      <img
                        src={page.thumbnail}
                        alt={`Page ${page.page_number}`}
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                        className="h-full object-contain"
                      />
                    </div>
                    <div className="text-[11px] font-bold text-[var(--text-primary)] mb-1.5">
                      Page {page.page_number}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => rotatePage(idx)}
                        className="p-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:text-purple-500"
                        title="Pivoter 90°"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleKeepPage(idx)}
                        className={`p-1 rounded border ${
                          page.keep 
                            ? 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-red-500'
                            : 'bg-emerald-500 text-white'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options Panel */}
          {files.length > 0 && (
            <div className="glass-panel p-5">
              <h4 className="font-bold text-sm text-[var(--text-primary)] mb-3.5 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-500" />
                Paramètres
              </h4>

              {/* Compress options */}
              {tool.id === 'compress' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'high', title: 'Maximale', desc: 'Taille minimale' },
                    { id: 'medium', title: 'Recommandée', desc: 'Idéal équilibre' },
                    { id: 'low', title: 'Légère', desc: 'Haute fidélité' }
                  ].map(lvl => (
                    <div
                      key={lvl.id}
                      onClick={() => setCompressLevel(lvl.id)}
                      className={`p-3 rounded-xl border cursor-pointer ${
                        compressLevel === lvl.id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]'
                      }`}
                    >
                      <div className="font-bold text-xs text-[var(--text-primary)]">{lvl.title}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">{lvl.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Split options */}
              {tool.id === 'split' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSplitMode('all')}
                      className={`flex-1 p-2.5 rounded-xl border text-xs font-bold ${
                        splitMode === 'all'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]'
                      }`}
                    >
                      {t.split_all}
                    </button>
                    <button
                      onClick={() => setSplitMode('ranges')}
                      className={`flex-1 p-2.5 rounded-xl border text-xs font-bold ${
                        splitMode === 'ranges'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]'
                      }`}
                    >
                      {t.split_ranges}
                    </button>
                  </div>

                  {splitMode === 'ranges' && (
                    <input
                      type="text"
                      placeholder={t.ranges_placeholder}
                      value={splitRanges}
                      onChange={(e) => setSplitRanges(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs"
                    />
                  )}
                </div>
              )}

              {/* Protect options */}
              {tool.id === 'protect' && (
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
                  <input
                    type="password"
                    placeholder={t.password_placeholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs"
                  />
                </div>
              )}

              {/* Watermark options */}
              {tool.id === 'watermark' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={t.watermark_placeholder}
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="numCheck"
                      checked={addPageNumbers}
                      onChange={(e) => setAddPageNumbers(e.target.checked)}
                      className="w-4 h-4 text-cyan-500 rounded"
                    />
                    <label htmlFor="numCheck" className="text-xs font-semibold text-[var(--text-primary)]">
                      {t.add_numbers}
                    </label>
                  </div>
                </div>
              )}

              {/* Images to PDF options */}
              {tool.id === 'images_to_pdf' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setImageOrientation('portrait')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                      imageOrientation === 'portrait'
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {t.portrait}
                  </button>
                  <button
                    onClick={() => setImageOrientation('landscape')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                      imageOrientation === 'landscape'
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {t.landscape}
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex justify-end">
                <button
                  onClick={handleProcess}
                  disabled={isProcessing || files.length === 0 || (tool.id === 'protect' && !password)}
                  className="btn-primary text-sm py-3 px-8"
                  style={{ backgroundColor: tool.color }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isProcessing ? t.processing : t.process_btn}</span>
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
