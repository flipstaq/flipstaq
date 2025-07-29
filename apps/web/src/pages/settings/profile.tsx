import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  ArrowLeft,
  Camera,
  Edit2,
  Save,
  X,
  Upload,
  Trash2,
  User,
  Mail,
  Calendar,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export default function ProfileSettings() {
  const { user, refreshUser, isAuthenticated, loading } = useAuth();
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, loading, router]);

  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/me/avatar/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        await refreshUser();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setIsRemoving(true);
    try {
      const response = await fetch('/api/me/avatar/remove', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await refreshUser();
      } else {
        throw new Error('Remove failed');
      }
    } catch (error) {
      console.error('Avatar remove error:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleSaveField = async (field: string) => {
    // TODO: Implement field update API call
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
    });
    setEditingField(null);
  };

  const profileFields = [
    {
      key: 'firstName',
      label: t('settings:firstName'),
      value: formData.firstName,
      icon: User,
      editable: false, // Coming soon
    },
    {
      key: 'lastName',
      label: t('settings:lastName'),
      value: formData.lastName,
      icon: User,
      editable: false, // Coming soon
    },
    {
      key: 'username',
      label: t('settings:username'),
      value: formData.username,
      icon: User,
      editable: false, // Coming soon
    },
    {
      key: 'email',
      label: t('settings:email'),
      value: user?.email || '',
      icon: Mail,
      editable: false,
    },
    {
      key: 'createdAt',
      label: t('settings:memberSince'),
      value: user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString()
        : '',
      icon: Calendar,
      editable: false,
    },
  ];

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('settings:loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={`mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${isRTL ? 'space-y-8' : 'space-y-6'}`}
      >
        {/* Header */}
        <div className={`mb-6 sm:mb-8 ${isRTL ? 'space-y-6' : 'space-y-4'}`}>
          <button
            type="button"
            onClick={() => router.push('/settings')}
            className={`group mb-4 inline-flex items-center text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 sm:mb-6 ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}
          >
            <ArrowLeft
              className={`h-5 w-5 transition-transform group-hover:-translate-x-1 ${isRTL ? 'rotate-180' : ''}`}
            />
            <span>{isRTL ? 'العودة للإعدادات' : 'Back to Settings'}</span>
          </button>

          <div
            className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-6 space-x-reverse' : 'space-x-4'} sm:space-x-6`}
          >
            <div className="rounded-2xl bg-blue-500 p-3 sm:p-4">
              <User className="h-6 w-6 text-white sm:h-8 sm:w-8" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h1
                className={`text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl ${isRTL ? 'mb-2' : 'mb-1'}`}
              >
                {t('settings:profile')}
              </h1>
              <p
                className={`text-sm text-gray-600 dark:text-gray-400 sm:text-base ${isRTL ? 'leading-relaxed' : ''}`}
              >
                {t('settings:profileDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Avatar Section */}
          <div
            className={`rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 sm:p-8 ${isRTL ? 'space-y-6' : 'space-y-4'}`}
          >
            <div
              className={`mb-6 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <h2
                className={`text-lg font-semibold text-gray-900 dark:text-white sm:text-xl ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('settings:profilePicture')}
              </h2>
            </div>

            <div className="flex flex-col items-center space-y-6 sm:flex-row sm:items-start sm:space-x-0 sm:space-y-0">
              {/* Avatar Display */}
              <div
                className={`relative ${isRTL ? 'sm:order-2' : 'sm:order-1'}`}
              >
                <div
                  className={`relative mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700 sm:h-36 sm:w-36 ${isRTL ? 'sm:ml-8' : 'sm:mr-8'}`}
                >
                  <Avatar
                    src={user.avatarUrl}
                    size="2xl"
                    className="h-full w-full object-cover"
                  />
                  {(isUploading || isRemoving) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Avatar Controls */}
              <div
                className={`flex-1 space-y-4 ${isRTL ? 'sm:order-1' : 'sm:order-2'}`}
              >
                <div
                  className={`text-center ${isRTL ? 'sm:text-right' : 'sm:text-left'}`}
                >
                  <h3 className="text-base font-medium text-gray-900 dark:text-white sm:text-lg">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                    {isRTL ? `${user.username}@` : `@${user.username}`}
                  </p>
                </div>

                <div
                  className={`flex flex-col gap-3 sm:flex-row sm:gap-4 ${isRTL ? 'sm:justify-end' : 'sm:justify-start'}`}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isRemoving}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {user.avatarUrl
                      ? t('settings:changePhoto')
                      : t('settings:uploadPhoto')}
                  </button>

                  {user.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleAvatarRemove}
                      disabled={isUploading || isRemoving}
                      className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-600 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2
                        className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`}
                      />
                      {t('settings:removePhoto')}
                    </button>
                  )}
                </div>

                <p
                  className={`text-xs text-gray-500 dark:text-gray-400 sm:text-sm ${isRTL ? 'text-center sm:text-right' : 'text-center sm:text-left'}`}
                >
                  {t('settings:photoRecommendation')}
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Profile Information */}
          <div
            className={`rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800 ${isRTL ? 'space-y-8' : 'space-y-6'}`}
          >
            <div
              className={`mb-6 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <h2
                className={`text-xl font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t('settings:personalInformation')}
              </h2>
            </div>

            {/* Coming Soon Notice */}
            <div
              className={`mb-8 rounded-lg bg-yellow-50 p-5 dark:bg-yellow-900/20`}
            >
              <div
                className={`flex items-center ${isRTL ? 'space-x-3 space-x-reverse' : 'space-x-3'}`}
              >
                <Edit2 className="h-5 w-5 flex-shrink-0 text-yellow-500" />
                <p
                  className={`text-yellow-700 dark:text-yellow-400 ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  <strong>{t('settings:comingSoon')}:</strong>{' '}
                  {t('settings:profileEditingComingSoon')}
                </p>
              </div>
            </div>

            <div
              className={`grid gap-8 md:grid-cols-2 ${isRTL ? 'md:gap-10' : 'md:gap-6'}`}
            >
              {profileFields.map((field) => {
                const IconComponent = field.icon;
                const isEditing = editingField === field.key;

                return (
                  <div
                    key={field.key}
                    className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    <label
                      className={`flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}
                    >
                      <IconComponent className="h-4 w-4 flex-shrink-0" />
                      <span>{field.label}</span>
                    </label>

                    <div
                      className={`flex items-center ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}
                    >
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={formData[field.key as keyof typeof formData]}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                          />
                          <button
                            onClick={() => handleSaveField(field.key)}
                            className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="rounded-lg bg-gray-600 p-2 text-white hover:bg-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            {field.value || t('settings:notSet')}
                          </div>
                          {field.editable && (
                            <button
                              onClick={() => setEditingField(field.key)}
                              className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
