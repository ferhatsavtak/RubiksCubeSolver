/**
 * High-End 3D Rubik's Cube Scene powered by Three.js
 * Studio-quality lighting, contact shadow, tactile speedcube materials,
 * mobile touch optimizations, and smooth layer rotation animations.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { COLOR_CONFIG, getFaceletIndex, getFaceletInfo } from './cubeModel.js';
import { sound } from './sound.js';

export class RubikThreeScene {
  constructor(canvasContainer, options = {}) {
    this.container = canvasContainer;
    this.onStickerClick = options.onStickerClick || (() => {});
    this.onInteractionStart = options.onInteractionStart || (() => {});

    this.cubies = [];
    this.stickers = new Map(); // faceletIndex -> Mesh
    this.isAnimating = false;
    this.paintMode = true;
    this.hoveredSticker = null;

    this.initScene();
    this.createCube();
    this.initEvents();
    this.startLoop();

    setTimeout(() => this.handleResize(), 50);
  }

  initScene() {
    this.scene = new THREE.Scene();

    let width = this.container.clientWidth;
    let height = this.container.clientHeight;
    if (!width || width === 0) width = window.innerWidth;
    if (!height || height === 0) height = Math.max(window.innerHeight * 0.5, 360);

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.defaultCameraPos = new THREE.Vector3(4.8, 3.8, 5.8);
    this.camera.position.copy(this.defaultCameraPos);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 3.6;
    this.controls.maxDistance = 12;
    this.controls.rotateSpeed = 0.75;
    this.controls.enablePan = false;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(6, 9, 7);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xb0c4de, 0.6);
    fillLight.position.set(-6, -4, -6);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 8, -5);
    this.scene.add(rimLight);

    this.createContactShadow();

    this.cubeRoot = new THREE.Group();
    this.scene.add(this.cubeRoot);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.pointerDownPos = new THREE.Vector2();
    this.pointerDownTime = 0;
  }

  createContactShadow() {
    const shadowGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });

    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.95;
    this.scene.add(shadowMesh);
  }

  createCube() {
    while (this.cubeRoot.children.length > 0) {
      this.cubeRoot.remove(this.cubeRoot.children[0]);
    }
    this.cubies = [];
    this.stickers.clear();

    const cubieSize = 0.96;
    const cubieGeo = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x111216,
      roughness: 0.6,
      metalness: 0.1
    });

    const stickerSize = 0.86;
    const stickerThickness = 0.02;
    const stickerGeo = new THREE.BoxGeometry(stickerSize, stickerSize, stickerThickness);
    const spacing = 1.0;

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;

          const cubieGroup = new THREE.Group();
          cubieGroup.position.set(x * spacing, y * spacing, z * spacing);
          cubieGroup.userData = {
            baseX: x,
            baseY: y,
            baseZ: z
          };

          const bodyMesh = new THREE.Mesh(cubieGeo, bodyMaterial);
          cubieGroup.add(bodyMesh);

          const addSticker = (faceNormal, faceletIdx) => {
            const info = getFaceletInfo(faceletIdx);
            const defaultColor = COLOR_CONFIG[info.face].hex;

            const stickerMat = new THREE.MeshStandardMaterial({
              color: new THREE.Color(defaultColor),
              roughness: 0.22,
              metalness: 0.05,
              emissive: 0x000000
            });

            const stickerMesh = new THREE.Mesh(stickerGeo, stickerMat);
            stickerMesh.userData = {
              faceletIndex: faceletIdx,
              isCenter: info.isCenter,
              cubieGroup: cubieGroup,
              baseColorHex: defaultColor
            };

            if (faceNormal.y === 1) {
              stickerMesh.position.set(0, (cubieSize + stickerThickness) / 2, 0);
              stickerMesh.rotation.x = -Math.PI / 2;
            } else if (faceNormal.y === -1) {
              stickerMesh.position.set(0, -(cubieSize + stickerThickness) / 2, 0);
              stickerMesh.rotation.x = Math.PI / 2;
            } else if (faceNormal.z === 1) {
              stickerMesh.position.set(0, 0, (cubieSize + stickerThickness) / 2);
            } else if (faceNormal.z === -1) {
              stickerMesh.position.set(0, 0, -(cubieSize + stickerThickness) / 2);
              stickerMesh.rotation.y = Math.PI;
            } else if (faceNormal.x === 1) {
              stickerMesh.position.set((cubieSize + stickerThickness) / 2, 0, 0);
              stickerMesh.rotation.y = Math.PI / 2;
            } else if (faceNormal.x === -1) {
              stickerMesh.position.set(-(cubieSize + stickerThickness) / 2, 0, 0);
              stickerMesh.rotation.y = -Math.PI / 2;
            }

            cubieGroup.add(stickerMesh);
            this.stickers.set(faceletIdx, stickerMesh);
          };

          if (y === 1) addSticker({ x: 0, y: 1, z: 0 }, getFaceletIndex(x, y, z, { y: 1 }));
          if (y === -1) addSticker({ x: 0, y: -1, z: 0 }, getFaceletIndex(x, y, z, { y: -1 }));
          if (z === 1) addSticker({ x: 0, y: 0, z: 1 }, getFaceletIndex(x, y, z, { z: 1 }));
          if (z === -1) addSticker({ x: 0, y: 0, z: -1 }, getFaceletIndex(x, y, z, { z: -1 }));
          if (x === 1) addSticker({ x: 1, y: 0, z: 0 }, getFaceletIndex(x, y, z, { x: 1 }));
          if (x === -1) addSticker({ x: -1, y: 0, z: 0 }, getFaceletIndex(x, y, z, { x: -1 }));

          this.cubeRoot.add(cubieGroup);
          this.cubies.push(cubieGroup);
        }
      }
    }
  }

  setStickerColor(faceletIndex, colorFaceId) {
    const stickerMesh = this.stickers.get(faceletIndex);
    if (!stickerMesh) return;

    const colorConfig = COLOR_CONFIG[colorFaceId] || COLOR_CONFIG.EMPTY;
    stickerMesh.material.color.set(colorConfig.hex);
    stickerMesh.userData.baseColorHex = colorConfig.hex;
  }

  setCubeStateColors(facelets) {
    for (let i = 0; i < 54; i++) {
      this.setStickerColor(i, facelets[i]);
    }
  }

  resetCubiePositions() {
    const spacing = 1.0;
    this.cubies.forEach(cubie => {
      if (cubie.parent !== this.cubeRoot) {
        this.cubeRoot.attach(cubie);
      }
      const bx = cubie.userData.baseX;
      const by = cubie.userData.baseY;
      const bz = cubie.userData.baseZ;

      cubie.position.set(bx * spacing, by * spacing, bz * spacing);
      cubie.quaternion.identity();
    });
  }

  /**
   * Smoothly rotates a single 90-degree move with clear layer focus
   */
  async rotateMove(moveNotation, duration = 320) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Strictly single 90-degree moves
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
    if (!def) {
      this.isAnimating = false;
      return;
    }

    const layerCubies = this.cubies.filter(c => {
      return Math.round(c.position[def.coord]) === def.val;
    });

    // Subtle highlight on the active turning layer so the eye tracks it clearly
    const activeStickers = [];
    layerCubies.forEach(cubie => {
      cubie.children.forEach(child => {
        if (child.userData && child.userData.faceletIndex !== undefined) {
          activeStickers.push(child);
          child.material.emissive.setHex(0x282c3c);
        }
      });
    });

    const pivot = new THREE.Group();
    this.cubeRoot.add(pivot);

    layerCubies.forEach(c => {
      pivot.attach(c);
    });

    sound.playTurn();

    await new Promise(resolve => {
      const startTime = performance.now();
      const targetAngle = def.angle;

      const animateStep = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / Math.max(duration, 50), 1);
        
        // Smooth cubic ease-in-out curve for crystal-clear rotation visibility
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        pivot.quaternion.setFromAxisAngle(def.axis, targetAngle * ease);

        if (progress < 1) {
          requestAnimationFrame(animateStep);
        } else {
          pivot.quaternion.setFromAxisAngle(def.axis, targetAngle);
          pivot.updateMatrixWorld(true);

          layerCubies.forEach(c => {
            this.cubeRoot.attach(c);
            c.position.x = Math.round(c.position.x);
            c.position.y = Math.round(c.position.y);
            c.position.z = Math.round(c.position.z);
            this.snapCubieRotation(c);
          });

          // Reset layer highlight
          activeStickers.forEach(s => s.material.emissive.setHex(0x000000));

          this.cubeRoot.remove(pivot);
          this.isAnimating = false;
          resolve();
        }
      };

      requestAnimationFrame(animateStep);
    });
  }

  snapCubieRotation(cubie) {
    const m = new THREE.Matrix4().makeRotationFromQuaternion(cubie.quaternion);
    const elements = m.elements;
    for (let i = 0; i < 16; i++) {
      if (i % 5 !== 3) {
        elements[i] = Math.round(elements[i]);
      }
    }
    cubie.quaternion.setFromRotationMatrix(m);
  }

  initEvents() {
    const dom = this.renderer.domElement;

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.container);

    window.addEventListener('resize', () => this.handleResize());

    dom.addEventListener('pointermove', (e) => this.handlePointerMove(e));

    dom.addEventListener('pointerdown', (e) => {
      this.pointerDownPos.set(e.clientX, e.clientY);
      this.pointerDownTime = performance.now();
      this.onInteractionStart();
    });

    dom.addEventListener('pointerup', (e) => {
      const dist = this.pointerDownPos.distanceTo(new THREE.Vector2(e.clientX, e.clientY));
      const duration = performance.now() - this.pointerDownTime;
      if (dist < 8 && duration < 350) {
        this.handlePointerClick(e);
      }
    });

    dom.addEventListener('pointerleave', () => {
      this.clearHover();
    });
  }

  handlePointerMove(event) {
    if (!this.paintMode || this.isAnimating) {
      this.clearHover();
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const stickerMeshes = Array.from(this.stickers.values());
    const intersects = this.raycaster.intersectObjects(stickerMeshes, false);

    if (intersects.length > 0) {
      const hitSticker = intersects[0].object;
      if (this.hoveredSticker !== hitSticker) {
        this.clearHover();
        this.hoveredSticker = hitSticker;
        this.hoveredSticker.material.emissive.setHex(0x282832);
        this.renderer.domElement.style.cursor = 'pointer';
      }
    } else {
      this.clearHover();
    }
  }

  clearHover() {
    if (this.hoveredSticker) {
      this.hoveredSticker.material.emissive.setHex(0x000000);
      this.hoveredSticker = null;
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  handlePointerClick(event) {
    if (!this.paintMode || this.isAnimating) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const stickerMeshes = Array.from(this.stickers.values());
    const intersects = this.raycaster.intersectObjects(stickerMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const faceletIdx = hit.userData.faceletIndex;
      this.onStickerClick(faceletIdx);
    }
  }

  setPaintMode(enabled) {
    this.paintMode = enabled;
    if (!enabled) {
      this.clearHover();
    }
  }

  resetCameraView(viewType = 'iso') {
    const targetPos = new THREE.Vector3();
    if (viewType === 'iso') {
      targetPos.set(4.8, 3.8, 5.8);
    } else if (viewType === 'front') {
      targetPos.set(0, 0, 7.0);
    } else if (viewType === 'top') {
      targetPos.set(0, 7.0, 0.01);
    } else if (viewType === 'right') {
      targetPos.set(7.0, 0, 0);
    }

    const startPos = this.camera.position.clone();
    const startTime = performance.now();
    const duration = 400;

    const animateCam = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(startPos, targetPos, ease);
      this.camera.lookAt(0, 0, 0);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateCam);
      }
    };
    requestAnimationFrame(animateCam);
  }

  handleResize() {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || (window.innerHeight * 0.5);

    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  startLoop() {
    const tick = () => {
      requestAnimationFrame(tick);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.clearHover();
    this.renderer.dispose();
  }
}
