import React from 'react';
import { 
  FileText, 
  FolderClock, 
  ShieldCheck, 
  Moon, 
  Sun, 
  Globe, 
  LayoutGrid,
  ChevronDown
} from 'lucide-react';

export default function Header({ 
  currentTab, 
  setCurrentTab, 
  lang, 
  setLang, 
  t, 
  isDark, 
  setIsDark 
}) {
  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-surface)]/95 backdrop-blur-md border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentTab('tools')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                iLove<span className="text-rose-500">PDF</span>
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                AYMEN
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] hidden sm:block">
              {t.app_subtitle}
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-2 bg-[var(--bg-surface-elevated)] p-1.5 rounded-xl border border-[var(--border-subtle)]">
          <button
            onClick={() => setCurrentTab('tools')}
            className={`p-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center md:gap-2 ${
              currentTab === 'tools'
                ? 'bg-[var(--bg-surface)] text-rose-500 shadow-sm border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={t.nav_tools}
          >
            <LayoutGrid className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">{t.nav_tools}</span>
          </button>

          <button
            onClick={() => setCurrentTab('my_files')}
            className={`p-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center md:gap-2 ${
              currentTab === 'my_files'
                ? 'bg-[var(--bg-surface)] text-rose-500 shadow-sm border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={t.nav_my_files}
          >
            <FolderClock className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">{t.nav_my_files}</span>
          </button>

          <button
            onClick={() => setCurrentTab('admin')}
            className={`p-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center md:gap-2 ${
              currentTab === 'admin'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={t.nav_admin}
          >
            <ShieldCheck className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">{t.nav_admin}</span>
          </button>
        </nav>

        {/* Controls: Language & Theme */}
        <div className="flex items-center gap-2.5">
          {/* Language Selector */}
          <div className="relative flex items-center bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-xl px-2 md:px-3 py-2 text-xs md:text-sm font-bold">
            <Globe className="w-4 h-4 text-[var(--text-tertiary)] md:mr-2 rtl:md:ml-2 rtl:md:mr-0" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Sélectionner la langue"
              className="bg-transparent text-[var(--text-primary)] outline-none cursor-pointer hidden md:block pr-1 rtl:pl-1 font-bold"
            >
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Sélectionner la langue"
              className="bg-transparent text-[var(--text-primary)] outline-none cursor-pointer block md:hidden font-bold ml-1 rtl:mr-1"
            >
              <option value="fr">FR</option>
              <option value="ar">AR</option>
              <option value="en">EN</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Changer le thème"
            className="w-10 h-10 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] hover:border-rose-500/40 transition-colors"
          >
            {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-700" />}
          </button>
        </div>

      </div>
    </header>
  );
}
