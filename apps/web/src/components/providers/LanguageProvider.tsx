'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getInitialLanguage, setDocumentDirection } from '@/lib/utils';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: any;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Translations;
  t: (
    key: string,
    variables?: Record<string, any>,
    namespace?: string
  ) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>({});
  const [mounted, setMounted] = useState(false);

  const isRTL = language === 'ar';

  useEffect(() => {
    const initialLanguage = getInitialLanguage();
    setLanguageState(initialLanguage);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadTranslations(language);
      setDocumentDirection(language);
      localStorage.setItem('language', language);
    }
  }, [language, mounted]);
  const loadTranslations = async (lang: Language) => {
    try {
      let translationData: Translations = {};
      if (lang === 'en') {
        // Import all English translations
        const [
          common,
          auth,
          home,
          products,
          errors,
          profile,
          dashboard,
          chat,
          adminCommon,
          adminUsers,
          adminProducts,
          adminReviews,
        ] = await Promise.all([
          import('../../../../../packages/locales/en/common.json'),
          import('../../../../../packages/locales/en/auth.json'),
          import('../../../../../packages/locales/en/home.json'),
          import('../../../../../packages/locales/en/products.json'),
          import('../../../../../packages/locales/en/errors.json'),
          import('../../../../../packages/locales/en/profile.json'),
          import('../../../../../packages/locales/en/dashboard.json'),
          import('../../../../../packages/locales/en/chat.json'),
          import('../../../../../packages/locales/en/admin/common.json'),
          import('../../../../../packages/locales/en/admin/users.json'),
          import('../../../../../packages/locales/en/admin/products.json'),
          import('../../../../../packages/locales/en/admin/reviews.json'),
        ]);
        translationData = {
          common: common.default,
          auth: auth.default,
          home: home.default,
          products: products.default,
          errors: errors.default,
          profile: profile.default,
          dashboard: dashboard.default,
          chat: chat.default,
          'admin-common': adminCommon.default,
          'admin-users': adminUsers.default,
          'admin-products': adminProducts.default,
          'admin-reviews': adminReviews.default,
        };
      } else if (lang === 'ar') {
        // Import all Arabic translations
        const [
          common,
          auth,
          home,
          products,
          errors,
          profile,
          dashboard,
          chat,
          adminCommon,
          adminUsers,
          adminProducts,
          adminReviews,
        ] = await Promise.all([
          import('../../../../../packages/locales/ar/common.json'),
          import('../../../../../packages/locales/ar/auth.json'),
          import('../../../../../packages/locales/ar/home.json'),
          import('../../../../../packages/locales/ar/products.json'),
          import('../../../../../packages/locales/ar/errors.json'),
          import('../../../../../packages/locales/ar/profile.json'),
          import('../../../../../packages/locales/ar/dashboard.json'),
          import('../../../../../packages/locales/ar/chat.json'),
          import('../../../../../packages/locales/ar/admin/common.json'),
          import('../../../../../packages/locales/ar/admin/users.json'),
          import('../../../../../packages/locales/ar/admin/products.json'),
          import('../../../../../packages/locales/ar/admin/reviews.json'),
        ]);
        translationData = {
          common: common.default,
          auth: auth.default,
          home: home.default,
          products: products.default,
          errors: errors.default,
          profile: profile.default,
          dashboard: dashboard.default,
          chat: chat.default,
          'admin-common': adminCommon.default,
          'admin-users': adminUsers.default,
          'admin-products': adminProducts.default,
          'admin-reviews': adminReviews.default,
        };
      }

      setTranslations(translationData);
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to English if loading fails
      if (lang !== 'en') {
        loadTranslations('en');
      }
    }
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };
  const t = (
    key: string,
    variables?: Record<string, any>,
    namespace?: string
  ): string => {
    // Handle colon-separated format like "admin/users:actions.viewDetails"
    let actualNamespace = namespace || 'common';
    let actualKey = key;

    if (key.includes(':')) {
      const [ns, k] = key.split(':');
      actualNamespace = ns.replace('/', '-'); // Convert admin/users to admin-users
      actualKey = k;
    } else if (key.includes('.') && !namespace) {
      // Handle dot-notation namespace prefix like "home.user_count_text"
      const parts = key.split('.');
      if (parts.length > 1 && translations[parts[0]]) {
        actualNamespace = parts[0];
        actualKey = parts.slice(1).join('.');
      }
    }

    const keys = actualKey.split('.');
    let value = translations[actualNamespace];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    let result = typeof value === 'string' ? value : key;

    // Handle variable interpolation
    if (variables && typeof result === 'string') {
      Object.keys(variables).forEach((varKey) => {
        const varValue = variables[varKey] ?? '';
        result = result.replace(new RegExp(`{{${varKey}}}`, 'g'), varValue);
      });
    }

    return result;
  };
  // Prevent hydration mismatch by providing a default context during SSR
  if (!mounted) {
    return (
      <LanguageContext.Provider
        value={{
          language: 'en',
          setLanguage: () => {},
          translations: {},
          t: (key: string) => key,
          isRTL: false,
        }}
      >
        <div>{children}</div>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, translations, t, isRTL }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
