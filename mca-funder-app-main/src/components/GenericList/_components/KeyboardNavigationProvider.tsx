import React, { createContext, useContext, useCallback } from 'react';

interface KeyboardNavigationContextType {
  handleKeyDown: (e: React.KeyboardEvent, actions: KeyboardActions) => void;
}

interface KeyboardActions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onSpace?: () => void;
}

interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | null>(null);

export const KeyboardNavigationProvider = React.memo<KeyboardNavigationProviderProps>(({
  children,
  enabled = true,
}) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent, actions: KeyboardActions) => {
    if (!enabled) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        actions.onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        actions.onArrowDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        actions.onArrowLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        actions.onArrowRight?.();
        break;
      case 'Enter':
        e.preventDefault();
        actions.onEnter?.();
        break;
      case 'Escape':
        e.preventDefault();
        actions.onEscape?.();
        break;
      case ' ':
        e.preventDefault();
        actions.onSpace?.();
        break;
    }
  }, [enabled]);

  const contextValue = React.useMemo(() => ({
    handleKeyDown,
  }), [handleKeyDown]);

  return (
    <KeyboardNavigationContext.Provider value={contextValue}>
      {children}
    </KeyboardNavigationContext.Provider>
  );
});

KeyboardNavigationProvider.displayName = 'KeyboardNavigationProvider';

export const useKeyboardNavigation = () => {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within a KeyboardNavigationProvider');
  }
  return context;
}; 