'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { messageService } from '@/lib/messageService';

interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface MessageReactionsProps {
  messageId: string;
  reactions?: MessageReaction[];
  currentUserId: string;
  onEmojiSelect?: (emoji: string) => void;
  disabled?: boolean;
  showReactionButton?: boolean; // Show the reaction button (deprecated - kept for compatibility)
  showEmojiPicker?: boolean; // Force show the emoji picker (deprecated - kept for compatibility)
  onClose?: () => void; // Callback when picker should close (deprecated - kept for compatibility)
}

export default function MessageReactions({
  messageId,
  reactions = [],
  currentUserId,
  onEmojiSelect,
  disabled = false,
  showReactionButton = false, // Deprecated
  showEmojiPicker: forceShowEmojiPicker = false, // Deprecated
  onClose, // Deprecated
}: MessageReactionsProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  // Note: Emoji picker functionality has been moved to EmojiReactionButton component

  // Group reactions by emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    },
    {} as Record<string, MessageReaction[]>
  );

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
    // This function is deprecated - emoji selection is now handled by EmojiReactionButton
    if (onEmojiSelect) {
      onEmojiSelect(emoji);
    } else {
      await handleReactionClick(emoji);
    }
  };

  const getUserDisplayName = (user: MessageReaction['user']) => {
    return `${user.firstName} ${user.lastName}`.trim() || user.username;
  };

  // Check if current user has reacted with a specific emoji
  const hasUserReacted = (emoji: string) => {
    return (
      groupedReactions[emoji]?.some((r) => r.userId === currentUserId) || false
    );
  };

  // Show reactions that exist
  const hasReactions = Object.keys(groupedReactions).length > 0;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {/* Existing reactions */}
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const userReacted = hasUserReacted(emoji);
        const count = reactionList.length;
        const tooltipText = reactionList
          .map((r) => getUserDisplayName(r.user))
          .join(', ');

        return (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            disabled={disabled || isLoading}
            className={`
              inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs
              transition-all duration-200 hover:scale-105
              ${
                userReacted
                  ? 'border border-primary-300 bg-primary-100 text-primary-700 dark:border-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'border border-secondary-200 bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
              }
              ${disabled || isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
            title={tooltipText}
          >
            {' '}
            <span className="text-sm">{emoji}</span>
            {count > 1 && <span className="text-xs font-medium">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
