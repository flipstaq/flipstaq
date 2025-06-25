'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface EmojiPickerPortalProps {
  isVisible: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  triggerRef: React.RefObject<HTMLElement>;
  disabled?: boolean;
}

// Emoji categories and data (copied from MessageInput)
const emojiCategories = {
  smileys: {
    name: '😊 Smileys',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '😂',
      '🤣',
      '😊',
      '😇',
      '🙂',
      '🙃',
      '😉',
      '😌',
      '😍',
      '🥰',
      '😘',
      '😗',
      '😙',
      '😚',
      '😋',
      '😛',
      '😝',
      '😜',
      '🤪',
      '🤨',
      '🧐',
      '🤓',
      '😎',
      '🤩',
      '🥳',
      '😏',
      '😒',
      '😞',
      '😔',
      '😟',
      '😕',
      '🙁',
      '☹️',
      '😣',
      '😖',
      '😫',
      '😩',
      '🥺',
      '😢',
      '😭',
      '😤',
      '😠',
      '😡',
      '🤬',
      '🤯',
      '😳',
      '🥵',
      '🥶',
      '😱',
      '😨',
      '😰',
      '😥',
      '😓',
      '🤗',
      '🤔',
      '🤭',
      '🤫',
      '🤥',
      '😶',
      '😐',
      '😑',
      '😬',
      '🙄',
      '😯',
      '😦',
      '😧',
      '😮',
      '😲',
      '🥱',
      '😴',
      '🤤',
      '😪',
      '😵',
      '🤐',
      '🥴',
      '🤢',
      '🤮',
      '🤧',
      '😷',
      '🤒',
      '🤕',
    ],
  },
  people: {
    name: '👥 People',
    emojis: [
      '👶',
      '🧒',
      '👦',
      '👧',
      '🧑',
      '👨',
      '👩',
      '🧓',
      '👴',
      '👵',
      '👨‍⚕️',
      '👩‍⚕️',
      '👨‍🎓',
      '👩‍🎓',
      '👨‍🏫',
      '👩‍🏫',
      '👨‍⚖️',
      '👩‍⚖️',
      '👨‍🌾',
      '👩‍🌾',
      '👨‍🍳',
      '👩‍🍳',
      '👨‍🔧',
      '👩‍🔧',
      '👨‍🏭',
      '👩‍🏭',
      '👨‍💼',
      '👩‍💼',
      '👨‍🔬',
      '👩‍🔬',
      '👨‍💻',
      '👩‍💻',
      '👨‍🎤',
      '👩‍🎤',
      '👨‍🎨',
      '👩‍🎨',
      '👨‍✈️',
      '👩‍✈️',
      '👨‍🚀',
      '👩‍🚀',
      '👨‍🚒',
      '👩‍🚒',
      '👮',
      '👮‍♂️',
      '👮‍♀️',
      '🕵️',
      '🕵️‍♂️',
      '🕵️‍♀️',
      '💂',
      '💂‍♂️',
      '💂‍♀️',
      '👷',
      '👷‍♂️',
      '👷‍♀️',
      '🤴',
      '👸',
      '👳',
      '👳‍♂️',
      '👳‍♀️',
      '👲',
      '🧕',
      '🤵',
      '👰',
      '🤰',
      '🤱',
      '👼',
      '🎅',
      '🤶',
      '🦸',
      '🦸‍♂️',
      '🦸‍♀️',
      '🦹',
      '🦹‍♂️',
      '🦹‍♀️',
      '🧙',
      '🧙‍♂️',
      '🧙‍♀️',
      '🧚',
      '🧚‍♂️',
      '🧚‍♀️',
      '🧛',
      '🧛‍♂️',
      '🧛‍♀️',
      '🧜',
      '🧜‍♂️',
      '🧜‍♀️',
      '🧝',
      '🧝‍♂️',
      '🧝‍♀️',
    ],
  },
  nature: {
    name: '🌿 Nature',
    emojis: [
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐨',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐸',
      '🐵',
      '🙈',
      '🙉',
      '🙊',
      '🐒',
      '🐔',
      '🐧',
      '🐦',
      '🐤',
      '🐣',
      '🐥',
      '🦆',
      '🦅',
      '🦉',
      '🦇',
      '🐺',
      '🐗',
      '🐴',
      '🦄',
      '🐝',
      '🐛',
      '🦋',
      '🐌',
      '🐞',
      '🐜',
      '🦟',
      '🦗',
      '🕷️',
      '🕸️',
      '🦂',
      '🐢',
      '🐍',
      '🦎',
      '🦖',
      '🦕',
      '🐙',
      '🦑',
      '🦐',
      '🦞',
      '🦀',
      '🐡',
      '🐠',
      '🐟',
      '🐬',
      '🐳',
      '🐋',
      '🦈',
      '🐊',
      '🐅',
      '🐆',
      '🦓',
      '🦍',
      '🦧',
      '🐘',
      '🦛',
      '🦏',
      '🐪',
      '🐫',
      '🦒',
      '🦘',
      '🐃',
      '🐂',
      '🐄',
      '🐎',
      '🐖',
      '🐏',
      '🐑',
      '🦙',
      '🐐',
      '🦌',
      '🐕',
      '🐩',
      '🦮',
      '🐕‍🦺',
      '🐈',
      '🐓',
      '🦃',
      '🦚',
      '🦜',
      '🦢',
      '🦩',
      '🕊️',
      '🐇',
      '🦝',
      '🦨',
      '🦡',
      '🦦',
      '🦥',
      '🐁',
      '🐀',
      '🐿️',
      '🦔',
    ],
  },
  symbols: {
    name: '💖 Symbols',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '�',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '�',
      '�',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '☮️',
      '✝️',
      '☪️',
      '🕉️',
      '☸️',
      '✡️',
      '🔯',
      '🕎',
      '☯️',
      '☦️',
      '🛐',
      '⭐',
      '🌟',
      '💫',
      '⚡',
      '🔥',
      '💥',
      '☄️',
      '💢',
      '💨',
      '💦',
      '💤',
      '🕳️',
      '🎉',
      '🎊',
      '🎈',
      '🎁',
      '🎀',
      '🎗️',
      '🎟️',
      '🎫',
      '🏆',
      '🏅',
      '🥇',
      '🥈',
      '🥉',
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🏓',
      '🏸',
      '🏒',
      '🏑',
      '🥍',
      '🏏',
      '⛳',
      '🏹',
      '🎣',
      '🥊',
      '🥋',
      '🎽',
      '⛸️',
      '🥌',
      '�',
      '�',
      '🎿',
      '⛷️',
      '🏂',
      '🏋️‍♀️',
      '🏋️',
      '🏋️‍♂️',
      '🤼‍♀️',
      '🤼',
      '🤼‍♂️',
    ],
  },
};

export default function EmojiPickerPortal({
  isVisible,
  onClose,
  onEmojiSelect,
  triggerRef,
  disabled = false,
}: EmojiPickerPortalProps) {
  const { t } = useLanguage();
  const pickerRef = useRef<HTMLDivElement>(null);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose, triggerRef]);

  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  const calculatePosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 };

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const pickerWidth = 320; // Width for full emoji picker
    const pickerHeight = 400; // Height for full emoji picker

    // Calculate position to ensure picker stays within viewport
    let left = triggerRect.left;
    let top = triggerRect.top - pickerHeight - 8; // 8px gap

    // Adjust horizontal position if picker would overflow
    if (left + pickerWidth > window.innerWidth) {
      left = triggerRect.right - pickerWidth;
    }
    if (left < 0) {
      left = 8; // Small padding from edge
    }

    // Adjust vertical position if picker would overflow at top
    if (top < 0) {
      top = triggerRect.bottom + 8; // Place below trigger instead
    }

    // Final check if still overflowing at bottom
    if (top + pickerHeight > window.innerHeight) {
      top = window.innerHeight - pickerHeight - 8;
    }

    return { top, left };
  };

  if (!isVisible) return null;

  const position = calculatePosition();

  return createPortal(
    <div
      ref={pickerRef}
      className="max-h-96 w-80 overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-2xl dark:border-secondary-700 dark:bg-secondary-800"
      style={{
        position: 'fixed',
        zIndex: 999999,
        top: `${position.top}px`,
        left: `${position.left}px`,
        backdropFilter: 'blur(1px)',
      }}
    >
      {/* Emoji picker header */}
      <div className="flex items-center justify-between border-b border-secondary-200 p-4 dark:border-secondary-700">
        <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
          {t('chat:choose_emoji')}
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-red-600 transition-all duration-200 hover:scale-105 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex overflow-x-auto border-b border-secondary-200 bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-800">
        {Object.entries(emojiCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setActiveEmojiCategory(key)}
            disabled={disabled}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
              activeEmojiCategory === key
                ? 'border-b-2 border-primary-600 bg-white text-primary-600 dark:bg-secondary-700 dark:text-primary-400'
                : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="max-h-64 overflow-y-auto p-2">
        <div className="grid grid-cols-8 gap-1">
          {emojiCategories[
            activeEmojiCategory as keyof typeof emojiCategories
          ]?.emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiSelect(emoji)}
              disabled={disabled}
              className="flex items-center justify-center rounded-lg p-2 text-xl transition-colors hover:bg-secondary-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-secondary-700"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
