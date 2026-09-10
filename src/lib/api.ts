import { SiteDatabase, ApiResponse, LoginResponse } from '../types.ts';

const TOKEN_KEY = 'amazon_alpine_auth_token';

/**
 * Token management for admin sessions
 */
export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Fetch full public database directly from server
 */
export async function fetchSiteData(): Promise<SiteDatabase> {
  const res = await fetch('/api/data', {
    headers: {
      'Cache-Control': 'no-cache',
    },
  });

  if (!res.ok) {
    throw new Error(`無法連線至後端服務 (${res.status})，請確認網路與伺服器狀態`);
  }

  const json = (await res.json()) as { success: boolean; data: SiteDatabase };
  if (!json.success || !json.data) {
    throw new Error('無法取得網站資料');
  }

  return json.data;
}

/**
 * Admin Login API
 */
export async function loginAdmin(username: string, password: string): Promise<LoginResponse> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const json = (await res.json()) as LoginResponse;
    if (res.ok && json.success && json.token) {
      setStoredToken(json.token);
      return json;
    }

    return {
      success: false,
      error: json.error || '帳號或密碼錯誤',
    };
  } catch (err: any) {
    return {
      success: false,
      error: '無法連線至認證服務，請稍後再試',
    };
  }
}

/**
 * Verify current Admin Token
 */
export async function verifyAdminSession(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (!json.valid) {
      setStoredToken(null);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Admin Logout
 */
export async function logoutAdmin(): Promise<void> {
  const token = getStoredToken();
  try {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // Ignore error
  } finally {
    setStoredToken(null);
  }
}

/**
 * Helper to perform authenticated API calls
 */
async function adminRequest<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('未登入或憑證已失效，請重新登入管理員帳號');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const errorMsg = json.error || json.message || `伺服器回應錯誤 (${res.status})`;
    throw new Error(errorMsg);
  }

  return json;
}

/**
 * Update general site info
 */
export async function updateSiteInfo(data: Partial<SiteDatabase['siteInfo']>): Promise<ApiResponse> {
  return adminRequest('/api/admin/site-info', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update section settings (enable, title, subtitle, url)
 */
export async function updateSectionConfig(sectionData: {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  externalUrl?: string;
  enabled: boolean;
  sortOrder: number;
}): Promise<ApiResponse> {
  return adminRequest('/api/admin/sections/update', {
    method: 'POST',
    body: JSON.stringify(sectionData),
  });
}

/**
 * Reorder sections
 */
export async function reorderSections(order: string[]): Promise<ApiResponse> {
  return adminRequest('/api/admin/sections/reorder', {
    method: 'POST',
    body: JSON.stringify({ order }),
  });
}

/**
 * Collection item CRUD
 */
export async function createCollectionItem(collection: string, item: any): Promise<ApiResponse> {
  return adminRequest(`/api/admin/items/${collection}/create`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updateCollectionItem(collection: string, id: string, updates: any): Promise<ApiResponse> {
  return adminRequest(`/api/admin/items/${collection}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteCollectionItem(collection: string, id: string): Promise<ApiResponse> {
  return adminRequest(`/api/admin/items/${collection}/${id}`, {
    method: 'DELETE',
  });
}

export async function toggleCollectionItem(collection: string, id: string): Promise<ApiResponse> {
  return adminRequest(`/api/admin/items/${collection}/${id}/toggle`, {
    method: 'POST',
  });
}

export async function reorderCollectionItems(collection: string, order: string[]): Promise<ApiResponse> {
  return adminRequest(`/api/admin/items/${collection}/reorder`, {
    method: 'POST',
    body: JSON.stringify({ order }),
  });
}
