'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';

export function Footer() {
  const { t } = useLanguage();
  const footerLinks = [
    {
      title: t('common:company'),
      links: [
        { name: t('common:about'), href: '/about' },
        { name: t('common:careers'), href: '/careers' },
        { name: t('common:contact'), href: '/contact' },
      ],
    },
    {
      title: t('common:support'),
      links: [
        { name: t('common:help'), href: '/help' },
        { name: t('common:privacy'), href: '/privacy' },
        { name: t('common:terms'), href: '/terms' },
      ],
    },
  ];

  return (
    <footer className="border-t border-secondary-200 bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="mb-4 flex items-center">
              <span className="text-2xl font-bold text-primary-600">
                FlipStaq
              </span>
            </Link>{' '}
            <p className="max-w-md text-sm text-secondary-600 dark:text-secondary-400">
              {t('common:welcome')}
            </p>
          </div>

          {/* Footer links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-secondary-900 dark:text-secondary-100">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-secondary-600 transition-colors duration-200 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-secondary-200 pt-8 dark:border-secondary-700">
          <p className="text-center text-sm text-secondary-600 dark:text-secondary-400">
            © {new Date().getFullYear()} FlipStaq. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
