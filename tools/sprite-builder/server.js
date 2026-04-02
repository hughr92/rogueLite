const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.SPRITE_BUILDER_PORT || 8787);
const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || "");
const OPENAI_API_BASE_URL = String(process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/g, "");
const OPENAI_IMAGE_MODEL = String(process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
const GENERATED_DIR = path.join(__dirname, "generated");
const MAX_BODY_BYTES = 20 * 1024 * 1024;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nowIso() {
  return new Date().toISOString();
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  setCorsHeaders(response);
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > MAX_BODY_BYTES) throw new Error("Request body too large.");
  }
  if (!body.trim()) return {};
  return JSON.parse(body);
}

function parseDataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL image.");
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

function bufferToDataUrl(buffer, mimeType) {
  const mime = String(mimeType || "image/png");
  return `data:${mime};base64,${Buffer.from(buffer).toString("base64")}`;
}

async function resolveReferenceImage(referenceImage) {
  const value = String(referenceImage || "").trim();
  if (!value) return null;

  if (value.startsWith("data:image/")) {
    const parsed = parseDataUrlToBuffer(value);
    return {
      mime: parsed.mime || "image/png",
      buffer: parsed.buffer,
      filename: "reference.png"
    };
  }

  if (/^https?:\/\//i.test(value)) {
    const response = await fetch(value);
    if (!response.ok) throw new Error(`Could not fetch reference image URL (${response.status}).`);
    const arrayBuffer = await response.arrayBuffer();
    return {
      mime: String(response.headers.get("content-type") || "image/png"),
      buffer: Buffer.from(arrayBuffer),
      filename: "reference.png"
    };
  }

  const localPath = path.isAbsolute(value) ? value : path.join(process.cwd(), value);
  const buffer = await fs.readFile(localPath);
  const extension = path.extname(localPath).toLowerCase();
  const mime = extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
  return {
    mime,
    buffer,
    filename: path.basename(localPath) || "reference.png"
  };
}

async function openAiEntryToDataUrl(entry) {
  if (entry && typeof entry.b64_json === "string" && entry.b64_json.trim()) {
    return `data:image/png;base64,${entry.b64_json.trim()}`;
  }
  if (entry && typeof entry.url === "string" && entry.url.trim()) {
    const response = await fetch(entry.url.trim());
    if (!response.ok) throw new Error(`Could not download generated image URL (${response.status}).`);
    const arrayBuffer = await response.arrayBuffer();
    const mime = String(response.headers.get("content-type") || "image/png");
    return bufferToDataUrl(Buffer.from(arrayBuffer), mime);
  }
  throw new Error("OpenAI response did not include image data.");
}

async function saveDataUrlToDisk(dataUrl, index) {
  const parsed = parseDataUrlToBuffer(dataUrl);
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  const timestamp = Date.now();
  const fileName = `sprite_gen_${timestamp}_${index + 1}.png`;
  const fullPath = path.join(GENERATED_DIR, fileName);
  await fs.writeFile(fullPath, parsed.buffer);
  return {
    localPath: `tools/sprite-builder/generated/${fileName}`.replace(/\\/g, "/")
  };
}

async function callOpenAiGenerate(payload) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set.");

  const prompt = String(payload.prompt || "").trim();
  if (!prompt) throw new Error("Prompt is required.");

  const mode = String(payload.mode || "text-to-image");
  const size = String(payload.size || "1024x1024");
  const negativePrompt = String(payload.negativePrompt || "").trim();
  const mergedPrompt = negativePrompt ? `${prompt}\nNegative prompt: ${negativePrompt}` : prompt;
  const n = clamp(Math.floor(Number(payload.n || 1)), 1, 6);
  const headers = { Authorization: `Bearer ${OPENAI_API_KEY}` };

  let response;
  if ((mode === "reference" || mode === "edit") && payload.referenceImage) {
    const reference = await resolveReferenceImage(payload.referenceImage);
    if (!reference) throw new Error("Reference mode requires referenceImage.");
    const form = new FormData();
    form.append("model", OPENAI_IMAGE_MODEL);
    form.append("prompt", mergedPrompt);
    form.append("size", size);
    form.append("n", String(n));
    form.append("background", "transparent");
    form.append("image", new Blob([reference.buffer], { type: reference.mime || "image/png" }), reference.filename || "reference.png");
    response = await fetch(`${OPENAI_API_BASE_URL}/images/edits`, {
      method: "POST",
      headers,
      body: form
    });
  } else {
    response = await fetch(`${OPENAI_API_BASE_URL}/images/generations`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt: mergedPrompt,
        size,
        n,
        background: "transparent"
      })
    });
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OpenAI request failed (${response.status}): ${text.slice(0, 400)}`);
  }

  const json = await response.json();
  const resultData = Array.isArray(json && json.data) ? json.data : [];
  if (!resultData.length) throw new Error("OpenAI returned no images.");

  const images = [];
  for (let i = 0; i < resultData.length; i += 1) {
    const entry = resultData[i];
    // eslint-disable-next-line no-await-in-loop
    const dataUrl = await openAiEntryToDataUrl(entry);
    // eslint-disable-next-line no-await-in-loop
    const saved = await saveDataUrlToDisk(dataUrl, i);
    images.push({
      url: dataUrl,
      localPath: saved.localPath,
      metadata: {
        prompt,
        mode,
        size,
        model: OPENAI_IMAGE_MODEL,
        timestamp: nowIso()
      }
    });
  }
  return images;
}

function isSafeGeneratedPath(requestPath) {
  return /^\/generated\/[a-zA-Z0-9._-]+$/.test(requestPath);
}

async function serveGeneratedFile(requestPath, response) {
  if (!isSafeGeneratedPath(requestPath)) {
    sendJson(response, 400, { error: "Invalid file path." });
    return;
  }
  const fileName = path.basename(requestPath);
  const fullPath = path.join(GENERATED_DIR, fileName);
  try {
    const content = await fs.readFile(fullPath);
    response.statusCode = 200;
    setCorsHeaders(response);
    response.setHeader("Content-Type", "image/png");
    response.end(content);
  } catch (error) {
    sendJson(response, 404, { error: "File not found." });
  }
}

const server = http.createServer(async (request, response) => {
  const method = String(request.method || "GET").toUpperCase();
  const requestPath = String(request.url || "/").split("?")[0];

  if (method === "OPTIONS") {
    response.statusCode = 204;
    setCorsHeaders(response);
    response.end();
    return;
  }

  if (method === "GET" && requestPath === "/health") {
    sendJson(response, 200, { ok: true, timestamp: nowIso() });
    return;
  }

  if (method === "GET" && requestPath.startsWith("/generated/")) {
    await serveGeneratedFile(requestPath, response);
    return;
  }

  if (method === "POST" && requestPath === "/api/images/generate") {
    try {
      const body = await readJsonBody(request);
      const images = await callOpenAiGenerate(body);
      sendJson(response, 200, { images });
      return;
    } catch (error) {
      const message = error && error.message ? error.message : "Generation failed.";
      sendJson(response, 500, { error: message });
      return;
    }
  }

  sendJson(response, 404, { error: "Route not found." });
});

server.listen(PORT, () => {
  console.log(`[sprite-builder] generation server running on http://localhost:${PORT}`);
  if (!OPENAI_API_KEY) {
    console.log("[sprite-builder] OPENAI_API_KEY is not set. Generation requests will fail until configured.");
  }
});
