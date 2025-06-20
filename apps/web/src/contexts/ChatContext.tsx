'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatUser {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface ChatContextType {
  isChatOpen: boolean;
  startConversationWith: ChatUser | null;
  openChatWith: (user: ChatUser) => void;
  openChat: () => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [startConversationWith, setStartConversationWith] =
    useState<ChatUser | null>(null);

  const openChatWith = (user: ChatUser) => {
    setStartConversationWith(user);
    setIsChatOpen(true);
  };

  const openChat = () => {
    setStartConversationWith(null);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    // Reset the startConversationWith after a short delay to allow chat to close gracefully
    setTimeout(() => {
      setStartConversationWith(null);
    }, 300);
  };

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        startConversationWith,
        openChatWith,
        openChat,
        closeChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
