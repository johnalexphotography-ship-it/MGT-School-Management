import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('mgt_language') || 'mm';
  });

  useEffect(() => {
    localStorage.setItem('mgt_language', language);
    document.documentElement.lang = language === 'mm' ? 'my' : 'en';
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'mm' ? 'en' : 'mm');
  };

  const changeLanguage = (lang) => {
    if (lang === 'mm' || lang === 'en') setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};