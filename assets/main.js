/* ==========================================================================
   Proyección del Mito Personal — animaciones
   Espirales de partículas (canvas) + reveals al scroll (GSAP)
   ========================================================================== */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lerp = (a, b, t) => a + (b - a) * t;

/* === SpiralCanvas =========================================================
   Espiral arquimediana de partículas. Cada partícula recorre un parámetro
   t ∈ [0, 1]. r crece con t; theta acumula 'turns' vueltas.
   Color: viriditas en el centro (Sí Mismo), violeta en mid, lila en periferia.
   ========================================================================== */
class SpiralCanvas {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = {
      particleCount: options.particleCount ?? 600,
      turns: options.turns ?? 5,
      direction: options.direction ?? 'in', // 'in' = descenso al centro
      speed: options.speed ?? 0.0010,
      glow: options.glow ?? true,
      sizeBase: options.sizeBase ?? 1.6,
      ...options
    };
    this.particles = [];
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.visible = true;
    this.resize();
    this.initParticles();
    window.addEventListener('resize', () => this.resize());

    // Pause when offscreen
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) this.visible = e.isIntersecting;
      }, { threshold: 0 });
      io.observe(canvas);
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width  = Math.max(1, rect.width  * this.dpr);
    this.canvas.height = Math.max(1, rect.height * this.dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
    this.w = rect.width;
    this.h = rect.height;
    this.cx = this.w / 2;
    this.cy = this.h / 2;
    this.maxR = Math.min(this.w, this.h) * 0.46;
  }

  initParticles() {
    const N = this.opts.particleCount;
    this.particles.length = 0;
    for (let i = 0; i < N; i++) {
      this.particles.push({
        t: Math.random(),
        offset: Math.random() * Math.PI * 2,
        speed: this.opts.speed * (0.55 + Math.random() * 0.9)
      });
    }
  }

  colorAt(t) {
    // 0 → viriditas (centro / Sí Mismo)
    // 0.4 → violet
    // 1 → lilac (periferia)
    let R, G, B;
    if (t < 0.4) {
      const lt = t / 0.4;
      R = lerp(91, 107, lt);
      G = lerp(191, 93, lt);
      B = lerp(156, 240, lt);
    } else {
      const lt = (t - 0.4) / 0.6;
      R = lerp(107, 191, lt);
      G = lerp(93,  176, lt);
      B = lerp(240, 255, lt);
    }
    return [R | 0, G | 0, B | 0];
  }

  draw() {
    if (!this.visible) return;
    const { ctx, w, h, cx, cy, maxR } = this;
    ctx.clearRect(0, 0, w, h);

    if (this.opts.glow) {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.65);
      grad.addColorStop(0,   'rgba(107, 93, 240, 0.22)');
      grad.addColorStop(0.5, 'rgba(107, 93, 240, 0.06)');
      grad.addColorStop(1,   'rgba(107, 93, 240, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // small green core glow
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.18);
      coreGrad.addColorStop(0,   'rgba(91, 191, 156, 0.30)');
      coreGrad.addColorStop(1,   'rgba(91, 191, 156, 0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 0, w, h);
    }

    const turns = this.opts.turns;
    const dir = this.opts.direction === 'in' ? -1 : 1;
    const sizeBase = this.opts.sizeBase;

    for (const p of this.particles) {
      p.t += p.speed * dir;
      if (p.t < 0) p.t += 1;
      if (p.t > 1) p.t -= 1;

      const r = maxR * p.t;
      const theta = p.offset + p.t * Math.PI * 2 * turns;
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);

      const [R, G, B] = this.colorAt(p.t);

      // size & alpha: bell shape so center and periphery fade
      const bell = 1 - Math.abs(p.t - 0.55) * 1.7;
      const size = Math.max(0.4, 0.6 + Math.max(0, bell) * sizeBase);
      const alpha = 0.12 + Math.max(0, bell) * 0.7;

      ctx.fillStyle = `rgba(${R}, ${G}, ${B}, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  start() {
    if (reduceMotion) {
      // Static frame: distribute particles evenly across t for a frozen spiral
      this.particles.forEach((p, i) => { p.t = i / this.particles.length; });
      this.draw();
      return;
    }
    const loop = () => {
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}

/* === Boot ================================================================== */
function boot() {
  // Hero spiral
  const heroCanvas = document.querySelector('.spiral--hero');
  if (heroCanvas) {
    const isMobile = window.innerWidth < 720;
    const hero = new SpiralCanvas(heroCanvas, {
      particleCount: isMobile ? 380 : 700,
      turns: 5,
      direction: 'in',
      speed: 0.00085,
      sizeBase: 1.8
    });
    hero.start();
  }

  // Movement spirals
  document.querySelectorAll('.spiral--movement').forEach((c) => {
    const turns = parseInt(c.dataset.turns || '3', 10);
    const direction = c.dataset.direction || 'in';
    const sp = new SpiralCanvas(c, {
      particleCount: 130,
      turns,
      direction,
      speed: 0.0017,
      glow: false,
      sizeBase: 1.0
    });
    sp.start();
  });

  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  if (reduceMotion) return;

  // Hero entrance
  gsap.from('.hero__content > *', {
    opacity: 0,
    y: 18,
    duration: 1.1,
    ease: 'power2.out',
    stagger: 0.14,
    delay: 0.25
  });

  // Reveal each section's children on scroll
  gsap.utils.toArray('.section').forEach((section) => {
    const targets = section.querySelectorAll(
      '.eyebrow, .section__title, .section__lede, .prose, .movements, .voices, .effects, .prose--coda, .bio, .videos, .cta__title, .cta__lede, .cta__actions'
    );
    if (!targets.length) return;
    gsap.from(targets, {
      opacity: 0,
      y: 26,
      duration: 0.95,
      ease: 'power2.out',
      stagger: 0.07,
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        once: true
      }
    });
  });

  // Movements: stagger cards
  gsap.from('.movement', {
    opacity: 0,
    y: 32,
    duration: 0.95,
    ease: 'power2.out',
    stagger: 0.18,
    scrollTrigger: {
      trigger: '.section--movements',
      start: 'top 70%',
      once: true
    }
  });

  // Voices: subtle stagger
  gsap.from('.voice', {
    opacity: 0,
    y: 24,
    duration: 0.85,
    ease: 'power2.out',
    stagger: 0.12,
    scrollTrigger: {
      trigger: '.section--lineage .voices',
      start: 'top 78%',
      once: true
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
