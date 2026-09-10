import React, { useState } from 'react';
import {
  SiteDatabase,
  SectionConfig,
  CalendarEvent,
  HikingArticle,
  HighlightVideo,
  SurveyItem,
  PolicyItem,
  DisplayMode,
} from '../types.ts';
import {
  loginAdmin,
  logoutAdmin,
  updateSectionConfig,
  reorderSections,
  createCollectionItem,
  updateCollectionItem,
  deleteCollectionItem,
  toggleCollectionItem,
  reorderCollectionItems,
  updateSiteInfo,
} from '../lib/api.ts';
import {
  Lock,
  LogOut,
  Save,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Calendar,
  BookOpen,
  Wrench,
  Video,
  ClipboardList,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Eye,
  EyeOff,
  Compass,
  X,
  Check,
  Settings,
} from 'lucide-react';

interface AdminPageProps {
  data: SiteDatabase;
  isAuthenticated: boolean;
  onRefreshData: () => Promise<void>;
  onLoginSuccess: () => void;
  onLogout: () => void;
  onBackToHome: () => void;
}

// Normalize URL helper (adds https:// if missing)
function normalizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  data,
  isAuthenticated,
  onRefreshData,
  onLoginSuccess,
  onLogout,
  onBackToHome,
}) => {
  // Login form states (Strictly: 帳號, 密碼, 登入, no hints!)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    | 'sections'
    | 'calendar'
    | 'recent'
    | 'basics'
    | 'tools'
    | 'highlights'
    | 'surveys'
    | 'policies'
    | 'routes'
  >('sections');

  // Status banner states
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Edit / Create modal state
  const [editModal, setEditModal] = useState<{
    collection: string;
    isNew: boolean;
    item: any;
  } | null>(null);

  // In-modal delete confirmation state
  const [modalConfirmDelete, setModalConfirmDelete] = useState(false);

  // In-app delete confirmation state for list items (replaces window.confirm which is blocked in iframes)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    collection: string;
    id: string;
    title: string;
  } | null>(null);

  // Section editing modal state (allows editing title, subtitle, description, externalUrl, enabled)
  const [editingSection, setEditingSection] = useState<SectionConfig | null>(null);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    if (type === 'success') {
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // ----------------------------------------------------
  // LOGIN HANDLER
  // ----------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError('請輸入帳號與密碼');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await loginAdmin(username, password);
      if (res.success) {
        onLoginSuccess();
        await onRefreshData();
      } else {
        setLoginError(res.error || '帳號或密碼錯誤');
      }
    } catch (err: any) {
      setLoginError(err.message || '登入失敗，請確認網路與伺服器狀態');
    } finally {
      setLoginLoading(false);
    }
  };

  // ----------------------------------------------------
  // LOGOUT HANDLER
  // ----------------------------------------------------
  const handleLogoutClick = async () => {
    await logoutAdmin();
    onLogout();
  };

  // ====================================================
  // CRUD & REORDER OPERATIONS
  // ====================================================

  // Save Modal Item
  const handleSaveModalItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;

    setActionLoading(true);
    setStatusMessage(null);

    const { collection, isNew, item } = editModal;

    // Normalize URLs
    const sanitizedItem = { ...item };
    if (sanitizedItem.url) sanitizedItem.url = normalizeUrl(sanitizedItem.url);
    if (sanitizedItem.googleFormsUrl)
      sanitizedItem.googleFormsUrl = normalizeUrl(sanitizedItem.googleFormsUrl);
    if (sanitizedItem.youtubeUrl)
      sanitizedItem.youtubeUrl = normalizeUrl(sanitizedItem.youtubeUrl);

    try {
      if (isNew) {
        await createCollectionItem(collection, sanitizedItem);
      } else {
        await updateCollectionItem(collection, sanitizedItem.id, sanitizedItem);
      }
      await onRefreshData();
      showStatus('success', '已儲存');
      setEditModal(null);
    } catch (err: any) {
      showStatus('error', `儲存失敗，資料尚未保存：${err.message || '伺服器異常'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Delete Item (Called after in-app confirmation)
  const executeDeleteItem = async (collection: string, id: string) => {
    setActionLoading(true);
    setStatusMessage(null);

    try {
      await deleteCollectionItem(collection, id);
      await onRefreshData();
      showStatus('success', '已刪除並儲存');
      setDeleteConfirm(null);
      setEditModal(null);
      setModalConfirmDelete(false);
    } catch (err: any) {
      showStatus('error', `儲存失敗，資料尚未保存：${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Delete Confirmation
  const handleDeleteItem = (collection: string, id: string, title: string) => {
    setDeleteConfirm({ collection, id, title });
  };

  // Toggle Item Enabled
  const handleToggleItem = async (collection: string, id: string) => {
    setActionLoading(true);
    setStatusMessage(null);

    try {
      await toggleCollectionItem(collection, id);
      await onRefreshData();
      showStatus('success', '已儲存');
    } catch (err: any) {
      showStatus('error', `儲存失敗，資料尚未保存：${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Move Item Up / Down (Reorder)
  const handleMoveItem = async (collection: string, index: number, direction: 'up' | 'down') => {
    const list = [...(data as any)[collection]];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === list.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const order = list.map((x) => x.id);

    setActionLoading(true);
    try {
      await reorderCollectionItems(collection, order);
      await onRefreshData();
      showStatus('success', '已儲存');
    } catch (err: any) {
      showStatus('error', `儲存失敗，資料尚未保存：${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Section Reorder
  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const list = [...data.sections];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === list.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const order = list.map((s) => s.id);

    setActionLoading(true);
    try {
      await reorderSections(order);
      await onRefreshData();
      showStatus('success', '已儲存');
    } catch (err: any) {
      showStatus('error', `儲存失敗，資料尚未保存：${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Section Update (Title, Subtitle, Enabled, ExternalUrl)
  const handleSectionUpdate = async (sec: SectionConfig, updates: Partial<SectionConfig>) => {
    setActionLoading(true);
    try {
      await updateSectionConfig({
        ...sec,
        ...updates,
      });
      await onRefreshData();
      showStatus('success', '已儲存');
    } catch (err: any) {
      showStatus('error', `儲存失敗，資料尚未保存：${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ====================================================
  // VIEW: UNAUTHENTICATED LOGIN SCREEN
  // Section III: No hints, no autofill buttons, strictly
  // 帳號, 密碼, 登入 button!
  // ====================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl shadow-black/80">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-100 tracking-wide">
              管理後台登入
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              亞馬遜國家山岳協會 · 系統維護專區
            </p>
          </div>

          {loginError && (
            <div
              id="login-error-banner"
              className="mb-6 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-username-input"
                className="block text-xs font-semibold text-neutral-300 mb-2"
              >
                帳號
              </label>
              <input
                id="admin-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="請輸入管理員帳號"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password-input"
                className="block text-xs font-semibold text-neutral-300 mb-2"
              >
                密碼
              </label>
              <input
                id="admin-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="請輸入管理員密碼"
              />
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:bg-neutral-800 text-white font-semibold text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <span>驗證中...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>登入</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
            <button
              onClick={onBackToHome}
              className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              &larr; 返回協會首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // VIEW: AUTHENTICATED ADMIN DASHBOARD
  // ====================================================
  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-neutral-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-mono text-emerald-400 font-semibold tracking-wider uppercase">
              ADMIN CONTROL CENTER
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-100 tracking-wide mt-1">
            亞馬遜國家山岳協會 · 網站管理後台
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            資料直通伺服器永久保存資料庫，支援首頁八大區塊完整 CRUD、排序與啟閉管理。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors"
          >
            檢視前台首頁
          </button>
          <button
            id="admin-logout-btn"
            onClick={handleLogoutClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-neutral-850 hover:bg-neutral-800 text-rose-400 border border-neutral-800 hover:border-rose-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>登出後台</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner (Section XXVIII & XXIX) */}
      {statusMessage && (
        <div
          id="admin-status-banner"
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
              : 'bg-red-950/90 text-red-200 border-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs for Sections */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar border-b border-neutral-800/80">
        <button
          onClick={() => setActiveTab('sections')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            activeTab === 'sections'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          首頁八大區塊
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            activeTab === 'calendar'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          活動行事曆 ({data.calendarEvents.length})
        </button>

        <button
          onClick={() => setActiveTab('recent')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            activeTab === 'recent'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          近期活動連結
        </button>

        <button
          onClick={() => setActiveTab('basics')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            activeTab === 'basics'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          登山入門專文 ({data.hikingBasics.length})
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            activeTab === 'tools'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          登山工具 ({data.hikingTools.length})
        </button>

        <button
          onClick={() => setActiveTab('highlights')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            activeTab === 'highlights'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          活動花絮影片 ({data.highlights.length})
        </button>

        <button
          onClick={() => setActiveTab('surveys')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            activeTab === 'surveys'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          問卷調查 ({data.surveys.length})
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            activeTab === 'policies'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          政策與條款 ({data.policies.length})
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            activeTab === 'routes'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          行程總表連結
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: 首頁八大區塊管理 (Sort, Enable/Disable, Rename) */}
      {/* ==================================================== */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">
              首頁八大區塊架構與排序
            </h2>
            <span className="text-xs text-neutral-500 font-mono">
              可點擊上下箭頭調整顯示順序，或開關啟用狀態
            </span>
          </div>

          <div className="space-y-3">
            {data.sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveSection(idx, 'up')}
                      disabled={idx === 0 || actionLoading}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300 transition-colors"
                      title="往上移"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(idx, 'down')}
                      disabled={idx === data.sections.length - 1 || actionLoading}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300 transition-colors"
                      title="往下移"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-emerald-400">
                        #{sec.sortOrder}
                      </span>
                      <h3 className="font-bold text-sm text-neutral-100">
                        {sec.title}
                      </h3>
                      <span className="text-xs text-neutral-500 font-mono">
                        ({sec.subtitle})
                      </span>
                    </div>
                    {sec.description && (
                      <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                        {sec.description}
                      </p>
                    )}
                    {sec.externalUrl && (
                      <div className="text-[11px] text-emerald-500 font-mono mt-1">
                        外部連結：{sec.externalUrl}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() =>
                      handleSectionUpdate(sec, { enabled: !sec.enabled })
                    }
                    disabled={actionLoading}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      sec.enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {sec.enabled ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>已啟用</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>已停用</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setEditingSection({ ...sec })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold transition-colors"
                    title="編輯此區塊標題與設定"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>編輯區塊</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: 活動行事曆 (Calendar Events) */}
      {/* ==================================================== */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">
              活動行事曆事件管理（支援連續多日活動）
            </h2>
            <button
              onClick={() =>
                setEditModal({
                  collection: 'calendarEvents',
                  isNew: true,
                  item: {
                    title: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                    location: '',
                    category: '高山百岳',
                    url: 'https://amazon-trail.ai.studio/activity/',
                    status: 'open',
                    enabled: true,
                  },
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增活動行程</span>
            </button>
          </div>

          <div className="space-y-3">
            {data.calendarEvents.map((ev, idx) => (
              <div
                key={ev.id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveItem('calendarEvents', idx, 'up')}
                      disabled={idx === 0 || actionLoading}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveItem('calendarEvents', idx, 'down')}
                      disabled={
                        idx === data.calendarEvents.length - 1 || actionLoading
                      }
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900">
                        {ev.startDate} ～ {ev.endDate}
                      </span>
                      <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                        {ev.category}
                      </span>
                      <span className={`text-[11px] px-1.5 py-0.2 rounded border ${
                        ev.status === 'full'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}>
                        {ev.status === 'full' ? '額滿' : '報名中'}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-neutral-100">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      地點：{ev.location} | 報名網址：{ev.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleItem('calendarEvents', ev.id)}
                    disabled={actionLoading}
                    className={`p-1.5 rounded-lg border text-xs font-semibold ${
                      ev.enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                    }`}
                  >
                    {ev.enabled ? '已啟用' : '已停用'}
                  </button>

                  <button
                    onClick={() =>
                      setEditModal({
                        collection: 'calendarEvents',
                        isNew: false,
                        item: { ...ev },
                      })
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    title="編輯活動"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteItem('calendarEvents', ev.id, ev.title)
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                    title="刪除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: 近期活動連結設定 */}
      {/* ==================================================== */}
      {activeTab === 'recent' && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-6 max-w-2xl">
          <h2 className="text-base font-bold text-neutral-200 mb-4">
            近期活動專區直接導向設定
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                直接連結網址（點擊後直達，不增加中介頁面）
              </label>
              <input
                type="text"
                defaultValue={data.siteInfo.recentActivitiesUrl}
                onBlur={async (e) => {
                  const val = normalizeUrl(e.target.value);
                  try {
                    await updateSiteInfo({ recentActivitiesUrl: val });
                    await onRefreshData();
                    showStatus('success', '已儲存');
                  } catch (err: any) {
                    showStatus('error', `儲存失敗：${err.message}`);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm font-mono"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                預設：https://amazon-trail.ai.studio/activity/
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: 登山入門專文 */}
      {/* ==================================================== */}
      {activeTab === 'basics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">
              登山入門專文管理（本站自建內容系統）
            </h2>
            <button
              onClick={() =>
                setEditModal({
                  collection: 'hikingBasics',
                  isNew: true,
                  item: {
                    title: '',
                    summary: '',
                    content: '',
                    url: '',
                    displayMode: 'content',
                    category: '裝備須知',
                    enabled: true,
                  },
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增專文</span>
            </button>
          </div>

          <div className="space-y-3">
            {data.hikingBasics.map((item, idx) => (
              <div
                key={item.id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveItem('hikingBasics', idx, 'up')}
                      disabled={idx === 0 || actionLoading}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveItem('hikingBasics', idx, 'down')}
                      disabled={
                        idx === data.hikingBasics.length - 1 || actionLoading
                      }
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-emerald-400 bg-neutral-800 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        模式: {item.displayMode}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-neutral-100">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                      {item.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleItem('hikingBasics', item.id)}
                    disabled={actionLoading}
                    className={`p-1.5 rounded-lg border text-xs font-semibold ${
                      item.enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                    }`}
                  >
                    {item.enabled ? '已啟用' : '已停用'}
                  </button>

                  <button
                    onClick={() =>
                      setEditModal({
                        collection: 'hikingBasics',
                        isNew: false,
                        item: { ...item },
                      })
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    title="編輯"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteItem('hikingBasics', item.id, item.title)
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                    title="刪除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: 登山工具 */}
      {/* ==================================================== */}
      {activeTab === 'tools' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">
              登山工具管理（架構與登山入門一致）
            </h2>
            <button
              onClick={() =>
                setEditModal({
                  collection: 'hikingTools',
                  isNew: true,
                  item: {
                    title: '',
                    summary: '',
                    content: '',
                    url: '',
                    displayMode: 'auto',
                    category: '氣象觀測',
                    enabled: true,
                  },
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增登山工具</span>
            </button>
          </div>

          <div className="space-y-3">
            {data.hikingTools.map((item, idx) => (
              <div
                key={item.id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveItem('hikingTools', idx, 'up')}
                      disabled={idx === 0 || actionLoading}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveItem('hikingTools', idx, 'down')}
                      disabled={
                        idx === data.hikingTools.length - 1 || actionLoading
                      }
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-emerald-400 bg-neutral-800 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      {item.url && (
                        <span className="text-[11px] text-neutral-500 font-mono truncate max-w-xs">
                          {item.url}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-neutral-100">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleItem('hikingTools', item.id)}
                    disabled={actionLoading}
                    className={`p-1.5 rounded-lg border text-xs font-semibold ${
                      item.enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                    }`}
                  >
                    {item.enabled ? '已啟用' : '已停用'}
                  </button>

                  <button
                    onClick={() =>
                      setEditModal({
                        collection: 'hikingTools',
                        isNew: false,
                        item: { ...item },
                      })
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    title="編輯"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteItem('hikingTools', item.id, item.title)
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                    title="刪除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 6: 活動花絮 (YouTube 影片，後台僅需輸入 YouTube URL) */}
      {/* ==================================================== */}
      {activeTab === 'highlights' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-200">
                活動花絮影片管理
              </h2>
              <span className="text-xs text-neutral-400">
                後台僅需輸入 YouTube URL，系統自動解析 Video ID 並顯示原生播放器。
              </span>
            </div>
            <button
              onClick={() =>
                setEditModal({
                  collection: 'highlights',
                  isNew: true,
                  item: {
                    youtubeUrl: '',
                    title: '',
                    enabled: true,
                  },
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增 YouTube 影片</span>
            </button>
          </div>

          <div className="space-y-3">
            {data.highlights.map((item, idx) => (
              <div
                key={item.id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveItem('highlights', idx, 'up')}
                      disabled={idx === 0 || actionLoading}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveItem('highlights', idx, 'down')}
                      disabled={
                        idx === data.highlights.length - 1 || actionLoading
                      }
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-red-400 font-mono bg-red-950/60 px-2 py-0.5 rounded border border-red-900">
                        ID: {item.videoId || '未解析'}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {item.addedAt}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-neutral-100">
                      {item.title || item.youtubeUrl}
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono truncate max-w-md mt-0.5">
                      {item.youtubeUrl}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleItem('highlights', item.id)}
                    disabled={actionLoading}
                    className={`p-1.5 rounded-lg border text-xs font-semibold ${
                      item.enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                    }`}
                  >
                    {item.enabled ? '已啟用' : '已停用'}
                  </button>

                  <button
                    onClick={() =>
                      setEditModal({
                        collection: 'highlights',
                        isNew: false,
                        item: { ...item },
                      })
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    title="編輯"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteItem('highlights', item.id, item.title || '影片')
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                    title="刪除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 7: 問卷調查 (Google Forms 管理) */}
      {/* ==================================================== */}
      {activeTab === 'surveys' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">
              問卷調查表單管理（Google Forms 整合）
            </h2>
            <button
              onClick={() =>
                setEditModal({
                  collection: 'surveys',
                  isNew: true,
                  item: {
                    title: '',
                    description: '',
                    googleFormsUrl: '',
                    enabled: true,
                  },
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增問卷調查</span>
            </button>
          </div>

          <div className="space-y-3">
            {data.surveys.map((sv, idx) => (
              <div
                key={sv.id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveItem('surveys', idx, 'up')}
                      disabled={idx === 0 || actionLoading}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveItem('surveys', idx, 'down')}
                      disabled={idx === data.surveys.length - 1 || actionLoading}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-neutral-100">
                      {sv.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                      {sv.description}
                    </p>
                    <p className="text-[11px] text-emerald-500 font-mono truncate max-w-md mt-0.5">
                      {sv.googleFormsUrl}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleItem('surveys', sv.id)}
                    disabled={actionLoading}
                    className={`p-1.5 rounded-lg border text-xs font-semibold ${
                      sv.enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                    }`}
                  >
                    {sv.enabled ? '已啟用' : '已停用'}
                  </button>

                  <button
                    onClick={() =>
                      setEditModal({
                        collection: 'surveys',
                        isNew: false,
                        item: { ...sv },
                      })
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    title="編輯"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteItem('surveys', sv.id, sv.title)
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                    title="刪除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 8: 政策與條款 */}
      {/* ==================================================== */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">
              政策與條款規章管理（本站自建內容）
            </h2>
            <button
              onClick={() =>
                setEditModal({
                  collection: 'policies',
                  isNew: true,
                  item: {
                    title: '',
                    content: '',
                    enabled: true,
                  },
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增條款章程</span>
            </button>
          </div>

          <div className="space-y-3">
            {data.policies.map((pol, idx) => (
              <div
                key={pol.id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveItem('policies', idx, 'up')}
                      disabled={idx === 0 || actionLoading}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveItem('policies', idx, 'down')}
                      disabled={idx === data.policies.length - 1 || actionLoading}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {pol.updatedAt}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-neutral-100">
                      {pol.title}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                      {pol.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleItem('policies', pol.id)}
                    disabled={actionLoading}
                    className={`p-1.5 rounded-lg border text-xs font-semibold ${
                      pol.enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                    }`}
                  >
                    {pol.enabled ? '已啟用' : '已停用'}
                  </button>

                  <button
                    onClick={() =>
                      setEditModal({
                        collection: 'policies',
                        isNew: false,
                        item: { ...pol },
                      })
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    title="編輯"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteItem('policies', pol.id, pol.title)
                    }
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300"
                    title="刪除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 9: 行程總表連結設定 */}
      {/* ==================================================== */}
      {activeTab === 'routes' && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-6 max-w-2xl">
          <h2 className="text-base font-bold text-neutral-200 mb-4">
            行程總表專區直接導向設定
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                直接連結網址（點擊後直達，不增加中介頁面）
              </label>
              <input
                type="text"
                defaultValue={data.siteInfo.routesUrl}
                onBlur={async (e) => {
                  const val = normalizeUrl(e.target.value);
                  try {
                    await updateSiteInfo({ routesUrl: val });
                    await onRefreshData();
                    showStatus('success', '已儲存');
                  } catch (err: any) {
                    showStatus('error', `儲存失敗：${err.message}`);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm font-mono"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                預設：https://amazon-data.ai.studio/routes
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* EDIT / CREATE MODAL */}
      {/* Section XI & XII: Inputs, Textarea, URL Normalization */}
      {/* ==================================================== */}
      {editModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-100">
                {editModal.isNew ? '新增項目' : '編輯項目'}
              </h3>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="text-neutral-400 hover:text-neutral-200 text-sm px-2 py-1 rounded"
              >
                ✕ 關閉
              </button>
            </div>

            <form onSubmit={handleSaveModalItem} className="space-y-4">
              {/* Title field (if applicable) */}
              {editModal.item.title !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    名稱 / 標題
                  </label>
                  <input
                    type="text"
                    required
                    value={editModal.item.title}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        item: { ...editModal.item, title: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="請輸入標題"
                  />
                </div>
              )}

              {/* YouTube URL input for highlights (Section XVII: YouTube URL input only) */}
              {editModal.collection === 'highlights' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    YouTube URL 影片網址（系統自動解析）
                  </label>
                  <input
                    type="text"
                    required
                    value={editModal.item.youtubeUrl || ''}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        item: { ...editModal.item, youtubeUrl: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="例：https://www.youtube.com/watch?v=0k2Zzkwb_hA 或 https://youtu.be/..."
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    可輸入 standard, share, embed, shorts 各種 YouTube 連結格式
                  </span>
                </div>
              )}

              {/* Google Forms URL for surveys */}
              {editModal.collection === 'surveys' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Google Forms 表單網址
                  </label>
                  <input
                    type="text"
                    required
                    value={editModal.item.googleFormsUrl || ''}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        item: {
                          ...editModal.item,
                          googleFormsUrl: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="例：https://docs.google.com/forms/d/e/.../viewform"
                  />
                </div>
              )}

              {/* Multi-day Start Date and End Date for Calendar */}
              {editModal.collection === 'calendarEvents' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      行程起始日期
                    </label>
                    <input
                      type="date"
                      required
                      value={editModal.item.startDate}
                      onChange={(e) =>
                        setEditModal({
                          ...editModal,
                          item: {
                            ...editModal.item,
                            startDate: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      行程結束日期（多日活動連續顯示）
                    </label>
                    <input
                      type="date"
                      required
                      value={editModal.item.endDate}
                      onChange={(e) =>
                        setEditModal({
                          ...editModal,
                          item: { ...editModal.item, endDate: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      地點 / 山系
                    </label>
                    <input
                      type="text"
                      value={editModal.item.location || ''}
                      onChange={(e) =>
                        setEditModal({
                          ...editModal,
                          item: {
                            ...editModal.item,
                            location: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm focus:border-emerald-500 focus:outline-none"
                      placeholder="例：太魯閣國家公園 · 台中/花蓮"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      報名名額狀態
                    </label>
                    <select
                      value={editModal.item.status || 'open'}
                      onChange={(e) =>
                        setEditModal({
                          ...editModal,
                          item: {
                            ...editModal.item,
                            status: e.target.value as any,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="open">報名中 (招募隊員中)</option>
                      <option value="full">已額滿 (名額已滿)</option>
                      <option value="closed">已截止 (行程已結束或截止)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Category selector if applicable */}
              {editModal.item.category !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    分類標籤
                  </label>
                  <input
                    type="text"
                    value={editModal.item.category}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        item: {
                          ...editModal.item,
                          category: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="例：高山百岳 / 裝備須知 / 氣象觀測"
                  />
                </div>
              )}

              {/* Display Mode (Section XV: 自動判斷、優先顯示內容、優先前往網址) */}
              {editModal.item.displayMode !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    顯示方式
                  </label>
                  <select
                    value={editModal.item.displayMode}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        item: {
                          ...editModal.item,
                          displayMode: e.target.value as DisplayMode,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="auto">自動判斷（有專文優先看內容，無內容開網址）</option>
                    <option value="content">優先顯示內容（點擊開啟專文詳情閱讀）</option>
                    <option value="link">優先前往網址（點擊直接前往外部連結）</option>
                  </select>
                </div>
              )}

              {/* External URL for basics / tools / calendar */}
              {editModal.item.url !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    相關網址 / 外部系統連結（自動補齊 https://）
                  </label>
                  <input
                    type="text"
                    value={editModal.item.url || ''}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        item: { ...editModal.item, url: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="例：https://amazon-trail.ai.studio/activity/"
                  />
                </div>
              )}

              {/* Summary field */}
              {editModal.item.summary !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    摘要簡介
                  </label>
                  <textarea
                    rows={2}
                    value={editModal.item.summary}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        item: { ...editModal.item, summary: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="簡要說明此專文或工具要旨"
                  />
                </div>
              )}

              {/* Description field for surveys */}
              {editModal.item.description !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    表單說明
                  </label>
                  <textarea
                    rows={2}
                    value={editModal.item.description}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        item: {
                          ...editModal.item,
                          description: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="說明問卷調查背景與填答對象"
                  />
                </div>
              )}

              {/* Full Content Textarea for basics / tools / policies */}
              {editModal.item.content !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    專文完整內容 / 條款章程（支援 Markdown 排版）
                  </label>
                  <textarea
                    rows={8}
                    value={editModal.item.content}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        item: { ...editModal.item, content: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm font-mono leading-relaxed focus:border-emerald-500 focus:outline-none"
                    placeholder="可輸入段落標題 (##)、條列要點 (*)、規章條文..."
                  />
                </div>
              )}

              <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  {!editModal.isNew && editModal.item.id && (
                    modalConfirmDelete ? (
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-200">
                        <span>確定刪除？</span>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => executeDeleteItem(editModal.collection, editModal.item.id)}
                          className="px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white font-semibold text-xs transition-colors"
                        >
                          確認刪除
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalConfirmDelete(false)}
                          className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setModalConfirmDelete(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 text-rose-400 hover:text-rose-200 border border-rose-900/60 text-xs font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>刪除此項目</span>
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModal(null);
                      setModalConfirmDelete(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{actionLoading ? '儲存中...' : '儲存變更'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section Edit Modal (In-App Modal for Title, Subtitle, Description, URL, Enabled) */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-neutral-100">
                  編輯區塊設定：{editingSection.title}
                </h3>
              </div>
              <button
                onClick={() => setEditingSection(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleSectionUpdate(editingSection, {
                  title: editingSection.title.trim(),
                  subtitle: editingSection.subtitle.trim(),
                  description: editingSection.description?.trim(),
                  externalUrl: editingSection.externalUrl?.trim(),
                  enabled: editingSection.enabled,
                });
                setEditingSection(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  區塊主要標題 (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={editingSection.title}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  副標題 / 英文標示 (Subtitle) *
                </label>
                <input
                  type="text"
                  required
                  value={editingSection.subtitle}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, subtitle: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  區塊簡短說明 (Description)
                </label>
                <textarea
                  rows={2}
                  value={editingSection.description || ''}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, description: e.target.value })
                  }
                  placeholder="請輸入區塊說明或介紹..."
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  外部導覽連結 (External URL - 選填)
                </label>
                <input
                  type="text"
                  value={editingSection.externalUrl || ''}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, externalUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modal-section-enabled"
                  checked={editingSection.enabled}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, enabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label
                  htmlFor="modal-section-enabled"
                  className="text-xs font-medium text-neutral-200 cursor-pointer"
                >
                  啟用此區塊
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{actionLoading ? '儲存中...' : '儲存區塊設定'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global In-App Delete Confirmation Modal (Replaces blocked window.confirm) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-rose-900/80 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-100">
                  確定要刪除此項目嗎？
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  項目名稱：「{deleteConfirm.title}」
                </p>
                <p className="text-xs text-rose-400/90 mt-1">
                  此操作將直接自資料庫中永久移除，無法復原。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => executeDeleteItem(deleteConfirm.collection, deleteConfirm.id)}
                className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{actionLoading ? '刪除中...' : '確認刪除'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
