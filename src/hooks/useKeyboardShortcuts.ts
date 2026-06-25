import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  onEscape?: () => void;
  onNewSale?: () => void;
  onSearch?: () => void;
  onExport?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea (except for Escape)
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (event.key === 'Escape') {
        if (options.onEscape) {
          event.preventDefault();
          options.onEscape();
        }
        return; // Escape always works, even in inputs
      }

      if (isInput) return;

      // Ctrl+N / Cmd+N -> New Sale
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        if (options.onNewSale) {
          event.preventDefault();
          options.onNewSale();
        }
      }

      // Ctrl+K / Cmd+K -> Focus Search
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        if (options.onSearch) {
          event.preventDefault();
          options.onSearch();
        }
      }

      // Ctrl+E / Cmd+E -> Export
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') {
        if (options.onExport) {
          event.preventDefault();
          options.onExport();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [options]);
}
