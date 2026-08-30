import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from './en.json';
import hi from './hi.json';
import bn from './bn.json';
import ta from './ta.json';

export type LanguageCode = 'en' | 'hi' | 'bn' | 'ta';

export const LANGUAGES: { code: LanguageCode; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
];

const dictionaries: Record<LanguageCode, any> = { en, hi, bn, ta };

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (keyPath: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (keyPath: string, fallback?: string) => fallback || keyPath,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('nirantar_lang') as LanguageCode;
    return saved && ['en'].includes(saved) ? saved : 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('nirantar_lang', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (keyPath: string, fallback?: string): string => {
    const dict = dictionaries[language] || dictionaries.en;
    const parts = keyPath.split('.');
    let current: any = dict;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Fallback to English dictionary if key missing in target locale
        let enCurrent: any = dictionaries.en;
        for (const p of parts) {
          if (enCurrent && typeof enCurrent === 'object' && p in enCurrent) {
            enCurrent = enCurrent[p];
          } else {
            return fallback || keyPath;
          }
        }
        return typeof enCurrent === 'string' ? enCurrent : fallback || keyPath;
      }
    }
    return typeof current === 'string' ? current : fallback || keyPath;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
