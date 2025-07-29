import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Shield,
  ArrowLeft,
  User,
  Bell,
  Globe,
  Lock,
  Mail,
  Palette,
  Download,
  Trash2,
} from 'lucide-react';

export default function SettingsPage() {
  const { t, isRTL } = useLanguage();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const settingsCards = [
    {
      id: 'profile',
      title: t('settings:profile'),
      description: t('settings:profileDescription'),
      icon: User,
      href: '/settings/profile',
      color: 'bg-blue-500',
      completed: true,
    },
    {
      id: 'security',
      title: t('settings:security'),
      description: t('settings:securityDescription'),
      icon: Shield,
      href: '/settings/security',
      color: 'bg-green-500',
      completed: true,
    },
    {
      id: 'notifications',
      title: t('settings:notifications'),
      description: t('settings:notificationsDescription'),
      icon: Bell,
      href: '/settings/notifications',
      color: 'bg-purple-500',
      completed: false,
    },
    {
      id: 'language',
      title: t('settings:languageRegion'),
      description: t('settings:languageRegionDescription'),
      icon: Globe,
      href: '/settings/language',
      color: 'bg-indigo-500',
      completed: false,
    },
    {
      id: 'privacy',
      title: t('settings:privacy'),
      description: t('settings:privacyDescription'),
      icon: Lock,
      href: '/settings/privacy',
      color: 'bg-red-500',
      completed: false,
    },
    {
      id: 'appearance',
      title: t('settings:appearance'),
      description: t('settings:appearanceDescription'),
      icon: Palette,
      href: '/settings/appearance',
      color: 'bg-pink-500',
      completed: false,
    },
  ];

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            type="button"
            onClick={() => router.push('/')}
            className={`group mb-4 inline-flex items-center text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 sm:mb-6 ${
              isRTL ? 'space-x-reverse' : ''
            }`}
          >
            <ArrowLeft
              className={`h-5 w-5 transition-transform group-hover:-translate-x-1 ${
                isRTL ? 'ml-2 rotate-180' : 'mr-2'
              }`}
            />
            {t('settings:quitSettings')}
          </button>

          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
                {t('settings:title')}
              </h1>
              <p className="mt-1 text-base text-gray-600 dark:text-gray-400 sm:mt-2 sm:text-lg">
                {t('settings:description')}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-8">
          {settingsCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                className={`group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-800 sm:p-8 ${
                  !card.completed
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer'
                }`}
                onClick={
                  !card.completed ? (e) => e.preventDefault() : undefined
                }
              >
                {/* Icon Background */}
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl sm:mb-6 sm:h-14 sm:w-14 ${card.color} text-white shadow-lg`}
                >
                  <IconComponent className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>

                {/* Content */}
                <div
                  className={`space-y-1 sm:space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <h3
                      className={`text-lg font-semibold text-gray-900 dark:text-white sm:text-xl ${isRTL ? 'text-right' : 'text-left'}`}
                    >
                      {card.title}
                    </h3>
                    {card.completed && (
                      <div
                        className={`rounded-full bg-green-100 p-1 dark:bg-green-900/30 ${isRTL ? 'mr-2' : 'ml-2'}`}
                      >
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      </div>
                    )}
                  </div>
                  <p
                    className={`text-sm text-gray-600 dark:text-gray-400 sm:text-base ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {card.description}
                  </p>
                </div>

                {/* Coming Soon Badge */}
                {!card.completed && (
                  <div
                    className={`absolute top-3 sm:top-4 ${isRTL ? 'left-3 sm:left-4' : 'right-3 sm:right-4'}`}
                  >
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      {t('settings:comingSoon')}
                    </span>
                  </div>
                )}

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 sm:mt-12">
          <h2
            className={`mb-4 text-xl font-bold text-gray-900 dark:text-white sm:mb-6 sm:text-2xl ${isRTL ? 'text-right' : 'text-left'}`}
          >
            {t('settings:quickActions')}
          </h2>
          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`relative flex items-center rounded-xl bg-white p-4 opacity-60 shadow-md dark:bg-gray-800 sm:p-5 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Download
                className={`h-4 w-4 text-blue-500 sm:h-5 sm:w-5 ${isRTL ? 'ml-3' : 'mr-3'}`}
              />
              <span
                className={`flex-1 text-sm text-gray-900 dark:text-white sm:text-base ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('settings:exportData')}
              </span>
              <span
                className={`absolute -top-2 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 ${isRTL ? '-left-2' : '-right-2'}`}
              >
                {t('settings:comingSoon')}
              </span>
            </div>
            <div
              className={`relative flex items-center rounded-xl bg-white p-4 opacity-60 shadow-md dark:bg-gray-800 sm:p-5 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Mail
                className={`h-4 w-4 text-green-500 sm:h-5 sm:w-5 ${isRTL ? 'ml-3' : 'mr-3'}`}
              />
              <span
                className={`flex-1 text-sm text-gray-900 dark:text-white sm:text-base ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('settings:contactSupport')}
              </span>
              <span
                className={`absolute -top-2 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 ${isRTL ? '-left-2' : '-right-2'}`}
              >
                {t('settings:comingSoon')}
              </span>
            </div>
            <div
              className={`relative flex items-center rounded-xl bg-white p-4 opacity-60 shadow-md dark:bg-gray-800 sm:p-5 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Lock
                className={`h-4 w-4 text-purple-500 sm:h-5 sm:w-5 ${isRTL ? 'ml-3' : 'mr-3'}`}
              />
              <span
                className={`flex-1 text-sm text-gray-900 dark:text-white sm:text-base ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('settings:twoFactorAuth')}
              </span>
              <span
                className={`absolute -top-2 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 ${isRTL ? '-left-2' : '-right-2'}`}
              >
                {t('settings:comingSoon')}
              </span>
            </div>
            <div
              className={`relative flex items-center rounded-xl bg-red-50 p-4 opacity-60 shadow-md dark:bg-red-900/20 sm:p-5 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Trash2
                className={`h-4 w-4 text-red-500 sm:h-5 sm:w-5 ${isRTL ? 'ml-3' : 'mr-3'}`}
              />
              <span
                className={`flex-1 text-sm text-red-600 dark:text-red-400 sm:text-base ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('settings:deleteAccount')}
              </span>
              <span
                className={`absolute -top-2 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 ${isRTL ? '-left-2' : '-right-2'}`}
              >
                {t('settings:comingSoon')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
