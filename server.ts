import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { INITIAL_DATABASE } from "./src/data/initialData.ts";
import { SiteDatabase, CalendarEvent, HikingArticle, HighlightVideo, SurveyItem, PolicyItem } from "./src/types.ts";

const app = express();
const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");
const TMP_FILE = path.join(DATA_DIR, "database.json.tmp");

// Server Secret for HMAC Token Authentication
const AUTH_SECRET = process.env.AUTH_SECRET || "amazon_alpine_secret_hmac_2025_prod_key";

// Admin credentials (Server-Side Only)
const ADMIN_USER = (process.env.ADMIN_USER || "admin").trim().toLowerCase();
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "amazon2025";
// Alternate acceptable admin logins for convenience
const ALLOWED_ADMIN_USERS = [ADMIN_USER, "amazonkaohsiung@gmail.com", "amazon"];
const ALLOWED_ADMIN_PASSWORDS = [ADMIN_PASS, "amazon2025", "AmazonAlpine2025!", "admin123"];

// In-memory cached database
let dbCache: SiteDatabase;

/**
 * Initialize persistent database.
 * CRITICAL RULE: If database.json exists and is valid, NEVER overwrite it with initialData!
 * Only initialize if the file does not exist or is empty.
 */
function initDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      if (content && content.trim().length > 0) {
        const parsed = JSON.parse(content) as SiteDatabase;
        if (parsed && parsed.siteInfo && Array.isArray(parsed.sections)) {
          console.log("[DB] Loaded existing persistent database from disk.");
          dbCache = parsed;
          return;
        }
      }
    }

    // Only written if file was missing or corrupt
    console.log("[DB] No existing database found. Creating initial persistent database.");
    dbCache = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    saveDatabaseAtomic();
  } catch (err) {
    console.error("[DB] Error initializing database, falling back to memory:", err);
    dbCache = JSON.parse(JSON.stringify(INITIAL_DATABASE));
  }
}

/**
 * Atomic persistent write: Write to .tmp then rename to .json
 */
function saveDatabaseAtomic(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbCache.lastUpdated = new Date().toISOString();
    const dataStr = JSON.stringify(dbCache, null, 2);
    fs.writeFileSync(TMP_FILE, dataStr, "utf-8");
    fs.renameSync(TMP_FILE, DB_FILE);
  } catch (err) {
    console.error("[DB] Failed to save database atomically:", err);
    throw err;
  }
}

/**
 * Stateless HMAC Token Generation
 */
function generateToken(username: string): string {
  const payload = JSON.stringify({
    u: username,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  const b64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(b64Payload).digest("base64url");
  return `${b64Payload}.${signature}`;
}

/**
 * Stateless HMAC Token Verification
 */
function verifyToken(token: string): { valid: boolean; user?: string } {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false };
  }
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };

  const [b64Payload, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(b64Payload).digest("base64url");
  if (signature !== expectedSig) {
    return { valid: false };
  }

  try {
    const data = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf-8"));
    if (typeof data.exp !== "number" || data.exp < Date.now()) {
      return { valid: false };
    }
    return { valid: true, user: data.u };
  } catch {
    return { valid: false };
  }
}

/**
 * Admin Authentication Middleware
 */
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "未授權存取：請先登入管理員帳號",
    });
  }

  const token = authHeader.substring(7).trim();
  const result = verifyToken(token);
  if (!result.valid) {
    return res.status(401).json({
      success: false,
      error: "登入憑證無效或已過期，請重新登入",
    });
  }

  (req as any).adminUser = result.user;
  next();
}

/**
 * YouTube URL parser
 */
function extractYoutubeId(url: string): string {
  if (!url) return "";
  const clean = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = clean.match(regExp);
  return match && match[2].length === 11 ? match[2] : clean;
}

// Start Server Setup
async function startServer() {
  initDatabase();

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // ==========================================
  // PUBLIC API ROUTES
  // ==========================================

  // Health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      lastUpdated: dbCache?.lastUpdated,
    });
  });

  // Get full site public data
  app.get("/api/data", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({
      success: true,
      data: dbCache,
    });
  });

  app.get("/api/site-data", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({
      success: true,
      data: dbCache,
    });
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // Login
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "請輸入帳號與密碼",
      });
    }

    const cleanUser = String(username).trim().toLowerCase();
    const cleanPass = String(password);

    const isUserValid = ALLOWED_ADMIN_USERS.includes(cleanUser);
    const isPassValid = ALLOWED_ADMIN_PASSWORDS.includes(cleanPass);

    if (!isUserValid || !isPassValid) {
      return res.status(401).json({
        success: false,
        error: "帳號或密碼錯誤，請重新確認",
      });
    }

    const token = generateToken(cleanUser);
    return res.json({
      success: true,
      message: "登入成功",
      token,
      user: cleanUser,
    });
  });

  // Verify Session Token
  app.get("/api/auth/verify", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({ valid: false });
    }
    const token = authHeader.substring(7).trim();
    const result = verifyToken(token);
    return res.json(result);
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    return res.json({ success: true, message: "已登出" });
  });

  // ==========================================
  // ADMIN PROTECTED ROUTES
  // ==========================================

  // 1. Update site information & URLs
  app.post("/api/admin/site-info", requireAdminAuth, (req: Request, res: Response) => {
    try {
      const updates = req.body;
      dbCache.siteInfo = {
        ...dbCache.siteInfo,
        ...updates,
      };
      saveDatabaseAtomic();
      res.json({
        success: true,
        message: "已儲存",
        data: dbCache.siteInfo,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "儲存失敗，資料尚未保存",
        message: err.message,
      });
    }
  });

  // 2. Update section details (enable/disable, title, subtitle, externalUrl)
  app.post("/api/admin/sections/update", requireAdminAuth, (req: Request, res: Response) => {
    try {
      const { id, title, subtitle, description, externalUrl, enabled, sortOrder } = req.body;
      const index = dbCache.sections.findIndex((s) => s.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "找不到該區塊" });
      }

      dbCache.sections[index] = {
        ...dbCache.sections[index],
        title: title !== undefined ? title : dbCache.sections[index].title,
        subtitle: subtitle !== undefined ? subtitle : dbCache.sections[index].subtitle,
        description: description !== undefined ? description : dbCache.sections[index].description,
        externalUrl: externalUrl !== undefined ? externalUrl : dbCache.sections[index].externalUrl,
        enabled: enabled !== undefined ? Boolean(enabled) : dbCache.sections[index].enabled,
        sortOrder: typeof sortOrder === "number" ? sortOrder : dbCache.sections[index].sortOrder,
      };

      saveDatabaseAtomic();
      res.json({
        success: true,
        message: "已儲存",
        data: dbCache.sections,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "儲存失敗，資料尚未保存",
        message: err.message,
      });
    }
  });

  // 3. Reorder sections
  app.post("/api/admin/sections/reorder", requireAdminAuth, (req: Request, res: Response) => {
    try {
      const { order } = req.body; // array of section IDs in new order
      if (Array.isArray(order)) {
        order.forEach((id: string, idx: number) => {
          const s = dbCache.sections.find((x) => x.id === id);
          if (s) s.sortOrder = idx + 1;
        });
        dbCache.sections.sort((a, b) => a.sortOrder - b.sortOrder);
      }
      saveDatabaseAtomic();
      res.json({
        success: true,
        message: "已儲存",
        data: dbCache.sections,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "儲存失敗，資料尚未保存",
        message: err.message,
      });
    }
  });

  // Helper collection selector
  const getCollection = (name: string): any[] | null => {
    switch (name) {
      case "calendarEvents":
        return dbCache.calendarEvents;
      case "hikingBasics":
        return dbCache.hikingBasics;
      case "hikingTools":
        return dbCache.hikingTools;
      case "highlights":
        return dbCache.highlights;
      case "surveys":
        return dbCache.surveys;
      case "policies":
        return dbCache.policies;
      default:
        return null;
    }
  };

  // 4. Create item in a collection
  app.post("/api/admin/items/:collection/create", requireAdminAuth, (req: Request, res: Response) => {
    try {
      const { collection } = req.params;
      const list = getCollection(collection);
      if (!list) {
        return res.status(400).json({ success: false, error: "無效的集合分類" });
      }

      const item = req.body;
      const newId = item.id || `${collection.slice(0, 3)}-${Date.now().toString(36)}`;
      
      // Auto-extract videoId for highlights
      if (collection === "highlights" && item.youtubeUrl) {
        item.videoId = extractYoutubeId(item.youtubeUrl);
        if (!item.title) {
          item.title = `高山紀實影片 (${item.videoId})`;
        }
      }

      const sortOrder = typeof item.sortOrder === "number" ? item.sortOrder : list.length + 1;
      const newItem = {
        ...item,
        id: newId,
        sortOrder,
        enabled: item.enabled !== undefined ? Boolean(item.enabled) : true,
        updatedAt: new Date().toISOString().split("T")[0],
        addedAt: new Date().toISOString().split("T")[0],
      };

      list.push(newItem);
      saveDatabaseAtomic();

      res.json({
        success: true,
        message: "已儲存",
        data: newItem,
        collectionData: list,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "儲存失敗，資料尚未保存",
        message: err.message,
      });
    }
  });

  // 5. Update item in a collection
  app.put("/api/admin/items/:collection/:id", requireAdminAuth, (req: Request, res: Response) => {
    try {
      const { collection, id } = req.params;
      const list = getCollection(collection);
      if (!list) {
        return res.status(400).json({ success: false, error: "無效的集合分類" });
      }

      const index = list.findIndex((x) => x.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "找不到欲編輯之項目" });
      }

      const updates = req.body;
      if (collection === "highlights" && updates.youtubeUrl) {
        updates.videoId = extractYoutubeId(updates.youtubeUrl);
      }

      list[index] = {
        ...list[index],
        ...updates,
        updatedAt: new Date().toISOString().split("T")[0],
      };

      saveDatabaseAtomic();

      res.json({
        success: true,
        message: "已儲存",
        data: list[index],
        collectionData: list,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "儲存失敗，資料尚未保存",
        message: err.message,
      });
    }
  });

  // 6. Delete item from a collection
  app.delete("/api/admin/items/:collection/:id", requireAdminAuth, (req: Request, res: Response) => {
    try {
      const { collection, id } = req.params;
      const list = getCollection(collection);
      if (!list) {
        return res.status(400).json({ success: false, error: "無效的集合分類" });
      }

      const index = list.findIndex((x) => x.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "找不到欲刪除之項目" });
      }

      list.splice(index, 1);
      // Re-index sortOrder
      list.forEach((item, idx) => {
        item.sortOrder = idx + 1;
      });

      saveDatabaseAtomic();

      res.json({
        success: true,
        message: "已刪除並儲存",
        collectionData: list,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "儲存失敗，資料尚未保存",
        message: err.message,
      });
    }
  });

  // 7. Toggle item enabled/disabled
  app.post("/api/admin/items/:collection/:id/toggle", requireAdminAuth, (req: Request, res: Response) => {
    try {
      const { collection, id } = req.params;
      const list = getCollection(collection);
      if (!list) {
        return res.status(400).json({ success: false, error: "無效的集合分類" });
      }

      const item = list.find((x) => x.id === id);
      if (!item) {
        return res.status(404).json({ success: false, error: "找不到欲切換之項目" });
      }

      item.enabled = !item.enabled;
      saveDatabaseAtomic();

      res.json({
        success: true,
        message: "已儲存",
        data: item,
        collectionData: list,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "儲存失敗，資料尚未保存",
        message: err.message,
      });
    }
  });

  // 8. Reorder items in a collection
  app.post("/api/admin/items/:collection/reorder", requireAdminAuth, (req: Request, res: Response) => {
    try {
      const { collection } = req.params;
      const { order } = req.body; // array of item IDs in order
      const list = getCollection(collection);
      if (!list || !Array.isArray(order)) {
        return res.status(400).json({ success: false, error: "參數錯誤" });
      }

      order.forEach((id: string, idx: number) => {
        const it = list.find((x) => x.id === id);
        if (it) it.sortOrder = idx + 1;
      });
      list.sort((a, b) => a.sortOrder - b.sortOrder);

      saveDatabaseAtomic();

      res.json({
        success: true,
        message: "已儲存",
        collectionData: list,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "儲存失敗，資料尚未保存",
        message: err.message,
      });
    }
  });

  // ==========================================
  // VITE MIDDLEWARE & STATIC ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Amazon Alpine Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to boot server:", err);
});
