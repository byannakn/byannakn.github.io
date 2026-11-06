/**
 * main.js — comportamiento compartido del sitio
 *  1) Ventana de Proyectos (index.html#proyectos) con enlace directo compartible
 *  2) Menú lateral de contenido + resaltado de sección en páginas de proyecto
 *  3) Ampliar imágenes (lightbox) en páginas de proyecto
 * Cada bloque se activa solo si los elementos existen en la página.
 */

/* ------------------------------------------------------------------ */
/* 1) Modal de Proyectos                                               */
/* ------------------------------------------------------------------ */
(function initProjectsModal() {
  const modal = document.getElementById('projects-modal');
  if (!modal) return;

  const HASH = '#proyectos';
  let openedByNavigation = false; // true si el usuario llegó aquí haciendo clic dentro del sitio
  let lastFocus = null;

  const ghosts = modal.querySelectorAll('.pm-ghosts img');
  const grid = modal.querySelector('.pm-grid');

  function setGhost(name) {
    ghosts.forEach((img) => img.classList.toggle('is-active', img.dataset.ghost === name));
  }

  function openModal() {
    if (modal.open) return;
    lastFocus = document.activeElement;
    modal.showModal();
    document.documentElement.classList.add('modal-open');
  }

  function syncWithHash() {
    if (location.hash === HASH) openModal();
    else if (modal.open) modal.close();
  }

  // Al cerrar (X, Esc, clic fuera o botón "atrás") limpiamos la URL y devolvemos el foco
  modal.addEventListener('close', () => {
    document.documentElement.classList.remove('modal-open');
    setGhost(null);
    if (location.hash === HASH) {
      if (openedByNavigation) {
        openedByNavigation = false;
        history.back();
      } else {
        history.replaceState(null, '', location.pathname + location.search);
      }
    }
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  });

  // Clic en el fondo oscuro (fuera del panel) cierra
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });

  modal.querySelector('.pm-close')?.addEventListener('click', () => modal.close());

  // Cualquier enlace a #proyectos dentro de esta página abre la ventana
  document.querySelectorAll('a[href="#proyectos"]').forEach((a) => {
    a.addEventListener('click', () => { openedByNavigation = true; });
  });

  window.addEventListener('hashchange', syncWithHash);
  syncWithHash(); // si la página se abre ya con #proyectos

  // Imagen de fondo según la tarjeta con cursor o foco
  if (grid) {
    const ghostOf = (el) => el.closest('[data-ghost]')?.dataset.ghost || null;
    grid.addEventListener('mouseover', (e) => setGhost(ghostOf(e.target)));
    grid.addEventListener('focusin', (e) => setGhost(ghostOf(e.target)));
    grid.addEventListener('mouseleave', () => setGhost(null));
    grid.addEventListener('focusout', () => setGhost(null));
  }
})();

/* ------------------------------------------------------------------ */
/* 2) Menú lateral y resaltado de sección (páginas de proyecto)        */
/* ------------------------------------------------------------------ */
(function initProjectToc() {
  const tocList = document.getElementById('project-toc-list');
  const sections = Array.from(document.querySelectorAll('section[data-toc]'));
  if (!tocList || !sections.length) return;

  let observer = null;

  function buildToc() {
    tocList.innerHTML = '';
    sections.forEach((section) => {
      const heading = section.querySelector('h2');
      if (!heading) return;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + section.id;
      a.textContent = heading.textContent;
      li.appendChild(a);
      tocList.appendChild(li);
    });
    setupSpy();
  }

  function setupSpy() {
    if (observer) observer.disconnect();
    const links = new Map(
      Array.from(tocList.querySelectorAll('a')).map((a) => [a.getAttribute('href').slice(1), a])
    );
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.remove('is-current'));
            links.get(entry.target.id)?.classList.add('is-current');
          }
        });
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
  }

  // Los títulos cambian con el idioma: reconstruimos el menú cada vez
  document.addEventListener('i18n:applied', buildToc);
  buildToc();
})();

/* ------------------------------------------------------------------ */
/* 3) Lightbox para ampliar imágenes                                   */
/* ------------------------------------------------------------------ */
(function initLightbox() {
  const box = document.getElementById('lightbox');
  if (!box) return;
  const img = box.querySelector('img');
  const closeBtn = box.querySelector('.lightbox-close');

  // El texto alternativo de cada imagen es su pie de foto (cambia con el idioma)
  function syncAlts() {
    document.querySelectorAll('figure.shot').forEach((fig) => {
      const caption = fig.querySelector('figcaption')?.textContent?.trim();
      const image = fig.querySelector('img');
      if (caption && image) image.alt = caption;
    });
  }
  document.addEventListener('i18n:applied', syncAlts);
  syncAlts();

  document.querySelectorAll('.shot-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const thumb = btn.querySelector('img');
      img.src = btn.dataset.full || thumb.src;
      img.alt = thumb.alt;
      box.showModal();
    });
  });

  closeBtn?.addEventListener('click', () => box.close());
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
})();
