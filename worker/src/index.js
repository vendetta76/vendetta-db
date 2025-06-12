const SESSIONS = new Map();
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 menit

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const method = req.method;

    // ===== CORS Preflight
    if (method === "OPTIONS") return withCORS(new Response(null, { status: 204 }));

    // ===== LOGIN
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

    // ===== VALIDASI TOKEN
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token || !isValidToken(token)) {
      return withCORS(new Response("Unauthorized", { status: 401 }));
    }

    // ===== UPLOAD FILE
    if (url.pathname === "/api/upload" && method === "POST") {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file) return withCORS(new Response("No file", { status: 400 }));

      const buf = await file.arrayBuffer();
      const key = `uploads/${file.name}`;
      await env.R2_BUCKET.put(key, buf, {
        httpMetadata: { contentType: file.type }
      });

      return withCORS(new Response(JSON.stringify({
        file_url: `https://${env.R2_BUCKET.bucket_name}.r2.dev/${key}`
      }), { headers: { "Content-Type": "application/json" } }));
    }

    // ===== LIST FILES
    if (url.pathname === "/api/list" && method === "GET") {
      const list = await env.R2_BUCKET.list({ prefix: "uploads/" });
      const files = list.objects.map(obj => ({
        name: obj.key,
        url: `https://${env.R2_BUCKET.bucket_name}.r2.dev/${obj.key}`
      }));
      return withCORS(new Response(JSON.stringify(files), {
        headers: { "Content-Type": "application/json" }
      }));
    }

    // ===== DELETE FILE
    if (url.pathname === "/api/delete" && method === "DELETE") {
      const file = url.searchParams.get("file");
      if (!file) return withCORS(new Response("Missing file", { status: 400 }));
      await env.R2_BUCKET.delete(file);
      return withCORS(new Response("OK"));
    }

    return withCORS(new Response("Not Found", { status: 404 }));
  }
};

// ===== Token Checker + CORS Helper
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