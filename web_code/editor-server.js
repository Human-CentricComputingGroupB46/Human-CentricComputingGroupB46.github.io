const http = require("http");
const fs = require("fs");
const path = require("path");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 4173);
const WEB_ROOT = __dirname;
const DATA_FILE = path.join(WEB_ROOT, "data.js");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/save-room-data") {
      const payload = await readJsonBody(req);
      const blocks = payload && typeof payload.blocks === "object" ? payload.blocks : null;

      if (!blocks || typeof blocks.ROOM_DATA !== "string") {
        return sendJson(res, 400, { ok: false, error: "blocks.ROOM_DATA is required" });
      }

      const source = fs.readFileSync(DATA_FILE, "utf8");
      const replacements = {
        GEO_REFERENCE: blocks.GEO_REFERENCE,
        ENTRANCES: blocks.ENTRANCES,
        SERVICE_POINTS: blocks.SERVICE_POINTS,
        WALKABLE_NODES: blocks.WALKABLE_NODES,
        ROOM_DATA: blocks.ROOM_DATA,
      };
      const blockPatterns = {
        GEO_REFERENCE: /const GEO_REFERENCE = \{[\s\S]*?\n\};/m,
        ENTRANCES: /const ENTRANCES = \{[\s\S]*?\n\};/m,
        SERVICE_POINTS: /const SERVICE_POINTS = \[[\s\S]*?\n\];/m,
        WALKABLE_NODES: /const WALKABLE_NODES = \[[\s\S]*?\n\];/m,
        ROOM_DATA: /const ROOM_DATA = \{[\s\S]*?\n\};/m,
      };

      let next = source;
      for (const [constName, block] of Object.entries(replacements)) {
        if (block == null) continue;
        if (typeof block !== "string" || !block.startsWith(`const ${constName} = `)) {
          return sendJson(res, 400, { ok: false, error: `Invalid block for ${constName}` });
        }

        const pattern = blockPatterns[constName];
        if (!pattern.test(next)) {
          return sendJson(res, 400, { ok: false, error: `Failed to locate ${constName} in data.js` });
        }
        next = next.replace(pattern, block);
      }

      fs.writeFileSync(DATA_FILE, next, "utf8");
      return sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() });
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJson(res, 405, { ok: false, error: "Method not allowed" });
    }

    return serveStaticFile(url.pathname, res, req.method === "HEAD");
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { ok: false, error: error.message || "Internal server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`CampusCompass editor server running at http://${HOST}:${PORT}`);
  console.log(`Serving ${WEB_ROOT}`);
});

function serveStaticFile(requestPath, res, headOnly) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const candidatePath = path.normalize(path.join(WEB_ROOT, normalizedPath));

  if (!candidatePath.startsWith(WEB_ROOT)) {
    return sendJson(res, 403, { ok: false, error: "Forbidden" });
  }

  if (!fs.existsSync(candidatePath) || fs.statSync(candidatePath).isDirectory()) {
    return sendJson(res, 404, { ok: false, error: "Not found" });
  }

  const contentType = CONTENT_TYPES[path.extname(candidatePath).toLowerCase()] || "application/octet-stream";
  const body = fs.readFileSync(candidatePath);

  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });

  if (!headOnly) {
    res.end(body);
    return;
  }

  res.end();
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}