const SESSIONS = new Map();
const TOKEN_TTL_MS = 15 * 60 * 1000;
const R2_PUBLIC_URL = "https://pub-b3253d89dc4b43b6a25919d6aeedff9a.r2.dev"; // Ganti dengan public R2 URL kamu

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const method = req.method;

    // CORS preflight
    if (method === "OPTIONS") return withCORS(new Response(null, { status: 204 }));

    // Login
    if (url.pathname === "/api/login" && method === "POST") {
      const body = await req.json();
      if (!body?.password || body.password !== env.AUTH_PASSWORD) {
        return withCORS(new Response("Unauthorized", { status: 401 }));
      }
      const token = crypto.randomUUID();
      SESSIONS.set(token, Date.now());
      return withCORS(new Response(JSON.stringify({ token }), {
        headers: { "Content-Type": "application/json" }
      }));
    }

    // Proxy public file access
    if (url.pathname.startsWith("/api/files/")) {
      const path = url.pathname.replace("/api/files/", "");
      const proxyRes = await fetch(`${R2_PUBLIC_URL}/${path}`);
      if (!proxyRes.ok) return withCORS(new Response("File not found", { status: 404 }));
      const content = await proxyRes.arrayBuffer();
      const headers = new Headers(proxyRes.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      return new Response(content, { status: 200, headers });
    }

    // Token validation
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token || !isValidToken(token)) {
      return withCORS(new Response("Unauthorized", { status: 401 }));
    }

    // Upload
    if (url.pathname === "/api/upload" && method === "POST") {
      const formData = await req.formData();
      const file = formData.get("file");
      const folder = formData.get("folder")?.trim();
      const key = folder ? `uploads/${folder}/${file.name}` : `uploads/${file.name}`;
      if (!file) return withCORS(new Response("No file", { status: 400 }));
      const buf = await file.arrayBuffer();
      await env.R2_BUCKET.put(key, buf, {
        httpMetadata: {
          contentType: file.type || "application/octet-stream"
        }
      });
      return withCORS(new Response(JSON.stringify({ file_url: `${R2_PUBLIC_URL}/${key}` }), {
        headers: { "Content-Type": "application/json" }
      }));
    }

    // Create Folder
    if (url.pathname === "/api/create-folder" && method === "POST") {
      const body = await req.json();
      const folder = body.folder?.trim();
      if (!folder) return withCORS(new Response("No folder name", { status: 400 }));
      const key = `uploads/${folder}/.keep`;
      await env.R2_BUCKET.put(key, new ArrayBuffer(0));
      return withCORS(new Response("Folder created"));
    }

    // Create File
    if (url.pathname === "/api/create-file" && method === "POST") {
      const { name, content, folder } = await req.json();
      if (!name || !content) return withCORS(new Response("Missing name or content", { status: 400 }));
      const key = folder ? `uploads/${folder}/${name}` : `uploads/${name}`;
      await env.R2_BUCKET.put(key, new TextEncoder().encode(content), {
        httpMetadata: { contentType: "text/plain" }
      });
      return withCORS(new Response("File created"));
    }

    // List
    if (url.pathname === "/api/list" && method === "GET") {
      const list = await env.R2_BUCKET.list({ prefix: "uploads/" });
      const files = list.objects.map(obj => ({
        name: obj.key,
        url: `${R2_PUBLIC_URL}/${obj.key}`
      }));
      return withCORS(new Response(JSON.stringify(files), {
        headers: { "Content-Type": "application/json" }
      }));
    }

    // Delete
    if (url.pathname === "/api/delete" && method === "DELETE") {
      const file = url.searchParams.get("file");
      if (!file) return withCORS(new Response("Missing file", { status: 400 }));
      await env.R2_BUCKET.delete(file);
      return withCORS(new Response("OK"));
    }

    return withCORS(new Response("Not Found", { status: 404 }));
  }
};

function isValidToken(token) {
  const created = SESSIONS.get(token);
  if (!created) return false;
  if (Date.now() - created > TOKEN_TTL_MS) {
    SESSIONS.delete(token);
    return false;
  }
  return true;
}

function withCORS(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  return res;
}