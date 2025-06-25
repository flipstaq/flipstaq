'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface EditableMessageProps {
  messageId: string;
  initialContent: string;
  isEditing: boolean;
  onSave: (messageId: string, newContent: string) => Promise<void>;
  onCancel: () => void;
  maxLength?: number;
}

export default function EditableMessage({
  messageId,
  initialContent,
  isEditing,
  onSave,
  onCancel,
  maxLength = 1000,
}: EditableMessageProps) {
  const { t } = useLanguage();
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Focus and resize textarea when editing starts
  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
      // Auto-resize textarea
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  // Auto-resize textarea on content change
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError(t('chat:edit_content_required'));
      return;
    }

    if (content.trim() === initialContent.trim()) {
      onCancel();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(messageId, content.trim());
    } catch (err) {
      setError(t('chat:edit_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleCancel = () => {
    setContent(initialContent);
    setError(null);
    onCancel();
  };

  if (!isEditing) {
    return (
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
        {initialContent}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          ref={textAreaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-inherit placeholder-white/60 focus:border-white/40 focus:outline-none focus:ring-0"
          placeholder={t('chat:edit_message_placeholder')}
          disabled={isSaving}
          rows={1}
        />

        {/* Character counter */}
        <div className="absolute bottom-1 right-2 text-xs opacity-60">
          {content.length}/{maxLength}
        </div>
      </div>

      {/* Error message */}
      {error && <p className="text-xs text-red-300">{error}</p>}

      {/* Action buttons */}
      <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="flex items-center space-x-1 rounded-md px-2 py-1 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50 rtl:space-x-reverse"
        >
          <X className="h-3 w-3" />
          <span>{t('common:cancel')}</span>
        </button>

        <button
          onClick={handleSave}
          disabled={
            isSaving ||
            !content.trim() ||
            content.trim() === initialContent.trim()
          }
          className="flex items-center space-x-1 rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 disabled:opacity-50 rtl:space-x-reverse"
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          <span>{isSaving ? t('common:saving') : t('common:save')}</span>
        </button>
      </div>

      {/* Help text */}
      <p className="text-xs opacity-60">{t('chat:edit_help_text')}</p>
    </div>
  );
}
