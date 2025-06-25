'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Flag, Copy, Trash2, Edit3, Reply } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import ReportModal from '../report/ReportModal';

interface MessageContextMenuProps {
  messageId: string;
  senderId: string;
  content?: string;
  createdAt: Date;
  isOwnMessage: boolean;
  editedAt?: Date;
  onDelete?: () => void;
  onEdit?: () => void;
  onReply?: () => void;
}

export default function MessageContextMenu({
  messageId,
  senderId,
  content,
  createdAt,
  isOwnMessage,
  editedAt,
  onDelete,
  onEdit,
  onReply,
}: MessageContextMenuProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleCopyMessage = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setIsOpen(false);
    }
  };

  const handleToggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 160;
      const menuHeight = 120;

      // Calculate position to ensure menu stays within viewport
      let left = buttonRect.left;
      let top = buttonRect.bottom + 4;

      // Adjust horizontal position if menu would overflow
      if (left + menuWidth > window.innerWidth) {
        left = buttonRect.right - menuWidth;
      }
      if (left < 0) {
        left = 8; // Small padding from edge
      }

      // Adjust vertical position if menu would overflow
      if (top + menuHeight > window.innerHeight) {
        top = buttonRect.top - menuHeight - 4;
      }
      if (top < 0) {
        top = 8; // Small padding from top
      }

      setMenuPosition({ top, left });
    }
    setIsOpen(!isOpen);
  };

  const handleReportMessage = () => {
    setIsReportModalOpen(true);
    setIsOpen(false);
  };
  const handleDeleteMessage = () => {
    onDelete?.();
    setIsOpen(false);
  };
  const handleEditMessage = () => {
    onEdit?.();
    setIsOpen(false);
  };

  const handleReplyMessage = () => {
    onReply?.();
    setIsOpen(false);
  };
  // Check if message can be edited (only text messages within 24 hours, not already edited)
  const canEdit =
    isOwnMessage &&
    content &&
    new Date().getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000;

  // Portal-based menu component
  const MenuPortal = () => {
    if (!mounted || !isOpen) return null;

    return createPortal(
      <div
        ref={menuRef}
        className="min-w-[140px] max-w-[200px] rounded-lg border border-secondary-200 bg-white py-1 shadow-xl dark:border-secondary-700 dark:bg-secondary-800"
        style={{
          position: 'fixed',
          zIndex: 999999,
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          // Add backdrop filter for better visual separation
          backdropFilter: 'blur(1px)',
        }}
      >
        {' '}
        <button
          onClick={handleReplyMessage}
          className="flex w-full items-center space-x-2 px-3 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 dark:text-secondary-300 dark:hover:bg-secondary-700 rtl:space-x-reverse"
        >
          <Reply className="h-4 w-4" />
          <span>{t('chat:reply')}</span>
        </button>
        {content && (
          <button
            onClick={handleCopyMessage}
            className="flex w-full items-center space-x-2 px-3 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 dark:text-secondary-300 dark:hover:bg-secondary-700 rtl:space-x-reverse"
          >
            <Copy className="h-4 w-4" />
            <span>{t('common:copy')}</span>
          </button>
        )}
        {canEdit && onEdit && (
          <button
            onClick={handleEditMessage}
            className="flex w-full items-center space-x-2 px-3 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 dark:text-secondary-300 dark:hover:bg-secondary-700 rtl:space-x-reverse"
          >
            <Edit3 className="h-4 w-4" />
            <span>{t('chat:edit_message')}</span>
          </button>
        )}
        {!isOwnMessage && user?.id && (
          <button
            onClick={handleReportMessage}
            className="flex w-full items-center space-x-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rtl:space-x-reverse"
          >
            <Flag className="h-4 w-4" />
            <span>{t('report:report_message')}</span>
          </button>
        )}
        {isOwnMessage && onDelete && (
          <button
            onClick={handleDeleteMessage}
            className="flex w-full items-center space-x-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rtl:space-x-reverse"
          >
            <Trash2 className="h-4 w-4" />
            <span>{t('common:delete')}</span>
          </button>
        )}
      </div>,
      document.body
    );
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggleMenu}
        className="rounded-md p-1 opacity-0 transition-opacity duration-200 hover:bg-black/10 group-hover:opacity-100 hover:dark:bg-white/10"
        title={t('common:more_options')}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      <MenuPortal />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        type="MESSAGE"
        targetId={messageId}
        targetData={{
          messageContent:
            content?.substring(0, 50) +
            (content && content.length > 50 ? '...' : ''),
        }}
      />
    </>
  );
}
