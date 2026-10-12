// ============================================================
// 🎯 AUTO-DISCOVER MODULES
// ============================================================
// Module အသစ်ထည့်ရင် src/modules/[name]/index.jsx ဆောက်ရုံပဲ
// ဒီ File ကို လုံးဝ မထိရတော့ဘူး
// ============================================================

// Vite က အားလုံး Auto-Import လုပ်ပေးတယ်
const moduleFiles = import.meta.glob('../modules/*/index.jsx', { eager: true });

export const MODULES = Object.entries(moduleFiles)
  .map(([path, mod]) => {
    const name = path.split('/')[2];
    return {
      name,
      ...(mod.config || {}),
      component: mod.Page,
    };
  })
  .filter(m => m.path && m.component)
  .sort((a, b) => (a.order || 999) - (b.order || 999));

// ============================================================
// 🎯 Export for Layout.jsx
// ============================================================
export const MENU_ITEMS = MODULES.map(m => ({
  path: m.path,
  key: m.key || m.name,
  icon: m.icon,
}));

// ============================================================
// 🎯 Export for App.jsx
// ============================================================
export const getRouteElements = () => MODULES.map(m => ({
  path: m.path,
  component: m.component,
  protected: m.protected !== false,
}));

// ============================================================
// 🎯 Export Module Translations
// ============================================================
export const getModuleTranslations = (lang) => {
  const result = {};
  MODULES.forEach(m => {
    if (m.translations && m.translations[lang]) {
      Object.assign(result, m.translations[lang]);
    }
  });
  return result;
};