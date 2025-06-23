import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Shield, ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const isSecurity = router.pathname === '/settings/security';

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Go Back Button (Back to site) */}
        <div className="mb-4 flex">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center text-secondary-600 hover:underline dark:text-secondary-300"
            style={{
              marginRight: isRTL ? 0 : 'auto',
              marginLeft: isRTL ? 'auto' : 0,
            }}
            aria-label={t('settings:quitSettings')}
          >
            <ArrowLeft className="mr-2 h-4 w-4 rtl:rotate-180" />
            {t('settings:quitSettings')}
          </button>
        </div>
        <h1 className="mb-8 text-3xl font-bold text-secondary-900 dark:text-secondary-100">
          {t('settings:title')}
        </h1>
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Sidebar */}
          <aside className="mb-6 w-full flex-shrink-0 md:mb-0 md:w-48">
            <nav className="flex flex-row gap-2 md:flex-col md:gap-0 md:space-y-2">
              <Link
                href="/settings/security"
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:w-auto ${isSecurity ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700'}`}
              >
                <Shield className="h-4 w-4" />
                {t('settings:security.title')}
              </Link>
            </nav>
          </aside>
          {/* Main Content */}
          <main className="flex flex-1 items-center justify-center rounded-lg bg-white p-4 shadow dark:bg-secondary-800 md:p-8">
            <span className="text-lg text-secondary-600 dark:text-secondary-300">
              {t('settings:comingSoon')}
            </span>
          </main>
        </div>
      </div>
    </div>
  );
}
