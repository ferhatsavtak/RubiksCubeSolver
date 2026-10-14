/**
 * Kociemba Two-Phase Rubik's Cube Solver powered by min2phase.js
 * All moves are strictly decomposed into single 90-degree steps for maximum clarity.
 */

import min2phase from 'min2phase.js';
import { validateCube } from './cubeValidator.js';
import { COLOR_CONFIG } from './cubeModel.js';

let solverInitialized = false;

// Turkish Move Explanations for all 90-degree moves
export const MOVE_DESCRIPTIONS = {
  U: {
    name: 'Üst (U)',
    actionName: 'Saat Yönünde 90°',
    desc: 'Üst yüzeyi (Beyaz) saat yönünde 90° çeyrek tur çevirin',
    face: 'U',
    faceName: 'Üst Yüzey (Beyaz)',
    direction: 'Saat Yönü',
    degrees: '90°',
    color: COLOR_CONFIG.U.hex
  },
  "U'": {
    name: "Üst Ters (U')",
    actionName: 'Saat Tersine 90°',
    desc: 'Üst yüzeyi (Beyaz) saat yönünün tersine 90° çeyrek tur çevirin',
    face: 'U',
    faceName: 'Üst Yüzey (Beyaz)',
    direction: 'Ters Yön',
    degrees: '90°',
    color: COLOR_CONFIG.U.hex
  },
  D: {
    name: 'Alt (D)',
    actionName: 'Saat Yönünde 90°',
    desc: 'Alt yüzeyi (Sarı) saat yönünde 90° çeyrek tur çevirin',
    face: 'D',
    faceName: 'Alt Yüzey (Sarı)',
    direction: 'Saat Yönü',
    degrees: '90°',
    color: COLOR_CONFIG.D.hex
  },
  "D'": {
    name: "Alt Ters (D')",
    actionName: 'Saat Tersine 90°',
    desc: 'Alt yüzeyi (Sarı) saat yönünün tersine 90° çeyrek tur çevirin',
    face: 'D',
    faceName: 'Alt Yüzey (Sarı)',
    direction: 'Ters Yön',
    degrees: '90°',
    color: COLOR_CONFIG.D.hex
  },
  R: {
    name: 'Sağ (R)',
    actionName: 'Yukarı Doğru 90°',
    desc: 'Sağ yüzeyi (Kırmızı) yukarı doğru 90° çeyrek tur çevirin',
    face: 'R',
    faceName: 'Sağ Yüzey (Kırmızı)',
    direction: 'Yukarı',
    degrees: '90°',
    color: COLOR_CONFIG.R.hex
  },
  "R'": {
    name: "Sağ Ters (R')",
    actionName: 'Aşağı Doğru 90°',
    desc: 'Sağ yüzeyi (Kırmızı) aşağı doğru 90° çeyrek tur çevirin',
    face: 'R',
    faceName: 'Sağ Yüzey (Kırmızı)',
    direction: 'Aşağı',
    degrees: '90°',
    color: COLOR_CONFIG.R.hex
  },
  L: {
    name: 'Sol (L)',
    actionName: 'Aşağı Doğru 90°',
    desc: 'Sol yüzeyi (Turuncu) aşağı doğru 90° çeyrek tur çevirin',
    face: 'L',
    faceName: 'Sol Yüzey (Turuncu)',
    direction: 'Aşağı',
    degrees: '90°',
    color: COLOR_CONFIG.L.hex
  },
  "L'": {
    name: "Sol Ters (L')",
    actionName: 'Yukarı Doğru 90°',
    desc: 'Sol yüzeyi (Turuncu) yukarı doğru 90° çeyrek tur çevirin',
    face: 'L',
    faceName: 'Sol Yüzey (Turuncu)',
    direction: 'Yukarı',
    degrees: '90°',
    color: COLOR_CONFIG.L.hex
  },
  F: {
    name: 'Ön (F)',
    actionName: 'Saat Yönünde 90°',
    desc: 'Ön yüzeyi (Yeşil) saat yönünde 90° çeyrek tur çevirin',
    face: 'F',
    faceName: 'Ön Yüzey (Yeşil)',
    direction: 'Saat Yönü',
    degrees: '90°',
    color: COLOR_CONFIG.F.hex
  },
  "F'": {
    name: "Ön Ters (F')",
    actionName: 'Saat Tersine 90°',
    desc: 'Ön yüzeyi (Yeşil) saat yönünün tersine 90° çeyrek tur çevirin',
    face: 'F',
    faceName: 'Ön Yüzey (Yeşil)',
    direction: 'Ters Yön',
    degrees: '90°',
    color: COLOR_CONFIG.F.hex
  },
  B: {
    name: 'Arka (B)',
    actionName: 'Saat Yönünde 90°',
    desc: 'Arka yüzeyi (Mavi) saat yönünde 90° çeyrek tur çevirin',
    face: 'B',
    faceName: 'Arka Yüzey (Mavi)',
    direction: 'Saat Yönü',
    degrees: '90°',
    color: COLOR_CONFIG.B.hex
  },
  "B'": {
    name: "Arka Ters (B')",
    actionName: 'Saat Tersine 90°',
    desc: 'Arka yüzeyi (Mavi) saat yönünün tersine 90° çeyrek tur çevirin',
    face: 'B',
    faceName: 'Arka Yüzey (Mavi)',
    direction: 'Ters Yön',
    degrees: '90°',
    color: COLOR_CONFIG.B.hex
  }
};

const MIN2PHASE_ERRORS = {
  'Error 1': {
    title: 'Hatalı Renk Dizilimi',
    message: 'Küpün renkleri tam olarak 9 adet U, R, F, D, L, B içermiyor.'
  },
  'Error 2': {
    title: 'Eksik veya Bozuk Kenar',
    message: 'Küp üzerinde geçerli 12 kenar parçası bulunamadı.'
  },
  'Error 3': {
    title: 'Kenar Yönelim Hatası (Edge Flip)',
    message: 'Küpün bir kenar parçası fiziksel olarak ters takılmış. Normal hamlelerle çözülemez.'
  },
  'Error 4': {
    title: 'Eksik veya Bozuk Köşe',
    message: 'Küp üzerinde geçerli 8 köşe parçası bulunamadı.'
  },
  'Error 5': {
    title: 'Köşe Döndürme Hatası (Corner Twist)',
    message: 'Küpün bir köşesi kendi ekseni etrafında fiziksel olarak döndürülmüş. Normal hamlelerle çözülemez.'
  },
  'Error 6': {
    title: 'Parite Uyuşmazlığı',
    message: 'Küpün parçaları sökülüp yer değiştirilmiş (Permütasyon parite hatası).'
  },
  'Error 7': {
    title: 'Çözüm Bulunamadı',
    message: 'Belirtilen derinlik sınırında çözüm üretilemedi.'
  },
  'Error 8': {
    title: 'Zaman Aşımı',
    message: 'Çözüm araması zaman aşımına uğradı.'
  }
};

export async function initSolver() {
  if (solverInitialized) return true;
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        if (typeof min2phase.initFull === 'function') {
          min2phase.initFull();
        }
        solverInitialized = true;
      } catch (err) {
        console.warn('min2phase lazy init:', err);
        solverInitialized = true;
      }
      resolve(true);
    }, 10);
  });
}

export function isSolverReady() {
  return solverInitialized;
}

/**
 * Solves a 54-facelet array or string representation.
 * Every double turn (e.g. U2, R2) is decomposed into two single 90-degree moves
 * so each animation step is unambiguous and completely distinct.
 */
export async function solveCubeState(facelets) {
  if (!solverInitialized) {
    await initSolver();
  }

  // 1. Client-side validation
  const validation = validateCube(facelets);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation
    };
  }

  const cubeStr = Array.isArray(facelets) ? facelets.join('') : facelets;

  // 2. Check if already solved
  const solvedStr = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
  if (cubeStr === solvedStr) {
    return {
      success: true,
      isAlreadySolved: true,
      moves: [],
      rawSolution: '',
      message: 'Küp zaten tamamen çözülmüş durumda!'
    };
  }

  try {
    const rawResult = min2phase.solve(cubeStr);
    const cleanResult = (rawResult || '').trim();

    if (cleanResult.startsWith('Error')) {
      const errDetail = MIN2PHASE_ERRORS[cleanResult] || {
        title: 'Geçersiz Küp Durumu',
        message: `Küp bu haliyle matematiksel olarak çözülemez (${cleanResult}).`
      };
      return {
        success: false,
        error: errDetail
      };
    }

    if (!cleanResult) {
      return {
        success: true,
        isAlreadySolved: true,
        moves: [],
        rawSolution: '',
        message: 'Küp zaten tamamen çözülmüş durumda!'
      };
    }

    // 3. Decompose double moves (e.g. R2 -> R, R) into strictly single 90° moves!
    const rawTokens = cleanResult.split(/\s+/).filter(Boolean);
    const singleMoveTokens = [];

    for (const token of rawTokens) {
      if (token.endsWith('2')) {
        const face = token[0];
        // Two consecutive 90° single turns
        singleMoveTokens.push({ raw: face, isPartOfDouble: true, subStep: 1 });
        singleMoveTokens.push({ raw: face, isPartOfDouble: true, subStep: 2 });
      } else {
        singleMoveTokens.push({ raw: token, isPartOfDouble: false, subStep: 0 });
      }
    }

    // 4. Map into rich move step objects
    const parsedMoves = singleMoveTokens.map((item, index) => {
      const rawMove = item.raw;
      const info = MOVE_DESCRIPTIONS[rawMove] || {
        name: rawMove,
        actionName: '90° Çevirin',
        desc: `${rawMove} hamlesini uygulayın`,
        face: rawMove[0],
        faceName: rawMove[0],
        direction: '90°',
        degrees: '90°',
        color: '#3b82f6'
      };

      let customDesc = info.desc;
      if (item.isPartOfDouble) {
        if (item.subStep === 1) {
          customDesc = `${info.faceName} saat yönünde ilk 90° çeyrek tur çevirin`;
        } else {
          customDesc = `${info.faceName} aynı yönde 90° daha çevirin (2. tur)`;
        }
      }

      return {
        stepIndex: index + 1,
        raw: rawMove,
        face: rawMove[0],
        type: rawMove.endsWith("'") ? 'prime' : 'single',
        name: info.name,
        actionName: info.actionName,
        desc: customDesc,
        faceName: info.faceName,
        direction: info.direction,
        degrees: '90°',
        faceColor: info.color,
        isPartOfDouble: item.isPartOfDouble,
        subStep: item.subStep
      };
    });

    return {
      success: true,
      isAlreadySolved: false,
      moves: parsedMoves,
      rawSolution: cleanResult,
      moveCount: parsedMoves.length
    };
  } catch (err) {
    return {
      success: false,
      error: {
        title: 'Çözüm Hatası',
        message: `Çözüm hesaplanırken beklenmeyen bir hata oluştu: ${err.message}`
      }
    };
  }
}

/**
 * Scramble generator
 */
export function generateRandomScramble(numMoves = 20) {
  const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
  const modifiers = ['', "'", '2'];
  const moves = [];
  let lastFace = '';
  let secondLastFace = '';

  const opposites = {
    U: 'D', D: 'U',
    L: 'R', R: 'L',
    F: 'B', B: 'F'
  };

  while (moves.length < numMoves) {
    const face = faces[Math.floor(Math.random() * faces.length)];
    if (face === lastFace) continue;
    if (face === secondLastFace && opposites[face] === lastFace) continue;

    const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
    moves.push(face + mod);
    secondLastFace = lastFace;
    lastFace = face;
  }

  return moves.join(' ');
}

export function scrambleToFacelets(scrambleStr) {
  if (typeof min2phase.fromScramble === 'function') {
    return min2phase.fromScramble(scrambleStr);
  }
  return null;
}
