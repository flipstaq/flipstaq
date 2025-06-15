import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Home,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}

const navItems: NavItem[] = [
  { href: '/admin', icon: Home, labelKey: 'dashboard' },
  { href: '/admin/users', icon: Users, labelKey: 'users' },
  { href: '/admin/products', icon: Package, labelKey: 'products' },
  { href: '/admin/orders', icon: ShoppingCart, labelKey: 'orders' },
  { href: '/admin/analytics', icon: BarChart3, labelKey: 'analytics' },
  { href: '/admin/settings', icon: Settings, labelKey: 'settings' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { t } = useTranslation('admin-common');
  const router = useRouter();

  const isActivePath = (href: string) => {
    if (href === '/admin') {
      return router.pathname === '/admin';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                FlipStaq Admin
              </h1>
            </div>
            <div className="mt-5 flex flex-grow flex-col">
              <nav className="flex-1 space-y-1 px-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          isActive
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        }`}
                      />
                      {t(`navigation.${item.labelKey}`)}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <div className="border-b border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 justify-between">
                <div className="flex items-center">
                  {/* Mobile menu button would go here */}
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Admin Panel
                  </h2>
                </div>
                <div className="flex items-center space-x-4">
                  {/* User menu, notifications, etc. would go here */}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Welcome, Admin
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
