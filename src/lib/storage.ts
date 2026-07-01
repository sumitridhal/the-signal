import { defaultPreferences, type FeedSection, type FeedSource, type UserPreferences } from './schema';

const storageKey = 'the-signal/preferences/v1';

function isFeedSection(value: unknown): value is FeedSection {
  return typeof value === 'string' && value in defaultPreferences.sectionOrder.reduce<Record<string, true>>((map, section) => {
    map[section] = true;
    return map;
  }, {});
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function feedArray(value: unknown): FeedSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((feed) => {
    if (!feed || typeof feed !== 'object') {
      return [];
    }

    const partial = feed as Partial<FeedSource>;
    if (!partial.key || !partial.name || !partial.feedUrl || typeof partial.key !== 'string' || typeof partial.name !== 'string' || typeof partial.feedUrl !== 'string') {
      return [];
    }

    return [{
      key: partial.key,
      name: partial.name,
      homepageUrl: typeof partial.homepageUrl === 'string' ? partial.homepageUrl : partial.feedUrl,
      feedUrl: partial.feedUrl,
      section: isFeedSection(partial.section) ? partial.section : 'technology',
      tags: stringArray(partial.tags),
      enabled: partial.enabled !== false,
    }];
  });
}

export function normalizePreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== 'object') {
    return defaultPreferences;
  }

  const partial = value as Partial<UserPreferences>;
  const sectionOrder = Array.isArray(partial.sectionOrder)
    ? partial.sectionOrder.filter(isFeedSection)
    : defaultPreferences.sectionOrder;
  const mergedOrder = [...sectionOrder, ...defaultPreferences.sectionOrder.filter((section) => !sectionOrder.includes(section))];

  return {
    siteTitle: typeof partial.siteTitle === 'string' && partial.siteTitle.trim() ? partial.siteTitle.trim() : defaultPreferences.siteTitle,
    siteDeck: typeof partial.siteDeck === 'string' && partial.siteDeck.trim() ? partial.siteDeck.trim() : defaultPreferences.siteDeck,
    theme: partial.theme === 'light' || partial.theme === 'dark' || partial.theme === 'system' ? partial.theme : defaultPreferences.theme,
    density: partial.density === 'compact' || partial.density === 'comfortable' ? partial.density : defaultPreferences.density,
    layoutPreset: partial.layoutPreset === 'reading-room' || partial.layoutPreset === 'compact' || partial.layoutPreset === 'newspaper'
      ? partial.layoutPreset
      : defaultPreferences.layoutPreset,
    sectionOrder: mergedOrder,
    hiddenSections: Array.isArray(partial.hiddenSections) ? partial.hiddenSections.filter(isFeedSection) : [],
    disabledFeedKeys: stringArray(partial.disabledFeedKeys),
    customFeeds: feedArray(partial.customFeeds),
  };
}

export function loadPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return defaultPreferences;
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return defaultPreferences;
  }

  try {
    return normalizePreferences(JSON.parse(raw));
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(preferences: UserPreferences): void {
  window.localStorage.setItem(storageKey, JSON.stringify(preferences, null, 2));
}

export function resetPreferences(): UserPreferences {
  window.localStorage.removeItem(storageKey);
  return defaultPreferences;
}

export function exportPreferences(preferences: UserPreferences): string {
  return JSON.stringify({ version: 1, preferences }, null, 2);
}

export function importPreferences(raw: string): UserPreferences {
  const parsed = JSON.parse(raw) as { preferences?: unknown };
  return normalizePreferences(parsed.preferences ?? parsed);
}
