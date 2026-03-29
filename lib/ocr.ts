export type ParsedReceipt = {
  merchantName?: string;
  amount?: number;
  currency?: string;
  date?: Date;
  description?: string;
  category?: string;
  lineItems: string[];
  confidence: number;
};

const CURRENCY_CODES = [
  "USD",
  "EUR",
  "INR",
  "GBP",
  "AUD",
  "CAD",
  "JPY",
  "SGD",
  "AED",
] as const;

const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  { category: "Travel", keywords: ["uber", "lyft", "flight", "taxi", "train", "bus", "hotel"] },
  { category: "Food", keywords: ["restaurant", "cafe", "coffee", "diner", "bar", "pizza"] },
  { category: "Supplies", keywords: ["stationery", "office", "supplies", "paper", "ink"] },
  { category: "Meals", keywords: ["lunch", "dinner", "breakfast", "meal"] },
  { category: "Utilities", keywords: ["internet", "electricity", "water", "phone"] },
];

function parseAmount(raw: string) {
  const cleaned = raw.replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return Number(parsed.toFixed(2));
}

function detectAmount(text: string) {
  const totalRegex =
    /(?:grand\s*total|total\s*amount|amount\s*due|total)\D{0,15}(\d{1,8}(?:[.,]\d{1,2})?)/i;

  const totalMatch = text.match(totalRegex);
  if (totalMatch?.[1]) {
    return parseAmount(totalMatch[1]);
  }

  const numericCandidates = Array.from(text.matchAll(/\b\d{1,8}(?:[.,]\d{1,2})\b/g))
    .map((match) => parseAmount(match[0]))
    .filter((candidate): candidate is number => typeof candidate === "number")
    .sort((a, b) => b - a);

  return numericCandidates[0];
}

function detectDate(text: string) {
  const datePatterns = [
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(\d{2}\/\d{2}\/\d{4})\b/,
    /\b(\d{2}-\d{2}-\d{4})\b/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const parsed = new Date(match[1]);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    // Handle dd-mm-yyyy or dd/mm/yyyy manually when native parser fails.
    const parts = match[1].split(/[\/-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const converted = new Date(`${year}-${month}-${day}`);
      if (!Number.isNaN(converted.getTime())) {
        return converted;
      }
    }
  }

  return undefined;
}

function detectCurrency(text: string) {
  const upper = text.toUpperCase();
  const found = CURRENCY_CODES.find((code) => upper.includes(code));
  return found;
}

function detectMerchant(lines: string[]) {
  return lines.find((line) => /^[A-Za-z]/.test(line) && line.length >= 3 && line.length <= 80);
}

function guessCategory(text: string) {
  const normalized = text.toLowerCase();

  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.category;
    }
  }

  return "General";
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const sanitized = rawText.replace(/\r/g, "").trim();
  const lines = sanitized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const amount = detectAmount(sanitized);
  const date = detectDate(sanitized);
  const currency = detectCurrency(sanitized);
  const merchantName = detectMerchant(lines);
  const category = guessCategory(sanitized);

  const confidenceSignals = [
    amount ? 0.35 : 0,
    date ? 0.2 : 0,
    currency ? 0.15 : 0,
    merchantName ? 0.15 : 0,
    lines.length > 2 ? 0.15 : 0,
  ];

  const confidence = Number(confidenceSignals.reduce((sum, signal) => sum + signal, 0).toFixed(2));

  return {
    merchantName,
    amount,
    currency,
    date,
    description: merchantName ? `Receipt from ${merchantName}` : lines[0],
    category,
    lineItems: lines.slice(0, 8),
    confidence,
  };
}
