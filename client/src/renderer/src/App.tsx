// SPDX-License-Identifier: GPL-3.0-or-later
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppInfo, AppSettings, BuildSpec, EnvReport, ThemeMode } from '../../shared/types';
import { smp } from './lib/api';
import { useJobs } from './lib/jobs';
import { Sidebar } from './components/Sidebar';
import { TerminalDock } from './components/Terminal';
import { HomeView } from './views/HomeView';
import { CreateView } from './views/CreateView';
import { SettingsView } from './views/SettingsView';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

function navItems(): NavItem[] {
  return [
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'create', label: 'Create image', icon: <CreateIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];
}

export function App() {
  const [view, setView] = useState('home');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [env, setEnv] = useState<EnvReport | null>(null);
  const jobs = useJobs();

  const refreshEnv = useCallback(() => {
    void smp.env.detect().then(setEnv);
  }, []);

  useEffect(() => {
    void smp.settings.get().then(setSettings);
    void smp.appInfo().then(setAppInfo);
    refreshEnv();
  }, [refreshEnv]);

  useTheme(settings?.theme ?? 'auto');

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      // Optimistic update: PathField is a controlled input, so the visible
      // value must track each keystroke immediately instead of waiting for
      // the settings save to resolve. The persisted result reconciles the
      // state once the save completes.
      setSettings((current) => (current ? { ...current, ...patch } : current));
      void smp.settings.set(patch).then((next) => {
        setSettings(next);
        refreshEnv();
      });
    },
    [refreshEnv],
  );

  const startJob = useCallback(
    async (spec: BuildSpec) => {
      await jobs.start(spec);
    },
    [jobs],
  );

  return (
    <div className="app">
      <div className="app-main">
        <Sidebar
          items={navItems()}
          active={view}
          onSelect={setView}
          footer={<span>{appInfo ? `${appInfo.platform} · v${appInfo.version}` : ''}</span>}
        />
        <main className="content">
          {view === 'home' && (
            <HomeView appInfo={appInfo} settings={settings} env={env} onNavigate={setView} onRefreshEnv={refreshEnv} />
          )}
          {view === 'create' && <CreateView settings={settings} env={env} onStart={startJob} />}
          {view === 'settings' && (
            <SettingsView settings={settings} appInfo={appInfo} env={env} onChange={updateSettings} onRefreshEnv={refreshEnv} />
          )}
        </main>
      </div>
      <TerminalDock
        jobs={jobs.jobs}
        activeId={jobs.activeId}
        onSelect={jobs.setActiveId}
        onCancel={jobs.cancel}
      />
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

function CreateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5.5v5M5.5 8h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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
