'use client';

import React, { useState } from 'react';
import { ChatDrawer } from '@/components/chat';
import { MessageCircle } from 'lucide-react';

export default function ChatDemo() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary-50 p-8 dark:bg-secondary-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-secondary-900 dark:text-secondary-100">
          Chat System Demo
        </h1>

        <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-secondary-800">
          <p className="mb-4 text-secondary-700 dark:text-secondary-300">
            Click the button below to open the chat drawer and test the
            messaging interface.
          </p>

          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center space-x-2 rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Open Chat</span>
          </button>
        </div>
      </div>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
