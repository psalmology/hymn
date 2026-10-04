import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

interface ModalContextType {
  activeModalCount: number;
  isAnyModalOpen: boolean;
  registerModal: () => () => void;
}

const ModalContext = createContext<ModalContextType>({
  activeModalCount: 0,
  isAnyModalOpen: false,
  registerModal: () => () => {},
});

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModalCount, setActiveModalCount] = useState(0);

  const registerModal = useCallback(() => {
    setActiveModalCount((prev) => prev + 1);
    return () => {
      setActiveModalCount((prev) => Math.max(0, prev - 1));
    };
  }, []);

  const isAnyModalOpen = activeModalCount > 0;

  const value = useMemo(
    () => ({
      activeModalCount,
      isAnyModalOpen,
      registerModal,
    }),
    [activeModalCount, isAnyModalOpen, registerModal]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModalState = () => useContext(ModalContext);

export function useModalRegistration(isOpen: boolean) {
  const { registerModal } = useModalState();

  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerModal();
    return () => unregister();
  }, [isOpen, registerModal]);
}
