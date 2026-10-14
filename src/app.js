/**
 * Modern Rubik's Cube Solver Application Controller
 * High-performance, tactile, mobile-first design.
 * Enforces strictly single 90-degree moves for unmistakable playback clarity.
 */

import * as THREE from 'three';
import {
  COLOR_CONFIG,
  PRESETS,
  createCubeState,
  getFaceletInfo
} from './cubeModel.js';
import { RubikThreeScene } from './threeCube.js';
import {
  initSolver,
  solveCubeState,
  generateRandomScramble,
  scrambleToFacelets
} from './solver.js';
import { sound } from './sound.js';

class RubikApp {
  constructor() {
    this.cubeState = createCubeState('solved');
    this.initialCubeState = [...this.cubeState];
    this.selectedColor = 'U';
    this.activeTab = 'input'; // 'input' | 'net' | 'solution'

    this.solution = [];
    this.currentStep = 0;
    this.isPlaying = false;
    this.playTimer = null;
    this.animationSpeed = 380; // slightly more deliberate for optimal visual tracking

    this.cacheDom();

    this.threeScene = new RubikThreeScene(this.dom.canvasContainer, {
      onStickerClick: (idx) => this.handleStickerClick(idx),
      onInteractionStart: () => sound.ensureContext()
    });

    this.renderPalette();
    this.renderNet();
    this.initEventListeners();
    this.initSolverAsync();
    this.updateAllViews();
  }

  cacheDom() {
    this.dom = {
      canvasContainer: document.getElementById('canvas-container'),
      solverStatus: document.getElementById('solver-status'),
      solverStatusText: document.getElementById('solver-status-text'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      iconSoundOn: document.getElementById('icon-sound-on'),
      iconSoundOff: document.getElementById('icon-sound-off'),
      btnHelp: document.getElementById('btn-help'),
      helpModal: document.getElementById('help-modal'),
      btnModalClose: document.getElementById('btn-modal-close'),

      // Segmented Tabs
      tabBtnInput: document.getElementById('tab-btn-input'),
      tabBtnNet: document.getElementById('tab-btn-net'),
      tabBtnSolution: document.getElementById('tab-btn-solution'),
      tabContentInput: document.getElementById('tab-content-input'),
      tabContentNet: document.getElementById('tab-content-net'),
      tabContentSolution: document.getElementById('tab-content-solution'),
      movesCountBadge: document.getElementById('moves-count-badge'),

      // Input Controls
      paletteGrid: document.getElementById('palette-grid'),
      paletteGridNet: document.getElementById('palette-grid-net'),
      netGrid: document.getElementById('net-grid'),
      btnScramble: document.getElementById('btn-scramble'),
      btnResetSolved: document.getElementById('btn-reset-solved'),
      btnClearAll: document.getElementById('btn-clear-all'),
      presetSelect: document.getElementById('preset-select'),
      errorBanner: document.getElementById('error-banner'),
      errorTitle: document.getElementById('error-title'),
      errorDesc: document.getElementById('error-desc'),
      btnSolve: document.getElementById('btn-solve'),
      btnSolveText: document.getElementById('btn-solve-text'),

      // Solution Player
      statTotalMoves: document.getElementById('stat-total-moves'),
      statCurrentStep: document.getElementById('stat-current-step'),
      btnBackToInput: document.getElementById('btn-back-to-input'),
      stepMoveBadge: document.getElementById('step-move-badge'),
      stepNumText: document.getElementById('step-num-text'),
      stepInstructionText: document.getElementById('step-instruction-text'),
      stepTipText: document.getElementById('step-tip-text'),

      btnPlayerStart: document.getElementById('btn-player-start'),
      btnPlayerPrev: document.getElementById('btn-player-prev'),
      btnPlayerPlay: document.getElementById('btn-player-play'),
      iconPlay: document.getElementById('icon-play'),
      iconPause: document.getElementById('icon-pause'),
      btnPlayerNext: document.getElementById('btn-player-next'),
      btnPlayerEnd: document.getElementById('btn-player-end'),
      stepSlider: document.getElementById('step-slider'),
      sliderProgressLabel: document.getElementById('slider-progress-label'),
      speedButtons: document.querySelectorAll('.pill-btn'),
      movesGrid: document.getElementById('moves-grid'),

      toastContainer: document.getElementById('toast-container'),
      canvasTip: document.getElementById('canvas-tip')
    };
  }

  async initSolverAsync() {
    try {
      await initSolver();
    } catch (e) {
      console.warn('Solver init warning:', e);
    }
  }

  renderPalette() {
    const containers = [this.dom.paletteGrid, this.dom.paletteGridNet].filter(Boolean);
    const paletteOrder = ['U', 'D', 'F', 'B', 'R', 'L'];

    containers.forEach(container => {
      container.innerHTML = '';
      paletteOrder.forEach(faceId => {
        const config = COLOR_CONFIG[faceId];
        const item = document.createElement('div');
        item.className = `palette-item ${this.selectedColor === faceId ? 'active' : ''}`;
        item.dataset.face = faceId;

        item.innerHTML = `
          <div class="palette-left">
            <div class="color-dot" style="background-color: ${config.hex};"></div>
            <span class="color-label">${config.name} (${faceId})</span>
          </div>
          <span class="count-badge counter-badge-${faceId}">9/9</span>
        `;

        item.addEventListener('click', () => {
          sound.ensureContext();
          this.selectColor(faceId);
        });

        container.appendChild(item);
      });
    });
  }

  selectColor(faceId) {
    this.selectedColor = faceId;
    document.querySelectorAll('.palette-item').forEach(el => {
      el.classList.toggle('active', el.dataset.face === faceId);
    });
  }

  renderNet() {
    this.dom.netGrid.innerHTML = '';
    const faces = [
      { id: 'U', posClass: 'pos-u', offset: 0 },
      { id: 'L', posClass: 'pos-l', offset: 36 },
      { id: 'F', posClass: 'pos-f', offset: 18 },
      { id: 'R', posClass: 'pos-r', offset: 9 },
      { id: 'B', posClass: 'pos-b', offset: 45 },
      { id: 'D', posClass: 'pos-d', offset: 27 }
    ];

    faces.forEach(face => {
      const faceEl = document.createElement('div');
      faceEl.className = `net-face ${face.posClass}`;

      for (let i = 0; i < 9; i++) {
        const faceletIdx = face.offset + i;
        const info = getFaceletInfo(faceletIdx);
        const btn = document.createElement('button');
        btn.className = `net-sticker ${info.isCenter ? 'is-center' : ''}`;
        btn.dataset.index = faceletIdx;

        const faceColor = this.cubeState[faceletIdx];
        const hex = COLOR_CONFIG[faceColor] ? COLOR_CONFIG[faceColor].hex : COLOR_CONFIG.EMPTY.hex;
        btn.style.backgroundColor = hex;

        btn.addEventListener('click', () => this.handleStickerClick(faceletIdx));
        faceEl.appendChild(btn);
      }

      this.dom.netGrid.appendChild(faceEl);
    });
  }

  handleStickerClick(faceletIndex) {
    sound.ensureContext();
    if (this.activeTab === 'solution') return;

    const info = getFaceletInfo(faceletIndex);
    if (info.isCenter) {
      this.showToast('Merkez kareler sabit referanstır.', 'warning');
      return;
    }

    this.cubeState[faceletIndex] = this.selectedColor;
    sound.playTurn();

    this.updateAllViews();
    this.hideError();
  }

  updateAllViews() {
    this.threeScene.setCubeStateColors(this.cubeState);

    document.querySelectorAll('.net-sticker').forEach(btn => {
      const idx = parseInt(btn.dataset.index, 10);
      const faceColor = this.cubeState[idx];
      const hex = COLOR_CONFIG[faceColor] ? COLOR_CONFIG[faceColor].hex : COLOR_CONFIG.EMPTY.hex;
      btn.style.backgroundColor = hex;
    });

    const counts = { U: 0, D: 0, F: 0, B: 0, R: 0, L: 0, '?': 0 };
    this.cubeState.forEach(c => {
      if (counts[c] !== undefined) counts[c]++;
    });

    ['U', 'D', 'F', 'B', 'R', 'L'].forEach(face => {
      const count = counts[face];
      document.querySelectorAll(`.counter-badge-${face}`).forEach(badge => {
        badge.textContent = `${count}/9`;
        badge.className = `count-badge counter-badge-${face} ${count === 9 ? 'exact' : (count > 9 ? 'warn' : '')}`;
      });
    });
  }

  initEventListeners() {
    this.dom.btnSoundToggle.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      this.dom.iconSoundOn.style.display = isMuted ? 'none' : 'block';
      this.dom.iconSoundOff.style.display = isMuted ? 'block' : 'none';
      this.showToast(isMuted ? 'Ses kapatıldı' : 'Ses açıldı');
    });

    this.dom.btnHelp.addEventListener('click', () => {
      this.dom.helpModal.classList.add('open');
    });
    this.dom.btnModalClose.addEventListener('click', () => {
      this.dom.helpModal.classList.remove('open');
    });
    this.dom.helpModal.addEventListener('click', (e) => {
      if (e.target === this.dom.helpModal) {
        this.dom.helpModal.classList.remove('open');
      }
    });

    this.dom.tabBtnInput.addEventListener('click', () => this.switchTab('input'));
    this.dom.tabBtnNet.addEventListener('click', () => this.switchTab('net'));
    this.dom.tabBtnSolution.addEventListener('click', () => {
      if (this.solution.length > 0) {
        this.switchTab('solution');
      } else {
        this.showToast('Önce küpü çözmelisiniz.', 'warning');
      }
    });
    this.dom.btnBackToInput.addEventListener('click', () => this.switchTab('input'));

    document.querySelectorAll('.angle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.threeScene.resetCameraView(btn.dataset.view);
      });
    });

    this.dom.btnScramble.addEventListener('click', () => this.handleRandomScramble());
    this.dom.btnResetSolved.addEventListener('click', () => this.handleResetSolved());
    this.dom.btnClearAll.addEventListener('click', () => this.handleClearAll());

    this.dom.presetSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) this.applyPreset(val);
      e.target.value = '';
    });

    this.dom.btnSolve.addEventListener('click', () => this.handleSolveClick());

    this.dom.btnPlayerPlay.addEventListener('click', () => this.togglePlay());
    this.dom.btnPlayerNext.addEventListener('click', () => this.stepNext());
    this.dom.btnPlayerPrev.addEventListener('click', () => this.stepPrev());
    this.dom.btnPlayerStart.addEventListener('click', () => this.goToStep(0));
    this.dom.btnPlayerEnd.addEventListener('click', () => this.goToStep(this.solution.length));

    this.dom.stepSlider.addEventListener('input', (e) => {
      this.goToStep(parseInt(e.target.value, 10));
    });

    this.dom.speedButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.speedButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.animationSpeed = parseInt(btn.dataset.speed, 10);
      });
    });
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.pause();

    const tabs = [
      { id: 'input', btn: this.dom.tabBtnInput, content: this.dom.tabContentInput },
      { id: 'net', btn: this.dom.tabBtnNet, content: this.dom.tabContentNet },
      { id: 'solution', btn: this.dom.tabBtnSolution, content: this.dom.tabContentSolution }
    ];

    tabs.forEach(t => {
      t.btn.classList.toggle('active', t.id === tab);
      t.content.classList.toggle('active', t.id === tab);
    });

    if (tab === 'solution') {
      this.threeScene.setPaintMode(false);
      this.dom.canvasTip.textContent = '3D çözümü tek tek 90° adımlarla izleyin';
      this.goToStep(this.currentStep, false);
    } else {
      this.threeScene.setPaintMode(true);
      this.dom.canvasTip.textContent = 'Küpü çevirmek için sürükleyin, boyamak için kareye dokunun';
      this.threeScene.resetCubiePositions();
      this.threeScene.setCubeStateColors(this.cubeState);
    }
  }

  handleRandomScramble() {
    sound.ensureContext();
    this.pause();
    const scrambleStr = generateRandomScramble(20);
    const newFacelets = scrambleToFacelets(scrambleStr);
    if (newFacelets) {
      this.cubeState = newFacelets.split('');
    }

    this.threeScene.resetCubiePositions();
    this.updateAllViews();
    this.hideError();
    this.solution = [];
    this.dom.movesCountBadge.style.display = 'none';
    this.showToast('20 hamlelik rastgele karışım uygulandı');
  }

  handleResetSolved() {
    this.pause();
    this.cubeState = createCubeState('solved');
    this.threeScene.resetCubiePositions();
    this.updateAllViews();
    this.hideError();
    this.solution = [];
    this.dom.movesCountBadge.style.display = 'none';
    this.showToast('Küp çözülmüş duruma getirildi');
  }

  handleClearAll() {
    this.pause();
    this.cubeState = createCubeState('empty');
    this.threeScene.resetCubiePositions();
    this.updateAllViews();
    this.hideError();
    this.solution = [];
    this.dom.movesCountBadge.style.display = 'none';
    this.showToast('Kareler temizlendi. Renkleri girebilirsiniz');
  }

  applyPreset(presetId) {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    this.pause();
    const facelets = scrambleToFacelets(preset.algorithm || '');
    if (facelets) {
      this.cubeState = facelets.split('');
    }

    this.threeScene.resetCubiePositions();
    this.updateAllViews();
    this.hideError();
    this.solution = [];
    this.dom.movesCountBadge.style.display = 'none';
    this.showToast(`"${preset.name}" uygulandı`);
  }

  async handleSolveClick() {
    sound.ensureContext();
    this.hideError();

    this.dom.btnSolve.disabled = true;
    this.dom.btnSolveText.textContent = 'Hesaplanıyor...';

    try {
      const result = await solveCubeState(this.cubeState);

      if (!result.success) {
        sound.playError();
        this.showError(result.error.title, result.error.message);
        return;
      }

      if (result.isAlreadySolved) {
        sound.playSolved();
        this.showToast('Küp zaten tamamen çözülmüş durumda!', 'success');
        return;
      }

      this.solution = result.moves;
      this.initialCubeState = [...this.cubeState];
      this.currentStep = 0;

      this.dom.movesCountBadge.textContent = this.solution.length;
      this.dom.movesCountBadge.style.display = 'inline-block';
      this.dom.statTotalMoves.textContent = this.solution.length;

      this.renderMoveChips();
      this.dom.stepSlider.max = this.solution.length;
      this.dom.stepSlider.value = 0;

      this.switchTab('solution');
      this.updatePlayerDisplay();

      this.showToast(`${this.solution.length} tekli 90° hamlelik çözüm hazır!`, 'success');
    } catch (err) {
      sound.playError();
      this.showError('Çözüm Hatası', err.message);
    } finally {
      this.dom.btnSolve.disabled = false;
      this.dom.btnSolveText.textContent = 'KÜPÜ ÇÖZ';
    }
  }

  renderMoveChips() {
    this.dom.movesGrid.innerHTML = '';
    this.solution.forEach((m, idx) => {
      const chip = document.createElement('div');
      chip.className = 'chip-item';
      chip.dataset.step = idx + 1;

      chip.innerHTML = `
        <span class="chip-code">${m.raw}</span>
        <span class="chip-idx">#${m.stepIndex}</span>
      `;

      chip.addEventListener('click', () => {
        this.goToStep(idx + 1);
      });

      this.dom.movesGrid.appendChild(chip);
    });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (this.currentStep >= this.solution.length) {
      this.goToStep(0, false);
    }

    this.isPlaying = true;
    this.dom.iconPlay.style.display = 'none';
    this.dom.iconPause.style.display = 'block';

    const loop = async () => {
      if (!this.isPlaying) return;

      if (this.currentStep < this.solution.length) {
        await this.stepNext();
        if (this.isPlaying) {
          // Clear, noticeable pause between each single 90° turn
          const pauseBetweenMoves = Math.max(this.animationSpeed * 0.45, 180);
          this.playTimer = setTimeout(loop, pauseBetweenMoves);
        }
      } else {
        this.pause();
        sound.playSolved();
        this.showToast('Tebrikler! Küp çözüldü.', 'success');
      }
    };

    loop();
  }

  pause() {
    this.isPlaying = false;
    clearTimeout(this.playTimer);
    if (this.dom.iconPlay) this.dom.iconPlay.style.display = 'block';
    if (this.dom.iconPause) this.dom.iconPause.style.display = 'none';
  }

  async stepNext() {
    if (this.currentStep >= this.solution.length || this.threeScene.isAnimating) return;

    const moveObj = this.solution[this.currentStep];
    const duration = Math.max(this.animationSpeed * 0.85, 90);

    // Smoothly rotate strictly 90°
    await this.threeScene.rotateMove(moveObj.raw, duration);

    this.currentStep++;
    this.updatePlayerDisplay();

    if (this.currentStep === this.solution.length && !this.isPlaying) {
      sound.playSolved();
      this.showToast('Tebrikler! Küp çözüldü.', 'success');
    }
  }

  async stepPrev() {
    if (this.currentStep <= 0 || this.threeScene.isAnimating) return;
    this.pause();

    const lastMove = this.solution[this.currentStep - 1];
    const inv = this.getInverseMove(lastMove.raw);
    const duration = Math.max(this.animationSpeed * 0.85, 90);

    await this.threeScene.rotateMove(inv, duration);

    this.currentStep--;
    this.updatePlayerDisplay();
  }

  getInverseMove(move) {
    if (move.endsWith("'")) return move.slice(0, -1);
    return move + "'";
  }

  goToStep(targetStep, animate = false) {
    this.pause();
    targetStep = Math.max(0, Math.min(targetStep, this.solution.length));

    this.threeScene.resetCubiePositions();
    this.threeScene.setCubeStateColors(this.initialCubeState);

    // Fast simulation of all 90° moves up to targetStep
    for (let i = 0; i < targetStep; i++) {
      this.simulateMoveInstant(this.solution[i].raw);
    }

    this.currentStep = targetStep;
    this.updatePlayerDisplay();

    if (this.currentStep === this.solution.length) {
      sound.playSolved();
    }
  }

  simulateMoveInstant(moveNotation) {
    const moveParams = {
      U: { axis: new THREE.Vector3(0, 1, 0), angle: -Math.PI / 2, coord: 'y', val: 1 },
      "U'": { axis: new THREE.Vector3(0, 1, 0), angle: Math.PI / 2, coord: 'y', val: 1 },
      D: { axis: new THREE.Vector3(0, 1, 0), angle: Math.PI / 2, coord: 'y', val: -1 },
      "D'": { axis: new THREE.Vector3(0, 1, 0), angle: -Math.PI / 2, coord: 'y', val: -1 },
      R: { axis: new THREE.Vector3(1, 0, 0), angle: -Math.PI / 2, coord: 'x', val: 1 },
      "R'": { axis: new THREE.Vector3(1, 0, 0), angle: Math.PI / 2, coord: 'x', val: 1 },
      L: { axis: new THREE.Vector3(1, 0, 0), angle: Math.PI / 2, coord: 'x', val: -1 },
      "L'": { axis: new THREE.Vector3(1, 0, 0), angle: -Math.PI / 2, coord: 'x', val: -1 },
      F: { axis: new THREE.Vector3(0, 0, 1), angle: -Math.PI / 2, coord: 'z', val: 1 },
      "F'": { axis: new THREE.Vector3(0, 0, 1), angle: Math.PI / 2, coord: 'z', val: 1 },
      B: { axis: new THREE.Vector3(0, 0, 1), angle: Math.PI / 2, coord: 'z', val: -1 },
      "B'": { axis: new THREE.Vector3(0, 0, 1), angle: -Math.PI / 2, coord: 'z', val: -1 }
    };

    const def = moveParams[moveNotation];
    if (!def) return;

    const q = new THREE.Quaternion().setFromAxisAngle(def.axis, def.angle);

    this.threeScene.cubies.forEach(c => {
      if (Math.round(c.position[def.coord]) === def.val) {
        c.position.applyQuaternion(q);
        c.position.x = Math.round(c.position.x);
        c.position.y = Math.round(c.position.y);
        c.position.z = Math.round(c.position.z);
        c.quaternion.premultiply(q);
        this.threeScene.snapCubieRotation(c);
      }
    });
  }

  updatePlayerDisplay() {
    const total = this.solution.length;
    this.dom.statCurrentStep.textContent = `${this.currentStep} / ${total}`;
    this.dom.sliderProgressLabel.textContent = `${this.currentStep}`;
    this.dom.stepSlider.value = this.currentStep;

    this.dom.btnPlayerPrev.disabled = this.currentStep === 0;
    this.dom.btnPlayerStart.disabled = this.currentStep === 0;
    this.dom.btnPlayerNext.disabled = this.currentStep === total;
    this.dom.btnPlayerEnd.disabled = this.currentStep === total;

    if (this.currentStep === 0) {
      this.dom.stepMoveBadge.textContent = '0';
      this.dom.stepMoveBadge.style.borderColor = '#2563eb';
      this.dom.stepNumText.textContent = 'BAŞLANGIÇ';
      this.dom.stepInstructionText.textContent = 'Çözümü başlatmak için Oynat veya İleri butonuna basın.';
      this.dom.stepTipText.textContent = 'Beyaz üstte, Yeşil önde tutulur.';
    } else if (this.currentStep <= total) {
      const activeMove = this.solution[this.currentStep - 1];
      this.dom.stepMoveBadge.textContent = activeMove.raw;
      this.dom.stepMoveBadge.style.borderColor = activeMove.faceColor || '#2563eb';
      this.dom.stepNumText.textContent = `ADIM ${this.currentStep} / ${total} • ${activeMove.degrees}`;
      this.dom.stepInstructionText.textContent = activeMove.desc;
      this.dom.stepTipText.textContent = `${activeMove.faceName} • ${activeMove.actionName}`;
    }

    const chips = this.dom.movesGrid.querySelectorAll('.chip-item');
    chips.forEach((chip, idx) => {
      const stepNum = idx + 1;
      chip.classList.toggle('active', stepNum === this.currentStep);
      chip.classList.toggle('passed', stepNum < this.currentStep);
    });

    const activeChip = this.dom.movesGrid.querySelector(`.chip-item[data-step="${this.currentStep}"]`);
    if (activeChip && this.dom.movesGrid) {
      const container = this.dom.movesGrid;
      // Scroll only inside the movesGrid container without moving window/page
      const targetLeft = activeChip.offsetLeft - (container.clientWidth / 2) + (activeChip.offsetWidth / 2);
      const targetTop = activeChip.offsetTop - (container.clientHeight / 2) + (activeChip.offsetHeight / 2);
      container.scrollTo({
        left: targetLeft,
        top: targetTop,
        behavior: 'smooth'
      });
    }
  }

  showError(title, desc) {
    this.dom.errorTitle.textContent = title;
    this.dom.errorDesc.textContent = desc;
    this.dom.errorBanner.style.display = 'flex';
  }

  hideError() {
    this.dom.errorBanner.style.display = 'none';
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `clean-toast ${type}`;
    toast.textContent = message;

    this.dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new RubikApp();
});
