import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { FeedManager } from './components/FeedManager'
import { Homepage } from './components/Homepage'
import { LayoutCustomizer } from './components/LayoutCustomizer'
import { defaultPreferences, type SignalData, type UserPreferences } from './lib/schema'
import { loadPreferences, savePreferences } from './lib/storage'

function App() {
  const [data, setData] = useState<SignalData | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences())
  const pageClass = useMemo(
    () => `app-shell theme-${preferences.theme} density-${preferences.density} preset-${preferences.layoutPreset}`,
    [preferences.density, preferences.layoutPreset, preferences.theme],
  )

  useEffect(() => {
    savePreferences(preferences)
  }, [preferences])

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

  return (
    <div className={pageClass}>
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
      <aside className="customizer" aria-label="Homepage customization">
        <LayoutCustomizer preferences={preferences} onChange={setPreferences} />
        <FeedManager feeds={safeData.feeds} preferences={preferences} onChange={setPreferences} />
        <section className="control-panel">
          <p className="eyebrow">Static by design</p>
          <h2>GitHub Pages-ready</h2>
          <p className="control-copy">This site has no server, database, login, or runtime API. GitHub Actions refreshes RSS into static JSON, then Pages serves the built files.</p>
          <button onClick={() => setPreferences(defaultPreferences)} type="button">Restore starter edition</button>
        </section>
      </aside>
    </div>
  )
}

export default App
