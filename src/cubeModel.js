/**
 * 3D Rubik's Cube Model & Color Definitions
 */

export const COLOR_CONFIG = {
  U: { id: 'U', name: 'Beyaz', faceName: 'Üst (Up)', hex: '#FFFFFF', textDark: true, order: 0 },
  D: { id: 'D', name: 'Sarı', faceName: 'Alt (Down)', hex: '#FFD500', textDark: true, order: 1 },
  F: { id: 'F', name: 'Yeşil', faceName: 'Ön (Front)', hex: '#009B48', textDark: false, order: 2 },
  B: { id: 'B', name: 'Mavi', faceName: 'Arka (Back)', hex: '#0046AD', textDark: false, order: 3 },
  R: { id: 'R', name: 'Kırmızı', faceName: 'Sağ (Right)', hex: '#B71234', textDark: false, order: 4 },
  L: { id: 'L', name: 'Turuncu', faceName: 'Sol (Left)', hex: '#FF5800', textDark: false, order: 5 },
  EMPTY: { id: '?', name: 'Boş', faceName: 'Belirtilmedi', hex: '#2A2C38', textDark: false, order: 6 }
};

export const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];

export const CENTER_INDICES = {
  U: 4,
  R: 13,
  F: 22,
  D: 31,
  L: 40,
  B: 49
};

export const SOLVED_STRING = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

// Facelet offsets
export const FACE_OFFSET = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45
};

/**
 * Returns an array of 54 facelets initialized to solved or empty
 */
export function createCubeState(initialType = 'solved') {
  if (initialType === 'solved') {
    return SOLVED_STRING.split('');
  }
  if (initialType === 'empty') {
    const state = new Array(54).fill('?');
    // Keep centers fixed to avoid impossible center parity
    state[CENTER_INDICES.U] = 'U';
    state[CENTER_INDICES.R] = 'R';
    state[CENTER_INDICES.F] = 'F';
    state[CENTER_INDICES.D] = 'D';
    state[CENTER_INDICES.L] = 'L';
    state[CENTER_INDICES.B] = 'B';
    return state;
  }
  return SOLVED_STRING.split('');
}

/**
 * Map coordinate on outer surface to facelet index (0..53)
 */
export function getFaceletIndex(cx, cy, cz, normal) {
  if (normal.y === 1) { // U
    return 0 + (cz + 1) * 3 + (cx + 1);
  }
  if (normal.x === 1) { // R
    return 9 + (1 - cy) * 3 + (1 - cz);
  }
  if (normal.z === 1) { // F
    return 18 + (1 - cy) * 3 + (cx + 1);
  }
  if (normal.y === -1) { // D
    return 27 + (1 - cz) * 3 + (cx + 1);
  }
  if (normal.x === -1) { // L
    return 36 + (1 - cy) * 3 + (cz + 1);
  }
  if (normal.z === -1) { // B
    return 45 + (1 - cy) * 3 + (1 - cx);
  }
  return -1;
}

/**
 * Given facelet index (0..53), return { face, row, col, isCenter }
 */
export function getFaceletInfo(index) {
  let face = 'U';
  let offset = 0;
  if (index >= 45) { face = 'B'; offset = 45; }
  else if (index >= 36) { face = 'L'; offset = 36; }
  else if (index >= 27) { face = 'D'; offset = 27; }
  else if (index >= 18) { face = 'F'; offset = 18; }
  else if (index >= 9) { face = 'R'; offset = 9; }
  else { face = 'U'; offset = 0; }

  const localIndex = index - offset;
  const row = Math.floor(localIndex / 3);
  const col = localIndex % 3;
  const isCenter = localIndex === 4;

  return { face, localIndex, row, col, isCenter };
}

/**
 * Common Cube Presets
 */
export const PRESETS = [
  {
    id: 'solved',
    name: 'Tamamen Çözülmüş (Varsayılan)',
    description: 'Tüm yüzeyler tek renk ve düzenli',
    algorithm: ''
  },
  {
    id: 'easy',
    name: 'Kolay Karışım (8 Hamle)',
    description: 'Hızlıca çözümü test etmek için basit bir karışım',
    algorithm: "R U R' U' F' U F R"
  },
  {
    id: 'checkerboard',
    name: 'Satranç Deseni (Checkerboard)',
    description: 'Karşılıklı yüzeylerin satranç tahtası gibi yer değiştirdiği klasik desen',
    algorithm: 'U2 D2 F2 B2 L2 R2'
  },
  {
    id: 'superflip',
    name: 'Süper Dönüş (Superflip)',
    description: 'Tüm köşeler yerinde, 12 kenarın tamamı ters dönmüş (En zor desen)',
    algorithm: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2"
  },
  {
    id: 'six_spots',
    name: '6 Nokta Deseni (Six Spots)',
    description: 'Merkezlerin zıt yüzeylerle yer değiştirdiği zarif desen',
    algorithm: "U D' R L' F B' U D'"
  }
];
