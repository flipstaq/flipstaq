'use client';

import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface EmojiPickerPortalProps {
  isVisible: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  triggerRef: React.RefObject<HTMLElement>;
  disabled?: boolean;
}

// Simple emoji list
const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export default function EmojiPickerPortal({
  isVisible,
  onClose,
  onEmojiSelect,
  triggerRef,
  disabled = false,
}: EmojiPickerPortalProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

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
    const pickerWidth = 240; // Approximate width of emoji picker
    const pickerHeight = 60; // Approximate height of emoji picker

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
      className="rounded-lg border border-secondary-200 bg-white p-2 shadow-xl dark:border-secondary-700 dark:bg-secondary-800"
      style={{
        position: 'fixed',
        zIndex: 999999,
        top: `${position.top}px`,
        left: `${position.left}px`,
        backdropFilter: 'blur(1px)',
      }}
    >
      <div className="flex items-center gap-1">
        {quickEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiSelect(emoji)}
            disabled={disabled}
            className="flex h-8 w-8 items-center justify-center rounded text-lg transition-colors hover:bg-secondary-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-secondary-700"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
