// SPDX-License-Identifier: GPL-3.0-or-later
import type { AppInfo, AppSettings, ThemeMode } from '../../../shared/types';
import { smp } from '../lib/api';
import { Segmented } from '../components/Segmented';
import { PathField } from '../components/PathField';

export function SettingsView(props: {
  settings: AppSettings | null;
  appInfo: AppInfo | null;
  onChange: (patch: Partial<AppSettings>) => void;
}) {
  const { settings, appInfo } = props;

  if (!settings) {
    return (
      <div className="view">
        <div className="view-head">
          <h1>Settings</h1>
        </div>
        <p className="sub">Loading…</p>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-head">
        <h1>Settings</h1>
        <p className="sub">Stored locally in {appInfo ? `${appInfo.userData}/settings.json` : 'your user profile'}.</p>
      </div>

      <div className="card">
        <h2>Appearance</h2>
        <div className="field">
          <label>Theme</label>
          <Segmented<ThemeMode>
            value={settings.theme}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
            onChange={(theme) => props.onChange({ theme })}
            ariaLabel="Theme"
          />
        </div>
      </div>

      <div className="card">
        <h2>ShadowMountPlus repository</h2>
        <PathField
          label="Local checkout"
          value={settings.repoPath}
          kind="folder"
          dialogTitle="Select your ShadowMountPlus checkout"
          placeholder="/home/user/ShadowMountPlus"
          onChange={(repoPath) => props.onChange({ repoPath })}
          hint="Image-builder scripts shipped with the repo are executed from this directory, so the client always uses your checked-out version."
        />
      </div>

      <div className="card">
        <h2>Storage</h2>
        <div className="field">
          <label>App data</label>
          <div className="pathfield">
            <input type="text" className="mono" readOnly value={appInfo?.userData ?? ''} spellCheck={false} />
            <button
              type="button"
              className="btn"
              disabled={!appInfo}
              onClick={() => appInfo && void smp.shell.openPath(appInfo.userData)}
            >
              Open folder
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>About</h2>
        <p>
          SM+ Toolbox {appInfo ? `v${appInfo.version}` : ''} — part of the ShadowMountPlus project, licensed
          GPL-3.0-or-later.
        </p>
        <p className="links">
          <a href="https://github.com/drakmor/ShadowMountPlus">Repository</a>
          <span aria-hidden="true">·</span>
          <a href="https://github.com/drakmor/ShadowMountPlus/blob/1.7/client">Client source</a>
        </p>
      </div>
    </div>
  );
}
