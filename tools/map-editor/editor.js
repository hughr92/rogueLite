
(function () {
  const LOCAL_MAPS_KEY = "rl_map_editor_maps_v2";
  const LOCAL_LEVEL_SLOTS_KEY = "rl_map_editor_level_slots_v2";
  const DEFAULT_MAP_SIZE = { width: 2200, height: 1500 };
  const HISTORY_LIMIT = 60;

  const LEVEL_OPTIONS = Array.from({ length: 10 }, (_, index) => {
    const levelIndex = index + 1;
    return { id: `level_${levelIndex}`, index: levelIndex, label: `Level ${levelIndex}` };
  });
  const BUNDLED_LEVEL_TEMPLATE_PATHS = {
    level_1: "./maps/level_1_v1.json"
  };

  const TERRAIN_TYPES = [
    { id: "ground", label: "Ground", layer: "terrain" },
    { id: "water", label: "Water", layer: "terrain" },
    { id: "path", label: "Path", layer: "terrain" },
    { id: "trees", label: "Trees", layer: "props" },
    { id: "walls", label: "Walls", layer: "collision" }
  ];

  const THEMES = [
    { id: "forest", label: "Forest", mapFill: "#1c2a23", mapBorder: "#506b59", grid: "rgba(86, 120, 99, 0.24)", palette: { ground: "#2c4737", water: "#2c6c8f", path: "#7d6a48", trees: "#3b7f55", walls: "#6a7b6d" }, transition: { waterEdge: "rgba(165, 223, 255, 0.65)", pathEdge: "rgba(196, 166, 122, 0.58)" } },
    { id: "desert", label: "Desert", mapFill: "#2f2415", mapBorder: "#8d6d38", grid: "rgba(150, 118, 62, 0.24)", palette: { ground: "#8b6e3f", water: "#5f8aa3", path: "#b59662", trees: "#9a7f4a", walls: "#b39058" }, transition: { waterEdge: "rgba(186, 221, 245, 0.58)", pathEdge: "rgba(236, 202, 148, 0.56)" } },
    { id: "snow", label: "Snow", mapFill: "#1d2533", mapBorder: "#7f9dc0", grid: "rgba(155, 186, 220, 0.26)", palette: { ground: "#6e87a5", water: "#5a8ca9", path: "#9ea8b7", trees: "#7ba4bc", walls: "#8ca4bc" }, transition: { waterEdge: "rgba(220, 244, 255, 0.66)", pathEdge: "rgba(228, 233, 243, 0.55)" } },
    { id: "necrotic", label: "Necrotic", mapFill: "#221a27", mapBorder: "#725b7b", grid: "rgba(120, 94, 133, 0.24)", palette: { ground: "#4f3f58", water: "#5a4c7c", path: "#7a668a", trees: "#695874", walls: "#8f7b99" }, transition: { waterEdge: "rgba(221, 190, 255, 0.52)", pathEdge: "rgba(205, 183, 219, 0.52)" } }
  ];

  const TOOL_LABELS = {
    select: "Select",
    paint: "Paint",
    river: "River/Path",
    play_area: "Play Area",
    play_area_rect: "Play Area Rect",
    player_start: "Player Start",
    eraser: "Eraser"
  };

  const dom = {
    canvas: document.getElementById("mapCanvas"),
    toolButtons: document.getElementById("toolButtons"),
    terrainTypeSelect: document.getElementById("terrainTypeSelect"),
    themePreviewSelect: document.getElementById("themePreviewSelect"),
    gridVisibleChk: document.getElementById("gridVisibleChk"),
    gridSizeInput: document.getElementById("gridSizeInput"),
    layerBackgroundChk: document.getElementById("layerBackgroundChk"),
    layerTerrainChk: document.getElementById("layerTerrainChk"),
    layerPropsChk: document.getElementById("layerPropsChk"),
    layerPlayAreaChk: document.getElementById("layerPlayAreaChk"),
    layerCollisionChk: document.getElementById("layerCollisionChk"),
    brushSizeInput: document.getElementById("brushSizeInput"),
    brushDensityInput: document.getElementById("brushDensityInput"),
    brushRandomnessInput: document.getElementById("brushRandomnessInput"),
    brushSoftnessInput: document.getElementById("brushSoftnessInput"),
    brushSizeLabel: document.getElementById("brushSizeLabel"),
    brushDensityLabel: document.getElementById("brushDensityLabel"),
    brushRandomnessLabel: document.getElementById("brushRandomnessLabel"),
    brushSoftnessLabel: document.getElementById("brushSoftnessLabel"),
    importBackgroundBtn: document.getElementById("importBackgroundBtn"),
    importBackgroundInput: document.getElementById("importBackgroundInput"),
    clearBackgroundBtn: document.getElementById("clearBackgroundBtn"),
    backgroundOpacityInput: document.getElementById("backgroundOpacityInput"),
    backgroundScaleInput: document.getElementById("backgroundScaleInput"),
    backgroundOffsetXInput: document.getElementById("backgroundOffsetXInput"),
    backgroundOffsetYInput: document.getElementById("backgroundOffsetYInput"),
    backgroundOpacityLabel: document.getElementById("backgroundOpacityLabel"),
    backgroundScaleLabel: document.getElementById("backgroundScaleLabel"),
    clearPlayAreaBtn: document.getElementById("clearPlayAreaBtn"),
    playAreaSummary: document.getElementById("playAreaSummary"),
    playerStartSummary: document.getElementById("playerStartSummary"),
    resetPlayerStartBtn: document.getElementById("resetPlayerStartBtn"),
    mapIdInput: document.getElementById("mapIdInput"),
    mapNameInput: document.getElementById("mapNameInput"),
    mapWidthInput: document.getElementById("mapWidthInput"),
    mapHeightInput: document.getElementById("mapHeightInput"),
    defaultThemeInput: document.getElementById("defaultThemeInput"),
    selectionProperties: document.getElementById("selectionProperties"),
    modeLabel: document.getElementById("modeLabel"),
    coordsLabel: document.getElementById("coordsLabel"),
    zoomLabel: document.getElementById("zoomLabel"),
    statusText: document.getElementById("statusText"),
    validationText: document.getElementById("validationText"),
    undoBtn: document.getElementById("undoBtn"),
    redoBtn: document.getElementById("redoBtn"),
    newMapBtn: document.getElementById("newMapBtn"),
    openFileBtn: document.getElementById("openFileBtn"),
    openFileInput: document.getElementById("openFileInput"),
    saveFileBtn: document.getElementById("saveFileBtn"),
    copyJsonBtn: document.getElementById("copyJsonBtn"),
    saveLocalBtn: document.getElementById("saveLocalBtn"),
    localMapSelect: document.getElementById("localMapSelect"),
    loadLocalBtn: document.getElementById("loadLocalBtn"),
    validateBtn: document.getElementById("validateBtn"),
    levelEditSelect: document.getElementById("levelEditSelect")
  };

  const ctx = dom.canvas.getContext("2d");

  const state = {
    activeLevelId: LEVEL_OPTIONS[0].id,
    map: null,
    tool: "select",
    selectedTerrainId: null,
    camera: { x: DEFAULT_MAP_SIZE.width * 0.5, y: DEFAULT_MAP_SIZE.height * 0.5, zoom: 0.45 },
    keyboard: { space: false },
    hoverWorld: { x: 0, y: 0 },
    needsRender: true,
    drag: null,
    stroke: null,
    history: { undo: [], redo: [] },
    grid: { visible: true, size: 32 },
    brush: { size: 3, density: 0.6, randomness: 0.35, softness: 0.7 },
    layerVisibility: { background: true, terrain: true, props: true, playArea: true, collision: true },
    terrainPlacementType: TERRAIN_TYPES[0].id,
    themePreviewId: THEMES[0].id,
    assetCache: Object.create(null)
  };

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function nextId(prefix) { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }
  function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
  function randRange(min, max) { return min + Math.random() * (max - min); }
  function getLevelOption(levelId) { return LEVEL_OPTIONS.find((level) => level.id === levelId) || LEVEL_OPTIONS[0]; }
  function getTheme(themeId) { return THEMES.find((theme) => theme.id === themeId) || THEMES[0]; }
  function getTerrainType(terrainId) { return TERRAIN_TYPES.find((entry) => entry.id === terrainId) || TERRAIN_TYPES[0]; }
  function getTerrainLayer(terrainId) { return getTerrainType(terrainId).layer; }
  function getGridSize() { return Math.max(8, Number(state.grid.size || 32)); }
  function createDefaultBackgroundImage() { return { src: "", opacity: 0.5, scale: 1, offsetX: 0, offsetY: 0 }; }
  function createDefaultPlayerStart(mapWidth, mapHeight) {
    return {
      x: Math.max(0, Number(mapWidth || DEFAULT_MAP_SIZE.width)) * 0.5,
      y: Math.max(0, Number(mapHeight || DEFAULT_MAP_SIZE.height)) * 0.5
    };
  }

  function createDefaultMap(levelId) {
    const level = getLevelOption(levelId);
    const themeId = THEMES[0].id;
    return {
      id: `${level.id}_layout`,
      levelId: level.id,
      name: `${level.label} Layout`,
      width: DEFAULT_MAP_SIZE.width,
      height: DEFAULT_MAP_SIZE.height,
      theme: themeId,
      defaultThemeId: themeId,
      terrain: [],
      props: [],
      playAreaMask: [],
      backgroundImage: null,
      playerStart: createDefaultPlayerStart(DEFAULT_MAP_SIZE.width, DEFAULT_MAP_SIZE.height),
      boundaries: [],
      crossings: []
    };
  }

  function setStatus(message, severity) {
    dom.statusText.textContent = message;
    dom.statusText.style.color = severity === "error" ? "#ffd0d7" : severity === "success" ? "#c9f5d7" : "#d7e3fb";
  }

  function setValidationSummary(errors, warnings) {
    const errorCount = Array.isArray(errors) ? errors.length : 0;
    const warningCount = Array.isArray(warnings) ? warnings.length : 0;
    if (!errorCount && !warningCount) {
      dom.validationText.textContent = "Validation: clean";
      dom.validationText.style.color = "#c9f5d7";
      return;
    }
    dom.validationText.textContent = `Validation: ${errorCount} error(s), ${warningCount} warning(s)`;
    dom.validationText.style.color = errorCount ? "#ffd0d7" : "#ffe7b8";
  }

  function requestRender() { state.needsRender = true; }
  function getCanvasPointFromEvent(event) { const rect = dom.canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }

  function worldToScreen(point) {
    const cw = dom.canvas.width;
    const ch = dom.canvas.height;
    return { x: (point.x - state.camera.x) * state.camera.zoom + cw * 0.5, y: (point.y - state.camera.y) * state.camera.zoom + ch * 0.5 };
  }

  function screenToWorld(point) {
    const cw = dom.canvas.width;
    const ch = dom.canvas.height;
    return { x: (point.x - cw * 0.5) / state.camera.zoom + state.camera.x, y: (point.y - ch * 0.5) / state.camera.zoom + state.camera.y };
  }

  function clampPointToMap(point) { return { x: clamp(point.x, 0, state.map.width), y: clamp(point.y, 0, state.map.height) }; }
  function pointInsideMap(point) { return point.x >= 0 && point.y >= 0 && point.x <= state.map.width && point.y <= state.map.height; }
  function worldToGrid(point) { const grid = getGridSize(); return { gx: Math.floor(point.x / grid), gy: Math.floor(point.y / grid) }; }
  function gridToWorld(gx, gy) { const grid = getGridSize(); return { x: (gx + 0.5) * grid, y: (gy + 0.5) * grid }; }
  function terrainKey(gx, gy) { return `${gx}:${gy}`; }
  function playAreaKey(gx, gy) { return `${gx}:${gy}`; }

  function makeTerrainStamp(gx, gy, terrainType, options) {
    const grid = getGridSize();
    const world = gridToWorld(gx, gy);
    const randomness = Math.max(0, Number((options && options.randomness) || state.brush.randomness || 0));
    const jitterMax = grid * 0.18 * randomness;
    return { id: nextId("cell"), key: terrainKey(gx, gy), gx, gy, x: world.x, y: world.y, terrainType, layer: getTerrainLayer(terrainType), variantIndex: Math.floor(Math.random() * 4), rotationDeg: randRange(-10, 10), scale: clamp(randRange(0.92, 1.08), 0.75, 1.25), jitterX: randRange(-jitterMax, jitterMax), jitterY: randRange(-jitterMax, jitterMax) };
  }

  function normalizeTerrainStamp(rawStamp, mapWidth, mapHeight) {
    const stamp = rawStamp && typeof rawStamp === "object" ? rawStamp : {};
    const terrainType = TERRAIN_TYPES.some((entry) => entry.id === stamp.terrainType) ? stamp.terrainType : TERRAIN_TYPES.some((entry) => entry.id === stamp.type) ? stamp.type : TERRAIN_TYPES[0].id;
    const grid = getGridSize();
    const gx = Number.isFinite(Number(stamp.gx)) ? Math.floor(Number(stamp.gx)) : Number.isFinite(Number(stamp.x)) ? Math.floor(Number(stamp.x) / grid) : 0;
    const gy = Number.isFinite(Number(stamp.gy)) ? Math.floor(Number(stamp.gy)) : Number.isFinite(Number(stamp.y)) ? Math.floor(Number(stamp.y) / grid) : 0;
    const world = gridToWorld(gx, gy);
    return { id: String(stamp.id || nextId("cell")).trim() || nextId("cell"), key: terrainKey(gx, gy), gx, gy, x: clamp(Number.isFinite(Number(stamp.x)) ? Number(stamp.x) : world.x, 0, mapWidth), y: clamp(Number.isFinite(Number(stamp.y)) ? Number(stamp.y) : world.y, 0, mapHeight), terrainType, layer: getTerrainLayer(terrainType), variantIndex: Math.max(0, Math.floor(Number(stamp.variantIndex || 0))) % 4, rotationDeg: clamp(Number(stamp.rotationDeg || stamp.rotation || 0), -45, 45), scale: clamp(Number(stamp.scale || 1), 0.6, 1.6), jitterX: clamp(Number(stamp.jitterX || 0), -grid * 0.4, grid * 0.4), jitterY: clamp(Number(stamp.jitterY || 0), -grid * 0.4, grid * 0.4) };
  }

  function normalizePlayAreaMask(rawMask, mapWidth, mapHeight) {
    const source = Array.isArray(rawMask) ? rawMask : [];
    const grid = getGridSize();
    const seen = Object.create(null);
    const normalized = [];
    source.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;
      const gx = Number.isFinite(Number(entry.gx)) ? Math.floor(Number(entry.gx)) : Number.isFinite(Number(entry.x)) ? Math.floor(Number(entry.x) / grid) : null;
      const gy = Number.isFinite(Number(entry.gy)) ? Math.floor(Number(entry.gy)) : Number.isFinite(Number(entry.y)) ? Math.floor(Number(entry.y) / grid) : null;
      if (!Number.isFinite(gx) || !Number.isFinite(gy)) return;
      const center = gridToWorld(gx, gy);
      if (center.x < 0 || center.y < 0 || center.x > mapWidth || center.y > mapHeight) return;
      const key = playAreaKey(gx, gy);
      if (seen[key]) return;
      seen[key] = true;
      normalized.push({ gx, gy });
    });
    return normalized;
  }

  function normalizeBackgroundImage(rawBackground) {
    if (!rawBackground || typeof rawBackground !== "object") return null;
    const src = String(rawBackground.src || "").trim();
    if (!src) return null;
    return { src, opacity: clamp(Number(rawBackground.opacity || 0.5), 0, 1), scale: clamp(Number(rawBackground.scale || 1), 0.2, 3), offsetX: Number(rawBackground.offsetX || 0), offsetY: Number(rawBackground.offsetY || 0) };
  }

  function normalizePlayerStart(rawPlayerStart, mapWidth, mapHeight) {
    const fallback = createDefaultPlayerStart(mapWidth, mapHeight);
    if (!rawPlayerStart || typeof rawPlayerStart !== "object" || Array.isArray(rawPlayerStart)) return fallback;
    const parsedX = Number(rawPlayerStart.x);
    const parsedY = Number(rawPlayerStart.y);
    return {
      x: Number.isFinite(parsedX) ? clamp(parsedX, 0, mapWidth) : fallback.x,
      y: Number.isFinite(parsedY) ? clamp(parsedY, 0, mapHeight) : fallback.y
    };
  }

  function normalizeMapData(rawMap) {
    const source = rawMap && typeof rawMap === "object" ? rawMap : {};
    const parsedLevelId = LEVEL_OPTIONS.some((level) => level.id === source.levelId) ? String(source.levelId) : state.activeLevelId;
    const width = Math.max(200, Number(source.width || DEFAULT_MAP_SIZE.width));
    const height = Math.max(200, Number(source.height || DEFAULT_MAP_SIZE.height));
    const theme = THEMES.some((entry) => entry.id === source.theme) ? source.theme : THEMES.some((entry) => entry.id === source.defaultThemeId) ? source.defaultThemeId : THEMES[0].id;
    const normalized = {
      id: String(source.id || nextId("map")).trim() || nextId("map"),
      levelId: parsedLevelId,
      name: String(source.name || "Imported Map").trim() || "Imported Map",
      width,
      height,
      theme,
      defaultThemeId: theme,
      terrain: [],
      props: Array.isArray(source.props) ? deepClone(source.props) : [],
      playAreaMask: normalizePlayAreaMask(source.playAreaMask, width, height),
      backgroundImage: normalizeBackgroundImage(source.backgroundImage),
      playerStart: normalizePlayerStart(source.playerStart, width, height),
      boundaries: Array.isArray(source.boundaries) ? deepClone(source.boundaries) : [],
      crossings: Array.isArray(source.crossings) ? deepClone(source.crossings) : []
    };
    const terrainSource = Array.isArray(source.terrain) ? source.terrain : Array.isArray(source.terrainObjects) ? source.terrainObjects.map((entry) => ({ terrainType: TERRAIN_TYPES.some((type) => type.id === entry.type) ? entry.type : "trees", x: entry.x, y: entry.y, rotationDeg: entry.rotation, scale: entry.scale })) : [];
    const deduped = Object.create(null);
    terrainSource.forEach((entry) => { const stamp = normalizeTerrainStamp(entry, width, height); deduped[stamp.key] = stamp; });
    normalized.terrain = Object.values(deduped);
    return normalized;
  }

  function toJsonMap() {
    const terrain = deepClone(state.map.terrain).map((stamp) => ({ id: stamp.id, key: stamp.key, gx: stamp.gx, gy: stamp.gy, x: stamp.x, y: stamp.y, terrainType: stamp.terrainType, layer: stamp.layer, variantIndex: stamp.variantIndex, rotationDeg: stamp.rotationDeg, scale: stamp.scale, jitterX: stamp.jitterX, jitterY: stamp.jitterY }));
    const terrainObjects = terrain.map((stamp) => ({ id: stamp.id, type: stamp.terrainType, x: stamp.x, y: stamp.y, rotation: stamp.rotationDeg, scale: stamp.scale }));
    const props = terrain.filter((stamp) => stamp.layer === "props").map((stamp) => ({ id: stamp.id, type: stamp.terrainType, x: stamp.x, y: stamp.y, rotation: stamp.rotationDeg, scale: stamp.scale }));
    return {
      id: state.map.id,
      levelId: state.activeLevelId,
      name: state.map.name,
      width: state.map.width,
      height: state.map.height,
      theme: state.map.theme,
      defaultThemeId: state.map.theme,
      terrain,
      props,
      playAreaMask: deepClone(state.map.playAreaMask),
      backgroundImage: state.map.backgroundImage ? deepClone(state.map.backgroundImage) : null,
      playerStart: state.map.playerStart ? deepClone(state.map.playerStart) : null,
      terrainObjects,
      boundaries: Array.isArray(state.map.boundaries) ? deepClone(state.map.boundaries) : [],
      crossings: Array.isArray(state.map.crossings) ? deepClone(state.map.crossings) : []
    };
  }

  function pushHistory(label) {
    state.history.undo.push({ label: label || "Edit", map: deepClone(state.map), selectedTerrainId: state.selectedTerrainId });
    if (state.history.undo.length > HISTORY_LIMIT) state.history.undo.shift();
    state.history.redo = [];
    dom.undoBtn.disabled = state.history.undo.length === 0;
    dom.redoBtn.disabled = state.history.redo.length === 0;
  }

  function restoreSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;
    state.map = normalizeMapData(snapshot.map);
    state.selectedTerrainId = snapshot.selectedTerrainId || null;
    state.activeLevelId = state.map.levelId;
    state.themePreviewId = state.map.theme;
    syncMapInputs();
    syncBackgroundControls();
    renderSelectionProperties();
    updatePlayAreaSummary();
    requestRender();
  }

  function undo() {
    if (!state.history.undo.length) return;
    state.history.redo.push({ label: "Redo", map: deepClone(state.map), selectedTerrainId: state.selectedTerrainId });
    const snapshot = state.history.undo.pop();
    restoreSnapshot(snapshot);
    dom.undoBtn.disabled = state.history.undo.length === 0;
    dom.redoBtn.disabled = state.history.redo.length === 0;
    setStatus(`Undo: ${snapshot.label}.`, "success");
  }

  function redo() {
    if (!state.history.redo.length) return;
    state.history.undo.push({ label: "Undo", map: deepClone(state.map), selectedTerrainId: state.selectedTerrainId });
    const snapshot = state.history.redo.pop();
    restoreSnapshot(snapshot);
    dom.undoBtn.disabled = state.history.undo.length === 0;
    dom.redoBtn.disabled = state.history.redo.length === 0;
    setStatus("Redo applied.", "success");
  }

  function findTerrainStampById(stampId) { return state.map.terrain.find((entry) => entry.id === stampId) || null; }
  function findTerrainStampByGrid(gx, gy) { return state.map.terrain.find((entry) => entry.key === terrainKey(gx, gy)) || null; }

  function setTerrainCell(gx, gy, terrainType, options) {
    const center = gridToWorld(gx, gy);
    if (center.x < 0 || center.y < 0 || center.x > state.map.width || center.y > state.map.height) return false;
    const existing = findTerrainStampByGrid(gx, gy);
    if (existing) {
      existing.terrainType = terrainType;
      existing.layer = getTerrainLayer(terrainType);
      existing.variantIndex = Math.floor(Math.random() * 4);
      existing.rotationDeg = randRange(-10, 10);
      existing.scale = clamp(randRange(0.92, 1.08), 0.75, 1.25);
      const grid = getGridSize();
      const randomness = Math.max(0, Number((options && options.randomness) || state.brush.randomness || 0));
      const jitterMax = grid * 0.18 * randomness;
      existing.jitterX = randRange(-jitterMax, jitterMax);
      existing.jitterY = randRange(-jitterMax, jitterMax);
      return true;
    }
    state.map.terrain.push(makeTerrainStamp(gx, gy, terrainType, options));
    return true;
  }

  function removeTerrainCell(gx, gy) {
    const key = terrainKey(gx, gy);
    const before = state.map.terrain.length;
    state.map.terrain = state.map.terrain.filter((entry) => entry.key !== key);
    if (state.selectedTerrainId && !findTerrainStampById(state.selectedTerrainId)) {
      state.selectedTerrainId = null;
      renderSelectionProperties();
    }
    return state.map.terrain.length < before;
  }

  function hasPlayAreaCell(gx, gy) { return state.map.playAreaMask.some((entry) => playAreaKey(entry.gx, entry.gy) === playAreaKey(gx, gy)); }

  function addPlayAreaCell(gx, gy) {
    const center = gridToWorld(gx, gy);
    if (center.x < 0 || center.y < 0 || center.x > state.map.width || center.y > state.map.height) return false;
    if (hasPlayAreaCell(gx, gy)) return false;
    state.map.playAreaMask.push({ gx, gy });
    return true;
  }

  function removePlayAreaCell(gx, gy) {
    const key = playAreaKey(gx, gy);
    const before = state.map.playAreaMask.length;
    state.map.playAreaMask = state.map.playAreaMask.filter((entry) => playAreaKey(entry.gx, entry.gy) !== key);
    return state.map.playAreaMask.length < before;
  }

  function smoothTerrainCells(changedCells, terrainType) {
    if (!changedCells || !changedCells.size) return;
    if (!["ground", "water", "path"].includes(terrainType)) return;
    const around = [];
    changedCells.forEach((key) => {
      const [gxRaw, gyRaw] = key.split(":");
      const gx = Number(gxRaw);
      const gy = Number(gyRaw);
      if (!Number.isFinite(gx) || !Number.isFinite(gy)) return;
      for (let oy = -1; oy <= 1; oy += 1) for (let ox = -1; ox <= 1; ox += 1) around.push({ gx: gx + ox, gy: gy + oy });
    });
    around.forEach((cell) => {
      const neighbors = [{ gx: cell.gx + 1, gy: cell.gy }, { gx: cell.gx - 1, gy: cell.gy }, { gx: cell.gx, gy: cell.gy + 1 }, { gx: cell.gx, gy: cell.gy - 1 }, { gx: cell.gx + 1, gy: cell.gy + 1 }, { gx: cell.gx + 1, gy: cell.gy - 1 }, { gx: cell.gx - 1, gy: cell.gy + 1 }, { gx: cell.gx - 1, gy: cell.gy - 1 }];
      let sameCount = 0;
      neighbors.forEach((neighbor) => {
        const existing = findTerrainStampByGrid(neighbor.gx, neighbor.gy);
        if (existing && existing.terrainType === terrainType) sameCount += 1;
      });
      const existing = findTerrainStampByGrid(cell.gx, cell.gy);
      if (!existing && sameCount >= 6) setTerrainCell(cell.gx, cell.gy, terrainType, { randomness: 0.2 });
    });
  }

  function getBrushRadiusWorld() { const grid = getGridSize(); return Math.max(grid * 0.5, Number(state.brush.size) * grid * 0.5); }

  function getMaxGridIndexForMap() {
    const grid = getGridSize();
    return {
      maxGx: Math.max(0, Math.floor((state.map.width - 0.001) / grid)),
      maxGy: Math.max(0, Math.floor((state.map.height - 0.001) / grid))
    };
  }

  function getGridRectFromWorldPoints(pointA, pointB) {
    const a = clampPointToMap(pointA);
    const b = clampPointToMap(pointB);
    const ga = worldToGrid(a);
    const gb = worldToGrid(b);
    const limits = getMaxGridIndexForMap();
    const minGx = clamp(Math.min(ga.gx, gb.gx), 0, limits.maxGx);
    const minGy = clamp(Math.min(ga.gy, gb.gy), 0, limits.maxGy);
    const maxGx = clamp(Math.max(ga.gx, gb.gx), 0, limits.maxGx);
    const maxGy = clamp(Math.max(ga.gy, gb.gy), 0, limits.maxGy);
    return { minGx, minGy, maxGx, maxGy };
  }

  function applyPlayAreaRectangle(fromPoint, toPoint, mode) {
    const rect = getGridRectFromWorldPoints(fromPoint, toPoint);
    const modeValue = String(mode || "play_rect_set");
    let changedCount = 0;

    if (modeValue === "play_rect_set") {
      const existing = Array.isArray(state.map.playAreaMask) ? state.map.playAreaMask.length : 0;
      if (existing) {
        state.map.playAreaMask = [];
        changedCount += existing;
      }
      for (let gy = rect.minGy; gy <= rect.maxGy; gy += 1) {
        for (let gx = rect.minGx; gx <= rect.maxGx; gx += 1) {
          if (addPlayAreaCell(gx, gy)) changedCount += 1;
        }
      }
    } else if (modeValue === "play_rect_remove") {
      for (let gy = rect.minGy; gy <= rect.maxGy; gy += 1) {
        for (let gx = rect.minGx; gx <= rect.maxGx; gx += 1) {
          if (removePlayAreaCell(gx, gy)) changedCount += 1;
        }
      }
    }

    if (changedCount > 0) {
      updatePlayAreaSummary();
      renderSelectionProperties();
      requestRender();
    }
    return { ...rect, changedCount };
  }

  function applyBrushAt(worldPoint, mode, overrideTerrainType) {
    const radius = getBrushRadiusWorld();
    const density = clamp(Number(state.brush.density || 0.6), 0.1, 1);
    const randomness = clamp(Number(state.brush.randomness || 0), 0, 1);
    const softness = clamp(Number(state.brush.softness || 0.7), 0, 1);
    const terrainType = overrideTerrainType || state.terrainPlacementType;
    const samples = Math.max(1, Math.round(density * 14));
    const changed = new Set();
    let didChange = false;

    for (let i = 0; i < samples; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius;
      const falloff = 1 - distance / Math.max(1, radius);
      const threshold = Math.pow(Math.max(0, falloff), 1 + (1 - softness) * 2);
      if (Math.random() > Math.max(0.05, threshold)) continue;
      const jitterDistance = randomness * getGridSize() * 0.25;
      const jitterAngle = Math.random() * Math.PI * 2;
      const px = worldPoint.x + Math.cos(angle) * distance + Math.cos(jitterAngle) * jitterDistance;
      const py = worldPoint.y + Math.sin(angle) * distance + Math.sin(jitterAngle) * jitterDistance;
      const point = clampPointToMap({ x: px, y: py });
      const gridPoint = worldToGrid(point);
      const key = terrainKey(gridPoint.gx, gridPoint.gy);

      if (mode === "paint") {
        if (setTerrainCell(gridPoint.gx, gridPoint.gy, terrainType, { randomness })) { changed.add(key); didChange = true; }
      } else if (mode === "erase") {
        if (removeTerrainCell(gridPoint.gx, gridPoint.gy)) { changed.add(key); didChange = true; }
      } else if (mode === "play_add") {
        if (addPlayAreaCell(gridPoint.gx, gridPoint.gy)) { changed.add(key); didChange = true; }
      } else if (mode === "play_remove") {
        if (removePlayAreaCell(gridPoint.gx, gridPoint.gy)) { changed.add(key); didChange = true; }
      }
    }

    if (mode === "paint" && changed.size) smoothTerrainCells(changed, terrainType);
    if (didChange) {
      updatePlayAreaSummary();
      renderSelectionProperties();
      requestRender();
    }
  }

  function applyBrushBetween(fromPoint, toPoint, mode, overrideTerrainType) {
    const distance = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
    const step = Math.max(4, getBrushRadiusWorld() * 0.32);
    const count = Math.max(1, Math.ceil(distance / step));
    for (let i = 0; i <= count; i += 1) {
      const t = count === 0 ? 1 : i / count;
      const point = { x: fromPoint.x + (toPoint.x - fromPoint.x) * t, y: fromPoint.y + (toPoint.y - fromPoint.y) * t };
      applyBrushAt(point, mode, overrideTerrainType);
    }
  }

  function applyRiverStroke(points) {
    if (!Array.isArray(points) || points.length < 2) return;
    const riverTerrainType = ["water", "path"].includes(state.terrainPlacementType) ? state.terrainPlacementType : "path";
    for (let i = 1; i < points.length; i += 1) applyBrushBetween(points[i - 1], points[i], "paint", riverTerrainType);
    setStatus(`${TOOL_LABELS.river} applied as ${riverTerrainType}.`, "success");
  }

  function findTerrainHit(worldPoint) {
    const grid = getGridSize();
    for (let i = state.map.terrain.length - 1; i >= 0; i -= 1) {
      const stamp = state.map.terrain[i];
      const radius = grid * 0.45 * Math.max(0.7, Number(stamp.scale || 1));
      if (Math.hypot(worldPoint.x - stamp.x, worldPoint.y - stamp.y) <= radius) return stamp;
    }
    return null;
  }

  function clearSelection() { state.selectedTerrainId = null; renderSelectionProperties(); }
  function setSelection(stamp) { state.selectedTerrainId = stamp ? stamp.id : null; renderSelectionProperties(); }

  function deleteSelection() {
    if (!state.selectedTerrainId) return;
    const selected = findTerrainStampById(state.selectedTerrainId);
    if (!selected) {
      state.selectedTerrainId = null;
      renderSelectionProperties();
      return;
    }
    pushHistory("Delete stamp");
    removeTerrainCell(selected.gx, selected.gy);
    state.selectedTerrainId = null;
    renderSelectionProperties();
    requestRender();
    setStatus("Terrain stamp deleted.", "success");
  }

  function duplicateSelection() {
    if (!state.selectedTerrainId) return;
    const selected = findTerrainStampById(state.selectedTerrainId);
    if (!selected) return;
    pushHistory("Duplicate stamp");
    const duplicateGx = selected.gx + 1;
    const duplicateGy = selected.gy + 1;
    setTerrainCell(duplicateGx, duplicateGy, selected.terrainType, { randomness: state.brush.randomness });
    const duplicate = findTerrainStampByGrid(duplicateGx, duplicateGy);
    if (duplicate) {
      duplicate.scale = selected.scale;
      duplicate.rotationDeg = selected.rotationDeg;
      setSelection(duplicate);
    }
    requestRender();
    setStatus("Terrain stamp duplicated.", "success");
  }

  function wrapField(labelText, inputElement) {
    const wrapper = document.createElement("div");
    wrapper.className = "field-block";
    const label = document.createElement("label");
    label.textContent = labelText;
    wrapper.appendChild(label);
    wrapper.appendChild(inputElement);
    return wrapper;
  }

  function numberInput(initialValue, min, max, step, onChange) {
    const input = document.createElement("input");
    input.className = "input";
    input.type = "number";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(Number(initialValue || 0).toFixed(step >= 1 ? 0 : 2));
    input.addEventListener("change", () => {
      const value = clamp(Number(input.value) || 0, min, max);
      onChange(value);
      input.value = String(Number(value.toFixed(step >= 1 ? 0 : 2)));
    });
    return input;
  }

  function renderSelectionProperties() {
    dom.selectionProperties.innerHTML = "";
    const selected = state.selectedTerrainId ? findTerrainStampById(state.selectedTerrainId) : null;
    if (!selected) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Select terrain with the Select tool to inspect/edit a stamp.";
      dom.selectionProperties.appendChild(empty);
      return;
    }

    const card = document.createElement("div");
    card.className = "selection-card";
    const title = document.createElement("h3");
    title.textContent = `Terrain Stamp (${selected.terrainType})`;
    card.appendChild(title);

    const row = document.createElement("div");
    row.className = "selection-row";
    const typeSelect = document.createElement("select");
    typeSelect.className = "input";
    TERRAIN_TYPES.forEach((type) => {
      const option = document.createElement("option");
      option.value = type.id;
      option.textContent = type.label;
      if (selected.terrainType === type.id) option.selected = true;
      typeSelect.appendChild(option);
    });
    typeSelect.addEventListener("change", () => {
      selected.terrainType = typeSelect.value;
      selected.layer = getTerrainLayer(typeSelect.value);
      requestRender();
    });
    row.appendChild(wrapField("Type", typeSelect));
    row.appendChild(wrapField("Scale", numberInput(selected.scale, 0.6, 1.6, 0.05, (value) => { selected.scale = value; requestRender(); })));
    card.appendChild(row);

    const row2 = document.createElement("div");
    row2.className = "selection-row";
    row2.appendChild(wrapField("Rotation", numberInput(selected.rotationDeg, -45, 45, 1, (value) => { selected.rotationDeg = value; requestRender(); })));
    row2.appendChild(wrapField("Variant", numberInput(selected.variantIndex + 1, 1, 4, 1, (value) => { selected.variantIndex = Math.max(0, Math.floor(value) - 1); requestRender(); })));
    card.appendChild(row2);

    const positionRow = document.createElement("div");
    positionRow.className = "selection-row";
    positionRow.appendChild(wrapField("X", numberInput(selected.x, 0, state.map.width, 1, (value) => { selected.x = value; selected.gx = worldToGrid({ x: selected.x, y: selected.y }).gx; selected.key = terrainKey(selected.gx, selected.gy); requestRender(); })));
    positionRow.appendChild(wrapField("Y", numberInput(selected.y, 0, state.map.height, 1, (value) => { selected.y = value; selected.gy = worldToGrid({ x: selected.x, y: selected.y }).gy; selected.key = terrainKey(selected.gx, selected.gy); requestRender(); })));
    card.appendChild(positionRow);

    const actions = document.createElement("div");
    actions.className = "selection-actions";
    const duplicateBtn = document.createElement("button");
    duplicateBtn.type = "button";
    duplicateBtn.className = "btn";
    duplicateBtn.textContent = "Duplicate";
    duplicateBtn.addEventListener("click", duplicateSelection);
    actions.appendChild(duplicateBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", deleteSelection);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);
    dom.selectionProperties.appendChild(card);
  }

  function resizeCanvas() {
    const rect = dom.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    if (dom.canvas.width !== width || dom.canvas.height !== height) {
      dom.canvas.width = width;
      dom.canvas.height = height;
      requestRender();
    }
  }

  function drawMapBounds(theme) {
    const topLeft = worldToScreen({ x: 0, y: 0 });
    const bottomRight = worldToScreen({ x: state.map.width, y: state.map.height });
    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;
    ctx.fillStyle = theme.mapFill;
    ctx.fillRect(topLeft.x, topLeft.y, width, height);
    ctx.strokeStyle = theme.mapBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(topLeft.x, topLeft.y, width, height);
  }

  function getAssetPathForStamp(themeId, terrainType, variantIndex) {
    const variant = (Math.max(0, Number(variantIndex || 0)) % 4) + 1;
    return `../../assets/themes/${themeId}/${terrainType}/${terrainType}_${String(variant).padStart(2, "0")}.png`;
  }

  function loadImageCached(url) {
    if (!url) return null;
    const cached = state.assetCache[url];
    if (cached) return cached;
    const image = new Image();
    image.src = url;
    state.assetCache[url] = image;
    return image;
  }

  function drawTerrainStampFallback(stamp, theme, center, pixelSize) {
    const color = (theme.palette && theme.palette[stamp.terrainType]) || "#6f7f77";
    ctx.fillStyle = color;
    if (stamp.terrainType === "trees") {
      ctx.beginPath();
      ctx.arc(center.x, center.y, pixelSize * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(25, 15, 8, 0.45)";
      ctx.fillRect(center.x - pixelSize * 0.1, center.y + pixelSize * 0.1, pixelSize * 0.2, pixelSize * 0.24);
      return;
    }
    if (stamp.terrainType === "water") {
      ctx.fillRect(center.x - pixelSize * 0.5, center.y - pixelSize * 0.5, pixelSize, pixelSize);
      return;
    }
    if (stamp.terrainType === "path") {
      ctx.fillRect(center.x - pixelSize * 0.48, center.y - pixelSize * 0.3, pixelSize * 0.96, pixelSize * 0.6);
      return;
    }
    if (stamp.terrainType === "walls") {
      ctx.fillRect(center.x - pixelSize * 0.5, center.y - pixelSize * 0.5, pixelSize, pixelSize);
      ctx.strokeStyle = "rgba(15, 18, 24, 0.5)";
      ctx.lineWidth = Math.max(1, pixelSize * 0.04);
      ctx.strokeRect(center.x - pixelSize * 0.5, center.y - pixelSize * 0.5, pixelSize, pixelSize);
      return;
    }
    ctx.fillRect(center.x - pixelSize * 0.5, center.y - pixelSize * 0.5, pixelSize, pixelSize);
  }

  function drawTerrainTransitions(terrainByKey, theme) {
    const transition = (theme && theme.transition) || {};
    const grid = getGridSize() * state.camera.zoom;
    state.map.terrain.forEach((stamp) => {
      if (!["water", "path"].includes(stamp.terrainType)) return;
      const edgeColor = stamp.terrainType === "water" ? transition.waterEdge : transition.pathEdge;
      if (!edgeColor) return;
      const center = worldToScreen({ x: stamp.x + (stamp.jitterX || 0), y: stamp.y + (stamp.jitterY || 0) });
      const half = grid * 0.5 * Math.max(0.75, Number(stamp.scale || 1));
      const neighbors = [{ dx: 1, dy: 0, side: "right" }, { dx: -1, dy: 0, side: "left" }, { dx: 0, dy: 1, side: "bottom" }, { dx: 0, dy: -1, side: "top" }];
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = Math.max(1, grid * 0.06);
      neighbors.forEach((neighbor) => {
        const near = terrainByKey[terrainKey(stamp.gx + neighbor.dx, stamp.gy + neighbor.dy)];
        if (near && near.terrainType === stamp.terrainType) return;
        ctx.beginPath();
        if (neighbor.side === "right") { ctx.moveTo(center.x + half, center.y - half); ctx.lineTo(center.x + half, center.y + half); }
        else if (neighbor.side === "left") { ctx.moveTo(center.x - half, center.y - half); ctx.lineTo(center.x - half, center.y + half); }
        else if (neighbor.side === "bottom") { ctx.moveTo(center.x - half, center.y + half); ctx.lineTo(center.x + half, center.y + half); }
        else { ctx.moveTo(center.x - half, center.y - half); ctx.lineTo(center.x + half, center.y - half); }
        ctx.stroke();
      });
    });
  }

  function drawTerrain(theme) {
    const grid = getGridSize();
    const terrainByKey = Object.create(null);
    state.map.terrain.forEach((stamp) => { terrainByKey[stamp.key] = stamp; });
    const order = { terrain: 0, props: 1, collision: 2 };
    const sorted = state.map.terrain.slice().sort((a, b) => (order[a.layer] || 0) - (order[b.layer] || 0));

    sorted.forEach((stamp) => {
      if (stamp.layer === "terrain" && !state.layerVisibility.terrain) return;
      if (stamp.layer === "props" && !state.layerVisibility.props) return;
      if (stamp.layer === "collision" && !state.layerVisibility.collision) return;
      const pixelSize = grid * state.camera.zoom * Math.max(0.75, Number(stamp.scale || 1));
      if (pixelSize < 1) return;
      const center = worldToScreen({ x: stamp.x + (stamp.jitterX || 0), y: stamp.y + (stamp.jitterY || 0) });
      const rotation = ((Number(stamp.rotationDeg || 0) || 0) * Math.PI) / 180;
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(rotation);
      const image = loadImageCached(getAssetPathForStamp(state.themePreviewId, stamp.terrainType, stamp.variantIndex));
      if (image && image.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, -pixelSize * 0.5, -pixelSize * 0.5, pixelSize, pixelSize);
      } else {
        drawTerrainStampFallback(stamp, theme, { x: 0, y: 0 }, pixelSize);
      }
      if (state.selectedTerrainId === stamp.id) {
        ctx.strokeStyle = "#fff0b2";
        ctx.lineWidth = 2;
        ctx.strokeRect(-pixelSize * 0.58, -pixelSize * 0.58, pixelSize * 1.16, pixelSize * 1.16);
      }
      ctx.restore();
    });

    if (state.layerVisibility.terrain) drawTerrainTransitions(terrainByKey, theme);
  }

  function drawBackgroundLayer() {
    if (!state.layerVisibility.background) return;
    if (!state.map.backgroundImage || !state.map.backgroundImage.src) return;
    const bg = state.map.backgroundImage;
    const image = loadImageCached(bg.src);
    if (!image || !image.complete || image.naturalWidth <= 0) return;
    const center = worldToScreen({ x: state.map.width * 0.5 + Number(bg.offsetX || 0), y: state.map.height * 0.5 + Number(bg.offsetY || 0) });
    const width = image.naturalWidth * Number(bg.scale || 1) * state.camera.zoom;
    const height = image.naturalHeight * Number(bg.scale || 1) * state.camera.zoom;
    ctx.save();
    ctx.globalAlpha = clamp(Number(bg.opacity || 0.5), 0, 1);
    ctx.drawImage(image, center.x - width * 0.5, center.y - height * 0.5, width, height);
    ctx.restore();
  }

  function drawGrid(theme) {
    if (!state.grid.visible) return;
    const spacing = Math.max(8, Number(state.grid.size || 32));
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    const topLeftWorld = screenToWorld({ x: 0, y: 0 });
    const bottomRightWorld = screenToWorld({ x: dom.canvas.width, y: dom.canvas.height });
    const startX = Math.floor(topLeftWorld.x / spacing) * spacing;
    const endX = Math.ceil(bottomRightWorld.x / spacing) * spacing;
    const startY = Math.floor(topLeftWorld.y / spacing) * spacing;
    const endY = Math.ceil(bottomRightWorld.y / spacing) * spacing;
    for (let x = startX; x <= endX; x += spacing) {
      const p0 = worldToScreen({ x, y: startY });
      const p1 = worldToScreen({ x, y: endY });
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += spacing) {
      const p0 = worldToScreen({ x: startX, y });
      const p1 = worldToScreen({ x: endX, y });
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  }

  function drawPlayAreaOverlay() {
    if (!state.layerVisibility.playArea) return;
    const maskCells = Array.isArray(state.map.playAreaMask) ? state.map.playAreaMask : [];
    if (!maskCells.length) return;

    const topLeft = worldToScreen({ x: 0, y: 0 });
    const bottomRight = worldToScreen({ x: state.map.width, y: state.map.height });
    const mapWidth = bottomRight.x - topLeft.x;
    const mapHeight = bottomRight.y - topLeft.y;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
    ctx.fillRect(topLeft.x, topLeft.y, mapWidth, mapHeight);
    ctx.globalCompositeOperation = "destination-out";
    const cellSize = getGridSize() * state.camera.zoom;
    maskCells.forEach((cell) => {
      const screen = worldToScreen(gridToWorld(cell.gx, cell.gy));
      ctx.fillRect(screen.x - cellSize * 0.5, screen.y - cellSize * 0.5, cellSize, cellSize);
    });
    ctx.restore();

    const lookup = Object.create(null);
    maskCells.forEach((cell) => { lookup[playAreaKey(cell.gx, cell.gy)] = true; });
    ctx.strokeStyle = "rgba(132, 208, 255, 0.72)";
    ctx.lineWidth = Math.max(1, state.camera.zoom * 1.1);

    maskCells.forEach((cell) => {
      const center = worldToScreen(gridToWorld(cell.gx, cell.gy));
      const half = (getGridSize() * state.camera.zoom) * 0.5;
      const neighbors = [{ gx: cell.gx + 1, gy: cell.gy, side: "right" }, { gx: cell.gx - 1, gy: cell.gy, side: "left" }, { gx: cell.gx, gy: cell.gy + 1, side: "bottom" }, { gx: cell.gx, gy: cell.gy - 1, side: "top" }];
      neighbors.forEach((neighbor) => {
        if (lookup[playAreaKey(neighbor.gx, neighbor.gy)]) return;
        ctx.beginPath();
        if (neighbor.side === "right") { ctx.moveTo(center.x + half, center.y - half); ctx.lineTo(center.x + half, center.y + half); }
        else if (neighbor.side === "left") { ctx.moveTo(center.x - half, center.y - half); ctx.lineTo(center.x - half, center.y + half); }
        else if (neighbor.side === "bottom") { ctx.moveTo(center.x - half, center.y + half); ctx.lineTo(center.x + half, center.y + half); }
        else { ctx.moveTo(center.x - half, center.y - half); ctx.lineTo(center.x + half, center.y - half); }
        ctx.stroke();
      });
    });
  }

  function drawRiverPreview() {
    if (!state.stroke || state.stroke.tool !== "river" || !Array.isArray(state.stroke.points) || state.stroke.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = "rgba(126, 204, 255, 0.78)";
    ctx.lineWidth = Math.max(2, getBrushRadiusWorld() * state.camera.zoom * 0.24);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    state.stroke.points.forEach((point, index) => {
      const screen = worldToScreen(point);
      if (index === 0) ctx.moveTo(screen.x, screen.y);
      else ctx.lineTo(screen.x, screen.y);
    });
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayAreaRectPreview() {
    if (!state.stroke || state.stroke.tool !== "play_area_rect") return;
    const startPoint = Array.isArray(state.stroke.points) && state.stroke.points.length ? state.stroke.points[0] : null;
    if (!startPoint) return;
    const endPoint = state.stroke.lastPoint || startPoint;
    const rect = getGridRectFromWorldPoints(startPoint, endPoint);
    const topLeftWorld = gridToWorld(rect.minGx, rect.minGy);
    const bottomRightWorld = gridToWorld(rect.maxGx, rect.maxGy);
    const cellSize = getGridSize();
    const minScreen = worldToScreen({ x: topLeftWorld.x - cellSize * 0.5, y: topLeftWorld.y - cellSize * 0.5 });
    const maxScreen = worldToScreen({ x: bottomRightWorld.x + cellSize * 0.5, y: bottomRightWorld.y + cellSize * 0.5 });
    const width = maxScreen.x - minScreen.x;
    const height = maxScreen.y - minScreen.y;
    const mode = String(state.stroke.mode || "play_rect_set");

    ctx.save();
    ctx.fillStyle = mode === "play_rect_remove" ? "rgba(255, 126, 126, 0.18)" : "rgba(126, 204, 255, 0.18)";
    ctx.strokeStyle = mode === "play_rect_remove" ? "rgba(255, 140, 140, 0.95)" : "rgba(132, 208, 255, 0.95)";
    ctx.lineWidth = Math.max(1.5, state.camera.zoom * 1.4);
    ctx.setLineDash([8, 5]);
    ctx.fillRect(minScreen.x, minScreen.y, width, height);
    ctx.strokeRect(minScreen.x, minScreen.y, width, height);
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawPlayerStartPing() {
    const playerStart = state.map && state.map.playerStart;
    if (!playerStart || !Number.isFinite(Number(playerStart.x)) || !Number.isFinite(Number(playerStart.y))) return;
    if (!pointInsideMap(playerStart)) return;

    const center = worldToScreen(playerStart);
    const base = Math.max(8, getGridSize() * state.camera.zoom * 0.34);
    const ring = base * 1.5;
    const stemTop = center.y - base * 0.08;
    const stemBottom = center.y + base * 1.05;
    const tipY = center.y + base * 1.55;

    ctx.save();
    ctx.lineWidth = Math.max(1, state.camera.zoom * 1.5);
    ctx.strokeStyle = "rgba(255, 117, 117, 0.95)";
    ctx.fillStyle = "rgba(255, 117, 117, 0.16)";
    ctx.beginPath();
    ctx.arc(center.x, center.y, ring, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(center.x - base * 0.36, stemBottom);
    ctx.lineTo(center.x + base * 0.36, stemBottom);
    ctx.lineTo(center.x, tipY);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 117, 117, 0.88)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center.x, center.y, base * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 117, 117, 0.95)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(center.x, center.y, base * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 240, 228, 0.95)";
    ctx.fill();

    ctx.font = `${Math.max(10, Math.round(state.camera.zoom * 11))}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(255, 214, 214, 0.95)";
    ctx.fillText("START", center.x, stemTop - base * 0.35);
    ctx.restore();
  }

  function drawBrushCursor() {
    if (!["paint", "eraser", "play_area", "play_area_rect", "river", "player_start"].includes(state.tool)) return;
    if (!pointInsideMap(state.hoverWorld)) return;
    const screen = worldToScreen(state.hoverWorld);
    const radius = getBrushRadiusWorld() * state.camera.zoom;
    ctx.save();
    const isEraser = state.tool === "eraser";
    const isStartTool = state.tool === "player_start";
    ctx.strokeStyle = isEraser
      ? "rgba(255, 118, 118, 0.9)"
      : isStartTool
        ? "rgba(255, 164, 164, 0.92)"
        : "rgba(156, 218, 255, 0.9)";
    ctx.fillStyle = isEraser
      ? "rgba(255, 120, 120, 0.12)"
      : isStartTool
        ? "rgba(255, 117, 117, 0.14)"
        : "rgba(126, 204, 255, 0.1)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, Math.max(4, isStartTool ? getGridSize() * state.camera.zoom * 0.5 : radius), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    if (!state.needsRender) return;
    state.needsRender = false;
    resizeCanvas();
    const theme = getTheme(state.themePreviewId);
    ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
    ctx.fillStyle = "#0c121a";
    ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);
    drawMapBounds(theme);
    drawBackgroundLayer();
    drawTerrain(theme);
    drawPlayAreaOverlay();
    drawPlayerStartPing();
    drawGrid(theme);
    drawRiverPreview();
    drawPlayAreaRectPreview();
    drawBrushCursor();
    dom.modeLabel.textContent = `Tool: ${TOOL_LABELS[state.tool] || state.tool}`;
    dom.coordsLabel.textContent = `World: ${Math.round(state.hoverWorld.x)}, ${Math.round(state.hoverWorld.y)}`;
    dom.zoomLabel.textContent = `Zoom: ${(state.camera.zoom * 100).toFixed(0)}%`;
  }

  function renderLoop() { render(); requestAnimationFrame(renderLoop); }

  function syncMapInputs() {
    dom.mapIdInput.value = state.map.id;
    dom.mapNameInput.value = state.map.name;
    dom.mapWidthInput.value = String(Math.round(state.map.width));
    dom.mapHeightInput.value = String(Math.round(state.map.height));
    dom.defaultThemeInput.value = state.map.theme;
    dom.themePreviewSelect.value = state.themePreviewId;
    dom.levelEditSelect.value = state.activeLevelId;
  }

  function syncBrushLabels() {
    dom.brushSizeLabel.textContent = String(Number(state.brush.size || 3).toFixed(0));
    dom.brushDensityLabel.textContent = Number(state.brush.density || 0).toFixed(2);
    dom.brushRandomnessLabel.textContent = Number(state.brush.randomness || 0).toFixed(2);
    dom.brushSoftnessLabel.textContent = Number(state.brush.softness || 0).toFixed(2);
  }

  function syncBackgroundControls() {
    const bg = state.map.backgroundImage || createDefaultBackgroundImage();
    dom.backgroundOpacityInput.value = String(clamp(Number(bg.opacity || 0.5), 0, 1));
    dom.backgroundScaleInput.value = String(clamp(Number(bg.scale || 1), 0.2, 3));
    dom.backgroundOffsetXInput.value = String(Math.round(Number(bg.offsetX || 0)));
    dom.backgroundOffsetYInput.value = String(Math.round(Number(bg.offsetY || 0)));
    dom.backgroundOpacityLabel.textContent = Number(dom.backgroundOpacityInput.value).toFixed(2);
    dom.backgroundScaleLabel.textContent = `${Number(dom.backgroundScaleInput.value).toFixed(2)}x`;
  }

  function updatePlayAreaSummary() {
    const count = Array.isArray(state.map.playAreaMask) ? state.map.playAreaMask.length : 0;
    dom.playAreaSummary.textContent = count ? `Custom play area cells: ${count}` : "No custom play area mask yet (full map fallback).";
  }

  function updatePlayerStartSummary() {
    const start = state.map && state.map.playerStart;
    if (!start || !Number.isFinite(Number(start.x)) || !Number.isFinite(Number(start.y))) {
      dom.playerStartSummary.textContent = "No player start set. Using map center fallback.";
      return;
    }
    dom.playerStartSummary.textContent = `Player starts at x=${Math.round(start.x)}, y=${Math.round(start.y)}.`;
  }

  function setPlayerStart(worldPoint) {
    const point = clampPointToMap(worldPoint);
    state.map.playerStart = { x: point.x, y: point.y };
    updatePlayerStartSummary();
    requestRender();
  }

  function setTool(tool) {
    state.tool = tool;
    state.drag = null;
    state.stroke = null;
    Array.from(dom.toolButtons.querySelectorAll("[data-tool]")).forEach((button) => button.classList.toggle("active", button.dataset.tool === tool));
    setStatus(`Tool changed to ${TOOL_LABELS[tool] || tool}.`);
    requestRender();
  }

  function loadIntoState(mapData, options) {
    const safe = options || {};
    if (safe.activeLevelId && LEVEL_OPTIONS.some((level) => level.id === safe.activeLevelId)) state.activeLevelId = safe.activeLevelId;
    state.map = normalizeMapData(mapData);
    if (state.map.levelId && LEVEL_OPTIONS.some((level) => level.id === state.map.levelId)) state.activeLevelId = state.map.levelId;
    else state.map.levelId = state.activeLevelId;
    state.themePreviewId = state.map.theme;
    state.camera.x = state.map.width * 0.5;
    state.camera.y = state.map.height * 0.5;
    state.selectedTerrainId = null;
    state.stroke = null;
    state.drag = null;
    syncMapInputs();
    syncBrushLabels();
    syncBackgroundControls();
    updatePlayAreaSummary();
    updatePlayerStartSummary();
    renderSelectionProperties();
    setValidationSummary([], []);
    setStatus(`Loaded map "${state.map.name}".`, "success");
    requestRender();
  }

  function saveAsFile() {
    const validation = validateMapData(toJsonMap());
    setValidationSummary(validation.errors, validation.warnings);
    if (validation.errors.length) {
      setStatus("Fix validation errors before exporting file.", "error");
      return;
    }
    const payload = JSON.stringify(toJsonMap(), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.map.id || "map"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus("Map exported to JSON file.", "success");
  }

  async function copyJsonToClipboard() {
    const validation = validateMapData(toJsonMap());
    setValidationSummary(validation.errors, validation.warnings);
    if (validation.errors.length) {
      setStatus("Fix validation errors before copying JSON.", "error");
      return;
    }
    const payload = JSON.stringify(toJsonMap(), null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(payload);
      setStatus("Map JSON copied to clipboard.", "success");
    } else {
      setStatus("Clipboard API unavailable in this browser context.", "error");
    }
  }

  function readLocalMaps() {
    try {
      const text = localStorage.getItem(LOCAL_MAPS_KEY);
      if (!text) return {};
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return parsed;
    } catch (error) {
      return {};
    }
  }

  function writeLocalMaps(mapStore) { localStorage.setItem(LOCAL_MAPS_KEY, JSON.stringify(mapStore)); }

  function readLevelSlots() {
    try {
      const text = localStorage.getItem(LOCAL_LEVEL_SLOTS_KEY);
      if (!text) return {};
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return parsed;
    } catch (error) {
      return {};
    }
  }

  function writeLevelSlots(levelSlots) { localStorage.setItem(LOCAL_LEVEL_SLOTS_KEY, JSON.stringify(levelSlots)); }

  function refreshLocalMapSelect() {
    const maps = readLocalMaps();
    const ids = Object.keys(maps).sort();
    dom.localMapSelect.innerHTML = "";
    if (!ids.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No local maps";
      dom.localMapSelect.appendChild(option);
      return;
    }
    ids.forEach((id) => {
      const option = document.createElement("option");
      option.value = id;
      const name = maps[id] && maps[id].name ? maps[id].name : id;
      option.textContent = `${name} (${id})`;
      dom.localMapSelect.appendChild(option);
    });
  }

  function saveCurrentMapToActiveLevelSlot() {
    const slots = readLevelSlots();
    const payload = toJsonMap();
    payload.levelId = state.activeLevelId;
    slots[state.activeLevelId] = payload;
    writeLevelSlots(slots);
  }

  function saveLocalMap() {
    const validation = validateMapData(toJsonMap());
    setValidationSummary(validation.errors, validation.warnings);
    if (validation.errors.length) {
      setStatus("Fix validation errors before saving local map.", "error");
      return;
    }
    const mapStore = readLocalMaps();
    const payload = toJsonMap();
    payload.levelId = state.activeLevelId;
    mapStore[state.map.id] = payload;
    writeLocalMaps(mapStore);
    saveCurrentMapToActiveLevelSlot();
    refreshLocalMapSelect();
    dom.localMapSelect.value = state.map.id;
    setStatus(`Saved "${state.map.name}" for ${getLevelOption(state.activeLevelId).label}.`, "success");
  }

  function loadSelectedLocalMap() {
    const id = dom.localMapSelect.value;
    const maps = readLocalMaps();
    if (!id || !maps[id]) {
      setStatus("No local map selected.", "error");
      return;
    }
    loadIntoState(maps[id]);
  }

  async function loadBundledLevelTemplate(levelId) {
    const templatePath = BUNDLED_LEVEL_TEMPLATE_PATHS[levelId];
    if (!templatePath) return null;
    try {
      const response = await fetch(templatePath, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`Failed to load bundled template for ${levelId} from ${templatePath}.`, error);
      return null;
    }
  }

  async function loadLevelSlot(levelId) {
    const level = getLevelOption(levelId);
    const slots = readLevelSlots();
    const slottedMap = slots[level.id];
    if (slottedMap) {
      loadIntoState(slottedMap, { activeLevelId: level.id });
      setStatus(`Loaded saved editor map for ${level.label}.`, "success");
      return;
    }
    const bundledTemplate = await loadBundledLevelTemplate(level.id);
    if (bundledTemplate) {
      loadIntoState(bundledTemplate, { activeLevelId: level.id });
      setStatus(`Loaded ${level.label} template from ${BUNDLED_LEVEL_TEMPLATE_PATHS[level.id]}.`, "success");
      return;
    }
    loadIntoState(createDefaultMap(level.id), { activeLevelId: level.id });
    setStatus(`No saved map for ${level.label}. Started a fresh layout.`, "success");
  }

  function validateMapData(mapData) {
    const errors = [];
    const warnings = [];
    if (!mapData.id || !String(mapData.id).trim()) errors.push("Map ID is required.");
    if (!mapData.name || !String(mapData.name).trim()) errors.push("Map name is required.");
    if (Number(mapData.width) < 200 || Number(mapData.height) < 200) errors.push("Map dimensions must be at least 200 x 200.");
    const width = Number(mapData.width || 0);
    const height = Number(mapData.height || 0);
    const terrain = Array.isArray(mapData.terrain) ? mapData.terrain : [];
    terrain.forEach((stamp, index) => {
      if (stamp.x < 0 || stamp.y < 0 || stamp.x > width || stamp.y > height) errors.push(`Terrain stamp #${index + 1} is outside map bounds.`);
      if (!TERRAIN_TYPES.some((entry) => entry.id === stamp.terrainType)) errors.push(`Terrain stamp #${index + 1} has invalid terrain type.`);
    });
    const mask = Array.isArray(mapData.playAreaMask) ? mapData.playAreaMask : [];
    mask.forEach((cell, index) => {
      const world = gridToWorld(Number(cell.gx || 0), Number(cell.gy || 0));
      if (world.x < 0 || world.y < 0 || world.x > width || world.y > height) errors.push(`Play area cell #${index + 1} is outside map bounds.`);
    });
    if (!terrain.length) warnings.push("Map has no painted terrain yet.");
    if (!mask.length) warnings.push("Play area mask is empty (full-map fallback active).");
    const playerStart = mapData.playerStart;
    if (!playerStart || !Number.isFinite(Number(playerStart.x)) || !Number.isFinite(Number(playerStart.y))) {
      warnings.push("Player start is not set. Map center fallback will be used.");
    } else if (
      Number(playerStart.x) < 0 ||
      Number(playerStart.y) < 0 ||
      Number(playerStart.x) > width ||
      Number(playerStart.y) > height
    ) {
      errors.push("Player start is outside map bounds.");
    }
    return { errors, warnings };
  }

  function updateTheme(themeId) {
    const validTheme = THEMES.some((entry) => entry.id === themeId) ? themeId : THEMES[0].id;
    state.map.theme = validTheme;
    state.map.defaultThemeId = validTheme;
    state.themePreviewId = validTheme;
    dom.defaultThemeInput.value = validTheme;
    dom.themePreviewSelect.value = validTheme;
    requestRender();
  }

  function startStroke(tool, worldPoint, button) {
    const clampedPoint = clampPointToMap(worldPoint);
    const mode =
      tool === "paint"
        ? "paint"
        : tool === "eraser"
        ? "erase"
        : tool === "play_area"
        ? (button === 2 ? "play_remove" : "play_add")
        : tool === "play_area_rect"
        ? (button === 2 ? "play_rect_remove" : "play_rect_set")
        : tool === "river"
        ? "river"
        : null;
    if (!mode) return;
    pushHistory(`Stroke (${tool})`);
    state.stroke = { tool, mode, points: [clampedPoint], lastPoint: clampedPoint, startedAt: Date.now() };
    if (mode === "river" || mode === "play_rect_set" || mode === "play_rect_remove") {
      requestRender();
      return;
    }
    applyBrushBetween(clampedPoint, clampedPoint, mode);
    setStatus(`${TOOL_LABELS[tool]} stroke started.`);
  }

  function continueStroke(worldPoint) {
    if (!state.stroke) return;
    const clampedPoint = clampPointToMap(worldPoint);
    if (state.stroke.mode === "river") {
      state.stroke.points.push(clampedPoint);
      state.stroke.lastPoint = clampedPoint;
      requestRender();
      return;
    }
    if (state.stroke.mode === "play_rect_set" || state.stroke.mode === "play_rect_remove") {
      state.stroke.lastPoint = clampedPoint;
      requestRender();
      return;
    }
    applyBrushBetween(state.stroke.lastPoint, clampedPoint, state.stroke.mode);
    state.stroke.lastPoint = clampedPoint;
  }

  function finishStroke() {
    if (!state.stroke) return;
    const finished = state.stroke;
    state.stroke = null;
    if (finished.mode === "river" && finished.points.length >= 2) applyRiverStroke(finished.points);
    if (finished.mode === "play_rect_set" || finished.mode === "play_rect_remove") {
      const startPoint = finished.points && finished.points[0] ? finished.points[0] : finished.lastPoint;
      const endPoint = finished.lastPoint || startPoint;
      const result = applyPlayAreaRectangle(startPoint, endPoint, finished.mode);
      if (result.changedCount > 0) {
        const actionText = finished.mode === "play_rect_remove" ? "removed from" : "set as";
        setStatus(`Play area rectangle ${actionText} field (${result.minGx},${result.minGy}) to (${result.maxGx},${result.maxGy}).`, "success");
      } else {
        setStatus("Play area rectangle made no changes.");
      }
    }
    renderSelectionProperties();
    updatePlayAreaSummary();
    requestRender();
  }

  function deleteAtPoint(worldPoint) {
    const hit = findTerrainHit(worldPoint);
    if (!hit) {
      setStatus("Nothing to delete at this location.");
      return;
    }
    pushHistory("Delete terrain");
    removeTerrainCell(hit.gx, hit.gy);
    setStatus("Terrain deleted.", "success");
    requestRender();
  }

  function wireTopbarActions() {
    dom.levelEditSelect.addEventListener("change", async () => {
      const next = String(dom.levelEditSelect.value || "").trim();
      if (!next || next === state.activeLevelId) return;
      saveCurrentMapToActiveLevelSlot();
      state.activeLevelId = next;
      await loadLevelSlot(next);
    });
    dom.undoBtn.addEventListener("click", undo);
    dom.redoBtn.addEventListener("click", redo);
    dom.newMapBtn.addEventListener("click", () => {
      pushHistory("New map");
      loadIntoState(createDefaultMap(state.activeLevelId), { activeLevelId: state.activeLevelId });
      setTool("select");
    });
    dom.openFileBtn.addEventListener("click", () => dom.openFileInput.click());
    dom.openFileInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          pushHistory("Open map file");
          loadIntoState(JSON.parse(String(reader.result || "{}")));
        } catch (error) {
          setStatus("Failed to parse JSON map file.", "error");
        }
      };
      reader.readAsText(file);
      dom.openFileInput.value = "";
    });
    dom.saveFileBtn.addEventListener("click", saveAsFile);
    dom.copyJsonBtn.addEventListener("click", () => copyJsonToClipboard().catch(() => setStatus("Could not copy JSON to clipboard.", "error")));
    dom.saveLocalBtn.addEventListener("click", saveLocalMap);
    dom.loadLocalBtn.addEventListener("click", loadSelectedLocalMap);
    dom.validateBtn.addEventListener("click", () => {
      const validation = validateMapData(toJsonMap());
      setValidationSummary(validation.errors, validation.warnings);
      if (validation.errors.length) setStatus(validation.errors[0], "error");
      else if (validation.warnings.length) setStatus(validation.warnings[0]);
      else setStatus("Validation complete: no issues found.", "success");
    });
  }

  function wireMetadataInputs() {
    dom.mapIdInput.addEventListener("change", () => {
      const next = String(dom.mapIdInput.value || "").trim();
      if (!next) {
        dom.mapIdInput.value = state.map.id;
        return;
      }
      pushHistory("Edit map ID");
      state.map.id = next;
      requestRender();
    });
    dom.mapNameInput.addEventListener("input", () => { state.map.name = String(dom.mapNameInput.value || "").slice(0, 80); });

    const resizeMap = () => {
      pushHistory("Resize map");
      const width = Math.max(200, Number(dom.mapWidthInput.value || state.map.width));
      const height = Math.max(200, Number(dom.mapHeightInput.value || state.map.height));
      state.map.width = width;
      state.map.height = height;
      state.map.terrain = state.map.terrain.filter((stamp) => {
        stamp.x = clamp(stamp.x, 0, width);
        stamp.y = clamp(stamp.y, 0, height);
        const g = worldToGrid(stamp);
        stamp.gx = g.gx;
        stamp.gy = g.gy;
        stamp.key = terrainKey(stamp.gx, stamp.gy);
        return stamp.x >= 0 && stamp.y >= 0 && stamp.x <= width && stamp.y <= height;
      });
      state.map.playAreaMask = state.map.playAreaMask.filter((cell) => {
        const world = gridToWorld(cell.gx, cell.gy);
        return world.x >= 0 && world.y >= 0 && world.x <= width && world.y <= height;
      });
      if (state.map.playerStart) {
        state.map.playerStart.x = clamp(Number(state.map.playerStart.x || width * 0.5), 0, width);
        state.map.playerStart.y = clamp(Number(state.map.playerStart.y || height * 0.5), 0, height);
      } else {
        state.map.playerStart = createDefaultPlayerStart(width, height);
      }
      updatePlayAreaSummary();
      updatePlayerStartSummary();
      renderSelectionProperties();
      requestRender();
    };

    dom.mapWidthInput.addEventListener("change", resizeMap);
    dom.mapHeightInput.addEventListener("change", resizeMap);
    dom.defaultThemeInput.addEventListener("change", () => {
      pushHistory("Change theme");
      updateTheme(dom.defaultThemeInput.value);
    });
  }

  function wireToolInputs() {
    dom.toolButtons.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tool]");
      if (!button) return;
      setTool(button.dataset.tool);
    });
    dom.terrainTypeSelect.addEventListener("change", () => { state.terrainPlacementType = dom.terrainTypeSelect.value; });
    dom.themePreviewSelect.addEventListener("change", () => updateTheme(dom.themePreviewSelect.value));

    dom.brushSizeInput.addEventListener("input", () => { state.brush.size = clamp(Number(dom.brushSizeInput.value || 3), 1, 10); syncBrushLabels(); requestRender(); });
    dom.brushDensityInput.addEventListener("input", () => { state.brush.density = clamp(Number(dom.brushDensityInput.value || 0.6), 0.1, 1); syncBrushLabels(); requestRender(); });
    dom.brushRandomnessInput.addEventListener("input", () => { state.brush.randomness = clamp(Number(dom.brushRandomnessInput.value || 0.35), 0, 1); syncBrushLabels(); requestRender(); });
    dom.brushSoftnessInput.addEventListener("input", () => { state.brush.softness = clamp(Number(dom.brushSoftnessInput.value || 0.7), 0, 1); syncBrushLabels(); requestRender(); });

    dom.gridVisibleChk.addEventListener("change", () => { state.grid.visible = dom.gridVisibleChk.checked; requestRender(); });
    dom.gridSizeInput.addEventListener("change", () => { state.grid.size = Math.max(8, Number(dom.gridSizeInput.value || 32)); dom.gridSizeInput.value = String(Math.round(state.grid.size)); requestRender(); });

    dom.layerBackgroundChk.addEventListener("change", () => { state.layerVisibility.background = dom.layerBackgroundChk.checked; requestRender(); });
    dom.layerTerrainChk.addEventListener("change", () => { state.layerVisibility.terrain = dom.layerTerrainChk.checked; requestRender(); });
    dom.layerPropsChk.addEventListener("change", () => { state.layerVisibility.props = dom.layerPropsChk.checked; requestRender(); });
    dom.layerPlayAreaChk.addEventListener("change", () => { state.layerVisibility.playArea = dom.layerPlayAreaChk.checked; requestRender(); });
    dom.layerCollisionChk.addEventListener("change", () => { state.layerVisibility.collision = dom.layerCollisionChk.checked; requestRender(); });

    dom.importBackgroundBtn.addEventListener("click", () => dom.importBackgroundInput.click());
    dom.importBackgroundInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      if (!file.type || !file.type.startsWith("image/")) {
        setStatus("Background import only supports PNG/JPG.", "error");
        dom.importBackgroundInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        pushHistory("Import background image");
        state.map.backgroundImage = { src: String(reader.result || ""), opacity: clamp(Number(dom.backgroundOpacityInput.value || 0.5), 0, 1), scale: clamp(Number(dom.backgroundScaleInput.value || 1), 0.2, 3), offsetX: Number(dom.backgroundOffsetXInput.value || 0), offsetY: Number(dom.backgroundOffsetYInput.value || 0) };
        syncBackgroundControls();
        requestRender();
        setStatus("Background image imported.", "success");
      };
      reader.readAsDataURL(file);
      dom.importBackgroundInput.value = "";
    });

    dom.clearBackgroundBtn.addEventListener("click", () => {
      if (!state.map.backgroundImage) return;
      pushHistory("Clear background image");
      state.map.backgroundImage = null;
      syncBackgroundControls();
      requestRender();
      setStatus("Background image removed.", "success");
    });

    const updateBackground = () => {
      if (!state.map.backgroundImage) state.map.backgroundImage = createDefaultBackgroundImage();
      state.map.backgroundImage.opacity = clamp(Number(dom.backgroundOpacityInput.value || 0.5), 0, 1);
      state.map.backgroundImage.scale = clamp(Number(dom.backgroundScaleInput.value || 1), 0.2, 3);
      state.map.backgroundImage.offsetX = Number(dom.backgroundOffsetXInput.value || 0);
      state.map.backgroundImage.offsetY = Number(dom.backgroundOffsetYInput.value || 0);
      syncBackgroundControls();
      requestRender();
    };

    dom.backgroundOpacityInput.addEventListener("input", updateBackground);
    dom.backgroundScaleInput.addEventListener("input", updateBackground);
    dom.backgroundOffsetXInput.addEventListener("change", updateBackground);
    dom.backgroundOffsetYInput.addEventListener("change", updateBackground);

    dom.clearPlayAreaBtn.addEventListener("click", () => {
      if (!state.map.playAreaMask.length) return;
      pushHistory("Clear play area mask");
      state.map.playAreaMask = [];
      updatePlayAreaSummary();
      requestRender();
      setStatus("Play area mask cleared.", "success");
    });

    dom.resetPlayerStartBtn.addEventListener("click", () => {
      pushHistory("Reset player start");
      state.map.playerStart = createDefaultPlayerStart(state.map.width, state.map.height);
      updatePlayerStartSummary();
      requestRender();
      setStatus("Player start reset to map center.", "success");
    });
  }

  function wireKeyboard() {
    window.addEventListener("keydown", (event) => {
      if (event.code === "Space") state.keyboard.space = true;
      if (event.code === "Delete") deleteSelection();
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyD") {
        event.preventDefault();
        duplicateSelection();
      }
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.code === "KeyZ") {
        event.preventDefault();
        undo();
      }
      if (((event.ctrlKey || event.metaKey) && event.code === "KeyY") || ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === "KeyZ")) {
        event.preventDefault();
        redo();
      }
      if (event.code === "Digit1") setTool("select");
      if (event.code === "Digit2") setTool("paint");
      if (event.code === "Digit3") setTool("river");
      if (event.code === "Digit4") setTool("play_area");
      if (event.code === "Digit5") setTool("player_start");
      if (event.code === "Digit6") setTool("eraser");
      if (event.code === "Digit7") setTool("play_area_rect");
      if (event.code === "Escape") {
        state.stroke = null;
        requestRender();
      }
    });
    window.addEventListener("keyup", (event) => {
      if (event.code === "Space") state.keyboard.space = false;
    });
  }

  function wireCanvas() {
    dom.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    dom.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const point = getCanvasPointFromEvent(event);
      const before = screenToWorld(point);
      const zoomFactor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
      state.camera.zoom = clamp(state.camera.zoom * zoomFactor, 0.2, 3.5);
      const after = screenToWorld(point);
      state.camera.x += before.x - after.x;
      state.camera.y += before.y - after.y;
      requestRender();
    });

    dom.canvas.addEventListener("mousedown", (event) => {
      const canvasPoint = getCanvasPointFromEvent(event);
      const worldPoint = screenToWorld(canvasPoint);
      state.hoverWorld = worldPoint;

      const shouldPan = event.button === 1 || (event.button === 0 && state.keyboard.space);
      if (shouldPan) {
        state.drag = { mode: "pan", startScreen: canvasPoint, cameraStart: { x: state.camera.x, y: state.camera.y } };
        return;
      }

      if (event.button === 0 || event.button === 2) {
        if (state.tool === "paint" || state.tool === "eraser" || state.tool === "play_area" || state.tool === "play_area_rect" || state.tool === "river") {
          startStroke(state.tool, worldPoint, event.button);
          return;
        }
        if (state.tool === "player_start" && event.button === 0) {
          pushHistory("Set player start");
          setPlayerStart(worldPoint);
          setStatus("Player start point set.", "success");
          return;
        }
      }

      if (event.button !== 0) return;

      if (state.tool === "select") {
        const hit = findTerrainHit(worldPoint);
        if (!hit) {
          clearSelection();
          requestRender();
          return;
        }
        setSelection(hit);
        state.drag = { mode: "moveStamp", stampId: hit.id, startWorld: worldPoint, startPos: { x: hit.x, y: hit.y } };
        requestRender();
        return;
      }

      if (state.tool === "eraser") deleteAtPoint(worldPoint);
    });

    dom.canvas.addEventListener("mousemove", (event) => {
      const canvasPoint = getCanvasPointFromEvent(event);
      const worldPoint = screenToWorld(canvasPoint);
      state.hoverWorld = worldPoint;

      if (state.drag && state.drag.mode === "pan") {
        const dx = canvasPoint.x - state.drag.startScreen.x;
        const dy = canvasPoint.y - state.drag.startScreen.y;
        state.camera.x = state.drag.cameraStart.x - dx / state.camera.zoom;
        state.camera.y = state.drag.cameraStart.y - dy / state.camera.zoom;
        requestRender();
        return;
      }

      if (state.drag && state.drag.mode === "moveStamp") {
        const stamp = findTerrainStampById(state.drag.stampId);
        if (!stamp) return;
        const dx = worldPoint.x - state.drag.startWorld.x;
        const dy = worldPoint.y - state.drag.startWorld.y;
        const next = clampPointToMap({ x: state.drag.startPos.x + dx, y: state.drag.startPos.y + dy });
        stamp.x = next.x;
        stamp.y = next.y;
        const g = worldToGrid(next);
        stamp.gx = g.gx;
        stamp.gy = g.gy;
        stamp.key = terrainKey(stamp.gx, stamp.gy);
        renderSelectionProperties();
        requestRender();
        return;
      }

      if (state.stroke) {
        continueStroke(worldPoint);
        return;
      }

      requestRender();
    });

    window.addEventListener("mouseup", () => {
      if (state.drag && state.drag.mode !== "pan") setStatus("Selection updated.", "success");
      state.drag = null;
      finishStroke();
    });
  }

  function bootstrapSelects() {
    LEVEL_OPTIONS.forEach((level) => {
      const option = document.createElement("option");
      option.value = level.id;
      option.textContent = level.label;
      dom.levelEditSelect.appendChild(option);
    });
    dom.levelEditSelect.value = state.activeLevelId;

    TERRAIN_TYPES.forEach((terrainType) => {
      const option = document.createElement("option");
      option.value = terrainType.id;
      option.textContent = terrainType.label;
      dom.terrainTypeSelect.appendChild(option);
    });
    dom.terrainTypeSelect.value = state.terrainPlacementType;

    THEMES.forEach((theme) => {
      const previewOption = document.createElement("option");
      previewOption.value = theme.id;
      previewOption.textContent = theme.label;
      dom.themePreviewSelect.appendChild(previewOption);
      const defaultOption = document.createElement("option");
      defaultOption.value = theme.id;
      defaultOption.textContent = theme.label;
      dom.defaultThemeInput.appendChild(defaultOption);
    });

    dom.themePreviewSelect.value = state.themePreviewId;
    dom.defaultThemeInput.value = state.themePreviewId;
    dom.gridVisibleChk.checked = true;
    dom.layerBackgroundChk.checked = true;
    dom.layerTerrainChk.checked = true;
    dom.layerPropsChk.checked = true;
    dom.layerPlayAreaChk.checked = true;
    dom.layerCollisionChk.checked = true;
    syncBrushLabels();
  }

  async function init() {
    bootstrapSelects();
    wireTopbarActions();
    wireMetadataInputs();
    wireToolInputs();
    wireKeyboard();
    wireCanvas();
    state.map = createDefaultMap(state.activeLevelId);
    await loadLevelSlot(state.activeLevelId);
    refreshLocalMapSelect();
    dom.undoBtn.disabled = true;
    dom.redoBtn.disabled = true;
    requestRender();
    renderLoop();
    window.addEventListener("resize", () => requestRender());
    setStatus("Map editor ready. Paint terrain, mask play area, and trace from an imported background.", "success");
  }

  init();
})();
