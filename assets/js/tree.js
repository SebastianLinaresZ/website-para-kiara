(function (global) {
  'use strict';

  const LOVE = (global.LOVE = global.LOVE || {});

  const MAX_DPR = 2;
  const STEP_MS = 10;

  const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const randomFloat = (min, max) => min + Math.random() * (max - min);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  class Vec {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }

    clone() {
      return new Vec(this.x, this.y);
    }

    add(other) {
      return new Vec(this.x + other.x, this.y + other.y);
    }

    sub(other) {
      return new Vec(this.x - other.x, this.y - other.y);
    }

    mul(factor) {
      return new Vec(this.x * factor, this.y * factor);
    }

    div(divisor) {
      return new Vec(this.x / divisor, this.y / divisor);
    }
  }

  function bezierPoint(p1, p2, p3, t) {
    const mt = 1 - t;
    return new Vec(
      p1.x * mt * mt + p2.x * 2 * t * mt + p3.x * t * t,
      p1.y * mt * mt + p2.y * 2 * t * mt + p3.y * t * t,
    );
  }

  function insideHeart(x, y, r) {
    const nx = x / r;
    const ny = y / r;
    const base = nx * nx + ny * ny - 1;
    return base * base * base - nx * nx * ny * ny * ny < 0;
  }

  // x = 16 sin³t, y = 13cos t - 5cos 2t - 2cos 3t - cos 4t
  const HEART_PATH = (() => {
    const path = new Path2D();
    path.moveTo(0, 0);
    for (let i = 10; i < 30; i += 0.2) {
      const t = i / Math.PI;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      path.lineTo(x, -y);
    }
    path.closePath();
    return path;
  })();

  class Seed {
    constructor(tree) {
      const options = tree.opts.seed;
      const mobile = tree.isMobile;

      this.tree = tree;
      this.origin = new Vec(options.x, options.y);
      this.point = new Vec(options.x, options.y);
      this.color = options.color;
      this.scale = mobile ? options.scaleMobile : options.scaleDesktop;
      this.initialScale = this.scale;
      this.textScale = mobile ? options.textScaleMobile : options.textScaleDesktop;
      this.text = options.text;
      this.circleRadius = 5;
    }

    drawHeart() {
      const ctx = this.tree.ctx;
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.translate(this.point.x, this.point.y);
      ctx.scale(this.scale, this.scale);
      ctx.fill(HEART_PATH);
      ctx.restore();
    }

    drawCircle() {
      const ctx = this.tree.ctx;
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.translate(this.point.x, this.point.y);
      ctx.scale(this.initialScale, this.initialScale);
      ctx.beginPath();
      ctx.arc(0, 0, this.circleRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawText() {
      const ctx = this.tree.ctx;
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.fillStyle = this.color;
      ctx.translate(this.point.x, this.point.y);
      ctx.scale(this.scale * this.textScale, this.scale * this.textScale);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(15, 15);
      ctx.lineTo(60, 15);
      ctx.stroke();

      ctx.scale(0.75, 0.75);
      ctx.font = "600 12px 'Nunito', Verdana, sans-serif";
      ctx.fillText(this.text, 23, 10);
      ctx.restore();
    }

    draw() {
      this.drawHeart();
      this.drawText();
    }

    shrink() {
      this.scale *= 0.95;
    }

    canShrink() {
      return this.scale > 0.2;
    }

    moveBy(dx, dy) {
      this.point = this.point.add(new Vec(dx, dy));
    }

    canFall() {
      return this.point.y < this.tree.height + 20;
    }

    contains(x, y) {
      const scale = this.initialScale;
      const textWidth = 66 * scale * this.textScale;
      return (
        x >= this.origin.x - 22 * scale &&
        x <= this.origin.x + textWidth &&
        y >= this.origin.y - 20 * scale &&
        y <= this.origin.y + 20 * scale
      );
    }
  }

  class Footer {
    constructor(tree, options) {
      this.tree = tree;
      this.width = options.width;
      this.height = options.height;
      this.speed = options.speed;
      this.length = 0;
      this.x = tree.seed.origin.x;
      this.y = tree.height - this.height / 2;
    }

    draw() {
      const ctx = this.tree.ctx;
      const half = this.length / 2;

      ctx.save();
      ctx.strokeStyle = this.tree.groundColor;
      ctx.lineWidth = this.height;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.translate(this.x, this.y);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(half, 0);
      ctx.lineTo(-half, 0);
      ctx.stroke();
      ctx.restore();

      if (this.length < this.width) {
        this.length = Math.min(this.length + this.speed, this.width);
      }
    }
  }

  class Branch {
    constructor(tree, data) {
      const [x1, y1, x2, y2, x3, y3, radius, length, children] = data;

      this.tree = tree;
      this.p1 = new Vec(x1, y1);
      this.p2 = new Vec(x2, y2);
      this.p3 = new Vec(x3, y3);
      this.radius = radius;
      this.length = length || 100;
      this.step = 0;
      this.t = 1 / (this.length - 1);
      this.children = children || [];
      this.done = false;
    }

    grow() {
      if (this.step <= this.length) {
        const point = bezierPoint(this.p1, this.p2, this.p3, this.step * this.t);
        this.draw(point);
        this.step += 1;
        this.radius *= 0.97;
      } else {
        this.done = true;
      }
    }

    draw(point) {
      const ctx = this.tree.ctx;
      ctx.save();
      ctx.fillStyle = this.tree.trunkColor;
      ctx.shadowColor = this.tree.trunkColor;
      ctx.shadowBlur = 2;
      ctx.beginPath();
      ctx.arc(point.x, point.y, this.radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  class Bloom {
    constructor(tree, point, options = {}) {
      this.tree = tree;
      this.point = point;
      this.color = options.color || tree.randomBloomColor();
      this.alpha = options.alpha ?? randomFloat(0.35, 1);
      this.angle = options.angle ?? randomFloat(0, Math.PI * 2);
      this.scale = options.scale ?? 0.1;
      this.place = options.place || null;
      this.speed = options.speed || 0;
      this.dead = false;
    }

    draw() {
      const ctx = this.tree.ctx;
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.translate(this.point.x, this.point.y);
      ctx.rotate(this.angle);
      ctx.scale(this.scale, this.scale);
      ctx.fill(HEART_PATH);
      ctx.restore();
    }

    flower() {
      this.draw();
      this.scale += this.tree.bloomOpt.growth;
      if (this.scale > this.tree.bloomOpt.maxScale) {
        this.dead = true;
      }
    }

    jump() {
      const height = this.tree.height;
      if (this.point.x < -20 || this.point.y > height + 20) {
        this.dead = true;
        return;
      }

      this.draw();

      if (this.place) {
        this.point = this.place.sub(this.point).div(Math.max(this.speed, 1)).add(this.point);
      }
      this.angle += 0.05;
      this.speed = Math.max(this.speed - 1, 1);
    }
  }

  class LoveTree {
    constructor(canvas, options) {
      this.canvas = canvas;
      this.opts = options;
      this.width = options.width;
      this.height = options.height;
      this.bloomOpt = options.bloom;

      this.isMobile = global.matchMedia('(max-width: 768px)').matches;
      this.isDesktop = global.matchMedia('(min-width: 1024px)').matches;
      this.reducedMotion = global.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.trunkColor = options.trunkColor || 'rgb(96, 72, 158)';
      this.groundColor = options.groundColor || 'rgb(59, 29, 120)';
      this.bloomColors = options.bloomColors || ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7dd3fc', '#38bdf8'];

      this.ctx = null;
      this.dpr = 1;
      this.offsetX = 0;
      this.frozen = null;
      this.blooms = [];
      this.branches = [];
      this.hooks = {};
      this.rafId = 0;
      this.destroyed = false;
      this.awaitingSeed = false;
      this.resolveSeed = null;

      this._setupCanvas();

      this.seed = new Seed(this);
      this.footer = new Footer(this, options.footer);
      this.bloomsCache = this._createBloomsCache();

      this._onClick = this._onClick.bind(this);
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onVisibilityChange = this._onVisibilityChange.bind(this);
      this._onResize = this._onResize.bind(this);

      this.canvas.addEventListener('click', this._onClick);
      this.canvas.addEventListener('pointermove', this._onPointerMove);
      document.addEventListener('visibilitychange', this._onVisibilityChange);
      global.addEventListener('resize', this._onResize);
    }

    // si la ventana deja de ser de escritorio, el árbol vuelve al centro
    _onResize() {
      const desktop = global.matchMedia('(min-width: 1024px)').matches;
      this.isDesktop = desktop;
      if (!desktop && this.offsetX !== 0) {
        this.offsetX = 0;
        if (this.frozen) this._paintTree();
      }
    }

    _setupCanvas() {
      // se dibuja siempre en 1100x680 y el lienzo se escala según la pantalla
      const dpr = Math.min(global.devicePixelRatio || 1, MAX_DPR);
      this.dpr = dpr;
      this.canvas.width = Math.round(this.width * dpr);
      this.canvas.height = Math.round(this.height * dpr);

      const ctx = this.canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx = ctx;
    }

    randomBloomColor() {
      return pick(this.bloomColors);
    }

    _createBloomsCache() {
      const { num, width, height, radius, margin, startScale } = this.bloomOpt;
      const cache = [];
      for (let i = 0; i < num; i += 1) {
        cache.push(this._randomBloom(width, height, radius, { scale: startScale, margin }));
      }
      return cache;
    }

    _randomBloom(width, height, radius, options = {}) {
      const { margin = 20, centerXOffset = 0, centerYOffset = 0, startScale = 0.1 } = this.bloomOpt;
      const centerX = width / 2 + centerXOffset;
      const centerY = height - (height - 40) / 2 + centerYOffset;

      let x = width / 2;
      let y = height / 2;
      let attempts = 0;

      do {
        x = randomInt(margin, width - margin);
        y = randomInt(margin, height - margin);
        attempts += 1;
      } while (!insideHeart(x - centerX, centerY - y, radius) && attempts < 5000);

      return new Bloom(this, new Vec(x, y), { scale: startScale, ...options });
    }

    _toCanvasCoords(event) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * this.width,
        y: ((event.clientY - rect.top) / rect.height) * this.height,
      };
    }

    _onClick(event) {
      if (!this.awaitingSeed) return;
      const point = this._toCanvasCoords(event);
      if (!this.seed.contains(point.x, point.y)) return;

      this.awaitingSeed = false;
      this.canvas.classList.remove('hand');
      this.canvas.style.cursor = 'default';

      if (typeof this.hooks.onSeedTap === 'function') this.hooks.onSeedTap();
      if (this.resolveSeed) this.resolveSeed();
    }

    _onPointerMove(event) {
      if (!this.awaitingSeed) return;
      const point = this._toCanvasCoords(event);
      this.canvas.classList.toggle('hand', this.seed.contains(point.x, point.y));
    }

    _onVisibilityChange() {
      if (document.hidden) {
        this._stopLoop();
      } else if (this.frozen && !this.destroyed) {
        this._startLoop();
      }
    }

    async start(hooks = {}) {
      this.hooks = hooks;
      const withSeed = this.opts.withSeed === true;

      if (this.reducedMotion) {
        this._renderStatic();
        if (typeof hooks.onReady === 'function') hooks.onReady();
        return;
      }

      if (withSeed) {
        this._drawSeedScene();
        await this._waitForSeed();
        if (this.destroyed) return;
        await this._shrinkSeed();
        await this._dropSeed();
      } else {
        await this._growGround();
      }

      await this._growBranches();
      await this._bloomHearts();
      if (this.destroyed) return;

      this._freeze();
      if (this.isDesktop) await this._shiftTree();
      if (this.destroyed) return;

      if (typeof hooks.onReady === 'function') hooks.onReady();
      this._startLoop();
    }

    _clear() {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }

    _drawSeedScene() {
      this._clear();
      this.seed.draw();
    }

    _waitForSeed() {
      this.awaitingSeed = true;
      this.canvas.style.cursor = 'pointer';
      return new Promise((resolve) => {
        this.resolveSeed = () => {
          this.resolveSeed = null;
          resolve();
        };
      });
    }

    async _shrinkSeed() {
      while (this.seed.canShrink()) {
        this.seed.shrink();
        this._clear();
        this.seed.drawCircle();
        this.seed.drawHeart();
        await wait(STEP_MS);
      }
    }

    async _dropSeed() {
      while (this.seed.canFall()) {
        this.seed.moveBy(0, 2);
        this._clear();
        this.footer.draw();
        this.seed.drawCircle();
        await wait(STEP_MS);
      }
    }

    async _growGround() {
      while (this.footer.length < this.footer.width) {
        this._clear();
        this.footer.draw();
        await wait(STEP_MS);
      }
    }

    async _growBranches() {
      this.branches = [];
      this._addBranches(this.opts.branch, this.branches);

      while (this.branches.length) {
        const pending = [];
        for (const branch of this.branches) {
          branch.grow();
          if (branch.done) {
            this._addBranches(branch.children, pending);
          } else {
            pending.push(branch);
          }
        }
        this.branches = pending;
        await wait(STEP_MS);
      }
    }

    _addBranches(list, target) {
      for (const data of list) {
        target.push(new Branch(this, data));
      }
    }

    async _bloomHearts() {
      while (this.bloomsCache.length || this.blooms.length) {
        const batch = this.bloomsCache.splice(0, 2);
        this.blooms.push(...batch);
        for (const bloom of this.blooms) bloom.flower();
        this.blooms = this.blooms.filter((bloom) => !bloom.dead);
        await wait(STEP_MS);
      }
    }

    _freeze() {
      const snapshot = document.createElement('canvas');
      snapshot.width = this.canvas.width;
      snapshot.height = this.canvas.height;
      snapshot.getContext('2d').drawImage(this.canvas, 0, 0);
      this.frozen = snapshot;
    }

    _paintTree() {
      this._clear();
      if (this.frozen) {
        this.ctx.drawImage(this.frozen, this.offsetX, 0, this.width, this.height);
      }
    }

    _shiftTree() {
      const target = this.opts.desktopShift || 0;
      if (!target) return Promise.resolve();

      const duration = 720;
      const startTime = performance.now();

      return new Promise((resolve) => {
        const step = (now) => {
          const progress = clamp((now - startTime) / duration, 0, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          this.offsetX = target * eased;
          this._paintTree();
          this.footer.draw();
          if (progress < 1 && !this.destroyed) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(step);
      });
    }

    _startLoop() {
      if (this.rafId) return;
      const step = () => {
        if (this.destroyed) return;
        this._paintTree();

        for (const bloom of this.blooms) bloom.jump();
        this.blooms = this.blooms.filter((bloom) => !bloom.dead);

        this._spawnFallingBlooms();
        this.footer.draw();

        this.rafId = requestAnimationFrame(step);
      };
      this.rafId = requestAnimationFrame(step);
    }

    _stopLoop() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
    }

    _spawnFallingBlooms() {
      if (this.blooms.length >= 3) return;

      const { width, height } = this.bloomOpt;
      const count = randomInt(1, 2);
      for (let i = 0; i < count; i += 1) {
        this.blooms.push(this._randomBloom(width / 2 + width, height, this.bloomOpt.radius, {
          alpha: 1,
          scale: 1,
          place: new Vec(randomInt(-100, 600), 720),
          speed: randomInt(200, 300),
        }));
      }
    }

    _renderStatic() {
      this._clear();

      this.footer.length = this.footer.width;
      this.footer.draw();

      this.branches = [];
      this._addBranches(this.opts.branch, this.branches);

      let guard = 0;
      while (this.branches.length && guard < 500) {
        guard += 1;
        const pending = [];
        for (const branch of this.branches) {
          while (!branch.done) branch.grow();
          this._addBranches(branch.children, pending);
        }
        this.branches = pending;
      }

      for (const bloom of this.bloomsCache) {
        bloom.scale = this.bloomOpt.maxScale;
        bloom.draw();
      }

      this._freeze();
    }

    destroy() {
      this.destroyed = true;
      this._stopLoop();
      this.canvas.removeEventListener('click', this._onClick);
      this.canvas.removeEventListener('pointermove', this._onPointerMove);
      document.removeEventListener('visibilitychange', this._onVisibilityChange);
      global.removeEventListener('resize', this._onResize);
    }
  }

  LOVE.LoveTree = LoveTree;
})(window);
