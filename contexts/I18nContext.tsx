import React, { createContext, useCallback, useContext, useMemo } from 'react';
import type { SupportedLanguage } from '../locales';
import { translations, fallbackLanguage } from '../locales';
import { usePreferencesStore } from '../stores/preferences';

type TranslationContextType = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

type TranslationNode = Record<string, any>;

const getValue = (language: SupportedLanguage, key: string): string | undefined => {
  const segments = key.split('.');
  let current: TranslationNode | string | undefined = translations[language];

  for (const segment of segments) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as TranslationNode)[segment];
  }

  return typeof current === 'string' ? current : undefined;
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language = usePreferencesStore((state) => state.userPrefs.language) as SupportedLanguage;
  const updateLanguage = usePreferencesStore((state) => state.updateLanguage);

  const t = useCallback(
    (key: string) => {
      const value = getValue(language, key) ?? getValue(fallbackLanguage, key);
      return value ?? key;
    },
    [language]
  );

  const setLanguage = useCallback(
    (next: SupportedLanguage) => {
      updateLanguage(next);
    },
    [updateLanguage]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
