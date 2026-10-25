// SPDX-License-Identifier: GPL-3.0-or-later
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppInfo, AppSettings, ThemeMode } from '../../shared/types';
import { smp } from './lib/api';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './views/HomeView';
import { SettingsView } from './views/SettingsView';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

function navItems(): NavItem[] {
  return [
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];
}

export function App() {
  const [view, setView] = useState('home');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    void smp.settings.get().then(setSettings);
    void smp.appInfo().then(setAppInfo);
  }, []);

  useTheme(settings?.theme ?? 'auto');

  const updateSettings = async (patch: Partial<AppSettings>) => {
    setSettings(await smp.settings.set(patch));
  };

  return (
    <div className="app">
      <Sidebar
        items={navItems()}
        active={view}
        onSelect={setView}
        footer={<span className="sidebar-foot">{appInfo ? `${appInfo.platform} · v${appInfo.version}` : ''}</span>}
      />
      <main className="content">
        {view === 'home' && (
          <HomeView appInfo={appInfo} settings={settings} onNavigate={setView} />
        )}
        {view === 'settings' && (
          <SettingsView settings={settings} appInfo={appInfo} onChange={updateSettings} />
        )}
      </main>
    </div>
  );
}

function useTheme(mode: ThemeMode) {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      root.dataset.theme = mode === 'auto' ? (media.matches ? 'dark' : 'light') : mode;
    };
    apply();
    if (mode === 'auto') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [mode]);
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 7.5 8 2.5l5.5 5v5.5a1 1 0 0 1-1 1H10v-4H6v4H3.5a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4.5h6M11 4.5h3M2 11.5h3M8 11.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="9.5" cy="4.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="5.5" cy="11.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
