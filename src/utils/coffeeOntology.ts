import { FLAVOR_CATEGORIES } from '../data/presets';
import { ProcessMethod, RoastLevel } from '../types/coffee';

/**
 * Normalizes free-text coffee processing method strings into standard ProcessMethod union.
 */
export function normalizeProcessMethod(input?: string): ProcessMethod {
  if (!input) return 'Washed';
  const text = input.toLowerCase().trim();

  if (text.includes('thermal') || text.includes('熱衝擊') || text.includes('雙重厭氧熱衝擊')) {
    return 'Thermal Shock';
  }
  if (text.includes('anaerobic') || text.includes('厭氧') || text.includes('無氧')) {
    return 'Anaerobic';
  }
  if (text.includes('carbonic') || text.includes('二氧化碳') || text.includes('浸漬')) {
    return 'Carbonic Maceration';
  }
  if (text.includes('wet hulled') || text.includes('giling basah') || text.includes('濕剝')) {
    return 'Wet Hulled';
  }
  if (text.includes('honey') || text.includes('蜜處理') || text.includes('蜜處理法') || text.includes('yellow honey') || text.includes('black honey') || text.includes('red honey')) {
    return 'Honey';
  }
  if (text.includes('natural') || text.includes('日曬') || text.includes('乾燥') || text.includes('sun dried')) {
    return 'Natural';
  }
  if (text.includes('washed') || text.includes('水洗') || text.includes('fully washed')) {
    return 'Washed';
  }
  if (text.includes('experimental') || text.includes('特殊') || text.includes('酵母') || text.includes('發酵') || text.includes('koji')) {
    return 'Experimental';
  }

  return 'Washed';
}

/**
 * Normalizes free-text roast level string into RoastLevel union.
 */
export function normalizeRoastLevel(input?: string): RoastLevel {
  if (!input) return 'Light';
  const text = input.toLowerCase().trim();

  if (text.includes('dark') || text.includes('深') || text.includes('french') || text.includes('italian')) {
    return 'Dark';
  }
  if (text.includes('medium-dark') || text.includes('medium dark') || text.includes('中深') || text.includes('full city')) {
    return 'Medium-Dark';
  }
  if (text.includes('light-medium') || text.includes('light medium') || text.includes('淺中') || text.includes('cinnamon') || text.includes('half city')) {
    return 'Light-Medium';
  }
  if (text.includes('medium') || text.includes('中焙') || text.includes('city') || text.includes('中度')) {
    return 'Medium';
  }
  if (text.includes('light') || text.includes('淺焙') || text.includes('淺度') || text.includes('極淺')) {
    return 'Light';
  }

  return 'Light';
}

/**
 * Parses diverse regional date strings into standard YYYY-MM-DD format.
 */
export function normalizeRoastDate(input?: string): string {
  const fallback = new Date().toISOString().slice(0, 10);
  if (!input) return fallback;

  const raw = input.trim();

  // Pattern 1: ISO YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const isoMatch = raw.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Pattern 2: Taiwan Minguo date e.g. 115/08/15 or 115.08.15
  const minguoMatch = raw.match(/(\d{2,3})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (minguoMatch && parseInt(minguoMatch[1], 10) < 200) {
    const y = (parseInt(minguoMatch[1], 10) + 1911).toString();
    const m = minguoMatch[2].padStart(2, '0');
    const d = minguoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Pattern 3: English Date e.g. "Aug 15 2026", "15 Aug 2026"
  const parsedTimestamp = Date.parse(raw);
  if (!isNaN(parsedTimestamp)) {
    const d = new Date(parsedTimestamp);
    return d.toISOString().slice(0, 10);
  }

  return fallback;
}

/**
 * Normalizes weight in grams from strings like "200g", "250 g", "0.5 lb", "1/2 lb", "100".
 */
export function normalizeWeight(input?: string | number): number {
  if (typeof input === 'number') return input > 0 ? input : 200;
  if (!input) return 200;

  const text = input.toString().toLowerCase().trim();

  if (text.includes('lb') || text.includes('磅')) {
    if (text.includes('1/2') || text.includes('半磅') || text.includes('0.5')) return 227;
    if (text.includes('1/4') || text.includes('0.25')) return 114;
    if (text.includes('1')) return 454;
  }

  const numMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (val >= 10 && val <= 5000) return val;
  }

  return 200;
}

/**
 * Fuzzy matches and normalizes free-text flavor notes to standard SCA category chips.
 */
export function normalizeFlavorNotes(rawNotes: string[] = []): string[] {
  const allKnownTags: string[] = [];
  FLAVOR_CATEGORIES.forEach((cat) => {
    cat.tags.forEach((tag) => allKnownTags.push(tag));
  });

  const resultSet = new Set<string>();

  rawNotes.forEach((rawNote) => {
    const cleanNote = rawNote.trim();
    if (!cleanNote) return;

    // Check direct match or substring in predefined tags
    const matchedPreset = allKnownTags.find((preset) => {
      const lowerPreset = preset.toLowerCase();
      const lowerClean = cleanNote.toLowerCase();
      return (
        lowerPreset === lowerClean ||
        lowerPreset.includes(lowerClean) ||
        lowerClean.includes(lowerPreset.split(' ')[0])
      );
    });

    if (matchedPreset) {
      resultSet.add(matchedPreset);
    } else {
      resultSet.add(cleanNote);
    }
  });

  return Array.from(resultSet);
}
