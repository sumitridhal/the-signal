import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { FeedManager } from './components/FeedManager'
import { Homepage } from './components/Homepage'
import { LayoutCustomizer } from './components/LayoutCustomizer'
import { ThemeCustomizer } from './components/ThemeCustomizer'
import { defaultPreferences, type SignalData, type UserPreferences } from './lib/schema'
import { loadPreferences, savePreferences } from './lib/storage'

function App() {
  const [data, setData] = useState<SignalData | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'layout' | 'theme' | 'sources' | 'static'>('layout')
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences())
  const pageClass = useMemo(
    () => `app-shell theme-${preferences.theme} accent-${preferences.themeAccent} density-${preferences.density} preset-${preferences.layoutPreset}`,
    [preferences.density, preferences.layoutPreset, preferences.theme, preferences.themeAccent],
  )

  useEffect(() => {
    savePreferences(preferences)
  }, [preferences])

  useEffect(() => {
    if (!settingsOpen) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSettingsOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [settingsOpen])

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/items.json`, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Could not load generated feed data (${response.status})`)
        }

        setData(await response.json() as SignalData)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        setDataError(error instanceof Error ? error.message : 'Could not load generated feed data')
      }
    }

    loadData()
    return () => controller.abort()
  }, [])

  const safeData: SignalData = data ?? {
    generatedAt: '',
    itemCount: 0,
    feeds: [],
    runs: [],
    items: [],
  }

  const sourceIssueCount = safeData.runs.filter((run) => run.status === 'failed').length
  const settingsPanelId = 'settings-panel'
  const nextTheme = preferences.theme === 'system' ? 'light' : preferences.theme === 'light' ? 'dark' : 'system'
  const themeLabel = preferences.theme === 'dark' ? 'Switch to system theme' : preferences.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'

  return (
    <div className={pageClass}>
      <header className="top-actions" aria-label="Quick settings">
        <button
          aria-label={themeLabel}
          className="icon-button theme-toggle"
          onClick={() => setPreferences({ ...preferences, theme: nextTheme })}
          title={themeLabel}
          type="button"
        >
          {preferences.theme === 'dark' ? (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 4.25a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H13a1 1 0 0 1-1-1Zm0 14.5a1 1 0 0 1 1 1v.01a1 1 0 1 1-2 0v-.01a1 1 0 0 1 1-1Zm7.75-7.75h.01a1 1 0 1 1 0 2h-.01a1 1 0 1 1 0-2ZM3.25 12a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2h-.01a1 1 0 0 1-1-1Zm14.28-6.53a1 1 0 0 1 1.42 0l.01.01a1 1 0 1 1-1.42 1.42l-.01-.01a1 1 0 0 1 0-1.42ZM5.04 18.96a1 1 0 0 1 0-1.42l.01-.01a1 1 0 1 1 1.42 1.42l-.01.01a1 1 0 0 1-1.42 0Zm13.92-1.42a1 1 0 0 1 0 1.42 1 1 0 0 1-1.42 0l-.01-.01a1 1 0 1 1 1.42-1.42l.01.01ZM5.04 5.04a1 1 0 0 1 1.42 0l.01.01A1 1 0 0 1 5.05 6.47l-.01-.01a1 1 0 0 1 0-1.42ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M20.5 15.1A8.5 8.5 0 0 1 8.9 3.5 8.5 8.5 0 1 0 20.5 15.1Z" />
            </svg>
          )}
        </button>
        <button
          aria-controls={settingsPanelId}
          aria-expanded={settingsOpen}
          aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
          className="icon-button settings-button"
          onClick={() => setSettingsOpen((open) => !open)}
          title={settingsOpen ? 'Close settings' : 'Open settings'}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.4 3.5c0-.5 0-1-.1-1.5l2-1.5-2-3.5-2.4 1a9 9 0 0 0-2.5-1.4L15 2.5h-6l-.4 2.6A9 9 0 0 0 6.1 6.5l-2.4-1-2 3.5 2 1.5a10 10 0 0 0 0 3l-2 1.5 2 3.5 2.4-1a9 9 0 0 0 2.5 1.4L9 21.5h6l.4-2.6a9 9 0 0 0 2.5-1.4l2.4 1 2-3.5-2-1.5c.1-.5.1-1 .1-1.5Z" />
          </svg>
        </button>
      </header>
      {dataError ? (
        <aside className="notice" role="status">
          {dataError}. Run <code>npm run fetch-feeds</code> to generate local data.
        </aside>
      ) : null}
      <Homepage
        feeds={safeData.feeds}
        generatedAt={safeData.generatedAt || null}
        items={safeData.items}
        preferences={preferences}
        sourceIssueCount={sourceIssueCount}
      />
      {settingsOpen ? (
        <div className="settings-backdrop" onMouseDown={() => setSettingsOpen(false)}>
          <aside
            aria-label="Homepage settings"
            aria-modal="true"
            className="settings-dialog"
            id={settingsPanelId}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <nav className="settings-nav" aria-label="Settings sections">
              <p className="settings-nav-title">Settings</p>
              <button className={settingsTab === 'layout' ? 'active' : ''} onClick={() => setSettingsTab('layout')} type="button">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5A1.5 1.5 0 0 1 12 5.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 10.5v-5Zm8 8A1.5 1.5 0 0 1 13.5 12h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5v-5ZM4 15h6v2H4v-2Zm0 4h6v1H4v-1Zm10-15h6v2h-6V4Zm0 4h6v1h-6V8Z" /></svg>
                Layout
              </button>
              <button className={settingsTab === 'theme' ? 'active' : ''} onClick={() => setSettingsTab('theme')} type="button">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0 0 18h.7a2.2 2.2 0 0 0 1.5-3.8 1.2 1.2 0 0 1 .8-2.1h1.2A4.8 4.8 0 0 0 21 10.3C21 6.3 17 3 12 3ZM7.5 10.2a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Zm3.4-2.5a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Zm-3.2 7a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Zm7.2-7.1a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Z" /></svg>
                Theme
              </button>
              <button className={settingsTab === 'sources' ? 'active' : ''} onClick={() => setSettingsTab('sources')} type="button">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v13a1 1 0 0 1-1.48.88L12 16.37l-5.52 3.01A1 1 0 0 1 5 18.5v-13Zm4 2a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H9Zm0 4a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H9Z" /></svg>
                Sources
              </button>
              <button className={settingsTab === 'static' ? 'active' : ''} onClick={() => setSettingsTab('static')} type="button">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3 3.5 7.5 12 12l8.5-4.5L12 3Zm-8.5 8.5L12 16l8.5-4.5v3L12 19l-8.5-4.5v-3Z" /></svg>
                Static site
              </button>
            </nav>
            <div className="settings-content">
              <div className="settings-dialog-header">
                <div>
                  <p className="eyebrow">Settings</p>
                  <h2>{settingsTab === 'layout' ? 'Layout' : settingsTab === 'theme' ? 'Theme' : settingsTab === 'sources' ? 'Sources' : 'Static site'}</h2>
                </div>
                <button aria-label="Close settings" className="dialog-close" onClick={() => setSettingsOpen(false)} type="button">
                  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5Zm12.6 1.4L6.4 19 5 17.6 17.6 5 19 6.4Z" /></svg>
                </button>
              </div>
              <div className="settings-panel-stack">
                {settingsTab === 'layout' ? <LayoutCustomizer preferences={preferences} onChange={setPreferences} /> : null}
                {settingsTab === 'theme' ? <ThemeCustomizer preferences={preferences} onChange={setPreferences} /> : null}
                {settingsTab === 'sources' ? <FeedManager feeds={safeData.feeds} preferences={preferences} onChange={setPreferences} /> : null}
                {settingsTab === 'static' ? (
                  <section className="control-panel">
                    <p className="eyebrow">Static by design</p>
                    <h2>GitHub Pages-ready</h2>
                    <p className="control-copy">This site has no server, database, login, or runtime API. GitHub Actions refreshes RSS into static JSON, then Pages serves the built files.</p>
                    <button onClick={() => setPreferences(defaultPreferences)} type="button">Restore starter edition</button>
                  </section>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}

export default App
