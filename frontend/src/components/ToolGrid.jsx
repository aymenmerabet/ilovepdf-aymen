import React, { useState } from 'react';
import {
  FilePlus,
  Scissors,
  Minimize2,
  Image as ImageIcon,
  FileImage,
  Layers,
  Lock,
  Stamp,
  FileText,
  Search,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  CheckCircle2
} from 'lucide-react';

export default function ToolGrid({ t, onSelectTool }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const tools = [
    {
      id: 'merge',
      title: t.merge_title,
      description: t.merge_desc,
      icon: FilePlus,
      category: 'organize',
      color: '#e11d48',
      bg: 'rgba(225, 29, 72, 0.1)',
      badge: 'Populaire',
      accepts: '.pdf',
      multiple: true
    },
    {
      id: 'split',
      title: t.split_title,
      description: t.split_desc,
      icon: Scissors,
      category: 'organize',
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.1)',
      accepts: '.pdf',
      multiple: false
    },
    {
      id: 'compress',
      title: t.compress_title,
      description: t.compress_desc,
      icon: Minimize2,
      category: 'optimize',
      color: '#059669',
      bg: 'rgba(5, 150, 105, 0.1)',
      badge: 'Ultra Rapide',
      accepts: '.pdf',
      multiple: false
    },
    {
      id: 'pdf_to_images',
      title: t.pdf_to_img_title,
      description: t.pdf_to_img_desc,
      icon: ImageIcon,
      category: 'convert',
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.1)',
      accepts: '.pdf',
      multiple: false
    },
    {
      id: 'images_to_pdf',
      title: t.img_to_pdf_title,
      description: t.img_to_pdf_desc,
      icon: FileImage,
      category: 'convert',
      color: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.1)',
      accepts: '.jpg,.jpeg,.png,.webp',
      multiple: true
    },
    {
      id: 'organize',
      title: t.organize_title,
      description: t.organize_desc,
      icon: Layers,
      category: 'organize',
      color: '#9333ea',
      bg: 'rgba(147, 51, 234, 0.1)',
      badge: 'Visuel',
      accepts: '.pdf',
      multiple: false
    },
    {
      id: 'protect',
      title: t.protect_title,
      description: t.protect_desc,
      icon: Lock,
      category: 'security',
      color: '#475569',
      bg: 'rgba(71, 85, 105, 0.1)',
      accepts: '.pdf',
      multiple: false
    },
    {
      id: 'watermark',
      title: t.watermark_title,
      description: t.watermark_desc,
      icon: Stamp,
      category: 'security',
      color: '#0891b2',
      bg: 'rgba(8, 145, 178, 0.1)',
      accepts: '.pdf',
      multiple: false
    },
    {
      id: 'extract_text',
      title: t.extract_title,
      description: t.extract_desc,
      icon: FileText,
      category: 'convert',
      color: '#4f46e5',
      bg: 'rgba(79, 70, 229, 0.1)',
      accepts: '.pdf',
      multiple: false
    }
  ];

  const categories = [
    { id: 'all', label: 'Tous les outils' },
    { id: 'organize', label: 'Organisation' },
    { id: 'optimize', label: 'Optimisation' },
    { id: 'convert', label: 'Conversion' },
    { id: 'security', label: 'Sécurité' },
  ];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-20 sm:pb-16">
      
      {/* Premium Backdrop Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

      {/* Hero Header Section */}
      <div className="relative text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm shadow-rose-500/5">
          <Sparkles className="w-4 h-4" />
          <span>Suite Professionnelle PDF</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--text-primary)] tracking-tight leading-[1.15] mb-5">
          Tous les outils PDF essentiels, <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-400">
            puissants et sans limite.
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto mb-10">
          {t.app_subtitle}
        </p>

        {/* Controls: Search and Category Pills in a Clean Container */}
        <div className="hero-controls-box">
          {/* Search Input */}
          <div className="search-input-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un outil..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-field"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="category-pills-row">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`category-pill-item ${activeCategory === cat.id ? 'active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Tools - 3 columns, perfectly uniform */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool)}
              className="tool-card group"
              style={{ '--card-accent': tool.color }}
            >
              <div>
                {/* Icon & Badge */}
                <div className="flex items-center justify-between w-full mb-4">
                  <div 
                    className="tool-icon-box"
                    style={{ backgroundColor: tool.bg, color: tool.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  {tool.badge && (
                    <span 
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: tool.bg, color: tool.color }}
                    >
                      {tool.badge}
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-rose-500 transition-colors mb-2">
                  {tool.title}
                </h3>
                
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                  {tool.description}
                </p>
              </div>

              {/* Card Bottom Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] w-full">
                <span className="text-xs font-semibold text-[var(--text-tertiary)] group-hover:text-rose-500 transition-colors">
                  Ouvrir l'outil
                </span>
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform"
                  style={{ backgroundColor: tool.bg, color: tool.color }}
                >
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Bar at bottom */}
      <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">Moteur Haute Vitesse</h4>
            <p className="text-[11px] text-[var(--text-secondary)]">Traitement immédiat propulsé par Python PyMuPDF.</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">100% Confidentiel & Sécurisé</h4>
            <p className="text-[11px] text-[var(--text-secondary)]">Vos documents restent stockés sur votre serveur local.</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">Qualité Inégalée</h4>
            <p className="text-[11px] text-[var(--text-secondary)]">Conservation parfaite des polices et mise en page.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
