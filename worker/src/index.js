const VALID_PASSWORD = "Vendetta2025";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const method = req.method;
    const token = req.headers.get("Authorization");

    // LOGIN VALIDASI
    if (url.pathname === "/api/login" && method === "POST") {
      return new Response(
        JSON.stringify({ success: token === `Bearer ${VALID_PASSWORD}` }),
        { headers: { "Content-Type": "application/json" }, status: token === `Bearer ${VALID_PASSWORD}` ? 200 : 401 }
      );
    }

    // UPLOAD FILE
    if (url.pathname === "/api/upload" && method === "POST") {
      if (token !== `Bearer ${VALID_PASSWORD}`) return new Response("Unauthorized", { status: 401 });
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file) return new Response("No file", { status: 400 });

      const buf = await file.arrayBuffer();
      const key = `uploads/${file.name}`;
      await env.R2_BUCKET.put(key, buf, {
        httpMetadata: { contentType: file.type }
      });
      return new Response(JSON.stringify({ file_url: `https://${env.R2_BUCKET.bucket_name}.r2.dev/${key}` }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // LIST FILE
    if (url.pathname === "/api/list" && method === "GET") {
      if (token !== `Bearer ${VALID_PASSWORD}`) return new Response("Unauthorized", { status: 401 });
      const list = await env.R2_BUCKET.list({ prefix: "uploads/" });
      const files = list.objects.map(obj => ({
        name: obj.key,
        url: `https://${env.R2_BUCKET.bucket_name}.r2.dev/${obj.key}`
      }));
      return new Response(JSON.stringify(files), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // DELETE FILE
    if (url.pathname === "/api/delete" && method === "DELETE") {
      if (token !== `Bearer ${VALID_PASSWORD}`) return new Response("Unauthorized", { status: 401 });
      const file = new URL(req.url).searchParams.get("file");
      if (!file) return new Response("Missing file", { status: 400 });
      await env.R2_BUCKET.delete(file);
      return new Response("OK");
    }

    return new Response("Not Found", { status: 404 });
  }
}