// SPDX-License-Identifier: GPL-3.0-or-later
import { app, dialog, ipcMain, shell } from 'electron';
import { IPC } from '../shared/ipc-channels';
import { loadSettings, saveSettings } from './lib/settings';

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

export function registerIpc(): void {
  ipcMain.handle(IPC.SettingsGet, () => loadSettings());
  ipcMain.handle(IPC.SettingsSet, (_event, patch) => saveSettings(patch ?? {}));

  ipcMain.handle(IPC.AppInfo, () => ({
    version: app.getVersion(),
    electron: process.versions.electron,
    node: process.versions.node,
    platform: process.platform,
    arch: process.arch,
    userData: app.getPath('userData'),
  }));

  ipcMain.handle(IPC.DialogPickFolder, async (_event, title) => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: asString(title) || undefined,
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle(IPC.DialogPickFile, async (_event, opts) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: opts?.title,
      filters: opts?.filters,
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle(IPC.DialogPickSave, async (_event, opts) => {
    const result = await dialog.showSaveDialog({
      title: opts?.title,
      defaultPath: opts?.defaultPath,
      filters: opts?.filters,
    });
    return result.canceled ? null : (result.filePath ?? null);
  });

  ipcMain.handle(IPC.ShellOpenPath, async (_event, target) => shell.openPath(asString(target)));
  ipcMain.handle(IPC.ShellShowItem, (_event, target) => {
    shell.showItemInFolder(asString(target));
  });
}
