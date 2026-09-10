import React from 'react';
import { ArrowLeft, ExternalLink, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { HikingArticle, PolicyItem } from '../types.ts';

interface ArticleReaderProps {
  article: HikingArticle | PolicyItem;
  parentName: string;
  parentView: string;
  onBack: () => void;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({
  article,
  parentName,
  onBack,
}) => {
  const isHikingArticle = 'category' in article;
  const hikingArt = isHikingArticle ? (article as HikingArticle) : null;
  const policyArt = !isHikingArticle ? (article as PolicyItem) : null;

  return (
    <div className="py-8 sm:py-12 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Hierarchical Breadcrumbs & Back Action */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-neutral-800">
        <button
          id="article-back-hierarchical-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs sm:text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>回到上一頁（{parentName}）</span>
        </button>

        <div className="text-xs text-neutral-500 font-mono hidden sm:block">
          首頁 &gt; {parentName} &gt; 專文詳情
        </div>
      </div>

      {/* Article Content Container */}
      <article className="bg-neutral-900/70 border border-neutral-800/90 rounded-2xl p-6 sm:p-10">
        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          {hikingArt && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium">
              <Tag className="w-3 h-3" />
              {hikingArt.category}
            </span>
          )}
          {policyArt && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              官方規章
            </span>
          )}
          {article.updatedAt && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-neutral-400 font-mono">
              <Calendar className="w-3 h-3 text-neutral-500" />
              修訂日期：{article.updatedAt}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-wide leading-snug mb-6">
          {article.title}
        </h1>

        {/* Summary block if present */}
        {hikingArt && hikingArt.summary && (
          <div className="mb-8 p-4 rounded-xl bg-neutral-950/80 border-l-4 border-emerald-600 text-sm text-neutral-300 leading-relaxed">
            {hikingArt.summary}
          </div>
        )}

        {/* External Link Option if available */}
        {hikingArt && hikingArt.url && (
          <div className="mb-6">
            <a
              href={hikingArt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
            >
              <span>前往關聯參考網址／線上系統</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Markdown-style Clean Content Rendering */}
        <div className="text-neutral-300 leading-relaxed space-y-4 text-sm sm:text-base whitespace-pre-line border-t border-neutral-800/80 pt-6">
          {article.content}
        </div>
      </article>

      {/* Bottom Back Button */}
      <div className="mt-8 text-center">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>返回 {parentName} 清單</span>
        </button>
      </div>
    </div>
  );
};
