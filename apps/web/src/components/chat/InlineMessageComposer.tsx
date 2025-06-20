'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { messageService } from '@/lib/messageService';

interface InlineMessageComposerProps {
  productSeller: {
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  productTitle: string;
  productCover?: {
    id: string;
    title: string;
    price: number;
    currency: string;
    imageUrl?: string | null;
    username: string;
    location: string;
    slug: string;
  };
  allowFileAttachments?: boolean; // New prop to control file attachments
  onMessageSent?: () => void;
  onClose?: () => void;
}

interface Attachment {
  file: File;
  fileUrl?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

export default function InlineMessageComposer({
  productSeller,
  productTitle,
  productCover,
  allowFileAttachments = true,
  onMessageSent,
  onClose,
}: InlineMessageComposerProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle'
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRTL = language === 'ar';

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  // Create or get conversation on mount
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        const conversation = await messageService.createConversation(
          productSeller.username
        );
        setConversationId(conversation.id);
      } catch (error) {
        console.error('Error creating conversation:', error);
        showError(t('chat:conversation_error'));
      }
    };

    if (user && productSeller.username) {
      initializeConversation();
    }
  }, [user, productSeller.username]);
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowFileAttachments) {
      return;
    }

    const files = Array.from(event.target.files || []);

    if (attachments.length + files.length > 10) {
      showError(t('chat:max_files_exceeded'));
      return;
    }

    // Validate file sizes (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      showError(
        `Files too large: ${oversizedFiles.map((f) => f.name).join(', ')}. Max size: 10MB`
      );
      return;
    }

    const newAttachments: Attachment[] = files.map((file) => ({
      file,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploading: false,
      uploaded: false,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (attachment: Attachment): Promise<string> => {
    const formData = new FormData();
    formData.append('file', attachment.file);

    const response = await fetch('/api/v1/messages/upload', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();
    return data.fileUrl;
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !conversationId ||
      (!message.trim() && attachments.length === 0) ||
      isLoading
    ) {
      return;
    }

    setIsLoading(true);
    setStatus('sending');

    try {
      // Upload files first
      const uploadedAttachments = [];

      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        setAttachments((prev) =>
          prev.map((att, idx) =>
            idx === i ? { ...att, uploading: true } : att
          )
        );

        try {
          const fileUrl = await uploadFile(attachment);
          uploadedAttachments.push({
            fileUrl,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
          });

          setAttachments((prev) =>
            prev.map((att, idx) =>
              idx === i
                ? { ...att, uploading: false, uploaded: true, fileUrl }
                : att
            )
          );
        } catch (error) {
          setAttachments((prev) =>
            prev.map((att, idx) =>
              idx === i
                ? { ...att, uploading: false, error: 'Upload failed' }
                : att
            )
          );
          throw new Error(`Failed to upload ${attachment.fileName}`);
        }
      } // Add product cover as an attachment if provided
      if (productCover) {
        uploadedAttachments.push({
          fileUrl: `product-cover://${productCover.id}`, // Special URL scheme for product covers
          fileName: `product-cover-${productCover.id}`,
          fileType: 'application/product-cover',
          fileSize: 0,
          metadata: {
            type: 'product-cover',
            productId: productCover.id,
            title: productCover.title,
            price: productCover.price,
            currency: productCover.currency,
            imageUrl: productCover.imageUrl,
            username: productCover.username,
            location: productCover.location,
            slug: productCover.slug,
          },
        });
      }

      // Send message
      await messageService.sendMessage(
        message.trim(),
        conversationId,
        uploadedAttachments
      );

      setStatus('sent');
      success(t('chat:message_sent'));

      // Reset form
      setMessage('');
      setAttachments([]);

      // Call callback
      onMessageSent?.();

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('error');
      showError(t('chat:message_failed'));
    } finally {
      setIsLoading(false);
    }
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canSend = (message.trim() || attachments.length > 0) && !isLoading;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'sent':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!user) {
    return null;
  }
  return (
    <div className="rounded-lg border border-secondary-300 bg-secondary-50 p-3 dark:border-secondary-600 dark:bg-secondary-800">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
            {t('chat:quick_message_to')} @{productSeller.username}
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded p-1 text-secondary-500 hover:bg-secondary-200 hover:text-secondary-700 dark:text-secondary-400 dark:hover:bg-secondary-700 dark:hover:text-secondary-300"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>{' '}
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Message Input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('chat:quick_message_placeholder', {
              product: productTitle,
            })}
            className="w-full resize-none rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900 placeholder-secondary-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 dark:placeholder-secondary-400"
            rows={2}
            disabled={isLoading}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>{' '}
        {/* File Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-1">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded border border-secondary-200 bg-white p-2 dark:border-secondary-600 dark:bg-secondary-700"
              >
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="flex h-6 w-6 items-center justify-center">
                    {attachment.uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                    ) : attachment.uploaded ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : attachment.error ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      getFileIcon(attachment.fileType)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-secondary-900 dark:text-secondary-100">
                      {attachment.fileName}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      {formatFileSize(attachment.fileSize)}
                    </p>
                  </div>
                </div>
                {!attachment.uploading && (
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="rounded p-1 text-secondary-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {/* Actions */}
        <div className="flex items-center justify-between">
          {' '}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {/* File Upload Button */}
            {allowFileAttachments && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || attachments.length >= 10}
                className="rounded p-1.5 text-secondary-600 hover:bg-secondary-200 hover:text-secondary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-secondary-400 dark:hover:bg-secondary-700 dark:hover:text-secondary-300"
                title={t('chat:attach_file')}
              >
                <Paperclip className="h-4 w-4" />
              </button>
            )}
            {/* Status */}
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              {getStatusIcon()}{' '}
              {status === 'sending' && (
                <span className="text-xs text-secondary-600 dark:text-secondary-400">
                  {t('chat:message_sending')}
                </span>
              )}
              {status === 'sent' && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  {t('chat:message_sent')}
                </span>
              )}
              {status === 'error' && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {t('chat:message_failed')}
                </span>
              )}
            </div>
          </div>
          {/* Send Button */}
          <button
            type="submit"
            disabled={!canSend}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              canSend
                ? 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
                : 'cursor-not-allowed bg-secondary-300 text-secondary-500 dark:bg-secondary-600 dark:text-secondary-400'
            }`}
          >
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <Send className="h-4 w-4" />
              <span>{t('chat:send')}</span>
            </div>
          </button>
        </div>{' '}
        {/* Hidden File Input */}
        {allowFileAttachments && (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
          />
        )}
      </form>
    </div>
  );
}
