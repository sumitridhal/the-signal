import { useState } from 'react';
import { sectionLabels, type FeedSection, type FeedSource, type UserPreferences } from '../lib/schema';

interface FeedManagerProps {
  feeds: FeedSource[];
  preferences: UserPreferences;
  onChange: (preferences: UserPreferences) => void;
}

export function FeedManager({ feeds, preferences, onChange }: FeedManagerProps) {
  const [name, setName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [section, setSection] = useState<FeedSection>('technology');
  const disabled = new Set(preferences.disabledFeedKeys);
  const allFeeds = [...feeds, ...preferences.customFeeds];

  function toggleFeed(key: string) {
    const nextDisabled = disabled.has(key)
      ? preferences.disabledFeedKeys.filter((feedKey) => feedKey !== key)
      : [...preferences.disabledFeedKeys, key];

    onChange({ ...preferences, disabledFeedKeys: nextDisabled });
  }

  function addFeed() {
    const trimmedName = name.trim();
    const trimmedUrl = feedUrl.trim();
    if (!trimmedName || !trimmedUrl) {
      return;
    }

    const key = `custom-${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || Date.now()}`;
    const customFeed: FeedSource = {
      key,
      name: trimmedName,
      homepageUrl: trimmedUrl,
      feedUrl: trimmedUrl,
      section,
      tags: ['custom'],
      enabled: true,
    };

    onChange({ ...preferences, customFeeds: [...preferences.customFeeds, customFeed] });
    setName('');
    setFeedUrl('');
  }

  function removeCustomFeed(key: string) {
    onChange({
      ...preferences,
      customFeeds: preferences.customFeeds.filter((feed) => feed.key !== key),
      disabledFeedKeys: preferences.disabledFeedKeys.filter((feedKey) => feedKey !== key),
    });
  }

  return (
    <section className="control-panel" aria-labelledby="feed-manager-title">
      <div>
        <p className="eyebrow">Sources</p>
        <h2 id="feed-manager-title">Tune the feed mix</h2>
        <p className="control-copy">Enable, hide, or locally add RSS feeds from the UI. Custom feeds are saved in this browser and included in exported settings.</p>
      </div>

      <div className="feed-list">
        {allFeeds.map((feed) => (
          <div className="feed-toggle" key={feed.key}>
            <label>
              <input checked={!disabled.has(feed.key)} onChange={() => toggleFeed(feed.key)} type="checkbox" />
              <span>
                <strong>{feed.name}</strong>
                <small>{sectionLabels[feed.section]} · {feed.feedUrl}</small>
              </span>
            </label>
            {feed.key.startsWith('custom-') ? <button onClick={() => removeCustomFeed(feed.key)} type="button">Remove</button> : null}
          </div>
        ))}
      </div>

      <div className="add-feed">
        <input aria-label="Feed name" onChange={(event) => setName(event.target.value)} placeholder="Feed name" value={name} />
        <input aria-label="RSS URL" onChange={(event) => setFeedUrl(event.target.value)} placeholder="https://example.com/feed.xml" value={feedUrl} />
        <select aria-label="Feed section" onChange={(event) => setSection(event.target.value as FeedSection)} value={section}>
          {Object.entries(sectionLabels).filter(([key]) => key !== 'top').map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button onClick={addFeed} type="button">Add locally</button>
      </div>
      <p className="fine-print">Static hosting note: browser-added feeds are saved for layout/export. To include their stories in GitHub Pages refreshes, export settings and add the feed to `src/data/default-feeds.json`.</p>
    </section>
  );
}
