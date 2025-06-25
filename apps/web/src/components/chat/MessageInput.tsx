'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Upload,
  Loader2,
  Reply,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { messageService } from '@/lib/messageService';
import GifPicker from './GifPicker';

interface MessageInputProps {
  conversationId?: string;
  onSend: (
    message: string,
    attachments?: Array<{
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    }>
  ) => void;
  disabled?: boolean;
  replyingTo?: {
    id: string;
    content: string;
    senderId: string;
    senderUsername: string;
  } | null;
  onCancelReply?: () => void;
}

// Emoji categories and data
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
  food: {
    name: '🍕 Food',
    emojis: [
      '🍏',
      '🍎',
      '🍐',
      '🍊',
      '🍋',
      '🍌',
      '🍉',
      '🍇',
      '🍓',
      '🫐',
      '🍈',
      '🍒',
      '🍑',
      '🥭',
      '🍍',
      '🥥',
      '🥝',
      '🍅',
      '🍆',
      '🥑',
      '🥦',
      '🥬',
      '🥒',
      '🌶️',
      '🫑',
      '🌽',
      '🥕',
      '🫒',
      '🧄',
      '🧅',
      '🥔',
      '🍠',
      '🥐',
      '🥯',
      '🍞',
      '🥖',
      '🥨',
      '🧀',
      '🥚',
      '🍳',
      '🧈',
      '🥞',
      '🧇',
      '🥓',
      '🥩',
      '🍗',
      '🍖',
      '🦴',
      '🌭',
      '🍔',
      '🍟',
      '🍕',
      '🫓',
      '🥪',
      '🥙',
      '🧆',
      '🌮',
      '🌯',
      '🫔',
      '🥗',
      '🥘',
      '🫕',
      '🥫',
      '🍝',
      '🍜',
      '🍲',
      '🍛',
      '🍣',
      '🍱',
      '🥟',
      '🦪',
      '🍤',
      '🍙',
      '🍚',
      '🍘',
      '🍥',
      '🥠',
      '🥮',
      '🍢',
      '🍡',
      '🍧',
      '🍨',
      '🍦',
      '🥧',
      '🧁',
      '🍰',
      '🎂',
      '🍮',
      '🍭',
      '🍬',
      '🍫',
      '🍿',
      '🍩',
      '🍪',
      '🌰',
      '🥜',
      '🍯',
      '🥛',
      '🍼',
      '☕',
      '🍵',
      '🧃',
      '🥤',
      '🍶',
      '🍺',
      '🍻',
      '🥂',
      '🍷',
      '🥃',
      '🍸',
      '🍹',
      '🧉',
      '🍾',
    ],
  },
  activities: {
    name: '⚽ Activities',
    emojis: [
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
      '🪀',
      '🏓',
      '🏸',
      '🏒',
      '🏑',
      '🥍',
      '🏏',
      '🪃',
      '🥅',
      '⛳',
      '🪁',
      '🏹',
      '🎣',
      '🤿',
      '🥊',
      '🥋',
      '🎽',
      '🛹',
      '🛷',
      '⛸️',
      '🥌',
      '🎿',
      '⛷️',
      '🏂',
      '🪂',
      '🏋️‍♀️',
      '🏋️',
      '🏋️‍♂️',
      '🤼‍♀️',
      '🤼',
      '🤼‍♂️',
      '🤸‍♀️',
      '🤸',
      '🤸‍♂️',
      '⛹️‍♀️',
      '⛹️',
      '⛹️‍♂️',
      '🤺',
      '🤾‍♀️',
      '🤾',
      '🤾‍♂️',
      '🏌️‍♀️',
      '🏌️',
      '🏌️‍♂️',
      '🏇',
      '🧘‍♀️',
      '🧘',
      '🧘‍♂️',
      '🏄‍♀️',
      '🏄',
      '🏄‍♂️',
      '🏊‍♀️',
      '🏊',
      '🏊‍♂️',
      '🤽‍♀️',
      '🤽',
      '🤽‍♂️',
      '🚣‍♀️',
      '🚣',
      '🚣‍♂️',
      '🧗‍♀️',
      '🧗',
      '🧗‍♂️',
      '🚵‍♀️',
      '🚵',
      '🚵‍♂️',
      '🚴‍♀️',
      '🚴',
      '🚴‍♂️',
    ],
  },
  travel: {
    name: '✈️ Travel',
    emojis: [
      '🚗',
      '🚕',
      '🚙',
      '🚌',
      '🚎',
      '🏎️',
      '🚓',
      '🚑',
      '🚒',
      '🚐',
      '🛻',
      '🚚',
      '🚛',
      '🚜',
      '🏍️',
      '🛵',
      '🚲',
      '🛴',
      '🛹',
      '🛼',
      '🚁',
      '🛸',
      '✈️',
      '🛩️',
      '🛫',
      '🛬',
      '🪂',
      '💺',
      '🚀',
      '🛰️',
      '🚤',
      '🛥️',
      '🚢',
      '⛵',
      '🛶',
      '⚓',
      '🚧',
      '⛽',
      '🚨',
      '🚥',
      '🚦',
      '🛑',
      '🚏',
      '🗺️',
      '🗿',
      '🗽',
      '🗼',
      '🏰',
      '🏯',
      '🏟️',
      '🎡',
      '🎢',
      '🎠',
      '⛲',
      '⛱️',
      '🏖️',
      '🏝️',
      '🏜️',
      '🌋',
      '⛰️',
      '🏔️',
      '🗻',
      '🏕️',
      '⛺',
      '🏠',
      '🏡',
      '🏘️',
      '🏚️',
      '🏗️',
      '🏭',
      '🏢',
      '🏬',
      '🏣',
      '🏤',
      '🏥',
      '🏦',
      '🏨',
      '🏪',
      '🏫',
      '🏩',
      '💒',
      '🏛️',
      '⛪',
      '🕌',
      '🛕',
      '🕍',
      '🕋',
      '⛩️',
      '🛤️',
      '🛣️',
      '🗾',
      '🎑',
      '🏞️',
      '🌅',
      '🌄',
      '🌠',
      '🎇',
      '🎆',
      '🌇',
      '🌆',
      '🏙️',
      '🌃',
      '🌌',
      '🌉',
      '🌁',
    ],
  },
  objects: {
    name: '📱 Objects',
    emojis: [
      '⌚',
      '📱',
      '📲',
      '💻',
      '⌨️',
      '🖥️',
      '🖨️',
      '🖱️',
      '🖲️',
      '🕹️',
      '🗜️',
      '💽',
      '💾',
      '💿',
      '📀',
      '📼',
      '📷',
      '📸',
      '📹',
      '🎥',
      '📽️',
      '🎞️',
      '📞',
      '☎️',
      '📟',
      '📠',
      '📺',
      '📻',
      '🎙️',
      '🎚️',
      '🎛️',
      '🧭',
      '⏱️',
      '⏲️',
      '⏰',
      '🕰️',
      '⌛',
      '⏳',
      '📡',
      '🔋',
      '🔌',
      '💡',
      '🔦',
      '🕯️',
      '🪔',
      '🧯',
      '🛢️',
      '💸',
      '💵',
      '💴',
      '💶',
      '💷',
      '💰',
      '💳',
      '💎',
      '⚖️',
      '🧰',
      '🔧',
      '🔨',
      '⚒️',
      '🛠️',
      '⛏️',
      '🔩',
      '⚙️',
      '🧱',
      '⛓️',
      '🧲',
      '🔫',
      '💣',
      '🧨',
      '🪓',
      '🔪',
      '🗡️',
      '⚔️',
      '🛡️',
      '🚬',
      '⚰️',
      '⚱️',
      '🏺',
      '🔮',
      '📿',
      '🧿',
      '💈',
      '⚗️',
      '🔭',
      '🔬',
      '🕳️',
      '🩹',
      '🩺',
      '💊',
      '💉',
      '🧬',
      '🦠',
      '🧫',
      '🧪',
      '🌡️',
      '🧹',
      '🧺',
      '🧻',
      '🚽',
      '🚰',
      '🚿',
      '🛁',
      '🛀',
      '🧼',
      '🪒',
      '🧴',
      '🧷',
      '🧹',
      '🧽',
      '🧯',
      '🛒',
      '🚬',
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
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
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
      '⛎',
      '♈',
      '♉',
      '♊',
      '♋',
      '♌',
      '♍',
      '♎',
      '♏',
      '♐',
      '♑',
      '♒',
      '♓',
      '🆔',
      '⚛️',
      '🉑',
      '☢️',
      '☣️',
      '📴',
      '📳',
      '🈶',
      '🈚',
      '🈸',
      '🈺',
      '🈷️',
      '✴️',
      '🆚',
      '💮',
      '🉐',
      '㊙️',
      '㊗️',
      '🈴',
      '🈵',
      '🈹',
      '🈲',
      '🅰️',
      '🅱️',
      '🆎',
      '🆑',
      '🅾️',
      '🆘',
      '❌',
      '⭕',
      '🛑',
      '⛔',
      '📛',
      '🚫',
      '💯',
      '💢',
      '♨️',
      '🚷',
      '🚯',
      '🚳',
      '🚱',
      '🔞',
      '📵',
      '🚭',
      '❗',
      '❕',
      '❓',
      '❔',
      '‼️',
      '⁉️',
      '🔅',
      '🔆',
      '〽️',
      '⚠️',
      '🚸',
      '🔱',
      '⚜️',
      '🔰',
      '♻️',
      '✅',
      '🈯',
      '💹',
      '❇️',
      '✳️',
      '❎',
      '🌐',
      '💠',
      'Ⓜ️',
      '🌀',
      '💤',
      '🏧',
      '🚾',
      '♿',
      '🅿️',
      '🈳',
      '🈂️',
      '🛂',
      '🛃',
      '🛄',
      '🛅',
      '🚹',
      '🚺',
      '🚼',
      '🚻',
      '🚮',
      '🎦',
      '📶',
      '🈁',
      '🔣',
      'ℹ️',
      '🔤',
      '🔡',
      '🔠',
      '🆖',
      '🆗',
      '🆙',
      '🆒',
      '🆕',
      '🆓',
      '0️⃣',
      '1️⃣',
      '2️⃣',
      '3️⃣',
      '4️⃣',
      '5️⃣',
      '6️⃣',
      '7️⃣',
      '8️⃣',
      '9️⃣',
      '🔟',
    ],
  },
};

export default function MessageInput({
  conversationId,
  onSend,
  disabled = false,
  replyingTo,
  onCancelReply,
}: MessageInputProps) {
  const { t } = useLanguage();
  const { sendTyping } = useWebSocket();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingKeepAliveRef = useRef<NodeJS.Timeout | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Allow sending if there's either a message or files
    if (
      (!message.trim() && selectedFiles.length === 0) ||
      disabled ||
      isUploading
    )
      return;

    try {
      let attachments: Array<{
        fileUrl: string;
        fileName: string;
        fileType: string;
        fileSize: number;
      }> = [];

      // Upload files if selected
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        setUploadError(null);
        try {
          for (const file of selectedFiles) {
            const uploadedFile = await messageService.uploadFile(file);
            attachments.push(uploadedFile);
          }
        } catch (error) {
          setUploadError(
            error instanceof Error
              ? error.message
              : t('chat:file_upload_failed')
          );
          setIsUploading(false);
          return;
        }
      } // Send message with optional attachments
      onSend(message.trim(), attachments.length > 0 ? attachments : undefined); // Stop typing indicator when message is sent
      if (isTyping && conversationId) {
        setIsTyping(false);
        sendTyping(conversationId, false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        if (typingKeepAliveRef.current) {
          clearInterval(typingKeepAliveRef.current);
          typingKeepAliveRef.current = null;
        }
      } // Reset form
      setMessage('');
      setSelectedFiles([]);
      setUploadError(null);
      resetTextareaHeight();
    } finally {
      setIsUploading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit of 10
    if (selectedFiles.length + files.length > 10) {
      setUploadError(t('chat:max_files_exceeded'));
      return;
    }

    // Validate each file
    for (const file of files) {
      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(t('chat:file_too_large'));
        return;
      } // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedTypes.includes(file.type)) {
        setUploadError(t('chat:file_type_not_supported'));
        return;
      }
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    setUploadError(null);
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };
  const handleGifClick = () => {
    setShowEmojiPicker(false); // Close emoji picker when opening GIF picker
    setShowGifPicker(!showGifPicker);
  };

  const handleGifSelect = (gifUrl: string) => {
    // Send the GIF as a message with fileUrl and no content
    onSend('', [
      {
        fileUrl: gifUrl,
        fileName: 'gif',
        fileType: 'image/gif',
        fileSize: 0, // External URL, no size
      },
    ]);
    setShowGifPicker(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);

      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setMessage((prev) => prev + emoji);
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const maxHeight = 120; // Max height in pixels (roughly 5 lines)
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };
  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Close GIF picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        gifPickerRef.current &&
        !gifPickerRef.current.contains(event.target as Node)
      ) {
        setShowGifPicker(false);
      }
    };

    if (showGifPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showGifPicker]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);
  // Typing indicator management
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    // Only send typing indicators if conversationId is available
    if (!conversationId) return; // Send typing indicator when user starts typing
    if (!isTyping && newMessage.trim().length > 0) {
      setIsTyping(true);
      sendTyping(conversationId, true);

      // Start keep-alive for typing indicator (send every 4 seconds)
      typingKeepAliveRef.current = setInterval(() => {
        if (isTyping) {
          sendTyping(conversationId, true);
        }
      }, 4000);
    }

    // Clear existing timeout if there was one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If user is typing (message is not empty), set a longer timeout to keep typing active
    if (newMessage.trim().length > 0) {
      // Set timeout to stop typing indicator after 8 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          sendTyping(conversationId, false);
          // Clear keep-alive
          if (typingKeepAliveRef.current) {
            clearInterval(typingKeepAliveRef.current);
            typingKeepAliveRef.current = null;
          }
        }
      }, 8000);
    } else {
      // Stop typing indicator immediately if message is empty
      if (isTyping) {
        setIsTyping(false);
        sendTyping(conversationId, false);
        // Clear keep-alive
        if (typingKeepAliveRef.current) {
          clearInterval(typingKeepAliveRef.current);
          typingKeepAliveRef.current = null;
        }
      }
    }
  };
  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingKeepAliveRef.current) {
        clearInterval(typingKeepAliveRef.current);
      }
      if (isTyping && conversationId) {
        sendTyping(conversationId, false);
      }
    };
  }, [isTyping, conversationId, sendTyping]);
  // Handle paste events for image uploads
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Look for image files in the pasted content
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if the item is an image file
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault(); // Prevent default paste behavior for images

        const file = item.getAsFile();
        if (!file) continue;

        // Check file size limit (10MB)
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(t('chat:file_too_large'));
          return;
        }

        // Check if adding this file would exceed the limit of 10
        if (selectedFiles.length >= 10) {
          setUploadError(t('chat:max_files_exceeded'));
          return;
        }

        // Validate image type
        const allowedImageTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',
        ];

        if (!allowedImageTypes.includes(file.type)) {
          setUploadError(t('chat:file_type_not_supported'));
          return;
        }

        // Create a new file with a proper name
        const timestamp = new Date().getTime();
        const extension = file.type.split('/')[1];
        const fileName = `pasted-image-${timestamp}.${extension}`;

        // Create a new File object with the proper name
        const renamedFile = new File([file], fileName, { type: file.type }); // Add to selected files
        setSelectedFiles((prev) => [...prev, renamedFile]);
        setUploadError(null);

        // Clear the clipboard data to prevent multiple pastes
        break;
      }
    }
  };

  return (
    <div className="relative border-t border-secondary-200 bg-white dark:border-secondary-700 dark:bg-secondary-900">
      {/* Reply preview */}
      {replyingTo && (
        <div className="border-b border-secondary-200 bg-secondary-50 p-3 dark:border-secondary-700 dark:bg-secondary-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 rtl:space-x-reverse">
              <Reply className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600 dark:text-primary-400" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {t('chat:replying_to')} @{replyingTo.senderUsername}
                </div>
                <div className="line-clamp-2 text-sm text-secondary-600 dark:text-secondary-400">
                  {replyingTo.content || t('chat:file_attachment')}
                </div>
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="ml-2 flex-shrink-0 rounded-md p-1 text-secondary-400 hover:bg-secondary-200 hover:text-secondary-600 dark:hover:bg-secondary-700 dark:hover:text-secondary-300"
              title={t('chat:cancel_reply')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* File input (hidden) */}{' '}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.gif,.pdf,.txt,.doc,.docx,.xls,.xlsx"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        multiple
      />{' '}
      {/* Files preview */}
      {selectedFiles.length > 0 && (
        <div className="border-b border-secondary-200 bg-secondary-50 p-3 dark:border-secondary-700 dark:bg-secondary-800">
          <div className="space-y-3">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {file.name}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleFileRemove(index)}
                  className="rounded-lg p-1 text-red-600 transition-all duration-200 hover:scale-105 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                  title={t('chat:remove_file')}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Image previews */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {selectedFiles
                .filter((file) => isImageFile(file.type))
                .map((file, index) => (
                  <div
                    key={`preview-${file.name}-${index}`}
                    className="relative"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="h-20 w-full rounded-lg border border-secondary-200 object-cover dark:border-secondary-700"
                      onLoad={() =>
                        URL.revokeObjectURL(URL.createObjectURL(file))
                      }
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}{' '}
      {/* Upload error */}
      {uploadError && (
        <div className="border-b border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">
            {uploadError}
          </p>
        </div>
      )}
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full left-4 right-4 z-50 mb-2 max-h-96 overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-2xl dark:border-secondary-700 dark:bg-secondary-800"
        >
          {/* Emoji picker header */}
          <div className="flex items-center justify-between border-b border-secondary-200 p-4 dark:border-secondary-700">
            <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              {t('chat:choose_emoji')}
            </h3>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="rounded-lg p-1 text-red-600 transition-all duration-200 hover:scale-105 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
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
                  className="flex items-center justify-center rounded-lg p-2 text-xl transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-700"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="p-4">
        <form
          onSubmit={handleSubmit}
          className="flex items-end space-x-3 rtl:space-x-reverse"
        >
          {/* Message Input */}
          <div className="relative flex-1">
            <div className="from-secondary-25 flex items-end rounded-2xl border border-secondary-200 bg-gradient-to-r to-secondary-50 transition-all duration-200 focus-within:border-primary-500 focus-within:shadow-lg focus-within:shadow-primary-500/20 dark:border-secondary-700 dark:from-secondary-800 dark:to-secondary-800 dark:focus-within:border-primary-400">
              {/* Attachment Button */}
              <button
                type="button"
                onClick={handleAttachClick}
                className="p-3 text-secondary-500 transition-all duration-200 hover:scale-110 hover:text-primary-600 dark:hover:text-primary-400"
                title={t('chat:attach_file')}
                disabled={disabled || isUploading}
              >
                <Paperclip className="h-5 w-5" />
              </button>
              {/* Text Input */}{' '}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleMessageChange}
                onKeyPress={handleKeyPress}
                onPaste={handlePaste}
                placeholder={t('chat:type_message')}
                disabled={disabled || isUploading}
                className="max-h-[120px] min-h-[20px] flex-1 resize-none border-0 bg-transparent px-2 py-3 text-sm text-secondary-900 placeholder-secondary-500 focus:outline-none dark:text-secondary-100 dark:placeholder-secondary-400"
                rows={1}
              />
              {/* GIF Button */}
              <button
                type="button"
                onClick={handleGifClick}
                className="p-3 text-secondary-500 transition-all duration-200 hover:scale-110 hover:text-primary-600 dark:hover:text-primary-400"
                title={t('chat:send_gif')}
                disabled={disabled || isUploading}
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              {/* Emoji Button */}
              <button
                type="button"
                onClick={() => {
                  setShowGifPicker(false); // Close GIF picker when opening emoji picker
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className={`p-3 transition-all duration-200 hover:scale-110 ${
                  showEmojiPicker
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-secondary-500 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title={t('chat:add_emoji')}
                disabled={disabled || isUploading}
              >
                <Smile className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* Send Button */}{' '}
          <button
            type="submit"
            disabled={
              (!message.trim() && selectedFiles.length === 0) ||
              disabled ||
              isUploading
            }
            className={`rounded-full p-3 transition-all duration-200 ${
              (message.trim() || selectedFiles.length > 0) &&
              !disabled &&
              !isUploading
                ? 'transform bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg hover:scale-105 hover:from-primary-700 hover:to-primary-800 hover:shadow-xl active:scale-95'
                : 'cursor-not-allowed bg-secondary-200 text-secondary-400 dark:bg-secondary-700 dark:text-secondary-500'
            }`}
            title={isUploading ? t('chat:uploading_file') : t('chat:send')}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>{' '}
      </div>
      {/* GIF Picker */}
      <GifPicker
        isOpen={showGifPicker}
        onSelectGif={handleGifSelect}
        onClose={() => setShowGifPicker(false)}
        pickerRef={gifPickerRef}
      />
    </div>
  );
}
