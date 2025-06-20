import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { ChatProvider } from '@/contexts/ChatContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <WebSocketProvider>
            <ChatProvider>
              <ToastProvider>
                <Component {...pageProps} />
              </ToastProvider>
            </ChatProvider>
          </WebSocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
