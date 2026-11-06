/**
 * i18n.js
 * Carga es.json / en.json y reemplaza el texto de cualquier elemento
 * que tenga data-i18n="clave.anidada". Funciona igual en cualquier página
 * del sitio siempre que incluyas este script y llames a initI18n().
 *
 * Nota: requiere servir el sitio por http(s) (GitHub Pages, o un servidor
 * local como `python3 -m http.server`). Abrir el .html directo con doble
 * clic (file://) bloquea el fetch() por CORS.
 */

const SUPPORTED_LANGS = ['es', 'en'];
const DEFAULT_LANG = 'es';
const LANG_STORAGE_KEY = 'anv-portfolio-lang';

// Resuelve una ruta tipo "hero.p1" dentro de un objeto anidado
function resolveKey(obj, path) {
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

function getStoredLang() {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return SUPPORTED_LANGS.includes(stored) ? stored : DEFAULT_LANG;
}

function setStoredLang(lang) {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
}

async function loadDictionary(lang) {
  const basePath = document.documentElement.dataset.assetsBase || 'assets';
  const res = await fetch(`${basePath}/lang/${lang}.json`);
  if (!res.ok) throw new Error(`No se pudo cargar ${lang}.json`);
  return res.json();
}

function renderTrayectoria(dict) {
  const list = document.getElementById('trayectoria-list');
  if (!list) return;
  const items = dict?.perfil?.trayectoria?.items;
  if (!Array.isArray(items)) return;

  list.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'trayectoria-item';
    li.innerHTML = `
      <span class="trayectoria-date">${item.date}</span>
      <div class="trayectoria-body">
        <p class="trayectoria-title">${item.title} <span class="trayectoria-org">— ${item.org}</span></p>
        <p class="trayectoria-desc">${item.desc}</p>
      </div>
    `;
    list.appendChild(li);
  });
}

function applyDictionary(dict) {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = resolveKey(dict, key);
    if (value !== undefined) {
      el.textContent = value;
    }
  });

  // Para atributos (placeholder, aria-label, title, alt) usa data-i18n-attr="attr:clave"
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const pairs = el.getAttribute('data-i18n-attr').split(',');
    pairs.forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      const value = resolveKey(dict, key);
      if (value !== undefined) el.setAttribute(attr, value);
    });
  });

  renderTrayectoria(dict);
}

function updateLangSwitcherUI(lang) {
  document.querySelectorAll('[data-lang-option]').forEach((btn) => {
    const isActive = btn.getAttribute('data-lang-option') === lang;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
  document.documentElement.setAttribute('lang', lang);
}

async function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
  try {
    const dict = await loadDictionary(lang);
    applyDictionary(dict);
    updateLangSwitcherUI(lang);
    setStoredLang(lang);
    document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang } }));
  } catch (err) {
    console.error('i18n error:', err);
  }
}

function initI18n() {
  const initialLang = getStoredLang();

  document.querySelectorAll('[data-lang-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang-option');
      setLanguage(lang);
    });
  });

  setLanguage(initialLang);
}

document.addEventListener('DOMContentLoaded', initI18n);
