import { Users } from 'lucide-react';
import TemplatePage from './TemplatePage';

// ============================================================
// 🎯 MODULE CONFIG
// ============================================================
export const config = {
  path: '/template',              // URL
  key: 'template',                // Translation key
  icon: Users,                    // Lucide icon
  order: 100,                     // Menu ဘယ်နေရာ (optional)
  protected: true,                // Login လိုအပ်လား
  translations: {
    mm: { template: 'နမူနာ Module' },
    en: { template: 'Template Module' },
  },
};

export const Page = TemplatePage;
export default config;