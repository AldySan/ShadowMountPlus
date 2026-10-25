// SPDX-License-Identifier: GPL-3.0-or-later
// Folder inspection used by the Create view: structure checks and sizing
// figures for the game source directory.

import fs from 'node:fs';
import path from 'node:path';
import type { FolderStat } from '../../shared/types';

export function statFolder(input: string): FolderStat | null {
  if (typeof input !== 'string' || input.length === 0) return null;
  let stat: fs.Stats;
  try {
    stat = fs.statSync(input);
  } catch {
    return { path: input, exists: false, ebootBin: false, paramJson: false, fileCount: 0, dirCount: 0, totalBytes: 0 };
  }
  if (!stat.isDirectory()) {
    return { path: input, exists: false, ebootBin: false, paramJson: false, fileCount: 0, dirCount: 0, totalBytes: 0 };
  }

  let fileCount = 0;
  let dirCount = 0;
  let totalBytes = 0;
  const stack: string[] = [input];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        dirCount += 1;
        stack.push(full);
      } else if (entry.isFile()) {
        fileCount += 1;
        try {
          totalBytes += fs.statSync(full).size;
        } catch {
          /* unreadable file: skip size */
        }
      }
    }
  }

  const paramJsonPath = path.join(input, 'sce_sys', 'param.json');
  const paramJson = fs.existsSync(paramJsonPath);
  let paramInfo: FolderStat['paramInfo'];
  if (paramJson) {
    try {
      const parsed = JSON.parse(fs.readFileSync(paramJsonPath, 'utf8')) as Record<string, unknown>;
      paramInfo = {
        titleId: typeof parsed.titleId === 'string' ? parsed.titleId : undefined,
        contentId: typeof parsed.contentId === 'string' ? parsed.contentId : undefined,
      };
    } catch {
      paramInfo = {};
    }
  }

  return {
    path: input,
    exists: true,
    ebootBin: fs.existsSync(path.join(input, 'eboot.bin')),
    paramJson,
    paramInfo,
    fileCount,
    dirCount,
    totalBytes,
  };
}

export function countFiles(dir: string): number {
  const stat = statFolder(dir);
  return stat?.fileCount ?? 0;
}
