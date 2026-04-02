(function () {
  const STORAGE_KEY = "rl_sprite_builder_projects_v1";

  const STYLE_PRESETS = [
    {
      id: "dark_fantasy_readable",
      label: "Dark fantasy readable",
      palette: { skin: "#d2a578", fur: "#7b6a5a", armor: "#3f4c66", accent: "#b7483d", belt: "#6a4a34", shadow: "#1f2737", highlight: "#d6e7ff" }
    },
    {
      id: "survivors_readable",
      label: "Survivors-like readable",
      palette: { skin: "#dcac80", fur: "#8b715e", armor: "#546784", accent: "#cc6a41", belt: "#7a5235", shadow: "#253049", highlight: "#e7f2ff" }
    },
    {
      id: "grim_medieval",
      label: "Grim medieval",
      palette: { skin: "#c79a74", fur: "#73614f", armor: "#394760", accent: "#9a3f45", belt: "#5f4331", shadow: "#1d2433", highlight: "#d3dfef" }
    },
    {
      id: "high_contrast_chunky",
      label: "High contrast chunky",
      palette: { skin: "#e6b286", fur: "#8e735f", armor: "#5a6f93", accent: "#d7583f", belt: "#7f5639", shadow: "#172030", highlight: "#ffffff" }
    },
    {
      id: "custom",
      label: "Custom",
      palette: { skin: "#d2a578", fur: "#7b6a5a", armor: "#3f4c66", accent: "#b7483d", belt: "#6a4a34", shadow: "#1f2737", highlight: "#d6e7ff" }
    }
  ];

  const PALETTE_SWATCHES = ["#d2a578", "#e7b68a", "#7b6a5a", "#3f4c66", "#b7483d", "#6a4a34", "#d6e7ff", "#000000", "#ffffff", "#6aa7ff", "#f6cd5d", "#7cd39f"];
  const DEFAULT_GENERATION_ENDPOINT = "http://localhost:8787/api/images/generate";
  const GENERATION_UI_MODES = ["concept", "reference", "edit"];
  const GENERATION_API_MODE_BY_UI_MODE = {
    concept: "text-to-image",
    reference: "reference",
    edit: "edit"
  };
  const PROMPT_CONSTRAINTS = [
    "single character only",
    "transparent background",
    "no environment",
    "no props, no text, no UI",
    "readable silhouette",
    "consistent proportions",
    "same camera angle and lighting as reference"
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function nextId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function parseHexColor(hex) {
    const normalized = String(hex || "").replace("#", "").trim();
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return { r: 128, g: 128, b: 128 };
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16)
    };
  }

  function rgbToHex(rgb) {
    const r = clamp(Math.round(rgb.r), 0, 255).toString(16).padStart(2, "0");
    const g = clamp(Math.round(rgb.g), 0, 255).toString(16).padStart(2, "0");
    const b = clamp(Math.round(rgb.b), 0, 255).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  function shiftColor(hex, amount) {
    const rgb = parseHexColor(hex);
    return rgbToHex({ r: rgb.r + amount, g: rgb.g + amount, b: rgb.b + amount });
  }

  function mixColors(aHex, bHex, ratio) {
    const a = parseHexColor(aHex);
    const b = parseHexColor(bHex);
    const n = clamp(Number(ratio) || 0, 0, 1);
    return rgbToHex({ r: a.r + (b.r - a.r) * n, g: a.g + (b.g - a.g) * n, b: a.b + (b.b - a.b) * n });
  }

  function hashString(text) {
    const input = String(text || "");
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
  }

  function createRng(seedInput) {
    let seed = (Math.abs(Number(seedInput) || 1) >>> 0) || 1;
    return function rng() {
      seed += 0x6d2b79f5;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function sanitizeFileName(value, fallback) {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return normalized || fallback;
  }

  function normalizeGenerationMode(value) {
    const raw = String(value || "concept").trim().toLowerCase();
    return GENERATION_UI_MODES.includes(raw) ? raw : "concept";
  }

  function resolveStylePreset(presetId) {
    return STYLE_PRESETS.find((preset) => preset.id === presetId) || STYLE_PRESETS[0];
  }

  function getPrimaryReferenceDataUrl(project) {
    const primary = getPrimaryReference(project);
    return primary && primary.dataUrl ? String(primary.dataUrl) : "";
  }

  function getGenerationEndpoint(project) {
    const endpoint = String((project && project.generationEndpoint) || dom.generationEndpointInput.value || DEFAULT_GENERATION_ENDPOINT).trim();
    return endpoint || DEFAULT_GENERATION_ENDPOINT;
  }

  function formatTimeLabel(isoTime) {
    if (!isoTime) return "-";
    const date = new Date(isoTime);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function getDirectionsForMode(mode) {
    return String(mode) === "8" ? ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] : ["S", "W", "E", "N"];
  }

  function normalizeDirection(direction, mode) {
    const directions = getDirectionsForMode(mode);
    return directions.includes(direction) ? direction : directions[0];
  }

  function mapFacingToAvailableDirection(mode, facing) {
    const value = String(facing || "S").toUpperCase();
    if (String(mode) === "8") return getDirectionsForMode(mode).includes(value) ? value : "S";
    if (value === "N" || value === "NE" || value === "NW") return "N";
    if (value === "S" || value === "SE" || value === "SW") return "S";
    if (value === "W") return "W";
    return "E";
  }

  function directionFromVector(dx, dy, mode, fallback) {
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return fallback;
    if (String(mode) === "4") {
      if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "W" : "E";
      return dy < 0 ? "N" : "S";
    }
    const horizontal = dx < -0.01 ? "W" : dx > 0.01 ? "E" : "";
    const vertical = dy < -0.01 ? "N" : dy > 0.01 ? "S" : "";
    return `${vertical}${horizontal}` || fallback;
  }

  function createSpriteCanvas(size) {
    const canvas = document.createElement("canvas");
    const safeSize = clamp(Math.floor(Number(size) || 48), 24, 128);
    canvas.width = safeSize;
    canvas.height = safeSize;
    return canvas;
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Image failed to load."));
      image.src = dataUrl;
    });
  }

  function downloadBlob(fileName, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function downloadJson(fileName, data) {
    downloadBlob(fileName, new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }));
  }

  const dom = {
    projectSelect: byId("projectSelect"),
    newProjectBtn: byId("newProjectBtn"),
    duplicateProjectBtn: byId("duplicateProjectBtn"),
    deleteProjectBtn: byId("deleteProjectBtn"),
    saveProjectBtn: byId("saveProjectBtn"),
    projectStatus: byId("projectStatus"),

    characterNameInput: byId("characterNameInput"),
    promptInput: byId("promptInput"),
    negativePromptInput: byId("negativePromptInput"),
    stylePresetSelect: byId("stylePresetSelect"),
    spriteSizeInput: byId("spriteSizeInput"),
    directionSetSelect: byId("directionSetSelect"),
    animationTypeSelect: byId("animationTypeSelect"),
    generationModeSelect: byId("generationModeSelect"),
    generationEndpointInput: byId("generationEndpointInput"),
    conceptCountInput: byId("conceptCountInput"),

    generateConceptsBtn: byId("generateConceptsBtn"),
    clearConceptsBtn: byId("clearConceptsBtn"),

    referenceUploadInput: byId("referenceUploadInput"),
    referenceUrlInput: byId("referenceUrlInput"),
    addReferenceUrlBtn: byId("addReferenceUrlBtn"),
    referencesGrid: byId("referencesGrid"),

    conceptGrid: byId("conceptGrid"),
    candidateGrid: byId("candidateGrid"),

    masterCard: byId("masterCard"),
    masterNotesInput: byId("masterNotesInput"),
    saveMasterNotesBtn: byId("saveMasterNotesBtn"),
    generateDirectionBtn: byId("generateDirectionBtn"),
    generateAllDirectionsBtn: byId("generateAllDirectionsBtn"),
    directionButtons: byId("directionButtons"),

    frameStrip: byId("frameStrip"),
    generateFrameVariantBtn: byId("generateFrameVariantBtn"),
    regenerateSelectedFrameBtn: byId("regenerateSelectedFrameBtn"),
    frameEditorCanvas: byId("frameEditorCanvas"),
    editorUndoBtn: byId("editorUndoBtn"),
    editorRedoBtn: byId("editorRedoBtn"),
    editorZoomOutBtn: byId("editorZoomOutBtn"),
    editorZoomInBtn: byId("editorZoomInBtn"),
    editorResetPanBtn: byId("editorResetPanBtn"),
    editorGridChk: byId("editorGridChk"),
    editorOnionChk: byId("editorOnionChk"),
    editorColorInput: byId("editorColorInput"),
    paletteSwatches: byId("paletteSwatches"),

    previewCanvas: byId("animationPreviewCanvas"),
    previewPlayPauseBtn: byId("previewPlayPauseBtn"),
    previewStepBtn: byId("previewStepBtn"),
    previewLoopChk: byId("previewLoopChk"),
    previewSpeedInput: byId("previewSpeedInput"),
    previewSpeedValue: byId("previewSpeedValue"),
    previewScaleSelect: byId("previewScaleSelect"),

    sandboxCanvas: byId("sandboxCanvas"),

    exportAnimationNameInput: byId("exportAnimationNameInput"),
    exportMarginInput: byId("exportMarginInput"),
    exportSpacingInput: byId("exportSpacingInput"),
    exportDurationInput: byId("exportDurationInput"),
    exportLoopChk: byId("exportLoopChk"),
    runValidationBtn: byId("runValidationBtn"),
    exportCurrentFrameBtn: byId("exportCurrentFrameBtn"),
    exportCurrentDirectionBtn: byId("exportCurrentDirectionBtn"),
    exportAllDirectionsBtn: byId("exportAllDirectionsBtn"),
    validationBox: byId("validationBox")
  };

  const state = {
    store: { projects: {}, currentProjectId: null },
    selectedDirection: "S",
    selectedFrameIndex: 0,
    selectedEditorTool: "pencil",
    frameCanvasCache: new Map(),
    frameHistory: new Map(),
    masterImageCache: new Map(),
    pendingPersistTimer: null,
    validation: { errors: [], warnings: [] },
    lastTimestamp: 0,
    preview: { playing: true, loop: true, speed: 1, scaleMode: "2", elapsedMs: 0, frameIndex: 0 },
    sandbox: { x: 250, y: 110, keys: { w: false, a: false, s: false, d: false }, facing: "S", moving: false, elapsedMs: 0, frameIndex: 0, speedPerSecond: 92 },
    editor: { zoom: 7, panX: 0, panY: 0, gridVisible: true, onionVisible: false, selectedColor: "#d9a066", isDrawing: false, isPanning: false, hasDirtyStroke: false, strokeStartPushed: false, lastPixel: null, lastPointer: null, view: { originX: 0, originY: 0, drawSize: 1 }, spacePressed: false },
    generation: { busy: false, label: "" }
  };

  const editorCtx = dom.frameEditorCanvas.getContext("2d");
  const previewCtx = dom.previewCanvas.getContext("2d");
  const sandboxCtx = dom.sandboxCanvas.getContext("2d");
  editorCtx.imageSmoothingEnabled = false;
  previewCtx.imageSmoothingEnabled = false;
  sandboxCtx.imageSmoothingEnabled = false;

  function setStatus(message, severity) {
    dom.projectStatus.textContent = message;
    if (severity === "error") dom.projectStatus.style.color = "#ffd3d8";
    else if (severity === "success") dom.projectStatus.style.color = "#d3ffe3";
    else dom.projectStatus.style.color = "#d5e2fb";
  }

  function readStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { projects: {}, currentProjectId: null };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { projects: {}, currentProjectId: null };
      const projects = parsed.projects && typeof parsed.projects === "object" && !Array.isArray(parsed.projects) ? parsed.projects : {};
      const currentProjectId = parsed.currentProjectId && projects[parsed.currentProjectId] ? parsed.currentProjectId : null;
      return { projects, currentProjectId };
    } catch (error) {
      return { projects: {}, currentProjectId: null };
    }
  }

  function writeStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
  }

  function schedulePersist() {
    if (state.pendingPersistTimer) window.clearTimeout(state.pendingPersistTimer);
    state.pendingPersistTimer = window.setTimeout(() => {
      state.pendingPersistTimer = null;
      writeStore();
    }, 260);
  }

  function getCurrentProject() {
    if (!state.store.currentProjectId) return null;
    return state.store.projects[state.store.currentProjectId] || null;
  }

  function createProjectModel(seedName) {
    const safeName = String(seedName || "barbarian").trim() || "barbarian";
    const projectId = nextId("sprite_project");
    return {
      id: projectId,
      characterName: safeName,
      prompt: "broad-shouldered barbarian, dark fantasy pixel sprite",
      negativePrompt: "blurry, extra limbs, text, busy background",
      stylePreset: STYLE_PRESETS[0].id,
      spriteSize: 48,
      directionSet: "8",
      animationType: "idle",
      generationMode: "concept",
      generationEndpoint: DEFAULT_GENERATION_ENDPOINT,
      references: [],
      concepts: [],
      savedCandidates: [],
      masterAsset: null,
      masterMetadata: null,
      notes: "",
      animations: { idle: {} },
      updatedAt: nowIso()
    };
  }

  function normalizeProjectModel(project) {
    if (!project || typeof project !== "object") return createProjectModel("character");
    if (!project.id) project.id = nextId("sprite_project");
    if (!project.characterName) project.characterName = "character";
    if (!project.prompt) project.prompt = "broad-shouldered barbarian, dark fantasy pixel sprite";
    if (typeof project.negativePrompt !== "string") project.negativePrompt = "blurry, extra limbs, text, busy background";
    if (!project.stylePreset || !STYLE_PRESETS.some((preset) => preset.id === project.stylePreset)) project.stylePreset = STYLE_PRESETS[0].id;
    project.spriteSize = clamp(Math.floor(Number(project.spriteSize || 48)), 24, 128);
    project.directionSet = String(project.directionSet || "8") === "4" ? "4" : "8";
    project.animationType = "idle";
    project.generationMode = normalizeGenerationMode(project.generationMode);
    project.generationEndpoint = String(project.generationEndpoint || DEFAULT_GENERATION_ENDPOINT).trim() || DEFAULT_GENERATION_ENDPOINT;
    if (!Array.isArray(project.references)) project.references = [];
    if (!Array.isArray(project.concepts)) project.concepts = [];
    if (!Array.isArray(project.savedCandidates)) project.savedCandidates = [];
    if (!project.animations || typeof project.animations !== "object") project.animations = { idle: {} };
    if (!project.animations.idle || typeof project.animations.idle !== "object") project.animations.idle = {};
    if (typeof project.notes !== "string") project.notes = "";
    if (!project.updatedAt) project.updatedAt = nowIso();
    return project;
  }

  function touchProject(project) {
    if (!project) return;
    project.updatedAt = nowIso();
    schedulePersist();
  }

  function clearProjectCaches(projectId) {
    Array.from(state.frameCanvasCache.keys()).forEach((key) => {
      if (key.startsWith(`${projectId}|`)) state.frameCanvasCache.delete(key);
    });
    Array.from(state.frameHistory.keys()).forEach((key) => {
      if (key.startsWith(`${projectId}|`)) state.frameHistory.delete(key);
    });
    state.masterImageCache.delete(projectId);
  }

  function getProjectListSorted() {
    return Object.values(state.store.projects).sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  }

  function bootstrapStylePresets() {
    dom.stylePresetSelect.innerHTML = "";
    STYLE_PRESETS.forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.label;
      dom.stylePresetSelect.appendChild(option);
    });
  }

  function renderProjectSelect() {
    const projects = getProjectListSorted();
    dom.projectSelect.innerHTML = "";
    if (!projects.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No projects";
      dom.projectSelect.appendChild(option);
      return;
    }
    projects.forEach((project) => {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = `${project.characterName || "Unnamed"} (${project.id.slice(-4)})`;
      dom.projectSelect.appendChild(option);
    });
    if (state.store.currentProjectId && state.store.projects[state.store.currentProjectId]) {
      dom.projectSelect.value = state.store.currentProjectId;
    } else {
      state.store.currentProjectId = projects[0].id;
      dom.projectSelect.value = projects[0].id;
    }
  }

  function syncInputsFromProject() {
    const project = getCurrentProject();
    if (!project) return;
    dom.characterNameInput.value = project.characterName || "";
    dom.promptInput.value = project.prompt || "";
    dom.negativePromptInput.value = project.negativePrompt || "";
    dom.stylePresetSelect.value = project.stylePreset || STYLE_PRESETS[0].id;
    dom.spriteSizeInput.value = String(clamp(Number(project.spriteSize || 48), 24, 128));
    dom.directionSetSelect.value = String(project.directionSet || "8");
    dom.animationTypeSelect.value = "idle";
    dom.generationModeSelect.value = normalizeGenerationMode(project.generationMode);
    dom.generationEndpointInput.value = String(project.generationEndpoint || DEFAULT_GENERATION_ENDPOINT);
    dom.masterNotesInput.value = project.notes || "";
    const slug = sanitizeFileName(project.characterName || "character", "character");
    dom.exportAnimationNameInput.value = `${slug}_idle`;
  }

  function syncProjectFromInputs() {
    const project = getCurrentProject();
    if (!project) return;
    const previousSize = Number(project.spriteSize || 48);
    project.characterName = String(dom.characterNameInput.value || "").trim() || "character";
    project.prompt = String(dom.promptInput.value || "").trim();
    project.negativePrompt = String(dom.negativePromptInput.value || "").trim();
    project.stylePreset = String(dom.stylePresetSelect.value || STYLE_PRESETS[0].id);
    project.spriteSize = clamp(Math.floor(Number(dom.spriteSizeInput.value || project.spriteSize || 48)), 24, 128);
    project.directionSet = String(dom.directionSetSelect.value || "8") === "4" ? "4" : "8";
    project.animationType = "idle";
    project.generationMode = normalizeGenerationMode(dom.generationModeSelect.value);
    project.generationEndpoint = String(dom.generationEndpointInput.value || DEFAULT_GENERATION_ENDPOINT).trim() || DEFAULT_GENERATION_ENDPOINT;
    if (project.spriteSize !== previousSize) {
      clearProjectCaches(project.id);
      project.animations.idle = {};
      state.selectedFrameIndex = 0;
      setStatus("Sprite size changed. Existing generated directions were reset.", "success");
    }
    state.selectedDirection = normalizeDirection(state.selectedDirection, project.directionSet);
    touchProject(project);
  }

  function renderPaletteSwatches() {
    dom.paletteSwatches.innerHTML = "";
    PALETTE_SWATCHES.forEach((swatchColor) => {
      const swatch = createElement("button", "palette-swatch");
      swatch.type = "button";
      swatch.style.background = swatchColor;
      if (swatchColor.toLowerCase() === state.editor.selectedColor.toLowerCase()) swatch.classList.add("active");
      swatch.addEventListener("click", () => {
        state.editor.selectedColor = swatchColor;
        dom.editorColorInput.value = swatchColor;
        renderPaletteSwatches();
      });
      dom.paletteSwatches.appendChild(swatch);
    });
  }

  async function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(file);
    });
  }

  async function getAverageColorFromDataUrl(dataUrl) {
    try {
      const image = await loadImage(dataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = 12;
      canvas.height = 12;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] <= 6) continue;
        sumR += data[i];
        sumG += data[i + 1];
        sumB += data[i + 2];
        count += 1;
      }
      if (!count) return null;
      return rgbToHex({ r: sumR / count, g: sumG / count, b: sumB / count });
    } catch (error) {
      return null;
    }
  }

  async function handleReferenceUpload(fileList) {
    const project = getCurrentProject();
    if (!project) return;
    const files = Array.from(fileList || []).filter((file) => file && String(file.type || "").startsWith("image/"));
    if (!files.length) return;

    for (const file of files) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const averageColor = await getAverageColorFromDataUrl(dataUrl);
        project.references.push({
          id: nextId("reference"),
          name: String(file.name || "reference"),
          dataUrl,
          averageColor,
          isPrimary: project.references.length === 0
        });
      } catch (error) {
        setStatus(`Could not load reference ${file.name}.`, "error");
      }
    }
    touchProject(project);
    renderReferences();
    setStatus(`Added ${files.length} reference image${files.length === 1 ? "" : "s"}.`, "success");
  }

  function normalizeReferenceUrl(rawValue) {
    const value = String(rawValue || "").trim();
    if (!value) return null;
    if (value.startsWith("data:image/")) return value;
    try {
      const parsed = new URL(value);
      const protocol = String(parsed.protocol || "").toLowerCase();
      if (protocol !== "https:" && protocol !== "http:") return null;
      return parsed.toString();
    } catch (error) {
      return null;
    }
  }

  function getReferenceNameFromUrl(urlText) {
    try {
      const parsed = new URL(urlText);
      const path = String(parsed.pathname || "");
      const name = path.split("/").filter(Boolean).pop();
      if (name) return name;
      return parsed.hostname || "url-reference";
    } catch (error) {
      return "url-reference";
    }
  }

  async function handleReferenceUrlAdd(rawUrl) {
    const project = getCurrentProject();
    if (!project) return false;
    const normalizedUrl = normalizeReferenceUrl(rawUrl);
    if (!normalizedUrl) {
      setStatus("Please enter a valid image URL (http/https).", "error");
      return false;
    }

    const duplicate = (project.references || []).some((reference) => String(reference.dataUrl || "") === normalizedUrl);
    if (duplicate) {
      setStatus("That image URL is already in references.", "error");
      return false;
    }

    try {
      await loadImage(normalizedUrl);
    } catch (error) {
      setStatus("Could not load image from that URL.", "error");
      return false;
    }

    const averageColor = await getAverageColorFromDataUrl(normalizedUrl);
    project.references.push({
      id: nextId("reference"),
      name: getReferenceNameFromUrl(normalizedUrl),
      dataUrl: normalizedUrl,
      averageColor,
      isPrimary: project.references.length === 0
    });
    touchProject(project);
    renderReferences();
    setStatus("Added reference image from URL.", "success");
    return true;
  }

  function setPrimaryReference(referenceId) {
    const project = getCurrentProject();
    if (!project) return;
    project.references.forEach((reference) => {
      reference.isPrimary = reference.id === referenceId;
    });
    touchProject(project);
    renderReferences();
  }

  function removeReference(referenceId) {
    const project = getCurrentProject();
    if (!project) return;
    project.references = project.references.filter((reference) => reference.id !== referenceId);
    if (!project.references.some((reference) => reference.isPrimary) && project.references.length) {
      project.references[0].isPrimary = true;
    }
    touchProject(project);
    renderReferences();
  }

  function renderReferences() {
    const project = getCurrentProject();
    dom.referencesGrid.innerHTML = "";
    if (!project || !project.references.length) {
      dom.referencesGrid.appendChild(createElement("div", "muted", "No references uploaded."));
      return;
    }

    project.references.forEach((reference) => {
      const card = createElement("article", `reference-card${reference.isPrimary ? " primary" : ""}`);
      const thumb = createElement("img", "reference-thumb");
      thumb.src = reference.dataUrl;
      thumb.alt = reference.name;

      const meta = createElement("div", "reference-meta");
      meta.appendChild(createElement("div", "reference-name", reference.name));
      if (reference.averageColor) {
        const avgLine = createElement("div", "reference-name", `Average: ${reference.averageColor}`);
        avgLine.style.color = "#b8caea";
        meta.appendChild(avgLine);
      }

      const actions = createElement("div", "reference-actions-row");
      const primaryBtn = createElement("button", "btn", reference.isPrimary ? "Primary" : "Set Primary");
      primaryBtn.type = "button";
      primaryBtn.disabled = reference.isPrimary;
      primaryBtn.addEventListener("click", () => setPrimaryReference(reference.id));

      const removeBtn = createElement("button", "btn btn-danger", "Remove");
      removeBtn.type = "button";
      removeBtn.addEventListener("click", () => removeReference(reference.id));

      actions.append(primaryBtn, removeBtn);
      meta.appendChild(actions);
      card.append(thumb, meta);
      dom.referencesGrid.appendChild(card);
    });
  }
  function getStylePalette(styleId) {
    const preset = STYLE_PRESETS.find((entry) => entry.id === styleId) || STYLE_PRESETS[0];
    return deepClone(preset.palette);
  }

  function getPrimaryReference(project) {
    if (!project || !Array.isArray(project.references)) return null;
    return project.references.find((reference) => reference.isPrimary) || project.references[0] || null;
  }

  function derivePalette(project, rng) {
    const base = getStylePalette(project.stylePreset);
    const primaryRef = getPrimaryReference(project);
    if (primaryRef && primaryRef.averageColor) {
      base.accent = mixColors(base.accent, primaryRef.averageColor, 0.38);
      base.fur = mixColors(base.fur, primaryRef.averageColor, 0.24);
      base.armor = mixColors(base.armor, primaryRef.averageColor, 0.16);
    }

    const variance = Math.round((rng() - 0.5) * 26);
    base.skin = shiftColor(base.skin, variance);
    base.fur = shiftColor(base.fur, variance * 0.6);
    base.armor = shiftColor(base.armor, variance * 0.45);
    base.accent = shiftColor(base.accent, variance * 0.4);
    base.highlight = shiftColor(base.highlight, variance * 0.2);
    base.shadow = shiftColor(base.shadow, variance * -0.35);
    return base;
  }

  function drawRaggedBand(ctx, left, right, y, height, color, rng) {
    const safeLeft = Math.floor(Math.min(left, right));
    const safeRight = Math.ceil(Math.max(left, right));
    const safeY = Math.floor(y);
    const safeHeight = Math.max(1, Math.floor(height));
    ctx.fillStyle = color;
    for (let px = safeLeft; px <= safeRight; px += 1) {
      const jitterTop = Math.floor(rng() * 3);
      const jitterBottom = Math.floor(rng() * 3);
      const localY = safeY + jitterTop;
      const localHeight = Math.max(1, safeHeight - jitterTop + jitterBottom);
      ctx.fillRect(px, localY, 1, localHeight);
    }
  }

  function applyConceptOutline(ctx, outlineHex) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const source = ctx.getImageData(0, 0, width, height);
    const src = source.data;
    const result = new Uint8ClampedArray(src);
    const outline = parseHexColor(outlineHex);
    const threshold = 8;
    const neighbors = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1]
    ];

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const idx = (y * width + x) * 4;
        if (src[idx + 3] > threshold) continue;
        let edge = false;
        for (let i = 0; i < neighbors.length; i += 1) {
          const nx = x + neighbors[i][0];
          const ny = y + neighbors[i][1];
          const nIdx = (ny * width + nx) * 4;
          if (src[nIdx + 3] > threshold) {
            edge = true;
            break;
          }
        }
        if (!edge) continue;
        result[idx] = outline.r;
        result[idx + 1] = outline.g;
        result[idx + 2] = outline.b;
        result[idx + 3] = 238;
      }
    }

    source.data.set(result);
    ctx.putImageData(source, 0, 0);
  }

  function drawConceptCharacter(canvas, palette, rng, project) {
    const outputCtx = canvas.getContext("2d");
    const size = canvas.width;
    outputCtx.clearRect(0, 0, size, size);
    outputCtx.imageSmoothingEnabled = false;

    const detailScale = size <= 64 ? 2 : 1;
    const workSize = size * detailScale;
    const work = document.createElement("canvas");
    work.width = workSize;
    work.height = workSize;
    const ctx = work.getContext("2d");
    ctx.clearRect(0, 0, workSize, workSize);
    ctx.imageSmoothingEnabled = false;

    const promptText = String((project && project.prompt) || "").toLowerCase();
    const heavyBias = /\b(heavy|brute|hulking|barbarian|tank)\b/.test(promptText) ? 1 : 0;
    const agileBias = /\b(lean|agile|swift|ranger|rogue)\b/.test(promptText) ? 1 : 0;

    const centerX = Math.floor(workSize * 0.5);
    const baseY = Math.floor(workSize * 0.84);
    const torsoTop = Math.floor(workSize * 0.31);
    const torsoBottom = Math.floor(workSize * 0.67);

    const shoulderHalf = Math.max(8, Math.floor(workSize * (0.16 + rng() * 0.045 + heavyBias * 0.04 - agileBias * 0.02)));
    const waistHalf = Math.max(6, Math.floor(workSize * (0.09 + rng() * 0.03 + heavyBias * 0.015 - agileBias * 0.015)));

    const legGap = Math.max(2, Math.floor(workSize * (0.016 + rng() * 0.01)));
    const legWidth = Math.max(5, Math.floor(workSize * (0.10 + rng() * 0.018 + heavyBias * 0.01)));
    const legHeight = Math.max(9, Math.floor(workSize * (0.18 + rng() * 0.04)));

    const armWidth = Math.max(4, Math.floor(workSize * (0.08 + rng() * 0.015 + heavyBias * 0.01)));
    const armHeight = Math.max(10, Math.floor(workSize * (0.22 + rng() * 0.035)));

    const headW = Math.max(10, Math.floor(workSize * (0.20 + rng() * 0.02)));
    const headH = Math.max(10, Math.floor(workSize * (0.18 + rng() * 0.025)));
    const headX = centerX - Math.floor(headW * 0.5);
    const headY = Math.floor(workSize * 0.145);

    const armorDark = shiftColor(palette.armor, -22);
    const armorLight = shiftColor(palette.armor, 24);
    const furDark = shiftColor(palette.fur, -18);
    const furLight = shiftColor(palette.fur, 14);
    const skinDark = shiftColor(palette.skin, -16);
    const skinLight = shiftColor(palette.skin, 14);
    const beltDark = shiftColor(palette.belt, -18);
    const accentDark = shiftColor(palette.accent, -20);
    const accentLight = shiftColor(palette.accent, 14);
    const outlineColor = shiftColor(palette.shadow, -35);

    // Ground shadow
    ctx.fillStyle = "rgba(8, 12, 21, 0.5)";
    ctx.fillRect(centerX - Math.floor(shoulderHalf * 0.95), baseY + 1, Math.floor(shoulderHalf * 1.9), Math.max(2, Math.floor(workSize * 0.022)));

    // Back drape/cape accent for silhouette depth.
    if (rng() > 0.4) {
      ctx.fillStyle = mixColors(accentDark, armorDark, 0.45);
      const capeWidth = Math.max(8, Math.floor(workSize * (0.16 + rng() * 0.05)));
      const capeHeight = Math.max(10, Math.floor(workSize * (0.22 + rng() * 0.04)));
      const capeX = centerX - Math.floor(capeWidth * 0.5) + Math.floor((rng() - 0.5) * workSize * 0.04);
      const capeY = torsoTop + Math.floor(workSize * 0.04);
      for (let y = 0; y < capeHeight; y += 1) {
        const t = y / Math.max(1, capeHeight - 1);
        const half = Math.floor((capeWidth * 0.5) * (1 - t * 0.55));
        ctx.fillRect(capeX + Math.floor(capeWidth * 0.5) - half, capeY + y, half * 2 + 1, 1);
      }
    }

    // Legs and boots.
    const leftLegX = centerX - legGap - legWidth;
    const rightLegX = centerX + legGap;
    const legTop = baseY - legHeight;
    ctx.fillStyle = palette.armor;
    ctx.fillRect(leftLegX, legTop, legWidth, legHeight);
    ctx.fillRect(rightLegX, legTop, legWidth, legHeight);

    // Leg shading and knees.
    ctx.fillStyle = armorDark;
    ctx.fillRect(leftLegX + Math.max(1, Math.floor(legWidth * 0.6)), legTop, Math.max(1, Math.floor(legWidth * 0.4)), legHeight);
    ctx.fillRect(rightLegX + Math.max(1, Math.floor(legWidth * 0.6)), legTop, Math.max(1, Math.floor(legWidth * 0.4)), legHeight);
    ctx.fillStyle = armorLight;
    const kneeY = legTop + Math.floor(legHeight * 0.45);
    ctx.fillRect(leftLegX + 1, kneeY, Math.max(1, legWidth - 2), Math.max(1, Math.floor(workSize * 0.016)));
    ctx.fillRect(rightLegX + 1, kneeY, Math.max(1, legWidth - 2), Math.max(1, Math.floor(workSize * 0.016)));

    // Boots.
    ctx.fillStyle = beltDark;
    ctx.fillRect(leftLegX - 1, baseY - Math.max(1, Math.floor(workSize * 0.008)), legWidth + 2, Math.max(2, Math.floor(workSize * 0.02)));
    ctx.fillRect(rightLegX - 1, baseY - Math.max(1, Math.floor(workSize * 0.008)), legWidth + 2, Math.max(2, Math.floor(workSize * 0.02)));
    ctx.fillStyle = mixColors(armorLight, palette.highlight, 0.3);
    ctx.fillRect(leftLegX, baseY, legWidth - 1, 1);
    ctx.fillRect(rightLegX, baseY, legWidth - 1, 1);

    // Torso base (trapezoid).
    ctx.fillStyle = palette.skin;
    for (let y = torsoTop; y <= torsoBottom; y += 1) {
      const t = (y - torsoTop) / Math.max(1, torsoBottom - torsoTop);
      const half = Math.round(shoulderHalf + (waistHalf - shoulderHalf) * t);
      ctx.fillRect(centerX - half, y, half * 2 + 1, 1);
    }

    // Torso shading.
    ctx.fillStyle = skinDark;
    for (let y = torsoTop + 1; y <= torsoBottom; y += 1) {
      const t = (y - torsoTop) / Math.max(1, torsoBottom - torsoTop);
      const half = Math.round(shoulderHalf + (waistHalf - shoulderHalf) * t);
      const shadeWidth = Math.max(1, Math.floor(half * 0.45));
      ctx.fillRect(centerX + half - shadeWidth, y, shadeWidth, 1);
    }
    ctx.fillStyle = skinLight;
    for (let y = torsoTop + 1; y <= torsoBottom; y += 2) {
      const t = (y - torsoTop) / Math.max(1, torsoBottom - torsoTop);
      const half = Math.round(shoulderHalf + (waistHalf - shoulderHalf) * t);
      const highlightWidth = Math.max(1, Math.floor(half * 0.22));
      ctx.fillRect(centerX - half + 1, y, highlightWidth, 1);
    }

    // Shoulder fur + rough texture.
    const furBandY = torsoTop - Math.max(2, Math.floor(workSize * 0.025));
    drawRaggedBand(ctx, centerX - shoulderHalf - Math.floor(workSize * 0.02), centerX + shoulderHalf + Math.floor(workSize * 0.02), furBandY, Math.max(3, Math.floor(workSize * 0.05)), palette.fur, rng);
    drawRaggedBand(ctx, centerX - shoulderHalf + 1, centerX + shoulderHalf - 1, furBandY + Math.max(1, Math.floor(workSize * 0.01)), Math.max(2, Math.floor(workSize * 0.035)), furLight, rng);
    ctx.fillStyle = furDark;
    for (let i = 0; i < Math.max(12, Math.floor(workSize * 0.16)); i += 1) {
      const px = centerX - shoulderHalf + Math.floor(rng() * (shoulderHalf * 2 + 1));
      const py = furBandY + Math.floor(rng() * Math.max(3, Math.floor(workSize * 0.055)));
      ctx.fillRect(px, py, 1, 1);
    }

    // Chest armor plate.
    const chestTop = torsoTop + Math.floor(workSize * 0.085);
    const chestBottom = torsoTop + Math.floor(workSize * 0.29);
    const chestHalf = Math.max(4, Math.floor(shoulderHalf * 0.47));
    ctx.fillStyle = palette.armor;
    for (let y = chestTop; y <= chestBottom; y += 1) {
      const t = (y - chestTop) / Math.max(1, chestBottom - chestTop);
      const half = Math.round(chestHalf * (1 - t * 0.1));
      ctx.fillRect(centerX - half, y, half * 2 + 1, 1);
    }
    ctx.fillStyle = armorDark;
    ctx.fillRect(centerX + Math.floor(chestHalf * 0.15), chestTop, Math.floor(chestHalf * 0.85), chestBottom - chestTop + 1);
    ctx.fillStyle = armorLight;
    ctx.fillRect(centerX - chestHalf + 1, chestTop + 1, Math.max(1, Math.floor(chestHalf * 0.45)), chestBottom - chestTop - 1);

    // Center accent crest.
    const crestWidth = Math.max(2, Math.floor(workSize * 0.055));
    const crestHeight = Math.max(3, Math.floor(workSize * 0.16));
    const crestX = centerX - Math.floor(crestWidth * 0.5);
    const crestY = chestTop + Math.max(1, Math.floor(workSize * 0.012));
    ctx.fillStyle = palette.accent;
    ctx.fillRect(crestX, crestY, crestWidth, crestHeight);
    ctx.fillStyle = accentDark;
    ctx.fillRect(crestX + Math.max(1, crestWidth - 1), crestY, 1, crestHeight);
    ctx.fillStyle = accentLight;
    ctx.fillRect(crestX, crestY, 1, crestHeight);

    // Belt and buckle.
    const beltY = torsoTop + Math.floor(workSize * 0.35);
    const beltWidth = waistHalf * 2 + Math.max(3, Math.floor(workSize * 0.04));
    ctx.fillStyle = palette.belt;
    ctx.fillRect(centerX - Math.floor(beltWidth * 0.5), beltY, beltWidth, Math.max(2, Math.floor(workSize * 0.03)));
    ctx.fillStyle = beltDark;
    ctx.fillRect(centerX - Math.floor(beltWidth * 0.5), beltY + Math.max(1, Math.floor(workSize * 0.013)), beltWidth, 1);
    const buckleW = Math.max(2, Math.floor(workSize * 0.045));
    const buckleH = Math.max(2, Math.floor(workSize * 0.028));
    ctx.fillStyle = mixColors(palette.highlight, palette.belt, 0.2);
    ctx.fillRect(centerX - Math.floor(buckleW * 0.5), beltY + Math.max(1, Math.floor(workSize * 0.004)), buckleW, buckleH);
    ctx.fillStyle = palette.shadow;
    ctx.fillRect(centerX - Math.floor((buckleW - 1) * 0.5), beltY + Math.max(1, Math.floor(workSize * 0.009)), Math.max(1, buckleW - 1), Math.max(1, buckleH - 1));

    // Arms with bracers.
    const armOffsetY = Math.floor(workSize * 0.04);
    const leftArmX = centerX - shoulderHalf - armWidth + Math.max(1, Math.floor(workSize * 0.01));
    const rightArmX = centerX + shoulderHalf - Math.max(1, Math.floor(workSize * 0.01));
    const armY = torsoTop + armOffsetY;
    const armColor = mixColors(palette.skin, palette.armor, 0.42);
    ctx.fillStyle = armColor;
    ctx.fillRect(leftArmX, armY, armWidth, armHeight);
    ctx.fillRect(rightArmX, armY, armWidth, armHeight);
    ctx.fillStyle = shiftColor(armColor, -16);
    ctx.fillRect(leftArmX + Math.max(1, Math.floor(armWidth * 0.6)), armY, Math.max(1, Math.floor(armWidth * 0.4)), armHeight);
    ctx.fillRect(rightArmX + Math.max(1, Math.floor(armWidth * 0.6)), armY, Math.max(1, Math.floor(armWidth * 0.4)), armHeight);
    const bracerY = armY + Math.floor(armHeight * 0.55);
    ctx.fillStyle = armorDark;
    ctx.fillRect(leftArmX, bracerY, armWidth, Math.max(2, Math.floor(workSize * 0.028)));
    ctx.fillRect(rightArmX, bracerY, armWidth, Math.max(2, Math.floor(workSize * 0.028)));
    ctx.fillStyle = armorLight;
    ctx.fillRect(leftArmX, bracerY, Math.max(1, Math.floor(armWidth * 0.35)), 1);
    ctx.fillRect(rightArmX, bracerY, Math.max(1, Math.floor(armWidth * 0.35)), 1);

    // Head, hair, beard, face details.
    ctx.fillStyle = palette.skin;
    ctx.fillRect(headX, headY, headW, headH);
    ctx.fillStyle = skinDark;
    ctx.fillRect(headX + Math.max(1, Math.floor(headW * 0.62)), headY + 1, Math.max(1, Math.floor(headW * 0.36)), headH - 2);
    ctx.fillStyle = skinLight;
    ctx.fillRect(headX + 1, headY + 1, Math.max(1, Math.floor(headW * 0.28)), headH - 2);

    const hairHeight = Math.max(2, Math.floor(workSize * 0.045));
    ctx.fillStyle = furDark;
    drawRaggedBand(ctx, headX - Math.max(1, Math.floor(workSize * 0.01)), headX + headW + Math.max(1, Math.floor(workSize * 0.01)), headY - Math.max(1, Math.floor(workSize * 0.01)), hairHeight, furDark, rng);
    ctx.fillStyle = furLight;
    ctx.fillRect(headX + 1, headY, Math.max(1, Math.floor(headW * 0.45)), 1);

    const beardHeight = Math.max(2, Math.floor(workSize * 0.05));
    ctx.fillStyle = palette.fur;
    drawRaggedBand(ctx, headX + Math.max(1, Math.floor(headW * 0.15)), headX + Math.floor(headW * 0.85), headY + headH - Math.max(2, Math.floor(workSize * 0.012)), beardHeight, palette.fur, rng);
    ctx.fillStyle = furDark;
    ctx.fillRect(headX + Math.max(1, Math.floor(headW * 0.6)), headY + headH - Math.max(2, Math.floor(workSize * 0.01)), Math.max(1, Math.floor(headW * 0.24)), Math.max(1, Math.floor(workSize * 0.02)));

    // Eyes + brow.
    const eyeY = headY + Math.floor(headH * 0.45);
    const leftEyeX = centerX - Math.max(2, Math.floor(workSize * 0.028));
    const rightEyeX = centerX + Math.max(1, Math.floor(workSize * 0.014));
    ctx.fillStyle = "#f4fbff";
    ctx.fillRect(leftEyeX, eyeY, 1, 1);
    ctx.fillRect(rightEyeX, eyeY, 1, 1);
    ctx.fillStyle = furDark;
    ctx.fillRect(leftEyeX - 1, eyeY - 1, 2, 1);
    ctx.fillRect(rightEyeX - 1, eyeY - 1, 2, 1);
    if (rng() > 0.56) {
      ctx.fillStyle = accentDark;
      ctx.fillRect(leftEyeX - 1, eyeY + 2, Math.max(1, Math.floor(workSize * 0.018)), 1);
    }

    // Material breakup pass on armor.
    ctx.fillStyle = mixColors(armorLight, palette.highlight, 0.3);
    const armorSpecks = Math.max(14, Math.floor(workSize * 0.18));
    for (let i = 0; i < armorSpecks; i += 1) {
      const px = centerX - chestHalf + Math.floor(rng() * (chestHalf * 2 + 1));
      const py = chestTop + Math.floor(rng() * (chestBottom - chestTop + 1));
      if (rng() > 0.58) ctx.fillRect(px, py, 1, 1);
    }

    // Final outline to improve readability at gameplay scale.
    applyConceptOutline(ctx, outlineColor);

    // Draw detailed sprite back into output canvas.
    outputCtx.imageSmoothingEnabled = detailScale > 1;
    outputCtx.drawImage(work, 0, 0, size, size);
    outputCtx.imageSmoothingEnabled = false;
  }

  function createConceptVariant(project, seed) {
    const rng = createRng(seed);
    const palette = derivePalette(project, rng);
    const canvas = createSpriteCanvas(project.spriteSize);
    drawConceptCharacter(canvas, palette, rng, project);
    return { id: nextId("concept"), seed, palette, dataUrl: canvas.toDataURL("image/png"), createdAt: nowIso() };
  }

  function setGenerationBusy(isBusy, label) {
    state.generation.busy = Boolean(isBusy);
    state.generation.label = String(label || "");

    const disabled = state.generation.busy;
    [
      dom.generateConceptsBtn,
      dom.clearConceptsBtn,
      dom.generateDirectionBtn,
      dom.generateAllDirectionsBtn,
      dom.generateFrameVariantBtn,
      dom.regenerateSelectedFrameBtn
    ].forEach((button) => {
      if (!button) return;
      button.disabled = disabled;
    });

    if (!state.generation.busy && !dom.generateConceptsBtn.textContent.includes("Generate Concepts")) {
      dom.generateConceptsBtn.textContent = "Generate Concepts";
    }
    if (state.generation.busy) {
      dom.generateConceptsBtn.textContent = "Generating...";
      setStatus(label || "Generating...", "success");
    }
  }

  async function withGenerationBusy(label, callback) {
    if (state.generation.busy) {
      setStatus("Generation already in progress. Please wait.", "error");
      return null;
    }
    setGenerationBusy(true, label);
    try {
      return await callback();
    } finally {
      setGenerationBusy(false, "");
    }
  }

  function getApiModeFromUiMode(mode) {
    const safeMode = normalizeGenerationMode(mode);
    return GENERATION_API_MODE_BY_UI_MODE[safeMode] || "text-to-image";
  }

  function buildPromptConstraintsLine() {
    return PROMPT_CONSTRAINTS.map((constraint) => `- ${constraint}`).join("\n");
  }

  function buildNormalizedPrompt(project, options) {
    const opts = options || {};
    const stylePreset = resolveStylePreset(project.stylePreset);
    const styleAnchor = stylePreset && stylePreset.label ? stylePreset.label : "dark fantasy readable";
    const pose = String(opts.pose || project.animationType || "idle").trim();
    const camera = String(opts.camera || "side view").trim();
    const transformIntent = String(opts.transformIntent || "").trim();
    const userPrompt = String(project.prompt || "").trim();

    const sections = [
      "Create a pixel-art sprite for a roguelite game.",
      `Style anchor: ${styleAnchor}.`,
      `Character: ${project.characterName || "barbarian"}.`,
      `Camera: ${camera}.`,
      `Pose: ${pose}.`,
      userPrompt ? `User direction: ${userPrompt}.` : "",
      transformIntent ? `Transformation intent: ${transformIntent}.` : "",
      "Hard constraints:",
      buildPromptConstraintsLine()
    ].filter(Boolean);

    return sections.join("\n");
  }

  function getOutputSizeLabel() {
    return "1024x1024";
  }

  async function resampleDataUrlToSpriteSize(dataUrl, spriteSize) {
    const image = await loadImage(dataUrl);
    const canvas = createSpriteCanvas(spriteSize);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }

  function buildConceptMetadata(project, mode, prompt, referenceImage, sourceMetadata) {
    return {
      prompt,
      mode,
      referenceImage: referenceImage ? "attached" : null,
      size: getOutputSizeLabel(),
      stylePreset: project.stylePreset,
      negativePrompt: String(project.negativePrompt || "").trim() || null,
      timestamp: nowIso(),
      source: sourceMetadata || null
    };
  }

  async function readFetchError(response) {
    try {
      const text = await response.text();
      if (!text) return `${response.status} ${response.statusText}`;
      return `${response.status} ${response.statusText}: ${text.slice(0, 260)}`;
    } catch (error) {
      return `${response.status} ${response.statusText}`;
    }
  }

  async function callGenerationEndpoint(project, payload) {
    const endpoint = getGenerationEndpoint(project);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 90000);
    try {
      let response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
      } catch (error) {
        const message = error && error.message ? String(error.message) : "";
        if (error && error.name === "AbortError") {
          throw new Error("Generation request timed out. Check your local generation server and retry.");
        }
        if (/failed to fetch|networkerror|connection refused|err_connection_refused/i.test(message)) {
          throw new Error("Cannot reach generation server at " + endpoint + ". Start `node tools/sprite-builder/server.js` and retry.");
        }
        throw new Error(`Generation network error: ${message || "Unknown fetch error."}`);
      }
      if (!response.ok) {
        const errorText = await readFetchError(response);
        throw new Error(errorText);
      }
      const json = await response.json();
      const images = Array.isArray(json && json.images) ? json.images : [];
      if (!images.length) throw new Error("Generation returned no images.");
      return images;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function normalizeGeneratedImageEntry(project, imageEntry, fallbackMetadata) {
    const entry = imageEntry || {};
    const rawUrl = String(entry.url || "").trim();
    let dataUrl = "";
    if (rawUrl.startsWith("data:image/")) dataUrl = rawUrl;
    else if (String(entry.b64_json || "").trim()) dataUrl = `data:image/png;base64,${String(entry.b64_json).trim()}`;
    if (!dataUrl) throw new Error("Generated image entry was missing an image payload.");

    const resizedDataUrl = await resampleDataUrlToSpriteSize(dataUrl, project.spriteSize);
    const metadata = {
      ...(fallbackMetadata || {}),
      ...(entry.metadata && typeof entry.metadata === "object" ? entry.metadata : {})
    };
    if (!metadata.timestamp) metadata.timestamp = nowIso();
    return {
      id: nextId("concept"),
      dataUrl: resizedDataUrl,
      createdAt: metadata.timestamp,
      metadata
    };
  }

  async function generateImageSet(project, options) {
    const opts = options || {};
    const modeUi = normalizeGenerationMode(opts.mode || project.generationMode);
    const mode = getApiModeFromUiMode(modeUi);
    const n = clamp(Math.floor(Number(opts.n || 1)), 1, 6);
    const referenceImage = typeof opts.referenceImage === "string" && opts.referenceImage.trim() ? opts.referenceImage.trim() : "";
    const transformIntent = String(opts.transformIntent || "").trim();
    const prompt = buildNormalizedPrompt(project, {
      pose: opts.pose,
      camera: opts.camera,
      transformIntent
    });

    const payload = {
      prompt,
      negativePrompt: String(project.negativePrompt || "").trim() || undefined,
      mode,
      referenceImage: referenceImage || undefined,
      size: getOutputSizeLabel(),
      n
    };

    const images = await callGenerationEndpoint(project, payload);
    const fallbackMetadata = buildConceptMetadata(project, mode, prompt, referenceImage, null);
    const normalized = [];
    for (const entry of images) {
      // eslint-disable-next-line no-await-in-loop
      normalized.push(await normalizeGeneratedImageEntry(project, entry, fallbackMetadata));
    }
    return normalized;
  }

  function parseConceptCountFromPrompt(promptText) {
    const text = String(promptText || "").trim();
    if (!text) return null;

    const explicitCountPatterns = [
      /\b(?:generate|create|make|show|give|produce|render)?\s*(\d{1,3})\s*(?:concepts?|variants?|options?|ideas?|sprites?)\b/i,
      /\b(?:concepts?|variants?|options?|ideas?)\s*(?:count|qty|amount)?\s*[:=]?\s*(\d{1,3})\b/i
    ];

    for (let i = 0; i < explicitCountPatterns.length; i += 1) {
      const match = text.match(explicitCountPatterns[i]);
      if (match && match[1]) {
        const parsed = Number(match[1]);
        if (!Number.isNaN(parsed)) return parsed;
      }
    }

    // Fallback: if prompt contains concept language and exactly one obvious number, use it.
    if (!/\b(concepts?|variants?|options?|ideas?)\b/i.test(text)) return null;
    const genericMatch = text.match(/\b(\d{1,3})\b/);
    if (!genericMatch || !genericMatch[1]) return null;
    const parsed = Number(genericMatch[1]);
    if (Number.isNaN(parsed)) return null;
    return parsed;
  }

  function getRequestedConceptCount(project) {
    const fromPrompt = parseConceptCountFromPrompt(project && project.prompt);
    if (Number.isFinite(fromPrompt)) {
      return clamp(Math.floor(fromPrompt), 1, 6);
    }
    return clamp(Math.floor(Number(dom.conceptCountInput.value || 1)), 1, 6);
  }

  function syncConceptCountInputFromPrompt(project) {
    const fromPrompt = parseConceptCountFromPrompt(project && project.prompt);
    if (!Number.isFinite(fromPrompt)) return false;
    const clamped = clamp(Math.floor(fromPrompt), 1, 6);
    dom.conceptCountInput.value = String(clamped);
    return true;
  }

  async function generateConcepts() {
    syncProjectFromInputs();
    const project = getCurrentProject();
    if (!project) return;

    const count = getRequestedConceptCount(project);
    dom.conceptCountInput.value = String(count);

    const selectedMode = normalizeGenerationMode(project.generationMode);
    const primaryReference = getPrimaryReference(project);
    const requiresReference = selectedMode === "reference" || selectedMode === "edit";
    if (requiresReference && (!primaryReference || !primaryReference.dataUrl)) {
      setStatus("Reference/Edit mode requires at least one reference image.", "error");
      return;
    }

    await withGenerationBusy(`Generating ${count} concept variant${count === 1 ? "" : "s"}...`, async () => {
      const generated = await generateImageSet(project, {
        mode: selectedMode,
        n: count,
        referenceImage: requiresReference ? primaryReference.dataUrl : "",
        pose: `${project.animationType || "idle"} concept`,
        camera: "side view",
        transformIntent: "Create production-ready concept variants that remain consistent with the chosen style."
      });
      project.concepts = generated.map((concept) => ({
        id: concept.id,
        dataUrl: concept.dataUrl,
        createdAt: concept.createdAt || nowIso(),
        metadata: concept.metadata || null
      }));
      touchProject(project);
      renderConceptGrid();
      setStatus(`Generated ${generated.length} concept variant${generated.length === 1 ? "" : "s"}.`, "success");
    }).catch((error) => {
      const message = error && error.message ? error.message : "Generation failed.";
      setStatus(`Concept generation failed: ${message}`, "error");
    });
  }

  async function regenerateConcept(conceptId) {
    const project = getCurrentProject();
    if (!project) return;
    const index = project.concepts.findIndex((concept) => concept.id === conceptId);
    if (index < 0) return;
    const selectedMode = normalizeGenerationMode(project.generationMode);
    const existingConcept = project.concepts[index];
    const primaryReference = getPrimaryReference(project);
    const referenceImage =
      selectedMode === "edit"
        ? String(existingConcept && existingConcept.dataUrl ? existingConcept.dataUrl : "")
        : selectedMode === "reference"
          ? String(primaryReference && primaryReference.dataUrl ? primaryReference.dataUrl : "")
          : "";
    if ((selectedMode === "reference" || selectedMode === "edit") && !referenceImage) {
      setStatus("Regeneration needs a reference image in this mode.", "error");
      return;
    }

    await withGenerationBusy("Regenerating concept...", async () => {
      const generated = await generateImageSet(project, {
        mode: selectedMode,
        n: 1,
        referenceImage,
        pose: `${project.animationType || "idle"} concept`,
        camera: "side view",
        transformIntent: "Keep identity and silhouette, but provide a fresh variant."
      });
      const replacement = generated[0];
      project.concepts[index] = {
        id: nextId("concept"),
        dataUrl: replacement.dataUrl,
        createdAt: replacement.createdAt || nowIso(),
        metadata: replacement.metadata || null
      };
      touchProject(project);
      renderConceptGrid();
      setStatus("Concept regenerated.", "success");
    }).catch((error) => {
      const message = error && error.message ? error.message : "Regeneration failed.";
      setStatus(`Concept regeneration failed: ${message}`, "error");
    });
  }

  function saveCandidate(conceptId) {
    const project = getCurrentProject();
    if (!project) return;
    const concept = project.concepts.find((entry) => entry.id === conceptId);
    if (!concept) return;
    if (!Array.isArray(project.savedCandidates)) project.savedCandidates = [];
    project.savedCandidates.push(deepClone(concept));
    touchProject(project);
    setStatus("Candidate saved.", "success");
    renderCandidateGrid();
  }

  function discardConcept(conceptId) {
    const project = getCurrentProject();
    if (!project) return;
    project.concepts = project.concepts.filter((concept) => concept.id !== conceptId);
    touchProject(project);
    renderConceptGrid();
  }

  function discardCandidate(candidateId) {
    const project = getCurrentProject();
    if (!project) return;
    project.savedCandidates = project.savedCandidates.filter((candidate) => candidate.id !== candidateId);
    touchProject(project);
    renderCandidateGrid();
  }

  function selectMasterFromConcept(conceptId) {
    const project = getCurrentProject();
    if (!project) return;
    const concept = project.concepts.find((entry) => entry.id === conceptId) || project.savedCandidates.find((entry) => entry.id === conceptId);
    if (!concept) return;
    project.masterAsset = { id: nextId("master"), sourceConceptId: concept.id, dataUrl: concept.dataUrl, createdAt: nowIso() };
    project.masterMetadata = {
      characterName: project.characterName,
      prompt: project.prompt,
      references: project.references.map((reference) => ({ id: reference.id, name: reference.name, isPrimary: reference.isPrimary })),
      stylePreset: project.stylePreset,
      spriteSize: project.spriteSize,
      generation: concept.metadata || null,
      notes: project.notes || ""
    };
    clearProjectCaches(project.id);
    project.animations.idle = {};
    state.selectedFrameIndex = 0;
    touchProject(project);
    renderMasterCard();
    renderDirectionButtons();
    renderFrameStrip();
    renderEditorCanvas();
    setStatus("Master locked. Directional generation now derives from this sprite.", "success");
  }

  function renderConceptGrid() {
    const project = getCurrentProject();
    dom.conceptGrid.innerHTML = "";
    if (!project || !project.concepts.length) {
      dom.conceptGrid.appendChild(createElement("div", "muted", "No concepts generated yet."));
      return;
    }

    project.concepts.forEach((concept) => {
      const card = createElement("article", "concept-card");
      const image = createElement("img", "concept-image");
      image.src = concept.dataUrl;
      image.alt = `Concept ${concept.id}`;
      const modeLabel = concept && concept.metadata && concept.metadata.mode ? String(concept.metadata.mode) : "generated";
      const createdLabel = formatTimeLabel(concept && concept.createdAt);
      const meta = createElement("div", "muted", `${modeLabel} • ${createdLabel}`);
      meta.style.margin = "0";

      const actions = createElement("div", "concept-actions");
      const masterBtn = createElement("button", "btn btn-primary", "Select as Master");
      masterBtn.type = "button";
      masterBtn.addEventListener("click", () => selectMasterFromConcept(concept.id));

      const regenBtn = createElement("button", "btn", "Regenerate");
      regenBtn.type = "button";
      regenBtn.addEventListener("click", () => regenerateConcept(concept.id));

      const saveBtn = createElement("button", "btn", "Save Candidate");
      saveBtn.type = "button";
      saveBtn.addEventListener("click", () => saveCandidate(concept.id));

      const discardBtn = createElement("button", "btn btn-danger", "Discard");
      discardBtn.type = "button";
      discardBtn.addEventListener("click", () => discardConcept(concept.id));

      actions.append(masterBtn, regenBtn, saveBtn, discardBtn);
      card.append(image, meta, actions);
      dom.conceptGrid.appendChild(card);
    });
  }

  function renderCandidateGrid() {
    const project = getCurrentProject();
    dom.candidateGrid.innerHTML = "";
    if (!project || !Array.isArray(project.savedCandidates) || !project.savedCandidates.length) {
      dom.candidateGrid.appendChild(createElement("div", "muted", "No saved candidates."));
      return;
    }

    project.savedCandidates.forEach((candidate) => {
      const card = createElement("article", "candidate-card");
      const image = createElement("img", "");
      image.src = candidate.dataUrl;
      image.alt = `Candidate ${candidate.id}`;
      const actions = createElement("div", "candidate-actions");

      const masterBtn = createElement("button", "btn btn-primary", "Select Master");
      masterBtn.type = "button";
      masterBtn.addEventListener("click", () => selectMasterFromConcept(candidate.id));

      const removeBtn = createElement("button", "btn btn-danger", "Remove");
      removeBtn.type = "button";
      removeBtn.addEventListener("click", () => discardCandidate(candidate.id));

      actions.append(masterBtn, removeBtn);
      card.append(image, actions);
      dom.candidateGrid.appendChild(card);
    });
  }

  function renderMasterCard() {
    const project = getCurrentProject();
    dom.masterCard.innerHTML = "";
    if (!project || !project.masterAsset) {
      dom.masterCard.classList.add("empty");
      dom.masterCard.textContent = "No master selected.";
      return;
    }
    dom.masterCard.classList.remove("empty");

    const row = createElement("div", "master-preview-row");
    const preview = createElement("img", "master-preview");
    preview.src = project.masterAsset.dataUrl;
    preview.alt = "Master sprite";

    const metadata = createElement("div", "master-meta");
    metadata.appendChild(createElement("div", "master-meta-line", `Character: ${project.characterName || "-"}`));
    metadata.appendChild(createElement("div", "master-meta-line", `Style: ${project.stylePreset}`));
    metadata.appendChild(createElement("div", "master-meta-line", `Size: ${project.spriteSize}x${project.spriteSize}`));
    metadata.appendChild(createElement("div", "master-meta-line", `References: ${project.references.length}`));
    metadata.appendChild(createElement("div", "master-meta-line", `Directions: ${project.directionSet === "8" ? "8-way" : "4-way"}`));
    if (project.masterMetadata && project.masterMetadata.generation && project.masterMetadata.generation.mode) {
      metadata.appendChild(createElement("div", "master-meta-line", `Mode: ${project.masterMetadata.generation.mode}`));
    }

    row.append(preview, metadata);
    dom.masterCard.appendChild(row);
  }

  function getFrameCacheKey(projectId, direction, frameIndex) {
    return `${projectId}|${direction}|${frameIndex}`;
  }

  function ensureDirectionRecord(project, direction) {
    if (!project.animations || typeof project.animations !== "object") project.animations = { idle: {} };
    if (!project.animations.idle || typeof project.animations.idle !== "object") project.animations.idle = {};
    if (!project.animations.idle[direction]) {
      project.animations.idle[direction] = {
        animationName: `${sanitizeFileName(project.characterName || "character", "character")}_idle`,
        direction,
        frameCount: 4,
        loop: true,
        frames: []
      };
    }
    return project.animations.idle[direction];
  }

  function getDirectionRecord(project, direction) {
    if (!project || !project.animations || !project.animations.idle) return null;
    return project.animations.idle[direction] || null;
  }

  function getFrameRecord(project, direction, frameIndex) {
    const record = getDirectionRecord(project, direction);
    if (!record || !Array.isArray(record.frames)) return null;
    return record.frames[frameIndex] || null;
  }

  function ensureFrameCanvas(project, direction, frameIndex) {
    const key = getFrameCacheKey(project.id, direction, frameIndex);
    if (state.frameCanvasCache.has(key)) return state.frameCanvasCache.get(key);

    const canvas = createSpriteCanvas(project.spriteSize);
    const frame = getFrameRecord(project, direction, frameIndex);
    if (frame && frame.dataUrl) {
      loadImage(frame.dataUrl)
        .then((image) => {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          renderFrameStrip();
          renderEditorCanvas();
          renderAnimationPreview();
          renderSandbox();
        })
        .catch(() => {
          // Keep blank fallback.
        });
    }
    state.frameCanvasCache.set(key, canvas);
    return canvas;
  }

  function getHistoryState(projectId, direction, frameIndex) {
    const key = getFrameCacheKey(projectId, direction, frameIndex);
    if (!state.frameHistory.has(key)) state.frameHistory.set(key, { undo: [], redo: [] });
    return state.frameHistory.get(key);
  }

  function pushUndoSnapshot(project, direction, frameIndex) {
    const canvas = ensureFrameCanvas(project, direction, frameIndex);
    const history = getHistoryState(project.id, direction, frameIndex);
    history.undo.push(canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height));
    if (history.undo.length > 40) history.undo.shift();
    history.redo.length = 0;
  }

  function commitFrameCanvas(project, direction, frameIndex, edited) {
    const record = ensureDirectionRecord(project, direction);
    while (record.frames.length < 4) {
      record.frames.push({ id: nextId("frame"), dataUrl: createSpriteCanvas(project.spriteSize).toDataURL("image/png"), edited: false, durationMs: 120 });
    }
    const frame = record.frames[frameIndex];
    const canvas = ensureFrameCanvas(project, direction, frameIndex);
    frame.dataUrl = canvas.toDataURL("image/png");
    frame.edited = edited ? true : frame.edited;
    frame.durationMs = Math.max(40, Math.floor(Number(dom.exportDurationInput.value || frame.durationMs || 120)));
    touchProject(project);
    renderFrameStrip();
  }

  function drawDirectionFrame(frameCanvas, masterImage, direction, frameIndex) {
    const ctx = frameCanvas.getContext("2d");
    const size = frameCanvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;

    const bobYPattern = [0, -1, 0, 1];
    const swayXPattern = [-1, 0, 1, 0];
    const bobY = bobYPattern[frameIndex % 4];
    const swayX = swayXPattern[frameIndex % 4];

    const isWest = direction === "W" || direction === "NW" || direction === "SW";
    const isEast = direction === "E" || direction === "NE" || direction === "SE";
    const isNorth = direction === "N" || direction === "NE" || direction === "NW";
    const isSouth = direction === "S" || direction === "SE" || direction === "SW";

    let scale = 0.86;
    if (isNorth) scale = 0.83;
    if (isSouth) scale = 0.88;
    if (direction === "NE" || direction === "NW" || direction === "SE" || direction === "SW") scale = 0.85;

    const drawSize = Math.round(size * scale);
    const centerX = Math.floor(size * 0.5) + swayX;
    const centerY = Math.floor(size * 0.52) + bobY;

    ctx.fillStyle = "rgba(12, 16, 26, 0.55)";
    ctx.fillRect(centerX - Math.floor(drawSize * 0.23), Math.floor(size * 0.79), Math.floor(drawSize * 0.46), 2);

    ctx.save();
    ctx.translate(centerX, centerY);
    if (isWest) ctx.scale(-1, 1);
    if (direction === "NE" || direction === "SW") ctx.rotate((Math.PI / 180) * 2.5);
    if (direction === "NW" || direction === "SE") ctx.rotate((Math.PI / 180) * -2.5);
    ctx.drawImage(masterImage, -Math.floor(drawSize / 2), -Math.floor(drawSize / 2), drawSize, drawSize);
    ctx.restore();

    if (isNorth) {
      ctx.fillStyle = "rgba(85, 128, 196, 0.12)";
      ctx.fillRect(0, 0, size, size);
    } else if (isSouth) {
      ctx.fillStyle = "rgba(214, 144, 91, 0.08)";
      ctx.fillRect(0, 0, size, size);
    } else if (isEast) {
      ctx.fillStyle = "rgba(236, 184, 109, 0.06)";
      ctx.fillRect(0, 0, size, size);
    }
  }

  function getDirectionPromptLabel(direction) {
    const safeDirection = String(direction || "S").toUpperCase();
    if (safeDirection === "N") return "facing up";
    if (safeDirection === "S") return "facing down";
    if (safeDirection === "E") return "facing right";
    if (safeDirection === "W") return "facing left";
    if (safeDirection === "NE") return "facing up-right";
    if (safeDirection === "NW") return "facing up-left";
    if (safeDirection === "SE") return "facing down-right";
    if (safeDirection === "SW") return "facing down-left";
    return "facing down";
  }

  function getFramePromptIntent(frameIndex) {
    const intents = [
      "Frame 1: neutral stance with slight compression at the knees.",
      "Frame 2: torso rises slightly, subtle breathing expansion.",
      "Frame 3: return to neutral planted stance.",
      "Frame 4: torso lowers very slightly with breathing release."
    ];
    return intents[clamp(frameIndex, 0, intents.length - 1)];
  }

  async function applyGeneratedFrameToDirection(project, direction, frameIndex, generatedImageRecord, markEdited) {
    const safeDirection = normalizeDirection(direction, project.directionSet);
    const record = ensureDirectionRecord(project, safeDirection);
    record.animationName = `${sanitizeFileName(project.characterName || "character", "character")}_idle`;
    record.direction = safeDirection;
    record.frameCount = 4;
    record.loop = true;

    while (record.frames.length < 4) {
      record.frames.push({
        id: nextId("frame"),
        dataUrl: createSpriteCanvas(project.spriteSize).toDataURL("image/png"),
        edited: false,
        durationMs: 120,
        metadata: null
      });
    }

    const targetFrame = record.frames[frameIndex] || {};
    const frameDuration = Math.max(40, Math.floor(Number(dom.exportDurationInput.value || targetFrame.durationMs || 120)));
    record.frames[frameIndex] = {
      id: targetFrame.id || nextId("frame"),
      dataUrl: generatedImageRecord.dataUrl,
      edited: Boolean(markEdited),
      durationMs: frameDuration,
      metadata: generatedImageRecord.metadata || null
    };

    const frameCanvas = createSpriteCanvas(project.spriteSize);
    const image = await loadImage(generatedImageRecord.dataUrl);
    const ctx = frameCanvas.getContext("2d");
    ctx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, frameCanvas.width, frameCanvas.height);
    state.frameCanvasCache.set(getFrameCacheKey(project.id, safeDirection, frameIndex), frameCanvas);
    getHistoryState(project.id, safeDirection, frameIndex).undo = [];
    getHistoryState(project.id, safeDirection, frameIndex).redo = [];
  }

  async function generateFrameImage(project, options) {
    const opts = options || {};
    const direction = normalizeDirection(opts.direction || state.selectedDirection, project.directionSet);
    const frameIndex = clamp(Math.floor(Number(opts.frameIndex || 0)), 0, 3);
    const mode = normalizeGenerationMode(opts.mode || project.generationMode || "reference");
    const camera = "side view";
    const pose = `${project.animationType || "idle"} ${direction} frame ${frameIndex + 1}`;
    const directionLabel = getDirectionPromptLabel(direction);
    const transformIntent = [
      `Use the master sprite as visual anchor and keep identical silhouette mass.`,
      `Generate ${project.animationType || "idle"} pose ${directionLabel}.`,
      getFramePromptIntent(frameIndex),
      String(opts.intent || "").trim()
    ]
      .filter(Boolean)
      .join(" ");

    const generated = await generateImageSet(project, {
      mode,
      n: 1,
      referenceImage: String(opts.referenceImage || "").trim(),
      pose,
      camera,
      transformIntent
    });
    return generated[0];
  }

  async function generateDirection(direction) {
    const project = getCurrentProject();
    if (!project) return;
    if (!project.masterAsset || !project.masterAsset.dataUrl) {
      setStatus("Select a master before generating directions.", "error");
      return;
    }

    const safeDirection = normalizeDirection(direction, project.directionSet);
    const uiMode = normalizeGenerationMode(project.generationMode);
    const generationMode = uiMode === "concept" ? "reference" : uiMode;

    await withGenerationBusy(`Generating ${safeDirection} frames...`, async () => {
      const record = ensureDirectionRecord(project, safeDirection);
      record.frames = [];
      for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
        // eslint-disable-next-line no-await-in-loop
        const frameImage = await generateFrameImage(project, {
          direction: safeDirection,
          frameIndex,
          mode: generationMode,
          referenceImage: project.masterAsset.dataUrl,
          intent: "Maintain armor details, fur color, and lighting consistency with the master sprite."
        });
        // eslint-disable-next-line no-await-in-loop
        await applyGeneratedFrameToDirection(project, safeDirection, frameIndex, frameImage, false);
      }

      state.selectedDirection = safeDirection;
      state.selectedFrameIndex = 0;
      touchProject(project);
      renderDirectionButtons();
      renderFrameStrip();
      renderEditorCanvas();
      renderAnimationPreview();
      renderSandbox();
      setStatus(`Generated idle frames for ${safeDirection}.`, "success");
    }).catch((error) => {
      const message = error && error.message ? error.message : "Direction generation failed.";
      setStatus(`Direction generation failed: ${message}`, "error");
    });
  }

  async function generateAllDirections() {
    const project = getCurrentProject();
    if (!project) return;
    if (!project.masterAsset || !project.masterAsset.dataUrl) {
      setStatus("Select a master before generating all directions.", "error");
      return;
    }

    const directions = getDirectionsForMode(project.directionSet);
    await withGenerationBusy(`Generating all ${directions.length} directions...`, async () => {
      for (const direction of directions) {
        const safeDirection = normalizeDirection(direction, project.directionSet);
        const uiMode = normalizeGenerationMode(project.generationMode);
        const generationMode = uiMode === "concept" ? "reference" : uiMode;
        const record = ensureDirectionRecord(project, safeDirection);
        record.frames = [];
        for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
          // eslint-disable-next-line no-await-in-loop
          const frameImage = await generateFrameImage(project, {
            direction: safeDirection,
            frameIndex,
            mode: generationMode,
            referenceImage: project.masterAsset.dataUrl,
            intent: "Keep the same character identity and clear silhouette as other directions."
          });
          // eslint-disable-next-line no-await-in-loop
          await applyGeneratedFrameToDirection(project, safeDirection, frameIndex, frameImage, false);
        }
      }

      state.selectedDirection = directions[0] || state.selectedDirection;
      state.selectedFrameIndex = 0;
      touchProject(project);
      renderDirectionButtons();
      renderFrameStrip();
      renderEditorCanvas();
      renderAnimationPreview();
      renderSandbox();
      setStatus(`Generated idle animations for ${directions.length} directions.`, "success");
    }).catch((error) => {
      const message = error && error.message ? error.message : "Generation failed.";
      setStatus(`All-direction generation failed: ${message}`, "error");
    });
  }

  async function generateFrameVariant() {
    const project = getCurrentProject();
    if (!project) return;
    if (!project.masterAsset || !project.masterAsset.dataUrl) {
      setStatus("Select a master before generating a frame variant.", "error");
      return;
    }
    const safeDirection = normalizeDirection(state.selectedDirection, project.directionSet);
    const frameIndex = clamp(state.selectedFrameIndex, 0, 3);
    const existingFrame = getFrameRecord(project, safeDirection, frameIndex);
    const referenceImage = existingFrame && existingFrame.dataUrl ? existingFrame.dataUrl : project.masterAsset.dataUrl;

    await withGenerationBusy(`Generating variant for ${safeDirection} frame ${frameIndex + 1}...`, async () => {
      const generated = await generateFrameImage(project, {
        direction: safeDirection,
        frameIndex,
        mode: "reference",
        referenceImage,
        intent: "Create an alternate version of this frame while preserving body proportions and baseline alignment."
      });
      await applyGeneratedFrameToDirection(project, safeDirection, frameIndex, generated, true);
      touchProject(project);
      renderFrameStrip();
      renderEditorCanvas();
      renderAnimationPreview();
      renderSandbox();
      setStatus(`Generated variant for ${safeDirection} frame ${frameIndex + 1}.`, "success");
    }).catch((error) => {
      const message = error && error.message ? error.message : "Frame variant generation failed.";
      setStatus(`Frame variant failed: ${message}`, "error");
    });
  }

  async function regenerateSelectedFrame() {
    const project = getCurrentProject();
    if (!project) return;
    if (!project.masterAsset || !project.masterAsset.dataUrl) {
      setStatus("Select a master before regenerating a frame.", "error");
      return;
    }
    const safeDirection = normalizeDirection(state.selectedDirection, project.directionSet);
    const frameIndex = clamp(state.selectedFrameIndex, 0, 3);
    const existingFrame = getFrameRecord(project, safeDirection, frameIndex);
    const referenceImage = existingFrame && existingFrame.dataUrl ? existingFrame.dataUrl : project.masterAsset.dataUrl;

    await withGenerationBusy(`Regenerating ${safeDirection} frame ${frameIndex + 1}...`, async () => {
      const generated = await generateFrameImage(project, {
        direction: safeDirection,
        frameIndex,
        mode: "edit",
        referenceImage,
        intent: "Regenerate this frame to improve readability while preserving character identity."
      });
      await applyGeneratedFrameToDirection(project, safeDirection, frameIndex, generated, true);
      touchProject(project);
      renderFrameStrip();
      renderEditorCanvas();
      renderAnimationPreview();
      renderSandbox();
      setStatus(`Regenerated ${safeDirection} frame ${frameIndex + 1}.`, "success");
    }).catch((error) => {
      const message = error && error.message ? error.message : "Frame regeneration failed.";
      setStatus(`Frame regeneration failed: ${message}`, "error");
    });
  }

  function renderDirectionButtons() {
    const project = getCurrentProject();
    dom.directionButtons.innerHTML = "";
    if (!project) return;
    const directions = getDirectionsForMode(project.directionSet);
    if (!directions.includes(state.selectedDirection)) state.selectedDirection = directions[0];

    directions.forEach((direction) => {
      const button = createElement("button", "btn direction-btn", direction);
      button.type = "button";
      if (getDirectionRecord(project, direction)) button.textContent = `${direction} *`;
      if (direction === state.selectedDirection) button.classList.add("active");
      button.addEventListener("click", () => {
        state.selectedDirection = direction;
        state.selectedFrameIndex = 0;
        state.preview.frameIndex = 0;
        state.sandbox.frameIndex = 0;
        renderDirectionButtons();
        renderFrameStrip();
        renderEditorCanvas();
      });
      dom.directionButtons.appendChild(button);
    });
  }

  function renderFrameStrip() {
    const project = getCurrentProject();
    dom.frameStrip.innerHTML = "";
    if (!project) return;

    const record = getDirectionRecord(project, state.selectedDirection);
    if (!record || !Array.isArray(record.frames) || !record.frames.length) {
      dom.frameStrip.appendChild(createElement("div", "muted", `No frames for ${state.selectedDirection}. Generate this direction first.`));
      return;
    }

    record.frames.forEach((frame, index) => {
      const chip = createElement("button", "frame-chip");
      chip.type = "button";
      if (index === state.selectedFrameIndex) chip.classList.add("active");
      const image = createElement("img", "");
      image.src = frame.dataUrl;
      image.alt = `${state.selectedDirection} frame ${index + 1}`;
      const label = createElement("span", "", `F${index + 1}`);
      chip.append(image, label);
      chip.addEventListener("click", () => {
        state.selectedFrameIndex = index;
        renderFrameStrip();
        renderEditorCanvas();
      });
      dom.frameStrip.appendChild(chip);
    });
  }

  function drawCheckerboard(ctx, width, height, cellSize) {
    ctx.fillStyle = "#202c43";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#25334f";
    for (let y = 0; y < height; y += cellSize) {
      for (let x = 0; x < width; x += cellSize) {
        if (((x / cellSize + y / cellSize) & 1) === 0) ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }

  function renderEditorCanvas() {
    const project = getCurrentProject();
    const canvas = dom.frameEditorCanvas;
    const ctx = editorCtx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCheckerboard(ctx, canvas.width, canvas.height, 16);

    if (!project) return;
    const record = getDirectionRecord(project, state.selectedDirection);
    if (!record || !record.frames || !record.frames.length) {
      ctx.fillStyle = "#c6d5f3";
      ctx.font = "14px Trebuchet MS";
      ctx.fillText(`Generate ${state.selectedDirection} to begin editing.`, 18, 34);
      return;
    }

    state.selectedFrameIndex = clamp(state.selectedFrameIndex, 0, record.frames.length - 1);
    const spriteSize = project.spriteSize;
    const zoom = clamp(state.editor.zoom, 2, 24);
    const drawSize = spriteSize * zoom;
    const originX = Math.round(canvas.width * 0.5 - drawSize * 0.5 + state.editor.panX);
    const originY = Math.round(canvas.height * 0.5 - drawSize * 0.5 + state.editor.panY);

    state.editor.view.originX = originX;
    state.editor.view.originY = originY;
    state.editor.view.drawSize = drawSize;

    if (state.editor.onionVisible && record.frames.length > 1) {
      const previousIndex = state.selectedFrameIndex === 0 ? record.frames.length - 1 : state.selectedFrameIndex - 1;
      const previousCanvas = ensureFrameCanvas(project, state.selectedDirection, previousIndex);
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.drawImage(previousCanvas, originX, originY, drawSize, drawSize);
      ctx.restore();
    }

    const currentCanvas = ensureFrameCanvas(project, state.selectedDirection, state.selectedFrameIndex);
    ctx.drawImage(currentCanvas, originX, originY, drawSize, drawSize);

    ctx.strokeStyle = "rgba(185, 203, 236, 0.9)";
    ctx.lineWidth = 1;
    ctx.strokeRect(originX - 0.5, originY - 0.5, drawSize + 1, drawSize + 1);

    if (state.editor.gridVisible && zoom >= 6) {
      ctx.strokeStyle = "rgba(150, 169, 205, 0.35)";
      ctx.beginPath();
      for (let i = 1; i < spriteSize; i += 1) {
        const x = originX + i * zoom + 0.5;
        ctx.moveTo(x, originY);
        ctx.lineTo(x, originY + drawSize);
      }
      for (let j = 1; j < spriteSize; j += 1) {
        const y = originY + j * zoom + 0.5;
        ctx.moveTo(originX, y);
        ctx.lineTo(originX + drawSize, y);
      }
      ctx.stroke();
    }

    ctx.fillStyle = "#dbe7ff";
    ctx.font = "12px Trebuchet MS";
    ctx.fillText(`${state.selectedDirection} frame ${state.selectedFrameIndex + 1}/${record.frames.length} - zoom ${zoom}x`, 12, 18);
  }

  function toSpritePixelFromEditorEvent(event) {
    const rect = dom.frameEditorCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const spriteSize = (getCurrentProject() && getCurrentProject().spriteSize) || 48;
    const px = Math.floor((x - state.editor.view.originX) / state.editor.zoom);
    const py = Math.floor((y - state.editor.view.originY) / state.editor.zoom);
    const inside = px >= 0 && py >= 0 && px < spriteSize && py < spriteSize;
    return { x, y, px, py, inside };
  }

  function drawPixelWithTool(project, direction, frameIndex, px, py) {
    const frameCanvas = ensureFrameCanvas(project, direction, frameIndex);
    const ctx = frameCanvas.getContext("2d");

    if (state.selectedEditorTool === "picker") {
      const data = ctx.getImageData(px, py, 1, 1).data;
      const color = rgbToHex({ r: data[0], g: data[1], b: data[2] });
      state.editor.selectedColor = color;
      dom.editorColorInput.value = color;
      renderPaletteSwatches();
      return;
    }

    if (state.selectedEditorTool === "eraser") ctx.clearRect(px, py, 1, 1);
    else {
      ctx.fillStyle = state.editor.selectedColor;
      ctx.fillRect(px, py, 1, 1);
    }
    state.editor.hasDirtyStroke = true;
  }

  function drawLinePixels(project, direction, frameIndex, fromPixel, toPixel) {
    let x = fromPixel.px;
    let y = fromPixel.py;
    const x1 = toPixel.px;
    const y1 = toPixel.py;
    const dx = Math.abs(x1 - x);
    const sx = x < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y);
    const sy = y < y1 ? 1 : -1;
    let err = dx + dy;

    while (true) {
      drawPixelWithTool(project, direction, frameIndex, x, y);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  function beginEditorStroke(event) {
    const project = getCurrentProject();
    if (!project) return;
    const record = getDirectionRecord(project, state.selectedDirection);
    if (!record || !record.frames.length) return;

    if (event.button === 1 || (event.button === 0 && state.editor.spacePressed)) {
      state.editor.isPanning = true;
      state.editor.lastPointer = { x: event.clientX, y: event.clientY };
      event.preventDefault();
      return;
    }

    if (event.button !== 0) return;
    const hit = toSpritePixelFromEditorEvent(event);
    if (!hit.inside) return;

    if (!state.editor.strokeStartPushed && state.selectedEditorTool !== "picker") {
      pushUndoSnapshot(project, state.selectedDirection, state.selectedFrameIndex);
      state.editor.strokeStartPushed = true;
    }

    state.editor.isDrawing = true;
    state.editor.hasDirtyStroke = false;
    state.editor.lastPixel = hit;
    drawPixelWithTool(project, state.selectedDirection, state.selectedFrameIndex, hit.px, hit.py);
    renderEditorCanvas();
  }

  function moveEditorStroke(event) {
    if (state.editor.isPanning) {
      const pointer = { x: event.clientX, y: event.clientY };
      if (state.editor.lastPointer) {
        state.editor.panX += pointer.x - state.editor.lastPointer.x;
        state.editor.panY += pointer.y - state.editor.lastPointer.y;
      }
      state.editor.lastPointer = pointer;
      renderEditorCanvas();
      return;
    }

    if (!state.editor.isDrawing) return;
    const project = getCurrentProject();
    if (!project) return;
    const hit = toSpritePixelFromEditorEvent(event);
    if (!hit.inside) return;
    if (state.editor.lastPixel) drawLinePixels(project, state.selectedDirection, state.selectedFrameIndex, state.editor.lastPixel, hit);
    else drawPixelWithTool(project, state.selectedDirection, state.selectedFrameIndex, hit.px, hit.py);
    state.editor.lastPixel = hit;
    renderEditorCanvas();
  }

  function endEditorStroke() {
    const project = getCurrentProject();
    if (state.editor.isPanning) {
      state.editor.isPanning = false;
      state.editor.lastPointer = null;
    }

    if (state.editor.isDrawing && project && state.editor.hasDirtyStroke) {
      commitFrameCanvas(project, state.selectedDirection, state.selectedFrameIndex, true);
    }

    state.editor.isDrawing = false;
    state.editor.hasDirtyStroke = false;
    state.editor.strokeStartPushed = false;
    state.editor.lastPixel = null;
    renderEditorCanvas();
    renderAnimationPreview();
    renderSandbox();
  }

  function undoFrame() {
    const project = getCurrentProject();
    if (!project) return;
    const history = getHistoryState(project.id, state.selectedDirection, state.selectedFrameIndex);
    if (!history.undo.length) return;

    const canvas = ensureFrameCanvas(project, state.selectedDirection, state.selectedFrameIndex);
    const ctx = canvas.getContext("2d");
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const previous = history.undo.pop();
    history.redo.push(current);
    ctx.putImageData(previous, 0, 0);
    commitFrameCanvas(project, state.selectedDirection, state.selectedFrameIndex, true);
    renderEditorCanvas();
  }

  function redoFrame() {
    const project = getCurrentProject();
    if (!project) return;
    const history = getHistoryState(project.id, state.selectedDirection, state.selectedFrameIndex);
    if (!history.redo.length) return;

    const canvas = ensureFrameCanvas(project, state.selectedDirection, state.selectedFrameIndex);
    const ctx = canvas.getContext("2d");
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const next = history.redo.pop();
    history.undo.push(current);
    ctx.putImageData(next, 0, 0);
    commitFrameCanvas(project, state.selectedDirection, state.selectedFrameIndex, true);
    renderEditorCanvas();
  }
  function getFrameSequence(project, direction) {
    const record = getDirectionRecord(project, direction);
    if (!record || !Array.isArray(record.frames) || !record.frames.length) return [];
    return record.frames;
  }

  function getPreviewScaleMultiplier() {
    const value = String(state.preview.scaleMode || "2");
    if (value === "1") return 1;
    if (value === "2") return 2;
    if (value === "4") return 4;
    return 1.6;
  }

  function renderAnimationPreview() {
    const project = getCurrentProject();
    const ctx = previewCtx;
    const canvas = dom.previewCanvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCheckerboard(ctx, canvas.width, canvas.height, 20);

    if (!project) return;

    const direction = state.selectedDirection;
    const frames = getFrameSequence(project, direction);
    if (!frames.length) {
      ctx.fillStyle = "#d2dff7";
      ctx.font = "13px Trebuchet MS";
      ctx.fillText(`No ${direction} frames generated.`, 14, 22);
      return;
    }

    const frameIndex = clamp(state.preview.frameIndex, 0, frames.length - 1);
    const frameCanvas = ensureFrameCanvas(project, direction, frameIndex);
    const scale = getPreviewScaleMultiplier();
    const drawSize = Math.round(project.spriteSize * scale);
    const x = Math.round(canvas.width * 0.5 - drawSize * 0.5);
    const y = Math.round(canvas.height * 0.56 - drawSize * 0.5);

    ctx.fillStyle = "rgba(12, 17, 28, 0.55)";
    ctx.fillRect(Math.round(canvas.width * 0.5 - drawSize * 0.28), Math.round(canvas.height * 0.8), Math.round(drawSize * 0.56), 3);

    ctx.drawImage(frameCanvas, x, y, drawSize, drawSize);

    ctx.fillStyle = "#dce8ff";
    ctx.font = "12px Trebuchet MS";
    ctx.fillText(`Direction ${direction}`, 10, 18);
    ctx.fillText(`Frame ${frameIndex + 1}/${frames.length}`, 10, 34);
  }

  function renderSandbox() {
    const project = getCurrentProject();
    const ctx = sandboxCtx;
    const canvas = dom.sandboxCanvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#131d2f");
    gradient.addColorStop(1, "#0c131f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(84, 105, 139, 0.25)";
    for (let x = 0; x < canvas.width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }

    if (!project) return;

    const direction = mapFacingToAvailableDirection(project.directionSet, state.sandbox.facing);
    const frames = getFrameSequence(project, direction);
    if (!frames.length) {
      ctx.fillStyle = "#d2dff7";
      ctx.font = "13px Trebuchet MS";
      ctx.fillText("Generate directions to preview movement.", 14, 24);
      return;
    }

    const frameIndex = clamp(state.sandbox.frameIndex, 0, frames.length - 1);
    const frameCanvas = ensureFrameCanvas(project, direction, frameIndex);
    const scale = 1.55;
    const drawSize = Math.round(project.spriteSize * scale);
    const x = Math.round(state.sandbox.x - drawSize * 0.5);
    const y = Math.round(state.sandbox.y - drawSize * 0.5);

    ctx.fillStyle = "rgba(8, 12, 20, 0.55)";
    ctx.fillRect(Math.round(state.sandbox.x - drawSize * 0.25), Math.round(state.sandbox.y + drawSize * 0.35), Math.round(drawSize * 0.5), 3);

    ctx.drawImage(frameCanvas, x, y, drawSize, drawSize);

    ctx.fillStyle = "#e0ecff";
    ctx.font = "12px Trebuchet MS";
    ctx.fillText(`Facing: ${direction} ${state.sandbox.moving ? "(moving)" : "(idle)"}`, 10, 18);
    ctx.fillText("WASD to move/facing", 10, 34);
  }

  function getFrameDurationMs(frame, speedMultiplier) {
    const base = Math.max(40, Math.floor(Number(frame && frame.durationMs) || 120));
    const speed = clamp(Number(speedMultiplier) || 1, 0.2, 4);
    return base / speed;
  }

  function updatePreview(deltaMs) {
    const project = getCurrentProject();
    if (!project || !state.preview.playing) return;
    const frames = getFrameSequence(project, state.selectedDirection);
    if (!frames.length) return;

    state.preview.elapsedMs += deltaMs;
    const currentFrame = frames[clamp(state.preview.frameIndex, 0, frames.length - 1)];
    const frameDuration = getFrameDurationMs(currentFrame, state.preview.speed);

    if (state.preview.elapsedMs >= frameDuration) {
      state.preview.elapsedMs = 0;
      let nextIndex = state.preview.frameIndex + 1;
      if (nextIndex >= frames.length) {
        if (state.preview.loop) nextIndex = 0;
        else {
          nextIndex = frames.length - 1;
          state.preview.playing = false;
          dom.previewPlayPauseBtn.textContent = "Play";
        }
      }
      state.preview.frameIndex = nextIndex;
    }
  }

  function updateSandbox(deltaMs) {
    const project = getCurrentProject();
    if (!project) return;

    const dx = (state.sandbox.keys.d ? 1 : 0) - (state.sandbox.keys.a ? 1 : 0);
    const dy = (state.sandbox.keys.s ? 1 : 0) - (state.sandbox.keys.w ? 1 : 0);
    const magnitude = Math.hypot(dx, dy);
    const moving = magnitude > 0;
    state.sandbox.moving = moving;

    if (moving) {
      const normalizedX = dx / magnitude;
      const normalizedY = dy / magnitude;
      const seconds = deltaMs / 1000;
      state.sandbox.x += normalizedX * state.sandbox.speedPerSecond * seconds;
      state.sandbox.y += normalizedY * state.sandbox.speedPerSecond * seconds;

      const drawRadius = Math.max(18, (project.spriteSize || 48) * 0.8);
      state.sandbox.x = clamp(state.sandbox.x, drawRadius, dom.sandboxCanvas.width - drawRadius);
      state.sandbox.y = clamp(state.sandbox.y, drawRadius, dom.sandboxCanvas.height - drawRadius);
      state.sandbox.facing = directionFromVector(normalizedX, normalizedY, project.directionSet, state.sandbox.facing);
    }

    const direction = mapFacingToAvailableDirection(project.directionSet, state.sandbox.facing);
    const frames = getFrameSequence(project, direction);
    if (!frames.length) return;

    state.sandbox.elapsedMs += deltaMs;
    const speedMultiplier = moving ? 1.15 : 0.85;
    const currentFrame = frames[clamp(state.sandbox.frameIndex, 0, frames.length - 1)];
    const frameDuration = getFrameDurationMs(currentFrame, speedMultiplier);
    if (state.sandbox.elapsedMs >= frameDuration) {
      state.sandbox.elapsedMs = 0;
      state.sandbox.frameIndex = (state.sandbox.frameIndex + 1) % frames.length;
    }
  }

  function tick(timestamp) {
    if (!state.lastTimestamp) state.lastTimestamp = timestamp;
    const deltaMs = Math.max(0, timestamp - state.lastTimestamp);
    state.lastTimestamp = timestamp;

    updatePreview(deltaMs);
    updateSandbox(deltaMs);
    renderAnimationPreview();
    renderSandbox();

    window.requestAnimationFrame(tick);
  }

  function getBottomOpaqueRow(canvas) {
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    for (let y = canvas.height - 1; y >= 0; y -= 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const index = (y * canvas.width + x) * 4;
        if (data[index + 3] > 10) return y;
      }
    }
    return null;
  }

  function hasTransparentPixel(canvas) {
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) return true;
    }
    return false;
  }

  async function getFrameCanvasForExport(frame, spriteSize) {
    const canvas = createSpriteCanvas(spriteSize);
    if (!frame || !frame.dataUrl) return canvas;
    try {
      const image = await loadImage(frame.dataUrl);
      canvas.getContext("2d").drawImage(image, 0, 0, spriteSize, spriteSize);
    } catch (error) {
      // Leave transparent fallback.
    }
    return canvas;
  }

  async function runValidation() {
    const project = getCurrentProject();
    const errors = [];
    const warnings = [];

    if (!project) {
      state.validation = { errors: ["No active project."], warnings: [] };
      renderValidationBox();
      return;
    }

    if (!project.masterAsset) errors.push("No master selected. Export is blocked until a master is selected.");

    const requiredDirections = getDirectionsForMode(project.directionSet);
    const idleMap = (project.animations && project.animations.idle) || {};

    for (const direction of requiredDirections) {
      const record = idleMap[direction];
      if (!record) {
        warnings.push(`Missing direction: ${direction}.`);
        continue;
      }
      const frames = Array.isArray(record.frames) ? record.frames : [];
      if (frames.length !== 4) warnings.push(`${direction} has ${frames.length} frame(s). Expected 4.`);

      const bottomRows = [];
      for (let i = 0; i < frames.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const canvas = await getFrameCanvasForExport(frames[i], project.spriteSize);
        if (canvas.width !== project.spriteSize || canvas.height !== project.spriteSize) warnings.push(`${direction} frame ${i + 1} size mismatch.`);
        if (!hasTransparentPixel(canvas)) warnings.push(`${direction} frame ${i + 1} may be missing transparency.`);
        const row = getBottomOpaqueRow(canvas);
        if (row !== null) bottomRows.push(row);
      }
      if (bottomRows.length >= 2) {
        const min = Math.min(...bottomRows);
        const max = Math.max(...bottomRows);
        if (max - min > 1) warnings.push(`${direction} baseline drift detected (${min}-${max}).`);
      }
    }

    const generatedDirections = Object.keys(idleMap);
    if (generatedDirections.length > 1) {
      const counts = generatedDirections.map((direction) => {
        const frames = idleMap[direction] && Array.isArray(idleMap[direction].frames) ? idleMap[direction].frames : [];
        return frames.length;
      });
      if (Math.min(...counts) !== Math.max(...counts)) warnings.push("Unequal frame counts between generated directions.");
    }

    state.validation = { errors, warnings };
    renderValidationBox();

    if (errors.length) setStatus("Validation found blocking errors.", "error");
    else if (warnings.length) setStatus("Validation complete with warnings.", "success");
    else setStatus("Validation complete. No issues found.", "success");
  }

  function renderValidationBox() {
    dom.validationBox.innerHTML = "";
    dom.validationBox.appendChild(createElement("div", "validation-title", "Validation"));

    if (!state.validation.errors.length && !state.validation.warnings.length) {
      dom.validationBox.appendChild(createElement("div", "validation-ok", "No issues found."));
      return;
    }

    if (state.validation.errors.length) {
      const block = createElement("div", "validation-errors");
      block.textContent = `Errors: ${state.validation.errors.join(" | ")}`;
      dom.validationBox.appendChild(block);
    }

    if (state.validation.warnings.length) {
      const block = createElement("div", "validation-warnings");
      block.textContent = `Warnings: ${state.validation.warnings.join(" | ")}`;
      dom.validationBox.appendChild(block);
    }
  }

  function getExportConfig(project) {
    return {
      animationName: sanitizeFileName(dom.exportAnimationNameInput.value || `${project.characterName}_idle`, "animation"),
      margin: Math.max(0, Math.floor(Number(dom.exportMarginInput.value || 4))),
      spacing: Math.max(0, Math.floor(Number(dom.exportSpacingInput.value || 4))),
      duration: Math.max(40, Math.floor(Number(dom.exportDurationInput.value || 120))),
      loop: Boolean(dom.exportLoopChk.checked)
    };
  }

  async function buildDirectionExport(project, direction, config) {
    const record = getDirectionRecord(project, direction);
    if (!record || !Array.isArray(record.frames) || !record.frames.length) return null;

    const frameCanvases = [];
    for (let i = 0; i < record.frames.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      frameCanvases.push(await getFrameCanvasForExport(record.frames[i], project.spriteSize));
    }

    const frameWidth = project.spriteSize;
    const frameHeight = project.spriteSize;
    const frameCount = frameCanvases.length;
    const sheetWidth = config.margin * 2 + frameWidth * frameCount + config.spacing * Math.max(0, frameCount - 1);
    const sheetHeight = config.margin * 2 + frameHeight;

    const sheetCanvas = document.createElement("canvas");
    sheetCanvas.width = sheetWidth;
    sheetCanvas.height = sheetHeight;
    const sheetCtx = sheetCanvas.getContext("2d");
    sheetCtx.clearRect(0, 0, sheetWidth, sheetHeight);

    const manifestFrames = [];
    frameCanvases.forEach((frameCanvas, index) => {
      const x = config.margin + index * (frameWidth + config.spacing);
      const y = config.margin;
      sheetCtx.drawImage(frameCanvas, x, y, frameWidth, frameHeight);
      manifestFrames.push({ index, x, y, w: frameWidth, h: frameHeight, duration: config.duration });
    });

    return {
      canvas: sheetCanvas,
      manifest: {
        animationName: config.animationName,
        direction,
        frameWidth,
        frameHeight,
        frameCount,
        loop: config.loop,
        spacing: config.spacing,
        margin: config.margin,
        frames: manifestFrames
      }
    };
  }

  function exportCanvasAsPng(canvas, fileName) {
    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus(`Could not export ${fileName}.`, "error");
        return;
      }
      downloadBlob(fileName, blob);
    }, "image/png");
  }

  async function exportCurrentFrame() {
    const project = getCurrentProject();
    if (!project) return;
    if (!project.masterAsset) {
      setStatus("Export blocked: select a master first.", "error");
      return;
    }

    const frame = getFrameRecord(project, state.selectedDirection, state.selectedFrameIndex);
    if (!frame) {
      setStatus("No frame selected to export.", "error");
      return;
    }

    const frameCanvas = await getFrameCanvasForExport(frame, project.spriteSize);
    const projectSlug = sanitizeFileName(project.characterName, "character");
    const baseName = `${projectSlug}_idle_${state.selectedDirection.toLowerCase()}_f${state.selectedFrameIndex + 1}`;

    exportCanvasAsPng(frameCanvas, `${baseName}.png`);
    downloadJson(`${baseName}.json`, {
      animationName: `${projectSlug}_idle`,
      direction: state.selectedDirection,
      frameWidth: project.spriteSize,
      frameHeight: project.spriteSize,
      frameCount: 1,
      loop: false,
      spacing: 0,
      margin: 0,
      frames: [{ index: 0, x: 0, y: 0, w: project.spriteSize, h: project.spriteSize, duration: Math.max(40, Math.floor(Number(dom.exportDurationInput.value || 120))) }]
    });
    setStatus(`Exported frame ${state.selectedFrameIndex + 1} (${state.selectedDirection}).`, "success");
  }

  async function exportCurrentDirection() {
    const project = getCurrentProject();
    if (!project) return;
    if (!project.masterAsset) {
      setStatus("Export blocked: select a master first.", "error");
      return;
    }

    const config = getExportConfig(project);
    const direction = state.selectedDirection;
    const built = await buildDirectionExport(project, direction, config);
    if (!built) {
      setStatus(`No frames to export for ${direction}.`, "error");
      return;
    }

    const projectSlug = sanitizeFileName(project.characterName, "character");
    const baseName = `${projectSlug}_${config.animationName}_${direction.toLowerCase()}`;
    exportCanvasAsPng(built.canvas, `${baseName}.png`);
    downloadJson(`${baseName}.json`, built.manifest);
    setStatus(`Exported ${direction} direction sprite sheet + manifest.`, "success");
  }

  async function exportAllDirections() {
    const project = getCurrentProject();
    if (!project) return;
    if (!project.masterAsset) {
      setStatus("Export blocked: select a master first.", "error");
      return;
    }

    const config = getExportConfig(project);
    const directions = getDirectionsForMode(project.directionSet);
    let exportedCount = 0;
    for (const direction of directions) {
      // eslint-disable-next-line no-await-in-loop
      const built = await buildDirectionExport(project, direction, config);
      if (!built) continue;
      const projectSlug = sanitizeFileName(project.characterName, "character");
      const baseName = `${projectSlug}_${config.animationName}_${direction.toLowerCase()}`;
      exportCanvasAsPng(built.canvas, `${baseName}.png`);
      downloadJson(`${baseName}.json`, built.manifest);
      exportedCount += 1;
    }

    if (!exportedCount) {
      setStatus("No generated directions available for export.", "error");
      return;
    }
    setStatus(`Exported ${exportedCount} direction sheet(s) + manifest(s).`, "success");
  }

  function renderAll() {
    renderProjectSelect();
    syncInputsFromProject();
    syncConceptCountInputFromPrompt(getCurrentProject());
    renderPaletteSwatches();
    renderReferences();
    renderConceptGrid();
    renderCandidateGrid();
    renderMasterCard();
    renderDirectionButtons();
    renderFrameStrip();
    renderEditorCanvas();
    renderAnimationPreview();
    renderSandbox();
    renderValidationBox();
  }

  function loadStoreAndBootstrapProject() {
    state.store = readStore();
    if (!state.store.projects || typeof state.store.projects !== "object") state.store.projects = {};
    Object.keys(state.store.projects).forEach((projectId) => {
      state.store.projects[projectId] = normalizeProjectModel(state.store.projects[projectId]);
    });

    if (!Object.keys(state.store.projects).length) {
      const project = createProjectModel("barbarian");
      state.store.projects[project.id] = project;
      state.store.currentProjectId = project.id;
      writeStore();
      return;
    }

    if (!state.store.currentProjectId || !state.store.projects[state.store.currentProjectId]) {
      const fallback = getProjectListSorted()[0];
      state.store.currentProjectId = fallback ? fallback.id : null;
    }
  }

  function createNewProject() {
    const name = String(dom.characterNameInput.value || "").trim() || "character";
    const project = createProjectModel(name);
    state.store.projects[project.id] = project;
    state.store.currentProjectId = project.id;
    writeStore();
    renderAll();
    setStatus(`Created project ${project.characterName}.`, "success");
  }

  function duplicateCurrentProject() {
    const project = getCurrentProject();
    if (!project) return;
    const copy = deepClone(project);
    copy.id = nextId("sprite_project");
    copy.characterName = `${project.characterName || "character"}_copy`;
    copy.updatedAt = nowIso();
    normalizeProjectModel(copy);
    state.store.projects[copy.id] = copy;
    state.store.currentProjectId = copy.id;
    writeStore();
    renderAll();
    setStatus(`Duplicated project as ${copy.characterName}.`, "success");
  }

  function deleteCurrentProject() {
    const project = getCurrentProject();
    if (!project) return;
    const shouldDelete = window.confirm(`Delete project ${project.characterName}?`);
    if (!shouldDelete) return;
    delete state.store.projects[project.id];
    clearProjectCaches(project.id);
    const list = getProjectListSorted();
    state.store.currentProjectId = list.length ? list[0].id : null;
    if (!state.store.currentProjectId) {
      const fresh = createProjectModel("character");
      state.store.projects[fresh.id] = fresh;
      state.store.currentProjectId = fresh.id;
    }
    writeStore();
    renderAll();
    setStatus("Project deleted.", "success");
  }

  function wireProjectBar() {
    dom.projectSelect.addEventListener("change", () => {
      const nextId = String(dom.projectSelect.value || "");
      if (!nextId || !state.store.projects[nextId]) return;
      state.store.currentProjectId = nextId;
      state.selectedDirection = "S";
      state.selectedFrameIndex = 0;
      state.preview.frameIndex = 0;
      state.sandbox.frameIndex = 0;
      writeStore();
      renderAll();
      setStatus("Project switched.", "success");
    });

    dom.newProjectBtn.addEventListener("click", () => createNewProject());
    dom.duplicateProjectBtn.addEventListener("click", () => duplicateCurrentProject());
    dom.deleteProjectBtn.addEventListener("click", () => deleteCurrentProject());

    dom.saveProjectBtn.addEventListener("click", () => {
      syncProjectFromInputs();
      writeStore();
      setStatus("Project saved to local storage.", "success");
    });
  }

  function wirePromptInputs() {
    const syncOnInput = () => {
      syncProjectFromInputs();
      const project = getCurrentProject();
      if (project) {
        syncConceptCountInputFromPrompt(project);
      }
      renderMasterCard();
      renderDirectionButtons();
      renderFrameStrip();
      renderEditorCanvas();
    };

    [
      dom.characterNameInput,
      dom.promptInput,
      dom.negativePromptInput,
      dom.stylePresetSelect,
      dom.spriteSizeInput,
      dom.directionSetSelect,
      dom.animationTypeSelect,
      dom.generationModeSelect,
      dom.generationEndpointInput
    ].forEach((element) => {
      element.addEventListener("change", syncOnInput);
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") element.addEventListener("input", syncOnInput);
    });

    const clampConceptCountInput = () => {
      const parsed = Math.floor(Number(dom.conceptCountInput.value || 1));
      const clamped = clamp(Number.isNaN(parsed) ? 1 : parsed, 1, 6);
      dom.conceptCountInput.value = String(clamped);
    };
    dom.conceptCountInput.addEventListener("change", clampConceptCountInput);
    dom.conceptCountInput.addEventListener("input", clampConceptCountInput);

    dom.generateConceptsBtn.addEventListener("click", () => generateConcepts());
    dom.clearConceptsBtn.addEventListener("click", () => {
      const project = getCurrentProject();
      if (!project) return;
      project.concepts = [];
      touchProject(project);
      renderConceptGrid();
      setStatus("Concept grid cleared.", "success");
    });
  }

  function wireReferenceControls() {
    dom.referenceUploadInput.addEventListener("change", (event) => {
      const files = event.target.files;
      if (!files || !files.length) return;
      handleReferenceUpload(files);
      dom.referenceUploadInput.value = "";
    });

    dom.addReferenceUrlBtn.addEventListener("click", () => {
      const value = String(dom.referenceUrlInput.value || "");
      handleReferenceUrlAdd(value).then((added) => {
        if (added) dom.referenceUrlInput.value = "";
      });
    });

    dom.referenceUrlInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const value = String(dom.referenceUrlInput.value || "");
      handleReferenceUrlAdd(value).then((added) => {
        if (added) dom.referenceUrlInput.value = "";
      });
    });
  }

  function wireMasterControls() {
    dom.saveMasterNotesBtn.addEventListener("click", () => {
      const project = getCurrentProject();
      if (!project) return;
      project.notes = String(dom.masterNotesInput.value || "").trim();
      if (project.masterMetadata) project.masterMetadata.notes = project.notes;
      touchProject(project);
      renderMasterCard();
      setStatus("Master notes saved.", "success");
    });

    dom.generateDirectionBtn.addEventListener("click", () => generateDirection(state.selectedDirection));
    dom.generateAllDirectionsBtn.addEventListener("click", () => generateAllDirections());
    dom.generateFrameVariantBtn.addEventListener("click", () => generateFrameVariant());
    dom.regenerateSelectedFrameBtn.addEventListener("click", () => regenerateSelectedFrame());
  }

  function wireEditorControls() {
    Array.from(document.querySelectorAll(".editor-tool-btn")).forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedEditorTool = button.dataset.editorTool;
        Array.from(document.querySelectorAll(".editor-tool-btn")).forEach((entry) => entry.classList.toggle("active", entry === button));
      });
    });

    dom.editorUndoBtn.addEventListener("click", () => undoFrame());
    dom.editorRedoBtn.addEventListener("click", () => redoFrame());

    dom.editorZoomOutBtn.addEventListener("click", () => {
      state.editor.zoom = clamp(state.editor.zoom - 1, 2, 24);
      renderEditorCanvas();
    });
    dom.editorZoomInBtn.addEventListener("click", () => {
      state.editor.zoom = clamp(state.editor.zoom + 1, 2, 24);
      renderEditorCanvas();
    });

    dom.editorResetPanBtn.addEventListener("click", () => {
      state.editor.panX = 0;
      state.editor.panY = 0;
      renderEditorCanvas();
    });

    dom.editorGridChk.addEventListener("change", () => {
      state.editor.gridVisible = dom.editorGridChk.checked;
      renderEditorCanvas();
    });

    dom.editorOnionChk.addEventListener("change", () => {
      state.editor.onionVisible = dom.editorOnionChk.checked;
      renderEditorCanvas();
    });

    dom.editorColorInput.addEventListener("input", () => {
      state.editor.selectedColor = String(dom.editorColorInput.value || "#d9a066");
      renderPaletteSwatches();
    });

    dom.frameEditorCanvas.addEventListener("mousedown", (event) => beginEditorStroke(event));
    dom.frameEditorCanvas.addEventListener("mousemove", (event) => moveEditorStroke(event));
    dom.frameEditorCanvas.addEventListener("mouseup", () => endEditorStroke());
    dom.frameEditorCanvas.addEventListener("mouseleave", () => endEditorStroke());
    dom.frameEditorCanvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const delta = event.deltaY < 0 ? 1 : -1;
      state.editor.zoom = clamp(state.editor.zoom + delta, 2, 24);
      renderEditorCanvas();
    });
    dom.frameEditorCanvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  function wirePreviewControls() {
    dom.previewPlayPauseBtn.addEventListener("click", () => {
      state.preview.playing = !state.preview.playing;
      dom.previewPlayPauseBtn.textContent = state.preview.playing ? "Pause" : "Play";
    });

    dom.previewStepBtn.addEventListener("click", () => {
      const project = getCurrentProject();
      if (!project) return;
      const frames = getFrameSequence(project, state.selectedDirection);
      if (!frames.length) return;
      state.preview.frameIndex = (state.preview.frameIndex + 1) % frames.length;
      renderAnimationPreview();
    });

    dom.previewLoopChk.addEventListener("change", () => {
      state.preview.loop = dom.previewLoopChk.checked;
    });

    dom.previewSpeedInput.addEventListener("input", () => {
      state.preview.speed = clamp(Number(dom.previewSpeedInput.value || 1), 0.4, 2.5);
      dom.previewSpeedValue.textContent = `${state.preview.speed.toFixed(1)}x`;
    });

    dom.previewScaleSelect.addEventListener("change", () => {
      state.preview.scaleMode = String(dom.previewScaleSelect.value || "2");
      renderAnimationPreview();
    });
  }

  function isTypingTarget(target) {
    if (!target) return false;
    const tag = String(target.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
  }

  function wireSandboxKeys() {
    window.addEventListener("keydown", (event) => {
      const key = String(event.key || "").toLowerCase();
      if (event.code === "Space") state.editor.spacePressed = true;
      if (isTypingTarget(event.target)) return;
      if (key === "w" || key === "a" || key === "s" || key === "d") state.sandbox.keys[key] = true;
    });

    window.addEventListener("keyup", (event) => {
      const key = String(event.key || "").toLowerCase();
      if (event.code === "Space") state.editor.spacePressed = false;
      if (key === "w" || key === "a" || key === "s" || key === "d") state.sandbox.keys[key] = false;
    });

    window.addEventListener("blur", () => {
      state.sandbox.keys.w = false;
      state.sandbox.keys.a = false;
      state.sandbox.keys.s = false;
      state.sandbox.keys.d = false;
      state.editor.spacePressed = false;
      endEditorStroke();
    });
  }

  function wireExportControls() {
    dom.runValidationBtn.addEventListener("click", () => runValidation());
    dom.exportCurrentFrameBtn.addEventListener("click", () => exportCurrentFrame());
    dom.exportCurrentDirectionBtn.addEventListener("click", () => exportCurrentDirection());
    dom.exportAllDirectionsBtn.addEventListener("click", () => exportAllDirections());
  }

  function init() {
    bootstrapStylePresets();
    loadStoreAndBootstrapProject();
    renderPaletteSwatches();

    wireProjectBar();
    wirePromptInputs();
    wireReferenceControls();
    wireMasterControls();
    wireEditorControls();
    wirePreviewControls();
    wireSandboxKeys();
    wireExportControls();

    state.preview.loop = dom.previewLoopChk.checked;
    state.preview.speed = Number(dom.previewSpeedInput.value || 1);
    dom.previewSpeedValue.textContent = `${state.preview.speed.toFixed(1)}x`;
    state.preview.scaleMode = String(dom.previewScaleSelect.value || "2");

    renderAll();
    runValidation();
    window.requestAnimationFrame(tick);
    setStatus("Sprite builder ready. Generate concepts to start.", "success");
  }

  init();
})();
