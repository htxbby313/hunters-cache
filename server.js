import express from "express";
import cors from "cors";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { runQuery, databasePath, usingNetlifyDatabase } from "./database.js";

const __dirname = process.cwd();
const app = express();
const port = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "hunters-cache-secret-key-change-in-prod";
const FIREARM_CHECKOUT_ENABLED = process.env.ENABLE_FIREARM_CHECKOUT === "true";
const MARKET_DATA_ADMIN_KEY = process.env.MARKET_DATA_ADMIN_KEY || "";
const OPERATIONS_ADMIN_KEY = process.env.OPERATIONS_ADMIN_KEY || "";
const FFL_API_KEY = process.env.FFL_API_KEY || "";
const GUNTAB_API_TOKEN = process.env.GUNTAB_API_TOKEN || "";
const GUNTAB_WEBHOOK_SECRET = process.env.GUNTAB_WEBHOOK_SECRET || "";
const GUNTAB_API_BASE_URL = process.env.GUNTAB_API_BASE_URL || "https://api.guntab.com/v1";
const PUBLIC_APP_URL = String(process.env.PUBLIC_APP_URL || "").replace(/\/$/, "");
const PAYMENT_CONFIGURED = Boolean(GUNTAB_API_TOKEN);
const GUNTAB_LISTING_TYPES = new Set(["ammunition_and_flammables", "antique_gun", "aow", "curio_relic", "handgun", "long_gun", "machine_gun", "magazine", "other_non_regulated", "short_barreled_long_gun", "suppressor"]);

if (process.env.NODE_ENV === "production" && JWT_SECRET === "hunters-cache-secret-key-change-in-prod") {
  throw new Error("JWT_SECRET must be set to a strong unique value in production");
}

app.use(cors());
app.use(express.json({ verify: (req, _res, buffer) => { req.rawBody = buffer; } }));
app.use(express.static(path.join(__dirname, "dist")));

function esc(val) {
  if (val === null || val === undefined) return "NULL";
  const s = String(val).replace(/'/g, "''");
  return `'${s}'`;
}

async function ensureMarketplaceSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, display_name TEXT NOT NULL, location TEXT, bio TEXT, avatar_url TEXT, is_seller INTEGER NOT NULL DEFAULT 0, guntab_email TEXT, identity_status TEXT NOT NULL DEFAULT 'unverified', ffl_status TEXT NOT NULL DEFAULT 'not_applicable', account_status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS game_categories (id TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS regions (id TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS listings (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, price REAL NOT NULL, game_category TEXT NOT NULL, region TEXT, condition TEXT, seller_id TEXT NOT NULL, is_firearm INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', image_url TEXT, guntab_listing_type TEXT NOT NULL DEFAULT 'other_non_regulated', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (seller_id) REFERENCES users(id))`,
    `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, order_number TEXT UNIQUE NOT NULL, listing_id TEXT NOT NULL, buyer_id TEXT NOT NULL, seller_id TEXT NOT NULL, item_title TEXT NOT NULL, item_category TEXT, item_condition TEXT, item_price REAL NOT NULL, shipping_fee REAL NOT NULL DEFAULT 0, platform_fee REAL NOT NULL DEFAULT 0, total REAL NOT NULL, status TEXT NOT NULL, shipping_name TEXT, shipping_address TEXT, shipping_city TEXT, shipping_state TEXT, shipping_zip TEXT, ffl_name TEXT, ffl_address TEXT, tracking_number TEXT, payment_provider TEXT, provider_transaction_id TEXT, provider_checkout_url TEXT, provider_status TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, completed_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS offers (id TEXT PRIMARY KEY, listing_id TEXT NOT NULL, buyer_id TEXT NOT NULL, seller_id TEXT NOT NULL, amount REAL NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, order_id TEXT UNIQUE NOT NULL, seller_id TEXT NOT NULL, buyer_id TEXT NOT NULL, rating INTEGER NOT NULL, comment TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS market_comparables (id TEXT PRIMARY KEY, source_name TEXT NOT NULL, source_id TEXT NOT NULL, source_url TEXT NOT NULL, product_title TEXT NOT NULL, category TEXT NOT NULL, item_condition TEXT, accessories TEXT, sale_price REAL NOT NULL, sold_at TEXT NOT NULL, researched_at TEXT NOT NULL, UNIQUE(source_name, source_id))`,
    `CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, listing_id TEXT, order_id TEXT, buyer_id TEXT NOT NULL, seller_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(listing_id, buyer_id, seller_id))`,
    `CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, sender_id TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, read_at TEXT, FOREIGN KEY (conversation_id) REFERENCES conversations(id))`,
    `CREATE TABLE IF NOT EXISTS disputes (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, opened_by TEXT NOT NULL, reason TEXT NOT NULL, details TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', resolution TEXT, assigned_to TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, resolved_at TEXT, UNIQUE(order_id))`,
    `CREATE TABLE IF NOT EXISTS moderation_reports (id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, reason TEXT NOT NULL, details TEXT, status TEXT NOT NULL DEFAULT 'open', resolution TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS verification_requests (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, verification_type TEXT NOT NULL, provider TEXT NOT NULL, reference_id TEXT, status TEXT NOT NULL DEFAULT 'pending', submitted_at TEXT NOT NULL, reviewed_at TEXT, notes TEXT, UNIQUE(user_id, verification_type))`,
    `CREATE TABLE IF NOT EXISTS policy_acceptances (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, policy_key TEXT NOT NULL, policy_version TEXT NOT NULL, accepted_at TEXT NOT NULL, ip_address TEXT, UNIQUE(user_id, policy_key, policy_version))`,
    `CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, actor_id TEXT, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, metadata TEXT, created_at TEXT NOT NULL)`,
  ];
  for (const statement of statements) await runQuery(statement);
  await ensureColumn("users", "guntab_email", "TEXT");
  await ensureColumn("users", "identity_status", "TEXT NOT NULL DEFAULT 'unverified'");
  await ensureColumn("users", "ffl_status", "TEXT NOT NULL DEFAULT 'not_applicable'");
  await ensureColumn("users", "account_status", "TEXT NOT NULL DEFAULT 'active'");
  await ensureColumn("listings", "image_url", "TEXT");
  await ensureColumn("listings", "guntab_listing_type", "TEXT NOT NULL DEFAULT 'other_non_regulated'");
  await ensureColumn("orders", "payment_provider", "TEXT");
  await ensureColumn("orders", "provider_transaction_id", "TEXT");
  await ensureColumn("orders", "provider_checkout_url", "TEXT");
  await ensureColumn("orders", "provider_status", "TEXT");
  const categories = [["waterfowl", "Waterfowl"], ["big-game", "Big Game"], ["turkey", "Turkey"], ["upland-bird", "Upland Bird"], ["small-game-varmint", "Small Game & Varmint"], ["bowhunting", "Bowhunting"], ["technical-apparel", "Technical Apparel"]];
  const regions = ["Northeast", "Southeast", "Midwest", "West/Rockies", "Southwest", "Pacific NW", "Alaska"];
  for (const [id, name] of categories) await runQuery(`INSERT INTO game_categories (id, name) VALUES (${esc(id)}, ${esc(name)}) ON CONFLICT(id) DO NOTHING`);
  for (const name of regions) await runQuery(`INSERT INTO regions (id, name) VALUES (${esc(name.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}, ${esc(name)}) ON CONFLICT(id) DO NOTHING`);
}

function requireOperationsAdmin(req, res, next) {
  if (!OPERATIONS_ADMIN_KEY || req.headers["x-operations-key"] !== OPERATIONS_ADMIN_KEY) return res.status(403).json({ error: "Operations administrator credentials required" });
  next();
}

async function audit(actorId, action, entityType, entityId, metadata = {}) {
  await runQuery(`INSERT INTO audit_events (id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (${esc(uuidv4())}, ${esc(actorId)}, ${esc(action)}, ${esc(entityType)}, ${esc(entityId)}, ${esc(JSON.stringify(metadata))}, ${esc(new Date().toISOString())})`);
}

function cleanText(value, max = 2000) {
  return String(value || "").trim().slice(0, max);
}

async function ensureColumn(table, column, definition) {
  if (usingNetlifyDatabase) {
    await runQuery(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
  } else {
    const columns = await runQuery(`PRAGMA table_info(${table})`);
    if (!columns.some(existing => existing.name === column)) {
      await runQuery(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
}

async function gunTabRequest(endpoint, { method = "GET", body } = {}) {
  if (!GUNTAB_API_TOKEN) throw new Error("GunTab is not configured");
  const response = await fetch(`${GUNTAB_API_BASE_URL}${endpoint}`, {
    method,
    headers: { Authorization: `Token ${GUNTAB_API_TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.errors) ? data.errors.join(" ") : data.error || "GunTab request failed";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

function internalOrderStatus(providerStatus, providerEvent, currentStatus = "payment_pending") {
  if (["canceled", "expired", "refunded"].includes(providerStatus)) return "cancelled";
  if (providerEvent === "payment_processing_succeeded" || ["pending_outbound_shipment", "pending_pickup_readiness"].includes(providerStatus)) return "paid";
  if (["pending_outbound_shipment_delivery", "pending_buyer_inspection_period"].includes(providerStatus)) return "shipped";
  if (["pending_buyer_dispute_review", "pending_seller_dispute_review", "pending_refund_processing", "pending_return_shipment", "pending_return_shipment_delivery"].includes(providerStatus)) return "disputed";
  if (providerStatus === "succeeded") return "completed";
  return currentStatus;
}

function verifyGunTabSignature(req) {
  if (!GUNTAB_WEBHOOK_SECRET || !req.rawBody) return false;
  const parts = Object.fromEntries(String(req.headers["x-guntab-signature-512"] || "").split(",").map(part => part.split("=")));
  const timestamp = Number(parts.t); const provided = String(parts.v || "");
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300 || !/^[a-f0-9]{128}$/i.test(provided)) return false;
  const expected = crypto.createHmac("sha512", GUNTAB_WEBHOOK_SECRET).update(`${timestamp}.${req.rawBody.toString("utf8")}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
}

/* ---------- JWT Middleware ---------- */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

/* ============================================================
   AUTH ENDPOINTS
   ============================================================ */

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, displayName, location } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Email, password, and display name are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await runQuery(`SELECT id FROM users WHERE email = ${esc(email)}`);
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString().replace("T", " ").split(".")[0];
    const loc = location || "";

    // Escape $ signs for SQL as they conflict with libSQL parameter markers
    const safeHash = Buffer.from(passwordHash, 'utf8').toString('hex');

    await runQuery(
      `INSERT INTO users (id, email, password_hash, display_name, location, created_at) VALUES (${esc(id)}, ${esc(email)}, '${safeHash}', ${esc(displayName)}, ${esc(loc)}, ${esc(now)})`
    );

    const token = jwt.sign({ id, email, displayName }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id, email, displayName, location: loc, bio: "", avatarUrl: "", isSeller: false } });
  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const users = await runQuery(`SELECT * FROM users WHERE email = ${esc(email)}`);
    if (!users || users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];
    // Restore $ signs from escaped double-dollar format
    const storedHash = Buffer.from(user.password_hash, 'hex').toString('utf8');
    const valid = await bcrypt.compare(password, storedHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, displayName: user.display_name }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        location: user.location || "",
        bio: user.bio || "",
        avatarUrl: user.avatar_url || "",
        isSeller: user.is_seller === 1,
        gunTabEmail: user.guntab_email || "",
        identityStatus: user.identity_status || "unverified",
        fflStatus: user.ffl_status || "not_applicable",
        accountStatus: user.account_status || "active",
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const users = await runQuery(`SELECT * FROM users WHERE id = ${esc(req.user.id)}`);
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const u = users[0];
    res.json({
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      location: u.location || "",
      bio: u.bio || "",
      avatarUrl: u.avatar_url || "",
      isSeller: u.is_seller === 1,
      gunTabEmail: u.guntab_email || "",
      identityStatus: u.identity_status || "unverified",
      fflStatus: u.ffl_status || "not_applicable",
      accountStatus: u.account_status || "active",
    });
  } catch (e) {
    console.error("Get profile error:", e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/auth/me
app.put("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const { displayName, location, bio, avatarUrl, gunTabEmail } = req.body;
    const updates = [];
    if (displayName !== undefined) updates.push(`display_name = ${esc(displayName)}`);
    if (location !== undefined) updates.push(`location = ${esc(location)}`);
    if (bio !== undefined) updates.push(`bio = ${esc(bio)}`);
    if (avatarUrl !== undefined) updates.push(`avatar_url = ${esc(avatarUrl)}`);
    if (gunTabEmail !== undefined) {
      const normalized = String(gunTabEmail).trim().toLowerCase();
      if (normalized && !/^\S+@\S+\.\S+$/.test(normalized)) return res.status(400).json({ error: "Enter a valid GunTab account email" });
      updates.push(`guntab_email = ${esc(normalized)}`);
    }

    if (updates.length > 0) {
      await runQuery(`UPDATE users SET ${updates.join(", ")} WHERE id = ${esc(req.user.id)}`);
    }

    const users = await runQuery(`SELECT * FROM users WHERE id = ${esc(req.user.id)}`);
    const u = users[0];
    res.json({
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      location: u.location || "",
      bio: u.bio || "",
      avatarUrl: u.avatar_url || "",
      isSeller: u.is_seller === 1,
      gunTabEmail: u.guntab_email || "",
      identityStatus: u.identity_status || "unverified",
      fflStatus: u.ffl_status || "not_applicable",
      accountStatus: u.account_status || "active",
    });
  } catch (e) {
    console.error("Update profile error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   LISTING CRUD ENDPOINTS
   ============================================================ */

// GET /api/listings — public
app.get("/api/listings", async (req, res) => {
  try {
    const { category, region } = req.query;
    let sql = "SELECT listings.*, users.display_name AS seller_name FROM listings LEFT JOIN users ON users.id = listings.seller_id WHERE listings.status = 'active'";
    if (category) sql += ` AND listings.game_category = ${esc(category)}`;
    if (region) sql += ` AND listings.region = ${esc(region)}`;
    sql += " ORDER BY listings.created_at DESC";
    const data = await runQuery(sql);
    res.json(data);
  } catch (e) {
    console.error("Listings error:", e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/listings/mine — authenticated
app.get("/api/listings/mine", authenticateToken, async (req, res) => {
  try {
    const data = await runQuery(`SELECT * FROM listings WHERE seller_id = ${esc(req.user.id)} ORDER BY created_at DESC`);
    res.json(data);
  } catch (e) {
    console.error("My listings error:", e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/listings — authenticated
app.post("/api/listings", authenticateToken, async (req, res) => {
  try {
    const { title, description, price, game_category, region, condition, isFirearm, imageUrl, gunTabListingType } = req.body;
    if (!title || !price || !game_category) {
      return res.status(400).json({ error: "Title, price, and category are required" });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return res.status(400).json({ error: "Price must be greater than zero" });
    const listingType = gunTabListingType || "other_non_regulated";
    if (!GUNTAB_LISTING_TYPES.has(listingType)) return res.status(400).json({ error: "Choose a valid GunTab merchandise type" });
    if (isFirearm && listingType === "other_non_regulated") return res.status(400).json({ error: "Choose the specific regulated firearm type" });
    if (imageUrl) { try { new URL(imageUrl); } catch { return res.status(400).json({ error: "Photo must be a valid public URL" }); } }
    const id = uuidv4();
    const now = new Date().toISOString().replace("T", " ").split(".")[0];
    const desc = description || "";
    const cond = condition || "new";
    const firearm = isFirearm ? 1 : 0;

    await runQuery(
      `INSERT INTO listings (id, title, description, price, game_category, region, condition, seller_id, is_firearm, image_url, guntab_listing_type, created_at, updated_at) VALUES (${esc(id)}, ${esc(title)}, ${esc(desc)}, ${numericPrice}, ${esc(game_category)}, ${esc(region || "")}, ${esc(cond)}, ${esc(req.user.id)}, ${firearm}, ${esc(imageUrl || "")}, ${esc(listingType)}, ${esc(now)}, ${esc(now)})`
    );

    const listing = await runQuery(`SELECT * FROM listings WHERE id = ${esc(id)}`);
    res.status(201).json(listing[0]);
  } catch (e) {
    console.error("Create listing error:", e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/listings/:id — owner only
app.put("/api/listings/:id", authenticateToken, async (req, res) => {
  try {
    const listings = await runQuery(`SELECT * FROM listings WHERE id = ${esc(req.params.id)}`);
    if (!listings || listings.length === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }
    const listing = listings[0];
    if (listing.seller_id !== req.user.id) {
      return res.status(403).json({ error: "You can only edit your own listings" });
    }

    const { title, description, price, game_category, region, condition, isFirearm } = req.body;
    const updates = [];
    if (title !== undefined) updates.push(`title = ${esc(title)}`);
    if (description !== undefined) updates.push(`description = ${esc(description)}`);
    if (price !== undefined) updates.push(`price = ${esc(price)}`);
    if (game_category !== undefined) updates.push(`game_category = ${esc(game_category)}`);
    if (region !== undefined) updates.push(`region = ${esc(region)}`);
    if (condition !== undefined) updates.push(`condition = ${esc(condition)}`);
    if (isFirearm !== undefined) updates.push(`is_firearm = ${isFirearm ? 1 : 0}`);

    const now = new Date().toISOString().replace("T", " ").split(".")[0];
    updates.push(`updated_at = ${esc(now)}`);

    await runQuery(`UPDATE listings SET ${updates.join(", ")} WHERE id = ${esc(req.params.id)}`);

    const updated = await runQuery(`SELECT * FROM listings WHERE id = ${esc(req.params.id)}`);
    res.json(updated[0]);
  } catch (e) {
    console.error("Update listing error:", e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/listings/:id — owner only
app.delete("/api/listings/:id", authenticateToken, async (req, res) => {
  try {
    const listings = await runQuery(`SELECT * FROM listings WHERE id = ${esc(req.params.id)}`);
    if (!listings || listings.length === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }
    if (listings[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own listings" });
    }
    await runQuery(`DELETE FROM listings WHERE id = ${esc(req.params.id)}`);
    res.json({ success: true });
  } catch (e) {
    console.error("Delete listing error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   OFFERS, ORDERS, FULFILLMENT, AND VERIFIED REVIEWS
   ============================================================ */
app.post("/api/listings/:id/offers", authenticateToken, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const listings = await runQuery(`SELECT * FROM listings WHERE id = ${esc(req.params.id)}`);
    if (!listings?.length) return res.status(404).json({ error: "Listing not found" });
    const listing = listings[0];
    if (listing.seller_id === req.user.id) return res.status(400).json({ error: "You cannot make an offer on your own listing" });
    const comps = await runQuery(`SELECT item_price, item_title, item_condition, completed_at FROM orders WHERE status = 'completed' AND item_category = ${esc(listing.game_category)} UNION ALL SELECT sale_price AS item_price, product_title AS item_title, item_condition, sold_at AS completed_at FROM market_comparables WHERE category = ${esc(listing.game_category)} ORDER BY completed_at DESC`);
    const titleWords = new Set(String(listing.title).toLowerCase().split(/\W+/).filter(word => word.length > 2));
    const comparable = comps.filter(comp => String(comp.item_title).toLowerCase().split(/\W+/).filter(word => titleWords.has(word)).length >= 2).slice(0, 20);
    if (comparable.length < 3) return res.status(409).json({ error: "A market-price offer is unavailable until at least three attributable comparable sales exist" });
    const prices = comparable.map(comp => Number(comp.item_price)).sort((a, b) => a - b);
    const marketPrice = prices.length % 2 ? prices[Math.floor(prices.length / 2)] : (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2;
    if (!Number.isFinite(amount) || Math.abs(amount - marketPrice) > 0.01) return res.status(400).json({ error: "The offer must match the current Hunter's Cache market estimate" });
    const id = uuidv4();
    const now = new Date().toISOString();
    await runQuery(`INSERT INTO offers (id, listing_id, buyer_id, seller_id, amount, status, created_at, updated_at) VALUES (${esc(id)}, ${esc(listing.id)}, ${esc(req.user.id)}, ${esc(listing.seller_id)}, ${amount}, 'pending', ${esc(now)}, ${esc(now)})`);
    res.status(201).json({ id, listingId: listing.id, amount, status: "pending", createdAt: now });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/listings/:id/market-price", async (req, res) => {
  try {
    const listings = await runQuery(`SELECT * FROM listings WHERE id = ${esc(req.params.id)}`);
    if (!listings?.length) return res.status(404).json({ error: "Listing not found" });
    const listing = listings[0];
    const rows = await runQuery(`SELECT order_number AS source_id, 'Hunter''s Cache' AS source_name, NULL AS source_url, item_title, item_condition, NULL AS accessories, item_price, completed_at FROM orders WHERE status = 'completed' AND item_category = ${esc(listing.game_category)} UNION ALL SELECT source_id, source_name, source_url, product_title AS item_title, item_condition, accessories, sale_price AS item_price, sold_at AS completed_at FROM market_comparables WHERE category = ${esc(listing.game_category)} ORDER BY completed_at DESC`);
    const titleWords = new Set(String(listing.title).toLowerCase().split(/\W+/).filter(word => word.length > 2));
    const comps = rows.filter(row => String(row.item_title).toLowerCase().split(/\W+/).filter(word => titleWords.has(word)).length >= 2).slice(0, 20);
    if (comps.length < 3) return res.json({ available: false, sampleSize: comps.length, minimumSample: 3, methodology: "Median of comparable completed Hunter's Cache sales with matching category and at least two meaningful title terms.", sources: comps });
    const prices = comps.map(comp => Number(comp.item_price)).sort((a, b) => a - b);
    const estimate = prices.length % 2 ? prices[Math.floor(prices.length / 2)] : (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2;
    const confidence = comps.length >= 10 ? "high" : comps.length >= 5 ? "medium" : "low";
    res.json({ available: true, estimate: Number(estimate.toFixed(2)), sampleSize: comps.length, confidence, methodology: "Median of comparable completed Hunter's Cache sales with matching category and at least two meaningful title terms.", sources: comps });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/market-comparables", async (req, res) => {
  try {
    if (!MARKET_DATA_ADMIN_KEY || req.headers["x-market-data-key"] !== MARKET_DATA_ADMIN_KEY) return res.status(403).json({ error: "Market-data administrator credentials required" });
    const { sourceName, sourceId, sourceUrl, productTitle, category, condition, accessories, salePrice, soldAt } = req.body;
    if (!sourceName || !sourceId || !sourceUrl || !productTitle || !category || !soldAt || !Number.isFinite(Number(salePrice)) || Number(salePrice) <= 0) return res.status(400).json({ error: "Source, product, category, positive sale price, and sold date are required" });
    let parsedUrl;
    try { parsedUrl = new URL(sourceUrl); } catch { return res.status(400).json({ error: "A valid source URL is required" }); }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return res.status(400).json({ error: "Source URL must use HTTP or HTTPS" });
    const id = uuidv4();
    const researchedAt = new Date().toISOString();
    await runQuery(`INSERT INTO market_comparables (id, source_name, source_id, source_url, product_title, category, item_condition, accessories, sale_price, sold_at, researched_at) VALUES (${esc(id)}, ${esc(sourceName)}, ${esc(sourceId)}, ${esc(sourceUrl)}, ${esc(productTitle)}, ${esc(category)}, ${esc(condition || "")}, ${esc(accessories || "")}, ${Number(salePrice)}, ${esc(soldAt)}, ${esc(researchedAt)})`);
    res.status(201).json({ id, sourceName, sourceId, sourceUrl, productTitle, category, condition: condition || "", accessories: accessories || "", salePrice: Number(salePrice), soldAt, researchedAt });
  } catch (e) {
    if (String(e.message).toLowerCase().includes("unique")) return res.status(409).json({ error: "This source sale is already recorded" });
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/offers/selling", authenticateToken, async (req, res) => {
  try { res.json(await runQuery(`SELECT * FROM offers WHERE seller_id = ${esc(req.user.id)} ORDER BY created_at DESC`)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/offers/:id", authenticateToken, async (req, res) => {
  try {
    const offers = await runQuery(`SELECT * FROM offers WHERE id = ${esc(req.params.id)}`);
    if (!offers?.length) return res.status(404).json({ error: "Offer not found" });
    if (offers[0].seller_id !== req.user.id) return res.status(403).json({ error: "Only the seller can respond to this offer" });
    const status = req.body.status;
    if (!["accepted", "declined"].includes(status)) return res.status(400).json({ error: "Status must be accepted or declined" });
    await runQuery(`UPDATE offers SET status = ${esc(status)}, updated_at = ${esc(new Date().toISOString())} WHERE id = ${esc(req.params.id)}`);
    res.json({ ...offers[0], status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/orders", authenticateToken, async (req, res) => {
  try {
    const listings = await runQuery(`SELECT listings.*, users.guntab_email AS seller_guntab_email FROM listings JOIN users ON users.id = listings.seller_id WHERE listings.id = ${esc(req.body.listingId)}`);
    if (!listings?.length) return res.status(404).json({ error: "Listing not found" });
    const listing = listings[0];
    if (listing.seller_id === req.user.id) return res.status(400).json({ error: "You cannot buy your own listing" });
    if (listing.status !== "active") return res.status(409).json({ error: "This listing is no longer available" });
    if (!PAYMENT_CONFIGURED) return res.status(503).json({ error: "Purchases are not available yet. Online checkout is disabled during the beta while payment provider identity verification is pending." });
    if (!listing.seller_guntab_email) return res.status(409).json({ error: "This seller must connect the verified email on their GunTab account before checkout" });
    if (Number(listing.is_firearm) === 1 && (!FIREARM_CHECKOUT_ENABLED || !FFL_API_KEY)) return res.status(503).json({ error: "Firearm checkout is not live until processor and FFL verification are configured" });
    const shipping = req.body.shipping || {};
    if (Number(listing.is_firearm) !== 1 && (!shipping.name || !shipping.address || !shipping.city || !shipping.state || !shipping.zip)) return res.status(400).json({ error: "A complete shipping address is required" });
    const selectedFfl = req.body.ffl || {};
    if (Number(listing.is_firearm) === 1 && !selectedFfl.licenseNumber) return res.status(400).json({ error: "Select a verified FFL with a valid license number" });
    const id = uuidv4();
    const orderNumber = `HC-${Date.now().toString(36).toUpperCase()}`;
    const itemPrice = Number(listing.price);
    const shippingFee = 12.99;
    const priorSales = await runQuery(`SELECT COUNT(*) AS count FROM orders WHERE seller_id = ${esc(listing.seller_id)} AND status = 'completed'`);
    const platformFee = Number(priorSales[0]?.count || 0) === 0 ? 0 : Math.min(itemPrice * 0.05, 250);
    const total = itemPrice + shippingFee;
    const now = new Date().toISOString();
    const payload = {
      buyer_email: req.user.email,
      buyer_email_notifications_disabled: true,
      seller_email: listing.seller_guntab_email,
      seller_order_id: orderNumber,
      merchandise_amount_cents: Math.round(itemPrice * 100),
      shipping_amount_cents: Math.round(shippingFee * 100),
      marketplace_seller_fee_amount_cents: Math.round(platformFee * 100),
      payment_method_convenience_fee_paid_by: "buyer",
      service_fee_paid_by: "seller",
      fulfillment_method: "shipment",
      platform_confirmation_required: true,
      listings: [{ external_id: listing.id, listing_type_id: listing.guntab_listing_type || "other_non_regulated", quantity: 1, title: String(listing.title).slice(0, 80), description: String(listing.description || `${listing.title} listed on Hunter's Cache`).padEnd(50, ".").slice(0, 10000), amount_cents: Math.round(itemPrice * 100) }],
    };
    if (PUBLIC_APP_URL.startsWith("https://")) payload.redirect_url = `${PUBLIC_APP_URL}/?checkout=complete&order=${encodeURIComponent(orderNumber)}`;
    if (Number(listing.is_firearm) === 1) payload.receiving_ffl_license_number = selectedFfl.licenseNumber;
    const invoice = await gunTabRequest("/invoices", { method: "POST", body: payload });
    await runQuery(`INSERT INTO orders (id, order_number, listing_id, buyer_id, seller_id, item_title, item_category, item_condition, item_price, shipping_fee, platform_fee, total, status, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, ffl_name, ffl_address, payment_provider, provider_transaction_id, provider_checkout_url, provider_status, created_at, updated_at) VALUES (${esc(id)}, ${esc(orderNumber)}, ${esc(listing.id)}, ${esc(req.user.id)}, ${esc(listing.seller_id)}, ${esc(listing.title)}, ${esc(listing.game_category)}, ${esc(listing.condition)}, ${itemPrice}, ${shippingFee}, ${platformFee}, ${total}, 'payment_pending', ${esc(shipping.name)}, ${esc(shipping.address)}, ${esc(shipping.city)}, ${esc(shipping.state)}, ${esc(shipping.zip)}, ${esc(req.body.ffl?.name)}, ${esc(req.body.ffl?.addr)}, 'guntab', ${esc(invoice.id)}, ${esc(invoice.response_url)}, ${esc(invoice.status)}, ${esc(now)}, ${esc(now)})`);
    await runQuery(`UPDATE listings SET status = 'reserved', updated_at = ${esc(now)} WHERE id = ${esc(listing.id)}`);
    const confirmed = await gunTabRequest(`/invoices/${encodeURIComponent(invoice.id)}/platform_confirmations`, { method: "POST", body: {} });
    await runQuery(`UPDATE orders SET provider_status = ${esc(confirmed.status || invoice.status)}, updated_at = ${esc(new Date().toISOString())} WHERE id = ${esc(id)}`);
    await audit(req.user.id, "checkout.created", "order", id, { provider: "guntab", invoiceId: invoice.id, platformFee });
    res.status(201).json({ id, orderNumber, listingId: listing.id, status: "payment_pending", total, platformFee, checkoutUrl: confirmed.response_url || invoice.response_url, provider: "guntab", providerLive: invoice.live === true, message: "Your order is reserved. Continue to GunTab to review and pay." });
  } catch (e) { res.status(e.status && e.status < 500 ? e.status : 502).json({ error: e.message }); }
});

app.get("/api/providers/status", (_req, res) => {
  res.json({
    database: usingNetlifyDatabase ? "netlify-postgres" : "sqlite",
    payment: { provider: "guntab", configured: PAYMENT_CONFIGURED, mode: process.env.NODE_ENV === "production" ? "production" : "development", sellerAccountRequired: true },
    ffl: { provider: "fflapi", configured: Boolean(FFL_API_KEY), firearmCheckoutEnabled: FIREARM_CHECKOUT_ENABLED && Boolean(FFL_API_KEY) && PAYMENT_CONFIGURED },
    marketDataImport: { configured: Boolean(MARKET_DATA_ADMIN_KEY) },
  });
});

app.post("/api/orders/:id/sync", authenticateToken, async (req, res) => {
  try {
    const orders = await runQuery(`SELECT * FROM orders WHERE id = ${esc(req.params.id)}`);
    if (!orders?.length) return res.status(404).json({ error: "Order not found" });
    const order = orders[0];
    if (![order.buyer_id, order.seller_id].includes(req.user.id)) return res.status(403).json({ error: "Not authorized for this order" });
    if (order.payment_provider !== "guntab" || !order.provider_transaction_id) return res.status(409).json({ error: "This order has no GunTab invoice" });
    const invoice = await gunTabRequest(`/invoices/${encodeURIComponent(order.provider_transaction_id)}`);
    const status = internalOrderStatus(invoice.status, null, order.status);
    await runQuery(`UPDATE orders SET status = ${esc(status)}, provider_status = ${esc(invoice.status)}, provider_checkout_url = ${esc(invoice.response_url || order.provider_checkout_url)}, updated_at = ${esc(new Date().toISOString())}, completed_at = ${status === "completed" ? esc(new Date().toISOString()) : "completed_at"} WHERE id = ${esc(order.id)}`);
    if (["cancelled"].includes(status)) await runQuery(`UPDATE listings SET status = 'active', updated_at = ${esc(new Date().toISOString())} WHERE id = ${esc(order.listing_id)}`);
    if (["paid", "shipped", "completed"].includes(status)) await runQuery(`UPDATE listings SET status = 'sold', updated_at = ${esc(new Date().toISOString())} WHERE id = ${esc(order.listing_id)}`);
    res.json({ orderId: order.id, status, provider: "guntab", providerStatus: invoice.status, checkoutUrl: invoice.response_url || order.provider_checkout_url, live: invoice.live === true });
  } catch (e) { res.status(e.status && e.status < 500 ? e.status : 502).json({ error: e.message }); }
});

app.post("/api/webhooks/guntab", async (req, res) => {
  try {
    if (!verifyGunTabSignature(req)) return res.status(401).json({ error: "Invalid GunTab signature" });
    const orderNumber = cleanText(req.body.seller_order_id, 100);
    const orders = await runQuery(`SELECT * FROM orders WHERE order_number = ${esc(orderNumber)}`);
    if (!orders.length) return res.status(202).json({ received: true, matched: false });
    const order = orders[0]; const now = new Date().toISOString();
    const status = internalOrderStatus(req.body.status, req.body.event, order.status);
    await runQuery(`UPDATE orders SET status = ${esc(status)}, provider_status = ${esc(req.body.status)}, updated_at = ${esc(now)}, completed_at = ${status === "completed" ? esc(now) : "completed_at"} WHERE id = ${esc(order.id)}`);
    if (status === "cancelled") await runQuery(`UPDATE listings SET status = 'active', updated_at = ${esc(now)} WHERE id = ${esc(order.listing_id)}`);
    if (["paid", "shipped", "completed"].includes(status)) await runQuery(`UPDATE listings SET status = 'sold', updated_at = ${esc(now)} WHERE id = ${esc(order.listing_id)}`);
    await audit(null, "payment.webhook", "order", order.id, { event: req.body.event, providerStatus: req.body.status, transactionId: req.body.transaction_id });
    res.json({ received: true, matched: true, orderId: order.id, status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/ffl/search", async (req, res) => {
  try {
    if (!FFL_API_KEY) return res.status(503).json({ error: "FFL lookup provider is not configured" });
    const zipcode = String(req.body.zipcode || "").trim();
    const radius = Math.min(Math.max(Number(req.body.radius || 25), 1), 100);
    if (!/^\d{5}$/.test(zipcode)) return res.status(400).json({ error: "A valid five-digit ZIP code is required" });
    const response = await fetch("https://app.fflapi.com/v1/get-ffl", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", "X-Authorization": FFL_API_KEY },
      body: JSON.stringify({ zipcode, radius: String(radius) }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.message || "FFL provider request failed" });
    res.json(data);
  } catch (e) { res.status(502).json({ error: `FFL lookup failed: ${e.message}` }); }
});

app.get("/api/orders/mine", authenticateToken, async (req, res) => {
  try { res.json(await runQuery(`SELECT * FROM orders WHERE buyer_id = ${esc(req.user.id)} ORDER BY created_at DESC`)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/orders/selling", authenticateToken, async (req, res) => {
  try { res.json(await runQuery(`SELECT * FROM orders WHERE seller_id = ${esc(req.user.id)} ORDER BY created_at DESC`)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/orders/:id/status", authenticateToken, async (req, res) => {
  try {
    const orders = await runQuery(`SELECT * FROM orders WHERE id = ${esc(req.params.id)}`);
    if (!orders?.length) return res.status(404).json({ error: "Order not found" });
    const order = orders[0];
    const next = req.body.status;
    const allowed = { payment_pending: ["paid", "cancelled"], paid: ["shipped", "cancelled"], shipped: ["delivered"], delivered: ["completed", "disputed"] };
    if (order.seller_id !== req.user.id && order.buyer_id !== req.user.id) return res.status(403).json({ error: "Not authorized for this order" });
    if (!allowed[order.status]?.includes(next)) return res.status(400).json({ error: `Cannot move order from ${order.status} to ${next}` });
    if (["paid", "shipped"].includes(next) && order.seller_id !== req.user.id) return res.status(403).json({ error: "Only the seller can perform this update" });
    if (["delivered", "completed", "disputed"].includes(next) && order.buyer_id !== req.user.id) return res.status(403).json({ error: "Only the buyer can perform this update" });
    const tracking = next === "shipped" ? req.body.trackingNumber : order.tracking_number;
    if (next === "shipped" && !tracking) return res.status(400).json({ error: "Tracking number is required" });
    if (next === "shipped" && order.payment_provider === "guntab" && order.provider_transaction_id) {
      const invoice = await gunTabRequest(`/invoices/${encodeURIComponent(order.provider_transaction_id)}/fulfillments`, { method: "POST", body: { tracking_code: tracking } });
      await runQuery(`UPDATE orders SET provider_status = ${esc(invoice.status || order.provider_status)} WHERE id = ${esc(order.id)}`);
    }
    const now = new Date().toISOString();
    await runQuery(`UPDATE orders SET status = ${esc(next)}, tracking_number = ${esc(tracking)}, updated_at = ${esc(now)}, completed_at = ${next === "completed" ? esc(now) : "completed_at"} WHERE id = ${esc(order.id)}`);
    await audit(req.user.id, `order.${next}`, "order", order.id, { trackingNumber: tracking || null });
    res.json({ ...order, status: next, tracking_number: tracking, updated_at: now });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ============================================================
   MESSAGING, DISPUTES, VERIFICATION, MODERATION, AND OPERATIONS
   ============================================================ */
app.post("/api/conversations", authenticateToken, async (req, res) => {
  try {
    const listingId = cleanText(req.body.listingId, 100);
    const listings = await runQuery(`SELECT * FROM listings WHERE id = ${esc(listingId)}`);
    if (!listings?.length) return res.status(404).json({ error: "Listing not found" });
    const listing = listings[0];
    if (listing.seller_id === req.user.id) return res.status(400).json({ error: "Sellers cannot start buyer conversations on their own listing" });
    let rows = await runQuery(`SELECT * FROM conversations WHERE listing_id = ${esc(listing.id)} AND buyer_id = ${esc(req.user.id)} AND seller_id = ${esc(listing.seller_id)}`);
    if (!rows.length) {
      const id = uuidv4(); const now = new Date().toISOString();
      await runQuery(`INSERT INTO conversations (id, listing_id, buyer_id, seller_id, created_at, updated_at) VALUES (${esc(id)}, ${esc(listing.id)}, ${esc(req.user.id)}, ${esc(listing.seller_id)}, ${esc(now)}, ${esc(now)})`);
      rows = await runQuery(`SELECT * FROM conversations WHERE id = ${esc(id)}`);
    }
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/conversations", authenticateToken, async (req, res) => {
  try {
    const rows = await runQuery(`SELECT conversations.*, listings.title AS listing_title, buyer.display_name AS buyer_name, seller.display_name AS seller_name, (SELECT body FROM messages WHERE conversation_id = conversations.id ORDER BY created_at DESC LIMIT 1) AS last_message FROM conversations LEFT JOIN listings ON listings.id = conversations.listing_id JOIN users buyer ON buyer.id = conversations.buyer_id JOIN users seller ON seller.id = conversations.seller_id WHERE conversations.buyer_id = ${esc(req.user.id)} OR conversations.seller_id = ${esc(req.user.id)} ORDER BY conversations.updated_at DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/conversations/:id/messages", authenticateToken, async (req, res) => {
  try {
    const conversations = await runQuery(`SELECT * FROM conversations WHERE id = ${esc(req.params.id)}`);
    if (!conversations.length) return res.status(404).json({ error: "Conversation not found" });
    const conversation = conversations[0];
    if (![conversation.buyer_id, conversation.seller_id].includes(req.user.id)) return res.status(403).json({ error: "Not authorized" });
    await runQuery(`UPDATE messages SET read_at = ${esc(new Date().toISOString())} WHERE conversation_id = ${esc(conversation.id)} AND sender_id != ${esc(req.user.id)} AND read_at IS NULL`);
    res.json(await runQuery(`SELECT messages.*, users.display_name AS sender_name FROM messages JOIN users ON users.id = messages.sender_id WHERE conversation_id = ${esc(conversation.id)} ORDER BY messages.created_at ASC`));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/conversations/:id/messages", authenticateToken, async (req, res) => {
  try {
    const body = cleanText(req.body.body, 2000);
    if (!body) return res.status(400).json({ error: "Message cannot be empty" });
    const conversations = await runQuery(`SELECT * FROM conversations WHERE id = ${esc(req.params.id)}`);
    if (!conversations.length) return res.status(404).json({ error: "Conversation not found" });
    const conversation = conversations[0];
    if (![conversation.buyer_id, conversation.seller_id].includes(req.user.id)) return res.status(403).json({ error: "Not authorized" });
    const id = uuidv4(); const now = new Date().toISOString();
    await runQuery(`INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES (${esc(id)}, ${esc(conversation.id)}, ${esc(req.user.id)}, ${esc(body)}, ${esc(now)})`);
    await runQuery(`UPDATE conversations SET updated_at = ${esc(now)} WHERE id = ${esc(conversation.id)}`);
    await audit(req.user.id, "message.sent", "conversation", conversation.id);
    res.status(201).json({ id, conversationId: conversation.id, senderId: req.user.id, body, createdAt: now });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/orders/:id/disputes", authenticateToken, async (req, res) => {
  try {
    const orders = await runQuery(`SELECT * FROM orders WHERE id = ${esc(req.params.id)}`);
    if (!orders.length) return res.status(404).json({ error: "Order not found" });
    const order = orders[0];
    if (![order.buyer_id, order.seller_id].includes(req.user.id)) return res.status(403).json({ error: "Not authorized" });
    const reason = cleanText(req.body.reason, 100); const details = cleanText(req.body.details, 3000);
    if (!reason || details.length < 20) return res.status(400).json({ error: "Choose a reason and provide at least 20 characters of detail" });
    const id = uuidv4(); const now = new Date().toISOString();
    await runQuery(`INSERT INTO disputes (id, order_id, opened_by, reason, details, created_at, updated_at) VALUES (${esc(id)}, ${esc(order.id)}, ${esc(req.user.id)}, ${esc(reason)}, ${esc(details)}, ${esc(now)}, ${esc(now)})`);
    await runQuery(`UPDATE orders SET status = 'disputed', updated_at = ${esc(now)} WHERE id = ${esc(order.id)}`);
    await audit(req.user.id, "dispute.opened", "dispute", id, { orderId: order.id, reason });
    res.status(201).json({ id, orderId: order.id, status: "open", reason, details, createdAt: now });
  } catch (e) { res.status(String(e.message).toLowerCase().includes("unique") ? 409 : 500).json({ error: String(e.message).toLowerCase().includes("unique") ? "A dispute already exists for this order" : e.message }); }
});

app.get("/api/disputes/mine", authenticateToken, async (req, res) => {
  try { res.json(await runQuery(`SELECT disputes.*, orders.order_number, orders.item_title FROM disputes JOIN orders ON orders.id = disputes.order_id WHERE orders.buyer_id = ${esc(req.user.id)} OR orders.seller_id = ${esc(req.user.id)} ORDER BY disputes.created_at DESC`)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/reports", authenticateToken, async (req, res) => {
  try {
    const targetType = cleanText(req.body.targetType, 30); const targetId = cleanText(req.body.targetId, 100); const reason = cleanText(req.body.reason, 100); const details = cleanText(req.body.details, 2000);
    if (!["listing", "user", "message"].includes(targetType) || !targetId || !reason) return res.status(400).json({ error: "A valid target and reason are required" });
    const id = uuidv4(); const now = new Date().toISOString();
    await runQuery(`INSERT INTO moderation_reports (id, reporter_id, target_type, target_id, reason, details, created_at, updated_at) VALUES (${esc(id)}, ${esc(req.user.id)}, ${esc(targetType)}, ${esc(targetId)}, ${esc(reason)}, ${esc(details)}, ${esc(now)}, ${esc(now)})`);
    await audit(req.user.id, "moderation.reported", targetType, targetId, { reportId: id, reason });
    res.status(201).json({ id, status: "open", createdAt: now });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/verification-requests", authenticateToken, async (req, res) => {
  try {
    const type = cleanText(req.body.type, 30); const provider = cleanText(req.body.provider, 60); const referenceId = cleanText(req.body.referenceId, 200);
    if (!["identity", "ffl"].includes(type) || !provider || !referenceId) return res.status(400).json({ error: "Verification type, provider, and provider reference are required" });
    const id = uuidv4(); const now = new Date().toISOString();
    await runQuery(`INSERT INTO verification_requests (id, user_id, verification_type, provider, reference_id, submitted_at) VALUES (${esc(id)}, ${esc(req.user.id)}, ${esc(type)}, ${esc(provider)}, ${esc(referenceId)}, ${esc(now)}) ON CONFLICT(user_id, verification_type) DO UPDATE SET provider = ${esc(provider)}, reference_id = ${esc(referenceId)}, status = 'pending', submitted_at = ${esc(now)}, reviewed_at = NULL, notes = NULL`);
    await audit(req.user.id, "verification.submitted", "user", req.user.id, { type, provider });
    res.status(201).json({ id, type, provider, status: "pending", submittedAt: now });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/verification-requests/mine", authenticateToken, async (req, res) => {
  try { res.json(await runQuery(`SELECT id, verification_type, provider, status, submitted_at, reviewed_at, notes FROM verification_requests WHERE user_id = ${esc(req.user.id)} ORDER BY submitted_at DESC`)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/policies/:key/accept", authenticateToken, async (req, res) => {
  try {
    const versions = { terms: "2026-10-08", privacy: "2026-10-08", marketplace: "2026-10-08", prohibited_items: "2026-10-08", disputes: "2026-10-08" };
    const version = versions[req.params.key]; if (!version) return res.status(404).json({ error: "Unknown policy" });
    await runQuery(`INSERT INTO policy_acceptances (id, user_id, policy_key, policy_version, accepted_at, ip_address) VALUES (${esc(uuidv4())}, ${esc(req.user.id)}, ${esc(req.params.key)}, ${esc(version)}, ${esc(new Date().toISOString())}, ${esc(req.ip)}) ON CONFLICT(user_id, policy_key, policy_version) DO NOTHING`);
    res.json({ policy: req.params.key, version, accepted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/policies", (_req, res) => {
  res.json({
    versions: { terms: "2026-10-08", privacy: "2026-10-08", marketplace: "2026-10-08", prohibited_items: "2026-10-08", disputes: "2026-10-08" },
    transactionRules: ["Payments must remain on GunTab.", "Sellers must describe condition and included accessories accurately.", "Regulated items must follow GunTab and applicable FFL transfer requirements.", "Tracking is required for shipped orders.", "Buyers may review only sellers from completed purchases."],
    prohibited: ["Stolen goods", "Items prohibited by federal, state, or local law", "Transactions intended to bypass an FFL or required identity checks", "Off-platform payment solicitation", "Fraudulent, counterfeit, or materially misrepresented goods"],
    disputeProcess: ["Contact the other party through marketplace messaging.", "Open one dispute per order with evidence.", "GunTab controls payment holds, refunds, and disbursement decisions for GunTab transactions.", "Hunter's Cache may restrict accounts or listings while reviewing marketplace-policy violations."],
  });
});

app.get("/api/analytics/seller", authenticateToken, async (req, res) => {
  try {
    const [listingCounts, orderTotals, offerCounts, reviewStats] = await Promise.all([
      runQuery(`SELECT status, COUNT(*) AS count FROM listings WHERE seller_id = ${esc(req.user.id)} GROUP BY status`),
      runQuery(`SELECT status, COUNT(*) AS count, COALESCE(SUM(item_price), 0) AS merchandise, COALESCE(SUM(platform_fee), 0) AS fees FROM orders WHERE seller_id = ${esc(req.user.id)} GROUP BY status`),
      runQuery(`SELECT status, COUNT(*) AS count FROM offers WHERE seller_id = ${esc(req.user.id)} GROUP BY status`),
      runQuery(`SELECT COUNT(*) AS count, AVG(rating) AS average FROM reviews WHERE seller_id = ${esc(req.user.id)}`),
    ]);
    res.json({ listingCounts, orderTotals, offerCounts, reviews: { count: Number(reviewStats[0]?.count || 0), average: reviewStats[0]?.average === null ? null : Number(reviewStats[0].average) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/operations/dashboard", requireOperationsAdmin, async (_req, res) => {
  try {
    const [users, listings, orders, reports, disputes, verifications, volume] = await Promise.all([
      runQuery("SELECT account_status AS status, COUNT(*) AS count FROM users GROUP BY account_status"),
      runQuery("SELECT status, COUNT(*) AS count FROM listings GROUP BY status"),
      runQuery("SELECT status, COUNT(*) AS count FROM orders GROUP BY status"),
      runQuery("SELECT status, COUNT(*) AS count FROM moderation_reports GROUP BY status"),
      runQuery("SELECT status, COUNT(*) AS count FROM disputes GROUP BY status"),
      runQuery("SELECT status, COUNT(*) AS count FROM verification_requests GROUP BY status"),
      runQuery("SELECT COALESCE(SUM(item_price),0) AS gross_merchandise_value, COALESCE(SUM(platform_fee),0) AS platform_fees FROM orders WHERE status = 'completed'"),
    ]);
    res.json({ users, listings, orders, reports, disputes, verifications, grossMerchandiseValue: Number(volume[0]?.gross_merchandise_value || 0), earnedPlatformFees: Number(volume[0]?.platform_fees || 0) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/operations/queue", requireOperationsAdmin, async (_req, res) => {
  try {
    const [reports, disputes, verifications] = await Promise.all([
      runQuery("SELECT * FROM moderation_reports WHERE status IN ('open','reviewing') ORDER BY created_at ASC"),
      runQuery("SELECT disputes.*, orders.order_number, orders.item_title FROM disputes JOIN orders ON orders.id = disputes.order_id WHERE disputes.status IN ('open','reviewing') ORDER BY disputes.created_at ASC"),
      runQuery("SELECT verification_requests.*, users.display_name, users.email FROM verification_requests JOIN users ON users.id = verification_requests.user_id WHERE verification_requests.status = 'pending' ORDER BY submitted_at ASC"),
    ]);
    res.json({ reports, disputes, verifications });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/operations/reports/:id", requireOperationsAdmin, async (req, res) => {
  try {
    const status = cleanText(req.body.status, 30); if (!["reviewing", "resolved", "dismissed"].includes(status)) return res.status(400).json({ error: "Invalid report status" });
    await runQuery(`UPDATE moderation_reports SET status = ${esc(status)}, resolution = ${esc(cleanText(req.body.resolution, 2000))}, updated_at = ${esc(new Date().toISOString())} WHERE id = ${esc(req.params.id)}`);
    await audit("operations", "moderation.updated", "report", req.params.id, { status });
    res.json({ id: req.params.id, status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/operations/disputes/:id", requireOperationsAdmin, async (req, res) => {
  try {
    const status = cleanText(req.body.status, 30); if (!["reviewing", "resolved", "dismissed"].includes(status)) return res.status(400).json({ error: "Invalid dispute status" });
    const resolvedAt = ["resolved", "dismissed"].includes(status) ? esc(new Date().toISOString()) : "NULL";
    await runQuery(`UPDATE disputes SET status = ${esc(status)}, resolution = ${esc(cleanText(req.body.resolution, 3000))}, assigned_to = ${esc(cleanText(req.body.assignedTo, 100))}, updated_at = ${esc(new Date().toISOString())}, resolved_at = ${resolvedAt} WHERE id = ${esc(req.params.id)}`);
    await audit("operations", "dispute.updated", "dispute", req.params.id, { status });
    res.json({ id: req.params.id, status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/operations/verifications/:id", requireOperationsAdmin, async (req, res) => {
  try {
    const status = cleanText(req.body.status, 30); if (!["verified", "rejected"].includes(status)) return res.status(400).json({ error: "Status must be verified or rejected" });
    const rows = await runQuery(`SELECT * FROM verification_requests WHERE id = ${esc(req.params.id)}`); if (!rows.length) return res.status(404).json({ error: "Verification request not found" });
    const record = rows[0]; const column = record.verification_type === "ffl" ? "ffl_status" : "identity_status";
    await runQuery(`UPDATE verification_requests SET status = ${esc(status)}, reviewed_at = ${esc(new Date().toISOString())}, notes = ${esc(cleanText(req.body.notes, 1000))} WHERE id = ${esc(record.id)}`);
    await runQuery(`UPDATE users SET ${column} = ${esc(status)} WHERE id = ${esc(record.user_id)}`);
    await audit("operations", "verification.updated", "user", record.user_id, { type: record.verification_type, status });
    res.json({ id: record.id, userId: record.user_id, type: record.verification_type, status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/orders/:id/review", authenticateToken, async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const orders = await runQuery(`SELECT * FROM orders WHERE id = ${esc(req.params.id)}`);
    if (!orders?.length) return res.status(404).json({ error: "Order not found" });
    const order = orders[0];
    if (order.buyer_id !== req.user.id) return res.status(403).json({ error: "Only this order's buyer can review the seller" });
    if (order.status !== "completed") return res.status(400).json({ error: "Reviews require a completed order" });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be from 1 to 5" });
    const existing = await runQuery(`SELECT id FROM reviews WHERE order_id = ${esc(order.id)}`);
    if (existing?.length) return res.status(409).json({ error: "This order already has a review" });
    const id = uuidv4();
    const now = new Date().toISOString();
    await runQuery(`INSERT INTO reviews (id, order_id, seller_id, buyer_id, rating, comment, created_at, updated_at) VALUES (${esc(id)}, ${esc(order.id)}, ${esc(order.seller_id)}, ${esc(req.user.id)}, ${rating}, ${esc(String(req.body.comment || "").slice(0, 1000))}, ${esc(now)}, ${esc(now)})`);
    res.status(201).json({ id, orderId: order.id, sellerId: order.seller_id, rating, comment: String(req.body.comment || "").slice(0, 1000), createdAt: now });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ============================================================
   PUBLIC SELLER PROFILES
   Reviews and completed-sale counts remain zero until the order
   and verified-review tables are introduced.
   ============================================================ */
app.get("/api/sellers/:id", async (req, res) => {
  try {
    const users = await runQuery(
      `SELECT id, display_name, location, bio, avatar_url, created_at FROM users WHERE id = ${esc(req.params.id)}`
    );
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "Seller not found" });
    }

    const listings = await runQuery(
      `SELECT id, title, description, price, game_category, region, condition, is_firearm, seller_id, created_at FROM listings WHERE seller_id = ${esc(req.params.id)} ORDER BY created_at DESC`
    );
    const completed = await runQuery(`SELECT COUNT(*) AS count FROM orders WHERE seller_id = ${esc(req.params.id)} AND status = 'completed'`);
    const reviews = await runQuery(`SELECT reviews.id, reviews.rating, reviews.comment, reviews.created_at, users.display_name AS buyer_display_name FROM reviews JOIN users ON users.id = reviews.buyer_id WHERE reviews.seller_id = ${esc(req.params.id)} ORDER BY reviews.created_at DESC`);
    const seller = users[0];
    const ratingCount = reviews.length;
    const rating = ratingCount ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / ratingCount : null;
    res.json({
      id: seller.id,
      displayName: seller.display_name,
      location: seller.location || "",
      bio: seller.bio || "",
      avatarUrl: seller.avatar_url || "",
      memberSince: seller.created_at || null,
      completedSales: Number(completed?.[0]?.count || 0),
      rating,
      ratingCount,
      reviews: reviews.map(review => ({ id: review.id, rating: Number(review.rating), comment: review.comment, buyerDisplayName: review.buyer_display_name, createdAt: review.created_at })),
      listings: Array.isArray(listings) ? listings : [],
    });
  } catch (e) {
    console.error("Public seller profile error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   EXISTING PUBLIC ENDPOINTS
   ============================================================ */
app.get("/api/categories", async (req, res) => {
  try { res.json(await runQuery("SELECT * FROM game_categories")); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/regions", async (req, res) => {
  try { res.json(await runQuery("SELECT * FROM regions")); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

/* ============================================================
   SPA FALLBACK
   ============================================================ */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

let schemaReady;

function getSchemaReady() {
  if (!schemaReady) schemaReady = ensureMarketplaceSchema();
  return schemaReady;
}

const runningAsServerlessFunction = Boolean(
  process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT,
);

if (!runningAsServerlessFunction) {
  getSchemaReady()
    .then(() => app.listen(port, "0.0.0.0", () => console.log(`Hunter Cache server running at http://0.0.0.0:${port} using ${databasePath}`)))
    .catch(error => { console.error("Database initialization failed:", error); process.exit(1); });
}

export { app, getSchemaReady };
