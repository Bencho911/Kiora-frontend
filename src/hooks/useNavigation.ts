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
    const handleNavigate = (e: any) => {
      if (e.detail?.tab) setActiveTab(e.detail.tab);
    };
    window.addEventListener('kiora_navigate', handleNavigate);
    return () => window.removeEventListener('kiora_navigate', handleNavigate);
  }, []);

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
  };

  return { activeTab, setActiveTab, navigateTo };
}
