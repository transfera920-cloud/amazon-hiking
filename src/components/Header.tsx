import React from 'react';
import { SiteInfo } from '../types.ts';
import {
  ShieldCheck,
  Calendar,
  Compass,
  Wrench,
  Video,
  ClipboardList,
  BookOpen,
  MapPin,
  Settings,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  siteInfo: SiteInfo;
  currentView: string;
  onNavigate: (view: string, targetSectionId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ siteInfo, currentView, onNavigate }) => {
  const navItems = [
    {
      id: 'home',
      label: '活動行事曆',
      icon: Calendar,
      isExternal: false,
      onClick: () => onNavigate('home'),
    },
    {
      id: 'recent_activities',
      label: '近期活動',
      icon: Compass,
      isExternal: true,
      onClick: () =>
        window.open(
          siteInfo.recentActivitiesUrl || 'https://amazon-trail.ai.studio/activity/',
          '_blank'
        ),
    },
    {
      id: 'basics',
      label: '登山入門',
      icon: BookOpen,
      isExternal: false,
      onClick: () => onNavigate('basics'),
    },
    {
      id: 'tools',
      label: '登山工具',
      icon: Wrench,
      isExternal: false,
      onClick: () => onNavigate('tools'),
    },
    {
      id: 'highlights',
      label: '活動花絮',
      icon: Video,
      isExternal: false,
      onClick: () => onNavigate('highlights'),
    },
    {
      id: 'surveys',
      label: '問卷調查',
      icon: ClipboardList,
      isExternal: false,
      onClick: () => onNavigate('surveys'),
    },
    {
      id: 'policies',
      label: '政策與條款',
      icon: ShieldCheck,
      isExternal: false,
      onClick: () => onNavigate('policies'),
    },
    {
      id: 'routes',
      label: '行程總表',
      icon: MapPin,
      isExternal: true,
      onClick: () =>
        window.open(siteInfo.routesUrl || 'https://amazon-data.ai.studio/routes', '_blank'),
    },
  ];

  return (
    <header className="w-full border-b border-neutral-800/80 bg-neutral-950/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      {/* Top Brand & Legal Identity Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-3">
          {/* Main Association Brand Entity */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <a
                id="brand-home-link"
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group focus:outline-none"
                title="回到首頁"
              >
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wider text-neutral-100 group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                  {siteInfo.name || '亞馬遜國家山岳協會'}
                </h1>
              </a>
              <span className="text-xs font-semibold tracking-wider text-emerald-500/90 uppercase font-mono">
                {siteInfo.englishName || 'Amazon Alpine Association'}
              </span>
            </div>

            {/* Registration / Legal Authority & Purpose in Compact Format */}
            <div className="flex flex-wrap items-center gap-x-2 text-[11px] sm:text-xs text-neutral-400 mt-1">
              <div className="flex items-center gap-1 text-neutral-300 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{siteInfo.registrationInfo || '社團法人 · 台內團自第1130008137號'}</span>
              </div>
              <span className="text-neutral-600 hidden sm:inline">|</span>
              <span className="text-neutral-400 truncate max-w-xl">
                {siteInfo.purpose ||
                  '提倡全民運動、鍛鍊強健體魄、培養互助團隊精神，接觸大自然與教育山林技能。'}
              </span>
            </div>
          </div>

          {/* Quick Access Actions */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <a
              id="header-line-consult-btn"
              href={siteInfo.lineConsultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/70 transition-colors shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LINE 官方諮詢</span>
            </a>

            <button
              id="header-admin-nav-btn"
              onClick={() => onNavigate('admin')}
              className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                currentView === 'admin'
                  ? 'bg-neutral-800 text-emerald-400 border-emerald-600'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border-neutral-800 hover:border-neutral-700'
              }`}
              title="後台管理系統"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>管理後台</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar (Directly connects to respective areas) */}
      <nav className="border-t border-neutral-800/70 bg-neutral-900/80 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-1 min-w-max text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-emerald-900/80 text-emerald-200 font-semibold border border-emerald-700/80 shadow-sm'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-300' : 'text-emerald-500'}`} />
                <span>{item.label}</span>
                {item.isExternal && <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
