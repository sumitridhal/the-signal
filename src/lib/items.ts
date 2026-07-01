import type { FeedSection, FeedSource, SignalItem, UserPreferences } from './schema';

export function visibleFeeds(feeds: FeedSource[], preferences: UserPreferences): FeedSource[] {
  const disabled = new Set(preferences.disabledFeedKeys);
  const allFeeds = [...feeds, ...preferences.customFeeds];
  return allFeeds.filter((feed) => feed.enabled && !disabled.has(feed.key));
}

export function visibleItems(items: SignalItem[], feeds: FeedSource[], preferences: UserPreferences): SignalItem[] {
  const visibleFeedKeys = new Set(visibleFeeds(feeds, preferences).map((feed) => feed.key));
  const hiddenSections = new Set(preferences.hiddenSections);

  return items.filter((item) => visibleFeedKeys.has(item.sourceKey) && !hiddenSections.has(item.section));
}

export function sortItemsNewestFirst(items: SignalItem[]): SignalItem[] {
  return [...items].sort((a, b) => dateValue(b.publishedAt ?? b.firstSeenAt) - dateValue(a.publishedAt ?? a.firstSeenAt));
}

export function groupBySection(items: SignalItem[], sectionOrder: FeedSection[]): Map<FeedSection, SignalItem[]> {
  const sections = new Map<FeedSection, SignalItem[]>();
  sectionOrder.forEach((section) => sections.set(section, []));

  for (const item of items) {
    const bucket = sections.get(item.section);
    if (bucket) {
      bucket.push(item);
    }
  }

  return sections;
}

export function formatDate(value: string | null): string {
  if (!value) {
    return 'Undated';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Undated';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function relativeAge(value: string | null): string {
  if (!value) {
    return 'unknown age';
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return 'unknown age';
  }

  const diffHours = Math.max(1, Math.round((Date.now() - timestamp) / 36e5));
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function dateValue(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
