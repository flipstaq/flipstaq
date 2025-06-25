'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Smile, Plus } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { messageService } from '@/lib/messageService';
import EmojiPickerPortal from './EmojiPickerPortal';

interface EmojiReactionButtonProps {
  messageId: string;
  onEmojiSelect?: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
  isVisible?: boolean; // Control visibility from parent (for context menu)
  onVisibilityChange?: (visible: boolean) => void; // Notify parent of visibility changes
}

export default function EmojiReactionButton({
  messageId,
  onEmojiSelect,
  disabled = false,
  className = '',
  isVisible: externallyControlled = false,
  onVisibilityChange,
}: EmojiReactionButtonProps) {
  const { t } = useLanguage();
  const [internalVisible, setInternalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if picker should be visible
  const isPickerVisible = externallyControlled || internalVisible;

  const handleReactionClick = async (emoji: string) => {
    if (disabled || isLoading) return;

    try {
      setIsLoading(true);
      await messageService.toggleReaction(messageId, emoji);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (onEmojiSelect) {
      onEmojiSelect(emoji);
    } else {
      await handleReactionClick(emoji);
    }
  };

  const handleTogglePicker = () => {
    const newVisible = !isPickerVisible;
    setInternalVisible(newVisible);
    onVisibilityChange?.(newVisible);
  };
  const handleClosePicker = () => {
    setInternalVisible(false);
    onVisibilityChange?.(false);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={handleTogglePicker}
          disabled={disabled || isLoading}
          className={`
            inline-flex h-8 w-8 items-center justify-center rounded-full
            text-secondary-500 transition-all duration-200
            hover:scale-105 hover:bg-secondary-100 hover:text-primary-600
            dark:text-secondary-400 dark:hover:bg-secondary-800 dark:hover:text-primary-400
            ${disabled || isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
          title={t('chat:add_emoji')}
        >
          {isPickerVisible ? (
            <Plus className="h-3 w-3 rotate-45" />
          ) : (
            <Smile className="h-3 w-3" />
          )}
        </button>
      </div>

      <EmojiPickerPortal
        isVisible={isPickerVisible}
        onClose={handleClosePicker}
        onEmojiSelect={handleEmojiSelect}
        triggerRef={buttonRef}
        disabled={disabled || isLoading}
      />
    </>
  );
}
