/* ==========================================================
   Proyección del Mito Personal — Animaciones e Interactividad
   ========================================================== */

(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     Canvas de partículas (polvo de luz / estrellas cayendo)
     ========================================================= */
  const canvas = document.getElementById('dust-canvas');
  const ctx = canvas?.getContext('2d');
  let particles = [];
  let W = 0, H = 0;
  let scrollY = 0;
  let rafId = 0;

  function resizeCanvas() {
    if (!canvas) return;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H - H;
      this.size = Math.random() * 2 + 0.5;
      this.speedY = Math.random() * 0.5 + 0.2;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.6 + 0.1;
      this.hue = 35 + Math.random() * 15; // tonos dorados
    }

    update() {
      this.y += this.speedY + (scrollY * 0.0002); // caen más rápido al scrollear
      this.x += this.speedX + Math.sin(this.y * 0.01) * 0.2;
      
      if (this.y > H + 10) {
        this.y = -10;
        this.x = Math.random() * W;
      }
    }

    draw() {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 60%, 70%, ${this.opacity})`;
      ctx.fill();
    }
  }

  function initParticles() {
    if (!canvas || !ctx) return;
    resizeCanvas();
    particles = [];
    const count = Math.min(80, Math.floor(W / 15));
    for (let i = 0; i < count; i++) {
      const p = new Particle();
      p.y = Math.random() * H; // distribuir inicialmente
      particles.push(p);
    }
  }

  function animateParticles() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    rafId = requestAnimationFrame(animateParticles);
  }

  if (!reduced && canvas) {
    initParticles();
    animateParticles();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', () => {
      scrollY = window.scrollY;
    }, { passive: true });
  }

  /* =========================================================
     GSAP + ScrollTrigger
     ========================================================= */
  if (window.gsap && window.ScrollTrigger && !reduced) {
    gsap.registerPlugin(ScrollTrigger);

    // ----- Hero entrance -----
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .to('#hero-tag', { opacity: 1, y: 0, duration: 1, delay: 0.3 })
      .to('#hero-title', { opacity: 1, y: 0, duration: 1.2 }, '-=0.6')
      .to('#hero-sub', { opacity: 1, y: 0, duration: 1 }, '-=0.7')
      .to('#hero-cta', { opacity: 1, y: 0, duration: 1 }, '-=0.6');

    // Set initial states
    gsap.set('#hero-tag, #hero-title, #hero-sub, #hero-cta', { y: 30 });

    // ----- Capas de descenso -----
    document.querySelectorAll('.descent-layer').forEach(layer => {
      const text = layer.querySelectorAll('h2, p');
      
      gsap.from(text, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: layer,
          start: 'top 75%',
          end: 'bottom 25%',
          toggleActions: 'play none none reverse',
        }
      });
    });

    // ----- Escalera -----
    const steps = document.querySelectorAll('.stair-step');
    steps.forEach((step, i) => {
      gsap.to(step, {
        scaleX: 1,
        opacity: 1,
        duration: 0.6,
        delay: i * 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: step,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        }
      });
    });

    // ----- Llegada (arrival) -----
    gsap.from('#arrival > *', {
      y: 50,
      opacity: 0,
      duration: 1.2,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#arrival',
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      }
    });

    // ----- About section -----
    gsap.from('#about > div', {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#about',
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      }
    });

    // ----- Technique section -----
    gsap.from('#technique > div > *', {
      y: 30,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#technique',
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      }
    });

    // ----- Session cards -----
    gsap.from('#session .grid > div', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#session',
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      }
    });

    // ----- Contact -----
    gsap.from('#contact > *', {
      y: 30,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#contact',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      }
    });

    // ----- Indicador de profundidad -----
    const depthBar = document.getElementById('depth-bar');
    if (depthBar) {
      ScrollTrigger.create({
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          depthBar.style.height = `${self.progress * 100}%`;
        }
      });
    }

    // ----- Parallax sutil en fondos -----
    document.querySelectorAll('.descent-layer').forEach(layer => {
      const bg = layer.querySelector('.absolute');
      if (bg) {
        gsap.to(bg, {
          yPercent: -10,
          ease: 'none',
          scrollTrigger: {
            trigger: layer,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          }
        });
      }
    });

  } else if (reduced) {
    // Modo reducido: mostrar todo sin animaciones
    document.querySelectorAll('.stair-step').forEach(s => {
      s.style.opacity = '1';
      s.style.transform = 'scaleX(1)';
    });
    document.querySelectorAll('#hero-tag, #hero-title, #hero-sub, #hero-cta').forEach(el => {
      el.style.opacity = '1';
    });
  }

  /* =========================================================
     Smooth scroll para anchors
     ========================================================= */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();
