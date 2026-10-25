// SPDX-License-Identifier: GPL-3.0-or-later
import { BrowserWindow, app, clipboard, dialog, ipcMain, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { IPC } from '../shared/ipc-channels';
import type { BuildSpec, JobEvent, ToolEvent } from '../shared/types';
import { loadSettings, saveSettings } from './lib/settings';
import { detectEnvironment, findExecutable, repoScripts, resolveTools } from './lib/env';
import { buildSteps, jobTitle, stepsToPreview } from './lib/recipes';
import { runJob, RunningJob } from './lib/runner';
import { statFolder } from './lib/verifier';
import { downloadTool, listAssets } from './lib/toolmanager';

const IS_WINDOWS = process.platform === 'win32';

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const jobs = new Map<string, RunningJob>();
let jobCounter = 0;

function normalizeOutput(file: string, format: BuildSpec['format']): string {
  const ext = format === 'exfat' ? '.exfat' : format === 'ufs2' ? '.ffpkg' : '.ffpfsc';
  return file.toLowerCase().endsWith(ext) ? file : file + ext;
}

function prepareSpec(raw: unknown): BuildSpec {
  const spec = raw as BuildSpec;
  if (!spec || typeof spec !== 'object') throw new Error('Invalid job spec');
  const sourceDir = asString(spec.sourceDir);
  const outputFile = normalizeOutput(asString(spec.outputFile), spec.format);
  if (!sourceDir || !fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    throw new Error(`Source directory does not exist: ${sourceDir || '(empty)'}`);
  }
  if (!outputFile) throw new Error('Output file is required');

  const settings = loadSettings();
  const resolved = resolveTools(settings);

  if (spec.format === 'exfat' || (spec.format === 'ffpfsc' && (spec.innerFormat ?? 'exfat') === 'exfat')) {
    if (!repoScripts(settings).ok) {
      throw new Error('Set the ShadowMountPlus repository path in Settings first (it provides the exFAT builder script).');
    }
  }
  if (spec.format === 'ufs2' && resolved.ufs2tool.origin === 'missing') {
    throw new Error('UFS2Tool was not found. Download it from Settings, Tools.');
  }
  if (spec.format === 'ffpfsc' && resolved.mkpfs.origin === 'missing') {
    throw new Error('MkPFS was not found. Download it from Settings, Tools (requires Python 3).');
  }

  const dir = path.dirname(path.resolve(outputFile));
  fs.mkdirSync(dir, { recursive: true });

  return { ...spec, sourceDir, outputFile };
}

function stepContext(spec: BuildSpec, sourceFileCount: number) {
  const settings = loadSettings();
  const resolved = resolveTools(settings);
  return {
    isWindows: IS_WINDOWS,
    repoPath: settings.repoPath,
    mkpfs: resolved.mkpfs,
    ufs2tool: resolved.ufs2tool,
    sourceFileCount,
  };
}

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
  ipcMain.handle(IPC.ClipboardWrite, (_event, text) => {
    clipboard.writeText(asString(text));
  });

  ipcMain.handle(IPC.EnvDetect, async () => detectEnvironment(loadSettings()));

  ipcMain.handle(IPC.FolderStat, (_event, target) => statFolder(asString(target)));

  ipcMain.handle(IPC.JobPreview, (_event, raw) => {
    const spec = raw as BuildSpec;
    const steps = buildSteps(spec, stepContext(spec, 0));
    return { title: jobTitle(spec), steps: stepsToPreview(steps) };
  });

  ipcMain.handle(IPC.JobRun, async (event, raw) => {
    const spec = prepareSpec(raw);
    const sourceFileCount = statFolder(spec.sourceDir)?.fileCount ?? 0;
    const steps = buildSteps(spec, stepContext(spec, sourceFileCount));

    const settings = loadSettings();
    const jobId = `job-${++jobCounter}`;
    const sender = BrowserWindow.fromWebContents(event.sender);
    const send = (payload: JobEvent) => {
      if (!sender || sender.isDestroyed()) return;
      sender.webContents.send(IPC.EventJob, payload);
    };

    send({ jobId, type: 'start', title: jobTitle(spec), steps: steps.length });

    const running = runJob(jobId, steps, {
      privilege: settings.privilege,
      pkexecAvailable: process.platform === 'linux' && Boolean(findExecutable('pkexec')),
      runningAsRoot: typeof process.getuid === 'function' && process.getuid() === 0,
      onStep: (index, _total, step) => {
        send({ jobId, type: 'step', index, description: step.description, command: step.command });
      },
      onData: (chunk) => send({ jobId, type: 'data', chunk }),
    });
    jobs.set(jobId, running);
    const result = await running.done;
    jobs.delete(jobId);
    send({ jobId, type: 'exit', code: result.code, ok: result.ok, note: result.note });
    return { jobId };
  });

  ipcMain.handle(IPC.JobCancel, (_event, jobId) => {
    const running = jobs.get(asString(jobId));
    if (!running) return false;
    running.cancel();
    return true;
  });

  ipcMain.handle(IPC.ToolListAssets, (_event, tool) => {
    if (tool !== 'mkpfs' && tool !== 'ufs2tool') throw new Error('Unknown tool');
    return listAssets(tool);
  });

  ipcMain.handle(IPC.ToolDownload, async (event, tool, assetName) => {
    if (tool !== 'mkpfs' && tool !== 'ufs2tool') throw new Error('Unknown tool');
    const sender = BrowserWindow.fromWebContents(event.sender);
    const emit = (payload: ToolEvent) => {
      if (!sender || sender.isDestroyed()) return;
      sender.webContents.send(IPC.EventTool, payload);
    };
    try {
      const result = await downloadTool(tool, emit, typeof assetName === 'string' ? assetName : undefined);
      const settings = loadSettings();
      saveSettings({ toolCache: { ...settings.toolCache, [tool]: result.path } });
      emit({ tool, type: 'done', path: result.path, version: result.version });
      return { ok: true, path: result.path };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      emit({ tool, type: 'done', error: message });
      return { ok: false, error: message };
    }
  });
}
