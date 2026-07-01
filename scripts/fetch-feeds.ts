import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import Parser from 'rss-parser';
import type { FeedRun, FeedSource, SignalData, SignalItem } from '../src/lib/schema.ts';

type ParserItem = {
  title?: string;
  link?: string;
  guid?: string;
  creator?: string;
  author?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  content?: string;
  enclosure?: {
    url?: string;
  };
};

const repoRoot = process.cwd();
const feedsPath = path.join(repoRoot, 'src/data/default-feeds.json');
const outputPath = path.join(repoRoot, 'public/data/items.json');
const maxItemsPerFeed = Number.parseInt(process.env.SIGNAL_MAX_ITEMS_PER_FEED ?? '12', 10);

const parser = new Parser<Record<string, never>, ParserItem>({
  timeout: 15000,
  headers: {
    'User-Agent': 'the-signal-rss-homepage/0.1 (+https://github.com/sumitridhal/the-signal)',
  },
});

async function main(): Promise<void> {
  const feeds = await readFeeds();
  const generatedAt = new Date().toISOString();
  const runs: FeedRun[] = [];
  const items: SignalItem[] = [];

  const results = await Promise.allSettled(feeds.filter((feed) => feed.enabled).map((feed) => fetchFeed(feed, generatedAt)));

  for (const result of results) {
    if (result.status === 'fulfilled') {
      runs.push(result.value.run);
      items.push(...result.value.items);
    } else {
      runs.push({
        sourceKey: 'unknown',
        sourceName: 'Unknown source',
        status: 'failed',
        fetchedCount: 0,
        errorMessage: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }

  const uniqueItems = dedupeItems(items).sort((a, b) => dateValue(b.publishedAt ?? b.firstSeenAt) - dateValue(a.publishedAt ?? a.firstSeenAt));
  const data: SignalData = {
    generatedAt,
    itemCount: uniqueItems.length,
    feeds,
    runs,
    items: uniqueItems,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`);

  const failures = runs.filter((run) => run.status === 'failed');
  console.log(`Fetched ${uniqueItems.length} stories from ${runs.length - failures.length}/${runs.length} feeds.`);
  if (failures.length > 0) {
    console.log(`Partial feed failures: ${failures.map((run) => run.sourceName).join(', ')}`);
  }
}

async function readFeeds(): Promise<FeedSource[]> {
  const raw = await readFile(feedsPath, 'utf8');
  return JSON.parse(raw) as FeedSource[];
}

async function fetchFeed(feed: FeedSource, generatedAt: string): Promise<{ run: FeedRun; items: SignalItem[] }> {
  try {
    const parsed = await parser.parseURL(feed.feedUrl);
    const items = parsed.items.slice(0, maxItemsPerFeed).map((item) => normalizeItem(feed, item, generatedAt));

    return {
      run: {
        sourceKey: feed.key,
        sourceName: feed.name,
        status: 'success',
        fetchedCount: items.length,
        errorMessage: null,
      },
      items,
    };
  } catch (error) {
    return {
      run: {
        sourceKey: feed.key,
        sourceName: feed.name,
        status: 'failed',
        fetchedCount: 0,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      items: [],
    };
  }
}

function normalizeItem(feed: FeedSource, item: ParserItem, generatedAt: string): SignalItem {
  const title = cleanText(item.title) || 'Untitled story';
  const url = item.link ?? item.guid ?? feed.homepageUrl;
  const publishedAt = normalizeDate(item.isoDate ?? item.pubDate);

  return {
    id: stableId(`${feed.key}:${url}:${title}`),
    sourceKey: feed.key,
    sourceName: feed.name,
    section: feed.section,
    title,
    url,
    author: cleanText(item.creator ?? item.author) || null,
    publishedAt,
    excerpt: excerptFrom(item),
    imageUrl: item.enclosure?.url ?? null,
    tags: feed.tags,
    firstSeenAt: generatedAt,
  };
}

function excerptFrom(item: ParserItem): string | null {
  const text = cleanText(item.contentSnippet ?? item.content);
  if (!text) {
    return null;
  }

  return text.length > 220 ? `${text.slice(0, 217).trim()}...` : text;
}

function cleanText(value: string | undefined): string {
  if (!value) {
    return '';
  }

  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeDate(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function dedupeItems(items: SignalItem[]): SignalItem[] {
  const seen = new Set<string>();
  const unique: SignalItem[] = [];

  for (const item of items) {
    if (seen.has(item.url)) {
      continue;
    }

    seen.add(item.url);
    unique.push(item);
  }

  return unique;
}

function stableId(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function dateValue(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

await main();
