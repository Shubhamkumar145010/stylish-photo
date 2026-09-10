import "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pg from "pg";
import { jwtVerify } from "jose";
import { z } from "zod";

const { Pool } = pg;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port");
}
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const sensitiveKeys = new Set([
  "aadhaar", "pan", "passport", "drivingLicence", "driving_license",
  "governmentId", "government_id", "biometric", "documentImage",
  "document_image", "idNumber", "id_number", "rawVerificationPayload"
]);

function containsSensitiveKey(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsSensitiveKey);
  return Object.entries(value).some(([key, nested]) =>
    sensitiveKeys.has(key) || containsSensitiveKey(nested)
  );
}

function requireEnvironment() {
  const required = ["DATABASE_URL", "JWT_SECRET", "JWT_ISSUER", "JWT_AUDIENCE"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0 && isProduction) {
    throw new Error(`Missing required production configuration: ${missing.join(", ")}`);
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }
}

function createDatabase() {
  if (!process.env.DATABASE_URL) return null;
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    ssl: isProduction ? { rejectUnauthorized: true } : undefined
  });
}

function jsonError(message, status = 400) {
  return { error: { code: "REQUEST_REJECTED", message, status } };
}

function createAccessTokenVerifier() {
  if (!process.env.JWT_SECRET) {
    return async () => {
      throw new Error("Authentication is not configured");
    };
  }
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return async (token) => {
    const result = await jwtVerify(token, secret, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    });
    const subject = result.payload.sub;
    if (typeof subject !== "string") throw new Error("Token subject is missing");
    return subject;
  };
}

export function createApp({ database = createDatabase(), verifyAccessToken = createAccessTokenVerifier() } = {}) {
  const app = express();
  app.locals.database = database;
  app.disable("x-powered-by");
  app.set("trust proxy", isProduction ? 1 : false);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "no-referrer" }
  }));
  const publicAsset = (fileName, cacheControl) => (_request, response) => {
    response.setHeader("Cache-Control", cacheControl);
    return response.sendFile(path.join(projectRoot, fileName), {
      dotfiles: "deny",
      acceptRanges: false,
      cacheControl: false
    });
  };
  app.get("/", publicAsset("index.html", "no-cache"));
  app.get("/index.html", publicAsset("index.html", "no-cache"));
  app.get("/privacy.html", publicAsset("privacy.html", "no-cache"));
  app.get("/terms.html", publicAsset("terms.html", "no-cache"));
  app.get("/styles.css", publicAsset("styles.css", "public, max-age=3600, immutable"));
  app.get("/script.js", publicAsset("script.js", "public, max-age=3600, immutable"));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"]
  }));
  app.use(express.json({ limit: "32kb", strict: true, type: "application/json" }));
  app.use("/api", (_request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    return next();
  });
  app.use((request, response, next) => {
    response.setHeader("X-Request-ID", request.get("X-Request-ID") || crypto.randomUUID());
    if (containsSensitiveKey(request.body)) {
      return response.status(400).json(jsonError("Sensitive identity documents and numbers are not accepted.", 400));
    }
    return next();
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: jsonError("Too many authentication attempts. Try again later.", 429)
  });
  const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: jsonError("Too many requests. Try again shortly.", 429)
  });

  app.get("/api/health", async (_request, response) => {
    if (!database) return response.status(503).json({ status: "degraded", database: "not_configured" });
    try {
      await database.query("select 1");
      return response.json({ status: "ok", database: "ok" });
    } catch {
      return response.status(503).json({ status: "degraded", database: "unavailable" });
    }
  });

  app.get("/api/ready", async (_request, response) => {
    if (!database) return response.status(503).json({ ready: false, reason: "database_not_configured" });
    try {
      await database.query("select 1");
      return response.json({ ready: true });
    } catch {
      return response.status(503).json({ ready: false, reason: "database_unavailable" });
    }
  });

  app.post("/api/auth/request-otp", authLimiter, async (request, response) => {
    const input = z.object({
      emailOrPhone: z.string().trim().min(3).max(254)
    }).safeParse(request.body);
    if (!input.success) return response.status(400).json(jsonError("Enter a valid email address or phone number."));
    if (!process.env.AUTH_PROVIDER_BASE_URL) {
      return response.status(503).json(jsonError("Authentication provider is not configured.", 503));
    }
    // Production implementation must call the managed provider here.
    // Never log the destination or generate/store OTPs locally.
    return response.status(501).json(jsonError("Managed OTP integration is not enabled yet.", 501));
  });

  async function requireUser(request, response, next) {
    const header = request.get("authorization") || "";
    if (!header.startsWith("Bearer ")) return response.status(401).json(jsonError("Authentication required.", 401));
    try {
      request.userId = await verifyAccessToken(header.slice(7));
      return next();
    } catch {
      return response.status(401).json(jsonError("Authentication required.", 401));
    }
  }

  async function requireModerator(request, response, next) {
    await requireUser(request, response, async () => {
      if (!database) return response.status(503).json(jsonError("Database is not configured.", 503));
      const result = await database.query(
        "select account_role from app_users where id = $1",
        [request.userId]
      );
      if (!["moderator", "admin"].includes(result.rows[0]?.account_role)) {
        return response.status(403).json(jsonError("Moderator access required.", 403));
      }

      app.post("/api/billing/checkout", writeLimiter, requireUser, async (request, response) => {
        const input = z.object({ plan: z.enum(["pro_profile", "local_shop"]) }).safeParse(request.body);
        if (!input.success) return response.status(400).json(jsonError("Invalid plan."));
        if (!process.env.PAYMENT_PROVIDER_BASE_URL) {
          return response.status(503).json(jsonError("Payment provider is not configured.", 503));
        }
        // Use provider-hosted checkout; card data must never enter LocalHelp.
        return response.status(501).json(jsonError("Hosted checkout integration is not enabled yet.", 501));
      });
      return next();
    });
  }

  app.get("/api/professionals", async (request, response) => {
    if (!database) return response.status(503).json(jsonError("Database is not configured.", 503));
    const query = z.object({
      category: z.string().trim().max(40).optional(),
      area: z.string().trim().max(80).optional(),
      limit: z.coerce.number().int().min(1).max(50).default(20)
    }).safeParse(request.query);
    if (!query.success) return response.status(400).json(jsonError("Invalid search filters."));
    const values = [];
    const filters = [];
    if (query.data.category) {
      values.push(query.data.category);
      filters.push(`p.category = $${values.length}`);
    }
    if (query.data.area) {
      values.push(query.data.area);
      filters.push(`p.service_area ILIKE '%' || $${values.length} || '%'`);
    }
    values.push(query.data.limit);
    const where = filters.length ? `where ${filters.join(" and ")}` : "";
    const result = await database.query(
      `select p.id, u.display_name, p.category, p.description, p.service_area,
              p.experience_years, p.availability, p.pricing_summary,
              v.phone_verified, v.email_verified, v.provider_verified
         from professional_profiles p
         join app_users u on u.id = p.user_id
         left join verification_status v on v.user_id = p.user_id
         ${where}
        order by p.created_at desc
        limit $${values.length}`,
      values
    );
    return response.json({ data: result.rows });
  });

  app.post("/api/reports", writeLimiter, requireUser, async (request, response) => {
    const input = z.object({
      subjectUserId: z.string().uuid(),
      reason: z.enum(["scam", "harassment", "impersonation", "unsafe", "other"]),
      details: z.string().trim().max(2000).optional()
    }).safeParse(request.body);
    if (!input.success) return response.status(400).json(jsonError("Invalid report."));
    if (!database) return response.status(503).json(jsonError("Database is not configured.", 503));
    await database.query(
      "insert into moderation_reports (reporter_id, subject_user_id, reason, details) values ($1, $2, $3, $4)",
      [request.userId, input.data.subjectUserId, input.data.reason, input.data.details || null]
    );
    return response.status(201).json({ data: { submitted: true } });
  });

  app.get("/api/moderation/reports", writeLimiter, requireModerator, async (request, response) => {
    const query = z.object({
      status: z.enum(["open", "reviewing", "resolved", "dismissed"]).default("open"),
      limit: z.coerce.number().int().min(1).max(50).default(25)
    }).safeParse(request.query);
    if (!query.success) return response.status(400).json(jsonError("Invalid moderation filters."));
    const result = await database.query(
      `select r.id, r.reporter_id, r.subject_user_id, r.reason, r.details, r.status, r.created_at
         from moderation_reports r
        where r.status = $1
        order by r.created_at asc
        limit $2`,
      [query.data.status, query.data.limit]
    );
    return response.json({ data: result.rows });
  });

  app.patch("/api/moderation/reports/:reportId", writeLimiter, requireModerator, async (request, response) => {
    const reportId = z.string().uuid().safeParse(request.params.reportId);
    const input = z.object({ status: z.enum(["reviewing", "resolved", "dismissed", "suspended"]) }).safeParse(request.body);
    if (!reportId.success || !input.success) return response.status(400).json(jsonError("Invalid moderation action."));
    const nextStatus = input.data.status === "suspended" ? "resolved" : input.data.status;
    const updated = await database.query(
      "update moderation_reports set status = $1 where id = $2 returning id, status",
      [nextStatus, reportId.data]
    );
    if (updated.rowCount === 0) return response.status(404).json(jsonError("Report not found.", 404));
    await database.query(
      "insert into moderation_audit_events (moderator_id, report_id, action) values ($1, $2, $3)",
      [request.userId, reportId.data, input.data.status]
    );
    return response.json({ data: updated.rows[0] });
  });

  app.post("/api/blocks", writeLimiter, requireUser, async (request, response) => {
    const input = z.object({ blockedUserId: z.string().uuid() }).safeParse(request.body);
    if (!input.success || input.data.blockedUserId === request.userId) {
      return response.status(400).json(jsonError("Invalid block request."));
    }
    if (!database) return response.status(503).json(jsonError("Database is not configured.", 503));
    await database.query(
      "insert into user_blocks (blocker_id, blocked_id) values ($1, $2) on conflict do nothing",
      [request.userId, input.data.blockedUserId]
    );
    return response.status(201).json({ data: { blocked: true } });
  });

  app.delete("/api/account", writeLimiter, requireUser, async (request, response) => {
    const confirmation = z.object({ confirmation: z.literal("DELETE_MY_ACCOUNT") }).safeParse(request.body);
    if (!confirmation.success) {
      return response.status(400).json(jsonError("Explicit account deletion confirmation is required."));
    }
    if (!database) return response.status(503).json(jsonError("Database is not configured.", 503));
    const client = await database.connect();
    try {
      await client.query("begin");
      await client.query("delete from app_users where id = $1", [request.userId]);
      await client.query("commit");
      return response.status(204).send();
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  });

  app.post("/api/connections", writeLimiter, requireUser, async (request, response) => {
    const input = z.object({ recipientId: z.string().uuid() }).safeParse(request.body);
    if (!input.success || input.data.recipientId === request.userId) {
      return response.status(400).json(jsonError("Invalid connection request."));
    }
    if (!database) return response.status(503).json(jsonError("Database is not configured.", 503));
    const blocked = await database.query(
      "select 1 from user_blocks where (blocker_id = $1 and blocked_id = $2) or (blocker_id = $2 and blocked_id = $1) limit 1",
      [request.userId, input.data.recipientId]
    );
    if (blocked.rowCount > 0) return response.status(403).json(jsonError("Connection is not available.", 403));
    await database.query(
      "insert into connection_requests (sender_id, recipient_id) values ($1, $2) on conflict (sender_id, recipient_id) do update set status = 'pending', updated_at = now()",
      [request.userId, input.data.recipientId]
    );
    return response.status(201).json({ data: { requested: true } });
  });

  app.post("/api/messages", writeLimiter, requireUser, async (request, response) => {
    const input = z.object({
      recipientId: z.string().uuid(),
      body: z.string().trim().min(1).max(4000)
    }).safeParse(request.body);
    if (!input.success || input.data.recipientId === request.userId) {
      return response.status(400).json(jsonError("Invalid message."));
    }
    if (!database) return response.status(503).json(jsonError("Database is not configured.", 503));
    const blocked = await database.query(
      "select 1 from user_blocks where (blocker_id = $1 and blocked_id = $2) or (blocker_id = $2 and blocked_id = $1) limit 1",
      [request.userId, input.data.recipientId]
    );
    if (blocked.rowCount > 0) return response.status(403).json(jsonError("Messaging is not available.", 403));
    const result = await database.query(
      "insert into messages (sender_id, recipient_id, body) values ($1, $2, $3) returning id, created_at",
      [request.userId, input.data.recipientId, input.data.body]
    );
    return response.status(201).json({ data: result.rows[0] });
  });

  app.use((error, _request, response, _next) => {
    if (error?.message === "Origin is not allowed") return response.status(403).json(jsonError("Origin is not allowed.", 403));
    if (error?.type === "entity.too.large") return response.status(413).json(jsonError("Request is too large.", 413));
    return response.status(500).json(jsonError("Unexpected server error.", 500));
  });
  return app;
}

requireEnvironment();
const app = createApp();
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(port, () => {
    console.log(`LocalHelp API listening on port ${port}`);
  });
  const shutdown = async (signal) => {
    console.log(`Received ${signal}; shutting down safely`);
    server.close(async () => {
      const database = app.locals.database;
      if (database) await database.end();
      process.exit(0);
    });
  };
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}
