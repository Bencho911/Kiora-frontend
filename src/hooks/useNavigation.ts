import { useState, useEffect } from 'react';

export function useNavigation(defaultTab = 'dashboard') {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kiora_active_tab') || defaultTab;
    }
    return defaultTab;
  });

  useEffect(() => {
    localStorage.setItem('kiora_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const tab = (e as CustomEvent<{ tab: string }>).detail?.tab;
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('kiora_navigate', handleNavigate);
    return () => window.removeEventListener('kiora_navigate', handleNavigate);
  }, []);

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
  };

  return { activeTab, setActiveTab, navigateTo };
}
