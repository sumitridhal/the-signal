import type { ThemeAccent, UserPreferences } from '../lib/schema';

interface ThemeCustomizerProps {
  preferences: UserPreferences;
  onChange: (preferences: UserPreferences) => void;
}

const accentOptions: Array<{ key: ThemeAccent; label: string; detail: string }> = [
  { key: 'sepia', label: 'Sepia', detail: 'Warm newspaper paper and brown ink.' },
  { key: 'slate', label: 'Slate', detail: 'Cool editorial gray with blue signal accents.' },
  { key: 'sage', label: 'Sage', detail: 'Quiet green tint for a calmer reading room.' },
  { key: 'rose', label: 'Rose', detail: 'Soft magazine warmth with a stronger accent.' },
];

export function ThemeCustomizer({ preferences, onChange }: ThemeCustomizerProps) {
  return (
    <section className="control-panel" aria-labelledby="theme-customizer-title">
      <div>
        <p className="eyebrow">Theme</p>
        <h2 id="theme-customizer-title">Tune the reading atmosphere</h2>
        <p className="control-copy">Choose light behavior from the top icon, then tune the page tone here. These choices are saved with exported settings.</p>
      </div>

      <div className="theme-mode-grid" aria-label="Theme mode">
        {(['system', 'light', 'dark'] as const).map((theme) => (
          <button
            className={preferences.theme === theme ? 'theme-mode-card selected' : 'theme-mode-card'}
            key={theme}
            onClick={() => onChange({ ...preferences, theme })}
            type="button"
          >
            <span>{theme}</span>
          </button>
        ))}
      </div>

      <div className="accent-grid" aria-label="Theme accents">
        {accentOptions.map((option) => (
          <button
            className={preferences.themeAccent === option.key ? `accent-card selected accent-${option.key}` : `accent-card accent-${option.key}`}
            key={option.key}
            onClick={() => onChange({ ...preferences, themeAccent: option.key })}
            type="button"
          >
            <span className="accent-swatch" />
            <strong>{option.label}</strong>
            <small>{option.detail}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
