import React, { useState, useEffect, useCallback } from 'react';
import { SiteDatabase, HikingArticle, PolicyItem } from './types.ts';
import { fetchSiteData, verifyAdminSession } from './lib/api.ts';
import { INITIAL_DATABASE } from './data/initialData.ts';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { SectionsView } from './components/SectionsView.tsx';
import { ArticleReader } from './components/ArticleReader.tsx';
import {
  HikingBasicsCatalog,
  HikingToolsCatalog,
  HighlightsCatalog,
  SurveysCatalog,
  PoliciesCatalog,
} from './components/CatalogsView.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface NavigationEntry {
  view:
    | 'home'
    | 'reader'
    | 'admin'
    | 'basics'
    | 'tools'
    | 'highlights'
    | 'surveys'
    | 'policies';
  article?: HikingArticle | PolicyItem;
  parentTitle?: string;
  parentView?:
    | 'home'
    | 'basics'
    | 'tools'
    | 'highlights'
    | 'surveys'
    | 'policies';
  targetSectionId?: string;
}

export default function App() {
  const [data, setData] = useState<SiteDatabase>(INITIAL_DATABASE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Navigation Stack for Hierarchical Back Navigation (Section XXIV)
  const [navStack, setNavStack] = useState<NavigationEntry[]>([
    { view: 'home' },
  ]);

  const currentNav = navStack[navStack.length - 1] || { view: 'home' };

  // Fetch site data from server
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const serverData = await fetchSiteData();
      setData(serverData);
    } catch (err: any) {
      console.warn('Could not fetch server data, fallback to initial:', err.message);
      setError('無法連線至後端服務，請確認伺服器狀態');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and URL check
  useEffect(() => {
    loadData();

    // Check if URL is /admin
    if (window.location.pathname === '/admin') {
      setNavStack([{ view: 'home' }, { view: 'admin' }]);
    }

    // Verify admin token if available
    verifyAdminSession().then((valid) => {
      setIsAuthenticated(valid);
    });

    // Handle browser popstate
    const handlePopState = () => {
      if (window.location.pathname === '/admin') {
        setNavStack((prev) => [...prev, { view: 'admin' }]);
      } else {
        setNavStack([{ view: 'home' }]);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadData]);

  // Navigate to top-level view
  const handleNavigate = (view: string, targetSectionId?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'admin') {
      window.history.pushState(null, '', '/admin');
      setNavStack((prev) => [...prev, { view: 'admin' }]);
    } else if (
      view === 'basics' ||
      view === 'tools' ||
      view === 'highlights' ||
      view === 'surveys' ||
      view === 'policies'
    ) {
      window.history.pushState(null, '', '/');
      setNavStack((prev) => [...prev, { view: view as any }]);
    } else if (view === 'home') {
      window.history.pushState(null, '', '/');
      setNavStack([{ view: 'home', targetSectionId }]);
      if (targetSectionId) {
        setTimeout(() => {
          const el = document.getElementById(targetSectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  };

  // Open Article Reader (Hierarchical)
  const handleReadArticle = (
    article: HikingArticle | PolicyItem,
    parentTitle: string
  ) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const currentViewType = currentNav.view;
    setNavStack((prev) => [
      ...prev,
      {
        view: 'reader',
        article,
        parentTitle,
        parentView: currentViewType as any,
      },
    ]);
  };

  // Hierarchical Back Button (Section XXIV)
  const handleHierarchicalBack = () => {
    setNavStack((prev) => {
      if (prev.length <= 1) {
        window.history.pushState(null, '', '/');
        return [{ view: 'home' }];
      }
      const newStack = prev.slice(0, -1);
      const nextTop = newStack[newStack.length - 1];
      if (nextTop.view === 'home') {
        window.history.pushState(null, '', '/');
      } else if (nextTop.view === 'admin') {
        window.history.pushState(null, '', '/admin');
      }
      return newStack;
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-900 selection:text-emerald-100">
      {/* Association Header */}
      <Header
        siteInfo={data.siteInfo}
        currentView={currentNav.view}
        onNavigate={handleNavigate}
      />

      {/* Connection Warning Banner if Server Unreachable */}
      {error && (
        <div className="bg-red-950/90 border-b border-red-800 text-red-200 px-4 py-1.5 text-xs text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
          <button
            onClick={loadData}
            className="underline hover:text-white ml-2 flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            重試連線
          </button>
        </div>
      )}

      {/* Main Content Area (Compact Spacing, No Redundant Blank Space) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2.5"></div>
            <p className="text-xs text-neutral-400 font-mono">載入協會資訊中...</p>
          </div>
        ) : currentNav.view === 'admin' ? (
          <AdminPage
            data={data}
            isAuthenticated={isAuthenticated}
            onRefreshData={loadData}
            onLoginSuccess={() => setIsAuthenticated(true)}
            onLogout={() => {
              setIsAuthenticated(false);
              handleNavigate('home');
            }}
            onBackToHome={() => handleNavigate('home')}
          />
        ) : currentNav.view === 'basics' ? (
          <HikingBasicsCatalog
            articles={data.hikingBasics}
            onBack={handleHierarchicalBack}
            onReadArticle={handleReadArticle}
          />
        ) : currentNav.view === 'tools' ? (
          <HikingToolsCatalog
            tools={data.hikingTools}
            onBack={handleHierarchicalBack}
            onReadArticle={handleReadArticle}
          />
        ) : currentNav.view === 'highlights' ? (
          <HighlightsCatalog
            highlights={data.highlights}
            onBack={handleHierarchicalBack}
          />
        ) : currentNav.view === 'surveys' ? (
          <SurveysCatalog
            surveys={data.surveys}
            onBack={handleHierarchicalBack}
          />
        ) : currentNav.view === 'policies' ? (
          <PoliciesCatalog
            policies={data.policies}
            onBack={handleHierarchicalBack}
            onReadPolicy={(pl) => handleReadArticle(pl, '政策與條款')}
          />
        ) : currentNav.view === 'reader' && currentNav.article ? (
          <ArticleReader
            article={currentNav.article}
            parentName={currentNav.parentTitle || '專區內容'}
            parentView={currentNav.parentView || 'home'}
            onBack={handleHierarchicalBack}
          />
        ) : (
          <SectionsView data={data} />
        )}
      </main>

      {/* Official Association Footer */}
      <Footer lineUrl={data.siteInfo.lineConsultUrl} />
    </div>
  );
}
