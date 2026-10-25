// SPDX-License-Identifier: GPL-3.0-or-later
import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';
import type { SmpApi } from '../shared/types';

const api: SmpApi = {
  platform: process.platform,
  settings: {
    get: () => ipcRenderer.invoke(IPC.SettingsGet),
    set: (patch) => ipcRenderer.invoke(IPC.SettingsSet, patch),
  },
  appInfo: () => ipcRenderer.invoke(IPC.AppInfo),
  dialogs: {
    pickFolder: (title) => ipcRenderer.invoke(IPC.DialogPickFolder, title),
    pickFile: (opts) => ipcRenderer.invoke(IPC.DialogPickFile, opts),
    pickSave: (opts) => ipcRenderer.invoke(IPC.DialogPickSave, opts),
  },
  shell: {
    openPath: (target) => ipcRenderer.invoke(IPC.ShellOpenPath, target),
    showItem: (target) => {
      void ipcRenderer.invoke(IPC.ShellShowItem, target);
    },
  },
};

contextBridge.exposeInMainWorld('smp', api);
