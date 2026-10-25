// SPDX-License-Identifier: GPL-3.0-or-later
// IPC channel names shared between the main process and the preload bridge.

export const IPC = {
  SettingsGet: 'settings:get',
  SettingsSet: 'settings:set',
  AppInfo: 'app:info',
  DialogPickFolder: 'dialog:pick-folder',
  DialogPickFile: 'dialog:pick-file',
  DialogPickSave: 'dialog:pick-save',
  ShellOpenPath: 'shell:open-path',
  ShellShowItem: 'shell:show-item',
  ClipboardWrite: 'clipboard:write-text',
  EnvDetect: 'env:detect',
  FolderStat: 'folder:stat',
  JobPreview: 'job:preview',
  JobRun: 'job:run',
  JobCancel: 'job:cancel',
  ToolDownload: 'tools:download',
  ToolListAssets: 'tools:list-assets',
  EventJob: 'job:event',
  EventTool: 'tool:event',
} as const;
