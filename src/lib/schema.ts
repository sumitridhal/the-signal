export type FeedSection = 'top' | 'technology' | 'ai' | 'business' | 'culture';

export type LayoutPreset = 'newspaper' | 'reading-room' | 'compact';

export type ThemePreference = 'system' | 'light' | 'dark';

export type ThemeAccent = 'sepia' | 'slate' | 'sage' | 'rose';

export type DensityPreference = 'comfortable' | 'compact';

export interface FeedSource {
  key: string;
  name: string;
  homepageUrl: string;
  feedUrl: string;
  section: FeedSection;
  tags: string[];
  enabled: boolean;
}

export interface SignalItem {
  id: string;
  sourceKey: string;
  sourceName: string;
  section: FeedSection;
  title: string;
  url: string;
  author: string | null;
  publishedAt: string | null;
  excerpt: string | null;
  imageUrl: string | null;
  tags: string[];
  firstSeenAt: string;
}

export interface FeedRun {
  sourceKey: string;
  sourceName: string;
  status: 'success' | 'failed';
  fetchedCount: number;
  errorMessage: string | null;
}

export interface SignalData {
  generatedAt: string;
  itemCount: number;
  feeds: FeedSource[];
  runs: FeedRun[];
  items: SignalItem[];
}

export interface UserPreferences {
  siteTitle: string;
  siteDeck: string;
  theme: ThemePreference;
  themeAccent: ThemeAccent;
  density: DensityPreference;
  layoutPreset: LayoutPreset;
  sectionOrder: FeedSection[];
  hiddenSections: FeedSection[];
  disabledFeedKeys: string[];
  customFeeds: FeedSource[];
}

export const sectionLabels: Record<FeedSection, string> = {
  top: 'Top Stories',
  technology: 'Technology',
  ai: 'AI',
  business: 'Business',
  culture: 'Culture',
};

export const sectionDescriptions: Record<FeedSection, string> = {
  top: 'The broadest front-page stories from the default news mix.',
  technology: 'Engineering, platforms, and the web moving under your feet.',
  ai: 'Model providers, research, tools, and the industry around them.',
  business: 'Startups, markets, companies, and product shifts.',
  culture: 'Design, media, and internet culture worth reading slowly.',
};

export const defaultPreferences: UserPreferences = {
  siteTitle: 'The Signal',
  siteDeck: 'A calm RSS front page you can fork, tune, and publish on GitHub Pages.',
  theme: 'system',
  themeAccent: 'sepia',
  density: 'comfortable',
  layoutPreset: 'newspaper',
  sectionOrder: ['top', 'technology', 'ai', 'business', 'culture'],
  hiddenSections: [],
  disabledFeedKeys: [],
  customFeeds: [],
};
