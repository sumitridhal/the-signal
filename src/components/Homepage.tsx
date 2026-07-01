import { useMemo } from 'react';
import { formatDate, groupBySection, relativeAge, sortItemsNewestFirst, visibleItems } from '../lib/items';
import {
  sectionDescriptions,
  sectionLabels,
  type FeedSection,
  type FeedSource,
  type SignalItem,
  type UserPreferences,
} from '../lib/schema';

interface HomepageProps {
  feeds: FeedSource[];
  generatedAt: string | null;
  items: SignalItem[];
  preferences: UserPreferences;
  sourceIssueCount: number;
}

export function Homepage({ feeds, generatedAt, items, preferences, sourceIssueCount }: HomepageProps) {
  const visible = useMemo(() => sortItemsNewestFirst(visibleItems(items, feeds, preferences)), [feeds, items, preferences]);
  const leadItem = visible[0] ?? null;
  const secondaryItems = visible.slice(1, preferences.layoutPreset === 'compact' ? 5 : 7);
  const sections = useMemo(() => groupBySection(visible, preferences.sectionOrder), [preferences.sectionOrder, visible]);
  const hiddenSections = new Set(preferences.hiddenSections);
  const bodySections = preferences.sectionOrder.filter((section) => section !== 'top' && !hiddenSections.has(section));

  return (
    <main className="front-page" aria-label="RSS newspaper homepage">
      <header className="masthead">
        <p className="eyebrow">Open source RSS newspaper</p>
        <h1>{preferences.siteTitle}</h1>
        <p className="deck">{preferences.siteDeck}</p>
        <div className="edition-meta" aria-label="Edition metadata">
          <span>{visible.length} stories</span>
          <span>{feeds.length + preferences.customFeeds.length} feeds configured</span>
          <span>Updated {generatedAt ? formatDate(generatedAt) : 'after the first feed fetch'}</span>
          {sourceIssueCount > 0 ? <span>{sourceIssueCount} quiet source issue{sourceIssueCount === 1 ? '' : 's'}</span> : null}
        </div>
      </header>

      {leadItem ? (
        <section className="lead-grid" aria-label="Front page lead stories">
          <article className="lead-story">
            <StoryKicker item={leadItem} />
            <h2><a href={leadItem.url} target="_blank" rel="noreferrer">{leadItem.title}</a></h2>
            {leadItem.excerpt ? <p>{leadItem.excerpt}</p> : null}
            <div className="story-actions">
              <a href={leadItem.url} target="_blank" rel="noreferrer">Read original</a>
              <span>{relativeAge(leadItem.publishedAt ?? leadItem.firstSeenAt)}</span>
            </div>
          </article>
          <div className="secondary-stack">
            {secondaryItems.map((item) => <StoryRow item={item} key={item.id} />)}
          </div>
        </section>
      ) : (
        <EmptyState />
      )}

      <section className="section-grid" aria-label="RSS sections">
        {bodySections.map((section) => (
          <SectionShelf items={sections.get(section) ?? []} key={section} section={section} />
        ))}
      </section>
    </main>
  );
}

function SectionShelf({ items, section }: { items: SignalItem[]; section: FeedSection }) {
  const displayItems = items.slice(0, 5);

  return (
    <section className="shelf">
      <div className="shelf-header">
        <p className="eyebrow">{sectionLabels[section]}</p>
        <p>{sectionDescriptions[section]}</p>
      </div>
      {displayItems.length > 0 ? (
        <div className="shelf-list">
          {displayItems.map((item) => <StoryRow item={item} key={item.id} />)}
        </div>
      ) : (
        <p className="empty-note">No visible stories in this section yet. Enable more feeds or wait for the next scheduled fetch.</p>
      )}
    </section>
  );
}

function StoryRow({ item }: { item: SignalItem }) {
  return (
    <article className="story-row">
      <StoryKicker item={item} />
      <h3><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></h3>
      {item.excerpt ? <p>{item.excerpt}</p> : null}
    </article>
  );
}

function StoryKicker({ item }: { item: SignalItem }) {
  return (
    <div className="story-kicker">
      <span>{item.sourceName}</span>
      <span>{formatDate(item.publishedAt)}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="empty-state">
      <p className="eyebrow">No edition yet</p>
      <h2>Run the feed fetch to publish your first front page.</h2>
      <p>Use <code>npm run fetch-feeds</code>, then build or deploy with GitHub Actions.</p>
    </section>
  );
}
