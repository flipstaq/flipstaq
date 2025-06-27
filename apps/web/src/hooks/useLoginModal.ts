import { useState } from 'react';

interface UseLoginModalReturn {
  isOpen: boolean;
  action: string;
  title?: string;
  openModal: (action: string, title?: string) => void;
  closeModal: () => void;
}

export function useLoginModal(): UseLoginModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState('');
  const [title, setTitle] = useState<string | undefined>();

  const openModal = (action: string, title?: string) => {
    setAction(action);
    setTitle(title);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setAction('');
    setTitle(undefined);
  };

  return {
    isOpen,
    action,
    title,
    openModal,
    closeModal,
  };
}
