import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../i18n/translations';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, 
  Calendar, FileText, DollarSign, Settings as SettingsIcon, 
  LogOut, School, Menu, BarChart3, CreditCard, ClipboardList,
  Library as LibraryIcon, Clock, Bell, Award, Shield, CalendarOff,
  Bus, Info
} from 'lucide-react';
import { useState, useEffect } from 'react';
import API from '../api/axios';
import LanguageSwitcher from './LanguageSwitcher';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    API.get('/settings')
      .then(r => setSettings(r.data))
      .catch(console.error);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
    { path: '/students', key: 'students', icon: Users },
    { path: '/teachers', key: 'teachers', icon: GraduationCap },
    { path: '/classes', key: 'classes', icon: BookOpen },
    { path: '/timetable', key: 'timetable', icon: Clock },
    { path: '/attendance', key: 'attendance', icon: Calendar },
    { path: '/exams', key: 'exams', icon: FileText },
    { path: '/report-cards', key: 'report_cards', icon: Award },
    { path: '/fees', key: 'fees', icon: DollarSign },
    { path: '/library', key: 'library', icon: LibraryIcon },
    { path: '/cards', key: 'cards', icon: CreditCard },
    { path: '/proposals', key: 'proposals', icon: ClipboardList },
    { path: '/announcements', key: 'announcements', icon: Bell },
    { path: '/reports', key: 'reports', icon: BarChart3 },
    { path: '/users', key: 'users', icon: Shield },
    { path: '/leaves', key: 'leaves', icon: CalendarOff },
    { path: '/transport', key: 'transport', icon: Bus },
    { path: '/about', key: 'about', icon: Info },
    { path: '/settings', key: 'settings', icon: SettingsIcon },
  ];

  const schoolName = settings.school_name || 'MGT School';
  const schoolNameEn = settings.school_name_en || 'Management';
  const logo = settings.school_logo;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col no-print`}>
        <div className="p-4 flex items-center gap-3 border-b border-slate-700">
          {logo ? (
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 shrink-0" />
          ) : (
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
              <School className="w-6 h-6" />
            </div>
          )}
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sm truncate">{schoolName}</h1>
              <p className="text-xs text-slate-400 truncate">{schoolNameEn}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}>
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="text-sm">{t(item.key)}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-700 space-y-2">
          {sidebarOpen ? (
            <LanguageSwitcher compact />
          ) : (
            <div className="flex justify-center">
              <LanguageSwitcher compact />
            </div>
          )}

          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition w-full">
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm">{t('logout')}</span>}
          </button>

          {sidebarOpen && (
            <div className="text-center pt-2 border-t border-slate-800">
              <p className="text-[10px] text-slate-500 font-mono">{t('app_version')}</p>
              <p className="text-[10px] text-slate-600">
                {t('developed_by')} <span className="text-blue-400 font-bold">John Alex</span>
              </p>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center no-print">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">
              {menuItems.find(m => m.path === location.pathname)
                ? t(menuItems.find(m => m.path === location.pathname).key)
                : schoolName}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}