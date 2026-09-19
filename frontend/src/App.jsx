import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ToolGrid from './components/ToolGrid';
import ToolWorkspace from './components/ToolWorkspace';
import UserFiles from './components/UserFiles';
import AdminDashboard from './components/AdminDashboard';
import { translations } from './translations';
import { Heart, Sparkles, Shield, Cpu } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('tools'); // 'tools' | 'my_files' | 'admin'
  const [selectedTool, setSelectedTool] = useState(null);
  const [lang, setLang] = useState('fr'); // French is default as requested
  const [isDark, setIsDark] = useState(false);
  const [userFiles, setUserFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('ilovepdf_recent_files');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const t = translations[lang] || translations.fr;

  // RTL / LTR & Dark Mode Effects
  useEffect(() => {
    if (lang === 'ar') {
      document.body.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.body.dir = 'ltr';
      document.documentElement.lang = lang;
    }
  }, [lang]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    setCurrentTab('tools');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileProcessed = (newFile) => {
    const updated = [newFile, ...userFiles];
    setUserFiles(updated);
    try {
      localStorage.setItem('ilovepdf_recent_files', JSON.stringify(updated.slice(0, 30)));
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      
      {/* Top Navbar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'tools') setSelectedTool(null);
        }}
        lang={lang}
        setLang={setLang}
        t={t}
        isDark={isDark}
        setIsDark={setIsDark}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {currentTab === 'tools' && (
          selectedTool ? (
            <ToolWorkspace
              tool={selectedTool}
              t={t}
              onBack={() => setSelectedTool(null)}
              onFileProcessed={handleFileProcessed}
            />
          ) : (
            <ToolGrid
              t={t}
              onSelectTool={handleToolSelect}
            />
          )
        )}

        {currentTab === 'my_files' && (
          <UserFiles
            files={userFiles}
            t={t}
            onSelectTool={() => {
              setCurrentTab('tools');
              setSelectedTool(null);
            }}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard t={t} />
        )}
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] py-8 mt-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>© 2026 iLovePDF Aymen Suite</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Propulsé par <strong className="text-[var(--text-main)]">Python & PyMuPDF</strong>
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1 text-emerald-500 font-semibold">
              <Shield className="w-3.5 h-3.5" /> Chiffrement & Stockage Sécurisé
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Cpu className="w-3.5 h-3.5 text-rose-500" /> Traitement Haute Performance
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
