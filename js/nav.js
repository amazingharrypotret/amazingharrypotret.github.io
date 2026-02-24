/* =============================================
   NAV.JS — Navigation, Scroll, Mobile Menu
   ============================================= */

(function() {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');

  // Scroll-based nav styling
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  // Mobile menu toggle
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll('.nav-mobile a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
    });
  });

  // Active nav link based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();


/* =============================================
   ANIMATIONS.JS — Intersection Observer AOS
   ============================================= */

(function() {
  // Simple AOS (Animate On Scroll) implementation
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('aos-animate');
        // Animate skill bars when visible
        const bars = entry.target.querySelectorAll('.skill-bar-fill');
        bars.forEach(bar => bar.classList.add('animated'));
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

  // Page entrance animation
  document.body.classList.add('page-transition');

  // Animate counters
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1500;
    const start = performance.now();
    const suffix = el.dataset.suffix || '';

    function update(t) {
      const elapsed = t - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.count-up').forEach(el => counterObserver.observe(el));
})();


/* =============================================
   TYPEWRITER.JS — Hero typewriter effect
   ============================================= */

function initTypewriter(el, phrases, speed = 80) {
  if (!el) return;

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const pauseDuration = 2200;
  const deleteSpeed = 40;

  function tick() {
    const phrase = phrases[phraseIndex];

    if (isDeleting) {
      el.textContent = phrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = phrase.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? deleteSpeed : speed;

    if (!isDeleting && charIndex === phrase.length) {
      delay = pauseDuration;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 400;
    }

    setTimeout(tick, delay);
  }

  setTimeout(tick, 600);
}
