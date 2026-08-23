import {
  normalizeFlavorNotes,
  normalizeProcessMethod,
  normalizeRoastDate,
  normalizeRoastLevel,
  normalizeWeight,
} from '../utils/coffeeOntology';
import { ProcessMethod, RoastLevel } from '../types/coffee';

export interface ExtractedBeanMetadata {
  name: string;
  roaster: string;
  origin: string;
  region: string;
  farmOrStation?: string;
  varietal?: string;
  process: ProcessMethod;
  roastLevel: RoastLevel;
  roastDate: string;
  elevationMeters?: string;
  tastingNotes: string[];
  totalWeightGrams: number;
  remainingWeightGrams: number;
  notes?: string;
  rawDetectedText?: string;
  photoCount?: number;
  isMockDemo?: boolean;
  confidenceScore?: number;
}

const STORAGE_KEYS = {
  GEMINI_API_KEY: 'brewlog_gemini_api_key',
};

export function getGeminiApiKey(): string {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  let localKey = '';
  if (typeof window !== 'undefined') {
    localKey = localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY) || '';
  }
  return localKey || envKey;
}

export function saveGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
    }
  }
}

/**
 * Scans and extracts structured specialty coffee metadata from one or multiple packaging images.
 */
export async function scanBeanBagWithAI(
  images: string | string[]
): Promise<ExtractedBeanMetadata> {
  const imageList = Array.isArray(images) ? images : [images];
  if (imageList.length === 0) {
    throw new Error('請至少提供一張咖啡包裝照片');
  }

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    // If no API key is provided, return mock demo and clearly mark isMockDemo: true
    const demo = await mockHeuristicScan();
    return {
      ...demo,
      photoCount: imageList.length,
      isMockDemo: true,
    };
  }

  // Call Gemini Vision API directly with multi-image support
  return await callGeminiVision(imageList, apiKey);
}

/**
 * Calls Google Gemini Flash Multimodal Vision API directly with multi-image support.
 * Prioritizes gemini-3.6-flash, with automatic fallback if model name varies.
 */
async function callGeminiVision(
  images: string[],
  apiKey: string
): Promise<ExtractedBeanMetadata> {
  // List of models to try in priority order
  const candidateModels = [
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-flash',
  ];

  const prompt = `
You are an expert World Barista Championship sensory judge, Q-Grader, and OCR specialist for specialty coffee packaging.
You are given ${images.length} photo(s) of different sides/angles of the same specialty coffee packaging (e.g. front title label, back detail card, side notes, roast date stamp/sticker, bottom weight).

Carefully inspect ALL provided photos, cross-reference and synthesize all text across all sides into a single consolidated, highly accurate JSON record.

Follow these strict extraction guidelines:
1. "name": The primary title / single-origin coffee name (e.g. "衣索比亞 耶加雪菲 歌姬 沃卡 日曬 G1", "Panama Geisha Washed", "Colombia El Paraiso"). Combine origin + processing + grade if on separate lines.
2. "roaster": The roastery, brand, or cafe name printed (e.g. "Simple Kaffa 興波咖啡", "The Barn", "Coffee Collective", "Oasis Coffee", "Blue Bottle", "自烘焙").
3. "origin": Country of origin (e.g. "Ethiopia", "Panama", "Colombia", "Kenya", "Guatemala", "Costa Rica", "Taiwan", "Indonesia", "Brazil").
4. "region": Sub-region, county, or growing area (e.g. "Yirgacheffe", "Boquete", "Huila", "Nyeri", "Alishan", "Tarrazu", "Antigua").
5. "farmOrStation": Farm name, estate, washing station, or producer (e.g. "Finca Deborah", "Hacienda La Esmeralda", "Worka Sakaro", "El Paraiso").
6. "varietal": Botanical cultivar (e.g. "Geisha", "Pink Bourbon", "SL28 / SL34", "Heirloom 原生種", "Typica", "Caturra", "Bourbon", "Castillo", "Sidra", "Pacamara").
7. "process": Processing method (e.g. "Washed 水洗", "Natural 日曬", "Honey 蜜處理", "Anaerobic 厭氧", "Thermal Shock 熱衝擊", "Carbonic Maceration 二氧化碳浸漬").
8. "roastLevel": Roast degree (e.g. "Light 淺焙", "Light-Medium 淺中", "Medium 中焙", "Medium-Dark 中深", "Dark 深焙"). If not explicitly printed, infer from specialty origin or leave "Light".
9. "roastDate": Look carefully across all photos (especially stickers and back labels) for stamped dates, printed dates, best-before dates, or handwritten dates. Convert to YYYY-MM-DD format. If only month/day or relative days are visible, compute best estimate.
10. "elevation": Elevation / Altitude (e.g. "1900-2100m", "1650m", "2000 MASL").
11. "tastingNotes": Array of all flavor descriptors printed across the package (e.g. ["Jasmine", "Bergamot", "Peach", "Earl Grey", "Blueberry", "Honey", "Cacao"]).
12. "totalWeightGrams": Package weight in grams (e.g. 200, 227, 250, 100, 454).
13. "rawDetectedText": A brief transcription of key text detected across all photos.

Return ONLY a single valid JSON object matching this schema (NO markdown formatting, NO backticks):
{
  "name": string,
  "roaster": string,
  "origin": string,
  "region": string,
  "farmOrStation": string,
  "varietal": string,
  "process": string,
  "roastLevel": string,
  "roastDate": string,
  "elevation": string,
  "tastingNotes": string[],
  "totalWeightGrams": number,
  "notes": string,
  "rawDetectedText": string
}
`;

  // Build image parts for all supplied photos
  const imageParts = images.map((imgStr) => {
    const parts = imgStr.split(',');
    const mimeType = parts[0]?.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const base64Data = parts[1] || imgStr;
    return {
      inline_data: {
        mime_type: mimeType,
        data: base64Data,
      },
    };
  });

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          ...imageParts,
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json',
    },
  };

  let lastError: Error | null = null;

  for (const modelName of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedMsg = errorText;
        try {
          const errJson = JSON.parse(errorText);
          if (errJson.error?.message) {
            parsedMsg = errJson.error.message;
          }
        } catch {}

        if (response.status === 404) {
          lastError = new Error(`Model ${modelName} not found: ${parsedMsg}`);
          continue;
        }

        throw new Error(`Google Gemini API 錯誤 (${response.status}): ${parsedMsg}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Gemini Vision 模型未返回辨識文字，請確認照片是否清晰');
      }

      const cleanedJson = rawText.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      const weight = normalizeWeight(parsed.totalWeightGrams);
      const rawTasting = Array.isArray(parsed.tastingNotes) ? parsed.tastingNotes : [];

      return {
        name: parsed.name || '精品手沖咖啡 (Specialty Coffee)',
        roaster: parsed.roaster || '精品烘豆坊 (Specialty Roaster)',
        origin: parsed.origin || 'Ethiopia (衣索比亞)',
        region: parsed.region || '',
        farmOrStation: parsed.farmOrStation || undefined,
        varietal: parsed.varietal || '',
        process: normalizeProcessMethod(parsed.process),
        roastLevel: normalizeRoastLevel(parsed.roastLevel),
        roastDate: normalizeRoastDate(parsed.roastDate),
        elevationMeters: parsed.elevation || undefined,
        tastingNotes: normalizeFlavorNotes(rawTasting),
        totalWeightGrams: weight,
        remainingWeightGrams: weight,
        notes: parsed.notes || undefined,
        rawDetectedText: parsed.rawDetectedText || undefined,
        photoCount: images.length,
        isMockDemo: false,
        confidenceScore: 0.98,
      };
    } catch (err: any) {
      lastError = err;
      if (err.message && !err.message.includes('404')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('所有 Gemini 模型連線嘗試皆失敗，請確認 API Key 與網路連線');
}

/**
 * Intelligent simulation parser for testing without an API key.
 */
async function mockHeuristicScan(): Promise<ExtractedBeanMetadata> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const sample = {
    name: '衣索比亞 耶加雪菲 歌姬 沃卡 日曬 G1 (展示範例)',
    roaster: 'The Barn Coffee Roasters',
    origin: 'Ethiopia (衣索比亞)',
    region: 'Gedeb, Yirgacheffe',
    farmOrStation: 'Worka Sakaro Washing Station',
    varietal: 'Heirloom (原生種)',
    process: 'Natural' as ProcessMethod,
    roastLevel: 'Light' as RoastLevel,
    elevationMeters: '2000-2200m',
    tastingNotes: ['藍莓果醬', '草莓 Strawberry', '紫羅蘭 Violet', '蜂蜜 Honey'],
    totalWeightGrams: 250,
    remainingWeightGrams: 250,
    notes: '建議研磨度偏細，水溫 92°C 展現明亮莓果花香與甜感餘韻。',
    rawDetectedText: 'ETHIOPIA WORKA SAKARO / NATURAL / HEIRLOOM / FLAVORS: BLUEBERRY, VIOLET, HONEY',
  };

  const dateObj = new Date();
  dateObj.setDate(dateObj.getDate() - 10);
  const roastDate = dateObj.toISOString().slice(0, 10);

  return {
    ...sample,
    roastDate,
    tastingNotes: normalizeFlavorNotes(sample.tastingNotes),
    confidenceScore: 0.85,
  };
}
