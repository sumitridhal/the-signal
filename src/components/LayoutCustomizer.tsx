import { useState } from 'react';
import { defaultPreferences, sectionLabels, type FeedSection, type UserPreferences } from '../lib/schema';
import { exportPreferences, importPreferences } from '../lib/storage';

interface LayoutCustomizerProps {
  preferences: UserPreferences;
  onChange: (preferences: UserPreferences) => void;
}

export function LayoutCustomizer({ preferences, onChange }: LayoutCustomizerProps) {
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  function updatePreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    onChange({ ...preferences, [key]: value });
  }

  function moveSection(section: FeedSection, direction: -1 | 1) {
    const index = preferences.sectionOrder.indexOf(section);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= preferences.sectionOrder.length) {
      return;
    }

    const nextOrder = [...preferences.sectionOrder];
    nextOrder[index] = preferences.sectionOrder[nextIndex];
    nextOrder[nextIndex] = section;
    updatePreference('sectionOrder', nextOrder);
  }

  function toggleSection(section: FeedSection) {
    const hidden = new Set(preferences.hiddenSections);
    if (hidden.has(section)) {
      hidden.delete(section);
    } else {
      hidden.add(section);
    }

    updatePreference('hiddenSections', [...hidden]);
  }

  function downloadExport() {
    const blob = new Blob([exportPreferences(preferences)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'the-signal-settings.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function applyImport() {
    try {
      onChange(importPreferences(importText));
      setImportText('');
      setImportError(null);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not import that JSON.');
    }
  }

  return (
    <section className="control-panel" aria-labelledby="layout-customizer-title">
      <div>
        <p className="eyebrow">Layout</p>
        <h2 id="layout-customizer-title">Make the front page yours</h2>
        <p className="control-copy">Everything here is saved in localStorage. Export JSON to move the same setup to another browser or commit it later.</p>
      </div>

      <div className="settings-grid">
        <label>
          Site title
          <input onChange={(event) => updatePreference('siteTitle', event.target.value)} value={preferences.siteTitle} />
        </label>
        <label>
          Deck
          <input onChange={(event) => updatePreference('siteDeck', event.target.value)} value={preferences.siteDeck} />
        </label>
        <label>
          Theme
          <select onChange={(event) => updatePreference('theme', event.target.value as UserPreferences['theme'])} value={preferences.theme}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          Density
          <select onChange={(event) => updatePreference('density', event.target.value as UserPreferences['density'])} value={preferences.density}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>
        <label>
          Layout preset
          <select onChange={(event) => updatePreference('layoutPreset', event.target.value as UserPreferences['layoutPreset'])} value={preferences.layoutPreset}>
            <option value="newspaper">Newspaper</option>
            <option value="reading-room">Reading room</option>
            <option value="compact">Compact wire</option>
          </select>
        </label>
      </div>

      <div className="section-order">
        {preferences.sectionOrder.map((section, index) => (
          <div className="section-order-row" key={section}>
            <label>
              <input checked={!preferences.hiddenSections.includes(section)} onChange={() => toggleSection(section)} type="checkbox" />
              {sectionLabels[section]}
            </label>
            <div>
              <button disabled={index === 0} onClick={() => moveSection(section, -1)} type="button">Up</button>
              <button disabled={index === preferences.sectionOrder.length - 1} onClick={() => moveSection(section, 1)} type="button">Down</button>
            </div>
          </div>
        ))}
      </div>

      <div className="settings-actions">
        <button onClick={downloadExport} type="button">Export JSON</button>
        <button onClick={() => onChange(defaultPreferences)} type="button">Reset</button>
      </div>

      <div className="import-box">
        <label>
          Import settings JSON
          <textarea onChange={(event) => setImportText(event.target.value)} placeholder="Paste exported JSON here" value={importText} />
        </label>
        <button disabled={!importText.trim()} onClick={applyImport} type="button">Import</button>
        {importError ? <p className="error-note">{importError}</p> : null}
      </div>
    </section>
  );
}
