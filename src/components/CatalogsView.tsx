import React, { useState } from 'react';
import { HikingArticle, HighlightVideo, PolicyItem, SurveyItem } from '../types.ts';
import {
  ArrowLeft,
  BookOpen,
  Wrench,
  Video,
  ExternalLink,
  ArrowRight,
  BookMarked,
  Tag,
  Search,
  Compass,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';

// ==========================================
// 1. 登山入門專區 (Dedicated Hiking Basics)
// ==========================================
interface BasicsCatalogProps {
  articles: HikingArticle[];
  onBack: () => void;
  onReadArticle: (article: HikingArticle, parentTitle: string) => void;
}

export const HikingBasicsCatalog: React.FC<BasicsCatalogProps> = ({
  articles,
  onBack,
  onReadArticle,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeArticles = articles
    .filter((a) => a.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const categories = ['all', ...Array.from(new Set(activeArticles.map((a) => a.category).filter(Boolean)))];

  const filtered = activeArticles.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchQuery =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQuery;
  });

  return (
    <div className="py-6 sm:py-8 max-w-6xl mx-auto">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-neutral-800 gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs sm:text-sm font-medium transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>回到首頁</span>
        </button>

        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
            登山入門專文專區
          </h1>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-800 text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              {cat === 'all' ? '全部專文' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋專文標題或關鍵字..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between hover:border-emerald-800/80 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-emerald-400 font-medium">
                  {item.category}
                </span>
                <span className="text-neutral-500 font-mono text-[11px]">
                  {item.updatedAt}
                </span>
              </div>
              <h3 className="text-base font-bold text-neutral-100 mb-2 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3 mb-4">
                {item.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              {item.displayMode === 'link' && item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  <span>前往外部連結</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={() => onReadArticle(item, '登山入門')}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium py-1 group"
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>閱讀完整專文</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {item.url && item.displayMode !== 'link' && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-neutral-500 hover:text-neutral-300 inline-flex items-center gap-1"
                >
                  <span>參考連結</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 2. 登山工具專區 (Dedicated Hiking Tools)
// ==========================================
interface ToolsCatalogProps {
  tools: HikingArticle[];
  onBack: () => void;
  onReadArticle: (article: HikingArticle, parentTitle: string) => void;
}

export const HikingToolsCatalog: React.FC<ToolsCatalogProps> = ({
  tools,
  onBack,
  onReadArticle,
}) => {
  const activeTools = tools
    .filter((t) => t.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="py-6 sm:py-8 max-w-6xl mx-auto">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-neutral-800 gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs sm:text-sm font-medium transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>回到首頁</span>
        </button>

        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
            登山工具與線上資源專區
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTools.map((tool) => (
          <div
            key={tool.id}
            className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between hover:border-emerald-800/80 transition-colors"
          >
            <div>
              <span className="inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 mb-2">
                {tool.category}
              </span>
              <h3 className="font-bold text-base text-neutral-100 mb-2 leading-snug">
                {tool.title}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3 mb-4">
                {tool.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-2">
              {tool.url && (
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 text-xs font-medium transition-colors"
                >
                  <span>開啟系統／下載</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {tool.content && (
                <button
                  onClick={() => onReadArticle(tool, '登山工具')}
                  className="w-full inline-flex items-center justify-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 py-1 transition-colors"
                >
                  <span>查看使用指南</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 3. 活動花絮影音專區 (Dedicated Highlights)
// ==========================================
interface HighlightsCatalogProps {
  highlights: HighlightVideo[];
  onBack: () => void;
}

export const HighlightsCatalog: React.FC<HighlightsCatalogProps> = ({
  highlights,
  onBack,
}) => {
  const activeHighlights = highlights
    .filter((h) => h.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="py-6 sm:py-8 max-w-6xl mx-auto">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-neutral-800 gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs sm:text-sm font-medium transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>回到首頁</span>
        </button>

        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
            活動花絮影音專區
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeHighlights.map((hl) => (
          <div
            key={hl.id}
            className="bg-neutral-900/80 border border-neutral-800 rounded-xl overflow-hidden flex flex-col"
          >
            {/* Native YouTube Player */}
            <div className="relative aspect-video w-full bg-black">
              {hl.videoId ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${hl.videoId}`}
                  title={hl.title || '活動影片花絮'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                  無效的 YouTube 連結
                </div>
              )}
            </div>

            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <h3 className="font-semibold text-sm text-neutral-200 line-clamp-1 mb-2">
                {hl.title || '活動花絮影片'}
              </h3>
              <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                <span>{hl.addedAt}</span>
                <a
                  href={hl.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>YouTube 開啟</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 4. 問卷調查專區 (Dedicated Surveys Catalog)
// ==========================================
interface SurveysCatalogProps {
  surveys: SurveyItem[];
  onBack: () => void;
}

export const SurveysCatalog: React.FC<SurveysCatalogProps> = ({
  surveys,
  onBack,
}) => {
  const activeSurveys = surveys
    .filter((s) => s.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="py-3 sm:py-4 max-w-5xl mx-auto">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-neutral-800 gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs sm:text-sm font-medium transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>回到首頁</span>
        </button>

        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
            問卷調查與意見回饋專區
          </h1>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-neutral-400 mb-5 max-w-3xl">
        亞馬遜國家山岳協會重視每位山友的寶貴意見與安全體驗，請點選下方問卷進行回饋，協助我們持續提升行程品質與山岳守護能量。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeSurveys.map((sv) => (
          <div
            key={sv.id}
            className="p-5 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-emerald-700/80 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-mono text-emerald-400">官方問卷</span>
              </div>
              <h3 className="text-base font-bold text-neutral-100 mb-2">
                {sv.title}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {sv.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-end">
              <a
                href={sv.googleFormsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow transition-colors"
              >
                <span>前往填寫問卷 (Google Forms)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 5. 政策與條款專區 (Dedicated Policies Catalog)
// ==========================================
interface PoliciesCatalogProps {
  policies: PolicyItem[];
  onBack: () => void;
  onReadPolicy: (policy: PolicyItem) => void;
}

export const PoliciesCatalog: React.FC<PoliciesCatalogProps> = ({
  policies,
  onBack,
  onReadPolicy,
}) => {
  const activePolicies = policies
    .filter((p) => p.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="py-3 sm:py-4 max-w-5xl mx-auto">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-neutral-800 gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs sm:text-sm font-medium transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>回到首頁</span>
        </button>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
            政策與條款規範專區
          </h1>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-neutral-400 mb-5 max-w-3xl">
        本會依政府立案法人規章制定高山活動安全規範、費用與退費辦法、以及個資保護聲明，保障全體山友之合法權益與高山活動最高安全標準。
      </p>

      <div className="space-y-3">
        {activePolicies.map((pl) => (
          <div
            key={pl.id}
            className="p-4 sm:p-5 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-emerald-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 font-medium">章程條款</span>
                <span className="text-neutral-600">·</span>
                <span className="text-[11px] font-mono text-neutral-500">最後更新：{pl.updatedAt}</span>
              </div>
              <h3 className="text-base font-bold text-neutral-100">
                {pl.title}
              </h3>
              <p className="text-xs text-neutral-400 line-clamp-2 max-w-2xl">
                {pl.content.replace(/[#*`_]/g, '').slice(0, 140)}...
              </p>
            </div>

            <button
              onClick={() => onReadPolicy(pl)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-emerald-800 text-neutral-200 hover:text-white border border-neutral-700 hover:border-emerald-600 text-xs font-semibold transition-colors shrink-0 self-start sm:self-center"
            >
              <span>閱讀章程全文</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

