(function () {
  const STORAGE_KEY = window.RL_DATA.STORAGE.charactersKey;
  const LEGACY = window.RL_DATA.LEGACY_PROGRESSION || { baseXp: 90, growth: 1.18 };

  function nowIso() {
    return new Date().toISOString();
  }

  function xpRequiredForNextLegacyLevel(level) {
    return Math.max(1, Math.floor(LEGACY.baseXp * Math.pow(level, LEGACY.growth)));
  }

  function normalizeClassNodeRanks(raw) {
    const map = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return map;

    Object.entries(raw).forEach(([key, value]) => {
      if (typeof value === "number") {
        map[key] = Math.max(0, Math.floor(value));
        return;
      }
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.entries(value).forEach(([childKey, childValue]) => {
          if (typeof childValue !== "number") return;
          map[`${key}.${childKey}`] = Math.max(0, Math.floor(childValue));
        });
      }
    });
    return map;
  }

  function getSpentClassPoints(classNodeRanks) {
    return Object.values(classNodeRanks).reduce((sum, value) => sum + Math.max(0, Math.floor(value || 0)), 0);
  }

  function calculateLegacyProgress(totalLegacyXp, spentClassPoints) {
    const totalXp = Math.max(0, Math.floor(totalLegacyXp || 0));
    let level = 1;
    let xpIntoLevel = totalXp;
    let xpToNextLevel = xpRequiredForNextLegacyLevel(level);

    while (xpIntoLevel >= xpToNextLevel) {
      xpIntoLevel -= xpToNextLevel;
      level += 1;
      xpToNextLevel = xpRequiredForNextLegacyLevel(level);
    }

    const totalEarnedSkillPoints = Math.max(0, level - 1);
    const classSkillPoints = Math.max(0, totalEarnedSkillPoints - Math.max(0, spentClassPoints || 0));

    return {
      legacyLevel: level,
      classSkillPoints,
      totalEarnedSkillPoints,
      legacyXpIntoLevel: xpIntoLevel,
      legacyXpToNextLevel: xpToNextLevel
    };
  }

  function normalizeCharacter(raw) {
    const normalizedClassId = raw.classId || raw.class || "barbarian";
    const classNodeRanks = normalizeClassNodeRanks(raw.classNodeRanks);
    const spentClassPoints = getSpentClassPoints(classNodeRanks);
    const legacy = calculateLegacyProgress(Number(raw.legacyXp || 0), spentClassPoints);

    return {
      id: raw.id,
      name: raw.name || "Unnamed",
      race: raw.race || "human",
      classId: normalizedClassId,
      class: normalizedClassId,
      gold: Number(raw.gold || 0),
      legacyXp: Number(raw.legacyXp || 0),
      legacyLevel: legacy.legacyLevel,
      classSkillPoints: legacy.classSkillPoints,
      totalEarnedSkillPoints: legacy.totalEarnedSkillPoints,
      legacyXpIntoLevel: legacy.legacyXpIntoLevel,
      legacyXpToNextLevel: legacy.legacyXpToNextLevel,
      classNodeRanks,
      bestSurvivalTime: Number(raw.bestSurvivalTime || 0),
      runsPlayed: Number(raw.runsPlayed || 0),
      minibossKills: Number(raw.minibossKills || 0),
      createdAt: raw.createdAt || nowIso(),
      updatedAt: raw.updatedAt || nowIso()
    };
  }

  function readCharacters() {
    try {
      const text = localStorage.getItem(STORAGE_KEY);
      if (!text) return [];
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeCharacter);
    } catch (error) {
      console.warn("Failed to read save data:", error);
      return [];
    }
  }

  function writeCharacters(characters) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  }

  function listCharacters() {
    return readCharacters().sort((a, b) => {
      if (b.updatedAt !== a.updatedAt) return b.updatedAt.localeCompare(a.updatedAt);
      return a.name.localeCompare(b.name);
    });
  }

  function createCharacter(name) {
    const trimmedName = String(name || "").trim();
    if (!trimmedName) {
      throw new Error("Character name is required.");
    }

    const characters = readCharacters();
    const timestamp = nowIso();
    const character = normalizeCharacter({
      id: `char_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      name: trimmedName.slice(0, 16),
      race: "human",
      classId: "barbarian",
      class: "barbarian",
      gold: 0,
      legacyXp: 0,
      classNodeRanks: {},
      bestSurvivalTime: 0,
      runsPlayed: 0,
      minibossKills: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    characters.push(character);
    writeCharacters(characters);
    return character;
  }

  function getCharacter(characterId) {
    return readCharacters().find((item) => item.id === characterId) || null;
  }

  function updateCharacter(characterId, updater) {
    const characters = readCharacters();
    const index = characters.findIndex((item) => item.id === characterId);
    if (index < 0) return null;

    const current = normalizeCharacter(characters[index]);
    const updatedPatch = updater(current) || {};
    const updated = normalizeCharacter({
      ...current,
      ...updatedPatch,
      updatedAt: nowIso()
    });
    characters[index] = updated;
    writeCharacters(characters);
    return updated;
  }

  function parseNodeMaxRank(node) {
    if (!node) return 1;
    if (typeof node.maxRank === "number") return Math.max(1, Math.floor(node.maxRank));
    if (typeof node.levels === "string") {
      const text = node.levels.trim();
      if (text.includes("-")) {
        const parts = text.split("-");
        const candidate = Number(parts[1]);
        if (!Number.isNaN(candidate)) return Math.max(1, Math.floor(candidate));
      }
      if (text.includes("/")) {
        const parts = text.split("/");
        const candidate = Number(parts[1]);
        if (!Number.isNaN(candidate)) return Math.max(1, Math.floor(candidate));
      }
      const numeric = Number(text);
      if (!Number.isNaN(numeric)) return Math.max(1, Math.floor(numeric));
    }
    return node.capstone ? 1 : 5;
  }

  function getClassNodeDefinition(classId, branchId, nodeId) {
    const classTree = window.RL_DATA.SKILL_TREES[classId] && window.RL_DATA.SKILL_TREES[classId].classTree;
    if (!classTree || !Array.isArray(classTree.branches)) return null;

    const branchIndex = classTree.branches.findIndex((item) => item.id === branchId);
    if (branchIndex < 0) return null;
    const branch = classTree.branches[branchIndex];
    const nodeIndex = Array.isArray(branch.nodes)
      ? branch.nodes.findIndex((item) => item.id === nodeId)
      : -1;
    if (nodeIndex < 0) return null;
    const node = branch.nodes[nodeIndex];

    return {
      classTree,
      branch,
      node,
      nodeIndex
    };
  }

  function getNodeRank(classNodeRanks, branchId, nodeId) {
    return Number(classNodeRanks[`${branchId}.${nodeId}`] || 0);
  }

  function getBranchSpentPoints(classNodeRanks, branchId) {
    return Object.entries(classNodeRanks).reduce((sum, [key, value]) => {
      if (!key.startsWith(`${branchId}.`)) return sum;
      return sum + Math.max(0, Math.floor(value || 0));
    }, 0);
  }

  function canSpendOnNode(classNodeRanks, nodeMeta) {
    const currentRank = getNodeRank(classNodeRanks, nodeMeta.branch.id, nodeMeta.node.id);
    const maxRank = parseNodeMaxRank(nodeMeta.node);
    if (currentRank >= maxRank) {
      return { ok: false, error: "That node is already maxed." };
    }

    if (nodeMeta.nodeIndex > 0) {
      const previousNode = nodeMeta.branch.nodes[nodeMeta.nodeIndex - 1];
      const previousRank = getNodeRank(classNodeRanks, nodeMeta.branch.id, previousNode.id);
      if (previousRank <= 0) {
        return { ok: false, error: `Unlock ${previousNode.label} first.` };
      }
    }

    if (nodeMeta.node.capstone) {
      const branchSpent = getBranchSpentPoints(classNodeRanks, nodeMeta.branch.id);
      const requiredBranchPoints = nodeMeta.node.branchPointsRequired || 15;
      if (branchSpent < requiredBranchPoints) {
        return {
          ok: false,
          error: `Need ${requiredBranchPoints} points in ${nodeMeta.branch.label} before this capstone.`
        };
      }
    }

    return { ok: true };
  }

  function spendClassSkillPoint(characterId, branchId, nodeId) {
    const characters = readCharacters();
    const index = characters.findIndex((item) => item.id === characterId);
    if (index < 0) {
      return { ok: false, error: "Character not found." };
    }

    const current = normalizeCharacter(characters[index]);
    if (current.classSkillPoints <= 0) {
      return { ok: false, error: "No unspent class skill points." };
    }

    const nodeMeta = getClassNodeDefinition(current.classId, branchId, nodeId);
    if (!nodeMeta) {
      return { ok: false, error: "Class skill node not found." };
    }

    const canSpend = canSpendOnNode(current.classNodeRanks, nodeMeta);
    if (!canSpend.ok) {
      return canSpend;
    }

    const nodeKey = `${branchId}.${nodeId}`;
    const updatedRanks = {
      ...current.classNodeRanks,
      [nodeKey]: getNodeRank(current.classNodeRanks, branchId, nodeId) + 1
    };

    const updated = normalizeCharacter({
      ...current,
      classNodeRanks: updatedRanks,
      updatedAt: nowIso()
    });

    characters[index] = updated;
    writeCharacters(characters);
    return { ok: true, character: updated };
  }

  function applyRunRewards(characterId, runSummary) {
    return updateCharacter(characterId, (current) => ({
      gold: current.gold + (runSummary.goldEarned || 0),
      legacyXp: current.legacyXp + (runSummary.legacyXpEarned || 0),
      bestSurvivalTime: Math.max(current.bestSurvivalTime, runSummary.timeSurvived || 0),
      runsPlayed: current.runsPlayed + 1,
      minibossKills: current.minibossKills + (runSummary.minibossesDefeated || 0)
    }));
  }

  window.RL_SAVE = Object.freeze({
    listCharacters,
    createCharacter,
    getCharacter,
    updateCharacter,
    applyRunRewards,
    spendClassSkillPoint,
    xpRequiredForNextLegacyLevel,
    calculateLegacyProgress
  });
})();
