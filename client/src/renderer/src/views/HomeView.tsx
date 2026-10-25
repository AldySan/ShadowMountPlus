// SPDX-License-Identifier: GPL-3.0-or-later
import type { AppInfo, AppSettings } from '../../../shared/types';

export function HomeView(props: { appInfo: AppInfo | null; settings: AppSettings | null; onNavigate: (id: string) => void }) {
  const { appInfo, settings } = props;
  const repoSet = Boolean(settings?.repoPath);

  return (
    <div className="view">
      <div className="view-head">
        <h1>SM+ Toolbox</h1>
        <p className="sub">Companion app for ShadowMountPlus, the background auto-mounter for jailbroken PS5 consoles.</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <h2>Getting started</h2>
          <ul className="steps">
            <li className={repoSet ? 'done' : ''}>
              <div className="step-text">
                <span className="step-title">Set the ShadowMountPlus repository path</span>
                <span className="step-desc">
                  The toolbox runs the image-builder scripts (mkexfat.sh, New-OsfExfatImage.ps1) from your local checkout.
                </span>
              </div>
              <button type="button" className="btn btn-small" onClick={() => props.onNavigate('settings')}>
                Settings
              </button>
            </li>
            <li className="done">
              <div className="step-text">
                <span className="step-title">Theme</span>
                <span className="step-desc">Follows your system theme by default; switch to light or dark in Settings.</span>
              </div>
            </li>
          </ul>
        </div>

        <div className="card">
          <h2>Environment</h2>
          <dl className="kv">
            <dt>Toolbox</dt>
            <dd>{appInfo ? `v${appInfo.version}` : '—'}</dd>
            <dt>Platform</dt>
            <dd>{appInfo ? `${appInfo.platform} (${appInfo.arch})` : '—'}</dd>
            <dt>Electron</dt>
            <dd>{appInfo?.electron ?? '—'}</dd>
            <dt>Node</dt>
            <dd>{appInfo?.node ?? '—'}</dd>
          </dl>
        </div>
      </div>

      <div className="card">
        <h2>About</h2>
        <p>
          SM+ Toolbox wraps the ShadowMountPlus build workflow in a desktop app: create UFS2, exFAT and compressed PFS
          images from game dumps, verify them, send the payload to your console, and troubleshoot setups without
          living in a terminal. External tools (UFS2Tool, MkPFS) are detected automatically and can be downloaded
          from the Tools section.
        </p>
        <p className="dim">
          ShadowMountPlus is developed by Drakmor and contributors. This client is licensed GPL-3.0-or-later.
        </p>
        <p className="links">
          <a href="https://github.com/drakmor/ShadowMountPlus">Repository</a>
          <span aria-hidden="true">·</span>
          <a href="https://github.com/drakmor/ShadowMountPlus#readme">Documentation</a>
          <span aria-hidden="true">·</span>
          <a href="https://github.com/drakmor/ShadowMountPlus/releases">Releases</a>
        </p>
      </div>
    </div>
  );
}
