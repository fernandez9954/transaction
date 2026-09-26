/**
 * Shared Theme Manager & Floating Drop-up Switcher
 * Automatically manages light/dark/system modes across all pages.
 */
(function () {
  const THEME_KEY = 'app-theme';
  const themeMql = window.matchMedia('(prefers-color-scheme: dark)');
  let elements = null;

  // 1. Instant execution to eliminate flash of light/dark mode
  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || 'system';
  }

  function resolveEffectiveTheme(theme) {
    if (theme === 'system') {
      return themeMql.matches ? 'dark' : 'light';
    }
    return theme;
  }

  function applyTheme(theme, save = true) {
    if (save) {
      localStorage.setItem(THEME_KEY, theme);
    }
    const effective = resolveEffectiveTheme(theme);
    document.documentElement.setAttribute('data-theme', effective);
    if (elements) {
      updateUI(theme);
    }
  }

  // Apply immediately before HTML renders
  applyTheme(getStoredTheme(), false);

  // React to OS dark/light mode toggle when on 'system'
  themeMql.addEventListener('change', () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system', false);
    }
  });

  // Sync across open browser tabs & windows
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY) {
      applyTheme(e.newValue || 'system', false);
    }
  });

  // SVG Icons
  const ICONS = {
    light: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    dark: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    system: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
  };

  // Self-contained CSS styles for the drop-up
  const STYLES = `
    .theme-dropup-container {
      position: fixed;
      top: 20px;
      top: max(20px, env(safe-area-inset-bottom, 20px));
      right: 20px;
      right: max(20px, env(safe-area-inset-right, 20px));
      z-index: 10000;
      user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .theme-toggle-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 1px solid rgba(0, 0, 0, 0.12);
      background: rgba(255, 255, 255, 0.92);
      color: #0f172a;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
      outline: none;
      padding: 0;
      margin: 0;
      -webkit-tap-highlight-color: transparent;
    }
    .theme-toggle-btn:hover {
      transform: scale(1.06);
    }
    .theme-toggle-btn:active {
      transform: scale(0.94);
    }
    [data-theme="dark"] .theme-toggle-btn {
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(19, 26, 41, 0.92);
      color: #f8fafc;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    }
    .theme-menu {
      position: absolute;
      top: 54px;
      right: 0;
      min-width: 145px;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 14px;
      padding: 6px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      display: flex;
      flex-direction: column;
      gap: 2px;
      opacity: 0;
      transform: translateY(8px) scale(0.95);
      transform-origin: bottom right;
      pointer-events: none;
      transition: opacity 0.16s ease, transform 0.16s ease;
    }
    [data-theme="dark"] .theme-menu {
      background: rgba(19, 26, 41, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
    }
    .theme-menu.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    .theme-menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 12px;
      font-size: 13px;
      font-weight: 500;
      color: #475569;
      border-radius: 9px;
      cursor: pointer;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      transition: background 0.15s ease, color 0.15s ease;
      outline: none;
      font-family: inherit;
    }
    [data-theme="dark"] .theme-menu-item {
      color: #94a3b8;
    }
    .theme-menu-item:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #0f172a;
    }
    [data-theme="dark"] .theme-menu-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #f8fafc;
    }
    .theme-menu-item.active {
      font-weight: 600;
      color: #0058bc;
      background: rgba(0, 88, 188, 0.08);
    }
    [data-theme="dark"] .theme-menu-item.active {
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
    }
    .theme-menu-item-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .theme-check-icon {
      opacity: 0;
      display: flex;
      align-items: center;
      transition: opacity 0.15s ease;
    }
    .theme-menu-item.active .theme-check-icon {
      opacity: 1;
    }
  `;

  function updateUI(theme) {
    if (!elements) return;
    const { triggerBtn, menu } = elements;

    // Update floating button icon
    triggerBtn.innerHTML = ICONS[theme] || ICONS.system;
    triggerBtn.setAttribute('title', `Appearance: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`);
    triggerBtn.setAttribute('aria-label', `Toggle appearance mode, currently ${theme}`);

    // Update active checkmarks in menu
    menu.querySelectorAll('.theme-menu-item').forEach((item) => {
      const isCurrent = item.dataset.themeVal === theme;
      item.classList.toggle('active', isCurrent);
      item.setAttribute('aria-checked', isCurrent ? 'true' : 'false');
    });
  }

  function initComponent() {
    if (document.querySelector('.theme-dropup-container')) return;

    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.id = 'theme-switcher-styles';
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);

    // Create container
    const container = document.createElement('div');
    container.className = 'theme-dropup-container';

    // Create drop-up menu
    const menu = document.createElement('div');
    menu.className = 'theme-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Appearance Mode');

    const options = [
      { id: 'light', label: 'Light', icon: ICONS.light },
      { id: 'dark', label: 'Dark', icon: ICONS.dark },
      { id: 'system', label: 'System', icon: ICONS.system }
    ];

    menu.innerHTML = options
      .map(
        (opt) => `
        <button type="button" class="theme-menu-item" data-theme-val="${opt.id}" role="menuitemradio" aria-checked="false">
          <span class="theme-menu-item-left">
            ${opt.icon}
            <span>${opt.label}</span>
          </span>
          <span class="theme-check-icon">${ICONS.check}</span>
        </button>
      `
      )
      .join('');

    // Create floating trigger button (44x44 circle)
    const triggerBtn = document.createElement('button');
    triggerBtn.type = 'button';
    triggerBtn.className = 'theme-toggle-btn';
    triggerBtn.setAttribute('aria-haspopup', 'true');
    triggerBtn.setAttribute('aria-expanded', 'false');

    container.appendChild(menu);
    container.appendChild(triggerBtn);
    document.body.appendChild(container);

    elements = { container, triggerBtn, menu };

    // Toggle menu visibility
    function toggleMenu(show) {
      const willOpen = typeof show === 'boolean' ? show : !menu.classList.contains('open');
      menu.classList.toggle('open', willOpen);
      triggerBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }

    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Option clicks
    menu.querySelectorAll('.theme-menu-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        applyTheme(btn.dataset.themeVal);
        toggleMenu(false);
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        toggleMenu(false);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleMenu(false);
      }
    });

    // Set initial icon and states
    updateUI(getStoredTheme());
  }

  // Mount as soon as DOM is interactive
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComponent);
  } else {
    initComponent();
  }

  // Expose global helper if any inline scripts want it
  window.applyTheme = applyTheme;
})();
