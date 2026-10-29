// Standalone Theme & Receipt Edit Mode Manager
(function () {
  const STORAGE_KEY = 'boa_theme_mode';
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const root = document.documentElement;
  const themeBtns = document.querySelectorAll('[data-theme-mode]');

  let currentMode = localStorage.getItem(STORAGE_KEY) || 'system';

  function applyTheme(mode) {
    currentMode = mode;
    localStorage.setItem(STORAGE_KEY, mode);

    const isDark = mode === 'dark' || (mode === 'system' && mediaQuery.matches);
    root.classList.toggle('dark', isDark);

    themeBtns.forEach((btn) => {
      const active = btn.dataset.themeMode === mode;
      btn.classList.toggle('theme-btn-active', active);
    });
  }

  themeBtns.forEach((btn) => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.themeMode));
  });

  mediaQuery.addEventListener('change', () => {
    if (currentMode === 'system') applyTheme('system');
  });

  applyTheme(currentMode);

  // Direct Receipt Copy Editing Switcher (Locked / Editable)
  const editModeBtns = document.querySelectorAll('[data-edit-mode]');
  const editableNodes = document.querySelectorAll('[data-editable]');

  function setReceiptEditMode(mode) {
    const isEditable = mode === 'editable';
    editableNodes.forEach((node) => {
      node.setAttribute('contenteditable', isEditable ? 'true' : 'false');
    });

    editModeBtns.forEach((btn) => {
      const active = btn.dataset.editMode === mode;
      btn.classList.toggle('theme-btn-active', active);
      btn.classList.toggle('text-[var(--text-muted)]', !active);
    });
  }

  editModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => setReceiptEditMode(btn.dataset.editMode));
  });
})();
