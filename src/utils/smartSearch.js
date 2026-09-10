/**
 * smartSearch.js
 * Advanced Phonetic, Typo-Tolerant & Multilingual-Friendly Search Engine
 * Handles:
 * - Phonetic Sound-alikes (e.g. 'kokonat' -> 'coconut', 'biskit' -> 'biscuit', 'magi' -> 'maggi')
 * - Missing Vowels / Squished words (e.g. 'cocnat' -> 'coconut', 'ashirvad' -> 'aashirvaad')
 * - Typo tolerance & character transposition (Levenshtein distance)
 * - Multi-word out-of-order matching (e.g. 'oil fortune' -> 'Fortune Sunlite Sunflower Oil')
 * - Vernacular / Hinglish grocery aliases (e.g. 'tel' -> 'oil', 'namak' -> 'salt', 'chawal' -> 'rice')
 */

// Common grocery transliteration & alias mappings
const GROCERY_SYNONYMS = {
  'kokonat': 'coconut',
  'cocnat': 'coconut',
  'nariyal': 'coconut',
  'biskit': 'biscuit',
  'biskut': 'biscuit',
  'biscut': 'biscuit',
  'magi': 'maggi',
  'meggi': 'maggi',
  'megi': 'maggi',
  'nodle': 'noodles',
  'nodles': 'noodles',
  'nudles': 'noodles',
  'ata': 'atta',
  'aata': 'atta',
  'flour': 'atta',
  'wheat': 'atta',
  'tel': 'oil',
  'tail': 'oil',
  'sunflower': 'sunlite oil',
  'sunlite': 'sunflower oil',
  'chini': 'sugar',
  'shugar': 'sugar',
  'suger': 'sugar',
  'namak': 'salt',
  'solt': 'salt',
  'chawal': 'rice',
  'dall': 'dal',
  'daal': 'dal',
  'toor': 'dal',
  'ghi': 'ghee',
  'gee': 'ghee',
  'makhan': 'butter',
  'sabun': 'soap',
  'chay': 'tea',
  'chai': 'tea',
  'kofi': 'coffee',
  'koffee': 'coffee',
  'detergant': 'detergent',
  'surf': 'detergent wash',
  'detol': 'dettol',
  'haldi': 'turmeric masala',
  'mirch': 'chilli masala',
  'masala': 'spices masala'
};

/**
 * Phonetically normalizes a string by converting sound-equivalent letter groups
 */
export function phoneticNormalize(str) {
  if (!str) return '';
  let s = str.toLowerCase().trim();

  // Replace common punctuation
  s = s.replace(/[^a-z0-9\s]/g, ' ');

  // Phonetic sound substitutions
  s = s
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/c(?=[eiy])/g, 's') // soft c (e.g. rice)
    .replace(/c/g, 'k')          // hard c (e.g. coconut -> kokonat)
    .replace(/q/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/sh/g, 's')
    .replace(/zh/g, 'j')
    .replace(/z/g, 'j')
    .replace(/jh/g, 'j')
    .replace(/ee/g, 'i')
    .replace(/ea/g, 'i')
    .replace(/y(?=\b|\s|[b-df-hj-np-tv-z])/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/ou/g, 'u')
    .replace(/w/g, 'v')
    .replace(/bh/g, 'b')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/gh/g, 'g')
    .replace(/kh/g, 'k');

  // Compress duplicate characters (e.g., 'kkk' -> 'k', 'aa' -> 'a')
  s = s.replace(/(.)\1+/g, '$1');

  return s;
}

/**
 * Generates a consonant skeleton by stripping non-leading vowels
 * (e.g. 'coconut' -> 'kknt', 'kokonat' -> 'kknt', 'cocnat' -> 'kknt')
 */
export function consonantSkeleton(str) {
  const norm = phoneticNormalize(str);
  if (!norm) return '';
  const firstChar = norm.charAt(0);
  const rest = norm.slice(1).replace(/[aeiou\s]/g, '');
  return firstChar + rest;
}

/**
 * Calculates Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a, b) {
  if (!a || !b) return (a || '').length + (b || '').length;
  if (a === b) return 0;

  const m = a.length;
  const n = b.length;
  const matrix = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) matrix[i][0] = i;
  for (let j = 0; j <= n; j++) matrix[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Damerau transposition check
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[m][n];
}

/**
 * Checks if a search word matches a target word with fuzzy / phonetic tolerance
 */
function isWordMatch(queryWord, targetWord) {
  if (!queryWord || !targetWord) return false;
  const q = queryWord.toLowerCase();
  const t = targetWord.toLowerCase();

  // 1. Exact or prefix match
  if (t.includes(q) || q.includes(t)) return true;

  // 2. Grocery Synonym expansion match
  if (GROCERY_SYNONYMS[q] && t.includes(GROCERY_SYNONYMS[q])) return true;

  // 3. Phonetic match (e.g. 'kokonat' vs 'coconut')
  const qPhonetic = phoneticNormalize(q);
  const tPhonetic = phoneticNormalize(t);
  if (tPhonetic.includes(qPhonetic) || qPhonetic.includes(tPhonetic)) return true;

  // 4. Consonant skeleton match (e.g. 'cocnat' vs 'coconut' -> 'kknt' vs 'kknt')
  const qSkel = consonantSkeleton(q);
  const tSkel = consonantSkeleton(t);
  if (qSkel.length >= 3 && tSkel.length >= 3) {
    if (tSkel.includes(qSkel) || qSkel.includes(tSkel)) return true;
  }

  // 5. Levenshtein edit distance check
  const maxDistance = q.length <= 4 ? 1 : q.length <= 8 ? 2 : 3;
  const dist = levenshteinDistance(q, t);
  if (dist <= maxDistance) return true;

  // 6. Phonetic Levenshtein distance check
  const phoneticDist = levenshteinDistance(qPhonetic, tPhonetic);
  if (phoneticDist <= maxDistance) return true;

  return false;
}

/**
 * Computes relevance score for a single product given a search query
 */
export function scoreProductMatch(product, query) {
  if (!query || !query.trim()) return 100;
  const cleanQuery = query.toLowerCase().trim();
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

  const title = (product.title || product.name || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const unit = (product.unit || '').toLowerCase();

  const searchableText = `${title} ${brand} ${category} ${unit} ${description}`;
  const productWords = searchableText.split(/[\s,.\-_/]+/).filter(w => w.length > 1);

  // 1. Direct full phrase match -> Highest Priority
  if (title.includes(cleanQuery)) return 150;
  if (searchableText.includes(cleanQuery)) return 120;

  // Check synonym full phrase
  for (const [key, val] of Object.entries(GROCERY_SYNONYMS)) {
    if (cleanQuery.includes(key) && searchableText.includes(val)) {
      return 110;
    }
  }

  // 2. Token by Token matching (All query tokens must match something in the product)
  let matchedTokens = 0;
  let totalTokenScore = 0;

  for (const qToken of queryTokens) {
    let tokenMatched = false;
    let bestWordScore = 0;

    for (const pWord of productWords) {
      if (pWord === qToken) {
        bestWordScore = Math.max(bestWordScore, 100);
        tokenMatched = true;
        break;
      } else if (pWord.startsWith(qToken)) {
        bestWordScore = Math.max(bestWordScore, 85);
        tokenMatched = true;
      } else if (isWordMatch(qToken, pWord)) {
        bestWordScore = Math.max(bestWordScore, 70);
        tokenMatched = true;
      }
    }

    if (tokenMatched) {
      matchedTokens++;
      totalTokenScore += bestWordScore;
    }
  }

  // If all search words found a match in the product
  if (matchedTokens === queryTokens.length) {
    return totalTokenScore / queryTokens.length;
  }

  // If at least 70% of words match on longer multi-word queries
  if (queryTokens.length >= 2 && matchedTokens / queryTokens.length >= 0.7) {
    return (totalTokenScore / queryTokens.length) * 0.75;
  }

  return 0; // No match
}

/**
 * Main Smart Search Function
 * Filters and ranks any product catalog by fuzzy phonetic query
 * 
 * @param {Array} products - List of products to search
 * @param {string} query - The search text (can contain typos, phonetic spellings, etc.)
 * @returns {Array} - Filtered & relevance-sorted list of products
 */
export function smartSearchProducts(products = [], query = '') {
  if (!Array.isArray(products)) return [];
  if (!query || !query.trim()) return products;

  const scored = [];

  for (const prod of products) {
    const score = scoreProductMatch(prod, query);
    if (score > 0) {
      scored.push({ product: prod, score });
    }
  }

  // Sort descending by match score
  scored.sort((a, b) => b.score - a.score);

  return scored.map(item => item.product);
}
