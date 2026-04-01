(function () {
  const LOCAL_MAPS_KEY = "rl_map_editor_maps_v1";
  const LOCAL_LEVEL_SLOTS_KEY = "rl_map_editor_level_slots_v1";
  const DEFAULT_MAP_SIZE = { width: 2200, height: 1500 };
  const LEVEL_OPTIONS = Array.from({ length: 10 }, (_, index) => {
    const levelIndex = index + 1;
    return {
      id: `level_${levelIndex}`,
      index: levelIndex,
      label: `Level ${levelIndex}`
    };
  });

  const TERRAIN_TYPES = [
    { id: "rock", label: "Rock", baseRadius: 24 },
    { id: "tree", label: "Tree", baseRadius: 22 },
    { id: "debris", label: "Debris", baseRadius: 20 },
    { id: "pillar", label: "Pillar", baseRadius: 18 },
    { id: "stump", label: "Stump", baseRadius: 17 },
    { id: "crate", label: "Crate", baseRadius: 18 }
  ];

  const THEMES = [
    {
      id: "forest",
      label: "Forest",
      mapFill: "#1c2a23",
      mapBorder: "#506b59",
      grid: "rgba(86, 120, 99, 0.24)",
      terrain: {
        rock: "#73817f",
        tree: "#3f8158",
        debris: "#6e5a47",
        pillar: "#77828f",
        stump: "#6d5844",
        crate: "#8b6b49",
        default: "#6f7f77"
      },
      boundaryFill: "rgba(74, 123, 184, 0.26)",
      boundaryStroke: "#87b5f0",
      crossingFill: "#a67b4d",
      crossingStroke: "#ddc39f"
    },
    {
      id: "desert",
      label: "Desert",
      mapFill: "#2f2415",
      mapBorder: "#8d6d38",
      grid: "rgba(150, 118, 62, 0.24)",
      terrain: {
        rock: "#998666",
        tree: "#7b6949",
        debris: "#8a6d3e",
        pillar: "#b29162",
        stump: "#7a5c34",
        crate: "#93693d",
        default: "#9c835c"
      },
      boundaryFill: "rgba(152, 90, 41, 0.26)",
      boundaryStroke: "#e0a366",
      crossingFill: "#b9935f",
      crossingStroke: "#edc58f"
    },
    {
      id: "bone",
      label: "Bone/Necrotic",
      mapFill: "#231926",
      mapBorder: "#725b7b",
      grid: "rgba(120, 94, 133, 0.24)",
      terrain: {
        rock: "#9f89aa",
        tree: "#7b667f",
        debris: "#8a728f",
        pillar: "#beaac9",
        stump: "#8f7693",
        crate: "#9d81a0",
        default: "#9d84a6"
      },
      boundaryFill: "rgba(170, 56, 79, 0.24)",
      boundaryStroke: "#de6f87",
      crossingFill: "#c8b7d4",
      crossingStroke: "#efe4f5"
    },
    {
      id: "industrial",
      label: "Metal/Industrial",
      mapFill: "#1b242d",
      mapBorder: "#617b92",
      grid: "rgba(95, 126, 150, 0.25)",
      terrain: {
        rock: "#76889a",
        tree: "#5e7f93",
        debris: "#5e6772",
        pillar: "#8ba2b5",
        stump: "#677f8f",
        crate: "#6b7b86",
        default: "#708799"
      },
      boundaryFill: "rgba(44, 124, 156, 0.28)",
      boundaryStroke: "#75c5e8",
      crossingFill: "#8ea8be",
      crossingStroke: "#d8e8f2"
    }
  ];

  const CROSSING_TYPES = [{ id: "bridge", label: "Bridge" }];

  const dom = {
    canvas: document.getElementById("mapCanvas"),
    toolButtons: document.getElementById("toolButtons"),
    terrainTypeSelect: document.getElementById("terrainTypeSelect"),
    themePreviewSelect: document.getElementById("themePreviewSelect"),
    gridVisibleChk: document.getElementById("gridVisibleChk"),
    snapEnabledChk: document.getElementById("snapEnabledChk"),
    gridSizeInput: document.getElementById("gridSizeInput"),
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
    map: createDefaultMap(LEVEL_OPTIONS[0].id),
    tool: "select",
    selected: null,
    boundaryDraft: [],
    camera: { x: DEFAULT_MAP_SIZE.width * 0.5, y: DEFAULT_MAP_SIZE.height * 0.5, zoom: 0.45 },
    grid: { visible: true, snap: false, size: 32 },
    drag: null,
    keyboard: { space: false, ctrl: false },
    hoverWorld: { x: 0, y: 0 },
    terrainPlacementType: TERRAIN_TYPES[0].id,
    crossingPlacementType: CROSSING_TYPES[0].id,
    themePreviewId: THEMES[0].id,
    needsRender: true
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function nextId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function getLevelOption(levelId) {
    return LEVEL_OPTIONS.find((level) => level.id === levelId) || LEVEL_OPTIONS[0];
  }

  function createDefaultMap(levelId) {
    const level = getLevelOption(levelId);
    return {
      id: `${level.id}_layout`,
      levelId: level.id,
      name: `${level.label} Layout`,
      width: DEFAULT_MAP_SIZE.width,
      height: DEFAULT_MAP_SIZE.height,
      defaultThemeId: THEMES[0].id,
      terrainObjects: [],
      boundaries: [],
      crossings: []
    };
  }

  function getTheme(themeId) {
    return THEMES.find((theme) => theme.id === themeId) || THEMES[0];
  }

  function getTerrainType(typeId) {
    return TERRAIN_TYPES.find((item) => item.id === typeId) || TERRAIN_TYPES[0];
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function setStatus(message, severity) {
    dom.statusText.textContent = message;
    dom.statusText.style.color =
      severity === "error" ? "#ffd0d7" : severity === "success" ? "#c9f5d7" : "#d7e3fb";
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

  function snapValue(value) {
    if (!state.grid.snap) return value;
    const grid = Math.max(8, Number(state.grid.size || 32));
    return Math.round(value / grid) * grid;
  }

  function worldToScreen(point) {
    const canvasWidth = dom.canvas.width;
    const canvasHeight = dom.canvas.height;
    return {
      x: (point.x - state.camera.x) * state.camera.zoom + canvasWidth * 0.5,
      y: (point.y - state.camera.y) * state.camera.zoom + canvasHeight * 0.5
    };
  }

  function screenToWorld(point) {
    const canvasWidth = dom.canvas.width;
    const canvasHeight = dom.canvas.height;
    return {
      x: (point.x - canvasWidth * 0.5) / state.camera.zoom + state.camera.x,
      y: (point.y - canvasHeight * 0.5) / state.camera.zoom + state.camera.y
    };
  }

  function getCanvasPointFromEvent(event) {
    const rect = dom.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function pointInsideMap(point) {
    return point.x >= 0 && point.y >= 0 && point.x <= state.map.width && point.y <= state.map.height;
  }

  function clampPointToMap(point) {
    return {
      x: clamp(point.x, 0, state.map.width),
      y: clamp(point.y, 0, state.map.height)
    };
  }

  function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersects =
        yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 0.000001) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function distancePointToSegment(point, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq <= 0.0001) {
      return Math.hypot(point.x - a.x, point.y - a.y);
    }
    const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1);
    const projX = a.x + dx * t;
    const projY = a.y + dy * t;
    return Math.hypot(point.x - projX, point.y - projY);
  }

  function getCrossingBoundaryDistance(crossing) {
    let nearest = Number.POSITIVE_INFINITY;
    state.map.boundaries.forEach((boundary) => {
      const points = boundary.polygonPoints || [];
      for (let i = 0; i < points.length; i += 1) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        nearest = Math.min(nearest, distancePointToSegment(crossing, a, b));
      }
    });
    return nearest;
  }

  function isCrossingPlacementValid(crossing) {
    if (!state.map.boundaries.length) return false;
    const nearest = getCrossingBoundaryDistance(crossing);
    return nearest <= Math.max(22, Number(crossing.width || 70) * 0.75);
  }

  function toJsonMap() {
    return deepClone({
      id: state.map.id,
      levelId: state.activeLevelId,
      name: state.map.name,
      width: state.map.width,
      height: state.map.height,
      defaultThemeId: state.map.defaultThemeId,
      terrainObjects: state.map.terrainObjects,
      boundaries: state.map.boundaries,
      crossings: state.map.crossings
    });
  }

  function normalizePoint(rawPoint) {
    const x = Number(rawPoint && rawPoint.x);
    const y = Number(rawPoint && rawPoint.y);
    return {
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0
    };
  }

  function normalizeMapData(rawMap) {
    const source = rawMap && typeof rawMap === "object" ? rawMap : {};
    const parsedLevelId = LEVEL_OPTIONS.some((level) => level.id === source.levelId)
      ? String(source.levelId)
      : state.activeLevelId;
    const width = Math.max(200, Number(source.width || DEFAULT_MAP_SIZE.width));
    const height = Math.max(200, Number(source.height || DEFAULT_MAP_SIZE.height));
    const normalized = {
      id: String(source.id || nextId("map")).trim() || nextId("map"),
      levelId: parsedLevelId,
      name: String(source.name || "Imported Map").trim() || "Imported Map",
      width,
      height,
      defaultThemeId: THEMES.some((theme) => theme.id === source.defaultThemeId) ? source.defaultThemeId : THEMES[0].id,
      terrainObjects: [],
      boundaries: [],
      crossings: []
    };

    const terrainObjects = Array.isArray(source.terrainObjects) ? source.terrainObjects : [];
    terrainObjects.forEach((terrain, index) => {
      const parsed = {
        id: String((terrain && terrain.id) || nextId("terrain")).trim() || `terrain_${index + 1}`,
        type: TERRAIN_TYPES.some((item) => item.id === terrain.type) ? terrain.type : TERRAIN_TYPES[0].id,
        x: Number(terrain && terrain.x),
        y: Number(terrain && terrain.y),
        rotation: Number(terrain && terrain.rotation) || 0,
        scale: clamp(Number(terrain && terrain.scale) || 1, 0.2, 4)
      };
      parsed.x = clamp(Number.isFinite(parsed.x) ? parsed.x : width * 0.5, 0, width);
      parsed.y = clamp(Number.isFinite(parsed.y) ? parsed.y : height * 0.5, 0, height);
      normalized.terrainObjects.push(parsed);
    });

    const boundaries = Array.isArray(source.boundaries) ? source.boundaries : [];
    boundaries.forEach((boundary, index) => {
      const points = Array.isArray(boundary && boundary.polygonPoints)
        ? boundary.polygonPoints.map(normalizePoint).map((point) => ({
            x: clamp(point.x, 0, width),
            y: clamp(point.y, 0, height)
          }))
        : [];
      if (points.length < 3) return;
      normalized.boundaries.push({
        id: String((boundary && boundary.id) || nextId("boundary")).trim() || `boundary_${index + 1}`,
        polygonPoints: points,
        blocksPlayer: boundary && boundary.blocksPlayer !== false,
        blocksEnemies: boundary && boundary.blocksEnemies !== false
      });
    });

    const crossings = Array.isArray(source.crossings) ? source.crossings : [];
    crossings.forEach((crossing, index) => {
      const parsed = {
        id: String((crossing && crossing.id) || nextId("crossing")).trim() || `crossing_${index + 1}`,
        type: CROSSING_TYPES.some((item) => item.id === crossing.type) ? crossing.type : CROSSING_TYPES[0].id,
        x: Number(crossing && crossing.x),
        y: Number(crossing && crossing.y),
        orientation: Number(crossing && crossing.orientation) || 0,
        width: clamp(Number(crossing && crossing.width) || 78, 24, 420),
        length: clamp(Number(crossing && crossing.length) || 30, 10, 260)
      };
      parsed.x = clamp(Number.isFinite(parsed.x) ? parsed.x : width * 0.5, 0, width);
      parsed.y = clamp(Number.isFinite(parsed.y) ? parsed.y : height * 0.5, 0, height);
      normalized.crossings.push(parsed);
    });

    return normalized;
  }

  function findTerrainHit(worldPoint) {
    for (let i = state.map.terrainObjects.length - 1; i >= 0; i -= 1) {
      const terrain = state.map.terrainObjects[i];
      const baseRadius = getTerrainType(terrain.type).baseRadius;
      const radius = baseRadius * (terrain.scale || 1);
      if (Math.hypot(worldPoint.x - terrain.x, worldPoint.y - terrain.y) <= radius + 4 / state.camera.zoom) {
        return { kind: "terrain", id: terrain.id };
      }
    }
    return null;
  }

  function findCrossingHit(worldPoint) {
    for (let i = state.map.crossings.length - 1; i >= 0; i -= 1) {
      const crossing = state.map.crossings[i];
      const angle = (Number(crossing.orientation || 0) * Math.PI) / 180;
      const dx = worldPoint.x - crossing.x;
      const dy = worldPoint.y - crossing.y;
      const localX = dx * Math.cos(-angle) - dy * Math.sin(-angle);
      const localY = dx * Math.sin(-angle) + dy * Math.cos(-angle);
      const halfW = Number(crossing.width || 70) * 0.5;
      const halfH = Number(crossing.length || 30) * 0.5;
      if (Math.abs(localX) <= halfW && Math.abs(localY) <= halfH) {
        return { kind: "crossing", id: crossing.id };
      }
    }
    return null;
  }

  function findBoundaryVertexHit(worldPoint) {
    const threshold = 11 / state.camera.zoom;
    for (let i = state.map.boundaries.length - 1; i >= 0; i -= 1) {
      const boundary = state.map.boundaries[i];
      const points = boundary.polygonPoints || [];
      for (let j = points.length - 1; j >= 0; j -= 1) {
        const point = points[j];
        if (Math.hypot(worldPoint.x - point.x, worldPoint.y - point.y) <= threshold) {
          return { kind: "boundary", id: boundary.id, vertexIndex: j };
        }
      }
    }
    return null;
  }

  function findBoundaryHit(worldPoint) {
    for (let i = state.map.boundaries.length - 1; i >= 0; i -= 1) {
      const boundary = state.map.boundaries[i];
      const points = boundary.polygonPoints || [];
      if (points.length >= 3 && pointInPolygon(worldPoint, points)) {
        return { kind: "boundary", id: boundary.id };
      }
    }
    return null;
  }

  function getHitTarget(worldPoint) {
    return (
      findBoundaryVertexHit(worldPoint) ||
      findTerrainHit(worldPoint) ||
      findCrossingHit(worldPoint) ||
      findBoundaryHit(worldPoint)
    );
  }

  function clearSelection() {
    state.selected = null;
    renderSelectionProperties();
  }

  function setSelection(selection) {
    state.selected = selection || null;
    renderSelectionProperties();
  }

  function findSelectedObject() {
    if (!state.selected) return null;
    if (state.selected.kind === "terrain") {
      return state.map.terrainObjects.find((terrain) => terrain.id === state.selected.id) || null;
    }
    if (state.selected.kind === "crossing") {
      return state.map.crossings.find((crossing) => crossing.id === state.selected.id) || null;
    }
    if (state.selected.kind === "boundary") {
      return state.map.boundaries.find((boundary) => boundary.id === state.selected.id) || null;
    }
    return null;
  }

  function deleteSelection() {
    if (!state.selected) return;
    if (state.selected.kind === "terrain") {
      state.map.terrainObjects = state.map.terrainObjects.filter((item) => item.id !== state.selected.id);
      setStatus("Terrain deleted.");
    } else if (state.selected.kind === "crossing") {
      state.map.crossings = state.map.crossings.filter((item) => item.id !== state.selected.id);
      setStatus("Crossing deleted.");
    } else if (state.selected.kind === "boundary") {
      state.map.boundaries = state.map.boundaries.filter((item) => item.id !== state.selected.id);
      setStatus("Boundary deleted.");
    }
    clearSelection();
    requestRender();
  }

  function duplicateSelection() {
    const selected = findSelectedObject();
    if (!selected) return;
    if (state.selected.kind === "terrain") {
      const duplicate = deepClone(selected);
      duplicate.id = nextId("terrain");
      duplicate.x = clamp(duplicate.x + 24, 0, state.map.width);
      duplicate.y = clamp(duplicate.y + 24, 0, state.map.height);
      state.map.terrainObjects.push(duplicate);
      setSelection({ kind: "terrain", id: duplicate.id });
      setStatus("Terrain duplicated.", "success");
    } else if (state.selected.kind === "crossing") {
      const duplicate = deepClone(selected);
      duplicate.id = nextId("crossing");
      duplicate.x = clamp(duplicate.x + 24, 0, state.map.width);
      duplicate.y = clamp(duplicate.y + 24, 0, state.map.height);
      state.map.crossings.push(duplicate);
      setSelection({ kind: "crossing", id: duplicate.id });
      setStatus("Crossing duplicated.", "success");
    } else if (state.selected.kind === "boundary") {
      const duplicate = deepClone(selected);
      duplicate.id = nextId("boundary");
      duplicate.polygonPoints = duplicate.polygonPoints.map((point) => ({
        x: clamp(point.x + 24, 0, state.map.width),
        y: clamp(point.y + 24, 0, state.map.height)
      }));
      state.map.boundaries.push(duplicate);
      setSelection({ kind: "boundary", id: duplicate.id });
      setStatus("Boundary duplicated.", "success");
    }
    requestRender();
  }

  function beginBoundaryDraftPoint(worldPoint) {
    const point = clampPointToMap({ x: snapValue(worldPoint.x), y: snapValue(worldPoint.y) });
    if (!pointInsideMap(point)) return;
    if (state.boundaryDraft.length >= 3) {
      const first = state.boundaryDraft[0];
      const closeDistance = Math.hypot(point.x - first.x, point.y - first.y);
      if (closeDistance <= 14 / state.camera.zoom) {
        finalizeBoundaryDraft();
        return;
      }
    }
    state.boundaryDraft.push(point);
    setStatus(`Boundary point ${state.boundaryDraft.length} added.`);
    requestRender();
  }

  function finalizeBoundaryDraft() {
    if (state.boundaryDraft.length < 3) {
      setStatus("Boundary needs at least 3 points.", "error");
      return;
    }
    state.map.boundaries.push({
      id: nextId("boundary"),
      polygonPoints: deepClone(state.boundaryDraft),
      blocksPlayer: true,
      blocksEnemies: true
    });
    state.boundaryDraft = [];
    setStatus("Boundary finalized.", "success");
    requestRender();
  }

  function cancelBoundaryDraft() {
    if (!state.boundaryDraft.length) return;
    state.boundaryDraft = [];
    setStatus("Boundary draft canceled.");
    requestRender();
  }

  function placeTerrain(worldPoint) {
    const point = clampPointToMap({ x: snapValue(worldPoint.x), y: snapValue(worldPoint.y) });
    const terrain = {
      id: nextId("terrain"),
      type: state.terrainPlacementType,
      x: point.x,
      y: point.y,
      rotation: 0,
      scale: 1
    };
    state.map.terrainObjects.push(terrain);
    setSelection({ kind: "terrain", id: terrain.id });
    setStatus("Terrain placed.", "success");
    requestRender();
  }

  function placeCrossing(worldPoint) {
    const point = clampPointToMap({ x: snapValue(worldPoint.x), y: snapValue(worldPoint.y) });
    const crossing = {
      id: nextId("crossing"),
      type: state.crossingPlacementType,
      x: point.x,
      y: point.y,
      orientation: 0,
      width: 80,
      length: 28
    };
    if (!isCrossingPlacementValid(crossing)) {
      setStatus("Crossing must be placed on a boundary edge.", "error");
      return;
    }
    state.map.crossings.push(crossing);
    setSelection({ kind: "crossing", id: crossing.id });
    setStatus("Crossing placed.", "success");
    requestRender();
  }

  function deleteAtPoint(worldPoint) {
    const hit = getHitTarget(worldPoint);
    if (!hit) {
      setStatus("Nothing to delete at this location.");
      return;
    }
    setSelection(hit);
    deleteSelection();
  }

  function requestRender() {
    state.needsRender = true;
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

  function drawBoundaries(theme) {
    state.map.boundaries.forEach((boundary) => {
      const points = boundary.polygonPoints || [];
      if (points.length < 3) return;
      ctx.beginPath();
      points.forEach((point, index) => {
        const screen = worldToScreen(point);
        if (index === 0) {
          ctx.moveTo(screen.x, screen.y);
        } else {
          ctx.lineTo(screen.x, screen.y);
        }
      });
      ctx.closePath();
      ctx.fillStyle = theme.boundaryFill;
      ctx.fill();
      ctx.strokeStyle = theme.boundaryStroke;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (state.selected && state.selected.kind === "boundary" && state.selected.id === boundary.id) {
        points.forEach((point, pointIndex) => {
          const screen = worldToScreen(point);
          const selectedVertex = pointIndex === state.selected.vertexIndex;
          ctx.fillStyle = selectedVertex ? "#fff2a1" : "#d9ebff";
          ctx.strokeStyle = "#1a2d45";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, selectedVertex ? 6 : 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }
    });
  }

  function drawBoundaryDraft() {
    if (!state.boundaryDraft.length) return;
    ctx.strokeStyle = "#ffd585";
    ctx.fillStyle = "rgba(255, 192, 80, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    state.boundaryDraft.forEach((point, index) => {
      const screen = worldToScreen(point);
      if (index === 0) {
        ctx.moveTo(screen.x, screen.y);
      } else {
        ctx.lineTo(screen.x, screen.y);
      }
    });
    ctx.stroke();

    state.boundaryDraft.forEach((point, index) => {
      const screen = worldToScreen(point);
      ctx.fillStyle = index === 0 ? "#ffefaf" : "#ffe0a9";
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawTerrain(theme) {
    state.map.terrainObjects.forEach((terrain) => {
      const type = getTerrainType(terrain.type);
      const baseRadius = type.baseRadius * (terrain.scale || 1);
      const center = worldToScreen({ x: terrain.x, y: terrain.y });
      const radius = baseRadius * state.camera.zoom;
      const fill = (theme.terrain && theme.terrain[terrain.type]) || theme.terrain.default || "#6f7f77";
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(center.x, center.y, Math.max(2, radius), 0, Math.PI * 2);
      ctx.fill();

      if (state.selected && state.selected.kind === "terrain" && state.selected.id === terrain.id) {
        ctx.strokeStyle = "#fff0b2";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(center.x, center.y, Math.max(4, radius + 4), 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  function drawCrossings(theme) {
    state.map.crossings.forEach((crossing) => {
      const center = worldToScreen(crossing);
      const width = Math.max(16, Number(crossing.width || 70)) * state.camera.zoom;
      const height = Math.max(8, Number(crossing.length || 26)) * state.camera.zoom;
      const angle = (Number(crossing.orientation || 0) * Math.PI) / 180;

      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(angle);
      ctx.fillStyle = theme.crossingFill;
      ctx.strokeStyle = theme.crossingStroke;
      ctx.lineWidth = 2;
      ctx.fillRect(-width * 0.5, -height * 0.5, width, height);
      ctx.strokeRect(-width * 0.5, -height * 0.5, width, height);

      if (state.selected && state.selected.kind === "crossing" && state.selected.id === crossing.id) {
        ctx.strokeStyle = "#fff0b2";
        ctx.lineWidth = 2;
        ctx.strokeRect(-width * 0.5 - 4, -height * 0.5 - 4, width + 8, height + 8);
      }
      ctx.restore();
    });
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

  function buildPositionRow(target) {
    const row = document.createElement("div");
    row.className = "selection-row";
    const xInput = numberInput(target.x, 0, state.map.width, 1, (value) => {
      target.x = value;
      requestRender();
    });
    const yInput = numberInput(target.y, 0, state.map.height, 1, (value) => {
      target.y = value;
      requestRender();
    });
    row.appendChild(wrapField("X", xInput));
    row.appendChild(wrapField("Y", yInput));
    return row;
  }

  function renderSelectionProperties() {
    dom.selectionProperties.innerHTML = "";
    const selected = findSelectedObject();
    if (!selected || !state.selected) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Select an object to edit position, type, and dimensions.";
      dom.selectionProperties.appendChild(empty);
      return;
    }

    const card = document.createElement("div");
    card.className = "selection-card";
    const title = document.createElement("h3");
    title.textContent = `${state.selected.kind.charAt(0).toUpperCase()}${state.selected.kind.slice(1)} Selected`;
    card.appendChild(title);

    if (state.selected.kind === "terrain") {
      const row = document.createElement("div");
      row.className = "selection-row";
      const typeField = document.createElement("select");
      typeField.className = "input";
      TERRAIN_TYPES.forEach((type) => {
        const option = document.createElement("option");
        option.value = type.id;
        option.textContent = type.label;
        if (selected.type === type.id) option.selected = true;
        typeField.appendChild(option);
      });
      typeField.addEventListener("change", () => {
        selected.type = typeField.value;
        requestRender();
      });
      row.appendChild(wrapField("Type", typeField));

      const scaleInput = document.createElement("input");
      scaleInput.className = "input";
      scaleInput.type = "number";
      scaleInput.min = "0.2";
      scaleInput.max = "4";
      scaleInput.step = "0.1";
      scaleInput.value = String(Number(selected.scale || 1).toFixed(2));
      scaleInput.addEventListener("change", () => {
        selected.scale = clamp(Number(scaleInput.value) || 1, 0.2, 4);
        scaleInput.value = String(selected.scale.toFixed(2));
        requestRender();
      });
      row.appendChild(wrapField("Scale", scaleInput));
      card.appendChild(row);
      card.appendChild(buildPositionRow(selected));
    } else if (state.selected.kind === "crossing") {
      const row = document.createElement("div");
      row.className = "selection-row";
      const widthInput = numberInput(selected.width, 24, 420, 1, (value) => {
        selected.width = value;
        requestRender();
      });
      const lengthInput = numberInput(selected.length, 10, 260, 1, (value) => {
        selected.length = value;
        requestRender();
      });
      row.appendChild(wrapField("Width", widthInput));
      row.appendChild(wrapField("Length", lengthInput));
      card.appendChild(row);

      const row2 = document.createElement("div");
      row2.className = "selection-row";
      const orientationInput = numberInput(selected.orientation, -180, 180, 1, (value) => {
        selected.orientation = value;
        requestRender();
      });
      const crossingType = document.createElement("select");
      crossingType.className = "input";
      CROSSING_TYPES.forEach((type) => {
        const option = document.createElement("option");
        option.value = type.id;
        option.textContent = type.label;
        if (selected.type === type.id) option.selected = true;
        crossingType.appendChild(option);
      });
      crossingType.addEventListener("change", () => {
        selected.type = crossingType.value;
        requestRender();
      });
      row2.appendChild(wrapField("Orientation", orientationInput));
      row2.appendChild(wrapField("Type", crossingType));
      card.appendChild(row2);
      card.appendChild(buildPositionRow(selected));
    } else if (state.selected.kind === "boundary") {
      const points = selected.polygonPoints || [];
      const info = document.createElement("div");
      info.className = "muted";
      info.textContent = `Vertices: ${points.length}. Drag points on canvas to edit shape.`;
      card.appendChild(info);

      points.forEach((point, index) => {
        const row = document.createElement("div");
        row.className = "selection-row";
        const xInput = numberInput(point.x, 0, state.map.width, 1, (value) => {
          point.x = value;
          requestRender();
        });
        const yInput = numberInput(point.y, 0, state.map.height, 1, (value) => {
          point.y = value;
          requestRender();
        });
        row.appendChild(wrapField(`P${index + 1} X`, xInput));
        row.appendChild(wrapField(`P${index + 1} Y`, yInput));
        card.appendChild(row);
      });
    }

    const actions = document.createElement("div");
    actions.className = "selection-actions";
    const duplicateBtn = document.createElement("button");
    duplicateBtn.className = "btn";
    duplicateBtn.type = "button";
    duplicateBtn.textContent = "Duplicate";
    duplicateBtn.addEventListener("click", () => duplicateSelection());
    actions.appendChild(duplicateBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger";
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteSelection());
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    const validation = validateMapData(toJsonMap());
    if (validation.errors.length) {
      const errors = document.createElement("div");
      errors.className = "validation-errors";
      errors.textContent = validation.errors[0];
      card.appendChild(errors);
    } else if (validation.warnings.length) {
      const warnings = document.createElement("div");
      warnings.className = "validation-warnings";
      warnings.textContent = validation.warnings[0];
      card.appendChild(warnings);
    }

    dom.selectionProperties.appendChild(card);
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
    drawGrid(theme);
    drawBoundaries(theme);
    drawCrossings(theme);
    drawTerrain(theme);
    drawBoundaryDraft();

    dom.modeLabel.textContent = `Tool: ${state.tool.charAt(0).toUpperCase()}${state.tool.slice(1)}`;
    dom.coordsLabel.textContent = `World: ${Math.round(state.hoverWorld.x)}, ${Math.round(state.hoverWorld.y)}`;
    dom.zoomLabel.textContent = `Zoom: ${(state.camera.zoom * 100).toFixed(0)}%`;
  }

  function renderLoop() {
    render();
    requestAnimationFrame(renderLoop);
  }

  function setTool(tool) {
    state.tool = tool;
    state.boundaryDraft = [];
    state.drag = null;
    Array.from(dom.toolButtons.querySelectorAll("[data-tool]")).forEach((button) => {
      button.classList.toggle("active", button.dataset.tool === tool);
    });
    setStatus(`Tool changed to ${tool}.`);
    requestRender();
  }

  function loadIntoState(mapData, options) {
    const safeOptions = options || {};
    if (safeOptions.activeLevelId && LEVEL_OPTIONS.some((level) => level.id === safeOptions.activeLevelId)) {
      state.activeLevelId = safeOptions.activeLevelId;
    }
    state.map = normalizeMapData(mapData);
    if (state.map.levelId && LEVEL_OPTIONS.some((level) => level.id === state.map.levelId)) {
      state.activeLevelId = state.map.levelId;
    } else {
      state.map.levelId = state.activeLevelId;
    }
    state.themePreviewId = state.map.defaultThemeId;
    state.camera.x = state.map.width * 0.5;
    state.camera.y = state.map.height * 0.5;
    state.boundaryDraft = [];
    clearSelection();
    syncMapInputs();
    if (dom.levelEditSelect) {
      dom.levelEditSelect.value = state.activeLevelId;
    }
    setValidationSummary([], []);
    setStatus(`Loaded map "${state.map.name}".`, "success");
    requestRender();
  }

  function syncMapInputs() {
    dom.mapIdInput.value = state.map.id;
    dom.mapNameInput.value = state.map.name;
    dom.mapWidthInput.value = String(Math.round(state.map.width));
    dom.mapHeightInput.value = String(Math.round(state.map.height));
    dom.defaultThemeInput.value = state.map.defaultThemeId;
    dom.themePreviewSelect.value = state.themePreviewId;
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

  function writeLocalMaps(mapStore) {
    localStorage.setItem(LOCAL_MAPS_KEY, JSON.stringify(mapStore));
  }

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

  function writeLevelSlots(levelSlots) {
    localStorage.setItem(LOCAL_LEVEL_SLOTS_KEY, JSON.stringify(levelSlots));
  }

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

  function saveCurrentMapToActiveLevelSlot() {
    const levelSlots = readLevelSlots();
    const payload = toJsonMap();
    payload.levelId = state.activeLevelId;
    levelSlots[state.activeLevelId] = payload;
    writeLevelSlots(levelSlots);
  }

  function loadLevelSlot(levelId) {
    const level = getLevelOption(levelId);
    const levelSlots = readLevelSlots();
    const slottedMap = levelSlots[level.id];
    if (slottedMap) {
      loadIntoState(slottedMap, { activeLevelId: level.id });
      setStatus(`Loaded saved editor map for ${level.label}.`, "success");
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
    if (Number(mapData.width) < 200 || Number(mapData.height) < 200) {
      errors.push("Map dimensions must be at least 200 x 200.");
    }

    const width = Number(mapData.width || 0);
    const height = Number(mapData.height || 0);

    (mapData.terrainObjects || []).forEach((terrain, index) => {
      if (terrain.x < 0 || terrain.y < 0 || terrain.x > width || terrain.y > height) {
        errors.push(`Terrain #${index + 1} is outside map bounds.`);
      }
    });

    (mapData.boundaries || []).forEach((boundary, index) => {
      if (!Array.isArray(boundary.polygonPoints) || boundary.polygonPoints.length < 3) {
        errors.push(`Boundary #${index + 1} must have at least 3 points.`);
        return;
      }
      boundary.polygonPoints.forEach((point, pointIndex) => {
        if (point.x < 0 || point.y < 0 || point.x > width || point.y > height) {
          errors.push(`Boundary #${index + 1} point #${pointIndex + 1} is outside map bounds.`);
        }
      });
    });

    (mapData.crossings || []).forEach((crossing, index) => {
      if (crossing.x < 0 || crossing.y < 0 || crossing.x > width || crossing.y > height) {
        errors.push(`Crossing #${index + 1} is outside map bounds.`);
      }
      const nearest = (() => {
        let best = Number.POSITIVE_INFINITY;
        (mapData.boundaries || []).forEach((boundary) => {
          const points = boundary.polygonPoints || [];
          for (let i = 0; i < points.length; i += 1) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            best = Math.min(best, distancePointToSegment(crossing, a, b));
          }
        });
        return best;
      })();
      if (!Number.isFinite(nearest) || nearest > Math.max(22, Number(crossing.width || 70) * 0.75)) {
        errors.push(`Crossing #${index + 1} is not aligned to a boundary edge.`);
      }
    });

    if (
      (!mapData.terrainObjects || !mapData.terrainObjects.length) &&
      (!mapData.boundaries || !mapData.boundaries.length) &&
      (!mapData.crossings || !mapData.crossings.length)
    ) {
      warnings.push("Map has no placed content yet.");
    }

    const sampleCols = 8;
    const sampleRows = 6;
    let playableSampleFound = false;
    for (let row = 0; row < sampleRows; row += 1) {
      for (let col = 0; col < sampleCols; col += 1) {
        const sample = {
          x: ((col + 0.5) / sampleCols) * width,
          y: ((row + 0.5) / sampleRows) * height
        };
        const blocked = (mapData.boundaries || []).some((boundary) => pointInPolygon(sample, boundary.polygonPoints || []));
        if (!blocked) {
          playableSampleFound = true;
          break;
        }
      }
      if (playableSampleFound) break;
    }
    if (!playableSampleFound) {
      errors.push("Map appears to have no playable space outside boundaries.");
    }

    return { errors, warnings };
  }

  function wireTopbarActions() {
    dom.levelEditSelect.addEventListener("change", () => {
      const nextLevelId = String(dom.levelEditSelect.value || "").trim();
      if (!nextLevelId || nextLevelId === state.activeLevelId) return;
      const currentLevel = getLevelOption(state.activeLevelId);
      const nextLevel = getLevelOption(nextLevelId);
      const proceed = window.confirm(
        `Switch editor context from ${currentLevel.label} to ${nextLevel.label}? Current layout will be auto-saved to its level slot.`
      );
      if (!proceed) {
        dom.levelEditSelect.value = state.activeLevelId;
        return;
      }
      saveCurrentMapToActiveLevelSlot();
      state.activeLevelId = nextLevel.id;
      loadLevelSlot(nextLevel.id);
    });

    dom.newMapBtn.addEventListener("click", () => {
      const shouldReset = window.confirm("Create a new map? Unsaved changes in the current map will be lost.");
      if (!shouldReset) return;
      loadIntoState(createDefaultMap(state.activeLevelId), { activeLevelId: state.activeLevelId });
      setTool("select");
    });

    dom.openFileBtn.addEventListener("click", () => {
      dom.openFileInput.click();
    });

    dom.openFileInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || "{}"));
          loadIntoState(parsed);
        } catch (error) {
          setStatus("Failed to parse JSON map file.", "error");
        }
      };
      reader.readAsText(file);
      dom.openFileInput.value = "";
    });

    dom.saveFileBtn.addEventListener("click", () => saveAsFile());
    dom.copyJsonBtn.addEventListener("click", () => {
      copyJsonToClipboard().catch(() => {
        setStatus("Could not copy JSON to clipboard.", "error");
      });
    });

    dom.saveLocalBtn.addEventListener("click", () => saveLocalMap());
    dom.loadLocalBtn.addEventListener("click", () => loadSelectedLocalMap());
    dom.validateBtn.addEventListener("click", () => {
      const validation = validateMapData(toJsonMap());
      setValidationSummary(validation.errors, validation.warnings);
      if (validation.errors.length) {
        setStatus(validation.errors[0], "error");
      } else if (validation.warnings.length) {
        setStatus(validation.warnings[0]);
      } else {
        setStatus("Validation complete: no issues found.", "success");
      }
    });
  }

  function wireMetadataInputs() {
    dom.mapIdInput.addEventListener("change", () => {
      const next = String(dom.mapIdInput.value || "").trim();
      if (!next) {
        dom.mapIdInput.value = state.map.id;
        return;
      }
      state.map.id = next;
      requestRender();
    });

    dom.mapNameInput.addEventListener("input", () => {
      state.map.name = String(dom.mapNameInput.value || "").slice(0, 80);
    });

    const resizeMap = () => {
      const width = Math.max(200, Number(dom.mapWidthInput.value || state.map.width));
      const height = Math.max(200, Number(dom.mapHeightInput.value || state.map.height));
      state.map.width = width;
      state.map.height = height;
      state.map.terrainObjects.forEach((terrain) => {
        terrain.x = clamp(terrain.x, 0, width);
        terrain.y = clamp(terrain.y, 0, height);
      });
      state.map.crossings.forEach((crossing) => {
        crossing.x = clamp(crossing.x, 0, width);
        crossing.y = clamp(crossing.y, 0, height);
      });
      state.map.boundaries.forEach((boundary) => {
        boundary.polygonPoints.forEach((point) => {
          point.x = clamp(point.x, 0, width);
          point.y = clamp(point.y, 0, height);
        });
      });
      requestRender();
      renderSelectionProperties();
    };

    dom.mapWidthInput.addEventListener("change", resizeMap);
    dom.mapHeightInput.addEventListener("change", resizeMap);

    dom.defaultThemeInput.addEventListener("change", () => {
      state.map.defaultThemeId = dom.defaultThemeInput.value;
      state.themePreviewId = dom.defaultThemeInput.value;
      dom.themePreviewSelect.value = state.themePreviewId;
      requestRender();
    });
  }

  function wireToolInputs() {
    dom.toolButtons.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tool]");
      if (!button) return;
      setTool(button.dataset.tool);
    });

    dom.terrainTypeSelect.addEventListener("change", () => {
      state.terrainPlacementType = dom.terrainTypeSelect.value;
    });

    dom.themePreviewSelect.addEventListener("change", () => {
      state.themePreviewId = dom.themePreviewSelect.value;
      requestRender();
    });

    dom.gridVisibleChk.addEventListener("change", () => {
      state.grid.visible = dom.gridVisibleChk.checked;
      requestRender();
    });

    dom.snapEnabledChk.addEventListener("change", () => {
      state.grid.snap = dom.snapEnabledChk.checked;
    });

    dom.gridSizeInput.addEventListener("change", () => {
      state.grid.size = Math.max(8, Number(dom.gridSizeInput.value || 32));
      dom.gridSizeInput.value = String(Math.round(state.grid.size));
      requestRender();
    });
  }

  function wireKeyboard() {
    window.addEventListener("keydown", (event) => {
      if (event.code === "Space") state.keyboard.space = true;
      if (event.ctrlKey || event.metaKey) state.keyboard.ctrl = true;

      if (event.code === "Delete") {
        deleteSelection();
      }
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyD") {
        event.preventDefault();
        duplicateSelection();
      }

      if (event.code === "Digit1") setTool("select");
      if (event.code === "Digit2") setTool("terrain");
      if (event.code === "Digit3") setTool("boundary");
      if (event.code === "Digit4") setTool("crossing");
      if (event.code === "Digit5") setTool("delete");

      if (event.code === "Escape") {
        cancelBoundaryDraft();
      }
      if (event.code === "Enter" && state.tool === "boundary" && state.boundaryDraft.length >= 3) {
        finalizeBoundaryDraft();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.code === "Space") state.keyboard.space = false;
      state.keyboard.ctrl = event.ctrlKey || event.metaKey;
    });
  }

  function wireCanvas() {
    dom.canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (state.tool === "boundary" && state.boundaryDraft.length) {
        state.boundaryDraft.pop();
        requestRender();
        setStatus("Removed last boundary draft point.");
      }
    });

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
        state.drag = {
          mode: "pan",
          startScreen: canvasPoint,
          cameraStart: { x: state.camera.x, y: state.camera.y }
        };
        return;
      }

      if (event.button !== 0) return;

      if (state.tool === "terrain") {
        placeTerrain(worldPoint);
        return;
      }
      if (state.tool === "crossing") {
        placeCrossing(worldPoint);
        return;
      }
      if (state.tool === "delete") {
        deleteAtPoint(worldPoint);
        return;
      }
      if (state.tool === "boundary") {
        beginBoundaryDraftPoint(worldPoint);
        return;
      }

      const hit = getHitTarget(worldPoint);
      if (!hit) {
        clearSelection();
        requestRender();
        return;
      }
      setSelection(hit);

      if (hit.kind === "terrain" || hit.kind === "crossing") {
        const selected = findSelectedObject();
        if (!selected) return;
        state.drag = {
          mode: "moveObject",
          objectKind: hit.kind,
          objectId: hit.id,
          startWorld: worldPoint,
          objectStart: { x: selected.x, y: selected.y }
        };
      } else if (hit.kind === "boundary" && Number.isInteger(hit.vertexIndex)) {
        state.drag = {
          mode: "moveBoundaryVertex",
          boundaryId: hit.id,
          vertexIndex: hit.vertexIndex
        };
      } else if (hit.kind === "boundary") {
        const boundary = findSelectedObject();
        if (!boundary) return;
        state.drag = {
          mode: "moveBoundary",
          boundaryId: hit.id,
          startWorld: worldPoint,
          pointsStart: boundary.polygonPoints.map((point) => ({ x: point.x, y: point.y }))
        };
      }
    });

    dom.canvas.addEventListener("dblclick", () => {
      if (state.tool !== "boundary") return;
      if (state.boundaryDraft.length >= 3) {
        finalizeBoundaryDraft();
      }
    });

    dom.canvas.addEventListener("mousemove", (event) => {
      const canvasPoint = getCanvasPointFromEvent(event);
      const worldPoint = screenToWorld(canvasPoint);
      state.hoverWorld = worldPoint;

      if (!state.drag) {
        requestRender();
        return;
      }

      if (state.drag.mode === "pan") {
        const dx = canvasPoint.x - state.drag.startScreen.x;
        const dy = canvasPoint.y - state.drag.startScreen.y;
        state.camera.x = state.drag.cameraStart.x - dx / state.camera.zoom;
        state.camera.y = state.drag.cameraStart.y - dy / state.camera.zoom;
        requestRender();
        return;
      }

      if (state.drag.mode === "moveObject") {
        const objectArray = state.drag.objectKind === "terrain" ? state.map.terrainObjects : state.map.crossings;
        const object = objectArray.find((entry) => entry.id === state.drag.objectId);
        if (!object) return;
        const dx = worldPoint.x - state.drag.startWorld.x;
        const dy = worldPoint.y - state.drag.startWorld.y;
        object.x = clamp(snapValue(state.drag.objectStart.x + dx), 0, state.map.width);
        object.y = clamp(snapValue(state.drag.objectStart.y + dy), 0, state.map.height);
        renderSelectionProperties();
        requestRender();
        return;
      }

      if (state.drag.mode === "moveBoundaryVertex") {
        const boundary = state.map.boundaries.find((entry) => entry.id === state.drag.boundaryId);
        if (!boundary) return;
        const point = boundary.polygonPoints[state.drag.vertexIndex];
        if (!point) return;
        point.x = clamp(snapValue(worldPoint.x), 0, state.map.width);
        point.y = clamp(snapValue(worldPoint.y), 0, state.map.height);
        state.selected = { kind: "boundary", id: boundary.id, vertexIndex: state.drag.vertexIndex };
        renderSelectionProperties();
        requestRender();
        return;
      }

      if (state.drag.mode === "moveBoundary") {
        const boundary = state.map.boundaries.find((entry) => entry.id === state.drag.boundaryId);
        if (!boundary) return;
        const dx = worldPoint.x - state.drag.startWorld.x;
        const dy = worldPoint.y - state.drag.startWorld.y;
        boundary.polygonPoints.forEach((point, index) => {
          const start = state.drag.pointsStart[index];
          point.x = clamp(snapValue(start.x + dx), 0, state.map.width);
          point.y = clamp(snapValue(start.y + dy), 0, state.map.height);
        });
        renderSelectionProperties();
        requestRender();
      }
    });

    window.addEventListener("mouseup", () => {
      if (state.drag && state.drag.mode !== "pan") {
        setStatus("Object updated.", "success");
      }
      state.drag = null;
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
    dom.defaultThemeInput.value = state.map.defaultThemeId;
  }

  function init() {
    bootstrapSelects();
    wireTopbarActions();
    wireMetadataInputs();
    wireToolInputs();
    wireKeyboard();
    wireCanvas();
    refreshLocalMapSelect();
    loadLevelSlot(state.activeLevelId);
    requestRender();
    renderLoop();
    window.addEventListener("resize", () => requestRender());
    setStatus("Map editor ready. Start placing terrain, boundaries, and crossings.", "success");
  }

  init();
})();
