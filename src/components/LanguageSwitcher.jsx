import { useLanguage } from '../context/LanguageContext';
import { Globe, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher({ compact = false }) {
  const { language, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'mm', label: 'မြန်မာ', flag: '🇲🇲' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const current = languages.find(l => l.code === language);

  if (compact) {
    // Small icon-only version for sidebar
    return (
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition w-full"
          title={current?.label}
        >
          <Globe className="w-5 h-5 shrink-0" />
          <span className="text-sm">{current?.flag} {current?.label}</span>
        </button>

        {open && (
          <div className="absolute bottom-full left-0 mb-2 w-40 bg-white rounded-lg shadow-xl border py-1 z-50">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => { changeLanguage(lang.code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition ${
                  language === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.label}</span>
                {language === lang.code && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full version for header
  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition border border-gray-200"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{current?.flag} {current?.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-lg shadow-xl border py-1 z-50">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => { changeLanguage(lang.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition ${
                language === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1 text-left">{lang.label}</span>
              {language === lang.code && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}