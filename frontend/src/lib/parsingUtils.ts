import { type Category } from '@/types';

export interface ParsedProduct {
  name: string;
  model_code: string | null;
  identifier_hash: string;
  price: number | null;
  currency: string;
  category_id: number | null;
  raw_text: string;
  specs: Record<string, string>;
}

// Simple hash function for identifier
const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

export const parseSupplierData = (rawText: string, categories: Category[]): ParsedProduct[] => {
  const lines = rawText.split('\n').filter(line => line.trim() !== '');
  
  return lines.map(line => {
    // 1. Sanitization
    let cleanLine = line.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Remove emojis
    cleanLine = cleanLine.replace(/▪️|⚡|✅|⭐|🔹|🔸/g, '').trim();

    // 2. Price Detection
    let price: number | null = null;
    let currency = 'AED';
    let contentPart = cleanLine;

    // Split by = or : or last space before a number
    const priceMatch = cleanLine.match(/([=:]?)\s*(\d+['\d]*\.?\d*)\s*(aed|usd|eur)?\s*$/i);
    if (priceMatch) {
      price = parseFloat(priceMatch[2].replace(/'/g, ''));
      currency = priceMatch[3]?.toUpperCase() || 'AED';
      contentPart = cleanLine.substring(0, priceMatch.index).trim();
      // Remove trailing = or :
      contentPart = contentPart.replace(/[=:]\s*$/, '').trim();
    }

    // 3. Category Detection (Basic keyword search)
    let categoryId: number | null = null;
    const lowerLine = cleanLine.toLowerCase();
    
    if (lowerLine.includes('synology') || lowerLine.includes('qnap') || lowerLine.includes('nas')) {
      categoryId = categories.find(c => c.name.toLowerCase().includes('storage'))?.id || null;
    } else if (lowerLine.includes('monitor') || lowerLine.includes('display')) {
      categoryId = categories.find(c => c.name.toLowerCase().includes('monitor'))?.id || null;
    } else if (lowerLine.includes('camera') || lowerLine.includes('dvr') || lowerLine.includes('nvr')) {
      categoryId = categories.find(c => c.name.toLowerCase().includes('surveillance'))?.id || null;
    } else if (lowerLine.includes('core') || lowerLine.includes('ryzen') || lowerLine.includes('ultra')) {
      categoryId = categories.find(c => c.name.toLowerCase().includes('laptop'))?.id || null;
    }

    // 4. Model Code Extraction
    // Look for patterns like G815JPR-IS96, 83EM003RPS, G615JMR, etc.
    const blacklist = ['LAPTOP', 'GAMING', 'SILVER', 'ARCTIC', 'DISPLAY', 'MEMORY', 'WINDOWS', 'KEYBOARD', 'WQXGA', 'WUXGA', 'BT', 'PRO', 'HOME', 'UK'];
    const modelMatches = contentPart.match(/[A-Z0-9]{5,}-[A-Z0-9]{3,}|[A-Z0-9]{6,}/g) || [];
    const modelCode = modelMatches.find(m => !blacklist.includes(m.toUpperCase())) || null;

    // 5. Specs Extraction (Basic)
    const specs: Record<string, string> = {};
    const cpuMatch = contentPart.match(/(Core i[3579]|Cori[3579]|Ultra [579]|Ryzen [579])/i);
    if (cpuMatch) {
      let cpu = cpuMatch[0];
      if (cpu.toLowerCase().startsWith('cori')) cpu = cpu.replace(/cori/i, 'Core i');
      specs['cpu'] = cpu;
    }

    const ramMatch = contentPart.match(/(\d+)\s*(GB|G)\s*RAM/i) || contentPart.match(/(\d+)\s*GB\s*(DDR\d)?/i);
    if (ramMatch) specs['ram'] = ramMatch[1] + 'GB';

    const ssdMatch = contentPart.match(/(\d+)\s*(GB|TB)\s*SSD/i);
    if (ssdMatch) specs['ssd'] = ssdMatch[1] + ssdMatch[2];

    const gpuMatch = contentPart.match(/(RTX\s?\d{4})/i);
    if (gpuMatch) specs['gpu'] = gpuMatch[0];

    // 6. Name
    const name = contentPart;

    // 7. Hash
    const identifierHash = generateHash(cleanLine.toLowerCase());

    return {
      name,
      model_code: modelCode,
      identifier_hash: identifierHash,
      price,
      currency,
      category_id: categoryId,
      raw_text: line,
      specs
    };
  });
};
