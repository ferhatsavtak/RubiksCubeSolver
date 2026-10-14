/**
 * Rubik's Cube Validator
 * Thoroughly validates color counts, pieces, and center integrity.
 */

import { COLOR_CONFIG, CENTER_INDICES } from './cubeModel.js';

// Opposite face pairs in standard Western Rubik scheme
const OPPOSITE_PAIRS = new Set([
  'UD', 'DU',
  'FB', 'BF',
  'RL', 'LR'
]);

// 12 valid edge color combinations (sorted alphabetically)
const VALID_EDGE_KEYS = new Set([
  'RU', 'FU', 'LU', 'BU',
  'DR', 'DF', 'DL', 'BD',
  'FR', 'FL', 'BL', 'BR'
].map(s => s.split('').sort().join('')));

// 8 valid corner color triplets (sorted alphabetically)
const VALID_CORNER_KEYS = new Set([
  'FRU', 'FLU', 'BLU', 'BRU',
  'DFR', 'DFL', 'BDL', 'BDR'
].map(s => s.split('').sort().join('')));

// Facelet indices for the 12 edges
export const EDGE_FACELETS = [
  { name: 'UR', indices: [5, 10] },
  { name: 'UF', indices: [7, 19] },
  { name: 'UL', indices: [3, 37] },
  { name: 'UB', indices: [1, 46] },
  { name: 'DR', indices: [32, 16] },
  { name: 'DF', indices: [28, 25] },
  { name: 'DL', indices: [30, 43] },
  { name: 'DB', indices: [34, 52] },
  { name: 'FR', indices: [23, 12] },
  { name: 'FL', indices: [21, 41] },
  { name: 'BL', indices: [50, 39] },
  { name: 'BR', indices: [48, 14] }
];

// Facelet indices for the 8 corners
export const CORNER_FACELETS = [
  { name: 'URF', indices: [8, 9, 20] },
  { name: 'UFL', indices: [6, 18, 38] },
  { name: 'ULB', indices: [0, 36, 47] },
  { name: 'UBR', indices: [2, 45, 11] },
  { name: 'DFR', indices: [29, 26, 15] },
  { name: 'DLF', indices: [27, 44, 24] },
  { name: 'DBL', indices: [33, 53, 42] },
  { name: 'DRB', indices: [35, 17, 51] }
];

export function validateCube(facelets) {
  // 1. Check for empty stickers
  const emptyCount = facelets.filter(c => !c || c === '?').length;
  if (emptyCount > 0) {
    return {
      isValid: false,
      title: 'Eksik Renkler',
      message: `Küpün ${emptyCount} adet karesi henüz boyanmamış. Lütfen tüm kareleri renklendirin.`
    };
  }

  // 2. Check counts for each color
  const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
  for (const c of facelets) {
    if (counts[c] !== undefined) {
      counts[c]++;
    } else {
      return {
        isValid: false,
        title: 'Geçersiz Renk',
        message: `Bilinmeyen bir renk kodu bulundu: ${c}`
      };
    }
  }

  const badCounts = [];
  for (const face of ['U', 'D', 'F', 'B', 'R', 'L']) {
    const count = counts[face];
    if (count !== 9) {
      badCounts.push(`${COLOR_CONFIG[face].name}: ${count}/9`);
    }
  }

  if (badCounts.length > 0) {
    return {
      isValid: false,
      title: 'Renk Sayısı Uyuşmuyor',
      message: `Her renkten tam 9 adet olmalıdır (${badCounts.join(', ')}).`
    };
  }

  // 3. Fixed center integrity check
  for (const [face, idx] of Object.entries(CENTER_INDICES)) {
    if (facelets[idx] !== face) {
      return {
        isValid: false,
        title: 'Sabit Merkez Hatası',
        message: `${COLOR_CONFIG[face].name} merkez karesi sabit referanstır ve değiştirilemez.`
      };
    }
  }

  // 4. Edges validation
  const seenEdges = new Map();
  for (let i = 0; i < EDGE_FACELETS.length; i++) {
    const edge = EDGE_FACELETS[i];
    const c1 = facelets[edge.indices[0]];
    const c2 = facelets[edge.indices[1]];

    if (c1 === c2) {
      return {
        isValid: false,
        title: 'Hatalı Kenar',
        message: `Bir kenar parçasının iki yüzü de aynı renk (${COLOR_CONFIG[c1].name}) olamaz.`
      };
    }

    if (OPPOSITE_PAIRS.has(c1 + c2)) {
      return {
        isValid: false,
        title: 'İmkansız Kenar',
        message: `${COLOR_CONFIG[c1].name} ve ${COLOR_CONFIG[c2].name} karşılıklı yüzeylerdir, aynı parçada bulunamazlar.`
      };
    }

    const key = [c1, c2].sort().join('');
    if (!VALID_EDGE_KEYS.has(key)) {
      return {
        isValid: false,
        title: 'Geçersiz Kenar Parçası',
        message: `${COLOR_CONFIG[c1].name}-${COLOR_CONFIG[c2].name} kenar parçası küpte fiziksel olarak var olamaz.`
      };
    }

    if (seenEdges.has(key)) {
      return {
        isValid: false,
        title: 'Tekrarlanan Kenar',
        message: `Küp üzerinde birden fazla ${COLOR_CONFIG[c1].name}-${COLOR_CONFIG[c2].name} kenar parçası bulunuyor.`
      };
    }
    seenEdges.set(key, i);
  }

  // 5. Corners validation
  const seenCorners = new Map();
  for (let i = 0; i < CORNER_FACELETS.length; i++) {
    const corner = CORNER_FACELETS[i];
    const c1 = facelets[corner.indices[0]];
    const c2 = facelets[corner.indices[1]];
    const c3 = facelets[corner.indices[2]];

    if (c1 === c2 || c1 === c3 || c2 === c3) {
      return {
        isValid: false,
        title: 'Hatalı Köşe',
        message: 'Bir köşe parçasında aynı renkten birden fazla bulunamaz.'
      };
    }

    if (OPPOSITE_PAIRS.has(c1 + c2) || OPPOSITE_PAIRS.has(c1 + c3) || OPPOSITE_PAIRS.has(c2 + c3)) {
      return {
        isValid: false,
        title: 'İmkansız Köşe',
        message: 'Karşılıklı iki renk (örn. Sarı ve Beyaz) aynı köşe parçasında yer alamaz.'
      };
    }

    const key = [c1, c2, c3].sort().join('');
    if (!VALID_CORNER_KEYS.has(key)) {
      return {
        isValid: false,
        title: 'Geçersiz Köşe Parçası',
        message: `${COLOR_CONFIG[c1].name}-${COLOR_CONFIG[c2].name}-${COLOR_CONFIG[c3].name} köşe parçası küpte bulunamaz.`
      };
    }

    if (seenCorners.has(key)) {
      return {
        isValid: false,
        title: 'Tekrarlanan Köşe',
        message: `Küp üzerinde birden fazla ${COLOR_CONFIG[c1].name}-${COLOR_CONFIG[c2].name}-${COLOR_CONFIG[c3].name} köşe parçası var.`
      };
    }
    seenCorners.set(key, i);
  }

  return { isValid: true };
}
