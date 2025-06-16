'use client';

import React from 'react';
import Link from 'next/link';
import {
  Moon,
  Sun,
  Languages,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="border-b border-secondary-200 bg-white shadow-sm dark:border-secondary-700 dark:bg-secondary-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">
                FlipStaq
              </span>
            </Link>
          </div>
          {/* Desktop Navigation - Removed for cleaner design */}
          <div className="hidden md:block">
            {/* Navigation space reserved for future features */}
          </div>
          {/* Right side controls */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg bg-secondary-100 p-2 text-secondary-700 transition-colors duration-200 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700"
              aria-label={
                theme === 'light' ? t('common:darkMode') : t('common:lightMode')
              }
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 rounded-lg bg-secondary-100 p-2 text-secondary-700 transition-colors duration-200 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700 rtl:space-x-reverse"
              aria-label={t('common:language')}
            >
              <Languages className="h-5 w-5" />
              <span className="text-sm font-medium">
                {language === 'en' ? 'EN' : 'ع'}
              </span>
            </button>
            {/* Auth Section */}
            <div className="hidden items-center space-x-2 md:flex rtl:space-x-reverse">
              {isAuthenticated ? (
                <div className="relative flex items-center space-x-3 rtl:space-x-reverse">
                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() =>
                        setIsProfileDropdownOpen(!isProfileDropdownOpen)
                      }
                      className="flex items-center space-x-2 rounded-lg bg-secondary-100 px-3 py-2 text-sm text-secondary-700 transition-colors duration-200 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700 rtl:space-x-reverse"
                    >
                      <User className="h-4 w-4" />
                      <span>
                        {user?.firstName} {user?.lastName}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-secondary-800 dark:ring-secondary-700 rtl:left-0 rtl:right-auto">
                        <Link
                          href="/#post-product"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            // Scroll to product form if on homepage, or navigate to homepage
                            const productForm =
                              document.getElementById('post-product');
                            if (productForm) {
                              productForm.scrollIntoView({
                                behavior: 'smooth',
                              });
                            }
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700 rtl:space-x-reverse"
                        >
                          <Plus className="h-4 w-4" />
                          <span>{t('common:postProduct')}</span>
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700 rtl:space-x-reverse"
                        >
                          <User className="h-4 w-4" />
                          <span>{t('common:myProfile')}</span>
                        </Link>
                        <hr className="my-1 border-secondary-200 dark:border-secondary-600" />
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileDropdownOpen(false);
                          }}
                          className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-700 rtl:space-x-reverse"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{t('common:logout')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/auth/signup" className="btn-primary">
                    {t('common:signUp')}
                  </Link>
                  <Link href="/auth/signin" className="btn-secondary">
                    {t('common:signIn')}
                  </Link>
                </>
              )}
            </div>
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg bg-secondary-100 p-2 text-secondary-700 transition-colors duration-200 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700 md:hidden"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="border-t border-secondary-200 py-4 dark:border-secondary-700 md:hidden">
            <div className="space-y-2">
              {/* Mobile Auth Section */}
              <div className="space-y-2">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2 rounded-lg bg-secondary-100 px-4 py-2 dark:bg-secondary-800 rtl:space-x-reverse">
                      <User className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        {user?.firstName} {user?.lastName}
                      </span>
                    </div>
                    <Link
                      href="/#post-product"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        // Scroll to product form if on homepage
                        setTimeout(() => {
                          const productForm =
                            document.getElementById('post-product');
                          if (productForm) {
                            productForm.scrollIntoView({ behavior: 'smooth' });
                          }
                        }, 100);
                      }}
                      className="btn-primary block w-full text-center"
                    >
                      <Plus className="mr-1 inline h-4 w-4" />
                      {t('common:postProduct')}
                    </Link>
                    <Link
                      href="/profile"
                      className="btn-secondary block w-full text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="mr-1 inline h-4 w-4" />
                      {t('common:myProfile')}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="btn-secondary block w-full text-center"
                    >
                      <LogOut className="mr-1 inline h-4 w-4" />
                      {t('common:logout')}
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/auth/signup"
                      className="btn-primary block text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('common:signUp')}
                    </Link>
                    <Link
                      href="/auth/signin"
                      className="btn-secondary block text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('common:signIn')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
