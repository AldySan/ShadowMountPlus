// SPDX-License-Identifier: GPL-3.0-or-later
// Types shared between the main process, the preload bridge and the renderer.

export type ThemeMode = 'auto' | 'dark' | 'light';

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface AppSettings {
  theme: ThemeMode;
  /** Directory of a local ShadowMountPlus checkout used for its build scripts. */
  repoPath: string;
  toolPaths: {
    mkpfs: string;
    ufs2tool: string;
  };
  privilege: 'auto' | 'pkexec' | 'direct';
  defaultOutDir: string;
  ps5: {
    host: string;
    port: number;
  };
  recentHosts: string[];
}

export interface AppInfo {
  version: string;
  electron: string;
  node: string;
  platform: string;
  arch: string;
  userData: string;
}

export interface SmpApi {
  platform: string;
  settings: {
    get(): Promise<AppSettings>;
    set(patch: Partial<AppSettings>): Promise<AppSettings>;
  };
  appInfo(): Promise<AppInfo>;
  dialogs: {
    pickFolder(title?: string): Promise<string | null>;
    pickFile(opts?: { title?: string; filters?: FileFilter[] }): Promise<string | null>;
    pickSave(opts?: { title?: string; defaultPath?: string; filters?: FileFilter[] }): Promise<string | null>;
  };
  shell: {
    openPath(target: string): Promise<string>;
    showItem(target: string): void;
  };
}
