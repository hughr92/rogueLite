(function () {
  const DATA = window.RL_DATA;
  const SAVE = window.RL_SAVE;
  const UI_FACTORY = window.RL_UI;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function randInt(min, max) {
    return Math.floor(randRange(min, max + 1));
  }

  function distanceSquared(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  function normalizeAngle(angle) {
    let next = angle;
    while (next <= -Math.PI) next += Math.PI * 2;
    while (next > Math.PI) next -= Math.PI * 2;
    return next;
  }

  function angleBetween(a, b) {
    return normalizeAngle(a - b);
  }

  function normalizeVector(dx, dy) {
    const length = Math.hypot(dx, dy);
    if (length <= 0.0001) return { x: 0, y: 0 };
    return { x: dx / length, y: dy / length };
  }

  function weightedChoice(weights) {
    let total = 0;
    const entries = Object.entries(weights).filter((entry) => entry[1] > 0);
    entries.forEach((entry) => {
      total += entry[1];
    });
    if (!entries.length || total <= 0) return null;

    let roll = Math.random() * total;
    for (let i = 0; i < entries.length; i += 1) {
      const [id, weight] = entries[i];
      roll -= weight;
      if (roll <= 0) return id;
    }
    return entries[entries.length - 1][0];
  }

  function chooseDistinctWeighted(items, count) {
    const selected = [];
    const pool = items.slice();
    while (pool.length && selected.length < count) {
      let total = 0;
      pool.forEach((item) => {
        total += item.weight || 1;
      });
      let roll = Math.random() * total;
      let chosenIndex = 0;
      for (let i = 0; i < pool.length; i += 1) {
        roll -= pool[i].weight || 1;
        if (roll <= 0) {
          chosenIndex = i;
          break;
        }
      }
      selected.push(pool[chosenIndex]);
      pool.splice(chosenIndex, 1);
    }
    return selected;
  }

  function formatTime(seconds) {
    const clampedSeconds = Math.max(0, Math.floor(seconds));
    const minutes = String(Math.floor(clampedSeconds / 60)).padStart(2, "0");
    const remainder = String(clampedSeconds % 60).padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  function getSpawnTableForTime(seconds) {
    return (
      DATA.SPAWN_TABLES.find((table) => seconds >= table.start && seconds < table.end) ||
      DATA.SPAWN_TABLES[DATA.SPAWN_TABLES.length - 1]
    );
  }

  function levelXpRequirement(level) {
    return Math.floor(DATA.LEVEL_CURVE.baseXp * Math.pow(level, DATA.LEVEL_CURVE.growth));
  }

  const UPGRADE_BY_ID = Object.fromEntries(DATA.UPGRADES.map((upgrade) => [upgrade.id, upgrade]));

  class GameApp {
    constructor() {
      this.canvas = document.getElementById("gameCanvas");
      this.ctx = this.canvas.getContext("2d");
      this.ui = UI_FACTORY.createUiController();

      this.characters = [];
      this.selectedCharacterId = null;
      this.selectedLevelId = null;
      this.currentRun = null;
      this.previousTime = performance.now();
      this.entityIds = 1;

      this.input = {
        keys: { KeyW: false, KeyA: false, KeyS: false, KeyD: false },
        mouseX: 0,
        mouseY: 0
      };
      this.obstacleSprites = this.createObstacleSprites();
      this.chestSprites = this.createChestSprites();

      this.boundLoop = this.loop.bind(this);
      this.boundResize = this.handleResize.bind(this);
    }

    createObstacleSprites() {
      if (typeof Image === "undefined") return [];
      const spritePaths = ["assets/obstacles/barrier-slab-a.svg", "assets/obstacles/barrier-slab-b.svg"];
      return spritePaths.map((path) => {
        const image = new Image();
        image.src = path;
        return image;
      });
    }

    createChestSprites() {
      if (typeof Image === "undefined") return [];
      const spritePaths = ["assets/pickups/chest-closed.svg", "assets/pickups/chest-open.svg"];
      return spritePaths.map((path) => {
        const image = new Image();
        image.src = path;
        return image;
      });
    }

    init() {
      this.ui.init({
        onCreateCharacter: (name) => this.handleCreateCharacter(name),
        onSelectCharacter: (id) => this.handleSelectCharacter(id),
        onSelectLevel: (levelId) => this.handleSelectLevel(levelId),
        onDeleteCharacter: (characterId) => this.handleDeleteCharacter(characterId),
        onStartRun: () => this.startRunFromSelection(),
        onChooseUpgrade: (upgradeId) => this.chooseUpgrade(upgradeId),
        onSpendClassPoint: (branchId, nodeId) => this.handleSpendClassPoint(branchId, nodeId),
        onMoveInventoryItem: (fromLocation, toLocation) => this.handleMoveInventoryItem(fromLocation, toLocation),
        onBuyMerchantItem: (listingId) => this.handleBuyMerchantItem(listingId),
        onSellInventoryItem: (location) => this.handleSellInventoryItem(location),
        onBuybackMerchantItem: (buybackId) => this.handleBuybackMerchantItem(buybackId),
        onClaimQuestReward: (questId) => this.handleClaimQuestReward(questId),
        onClaimBountyReward: (enemyTypeId) => this.handleClaimBountyReward(enemyTypeId),
        onResume: () => this.resumeRun(),
        onRestart: () => this.restartRun(),
        onReturnHome: () => this.returnHome(),
        onPlayAgain: () => this.startRunFromSelection()
      });

      this.installInputListeners();
      this.handleResize();
      window.addEventListener("resize", this.boundResize);

      this.refreshCharacters(true);
      requestAnimationFrame(this.boundLoop);
    }

    installInputListeners() {
      window.addEventListener("keydown", (event) => {
        if (Object.prototype.hasOwnProperty.call(this.input.keys, event.code)) {
          this.input.keys[event.code] = true;
        }

        if (event.code === "Escape" && !event.repeat) {
          if (!this.currentRun || this.currentRun.ended) return;
          if (this.currentRun.pauseReason === "levelup") return;
          if (this.currentRun.pauseReason === "paused") {
            this.resumeRun();
          } else if (!this.currentRun.pauseReason) {
            this.pauseRun();
          }
        }
      });

      window.addEventListener("keyup", (event) => {
        if (Object.prototype.hasOwnProperty.call(this.input.keys, event.code)) {
          this.input.keys[event.code] = false;
        }
      });

      this.canvas.addEventListener("mousemove", (event) => {
        const rect = this.canvas.getBoundingClientRect();
        this.input.mouseX = event.clientX - rect.left;
        this.input.mouseY = event.clientY - rect.top;
      });
    }

    handleResize() {
      const rect = this.canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.floor(width * dpr);
      this.canvas.height = Math.floor(height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (this.currentRun) {
        this.currentRun.world.width = width;
        this.currentRun.world.height = height;
        this.centerPlayerInWorld();
      }
    }

    refreshCharacters(initialLoad) {
      this.characters = SAVE.listCharacters();
      if (!this.characters.length) {
        this.selectedCharacterId = null;
        this.selectedLevelId = null;
        this.ui.renderCharacterList([], null);
        this.ui.renderCharacterDetails(null);
        this.ui.setHomeStatus("Create a Human Barbarian to begin your first run.");
        this.ui.showHomeScreen();
        return;
      }

      if (!this.selectedCharacterId || !this.characters.some((c) => c.id === this.selectedCharacterId)) {
        this.selectedCharacterId = this.characters[0].id;
      }

      this.ui.renderCharacterList(this.characters, this.selectedCharacterId);
      const selected = this.getSelectedCharacter();
      if (selected) {
        const selectedLevel = this.resolveSelectedLevelForCharacter(selected);
        this.ui.renderCharacterDetails(selected, { resetTab: true, selectedLevelId: selectedLevel.id });
        const best = formatTime(selected.bestSurvivalTime || 0);
        const levelLabel = selectedLevel && selectedLevel.label ? selectedLevel.label : "Level 1";
        const message = initialLoad
          ? `Selected ${selected.name}. ${levelLabel} ready. Best survival: ${best}.`
          : `${selected.name} ready on ${levelLabel}. Gold ${selected.gold}, Legacy XP ${selected.legacyXp}.`;
        this.ui.setHomeStatus(message);
      }
      this.ui.showHomeScreen();
    }

    getSelectedCharacter() {
      return this.characters.find((character) => character.id === this.selectedCharacterId) || null;
    }

    getLevelDefinitions() {
      const configured = Array.isArray(DATA.LEVELS) ? DATA.LEVELS : [];
      const normalized = configured
        .map((level) => {
          if (!level || typeof level !== "object") return null;
          const index = Math.max(1, Math.floor(Number(level.index || 1)));
          return {
            id: String(level.id || `level_${index}`),
            index,
            label: String(level.label || `Level ${index}`),
            subtitle: String(level.subtitle || "")
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.index - b.index);
      if (normalized.length) return normalized;
      return [{ id: "level_1", index: 1, label: "Level 1", subtitle: "" }];
    }

    getAvailableLevelsForCharacter(character) {
      const levels = this.getLevelDefinitions();
      if (!character) return [levels[0]];
      const highestUnlockedLevel = Math.max(1, Math.floor(Number(character.highestUnlockedLevel || 1)));
      const unlocked = levels.filter((level) => level.index <= highestUnlockedLevel);
      return unlocked.length ? unlocked : [levels[0]];
    }

    resolveSelectedLevelForCharacter(character, preferredLevelId) {
      const available = this.getAvailableLevelsForCharacter(character);
      const requestedId =
        typeof preferredLevelId === "string" && preferredLevelId.trim().length
          ? preferredLevelId.trim()
          : this.selectedLevelId;
      const selected = available.find((level) => level.id === requestedId) || available[0];
      this.selectedLevelId = selected.id;
      return selected;
    }

    getCharacterBestiaryDiscoverySet(character) {
      const discovered = (character && character.bestiaryDiscoveries) || {};
      const knownIds = Object.keys(discovered).filter((enemyTypeId) => discovered[enemyTypeId] === true);
      return new Set(knownIds);
    }

    markEnemyEncountered(enemyTypeId) {
      const run = this.currentRun;
      if (!run) return;
      const normalizedTypeId = String(enemyTypeId || "").trim();
      if (!normalizedTypeId) return;
      if (!run.bestiaryDiscoveries) {
        run.bestiaryDiscoveries = new Set();
      }
      if (run.bestiaryDiscoveries.has(normalizedTypeId)) return;
      run.bestiaryDiscoveries.add(normalizedTypeId);
      if (!SAVE.markBestiaryEncounter) return;
      const result = SAVE.markBestiaryEncounter(run.characterId, normalizedTypeId);
      if (result && result.ok && result.discovered) {
        run.stats.newBestiaryEntries = Math.max(0, Number(run.stats.newBestiaryEntries || 0)) + 1;
      }
    }

    handleCreateCharacter(name) {
      const trimmed = String(name || "").trim();
      if (!trimmed) {
        return { ok: false, error: "Name is required." };
      }
      if (trimmed.length < 2) {
        return { ok: false, error: "Use at least 2 characters." };
      }
      try {
        const newCharacter = SAVE.createCharacter(trimmed);
        this.selectedCharacterId = newCharacter.id;
        this.refreshCharacters(false);
        this.ui.setHomeStatus(`${newCharacter.name} created. Ready for a run.`);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message || "Could not create character." };
      }
    }

    handleSelectCharacter(characterId) {
      this.selectedCharacterId = characterId;
      this.ui.renderCharacterList(this.characters, this.selectedCharacterId);
      const selected = this.getSelectedCharacter();
      if (selected) {
        const selectedLevel = this.resolveSelectedLevelForCharacter(selected);
        this.ui.renderCharacterDetails(selected, { resetTab: true, selectedLevelId: selectedLevel.id });
        this.ui.setHomeStatus(`Selected ${selected.name}. ${selectedLevel.label} ready. Press Start Run when ready.`);
      }
    }

    handleSelectLevel(levelId) {
      const selectedCharacter = this.getSelectedCharacter();
      if (!selectedCharacter) return;
      const selectedLevel = this.resolveSelectedLevelForCharacter(selectedCharacter, levelId);
      this.ui.renderCharacterDetails(selectedCharacter, {
        resetTab: false,
        selectedLevelId: selectedLevel.id
      });
      this.ui.setHomeStatus(`Selected ${selectedCharacter.name}. ${selectedLevel.label} ready.`);
    }

    handleDeleteCharacter(characterId) {
      const deletedCharacter = this.characters.find((character) => character.id === characterId);
      const didDelete = SAVE.deleteCharacter(characterId);
      if (!didDelete) {
        this.ui.setHomeStatus("Could not delete character.");
        return;
      }
      this.selectedCharacterId = null;
      this.refreshCharacters(false);
      if (deletedCharacter) {
        this.ui.setHomeStatus(`${deletedCharacter.name} was deleted.`);
      }
    }

    handleSpendClassPoint(attributeId) {
      const selected = this.getSelectedCharacter();
      if (!selected) return;

      const spendResult = SAVE.spendAttributePoint
        ? SAVE.spendAttributePoint(selected.id, attributeId)
        : SAVE.spendClassSkillPoint(selected.id, attributeId, attributeId);
      if (!spendResult || !spendResult.ok) {
        this.ui.setHomeStatus((spendResult && spendResult.error) || "Could not spend attribute point.");
        return;
      }

      this.characters = SAVE.listCharacters();
      const updated = this.getSelectedCharacter();
      this.ui.renderCharacterList(this.characters, this.selectedCharacterId);
      if (updated) {
        const selectedLevel = this.resolveSelectedLevelForCharacter(updated);
        this.ui.renderCharacterDetails(updated, { resetTab: false, selectedLevelId: selectedLevel.id });
        this.ui.setHomeStatus(
          `${updated.name} is Legacy Lv.${updated.legacyLevel} with ${updated.attributePoints || 0} attribute points remaining.`
        );
      }
    }

    handleMoveInventoryItem(fromLocation, toLocation) {
      const selected = this.getSelectedCharacter();
      if (!selected) return;

      try {
        const updated = SAVE.moveInventoryItem(selected.id, fromLocation, toLocation);
        if (!updated) {
          this.ui.setHomeStatus("Could not move item.");
          return;
        }
        this.characters = SAVE.listCharacters();
        const refreshed = this.getSelectedCharacter();
        this.ui.renderCharacterList(this.characters, this.selectedCharacterId);
        if (refreshed) {
          const selectedLevel = this.resolveSelectedLevelForCharacter(refreshed);
          this.ui.renderCharacterDetails(refreshed, { resetTab: false, selectedLevelId: selectedLevel.id });
        }
      } catch (error) {
        this.ui.setHomeStatus(error && error.message ? error.message : "Invalid inventory move.");
      }
    }

    handleBuyMerchantItem(listingId) {
      const selected = this.getSelectedCharacter();
      if (!selected) return;

      const result = SAVE.purchaseMerchantItem(selected.id, listingId);
      if (!result || !result.ok) {
        this.ui.setHomeStatus((result && result.error) || "Could not complete purchase.");
        return;
      }

      const purchase = result.purchase || {};
      const storageLocation = purchase.storageLocation || null;
      this.characters = SAVE.listCharacters();
      const refreshed = this.getSelectedCharacter();
      this.ui.renderCharacterList(this.characters, this.selectedCharacterId);
      if (refreshed) {
        const selectedLevel = this.resolveSelectedLevelForCharacter(refreshed);
        this.ui.renderCharacterDetails(refreshed, { resetTab: false, selectedLevelId: selectedLevel.id });
        if (storageLocation && this.ui.revealStorageLocation) {
          this.ui.revealStorageLocation(refreshed, storageLocation);
        }
      }
      const storageTabLabelMap = {
        general: "General",
        reserve1: "Tab 2",
        reserve2: "Tab 3"
      };
      const storageLocationText =
        storageLocation &&
        typeof storageLocation === "object" &&
        typeof storageLocation.tabId === "string" &&
        Number.isInteger(storageLocation.index)
          ? `${storageTabLabelMap[storageLocation.tabId] || storageLocation.tabId}, Slot ${storageLocation.index + 1}`
          : "";
      if (purchase.itemName) {
        this.ui.setHomeStatus(
          storageLocationText
            ? `Purchased ${purchase.itemName} for ${purchase.price || 0} gold. Stored in ${storageLocationText}.`
            : `Purchased ${purchase.itemName} for ${purchase.price || 0} gold.`
        );
      } else {
        this.ui.setHomeStatus(storageLocationText ? `Purchase complete. Stored in ${storageLocationText}.` : "Purchase complete.");
      }
    }

    handleSellInventoryItem(location) {
      const selected = this.getSelectedCharacter();
      if (!selected) return;

      const result = SAVE.sellInventoryItem(selected.id, location);
      if (!result || !result.ok) {
        this.ui.setHomeStatus((result && result.error) || "Could not sell item.");
        return;
      }

      this.characters = SAVE.listCharacters();
      const refreshed = this.getSelectedCharacter();
      this.ui.renderCharacterList(this.characters, this.selectedCharacterId);
      if (refreshed) {
        const selectedLevel = this.resolveSelectedLevelForCharacter(refreshed);
        this.ui.renderCharacterDetails(refreshed, { resetTab: false, selectedLevelId: selectedLevel.id });
      }
      const sale = result.sale || {};
      if (sale.itemName) {
        this.ui.setHomeStatus(`Sold ${sale.itemName} for ${sale.price || 0} gold.`);
      } else {
        this.ui.setHomeStatus(`Item sold for ${sale.price || 0} gold.`);
      }
    }

    handleBuybackMerchantItem(buybackId) {
      const selected = this.getSelectedCharacter();
      if (!selected) return;

      const result = SAVE.buybackMerchantItem(selected.id, buybackId);
      if (!result || !result.ok) {
        this.ui.setHomeStatus((result && result.error) || "Could not buy back item.");
        return;
      }

      const purchase = result.purchase || {};
      const storageLocation = purchase.storageLocation || null;
      const storageTabLabelMap = {
        general: "General",
        reserve1: "Tab 2",
        reserve2: "Tab 3"
      };
      const storageLocationText =
        storageLocation &&
        typeof storageLocation === "object" &&
        typeof storageLocation.tabId === "string" &&
        Number.isInteger(storageLocation.index)
          ? `${storageTabLabelMap[storageLocation.tabId] || storageLocation.tabId}, Slot ${storageLocation.index + 1}`
          : "";

      this.characters = SAVE.listCharacters();
      const refreshed = this.getSelectedCharacter();
      this.ui.renderCharacterList(this.characters, this.selectedCharacterId);
      if (refreshed) {
        const selectedLevel = this.resolveSelectedLevelForCharacter(refreshed);
        this.ui.renderCharacterDetails(refreshed, { resetTab: false, selectedLevelId: selectedLevel.id });
        if (storageLocation && this.ui.revealStorageLocation) {
          this.ui.revealStorageLocation(refreshed, storageLocation);
        }
      }

      if (purchase.itemName) {
        this.ui.setHomeStatus(
          storageLocationText
            ? `Bought back ${purchase.itemName} for ${purchase.price || 0} gold. Stored in ${storageLocationText}.`
            : `Bought back ${purchase.itemName} for ${purchase.price || 0} gold.`
        );
      } else {
        this.ui.setHomeStatus(
          storageLocationText
            ? `Buyback complete. Stored in ${storageLocationText}.`
            : "Buyback complete."
        );
      }
    }

    handleClaimQuestReward(questId) {
      const selected = this.getSelectedCharacter();
      if (!selected) return;
      if (!SAVE.claimQuestReward) {
        this.ui.setHomeStatus("Quest claiming is not available.");
        return;
      }

      const result = SAVE.claimQuestReward(selected.id, questId);
      if (!result || !result.ok) {
        this.ui.setHomeStatus((result && result.error) || "Could not claim quest reward.");
        return;
      }

      this.characters = SAVE.listCharacters();
      const refreshed = this.getSelectedCharacter();
      this.ui.renderCharacterList(this.characters, this.selectedCharacterId);
      if (refreshed) {
        const selectedLevel = this.resolveSelectedLevelForCharacter(refreshed);
        this.ui.renderCharacterDetails(refreshed, { resetTab: false, selectedLevelId: selectedLevel.id });
      }

      const claim = result.claim || {};
      if (claim.questTitle) {
        this.ui.setHomeStatus(`${claim.questTitle} claimed. ${claim.rewardLabel || "Reward unlocked."}`);
      } else {
        this.ui.setHomeStatus("Quest reward claimed.");
      }
    }

    handleClaimBountyReward(enemyTypeId) {
      const selected = this.getSelectedCharacter();
      if (!selected) return;
      if (!SAVE.claimBountyReward) {
        this.ui.setHomeStatus("Bounty claiming is not available.");
        return;
      }

      const result = SAVE.claimBountyReward(selected.id, enemyTypeId);
      if (!result || !result.ok) {
        this.ui.setHomeStatus((result && result.error) || "Could not claim bounty reward.");
        return;
      }

      this.characters = SAVE.listCharacters();
      const refreshed = this.getSelectedCharacter();
      this.ui.renderCharacterList(this.characters, this.selectedCharacterId);
      if (refreshed) {
        const selectedLevel = this.resolveSelectedLevelForCharacter(refreshed);
        this.ui.renderCharacterDetails(refreshed, { resetTab: false, selectedLevelId: selectedLevel.id });
      }

      const claim = result.claim || {};
      if (claim.enemyLabel) {
        this.ui.setHomeStatus(
          `${claim.enemyLabel} bounty claimed. ${claim.rewardLabel || "Reward granted."}`
        );
      } else {
        this.ui.setHomeStatus("Bounty reward claimed.");
      }
    }

    getSwarmConfig() {
      return DATA.SWARM_EVENTS || {};
    }

    rollSwarmTimeWindow(windowConfig, fallbackMin, fallbackMax) {
      const parsedMin = Number(windowConfig && windowConfig.min);
      const parsedMax = Number(windowConfig && windowConfig.max);
      const min = Number.isNaN(parsedMin) ? fallbackMin : parsedMin;
      const max = Number.isNaN(parsedMax) ? fallbackMax : parsedMax;
      const low = Math.max(1, Math.min(min, max));
      const high = Math.max(low, Math.max(min, max));
      return randRange(low, high);
    }

    createInitialSwarmState() {
      const swarmConfig = this.getSwarmConfig();
      if (!swarmConfig || swarmConfig.enabled === false) {
        return {
          enabled: false,
          nextEventAt: Number.POSITIVE_INFINITY,
          warningTimer: 0,
          activeTimer: 0,
          pendingEvent: null,
          currentEvent: null
        };
      }

      return {
        enabled: true,
        nextEventAt: this.rollSwarmTimeWindow(swarmConfig.firstSwarmDelaySeconds, 40, 55),
        warningTimer: 0,
        activeTimer: 0,
        pendingEvent: null,
        currentEvent: null
      };
    }

    getMagnetPowerupConfig() {
      const powerups = DATA.POWERUPS || {};
      const magnet = powerups.magnet || {};
      const drop = magnet.drop || {};
      const effect = magnet.effect || {};
      const visual = magnet.visual || {};

      return {
        id: magnet.id || "magnet",
        label: magnet.label || "Magnet",
        drop: {
          requiresUnlock: drop.requiresUnlock !== false,
          checkIntervalSeconds: Math.max(1, Number(drop.checkIntervalSeconds || 10)),
          baseChancePerCheck: clamp(Number(drop.baseChancePerCheck || 0.02), 0, 1),
          badLuckRampSeconds: Math.max(1, Number(drop.badLuckRampSeconds || 240)),
          maxBadLuckBonusChance: clamp(Number(drop.maxBadLuckBonusChance || 0.08), 0, 1),
          firstDropDelaySeconds: Math.max(0, Number(drop.firstDropDelaySeconds || 45)),
          minSecondsBetweenDrops: Math.max(0, Number(drop.minSecondsBetweenDrops || 150)),
          maxActiveOnGround: Math.max(1, Math.floor(Number(drop.maxActiveOnGround || 1))),
          minSpawnDistanceFromPlayer: Math.max(24, Number(drop.minSpawnDistanceFromPlayer || 85)),
          maxSpawnDistanceFromPlayer: Math.max(24, Number(drop.maxSpawnDistanceFromPlayer || 260)),
          spawnEdgePadding: Math.max(0, Number(drop.spawnEdgePadding || 24))
        },
        effect: {
          pullSpeed: Math.max(200, Number(effect.pullSpeed || 1400)),
          pullDurationSeconds: Math.max(0.2, Number(effect.pullDurationSeconds || 1.5))
        },
        visual: {
          radius: Math.max(5, Number(visual.radius || 8)),
          fillColor: visual.fillColor || "#76d68c",
          ringColor: visual.ringColor || "#c6ffdb"
        }
      };
    }

    getBattleFuryPowerupConfig() {
      const powerups = DATA.POWERUPS || {};
      const fury = powerups.battle_fury || {};
      const drop = fury.drop || {};
      const effect = fury.effect || {};
      const visual = fury.visual || {};

      return {
        id: fury.id || "battle_fury",
        label: fury.label || "Battle Fury",
        drop: {
          requiresUnlock: drop.requiresUnlock !== false,
          chanceOnEnemyKill: clamp(Number(drop.chanceOnEnemyKill || 0.02), 0, 1),
          firstDropDelaySeconds: Math.max(0, Number(drop.firstDropDelaySeconds || 35)),
          minSecondsBetweenDrops: Math.max(0, Number(drop.minSecondsBetweenDrops || 55)),
          maxActiveOnGround: Math.max(1, Math.floor(Number(drop.maxActiveOnGround || 1)))
        },
        effect: {
          damageMultiplier: Math.max(1, Number(effect.damageMultiplier || 1.35)),
          attackSpeedMultiplier: Math.max(1, Number(effect.attackSpeedMultiplier || 1.3)),
          durationSeconds: Math.max(0.5, Number(effect.durationSeconds || 10))
        },
        visual: {
          radius: Math.max(5, Number(visual.radius || 8)),
          fillColor: visual.fillColor || "#ff9f5f",
          ringColor: visual.ringColor || "#ffd5b0"
        }
      };
    }

    getHealingOrbPowerupConfig() {
      const powerups = DATA.POWERUPS || {};
      const healingOrb = powerups.healing_orb || {};
      const drop = healingOrb.drop || {};
      const effect = healingOrb.effect || {};
      const visual = healingOrb.visual || {};

      return {
        id: healingOrb.id || "healing_orb",
        label: healingOrb.label || "Healing Orb",
        drop: {
          requiresUnlock: drop.requiresUnlock !== false,
          checkIntervalSeconds: Math.max(1, Number(drop.checkIntervalSeconds || 10)),
          baseChancePerCheck: clamp(Number(drop.baseChancePerCheck || 0.3), 0, 1),
          badLuckRampSeconds: Math.max(1, Number(drop.badLuckRampSeconds || 160)),
          maxBadLuckBonusChance: clamp(Number(drop.maxBadLuckBonusChance || 0.35), 0, 1),
          firstDropDelaySeconds: Math.max(0, Number(drop.firstDropDelaySeconds || 24)),
          minSecondsBetweenDrops: Math.max(0, Number(drop.minSecondsBetweenDrops || 120)),
          maxActiveOnGround: Math.max(1, Math.floor(Number(drop.maxActiveOnGround || 1))),
          minSpawnDistanceFromPlayer: Math.max(24, Number(drop.minSpawnDistanceFromPlayer || 70)),
          maxSpawnDistanceFromPlayer: Math.max(24, Number(drop.maxSpawnDistanceFromPlayer || 220)),
          spawnEdgePadding: Math.max(0, Number(drop.spawnEdgePadding || 22))
        },
        effect: {
          healAmount: Math.max(1, Math.floor(Number(effect.healAmount || 15)))
        },
        visual: {
          radius: Math.max(5, Number(visual.radius || 8)),
          fillColor: visual.fillColor || "#7ee28e",
          ringColor: visual.ringColor || "#d4ffdc"
        }
      };
    }

    getGoldPickupMultiplier() {
      return clamp(Number((DATA.RUN && DATA.RUN.goldPickupMultiplier) || 1), 0, 2);
    }

    calculateScaledGoldPickup(baseValue) {
      const run = this.currentRun;
      if (!run) return 0;
      const multiplier = this.getGoldPickupMultiplier();
      const base = Math.max(0, Number(baseValue || 0));
      const carry = Math.max(0, Number((run.stats && run.stats.goldPickupCarry) || 0));
      const total = base * multiplier + carry;
      const whole = Math.max(0, Math.floor(total));
      run.stats.goldPickupCarry = Math.max(0, total - whole);
      return whole;
    }

    getObstacleConfig() {
      const config = DATA.OBSTACLES || {};
      const legacyMinRadius = Math.max(10, Number(config.minRadius || 22));
      const legacyMaxRadius = Math.max(legacyMinRadius, Number(config.maxRadius || 44));
      return {
        enabled: config.enabled !== false,
        minCount: Math.max(0, Math.floor(Number(config.minCount || 6))),
        maxCount: Math.max(0, Math.floor(Number(config.maxCount || 9))),
        minWidth: Math.max(14, Number(config.minWidth || legacyMinRadius * 1.15)),
        maxWidth: Math.max(14, Number(config.maxWidth || legacyMaxRadius * 0.95)),
        minHeight: Math.max(18, Number(config.minHeight || legacyMinRadius * 1.9)),
        maxHeight: Math.max(18, Number(config.maxHeight || legacyMaxRadius * 1.75)),
        verticalBias: clamp(Number(config.verticalBias || 0.58), 0, 1),
        minGap: Math.max(0, Number(config.minGap || 14)),
        edgePadding: Math.max(0, Number(config.edgePadding || 30)),
        minDistanceFromPlayerStart: Math.max(0, Number(config.minDistanceFromPlayerStart || 95)),
        spawnAreaWidthMultiplier: Math.max(1, Number(config.spawnAreaWidthMultiplier || 3.2)),
        spawnAreaHeightMultiplier: Math.max(1, Number(config.spawnAreaHeightMultiplier || 3.2)),
        playerCollisionPadding: Math.max(0, Number(config.playerCollisionPadding || 2)),
        enemyCollisionPadding: Math.max(0, Number(config.enemyCollisionPadding || 1)),
        fillColor: config.fillColor || "rgba(78, 88, 112, 0.85)",
        strokeColor: config.strokeColor || "rgba(188, 201, 229, 0.36)"
      };
    }

    getObstacleHalfExtents(obstacle) {
      if (!obstacle) return { halfW: 0, halfH: 0 };
      if (Number.isFinite(Number(obstacle.width)) && Number.isFinite(Number(obstacle.height))) {
        return {
          halfW: Math.max(1, Number(obstacle.width) * 0.5),
          halfH: Math.max(1, Number(obstacle.height) * 0.5)
        };
      }
      const radius = Math.max(1, Number(obstacle.radius || 0));
      return { halfW: radius, halfH: radius };
    }

    isRectOverlappingAnyObstacle(x, y, width, height, obstacles, gap) {
      const list = Array.isArray(obstacles) ? obstacles : [];
      const extraGap = Math.max(0, Number(gap || 0));
      const halfW = Math.max(1, Number(width || 0) * 0.5);
      const halfH = Math.max(1, Number(height || 0) * 0.5);

      for (let i = 0; i < list.length; i += 1) {
        const obstacle = list[i];
        if (!obstacle) continue;
        const obstacleSize = this.getObstacleHalfExtents(obstacle);
        const overlapX = Math.abs(x - obstacle.x) < halfW + obstacleSize.halfW + extraGap;
        const overlapY = Math.abs(y - obstacle.y) < halfH + obstacleSize.halfH + extraGap;
        if (overlapX && overlapY) return true;
      }
      return false;
    }

    isCircleOverlappingAnyObstacle(x, y, radius, obstacles, padding) {
      const list = Array.isArray(obstacles) ? obstacles : [];
      const circleRadius = Math.max(0, Number(radius || 0));
      const extraPadding = Math.max(0, Number(padding || 0));
      for (let i = 0; i < list.length; i += 1) {
        const obstacle = list[i];
        if (!obstacle) continue;
        const obstacleSize = this.getObstacleHalfExtents(obstacle);
        const left = obstacle.x - (obstacleSize.halfW + extraPadding);
        const right = obstacle.x + (obstacleSize.halfW + extraPadding);
        const top = obstacle.y - (obstacleSize.halfH + extraPadding);
        const bottom = obstacle.y + (obstacleSize.halfH + extraPadding);
        const closestX = clamp(x, left, right);
        const closestY = clamp(y, top, bottom);
        const dx = x - closestX;
        const dy = y - closestY;
        if (dx * dx + dy * dy < circleRadius * circleRadius) {
          return true;
        }
      }
      return false;
    }

    resolveCircleObstacleCollision(entity, obstacle, padding) {
      if (!entity || !obstacle) return false;
      const circleRadius = Math.max(0, Number(entity.radius || 0));
      if (circleRadius <= 0) return false;
      const pad = Math.max(0, Number(padding || 0));
      const obstacleSize = this.getObstacleHalfExtents(obstacle);
      const halfW = obstacleSize.halfW + pad;
      const halfH = obstacleSize.halfH + pad;

      const left = obstacle.x - halfW;
      const right = obstacle.x + halfW;
      const top = obstacle.y - halfH;
      const bottom = obstacle.y + halfH;

      const closestX = clamp(entity.x, left, right);
      const closestY = clamp(entity.y, top, bottom);
      let dx = entity.x - closestX;
      let dy = entity.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        if (dist >= circleRadius) return false;
        const overlap = circleRadius - dist;
        entity.x += (dx / dist) * overlap;
        entity.y += (dy / dist) * overlap;
        return true;
      }

      // Center is inside rect bounds: push out along the shallowest axis.
      const pushLeft = Math.abs(entity.x - left);
      const pushRight = Math.abs(right - entity.x);
      const pushTop = Math.abs(entity.y - top);
      const pushBottom = Math.abs(bottom - entity.y);
      const minPush = Math.min(pushLeft, pushRight, pushTop, pushBottom);

      if (minPush === pushLeft) {
        entity.x = left - circleRadius;
      } else if (minPush === pushRight) {
        entity.x = right + circleRadius;
      } else if (minPush === pushTop) {
        entity.y = top - circleRadius;
      } else {
        entity.y = bottom + circleRadius;
      }
      return true;
    }

    createRunObstacles(world, player) {
      const config = this.getObstacleConfig();
      if (!config.enabled) return [];
      const minCount = Math.min(config.minCount, config.maxCount);
      const maxCount = Math.max(config.minCount, config.maxCount);
      const targetCount = randInt(minCount, maxCount);
      if (targetCount <= 0) return [];

      const centerX = player && typeof player.x === "number" ? player.x : world.width * 0.5;
      const centerY = player && typeof player.y === "number" ? player.y : world.height * 0.5;
      const halfRangeX = (world.width * config.spawnAreaWidthMultiplier) * 0.5;
      const halfRangeY = (world.height * config.spawnAreaHeightMultiplier) * 0.5;
      const obstacles = [];

      for (let i = 0; i < targetCount; i += 1) {
        let placed = false;
        for (let attempt = 0; attempt < 70; attempt += 1) {
          let width = randRange(Math.min(config.minWidth, config.maxWidth), Math.max(config.minWidth, config.maxWidth));
          let height = randRange(Math.min(config.minHeight, config.maxHeight), Math.max(config.minHeight, config.maxHeight));
          if (Math.random() > config.verticalBias) {
            const swap = width;
            width = height;
            height = swap;
          }
          const halfW = width * 0.5;
          const halfH = height * 0.5;

          const minX = centerX - halfRangeX + config.edgePadding + halfW;
          const maxX = centerX + halfRangeX - config.edgePadding - halfW;
          const minY = centerY - halfRangeY + config.edgePadding + halfH;
          const maxY = centerY + halfRangeY - config.edgePadding - halfH;
          if (maxX <= minX || maxY <= minY) break;

          const x = randRange(minX, maxX);
          const y = randRange(minY, maxY);
          if (
            this.isCircleOverlappingAnyObstacle(
              centerX,
              centerY,
              config.minDistanceFromPlayerStart + (player ? player.radius : 0),
              [{ x, y, width, height }],
              0
            )
          ) {
            continue;
          }
          if (this.isRectOverlappingAnyObstacle(x, y, width, height, obstacles, config.minGap)) continue;

          obstacles.push({
            id: this.nextEntityId(),
            x,
            y,
            width,
            height,
            spriteIndex: this.obstacleSprites.length ? randInt(0, this.obstacleSprites.length - 1) : 0
          });
          placed = true;
          break;
        }
        if (!placed) continue;
      }

      return obstacles;
    }

    canApplyWorldShiftWithoutPlayerObstacleCollision(shiftX, shiftY) {
      const run = this.currentRun;
      if (!run || !run.player) return true;
      const obstacles = (run.entities && run.entities.obstacles) || [];
      if (!obstacles.length) return true;
      const player = run.player;
      const config = this.getObstacleConfig();
      const padding = config.playerCollisionPadding;
      for (let i = 0; i < obstacles.length; i += 1) {
        const obstacle = obstacles[i];
        if (!obstacle) continue;
        const shiftedObstacle = {
          ...obstacle,
          x: obstacle.x + shiftX,
          y: obstacle.y + shiftY
        };
        if (this.isCircleOverlappingAnyObstacle(player.x, player.y, player.radius, [shiftedObstacle], padding)) {
          return false;
        }
      }
      return true;
    }

    applyWorldShiftWithObstacleCollision(shiftX, shiftY) {
      const run = this.currentRun;
      if (!run) return { x: 0, y: 0 };
      const obstacles = (run.entities && run.entities.obstacles) || [];
      if (!obstacles.length) {
        this.applyWorldShift(shiftX, shiftY);
        return { x: shiftX, y: shiftY };
      }

      const distance = Math.hypot(shiftX, shiftY);
      const steps = Math.max(1, Math.ceil(distance / 6));
      const stepX = shiftX / steps;
      const stepY = shiftY / steps;
      let appliedX = 0;
      let appliedY = 0;

      for (let i = 0; i < steps; i += 1) {
        if (stepX !== 0 && this.canApplyWorldShiftWithoutPlayerObstacleCollision(stepX, 0)) {
          this.applyWorldShift(stepX, 0);
          appliedX += stepX;
        }
        if (stepY !== 0 && this.canApplyWorldShiftWithoutPlayerObstacleCollision(0, stepY)) {
          this.applyWorldShift(0, stepY);
          appliedY += stepY;
        }
      }

      return { x: appliedX, y: appliedY };
    }

    resolveEnemyObstacleCollisions(enemies) {
      const run = this.currentRun;
      if (!run) return;
      const obstacles = (run.entities && run.entities.obstacles) || [];
      if (!obstacles.length || !Array.isArray(enemies) || !enemies.length) return;
      const config = this.getObstacleConfig();
      const padding = config.enemyCollisionPadding;

      enemies.forEach((enemy) => {
        if (!enemy || enemy.dead) return;
        for (let pass = 0; pass < 2; pass += 1) {
          obstacles.forEach((obstacle) => {
            if (!obstacle) return;
            this.resolveCircleObstacleCollision(enemy, obstacle, padding);
          });
        }
      });
    }

    isPowerupUnlocked(character, powerupId) {
      if (!character || !powerupId) return false;
      const unlocked = character.unlockedPickups || {};
      return unlocked[powerupId] === true;
    }

    createInitialPowerupState(character) {
      const magnetConfig = this.getMagnetPowerupConfig();
      const furyConfig = this.getBattleFuryPowerupConfig();
      const healingOrbConfig = this.getHealingOrbPowerupConfig();
      return {
        magnet: {
          unlocked: this.isPowerupUnlocked(character, magnetConfig.id),
          checkTimer: magnetConfig.drop.checkIntervalSeconds,
          cooldownRemaining: magnetConfig.drop.firstDropDelaySeconds,
          lastDropAt: Number.NEGATIVE_INFINITY
        },
        battleFury: {
          unlocked: this.isPowerupUnlocked(character, furyConfig.id),
          activeTimer: 0,
          dropCooldownRemaining: furyConfig.drop.firstDropDelaySeconds
        },
        healingOrb: {
          unlocked: this.isPowerupUnlocked(character, healingOrbConfig.id),
          checkTimer: healingOrbConfig.drop.checkIntervalSeconds,
          cooldownRemaining: healingOrbConfig.drop.firstDropDelaySeconds,
          lastDropAt: Number.NEGATIVE_INFINITY
        }
      };
    }

    countActivePickupsByType(typeId) {
      const run = this.currentRun;
      if (!run || !run.entities || !Array.isArray(run.entities.pickups)) return 0;
      return run.entities.pickups.reduce((count, pickup) => {
        if (!pickup || pickup.type !== typeId) return count;
        return count + 1;
      }, 0);
    }

    findPowerupSpawnPositionAroundPlayer(config) {
      const run = this.currentRun;
      if (!run) return null;
      const player = run.player;
      const world = run.world;
      const minDistance = Math.max(24, Number(config.drop.minSpawnDistanceFromPlayer || 85));
      const maxDistance = Math.max(minDistance, Number(config.drop.maxSpawnDistanceFromPlayer || 260));
      const edgePadding = Math.max(0, Number(config.drop.spawnEdgePadding || 24));

      for (let attempt = 0; attempt < 14; attempt += 1) {
        const angle = randRange(0, Math.PI * 2);
        const distance = randRange(minDistance, maxDistance);
        let x = player.x + Math.cos(angle) * distance;
        let y = player.y + Math.sin(angle) * distance;
        x = clamp(x, edgePadding, Math.max(edgePadding, world.width - edgePadding));
        y = clamp(y, edgePadding, Math.max(edgePadding, world.height - edgePadding));
        const dx = x - player.x;
        const dy = y - player.y;
        const finalDistance = Math.hypot(dx, dy);
        if (finalDistance < minDistance * 0.9) continue;
        return { x, y };
      }

      return null;
    }

    triggerMagnetEffect() {
      const run = this.currentRun;
      if (!run) return;
      const magnetConfig = this.getMagnetPowerupConfig();
      const effect = magnetConfig.effect || {};
      const speed = Math.max(200, Number(effect.pullSpeed || 1400));
      const duration = Math.max(0.2, Number(effect.pullDurationSeconds || 1.5));

      run.entities.pickups.forEach((pickup) => {
        if (!pickup) return;
        if (pickup.type !== "xp" && pickup.type !== "gold") return;
        pickup.magnetizedTimer = duration;
        pickup.magnetizedSpeed = speed;
      });
    }

    healPlayer(amount) {
      const run = this.currentRun;
      if (!run || !run.player) return;
      const healAmount = Math.max(0, Number(amount || 0));
      if (healAmount <= 0) return;
      run.player.hp = Math.min(run.player.maxHp, run.player.hp + healAmount);
    }

    activateBattleFury() {
      const run = this.currentRun;
      if (!run || !run.powerups || !run.powerups.battleFury) return;
      const state = run.powerups.battleFury;
      const config = this.getBattleFuryPowerupConfig();
      state.activeTimer = Math.max(state.activeTimer || 0, config.effect.durationSeconds);
      this.recalculateWeaponStats(run);
    }

    updateBattleFury(dt) {
      const run = this.currentRun;
      if (!run || !run.powerups || !run.powerups.battleFury) return;
      const state = run.powerups.battleFury;
      if (state.dropCooldownRemaining > 0) {
        state.dropCooldownRemaining = Math.max(0, state.dropCooldownRemaining - dt);
      }
      if (state.activeTimer <= 0) return;
      state.activeTimer = Math.max(0, state.activeTimer - dt);
      if (state.activeTimer <= 0) {
        this.recalculateWeaponStats(run);
      }
    }

    trySpawnBattleFuryPickup(enemy) {
      const run = this.currentRun;
      if (!run || !run.powerups || !run.powerups.battleFury) return;
      const state = run.powerups.battleFury;
      if (!state.unlocked) return;

      const config = this.getBattleFuryPowerupConfig();
      const drop = config.drop || {};
      if (state.dropCooldownRemaining > 0) return;
      if (this.countActivePickupsByType(config.id) >= drop.maxActiveOnGround) return;
      if (Math.random() > drop.chanceOnEnemyKill) return;

      const offsetX = randRange(-10, 10);
      const offsetY = randRange(-10, 10);
      this.spawnPickup(enemy.x + offsetX, enemy.y + offsetY, config.id, 1);
      state.dropCooldownRemaining = drop.minSecondsBetweenDrops;
    }

    updateTimedPowerupDropState(state, config, dt) {
      const run = this.currentRun;
      if (!run || !state || !state.unlocked || !config) return;
      const drop = config.drop || {};

      if (state.cooldownRemaining > 0) {
        state.cooldownRemaining = Math.max(0, state.cooldownRemaining - dt);
      }
      if (!Number.isFinite(state.checkTimer)) {
        state.checkTimer = Math.max(1, Number(drop.checkIntervalSeconds || 10));
      }
      if (!Number.isFinite(state.lastDropAt)) {
        state.lastDropAt = Number.NEGATIVE_INFINITY;
      }

      state.checkTimer -= dt;
      while (state.checkTimer <= 0) {
        state.checkTimer += Math.max(1, Number(drop.checkIntervalSeconds || 10));

        if (state.cooldownRemaining > 0) continue;
        if (this.countActivePickupsByType(config.id) >= Math.max(1, Math.floor(Number(drop.maxActiveOnGround || 1)))) {
          continue;
        }

        const elapsedSinceLastDrop = Math.max(0, run.time - (Number.isFinite(state.lastDropAt) ? state.lastDropAt : 0));
        const badLuckFactor = clamp(elapsedSinceLastDrop / Math.max(1, Number(drop.badLuckRampSeconds || 240)), 0, 1);
        const chance = clamp(
          Number(drop.baseChancePerCheck || 0.02) + Number(drop.maxBadLuckBonusChance || 0.08) * badLuckFactor,
          0,
          1
        );
        if (Math.random() > chance) continue;

        const spawnPos = this.findPowerupSpawnPositionAroundPlayer(config);
        if (!spawnPos) continue;
        this.spawnPickup(spawnPos.x, spawnPos.y, config.id, 1);
        state.lastDropAt = run.time;
        state.cooldownRemaining = Math.max(0, Number(drop.minSecondsBetweenDrops || 120));
      }
    }

    updatePowerupDrops(dt) {
      const run = this.currentRun;
      if (!run || !run.powerups) return;
      this.updateTimedPowerupDropState(run.powerups.magnet, this.getMagnetPowerupConfig(), dt);
      this.updateTimedPowerupDropState(run.powerups.healingOrb, this.getHealingOrbPowerupConfig(), dt);
    }

    getSwarmSpawnRateMultiplier(run) {
      const swarmConfig = this.getSwarmConfig();
      const swarmState = run && run.spawn ? run.spawn.swarm : null;
      if (!swarmState || !swarmState.enabled) return 1;
      if (swarmState.activeTimer <= 0) return 1;
      const configured = Number(swarmConfig.normalSpawnRateMultiplierDuringSwarm);
      if (Number.isNaN(configured)) return 0.2;
      return clamp(configured, 0, 1);
    }

    chooseSwarmEventType() {
      const swarmConfig = this.getSwarmConfig();
      const choices = [];
      if (swarmConfig.rush && swarmConfig.rush.enabled !== false) {
        choices.push({ id: "rush", weight: Math.max(0.01, Number(swarmConfig.rush.weight || 1)) });
      }
      if (swarmConfig.encirclement && swarmConfig.encirclement.enabled !== false) {
        choices.push({ id: "encirclement", weight: Math.max(0.01, Number(swarmConfig.encirclement.weight || 1)) });
      }
      if (!choices.length) return null;
      const weights = {};
      choices.forEach((choice) => {
        weights[choice.id] = choice.weight;
      });
      return weightedChoice(weights);
    }

    buildSwarmEventPlan(run) {
      const swarmConfig = this.getSwarmConfig();
      const typeId = this.chooseSwarmEventType();
      if (!typeId) return null;

      const minute = run.time / 60;
      const duration = Math.max(2.5, Number(swarmConfig.eventDurationSeconds || 6));
      if (typeId === "rush") {
        const rushConfig = swarmConfig.rush || {};
        const directions = Array.isArray(rushConfig.directions) && rushConfig.directions.length
          ? rushConfig.directions
          : ["left_to_right", "right_to_left", "top_to_bottom", "bottom_to_top"];
        const direction = directions[randInt(0, directions.length - 1)];
        const countBase = Number(rushConfig.baseEnemyCount || 10);
        const countPerMinute = Number(rushConfig.enemyCountPerMinute || 1);
        const maxCount = Math.max(4, Math.floor(Number(rushConfig.maxEnemyCount || 24)));
        const targetCount = clamp(Math.floor(countBase + minute * countPerMinute), 4, maxCount);
        const speedBase = Number(rushConfig.speedMultiplier || 1.5);
        const speedPerMinute = Number(rushConfig.speedMultiplierPerMinute || 0.04);
        const maxSpeed = Math.max(1, Number(rushConfig.maxSpeedMultiplier || 2.1));
        const speedMultiplier = clamp(speedBase + minute * speedPerMinute, 1, maxSpeed);
        const laneWidth = Math.max(60, Number(rushConfig.laneWidth || 160));
        const spawnMargin = Math.max(40, Number(rushConfig.spawnMargin || 64));
        const lateralJitter = Math.max(0, Number(rushConfig.lateralJitter || 10));
        const laneCenter = direction === "left_to_right" || direction === "right_to_left"
          ? randRange(run.world.height * 0.2, run.world.height * 0.8)
          : randRange(run.world.width * 0.2, run.world.width * 0.8);

        return {
          id: `swarm_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
          type: "rush",
          warningText: "Swarm Incoming: Rush",
          activeText: "Swarm Active: Rush",
          duration,
          direction,
          targetCount,
          speedMultiplier,
          laneWidth,
          laneCenter,
          spawnMargin,
          lateralJitter,
          enemyWeights: rushConfig.enemyWeights || { runner: 0.6, grunt: 0.3, dasher: 0.1 },
          spawnRatePerSecond: Math.max(1, targetCount / duration),
          spawnedCount: 0,
          spawnAccumulator: 0
        };
      }

      const encirclementConfig = swarmConfig.encirclement || {};
      const countBase = Number(encirclementConfig.baseEnemyCount || 10);
      const countPerMinute = Number(encirclementConfig.enemyCountPerMinute || 1);
      const maxCount = Math.max(4, Math.floor(Number(encirclementConfig.maxEnemyCount || 22)));
      const targetCount = clamp(Math.floor(countBase + minute * countPerMinute), 4, maxCount);
      const ringRadiusBase = Number(encirclementConfig.ringRadius || 220);
      const ringGrowth = Number(encirclementConfig.ringRadiusGrowthPerMinute || 0);
      const spawnRadiusMultiplier = Math.max(1, Number(encirclementConfig.spawnRadiusMultiplier || 2));
      const minRingRadius = Math.max(120, Number(encirclementConfig.minRingRadius || 240));
      const ringRadius = Math.max(minRingRadius, (ringRadiusBase + minute * ringGrowth) * spawnRadiusMultiplier);
      const brokenChance = clamp(Number(encirclementConfig.brokenRingChance || 0.5), 0, 1);
      const brokenGap = clamp(Number(encirclementConfig.brokenRingGapRadians || 1), 0.4, Math.PI * 1.2);
      const isBrokenRing = Math.random() < brokenChance;
      const speedBase = Number(encirclementConfig.speedMultiplier || 1.08);
      const speedPerMinute = Number(encirclementConfig.speedMultiplierPerMinute || 0.03);
      const maxSpeed = Math.max(1, Number(encirclementConfig.maxSpeedMultiplier || 1.45));
      const speedMultiplier = clamp(speedBase + minute * speedPerMinute, 1, maxSpeed);
      return {
        id: `swarm_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        type: "encirclement",
        warningText: "Swarm Incoming: Encirclement",
        activeText: "Swarm Active: Encircled",
        duration,
        targetCount,
        ringRadius,
        minRingRadius,
        isBrokenRing,
        gapCenterAngle: randRange(0, Math.PI * 2),
        gapRadians: brokenGap,
        speedMultiplier,
        enemyWeights: encirclementConfig.enemyWeights || { grunt: 0.58, runner: 0.34, dasher: 0.08 }
      };
    }

    queueSwarmEventWarning(run) {
      const swarmState = run.spawn.swarm;
      const swarmConfig = this.getSwarmConfig();
      const event = this.buildSwarmEventPlan(run);
      if (!event) return;
      swarmState.pendingEvent = event;
      swarmState.warningTimer = Math.max(0.25, Number(swarmConfig.telegraphSeconds || 1));
      swarmState.currentEvent = null;
    }

    spawnRushSwarmEnemy(event) {
      const run = this.currentRun;
      if (!run || !event) return;
      const direction = String(event.direction || "left_to_right");
      const margin = Math.max(20, Number(event.spawnMargin || 64));
      const laneHalf = Math.max(16, Number(event.laneWidth || 160) * 0.5);
      const jitter = Math.max(0, Number(event.lateralJitter || 10));
      let x = 0;
      let y = 0;
      let vx = 0;
      let vy = 0;

      if (direction === "right_to_left") {
        x = run.world.width + margin;
        y = event.laneCenter + randRange(-laneHalf, laneHalf);
        vx = -1;
        vy = randRange(-0.07, 0.07);
      } else if (direction === "top_to_bottom") {
        x = event.laneCenter + randRange(-laneHalf, laneHalf);
        y = -margin;
        vx = randRange(-0.07, 0.07);
        vy = 1;
      } else if (direction === "bottom_to_top") {
        x = event.laneCenter + randRange(-laneHalf, laneHalf);
        y = run.world.height + margin;
        vx = randRange(-0.07, 0.07);
        vy = -1;
      } else {
        x = -margin;
        y = event.laneCenter + randRange(-laneHalf, laneHalf);
        vx = 1;
        vy = randRange(-0.07, 0.07);
      }

      x += randRange(-jitter, jitter);
      y += randRange(-jitter, jitter);
      const speed = 1;
      const normalized = normalizeVector(vx, vy);
      const enemyTypeId = weightedChoice(event.enemyWeights || { runner: 0.6, grunt: 0.3, dasher: 0.1 }) || "runner";
      this.spawnEnemy(enemyTypeId, run.time, {
        position: { x, y },
        velocity: { x: normalized.x * speed, y: normalized.y * speed },
        behaviorOverride: "swarm_rush",
        speedMultiplier: event.speedMultiplier,
        swarmTag: "rush"
      });
      event.spawnedCount += 1;
    }

    updateActiveSwarmRush(dt) {
      const run = this.currentRun;
      if (!run) return;
      const swarmState = run.spawn && run.spawn.swarm;
      if (!swarmState || !swarmState.currentEvent || swarmState.currentEvent.type !== "rush") return;
      const event = swarmState.currentEvent;
      event.spawnAccumulator += dt * Math.max(0.25, Number(event.spawnRatePerSecond || 1));
      while (event.spawnAccumulator >= 1 && event.spawnedCount < event.targetCount) {
        event.spawnAccumulator -= 1;
        this.spawnRushSwarmEnemy(event);
      }
    }

    spawnEncirclementSwarm(event) {
      const run = this.currentRun;
      if (!run || !event) return;
      const player = run.player;
      const count = Math.max(4, Math.floor(event.targetCount || 8));
      const step = (Math.PI * 2) / count;
      const baseAngle = randRange(0, Math.PI * 2);
      const gapHalf = Math.max(0, Number(event.gapRadians || 1) * 0.5);
      let spawned = 0;
      let attempts = 0;
      const maxAttempts = Math.max(count * 4, 24);

      while (spawned < count && attempts < maxAttempts) {
        const angle = baseAngle + step * attempts;
        attempts += 1;
        if (event.isBrokenRing) {
          const delta = Math.abs(angleBetween(angle, event.gapCenterAngle || 0));
          if (delta <= gapHalf) continue;
        }

        const minRingRadius = Math.max(120, Number(event.minRingRadius || 240));
        const radius = Math.max(minRingRadius, Number(event.ringRadius || 220));
        const x = player.x + Math.cos(angle) * radius;
        const y = player.y + Math.sin(angle) * radius;
        const enemyTypeId = weightedChoice(event.enemyWeights || { grunt: 0.58, runner: 0.34, dasher: 0.08 }) || "grunt";
        this.spawnEnemy(enemyTypeId, run.time, {
          position: { x, y },
          speedMultiplier: event.speedMultiplier,
          swarmTag: "encirclement"
        });
        spawned += 1;
      }
    }

    startSwarmEvent(run) {
      const swarmState = run.spawn.swarm;
      const event = swarmState.pendingEvent;
      if (!event) return;
      swarmState.pendingEvent = null;
      swarmState.warningTimer = 0;
      swarmState.currentEvent = event;
      swarmState.activeTimer = Math.max(0.5, Number(event.duration || 5.5));
      if (event.type === "encirclement") {
        this.spawnEncirclementSwarm(event);
      }
    }

    endSwarmEvent(run) {
      const swarmState = run.spawn.swarm;
      const swarmConfig = this.getSwarmConfig();
      swarmState.currentEvent = null;
      swarmState.activeTimer = 0;
      swarmState.warningTimer = 0;
      swarmState.pendingEvent = null;
      swarmState.nextEventAt = run.time + this.rollSwarmTimeWindow(swarmConfig.intervalSeconds, 55, 80);
    }

    updateSwarmEvents(dt) {
      const run = this.currentRun;
      if (!run || !run.spawn || !run.spawn.swarm) return;
      const swarmState = run.spawn.swarm;
      if (!swarmState.enabled) return;

      if (swarmState.activeTimer > 0) {
        swarmState.activeTimer = Math.max(0, swarmState.activeTimer - dt);
        if (swarmState.currentEvent && swarmState.currentEvent.type === "rush") {
          this.updateActiveSwarmRush(dt);
        }
        if (swarmState.activeTimer <= 0) {
          this.endSwarmEvent(run);
        }
        return;
      }

      if (swarmState.warningTimer > 0) {
        swarmState.warningTimer = Math.max(0, swarmState.warningTimer - dt);
        if (swarmState.warningTimer <= 0) {
          this.startSwarmEvent(run);
        }
        return;
      }

      if (run.time >= swarmState.nextEventAt) {
        this.queueSwarmEventWarning(run);
      }
    }

    getLootConfig() {
      return DATA.LOOT_SYSTEM || {};
    }

    getRunLootLevel(run) {
      if (!run) return 1;
      const parsed = Number(run.progressionLevel || 1);
      if (Number.isNaN(parsed)) return 1;
      return Math.max(1, Math.floor(parsed));
    }

    getRarityRank(rarityId) {
      const rarities = DATA.ITEM_RARITIES || {};
      const rarity = rarities[rarityId];
      if (!rarity) return 0;
      return Math.max(0, Number(rarity.rank || 0));
    }

    getMaxRarityForSource(sourceConfig, level) {
      const maxByLevel = sourceConfig && sourceConfig.maxRarityByLevel ? sourceConfig.maxRarityByLevel : {};
      return maxByLevel[level] || maxByLevel[1] || "purple";
    }

    getRarityWeightsForSource(sourceConfig, level) {
      const byLevel = sourceConfig && sourceConfig.rarityWeightsByLevel ? sourceConfig.rarityWeightsByLevel : {};
      return byLevel[level] || byLevel[1] || { grey: 1 };
    }

    chooseWeightedRarityFromMap(rarityWeights) {
      const normalized = {};
      Object.entries(rarityWeights || {}).forEach(([rarityId, rawWeight]) => {
        const weight = Number(rawWeight);
        if (Number.isNaN(weight) || weight <= 0) return;
        normalized[rarityId] = weight;
      });
      const rarityId = weightedChoice(normalized);
      if (!rarityId) return null;
      return rarityId;
    }

    getAllowedItemTypesForDrop(run, sourceConfig, level) {
      const lootConfig = this.getLootConfig();
      const levelRules = lootConfig.levelRules || {};
      const levelRule = levelRules[level] || levelRules[1] || {};
      const fromSource = Array.isArray(sourceConfig && sourceConfig.allowedItemTypes) ? sourceConfig.allowedItemTypes : [];
      const fromLevel = Array.isArray(levelRule.allowedItemTypes) ? levelRule.allowedItemTypes : [];
      if (fromSource.length && fromLevel.length) {
        return fromSource.filter((itemType) => fromLevel.includes(itemType));
      }
      if (fromSource.length) return fromSource.slice();
      return fromLevel.length ? fromLevel.slice() : ["melee_weapon", "ranged_weapon", "chest"];
    }

    getEligibleLootDefinitions(run, sourceConfig, desiredRarity) {
      const level = this.getRunLootLevel(run);
      const classId = run.classId || "barbarian";
      const itemDefs = Object.values(DATA.ITEM_DEFINITIONS || {});
      const allowedTypes = this.getAllowedItemTypesForDrop(run, sourceConfig, level);
      const maxRarity = this.getMaxRarityForSource(sourceConfig, level);
      const maxRarityRank = this.getRarityRank(maxRarity);
      const desiredRank = this.getRarityRank(desiredRarity);

      return itemDefs.filter((definition) => {
        if (!definition || typeof definition !== "object") return false;
        if (allowedTypes.length && !allowedTypes.includes(definition.itemType)) return false;
        const classIds = Array.isArray(definition.classIds) ? definition.classIds : [];
        if (classIds.length && !classIds.includes(classId)) return false;

        const definitionRarityRank = this.getRarityRank(definition.rarity);
        if (definitionRarityRank <= 0 || definitionRarityRank > maxRarityRank) return false;
        if (desiredRank > 0 && definitionRarityRank !== desiredRank) return false;

        const dropLevelMin = Number.isNaN(Number(definition.dropLevelMin))
          ? 1
          : Math.max(1, Math.floor(definition.dropLevelMin));
        const dropLevelMax = Number.isNaN(Number(definition.dropLevelMax))
          ? 999
          : Math.max(dropLevelMin, Math.floor(definition.dropLevelMax));
        if (level < dropLevelMin || level > dropLevelMax) return false;

        const itemLevel = Number.isNaN(Number(definition.itemLevel)) ? 1 : Math.max(1, Math.floor(definition.itemLevel));
        return itemLevel <= Math.max(1, level);
      });
    }

    getAllowedSlotsFromDefinition(definition) {
      if (!definition || typeof definition !== "object") return [];
      const raw = Array.isArray(definition.allowedSlots)
        ? definition.allowedSlots
        : typeof definition.allowedSlot === "string"
        ? [definition.allowedSlot]
        : [];
      const unique = [];
      raw.forEach((slot) => {
        if (!slot || unique.includes(slot)) return;
        unique.push(slot);
      });
      if (unique.length) return unique;
      if (definition.itemType === "melee_weapon") return ["primaryMeleeWeapon", "secondaryMeleeWeapon"];
      if (definition.itemType === "ranged_weapon") return ["rangedWeapon"];
      if (definition.itemType === "helmet") return ["helmet"];
      if (definition.itemType === "chest") return ["chest"];
      if (definition.itemType === "leggings") return ["leggings"];
      if (definition.itemType === "boots") return ["boots"];
      if (definition.itemType === "ring") return ["ring1", "ring2"];
      if (definition.itemType === "amulet") return ["amulet"];
      return [];
    }

    createLootItemFromDefinition(definition, characterId) {
      const allowedSlots = this.getAllowedSlotsFromDefinition(definition);
      const parsedWeight = Number(definition.weaponSlotWeight);
      const isWeapon = definition.itemType === "melee_weapon" || definition.itemType === "ranged_weapon";
      const weaponSlotWeight = isWeapon
        ? Number.isNaN(parsedWeight)
          ? 1
          : Math.max(1, Math.min(2, Math.floor(parsedWeight)))
        : null;
      const stats = definition.stats && typeof definition.stats === "object" ? { ...definition.stats } : {};
      return {
        instanceId: `loot_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        templateId: definition.id,
        name: definition.name || "Item",
        rarity: definition.rarity,
        itemType: definition.itemType,
        itemCategory: definition.itemCategory || null,
        weaponCategory: definition.weaponCategory || null,
        physicalDamageType: definition.physicalDamageType || null,
        allowedSlots,
        allowedSlot: allowedSlots[0] || null,
        weaponSlotWeight,
        itemLevel: definition.itemLevel || 1,
        stats,
        ownerCharacterId: characterId || null
      };
    }

    rollLootDropCount(sourceConfig) {
      const minimum = Math.max(0, Math.floor(Number(sourceConfig && sourceConfig.minDrops) || 0));
      const extraChances = Array.isArray(sourceConfig && sourceConfig.extraDropChances)
        ? sourceConfig.extraDropChances
        : [];
      let count = minimum;
      for (let i = 0; i < extraChances.length; i += 1) {
        const chance = clamp(Number(extraChances[i] || 0), 0, 1);
        if (Math.random() <= chance) {
          count += 1;
        }
      }
      return count;
    }

    generateLootItemsForSource(sourceId, enemy) {
      const run = this.currentRun;
      const lootConfig = this.getLootConfig();
      if (!lootConfig || lootConfig.enabled === false) return [];
      const sourceConfig = lootConfig.sources && lootConfig.sources[sourceId];
      if (!sourceConfig || sourceConfig.enabled === false) return [];

      const level = this.getRunLootLevel(run);
      const dropCount = this.rollLootDropCount(sourceConfig);
      if (dropCount <= 0) return [];

      const items = [];
      const rarityWeights = this.getRarityWeightsForSource(sourceConfig, level);
      const maxRarityRank = this.getRarityRank(this.getMaxRarityForSource(sourceConfig, level));

      for (let i = 0; i < dropCount; i += 1) {
        let rarity = this.chooseWeightedRarityFromMap(rarityWeights);
        if (!rarity || this.getRarityRank(rarity) > maxRarityRank) {
          rarity = "grey";
        }

        let candidates = this.getEligibleLootDefinitions(run, sourceConfig, rarity);
        if (!candidates.length) {
          candidates = this.getEligibleLootDefinitions(run, sourceConfig, null);
        }
        if (!candidates.length) continue;
        const definition = candidates[randInt(0, candidates.length - 1)];
        const item = this.createLootItemFromDefinition(definition, run.characterId);
        items.push(item);
      }

      return items;
    }

    spawnBossLootDrops(sourceId, enemy) {
      const run = this.currentRun;
      if (!run || !enemy) return;
      const items = this.generateLootItemsForSource(sourceId, enemy);
      if (!items.length) return;

      items.forEach((item, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(1, items.length);
        const spread = 12 + index * 3;
        const x = enemy.x + Math.cos(angle) * spread + randRange(-5, 5);
        const y = enemy.y + Math.sin(angle) * spread + randRange(-5, 5);
        this.spawnPickup(x, y, "item", 1, { item, rarity: item.rarity });
      });
    }

    spawnFinalBossRewardChest(enemy) {
      const run = this.currentRun;
      if (!run || !enemy) return;
      const lootItems = this.generateLootItemsForSource("finalBoss", enemy);
      this.spawnPickup(enemy.x, enemy.y, "boss_chest", 1, { lootItems });
    }

    openBossChest(pickup) {
      const run = this.currentRun;
      if (!run || !pickup || pickup.opened) return;
      pickup.opened = true;
      pickup.openTimer = 0.95;
      const lootItems = Array.isArray(pickup.lootItems) ? pickup.lootItems.filter(Boolean) : [];
      const rewardBuffer = run.postRunRewards && Array.isArray(run.postRunRewards.items) ? run.postRunRewards.items : null;
      if (rewardBuffer) {
        lootItems.forEach((item) => rewardBuffer.push(item));
      }
      pickup.lootItems = [];
      run.stats.bossChestOpened = true;
      run.stats.bossChestItemsFound += lootItems.length;
    }

    startVictoryCollectionWindow() {
      const run = this.currentRun;
      if (!run) return;
      run.victoryCountdownRemaining = 4.5;
      run.entities.enemies = [];
      run.entities.enemyProjectiles = [];
      if (run.spawn && run.spawn.swarm) {
        run.spawn.swarm.activeTimer = 0;
        run.spawn.swarm.warningTimer = 0;
      }
    }

    createRunState(character, selectedLevel) {
      const axeData = DATA.WEAPONS.axe;
      const javelinData = DATA.WEAPONS.javelin;
      const playerBase = DATA.PLAYER_BASE;
      const width = Math.max(1, this.canvas.clientWidth);
      const height = Math.max(1, this.canvas.clientHeight);
      const level = this.resolveSelectedLevelForCharacter(character, selectedLevel && selectedLevel.id);

      const runState = {
        characterId: character.id,
        characterName: character.name,
        level,
        bestiaryDiscoveries: this.getCharacterBestiaryDiscoverySet(character),
        classId: character.classId,
        progressionLevel: Math.max(1, Math.floor(Number(character.progressionLevel || 1))),
        attributes: {
          strength: Number((character.attributeLevels && character.attributeLevels.strength) || 0),
          ferocity: Number((character.attributeLevels && character.attributeLevels.ferocity) || 0),
          endurance: Number((character.attributeLevels && character.attributeLevels.endurance) || 0),
          instinct: Number((character.attributeLevels && character.attributeLevels.instinct) || 0)
        },
        attributeEffects: null,
        world: { width, height },
        worldOffset: { x: 0, y: 0 },
        time: 0,
        postRunRewards: {
          items: []
        },
        victoryCountdownRemaining: 0,
        ended: false,
        pauseReason: null,
        reasonEnded: null,
        player: {
          x: width * 0.5,
          y: height * 0.5,
          radius: playerBase.radius,
          baseMoveSpeed: playerBase.moveSpeed,
          moveSpeed: playerBase.moveSpeed,
          baseMaxHp: playerBase.maxHp,
          maxHp: playerBase.maxHp,
          hp: playerBase.maxHp,
          invulnTimer: 0,
          defenseStackCount: 0,
          defenseStackTimer: 0,
          speedBoostTimer: 0,
          basePickupRadius: playerBase.pickupRadius,
          pickupRadius: playerBase.pickupRadius,
          facing: 0,
          rage: {
            value: 0,
            max: 100,
            active: false,
            timeLeft: 0,
            baseDuration: 6,
            gainOnHit: 5,
            gainOnKill: 20
          },
          axe: {
            baseDamage: axeData.baseDamage,
            baseCooldown: axeData.cooldown,
            baseRange: axeData.range,
            baseArcRadians: axeData.arcRadians,
            damage: axeData.baseDamage,
            cooldown: axeData.cooldown,
            cooldownLeft: 0.2,
            range: axeData.range,
            arcRadians: axeData.arcRadians,
            extraSwings: 0,
            whirlwindActive: false,
            swingDuration: axeData.swingDuration
          },
          javelin: {
            baseDamage: javelinData.baseDamage,
            baseCooldown: javelinData.cooldown,
            baseSpeed: javelinData.speed,
            baseRange: javelinData.range,
            baseCount: javelinData.count,
            basePierce: javelinData.pierce,
            baseExplosiveRadius: Math.max(12, Number(javelinData.explosiveRadius || 54)),
            baseExplosiveDamageMultiplier: clamp(Number(javelinData.explosiveDamageMultiplier || 0.45), 0, 3),
            damage: javelinData.baseDamage,
            cooldown: javelinData.cooldown,
            cooldownLeft: 0.5,
            speed: javelinData.speed,
            range: javelinData.range,
            radius: javelinData.radius,
            lifetime: javelinData.lifetime,
            count: javelinData.count,
            pierce: javelinData.pierce,
            piercingVolleyActive: false,
            explosiveVolleyActive: false,
            explosiveRadius: 0,
            explosiveDamageMultiplier: 0
          }
        },
        progression: {
          level: 1,
          xp: 0,
          xpToNext: levelXpRequirement(1),
          pendingLevelUps: 0,
          upgradeRanks: {},
          currentUpgradeChoices: [],
          totalUpgradesTaken: 0,
          totalUpgradeCapacity: DATA.TOTAL_UPGRADE_CAPACITY,
          levelCapReached: false
        },
        spawn: {
          accumulator: 0,
          nextMinibossTime: DATA.RUN.minibossIntervalSeconds,
          finalBossSpawned: false,
          swarm: this.createInitialSwarmState()
        },
        powerups: this.createInitialPowerupState(character),
        entities: {
          enemies: [],
          playerProjectiles: [],
          enemyProjectiles: [],
          pickups: [],
          obstacles: [],
          attackEffects: []
        },
        stats: {
          enemiesKilled: 0,
          enemyKillsByType: {},
          goldEarned: 0,
          goldPickupCarry: 0,
          newBestiaryEntries: 0,
          legacyXpEarned: 0,
          minibossesDefeated: 0,
          bossChestOpened: false,
          bossChestItemsFound: 0,
          finalBossAppeared: false,
          finalBossDefeated: false
        }
      };
      runState.entities.obstacles = this.createRunObstacles(runState.world, runState.player);
      runState.attributeEffects = this.calculateAttributeEffects(runState.attributes);
      this.applyAttributeBaseStats(runState);
      this.recalculateWeaponStats(runState);
      return runState;
    }

    startRunFromSelection() {
      const character = this.getSelectedCharacter();
      if (!character) {
        this.ui.setHomeStatus("Select a character first.");
        return;
      }
      const selectedLevel = this.resolveSelectedLevelForCharacter(character);
      this.currentRun = this.createRunState(character, selectedLevel);
      this.ui.showGameScreen();
      this.ui.hidePause();
      this.ui.hideLevelUp();
      this.ui.hideEndRun();
      this.handleResize();
      this.centerPlayerInWorld();
    }

    restartRun() {
      if (!this.currentRun) return;
      const character = SAVE.getCharacter(this.currentRun.characterId);
      if (!character) return;
      const selectedLevel = this.resolveSelectedLevelForCharacter(character, this.currentRun.level && this.currentRun.level.id);
      this.currentRun = this.createRunState(character, selectedLevel);
      this.ui.showGameScreen();
      this.ui.hidePause();
      this.ui.hideLevelUp();
      this.ui.hideEndRun();
      this.handleResize();
      this.centerPlayerInWorld();
    }

    centerPlayerInWorld() {
      const run = this.currentRun;
      if (!run) return;
      run.player.x = run.world.width * 0.5;
      run.player.y = run.world.height * 0.5;
    }

    returnHome() {
      this.currentRun = null;
      this.refreshCharacters(false);
      this.ui.hidePause();
      this.ui.hideLevelUp();
      this.ui.hideEndRun();
    }

    pauseRun() {
      if (!this.currentRun || this.currentRun.pauseReason || this.currentRun.ended) return;
      this.currentRun.pauseReason = "paused";
      this.ui.showPause();
    }

    resumeRun() {
      if (!this.currentRun || this.currentRun.pauseReason !== "paused") return;
      this.currentRun.pauseReason = null;
      this.ui.hidePause();
    }

    loop(now) {
      const delta = Math.min(0.05, (now - this.previousTime) / 1000);
      this.previousTime = now;

      if (this.currentRun) {
        if (!this.currentRun.pauseReason && !this.currentRun.ended) {
          this.updateRun(delta);
        }
        this.renderRun();
        this.pushHud();
      }

      requestAnimationFrame(this.boundLoop);
    }

    updateRun(dt) {
      const run = this.currentRun;
      run.time += dt;

      if (run.victoryCountdownRemaining > 0) {
        run.victoryCountdownRemaining = Math.max(0, run.victoryCountdownRemaining - dt);
        this.updatePlayerFacing();
        this.updatePlayerMovement(dt);
        this.updatePlayerInvulnerability(dt);
        this.updatePickups(dt);
        this.updateAttackEffects(dt);
        if (run.victoryCountdownRemaining <= 0) {
          this.finishRun("victory");
        }
        return;
      }

      this.updatePlayerFacing();
      this.updatePlayerMovement(dt);
      this.updatePlayerInvulnerability(dt);
      this.updateRage(dt);
      this.updateBattleFury(dt);
      this.updateAxe(dt);
      this.updateJavelin(dt);
      this.updateSwarmEvents(dt);
      this.updateSpawns(dt);
      this.updatePowerupDrops(dt);
      this.updateEnemies(dt);
      this.updatePlayerProjectiles(dt);
      this.updateEnemyProjectiles(dt);
      this.updatePickups(dt);
      this.updateAttackEffects(dt);
      this.checkBossTimers();

      if (run.player.hp <= 0) {
        this.finishRun("death");
      }
    }

    updatePlayerFacing() {
      const run = this.currentRun;
      const player = run.player;
      const dx = this.input.mouseX - player.x;
      const dy = this.input.mouseY - player.y;
      player.facing = Math.atan2(dy, dx);
    }

    updatePlayerMovement(dt) {
      const run = this.currentRun;
      const player = run.player;
      const keys = this.input.keys;
      const effects = run.attributeEffects || this.calculateAttributeEffects(run.attributes);
      const speedBoostMultiplier = player.speedBoostTimer > 0 ? effects.damageTakenSpeedBoostPct : 0;
      const rageMoveBonus = player.rage && player.rage.active && effects.rageAttackModifierUnlocked ? 0.06 : 0;
      player.moveSpeed = player.baseMoveSpeed * (1 + effects.moveSpeedBonusPct + speedBoostMultiplier + rageMoveBonus);
      const axisX = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
      const axisY = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);

      let moveX = axisX;
      let moveY = axisY;
      if (moveX !== 0 || moveY !== 0) {
        const normalized = normalizeVector(moveX, moveY);
        moveX = normalized.x;
        moveY = normalized.y;
      }

      const travelX = moveX * player.moveSpeed * dt;
      const travelY = moveY * player.moveSpeed * dt;
      if (travelX !== 0 || travelY !== 0) {
        // Player stays camera-centered while the world scrolls in the opposite direction.
        const appliedShift = this.applyWorldShiftWithObstacleCollision(-travelX, -travelY);
        run.worldOffset.x += -appliedShift.x;
        run.worldOffset.y += -appliedShift.y;
      }

      this.centerPlayerInWorld();
    }

    applyWorldShift(shiftX, shiftY) {
      const run = this.currentRun;
      if (!run) return;

      run.entities.enemies.forEach((enemy) => {
        enemy.x += shiftX;
        enemy.y += shiftY;
      });
      run.entities.playerProjectiles.forEach((projectile) => {
        projectile.x += shiftX;
        projectile.y += shiftY;
      });
      run.entities.enemyProjectiles.forEach((projectile) => {
        projectile.x += shiftX;
        projectile.y += shiftY;
      });
      run.entities.pickups.forEach((pickup) => {
        pickup.x += shiftX;
        pickup.y += shiftY;
      });
      run.entities.obstacles.forEach((obstacle) => {
        obstacle.x += shiftX;
        obstacle.y += shiftY;
      });
    }

    updatePlayerInvulnerability(dt) {
      const player = this.currentRun.player;
      if (player.invulnTimer > 0) {
        player.invulnTimer = Math.max(0, player.invulnTimer - dt);
      }
      if (player.speedBoostTimer > 0) {
        player.speedBoostTimer = Math.max(0, player.speedBoostTimer - dt);
      }
      if (player.defenseStackTimer > 0) {
        player.defenseStackTimer = Math.max(0, player.defenseStackTimer - dt);
        if (player.defenseStackTimer <= 0) {
          player.defenseStackCount = 0;
        }
      }
    }

    updateAxe(dt) {
      const run = this.currentRun;
      const axe = run.player.axe;
      axe.cooldownLeft -= dt;
      if (axe.cooldownLeft <= 0) {
        this.performAxeSwing();
        axe.cooldownLeft += axe.cooldown;
      }
    }

    performAxeSwing() {
      const run = this.currentRun;
      const player = run.player;
      const axe = player.axe;
      const swingCount = Math.max(1, 1 + Math.floor(axe.extraSwings));
      const didSpin = Boolean(axe.whirlwindActive);

      for (let swingIndex = 0; swingIndex < swingCount; swingIndex += 1) {
        const spread = (swingIndex - (swingCount - 1) / 2) * 0.24;
        const centerAngle = player.facing + spread;
        const arc = didSpin ? Math.PI * 2 : axe.arcRadians;
        this.applyAxeDamage(centerAngle, arc, axe.damage, didSpin);
        this.currentRun.entities.attackEffects.push({
          x: player.x,
          y: player.y,
          radius: axe.range + player.radius,
          centerAngle,
          arc,
          remaining: axe.swingDuration,
          duration: axe.swingDuration,
          didSpin
        });
      }
    }

    applyAxeDamage(centerAngle, arc, damage, didSpin) {
      const run = this.currentRun;
      const player = run.player;
      const maxRange = player.radius + player.axe.range;
      const maxRangeSq = maxRange * maxRange;

      run.entities.enemies.forEach((enemy) => {
        if (enemy.dead) return;
        const distSq = distanceSquared(player, enemy);
        if (distSq > maxRangeSq) return;
        if (!didSpin) {
          const enemyAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          if (Math.abs(angleBetween(enemyAngle, centerAngle)) > arc * 0.5) return;
        }
        this.damageEnemy(enemy, damage);
        const push = normalizeVector(enemy.x - player.x, enemy.y - player.y);
        enemy.x += push.x * 8;
        enemy.y += push.y * 8;
      });
    }

    updateJavelin(dt) {
      const run = this.currentRun;
      const javelin = run.player.javelin;
      javelin.cooldownLeft -= dt;
      if (javelin.cooldownLeft <= 0) {
        this.fireJavelins();
        javelin.cooldownLeft += javelin.cooldown;
      }
    }

    fireJavelins() {
      const run = this.currentRun;
      const player = run.player;
      const javelin = player.javelin;
      const enemies = run.entities.enemies.filter((enemy) => !enemy.dead);
      if (!enemies.length) return;

      enemies.sort((a, b) => distanceSquared(a, player) - distanceSquared(b, player));
      const inRange = enemies.filter((enemy) => Math.sqrt(distanceSquared(enemy, player)) <= javelin.range);
      const targetPool = inRange.length ? inRange : enemies;
      const shots = Math.max(1, Math.floor(javelin.count));

      for (let i = 0; i < shots; i += 1) {
        const target = targetPool[Math.min(i, targetPool.length - 1)];
        if (!target) break;
        const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
        const spread = (i - (shots - 1) / 2) * 0.09;
        const angle = baseAngle + spread;
        run.entities.playerProjectiles.push({
          id: this.nextEntityId(),
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * javelin.speed,
          vy: Math.sin(angle) * javelin.speed,
          radius: javelin.radius,
          damage: javelin.damage,
          life: javelin.lifetime,
          remainingHits: 1 + Math.max(0, Math.floor(javelin.pierce)),
          hitMap: {},
          explosiveVolleyActive: Boolean(javelin.explosiveVolleyActive),
          explosiveRadius: Math.max(0, Number(javelin.explosiveRadius || 0)),
          explosiveDamageMultiplier: Math.max(0, Number(javelin.explosiveDamageMultiplier || 0))
        });
      }
    }

    applyJavelinSplashDamage(centerX, centerY, radius, damage, primaryEnemyId) {
      const run = this.currentRun;
      if (!run || !Array.isArray(run.entities.enemies)) return;
      const splashRadius = Math.max(0, Number(radius || 0));
      const splashDamage = Math.max(0, Number(damage || 0));
      if (splashRadius <= 0 || splashDamage <= 0) return;
      const splashSq = splashRadius * splashRadius;

      run.entities.enemies.forEach((enemy) => {
        if (!enemy || enemy.dead) return;
        if (enemy.id === primaryEnemyId) return;
        const dx = enemy.x - centerX;
        const dy = enemy.y - centerY;
        if (dx * dx + dy * dy > splashSq) return;
        this.damageEnemy(enemy, splashDamage);
      });
    }

    updateSpawns(dt) {
      const run = this.currentRun;
      const phase = getSpawnTableForTime(run.time);
      const minute = run.time / 60;
      const swarmSpawnRateMultiplier = this.getSwarmSpawnRateMultiplier(run);
      if (swarmSpawnRateMultiplier <= 0) {
        run.spawn.accumulator = Math.min(run.spawn.accumulator, 0.25);
        return;
      }

      const spawnRate =
        DATA.RUN.baseSpawnRatePerSecond * phase.spawnRateMultiplier * (1 + minute * 0.04) * swarmSpawnRateMultiplier;
      const spawnInterval = 1 / Math.max(0.01, spawnRate);
      run.spawn.accumulator += dt;

      while (run.spawn.accumulator >= spawnInterval) {
        run.spawn.accumulator -= spawnInterval;
        let packCount = randInt(phase.packMin, phase.packMax);
        if (Math.random() < phase.burstChance) {
          packCount += randInt(1, 3);
        }
        for (let i = 0; i < packCount; i += 1) {
          const enemyId = weightedChoice(phase.weights);
          if (!enemyId) continue;
          this.spawnEnemy(enemyId, run.time);
        }
      }
    }

    checkBossTimers() {
      const run = this.currentRun;
      if (!run) return;

      while (
        run.time >= run.spawn.nextMinibossTime &&
        run.spawn.nextMinibossTime < DATA.RUN.finalBossTimeSeconds
      ) {
        this.spawnEnemy("miniboss", run.time, { forceInside: false });
        run.spawn.nextMinibossTime += DATA.RUN.minibossIntervalSeconds;
      }

      if (!run.spawn.finalBossSpawned && run.time >= DATA.RUN.finalBossTimeSeconds) {
        run.spawn.finalBossSpawned = true;
        run.stats.finalBossAppeared = true;
        this.spawnEnemy("finalBoss", run.time, { forceInside: false });
      }
    }

    spawnEnemy(enemyTypeId, timeSeconds, options) {
      const definition = DATA.ENEMIES[enemyTypeId];
      if (!definition) return;
      const run = this.currentRun;
      const world = run.world;
      const minute = timeSeconds / 60;
      const healthScale = 1 + minute * DATA.RUN.healthScalingPerMinute;
      const damageScale = 1 + minute * DATA.RUN.damageScalingPerMinute;
      const xpScale = 1 + minute * Number((DATA.RUN && DATA.RUN.xpScalingPerMinute) || 0);

      const margin = 48;
      const side = randInt(0, 3);
      let x = 0;
      let y = 0;
      if (side === 0) {
        x = randRange(-margin, world.width + margin);
        y = -margin;
      } else if (side === 1) {
        x = world.width + margin;
        y = randRange(-margin, world.height + margin);
      } else if (side === 2) {
        x = randRange(-margin, world.width + margin);
        y = world.height + margin;
      } else {
        x = -margin;
        y = randRange(-margin, world.height + margin);
      }

      if (options && options.forceInside) {
        x = randRange(definition.radius + 20, world.width - definition.radius - 20);
        y = randRange(definition.radius + 20, world.height - definition.radius - 20);
      }

      if (options && options.position) {
        const parsedX = Number(options.position.x);
        const parsedY = Number(options.position.y);
        if (!Number.isNaN(parsedX)) x = parsedX;
        if (!Number.isNaN(parsedY)) y = parsedY;
      }

      const obstacles = (run.entities && run.entities.obstacles) || [];
      if (obstacles.length) {
        const obstacleConfig = this.getObstacleConfig();
        const obstaclePadding = obstacleConfig.enemyCollisionPadding;
        if (this.isCircleOverlappingAnyObstacle(x, y, definition.radius, obstacles, obstaclePadding)) {
          for (let attempt = 0; attempt < 14; attempt += 1) {
            const candidateX =
              options && options.forceInside
                ? randRange(definition.radius + 20, world.width - definition.radius - 20)
                : randRange(-margin, world.width + margin);
            const candidateY =
              options && options.forceInside
                ? randRange(definition.radius + 20, world.height - definition.radius - 20)
                : randRange(-margin, world.height + margin);
            if (!this.isCircleOverlappingAnyObstacle(candidateX, candidateY, definition.radius, obstacles, obstaclePadding)) {
              x = candidateX;
              y = candidateY;
              break;
            }
          }
        }
      }

      const behavior = options && options.behaviorOverride ? options.behaviorOverride : definition.behavior;
      const speedMultiplier = options && !Number.isNaN(Number(options.speedMultiplier))
        ? Math.max(0.2, Number(options.speedMultiplier))
        : 1;
      const healthMultiplier = options && !Number.isNaN(Number(options.healthMultiplier))
        ? Math.max(0.25, Number(options.healthMultiplier))
        : 1;
      const damageMultiplier = options && !Number.isNaN(Number(options.damageMultiplier))
        ? Math.max(0.25, Number(options.damageMultiplier))
        : 1;

      const velocityX = options && options.velocity && !Number.isNaN(Number(options.velocity.x))
        ? Number(options.velocity.x)
        : 0;
      const velocityY = options && options.velocity && !Number.isNaN(Number(options.velocity.y))
        ? Number(options.velocity.y)
        : 0;
      const hasVelocity = Math.abs(velocityX) > 0.0001 || Math.abs(velocityY) > 0.0001;

      const enemy = {
        id: this.nextEntityId(),
        typeId: definition.id,
        behavior,
        color: definition.color,
        x,
        y,
        radius: definition.radius,
        maxHp: Math.floor(definition.hp * healthScale * healthMultiplier),
        hp: Math.floor(definition.hp * healthScale * healthMultiplier),
        damage: Math.ceil(definition.damage * damageScale * damageMultiplier),
        speed: definition.speed * speedMultiplier,
        xpDrop: Math.max(1, Math.floor(definition.xpDrop * xpScale)),
        goldChance: definition.goldChance,
        goldDrop: definition.goldDrop,
        shotTimer: randRange(0.3, definition.shotCooldown || 0.8),
        contactTimer: 0,
        dashCooldownLeft: randRange(0.2, definition.dashCooldown || 2),
        dashTimeLeft: 0,
        dashDirX: 0,
        dashDirY: 0,
        rushVX: hasVelocity ? velocityX : 0,
        rushVY: hasVelocity ? velocityY : 0,
        swarmTag: (options && options.swarmTag) || null,
        dead: false
      };

      if (enemy.typeId === "miniboss") {
        enemy.maxHp = Math.floor(enemy.maxHp * 1.45);
        enemy.hp = enemy.maxHp;
      }
      if (enemy.typeId === "finalBoss") {
        enemy.maxHp = Math.floor(enemy.maxHp * 1.75);
        enemy.hp = enemy.maxHp;
      }

      run.entities.enemies.push(enemy);
      this.markEnemyEncountered(enemy.typeId);
    }

    updateEnemies(dt) {
      const run = this.currentRun;
      const player = run.player;
      const enemies = run.entities.enemies;

      enemies.forEach((enemy) => {
        if (enemy.dead) return;
        enemy.contactTimer = Math.max(0, enemy.contactTimer - dt);
        enemy.shotTimer -= dt;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const dirX = dx / distance;
        const dirY = dy / distance;

        if (enemy.behavior === "swarm_rush") {
          enemy.x += enemy.rushVX * enemy.speed * dt;
          enemy.y += enemy.rushVY * enemy.speed * dt;
        } else if (enemy.behavior === "chaser" || enemy.behavior === "fast") {
          enemy.x += dirX * enemy.speed * dt;
          enemy.y += dirY * enemy.speed * dt;
        } else if (enemy.behavior === "ranged") {
          const def = DATA.ENEMIES[enemy.typeId];
          const preferredRange = def.preferredRange || 220;
          const strafe = Math.sin(run.time * 1.5 + enemy.id) * 0.32;
          if (distance > preferredRange + 18) {
            enemy.x += dirX * enemy.speed * dt;
            enemy.y += dirY * enemy.speed * dt;
          } else if (distance < preferredRange - 34) {
            enemy.x -= dirX * enemy.speed * dt;
            enemy.y -= dirY * enemy.speed * dt;
          }
          enemy.x += -dirY * enemy.speed * strafe * dt;
          enemy.y += dirX * enemy.speed * strafe * dt;

          if (enemy.shotTimer <= 0) {
            this.spawnEnemyProjectile(enemy, player, def.projectileSpeed || 220, enemy.damage);
            enemy.shotTimer = def.shotCooldown || 2;
          }
        } else if (enemy.behavior === "dash") {
          const def = DATA.ENEMIES[enemy.typeId];
          enemy.dashCooldownLeft -= dt;
          if (enemy.dashTimeLeft > 0) {
            enemy.dashTimeLeft -= dt;
            enemy.x += enemy.dashDirX * enemy.speed * (def.dashMultiplier || 4) * dt;
            enemy.y += enemy.dashDirY * enemy.speed * (def.dashMultiplier || 4) * dt;
          } else {
            enemy.x += dirX * enemy.speed * 0.85 * dt;
            enemy.y += dirY * enemy.speed * 0.85 * dt;
            if (enemy.dashCooldownLeft <= 0) {
              enemy.dashCooldownLeft = def.dashCooldown || 3;
              enemy.dashTimeLeft = def.dashDuration || 0.2;
              enemy.dashDirX = dirX;
              enemy.dashDirY = dirY;
            }
          }
        } else if (enemy.behavior === "miniboss") {
          enemy.x += dirX * enemy.speed * dt;
          enemy.y += dirY * enemy.speed * dt;
          if (enemy.shotTimer <= 0) {
            this.spawnEnemyProjectile(enemy, player, DATA.ENEMIES.miniboss.projectileSpeed, enemy.damage);
            this.spawnRadialProjectiles(enemy, 6, DATA.ENEMIES.miniboss.projectileSpeed * 0.8, enemy.damage * 0.75);
            enemy.shotTimer = DATA.ENEMIES.miniboss.shotCooldown;
          }
        } else if (enemy.behavior === "finalBoss") {
          const pulse = Math.sin(run.time * 0.9) * 0.15 + 0.85;
          enemy.x += dirX * enemy.speed * pulse * dt;
          enemy.y += dirY * enemy.speed * pulse * dt;
          enemy.dashCooldownLeft -= dt;
          if (enemy.dashCooldownLeft <= 0) {
            enemy.dashCooldownLeft = 5.2;
            enemy.x += dirX * 80;
            enemy.y += dirY * 80;
          }
          if (enemy.shotTimer <= 0) {
            this.spawnEnemyProjectile(enemy, player, DATA.ENEMIES.finalBoss.projectileSpeed, enemy.damage);
            this.spawnRadialProjectiles(enemy, 10, DATA.ENEMIES.finalBoss.projectileSpeed * 0.88, enemy.damage * 0.7);
            enemy.shotTimer = DATA.ENEMIES.finalBoss.shotCooldown;
          }
        }

        if (enemy.behavior === "swarm_rush") {
          const despawnMargin = 140;
          const offscreen =
            enemy.x < -despawnMargin ||
            enemy.y < -despawnMargin ||
            enemy.x > run.world.width + despawnMargin ||
            enemy.y > run.world.height + despawnMargin;
          if (offscreen) {
            enemy.dead = true;
          }
        }
      });

      this.resolveEnemyObstacleCollisions(enemies);
      this.resolveEnemySeparation(enemies, dt);
      this.resolveEnemyObstacleCollisions(enemies);

      enemies.forEach((enemy) => {
        if (enemy.dead) return;
        const playerDx = player.x - enemy.x;
        const playerDy = player.y - enemy.y;
        const playerDistance = Math.hypot(playerDx, playerDy) || 0.001;
        if (playerDistance <= enemy.radius + player.radius && enemy.contactTimer <= 0) {
          enemy.contactTimer = 0.55;
          this.damagePlayer(enemy.damage);
        }
      });

      run.entities.enemies = enemies.filter((enemy) => !enemy.dead);
    }

    getEnemyCollisionSettings(enemyTypeId) {
      const collisionData = DATA.ENEMY_COLLISION || {};
      const byType = collisionData.typeSettings || {};
      const raw = byType[enemyTypeId] || {};
      return {
        mass: Math.max(0.2, Number(raw.mass || 1)),
        collisionScale: clamp(Number(raw.collisionScale || 1), 0.55, 1.5)
      };
    }

    resolveEnemySeparation(enemies, dt) {
      const collisionData = DATA.ENEMY_COLLISION || {};
      const separationStrength = Math.max(0, Number(collisionData.separationStrength || 0));
      const personalSpaceBuffer = Math.max(0, Number(collisionData.personalSpaceBuffer || 0));
      const maxCorrectionPerFrame = Math.max(0, Number(collisionData.maxCorrectionPerFrame || 8));
      if (separationStrength <= 0 || maxCorrectionPerFrame <= 0) return;

      const frameScale = clamp(dt * 60, 0.55, 1.85);
      for (let i = 0; i < enemies.length; i += 1) {
        const a = enemies[i];
        if (!a || a.dead) continue;
        const settingsA = this.getEnemyCollisionSettings(a.typeId);
        const radiusA = a.radius * settingsA.collisionScale;

        for (let j = i + 1; j < enemies.length; j += 1) {
          const b = enemies[j];
          if (!b || b.dead) continue;

          const settingsB = this.getEnemyCollisionSettings(b.typeId);
          const radiusB = b.radius * settingsB.collisionScale;
          const desiredDistance = radiusA + radiusB + personalSpaceBuffer;

          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let distance = Math.hypot(dx, dy);

          if (distance <= 0.0001) {
            const angle = (a.id * 13.37 + b.id * 7.11 + (this.currentRun ? this.currentRun.time : 0) * 2.7) % (Math.PI * 2);
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            distance = 1;
          }

          if (distance >= desiredDistance) continue;
          const overlap = desiredDistance - distance;
          if (overlap <= 0) continue;

          const correction = Math.min(maxCorrectionPerFrame, overlap * separationStrength * frameScale);
          const nx = dx / distance;
          const ny = dy / distance;

          const invMassA = 1 / settingsA.mass;
          const invMassB = 1 / settingsB.mass;
          const invMassTotal = invMassA + invMassB;
          if (invMassTotal <= 0.0001) continue;

          const moveA = correction * (invMassA / invMassTotal);
          const moveB = correction * (invMassB / invMassTotal);

          a.x -= nx * moveA;
          a.y -= ny * moveA;
          b.x += nx * moveB;
          b.y += ny * moveB;
        }
      }
    }

    spawnEnemyProjectile(sourceEnemy, player, speed, damage) {
      const run = this.currentRun;
      const direction = normalizeVector(player.x - sourceEnemy.x, player.y - sourceEnemy.y);
      run.entities.enemyProjectiles.push({
        id: this.nextEntityId(),
        x: sourceEnemy.x,
        y: sourceEnemy.y,
        vx: direction.x * speed,
        vy: direction.y * speed,
        radius: sourceEnemy.typeId === "finalBoss" ? 7 : 5,
        damage,
        life: 3.5
      });
    }

    spawnRadialProjectiles(sourceEnemy, count, speed, damage) {
      const run = this.currentRun;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + run.time * 0.25;
        run.entities.enemyProjectiles.push({
          id: this.nextEntityId(),
          x: sourceEnemy.x,
          y: sourceEnemy.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 4,
          damage,
          life: 2.6
        });
      }
    }

    updatePlayerProjectiles(dt) {
      const run = this.currentRun;
      const projectiles = run.entities.playerProjectiles;
      const nextProjectiles = [];

      projectiles.forEach((projectile) => {
        projectile.x += projectile.vx * dt;
        projectile.y += projectile.vy * dt;
        projectile.life -= dt;
        if (projectile.life <= 0) return;
        if (
          projectile.x < -50 ||
          projectile.y < -50 ||
          projectile.x > run.world.width + 50 ||
          projectile.y > run.world.height + 50
        ) {
          return;
        }

        let consumed = false;
        for (let i = 0; i < run.entities.enemies.length; i += 1) {
          const enemy = run.entities.enemies[i];
          if (enemy.dead) continue;
          if (projectile.hitMap[enemy.id]) continue;
          const range = projectile.radius + enemy.radius;
          const dx = projectile.x - enemy.x;
          const dy = projectile.y - enemy.y;
          if (dx * dx + dy * dy > range * range) continue;
          projectile.hitMap[enemy.id] = true;
          this.damageEnemy(enemy, projectile.damage);
          if (
            projectile.explosiveVolleyActive &&
            projectile.explosiveRadius > 0 &&
            projectile.explosiveDamageMultiplier > 0
          ) {
            this.applyJavelinSplashDamage(
              projectile.x,
              projectile.y,
              projectile.explosiveRadius,
              projectile.damage * projectile.explosiveDamageMultiplier,
              enemy.id
            );
          }
          projectile.remainingHits -= 1;
          if (projectile.remainingHits <= 0) {
            consumed = true;
            break;
          }
        }

        if (!consumed) nextProjectiles.push(projectile);
      });

      run.entities.playerProjectiles = nextProjectiles;
    }

    updateEnemyProjectiles(dt) {
      const run = this.currentRun;
      const player = run.player;
      const remaining = [];

      run.entities.enemyProjectiles.forEach((projectile) => {
        projectile.x += projectile.vx * dt;
        projectile.y += projectile.vy * dt;
        projectile.life -= dt;
        if (projectile.life <= 0) return;
        if (
          projectile.x < -60 ||
          projectile.y < -60 ||
          projectile.x > run.world.width + 60 ||
          projectile.y > run.world.height + 60
        ) {
          return;
        }

        const radius = projectile.radius + player.radius;
        const dx = projectile.x - player.x;
        const dy = projectile.y - player.y;
        if (dx * dx + dy * dy <= radius * radius) {
          this.damagePlayer(projectile.damage);
          return;
        }

        remaining.push(projectile);
      });

      run.entities.enemyProjectiles = remaining;
    }

    updatePickups(dt) {
      const run = this.currentRun;
      const player = run.player;
      const magnetConfig = this.getMagnetPowerupConfig();
      const battleFuryConfig = this.getBattleFuryPowerupConfig();
      const healingOrbConfig = this.getHealingOrbPowerupConfig();
      const kept = [];

      run.entities.pickups.forEach((pickup) => {
        if (pickup.type === "item" && pickup.blockedTimer > 0) {
          pickup.blockedTimer = Math.max(0, pickup.blockedTimer - dt);
        }
        if (pickup.type === "boss_chest" && pickup.opened) {
          pickup.openTimer = Math.max(0, Number(pickup.openTimer || 0) - dt);
          if (pickup.openTimer <= 0) {
            return;
          }
        }

        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const isXpPickup = pickup.type === "xp";
        const isGoldPickup = pickup.type === "gold";
        const isMagnetizablePickup = isXpPickup || isGoldPickup;
        const hasMagnetizedPull = isMagnetizablePickup && Number(pickup.magnetizedTimer || 0) > 0;
        if (hasMagnetizedPull) {
          pickup.magnetizedTimer = Math.max(0, Number(pickup.magnetizedTimer || 0) - dt);
          const magnetizedSpeed = Math.max(
            200,
            Number(pickup.magnetizedSpeed || magnetConfig.effect.pullSpeed || 1400)
          );
          pickup.x += (dx / distance) * magnetizedSpeed * dt;
          pickup.y += (dy / distance) * magnetizedSpeed * dt;
        }

        const pullRange = player.pickupRadius * (isXpPickup ? 2.8 : 2.1);
        if (!hasMagnetizedPull && distance <= pullRange) {
          const strength = clamp(1 - distance / pullRange, 0, 1);
          const speed = isXpPickup
            ? 120 + 680 * Math.pow(strength, 2)
            : 40 + 200 * strength;
          pickup.x += (dx / distance) * speed * dt;
          pickup.y += (dy / distance) * speed * dt;

          // Snap nearby XP to the player so it gets absorbed immediately.
          if (isMagnetizablePickup && distance <= player.pickupRadius * 0.65) {
            pickup.x = player.x;
            pickup.y = player.y;
          }
        }

        const postDx = player.x - pickup.x;
        const postDy = player.y - pickup.y;
        const postDistance = Math.hypot(postDx, postDy);
        if (postDistance <= player.pickupRadius + pickup.radius) {
          if (pickup.type === "xp") {
            this.gainXp(pickup.value);
          } else if (pickup.type === "gold") {
            run.stats.goldEarned += this.calculateScaledGoldPickup(pickup.value);
          } else if (pickup.type === magnetConfig.id) {
            this.triggerMagnetEffect();
          } else if (pickup.type === battleFuryConfig.id) {
            this.activateBattleFury();
          } else if (pickup.type === healingOrbConfig.id) {
            this.healPlayer(healingOrbConfig.effect.healAmount);
          } else if (pickup.type === "boss_chest") {
            if (!pickup.opened) {
              this.openBossChest(pickup);
            }
            kept.push(pickup);
            return;
          } else if (pickup.type === "item") {
            if (pickup.blockedTimer > 0) {
              kept.push(pickup);
              return;
            }
            const storeResult = SAVE.storeItemInStorage(run.characterId, pickup.item);
            if (!storeResult || !storeResult.ok) {
              pickup.blockedTimer = 0.5;
              kept.push(pickup);
              return;
            }
          }
          return;
        }
        kept.push(pickup);
      });

      run.entities.pickups = kept;
    }

    updateAttackEffects(dt) {
      const run = this.currentRun;
      run.entities.attackEffects.forEach((effect) => {
        effect.remaining -= dt;
      });
      run.entities.attackEffects = run.entities.attackEffects.filter((effect) => effect.remaining > 0);
    }

    gainXp(amount) {
      const run = this.currentRun;
      if (!run || run.progression.levelCapReached) return;
      if (run.progression.xpToNext <= 0) return;
      run.progression.xp += amount;
      while (run.progression.xpToNext > 0 && run.progression.xp >= run.progression.xpToNext) {
        run.progression.xp -= run.progression.xpToNext;
        run.progression.level += 1;
        run.progression.xpToNext = levelXpRequirement(run.progression.level);
        run.progression.pendingLevelUps += 1;
      }
      const remaining = this.getRemainingUpgradeCount(run);
      run.progression.pendingLevelUps = Math.min(run.progression.pendingLevelUps, Math.max(0, remaining));
      if (remaining <= 0) {
        this.enforceLevelCap(run);
        return;
      }
      this.maybeOpenLevelUp();
    }

    maybeOpenLevelUp() {
      const run = this.currentRun;
      if (!run || run.pauseReason || run.ended) return;
      if (run.progression.levelCapReached) return;
      if (run.progression.pendingLevelUps <= 0) return;

      const choices = this.generateUpgradeChoices();
      if (!choices.length) {
        run.progression.pendingLevelUps = 0;
        this.enforceLevelCap(run);
        return;
      }
      run.progression.currentUpgradeChoices = choices;
      run.pauseReason = "levelup";
      this.ui.showLevelUp(choices);
    }

    getUpgradeRankForRun(run, upgradeId) {
      return run.progression.upgradeRanks[upgradeId] || 0;
    }

    getUpgradeRank(upgradeId) {
      if (!this.currentRun) return 0;
      return this.getUpgradeRankForRun(this.currentRun, upgradeId);
    }

    getRemainingUpgradeCount(run) {
      return run.progression.totalUpgradeCapacity - run.progression.totalUpgradesTaken;
    }

    enforceLevelCap(run) {
      if (this.getRemainingUpgradeCount(run) > 0) return false;
      run.progression.levelCapReached = true;
      run.progression.pendingLevelUps = 0;
      run.progression.currentUpgradeChoices = [];
      run.progression.xp = 0;
      run.progression.xpToNext = 0;
      if (run.pauseReason === "levelup") {
        run.pauseReason = null;
        this.ui.hideLevelUp();
      }
      return true;
    }

    isUpgradeRequirementsMet(run, upgrade) {
      if (!upgrade.requirements) return true;
      if (upgrade.requirements.minimumLevel && run.progression.level < upgrade.requirements.minimumLevel) {
        return false;
      }
      if (upgrade.requirements.allAtMax) {
        for (let i = 0; i < upgrade.requirements.allAtMax.length; i += 1) {
          const requiredId = upgrade.requirements.allAtMax[i];
          const required = UPGRADE_BY_ID[requiredId];
          if (!required) return false;
          if (this.getUpgradeRankForRun(run, requiredId) < required.maxRank) {
            return false;
          }
        }
      }
      return true;
    }

    isUpgradeAvailable(run, upgrade) {
      const currentRank = this.getUpgradeRankForRun(run, upgrade.id);
      if (currentRank >= upgrade.maxRank) return false;
      return this.isUpgradeRequirementsMet(run, upgrade);
    }

    generateUpgradeChoices() {
      const run = this.currentRun;
      const available = DATA.UPGRADES.filter((upgrade) => this.isUpgradeAvailable(run, upgrade));
      if (!available.length) return [];

      const picks = [];
      const ultimates = available.filter((upgrade) => upgrade.type === "ultimate");
      if (ultimates.length) {
        picks.push(ultimates[randInt(0, ultimates.length - 1)]);
      }
      const pool = available.filter((upgrade) => !picks.some((picked) => picked.id === upgrade.id));
      picks.push(...chooseDistinctWeighted(pool, Math.max(0, 3 - picks.length)));

      return picks.slice(0, 3).map((upgrade) => {
        const rank = this.getUpgradeRankForRun(run, upgrade.id);
        const nextRank = rank + 1;
        let description = upgrade.description;
        if (upgrade.type === "ultimate") {
          description = `${upgrade.description} (Ultimate)`;
        } else {
          description = `${upgrade.description} (Rank ${nextRank}/${upgrade.maxRank})`;
        }
        return {
          ...upgrade,
          rank,
          nextRank,
          description
        };
      });
    }

    chooseUpgrade(upgradeId) {
      const run = this.currentRun;
      if (!run || run.pauseReason !== "levelup") return;
      const upgrade = run.progression.currentUpgradeChoices.find((item) => item.id === upgradeId);
      if (!upgrade) return;

      this.applyUpgrade(upgrade);
      run.progression.pendingLevelUps = Math.max(0, run.progression.pendingLevelUps - 1);
      run.pauseReason = null;
      run.progression.currentUpgradeChoices = [];
      this.ui.hideLevelUp();
      if (this.enforceLevelCap(run)) {
        return;
      }
      this.maybeOpenLevelUp();
    }

    calculateAttributeEffects(attributeLevels) {
      const levels = attributeLevels || {};
      const strength = Math.max(0, Math.floor(Number(levels.strength || 0)));
      const ferocity = Math.max(0, Math.floor(Number(levels.ferocity || 0)));
      const endurance = Math.max(0, Math.floor(Number(levels.endurance || 0)));
      const instinct = Math.max(0, Math.floor(Number(levels.instinct || 0)));

      return {
        strength,
        ferocity,
        endurance,
        instinct,
        physicalDamageMultiplier: 1 + strength * 0.03,
        armoredBonusDamagePct: strength >= 3 ? 0.08 : 0,
        armorIgnorePct: strength >= 6 ? 0.15 : 0,
        armorBypassPct: strength >= 10 ? 0.3 : 0,
        rageGainMultiplier: 1 + ferocity * 0.08,
        rageDurationMultiplier: 1 + ferocity * 0.06,
        rageAttackSpeedBonusPct: ferocity >= 3 ? 0.08 + ferocity * 0.01 : 0,
        killExtendsRageSeconds: ferocity >= 6 ? 0.8 + ferocity * 0.08 : 0,
        rageAttackModifierUnlocked: ferocity >= 10,
        maxHpMultiplier: 1 + endurance * 0.05,
        baseDamageReductionPct: Math.min(0.35, endurance * 0.01),
        lowHpDamageReductionPct: endurance >= 3 ? 0.08 : 0,
        repeatedHitStackReductionPct: endurance >= 6 ? 0.015 : 0,
        repeatedHitMaxStacks: endurance >= 6 ? 5 : 0,
        damageToRagePct: endurance >= 10 ? 0.35 : 0,
        moveSpeedBonusPct: instinct * 0.03,
        cooldownReductionPct: Math.min(0.35, instinct * 0.015),
        pickupRadiusBonusPct: instinct * 0.04,
        killCooldownRecoveryPct: instinct >= 3 ? 0.04 : 0,
        damageTakenSpeedBoostPct: instinct >= 6 ? 0.18 : 0,
        damageTakenSpeedBoostDuration: instinct >= 6 ? 2.2 : 0,
        autoTriggerRageLowHp: instinct >= 10
      };
    }

    applyAttributeBaseStats(run) {
      if (!run) return;
      run.attributeEffects = this.calculateAttributeEffects(run.attributes);
      const effects = run.attributeEffects;
      const player = run.player;
      const hpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 1;
      const nextMaxHp = Math.max(1, player.baseMaxHp * effects.maxHpMultiplier);
      player.maxHp = nextMaxHp;
      player.hp = Math.max(0, Math.min(nextMaxHp, nextMaxHp * hpRatio));
      player.pickupRadius = player.basePickupRadius * (1 + effects.pickupRadiusBonusPct);
    }

    gainRage(run, rawAmount) {
      if (!run || !run.player || !run.player.rage) return;
      const rage = run.player.rage;
      const amount = Math.max(0, Number(rawAmount || 0));
      if (amount <= 0) return;
      rage.value = clamp(rage.value + amount, 0, rage.max);
      if (!rage.active && rage.value >= rage.max) {
        this.activateRage(run, 0);
      }
    }

    activateRage(run, bonusDurationSeconds) {
      if (!run || !run.player || !run.player.rage) return;
      const rage = run.player.rage;
      const effects = run.attributeEffects || this.calculateAttributeEffects(run.attributes);
      rage.active = true;
      rage.value = 0;
      rage.timeLeft = Math.max(
        rage.timeLeft,
        rage.baseDuration * effects.rageDurationMultiplier + Math.max(0, bonusDurationSeconds || 0)
      );
      this.recalculateWeaponStats(run);
    }

    updateRage(dt) {
      const run = this.currentRun;
      if (!run || !run.player || !run.player.rage) return;
      const rage = run.player.rage;
      if (!rage.active) return;
      rage.timeLeft = Math.max(0, rage.timeLeft - dt);
      if (rage.timeLeft <= 0) {
        rage.active = false;
        this.recalculateWeaponStats(run);
      }
    }

    isEnemyArmored(enemy) {
      if (!enemy) return false;
      return enemy.typeId === "dasher" || enemy.typeId === "miniboss" || enemy.typeId === "finalBoss";
    }

    getEnemyArmorRatio(enemy) {
      if (!enemy) return 0;
      if (enemy.typeId === "finalBoss") return 0.3;
      if (enemy.typeId === "miniboss") return 0.18;
      if (enemy.typeId === "dasher") return 0.1;
      return 0;
    }

    recalculateWeaponStats(run) {
      const player = run.player;
      this.applyAttributeBaseStats(run);
      const effects = run.attributeEffects || this.calculateAttributeEffects(run.attributes);
      const genericDamageRank = this.getUpgradeRankForRun(run, "generic_damage");
      const genericCooldownRank = this.getUpgradeRankForRun(run, "generic_cooldown");
      const furyConfig = this.getBattleFuryPowerupConfig();
      const furyState = run.powerups && run.powerups.battleFury ? run.powerups.battleFury : null;
      const furyActive = Boolean(furyState && Number(furyState.activeTimer || 0) > 0);
      const furyDamageMultiplier = furyActive ? Math.max(1, furyConfig.effect.damageMultiplier) : 1;
      const furyAttackSpeedMultiplier = furyActive ? Math.max(1, furyConfig.effect.attackSpeedMultiplier) : 1;

      const damageMultiplier = (1 + genericDamageRank * 0.11) * effects.physicalDamageMultiplier * furyDamageMultiplier;
      const rageAttackSpeedMultiplier =
        player.rage && player.rage.active ? 1 + Math.max(0, effects.rageAttackSpeedBonusPct) : 1;
      const cooldownMultiplier = Math.max(
        0.45,
        (1 - genericCooldownRank * 0.06) * (1 - effects.cooldownReductionPct) / (rageAttackSpeedMultiplier * furyAttackSpeedMultiplier)
      );

      const axeArcRank = this.getUpgradeRankForRun(run, "axe_widen_arc");
      const axeTwinRank = this.getUpgradeRankForRun(run, "axe_twin_swing");
      const axeWhirlwind = this.getUpgradeRankForRun(run, "axe_whirlwind") > 0;

      player.axe.damage = player.axe.baseDamage * damageMultiplier * (axeWhirlwind ? 1.2 : 1);
      player.axe.cooldown = Math.max(0.14, player.axe.baseCooldown * cooldownMultiplier);
      player.axe.range =
        player.axe.baseRange *
        (1 + axeArcRank * 0.08 + (axeWhirlwind ? 0.12 : 0) + (player.rage && player.rage.active && effects.rageAttackModifierUnlocked ? 0.12 : 0));
      player.axe.arcRadians = axeWhirlwind
        ? Math.PI * 2
        : Math.min(Math.PI * 1.9, player.axe.baseArcRadians * (1 + axeArcRank * 0.17));
      player.axe.extraSwings = axeTwinRank + (player.rage && player.rage.active && effects.rageAttackModifierUnlocked ? 1 : 0);
      player.axe.whirlwindActive = axeWhirlwind;

      const javelinVolleyRank = this.getUpgradeRankForRun(run, "javelin_volley");
      const javelinPierceRank = this.getUpgradeRankForRun(run, "javelin_long_flight");
      const javelinUltimate = this.getUpgradeRankForRun(run, "javelin_piercing_volley") > 0;

      player.javelin.damage = player.javelin.baseDamage * damageMultiplier * (javelinUltimate ? 1.1 : 1);
      player.javelin.cooldown = Math.max(0.1, player.javelin.baseCooldown * cooldownMultiplier);
      player.javelin.speed = player.javelin.baseSpeed;
      player.javelin.range = player.javelin.baseRange * (1 + (javelinUltimate ? 0.08 : 0));
      player.javelin.count = player.javelin.baseCount + javelinVolleyRank + (javelinUltimate ? 1 : 0);
      const pierceBonusFromPath = Math.max(0, Math.floor((javelinPierceRank + 1) / 2));
      player.javelin.pierce =
        player.javelin.basePierce +
        pierceBonusFromPath +
        (javelinUltimate ? 1 : 0) +
        (player.rage && player.rage.active && effects.rageAttackModifierUnlocked ? 1 : 0);
      player.javelin.piercingVolleyActive = player.javelin.pierce > player.javelin.basePierce;
      player.javelin.explosiveVolleyActive = javelinUltimate;
      player.javelin.explosiveRadius = javelinUltimate ? player.javelin.baseExplosiveRadius : 0;
      player.javelin.explosiveDamageMultiplier = javelinUltimate ? player.javelin.baseExplosiveDamageMultiplier : 0;
    }

    applyUpgrade(upgrade) {
      const run = this.currentRun;
      const currentRank = this.getUpgradeRankForRun(run, upgrade.id);
      if (currentRank >= upgrade.maxRank) return;

      run.progression.upgradeRanks[upgrade.id] = currentRank + 1;
      run.progression.totalUpgradesTaken += 1;
      this.recalculateWeaponStats(run);
    }

    damagePlayer(amount) {
      const run = this.currentRun;
      const player = run.player;
      if (player.invulnTimer > 0) return;
      const effects = run.attributeEffects || this.calculateAttributeEffects(run.attributes);
      let reduction = Math.max(0, effects.baseDamageReductionPct || 0);
      const hpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 1;
      if (hpRatio <= 0.35) {
        reduction += Math.max(0, effects.lowHpDamageReductionPct || 0);
      }
      if ((effects.repeatedHitMaxStacks || 0) > 0) {
        reduction += Math.max(0, player.defenseStackCount || 0) * Math.max(0, effects.repeatedHitStackReductionPct || 0);
      }
      reduction = clamp(reduction, 0, 0.78);

      let damageTaken = Math.max(0, amount) * (1 - reduction);
      if ((effects.damageToRagePct || 0) > 0) {
        const converted = damageTaken * effects.damageToRagePct;
        damageTaken -= converted;
        this.gainRage(run, converted * 6);
      }

      player.hp -= damageTaken;
      player.invulnTimer = DATA.PLAYER_BASE.invulnDuration;

      if ((effects.repeatedHitMaxStacks || 0) > 0) {
        player.defenseStackCount = Math.min(effects.repeatedHitMaxStacks, (player.defenseStackCount || 0) + 1);
        player.defenseStackTimer = 4;
      }
      if ((effects.damageTakenSpeedBoostPct || 0) > 0) {
        player.speedBoostTimer = Math.max(player.speedBoostTimer || 0, effects.damageTakenSpeedBoostDuration || 2);
      }

      if (player.hp <= 0) {
        player.hp = 0;
      }

      if (effects.autoTriggerRageLowHp && !player.rage.active && player.hp > 0) {
        const nextHpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 0;
        if (nextHpRatio <= 0.35) {
          this.activateRage(run, 0.8);
        }
      }
    }

    damageEnemy(enemy, amount) {
      if (enemy.dead) return;
      const run = this.currentRun;
      const effects = run.attributeEffects || this.calculateAttributeEffects(run.attributes);
      let adjustedAmount = Math.max(0, amount);

      if (this.isEnemyArmored(enemy)) {
        adjustedAmount *= 1 + Math.max(0, effects.armoredBonusDamagePct || 0);
        const armorRatio = this.getEnemyArmorRatio(enemy);
        const effectiveArmor = Math.max(0, armorRatio - Math.max(0, effects.armorIgnorePct || 0));
        const mitigatedArmor = effectiveArmor * (1 - Math.max(0, effects.armorBypassPct || 0));
        adjustedAmount *= 1 - clamp(mitigatedArmor, 0, 0.85);
      }

      enemy.hp -= adjustedAmount;
      this.gainRage(run, (run.player.rage.gainOnHit || 0) * Math.max(1, effects.rageGainMultiplier || 1));
      if (enemy.hp > 0) return;
      enemy.dead = true;
      this.onEnemyKilled(enemy);
    }

    onEnemyKilled(enemy) {
      const run = this.currentRun;
      const effects = run.attributeEffects || this.calculateAttributeEffects(run.attributes);
      run.stats.enemiesKilled += 1;
      const enemyTypeId = String((enemy && enemy.typeId) || "").trim();
      if (enemyTypeId) {
        const currentKills = Math.max(0, Math.floor(Number(run.stats.enemyKillsByType[enemyTypeId] || 0)));
        run.stats.enemyKillsByType[enemyTypeId] = currentKills + 1;
      }
      this.gainRage(run, (run.player.rage.gainOnKill || 0) * Math.max(1, effects.rageGainMultiplier || 1));
      if (run.player.rage.active && (effects.killExtendsRageSeconds || 0) > 0) {
        run.player.rage.timeLeft += effects.killExtendsRageSeconds;
      }
      if ((effects.killCooldownRecoveryPct || 0) > 0) {
        run.player.axe.cooldownLeft = Math.max(
          0,
          run.player.axe.cooldownLeft - run.player.axe.cooldown * effects.killCooldownRecoveryPct
        );
        run.player.javelin.cooldownLeft = Math.max(
          0,
          run.player.javelin.cooldownLeft - run.player.javelin.cooldown * effects.killCooldownRecoveryPct
        );
      }

      this.spawnPickup(enemy.x, enemy.y, "xp", enemy.xpDrop);
      if (Math.random() <= enemy.goldChance) {
        this.spawnPickup(enemy.x + randRange(-8, 8), enemy.y + randRange(-8, 8), "gold", enemy.goldDrop);
      }

      if (enemy.typeId === "miniboss") {
        run.stats.minibossesDefeated += 1;
        run.stats.legacyXpEarned += DATA.ENEMIES.miniboss.legacyReward;
        this.spawnPickup(enemy.x, enemy.y, "xp", enemy.xpDrop * 0.75);
        this.spawnPickup(enemy.x + 14, enemy.y - 12, "gold", Math.floor(enemy.goldDrop * 0.6));
        this.spawnBossLootDrops("miniboss", enemy);
      }

      if (enemy.typeId === "finalBoss") {
        run.stats.finalBossDefeated = true;
        run.stats.legacyXpEarned += DATA.ENEMIES.finalBoss.legacyReward;
        this.spawnPickup(enemy.x, enemy.y, "gold", enemy.goldDrop);
        this.spawnFinalBossRewardChest(enemy);
        this.startVictoryCollectionWindow();
      }

      this.trySpawnBattleFuryPickup(enemy);
    }

    spawnPickup(x, y, type, value, options) {
      const opts = options || {};
      const lootVisuals = (DATA.LOOT_SYSTEM && DATA.LOOT_SYSTEM.visuals) || {};
      const itemRadius = Math.max(6, Number(lootVisuals.itemPickupRadius || 8));
      const magnetConfig = this.getMagnetPowerupConfig();
      const magnetRadius = Math.max(5, Number(magnetConfig.visual && magnetConfig.visual.radius));
      const battleFuryConfig = this.getBattleFuryPowerupConfig();
      const battleFuryRadius = Math.max(5, Number(battleFuryConfig.visual && battleFuryConfig.visual.radius));
      const healingOrbConfig = this.getHealingOrbPowerupConfig();
      const healingOrbRadius = Math.max(5, Number(healingOrbConfig.visual && healingOrbConfig.visual.radius));
      const chestRadius = 13;
      const pickup = {
        id: this.nextEntityId(),
        x,
        y,
        radius:
          type === "xp"
            ? 5
            : type === "item"
            ? itemRadius
            : type === magnetConfig.id
            ? magnetRadius
            : type === battleFuryConfig.id
            ? battleFuryRadius
            : type === healingOrbConfig.id
            ? healingOrbRadius
            : type === "boss_chest"
            ? chestRadius
            : 6,
        type,
        value: Math.max(1, Math.floor(value || 1))
      };
      if (type === "item") {
        pickup.item = opts.item || null;
        pickup.rarity = opts.rarity || (pickup.item && pickup.item.rarity) || "grey";
        pickup.blockedTimer = 0;
      } else if (type === "boss_chest") {
        pickup.opened = false;
        pickup.openTimer = 0;
        pickup.lootItems = Array.isArray(opts.lootItems) ? opts.lootItems.filter(Boolean) : [];
      }
      this.currentRun.entities.pickups.push(pickup);
    }

    finishRun(reason) {
      const run = this.currentRun;
      if (!run || run.ended) return;
      run.ended = true;
      run.reasonEnded = reason;
      run.pauseReason = "ended";
      this.ui.hidePause();
      this.ui.hideLevelUp();

      const timeLegacy = Math.floor((run.time / 60) * DATA.RUN.legacyPerMinute);
      const timeGold = Math.floor(run.time * DATA.RUN.goldRewardPerSecond);
      run.stats.legacyXpEarned += timeLegacy;
      run.stats.goldEarned += timeGold;
      if (reason === "victory") {
        run.stats.legacyXpEarned += 120;
      }

      const summary = {
        characterName: run.characterName,
        levelLabel: run.level && run.level.label ? run.level.label : "Level 1",
        completedLevelNumber: run.level ? Math.max(1, Math.floor(Number(run.level.index || 1))) : 1,
        victory: reason === "victory",
        timeSurvived: Math.floor(run.time),
        enemiesKilled: run.stats.enemiesKilled,
        enemyKillsByType: { ...(run.stats.enemyKillsByType || {}) },
        goldEarned: run.stats.goldEarned,
        newBestiaryEntries: Math.max(0, Math.floor(Number(run.stats.newBestiaryEntries || 0))),
        legacyXpEarned: run.stats.legacyXpEarned,
        deaths: reason === "death" ? 1 : 0,
        minibossesDefeated: run.stats.minibossesDefeated,
        bossChestOpened: Boolean(run.stats.bossChestOpened),
        bossChestItemsFound: Math.max(0, Math.floor(Number(run.stats.bossChestItemsFound || 0))),
        bossChestItemsStored: 0,
        bossChestItemsOverflow: 0,
        finalBossAppeared: run.stats.finalBossAppeared,
        finalBossDefeated: run.stats.finalBossDefeated
      };

      SAVE.applyRunRewards(run.characterId, summary);
      const postRunItems =
        run.postRunRewards && Array.isArray(run.postRunRewards.items) ? run.postRunRewards.items.filter(Boolean) : [];
      if (postRunItems.length) {
        postRunItems.forEach((item) => {
          const stored = SAVE.storeItemInStorage(run.characterId, item);
          if (stored && stored.ok) {
            summary.bossChestItemsStored += 1;
          } else {
            summary.bossChestItemsOverflow += 1;
          }
        });
      }
      this.refreshCharacterCacheAfterRun(run.characterId);
      this.ui.showEndRun(summary);
    }

    refreshCharacterCacheAfterRun(characterId) {
      this.characters = SAVE.listCharacters();
      if (characterId) {
        this.selectedCharacterId = characterId;
      }
    }

    pushHud() {
      const run = this.currentRun;
      if (!run) return;
      this.ui.updateHud({
        name: run.characterName,
        hp: run.player.hp,
        maxHp: run.player.maxHp,
        level: run.progression.level,
        gold: run.stats.goldEarned,
        legacy: run.stats.legacyXpEarned,
        rageCurrent: run.player.rage && typeof run.player.rage.value === "number" ? run.player.rage.value : 0,
        rageMax: run.player.rage && typeof run.player.rage.max === "number" ? run.player.rage.max : 100,
        rageActive: Boolean(run.player.rage && run.player.rage.active),
        rageSeconds: run.player.rage && typeof run.player.rage.timeLeft === "number" ? run.player.rage.timeLeft : 0,
        time: run.time,
        xpProgress: run.progression.xpToNext > 0 ? run.progression.xp / run.progression.xpToNext : 0
      });
    }

    renderRun() {
      const run = this.currentRun;
      if (!run) return;
      const ctx = this.ctx;
      const width = run.world.width;
      const height = run.world.height;

      ctx.clearRect(0, 0, width, height);
      this.drawBackgroundGrid(width, height);
      this.drawObstacles();
      this.drawPickups();
      this.drawOffscreenPowerupIndicators();
      this.drawPlayerProjectiles();
      this.drawEnemyProjectiles();
      this.drawEnemies();
      this.drawPlayer();
      this.drawAttackEffects();
      this.drawTopTimers();
      this.drawSwarmBanner();
    }

    drawBackgroundGrid(width, height) {
      const ctx = this.ctx;
      ctx.fillStyle = "#10151d";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(55, 70, 95, 0.28)";
      ctx.lineWidth = 1;
      const spacing = 48;
      const worldOffset = this.currentRun.worldOffset || { x: 0, y: 0 };
      const offsetX = ((worldOffset.x % spacing) + spacing) % spacing;
      const offsetY = ((worldOffset.y % spacing) + spacing) % spacing;

      for (let x = -offsetX; x <= width + spacing; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = -offsetY; y <= height + spacing; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    drawObstacles() {
      const run = this.currentRun;
      if (!run || !run.entities || !Array.isArray(run.entities.obstacles)) return;
      const obstacles = run.entities.obstacles;
      if (!obstacles.length) return;
      const ctx = this.ctx;
      const config = this.getObstacleConfig();
      const fillColor = config.fillColor;
      const strokeColor = config.strokeColor;

      obstacles.forEach((obstacle) => {
        if (!obstacle) return;
        const obstacleSize = this.getObstacleHalfExtents(obstacle);
        const halfW = obstacleSize.halfW;
        const halfH = obstacleSize.halfH;
        if (
          obstacle.x < -halfW - 6 ||
          obstacle.y < -halfH - 6 ||
          obstacle.x > run.world.width + halfW + 6 ||
          obstacle.y > run.world.height + halfH + 6
        ) {
          return;
        }

        const width = halfW * 2;
        const height = halfH * 2;
        const left = obstacle.x - halfW;
        const top = obstacle.y - halfH;
        const sprite =
          this.obstacleSprites && this.obstacleSprites.length
            ? this.obstacleSprites[Math.max(0, Math.min(this.obstacleSprites.length - 1, Number(obstacle.spriteIndex || 0)))]
            : null;

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
          ctx.drawImage(sprite, left, top, width, height);
        } else {
          ctx.fillStyle = fillColor;
          ctx.fillRect(left, top, width, height);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(left + 0.5, top + 0.5, Math.max(1, width - 1), Math.max(1, height - 1));
          ctx.fillStyle = "rgba(248, 252, 255, 0.12)";
          ctx.fillRect(left + 3, top + 3, Math.max(2, width * 0.35), Math.max(2, height * 0.14));
        }
      });
    }

    drawPlayer() {
      const run = this.currentRun;
      const ctx = this.ctx;
      const player = run.player;
      const blink = player.invulnTimer > 0 && Math.floor(run.time * 25) % 2 === 0;
      if (blink) {
        ctx.globalAlpha = 0.45;
      }
      ctx.fillStyle = "#7ec8ff";
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(
        player.x + Math.cos(player.facing) * (player.radius + 11),
        player.y + Math.sin(player.facing) * (player.radius + 11)
      );
      ctx.stroke();
    }

    drawEnemies() {
      const ctx = this.ctx;
      const run = this.currentRun;
      run.entities.enemies.forEach((enemy) => {
        if (enemy.dead) return;
        ctx.fillStyle = enemy.color;
        if (enemy.typeId === "shooter") {
          ctx.beginPath();
          ctx.moveTo(enemy.x, enemy.y - enemy.radius);
          ctx.lineTo(enemy.x + enemy.radius, enemy.y + enemy.radius * 0.72);
          ctx.lineTo(enemy.x - enemy.radius, enemy.y + enemy.radius * 0.72);
          ctx.closePath();
          ctx.fill();
        } else if (enemy.typeId === "dasher") {
          ctx.beginPath();
          ctx.moveTo(enemy.x, enemy.y - enemy.radius);
          ctx.lineTo(enemy.x + enemy.radius, enemy.y);
          ctx.lineTo(enemy.x, enemy.y + enemy.radius);
          ctx.lineTo(enemy.x - enemy.radius, enemy.y);
          ctx.closePath();
          ctx.fill();
        } else if (enemy.typeId === "miniboss") {
          ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2);
        } else if (enemy.typeId === "finalBoss") {
          ctx.beginPath();
          for (let i = 0; i < 6; i += 1) {
            const angle = (Math.PI * 2 * i) / 6 + this.currentRun.time * 0.12;
            const px = enemy.x + Math.cos(angle) * enemy.radius;
            const py = enemy.y + Math.sin(angle) * enemy.radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        this.drawEnemyHealthBar(enemy);
      });
    }

    drawEnemyHealthBar(enemy) {
      const ctx = this.ctx;
      const barWidth = enemy.radius * 2;
      const x = enemy.x - barWidth / 2;
      const y = enemy.y - enemy.radius - 10;
      const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
      ctx.fillStyle = "rgba(16, 18, 22, 0.7)";
      ctx.fillRect(x, y, barWidth, 4);
      ctx.fillStyle = enemy.typeId === "finalBoss" ? "#ff698e" : "#8ae286";
      ctx.fillRect(x, y, barWidth * ratio, 4);
    }

    drawPlayerProjectiles() {
      const ctx = this.ctx;
      ctx.strokeStyle = "#d5f0ff";
      ctx.lineWidth = 3;
      this.currentRun.entities.playerProjectiles.forEach((projectile) => {
        const length = 9;
        const angle = Math.atan2(projectile.vy, projectile.vx);
        ctx.beginPath();
        ctx.moveTo(
          projectile.x - Math.cos(angle) * length * 0.45,
          projectile.y - Math.sin(angle) * length * 0.45
        );
        ctx.lineTo(
          projectile.x + Math.cos(angle) * length * 0.65,
          projectile.y + Math.sin(angle) * length * 0.65
        );
        ctx.stroke();
      });
    }

    drawEnemyProjectiles() {
      const ctx = this.ctx;
      this.currentRun.entities.enemyProjectiles.forEach((projectile) => {
        ctx.fillStyle = projectile.radius >= 7 ? "#ff4972" : "#ff9d84";
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    drawPickups() {
      const ctx = this.ctx;
      const lootVisuals = (DATA.LOOT_SYSTEM && DATA.LOOT_SYSTEM.visuals) || {};
      const rarityColors = lootVisuals.rarityColors || {};
      const magnetConfig = this.getMagnetPowerupConfig();
      const battleFuryConfig = this.getBattleFuryPowerupConfig();
      const healingOrbConfig = this.getHealingOrbPowerupConfig();
      this.currentRun.entities.pickups.forEach((pickup) => {
        if (pickup.type === "item") {
          const rarityColor = rarityColors[pickup.rarity] || "#c2c8d6";
          const r = pickup.radius;
          ctx.fillStyle = rarityColor;
          ctx.beginPath();
          ctx.moveTo(pickup.x, pickup.y - r);
          ctx.lineTo(pickup.x + r, pickup.y);
          ctx.lineTo(pickup.x, pickup.y + r);
          ctx.lineTo(pickup.x - r, pickup.y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(248, 252, 255, 0.88)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          return;
        }
        if (pickup.type === "boss_chest") {
          const r = pickup.radius;
          const left = pickup.x - r * 1.2;
          const top = pickup.y - r * 0.9;
          const width = r * 2.4;
          const height = r * 1.9;
          const spriteIndex = pickup.opened ? 1 : 0;
          const sprite =
            this.chestSprites && this.chestSprites.length
              ? this.chestSprites[Math.max(0, Math.min(this.chestSprites.length - 1, spriteIndex))]
              : null;

          if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, left, top, width, height);
          } else {
            ctx.fillStyle = pickup.opened ? "#a76b3a" : "#8c5a34";
            ctx.fillRect(left, top + height * 0.36, width, height * 0.64);
            ctx.fillStyle = pickup.opened ? "#b88453" : "#9d6a3d";
            ctx.fillRect(left, top, width, height * 0.42);
            ctx.strokeStyle = "#f2d28a";
            ctx.lineWidth = 1.6;
            ctx.strokeRect(left + width * 0.46, top + height * 0.22, width * 0.08, height * 0.58);
          }
          return;
        }
        if (pickup.type === magnetConfig.id) {
          const r = pickup.radius;
          const fillColor = (magnetConfig.visual && magnetConfig.visual.fillColor) || "#76d68c";
          const ringColor = (magnetConfig.visual && magnetConfig.visual.ringColor) || "#c6ffdb";
          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.arc(pickup.x, pickup.y, r * 0.64, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = ringColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pickup.x, pickup.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(pickup.x, pickup.y, r * 1.35, Math.PI * 0.15, Math.PI * 1.85);
          ctx.stroke();
          return;
        }
        if (pickup.type === battleFuryConfig.id) {
          const r = pickup.radius;
          const fillColor = (battleFuryConfig.visual && battleFuryConfig.visual.fillColor) || "#ff9f5f";
          const ringColor = (battleFuryConfig.visual && battleFuryConfig.visual.ringColor) || "#ffd5b0";
          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.arc(pickup.x, pickup.y, r * 0.58, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = ringColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pickup.x, pickup.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pickup.x - r * 0.2, pickup.y - r * 0.6);
          ctx.lineTo(pickup.x + r * 0.5, pickup.y - r * 0.1);
          ctx.lineTo(pickup.x + r * 0.1, pickup.y + r * 0.15);
          ctx.lineTo(pickup.x + r * 0.5, pickup.y + r * 0.7);
          ctx.stroke();
          return;
        }
        if (pickup.type === healingOrbConfig.id) {
          const r = pickup.radius;
          const fillColor = (healingOrbConfig.visual && healingOrbConfig.visual.fillColor) || "#7ee28e";
          const ringColor = (healingOrbConfig.visual && healingOrbConfig.visual.ringColor) || "#d4ffdc";
          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.arc(pickup.x, pickup.y, r * 0.62, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = ringColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pickup.x, pickup.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = "rgba(235, 255, 238, 0.95)";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(pickup.x - r * 0.35, pickup.y);
          ctx.lineTo(pickup.x + r * 0.35, pickup.y);
          ctx.moveTo(pickup.x, pickup.y - r * 0.35);
          ctx.lineTo(pickup.x, pickup.y + r * 0.35);
          ctx.stroke();
          return;
        }
        ctx.fillStyle = pickup.type === "xp" ? "#66c4ff" : "#f4c542";
        ctx.beginPath();
        ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    getPowerupIndicatorInfo(typeId) {
      const magnetConfig = this.getMagnetPowerupConfig();
      if (typeId === magnetConfig.id) {
        return {
          id: magnetConfig.id,
          label: magnetConfig.label || "Magnet",
          fillColor: (magnetConfig.visual && magnetConfig.visual.fillColor) || "#76d68c",
          ringColor: (magnetConfig.visual && magnetConfig.visual.ringColor) || "#c6ffdb"
        };
      }
      const battleFuryConfig = this.getBattleFuryPowerupConfig();
      if (typeId === battleFuryConfig.id) {
        return {
          id: battleFuryConfig.id,
          label: battleFuryConfig.label || "Battle Fury",
          fillColor: (battleFuryConfig.visual && battleFuryConfig.visual.fillColor) || "#ff9f5f",
          ringColor: (battleFuryConfig.visual && battleFuryConfig.visual.ringColor) || "#ffd5b0"
        };
      }
      const healingOrbConfig = this.getHealingOrbPowerupConfig();
      if (typeId === healingOrbConfig.id) {
        return {
          id: healingOrbConfig.id,
          label: healingOrbConfig.label || "Healing Orb",
          fillColor: (healingOrbConfig.visual && healingOrbConfig.visual.fillColor) || "#7ee28e",
          ringColor: (healingOrbConfig.visual && healingOrbConfig.visual.ringColor) || "#d4ffdc"
        };
      }
      const powerups = DATA.POWERUPS || {};
      const fallback = Object.values(powerups).find((powerup) => {
        if (!powerup || typeof powerup !== "object") return false;
        return String(powerup.id || "").trim() === String(typeId || "").trim();
      });
      if (fallback) {
        const visual = fallback.visual || {};
        return {
          id: fallback.id || typeId,
          label: fallback.label || String(typeId || "Powerup"),
          fillColor: visual.fillColor || "#89d6ff",
          ringColor: visual.ringColor || "#d5f0ff"
        };
      }
      return null;
    }

    getPowerupIndicatorToken(label) {
      const text = String(label || "").trim();
      if (!text) return "?";
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length >= 2) {
        return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
      }
      return words[0].slice(0, 2).toUpperCase();
    }

    drawOffscreenPowerupIndicators() {
      const run = this.currentRun;
      if (!run || !run.entities || !Array.isArray(run.entities.pickups) || !run.entities.pickups.length) return;
      const player = run.player;
      const width = run.world.width;
      const height = run.world.height;
      if (!player || width <= 0 || height <= 0) return;

      const nearestByType = {};
      run.entities.pickups.forEach((pickup) => {
        if (!pickup) return;
        const indicatorInfo = this.getPowerupIndicatorInfo(pickup.type);
        if (!indicatorInfo) return;
        const onScreen = pickup.x >= 0 && pickup.x <= width && pickup.y >= 0 && pickup.y <= height;
        if (onScreen) return;

        const dx = pickup.x - player.x;
        const dy = pickup.y - player.y;
        const distSq = dx * dx + dy * dy;
        if (!Number.isFinite(distSq) || distSq <= 0.001) return;

        const existing = nearestByType[pickup.type];
        if (!existing || distSq < existing.distSq) {
          nearestByType[pickup.type] = {
            pickup,
            indicatorInfo,
            dx,
            dy,
            distSq
          };
        }
      });

      const entries = Object.values(nearestByType);
      if (!entries.length) return;
      const ctx = this.ctx;
      const inset = 22;
      const halfW = Math.max(1, width * 0.5 - inset);
      const halfH = Math.max(1, height * 0.5 - inset);
      const pulse = 0.92 + Math.sin(run.time * 4.5) * 0.08;

      entries.forEach((entry) => {
        const dir = normalizeVector(entry.dx, entry.dy);
        if (!dir.x && !dir.y) return;
        const tx = Math.abs(dir.x) < 0.0001 ? Number.POSITIVE_INFINITY : halfW / Math.abs(dir.x);
        const ty = Math.abs(dir.y) < 0.0001 ? Number.POSITIVE_INFINITY : halfH / Math.abs(dir.y);
        const t = Math.min(tx, ty);
        const anchorX = player.x + dir.x * t;
        const anchorY = player.y + dir.y * t;
        const angle = Math.atan2(dir.y, dir.x);
        const info = entry.indicatorInfo;
        const token = this.getPowerupIndicatorToken(info.label);

        ctx.save();
        ctx.translate(anchorX, anchorY);
        ctx.rotate(angle);
        ctx.scale(pulse, pulse);

        ctx.fillStyle = info.fillColor;
        ctx.strokeStyle = info.ringColor;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(2, 6.2);
        ctx.lineTo(2, -6.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "rgba(241, 247, 255, 0.92)";
        ctx.font = "10px Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(token, anchorX, anchorY);
      });
    }

    drawAttackEffects() {
      const ctx = this.ctx;
      this.currentRun.entities.attackEffects.forEach((effect) => {
        const alpha = clamp(effect.remaining / effect.duration, 0, 1) * 0.65;
        ctx.strokeStyle = `rgba(255, 168, 100, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 7;
        ctx.beginPath();
        if (effect.didSpin) {
          ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        } else {
          ctx.arc(
            effect.x,
            effect.y,
            effect.radius,
            effect.centerAngle - effect.arc * 0.5,
            effect.centerAngle + effect.arc * 0.5
          );
        }
        ctx.stroke();
      });
    }

    drawTopTimers() {
      const run = this.currentRun;
      const ctx = this.ctx;
      const timeUntilMiniboss = Math.max(0, run.spawn.nextMinibossTime - run.time);
      const finalBossIn = Math.max(0, DATA.RUN.finalBossTimeSeconds - run.time);
      const swarmState = run.spawn && run.spawn.swarm ? run.spawn.swarm : null;
      let swarmLine = "Next swarm: --:--";
      if (swarmState && swarmState.enabled) {
        if (swarmState.activeTimer > 0 && swarmState.currentEvent) {
          const label = swarmState.currentEvent.type === "rush" ? "Rush" : "Encirclement";
          swarmLine = `Swarm: ${label} (${swarmState.activeTimer.toFixed(1)}s)`;
        } else if (swarmState.warningTimer > 0 && swarmState.pendingEvent) {
          const label = swarmState.pendingEvent.type === "rush" ? "Rush" : "Encirclement";
          swarmLine = `Incoming: ${label} (${swarmState.warningTimer.toFixed(1)}s)`;
        } else if (Number.isFinite(swarmState.nextEventAt)) {
          const nextIn = Math.max(0, swarmState.nextEventAt - run.time);
          swarmLine = `Next swarm: ${formatTime(nextIn)}`;
        }
      }

      ctx.fillStyle = "rgba(11, 14, 21, 0.72)";
      ctx.fillRect(run.world.width - 236, 10, 226, 76);
      ctx.fillStyle = "#dde5f5";
      ctx.font = "12px Trebuchet MS, sans-serif";
      ctx.fillText(`Next miniboss: ${formatTime(timeUntilMiniboss)}`, run.world.width - 224, 31);
      ctx.fillText(`Final boss: ${formatTime(finalBossIn)}`, run.world.width - 224, 50);
      ctx.fillText(swarmLine, run.world.width - 224, 68);
    }

    drawRushDirectionMarker(direction, color) {
      const run = this.currentRun;
      if (!run) return;
      const ctx = this.ctx;
      const width = run.world.width;
      const height = run.world.height;
      const size = 11;
      ctx.fillStyle = color;
      ctx.beginPath();
      if (direction === "right_to_left") {
        const cx = width - 14;
        const cy = height * 0.5;
        ctx.moveTo(cx - size, cy);
        ctx.lineTo(cx + size, cy - size);
        ctx.lineTo(cx + size, cy + size);
      } else if (direction === "top_to_bottom") {
        const cx = width * 0.5;
        const cy = 14;
        ctx.moveTo(cx, cy + size);
        ctx.lineTo(cx - size, cy - size);
        ctx.lineTo(cx + size, cy - size);
      } else if (direction === "bottom_to_top") {
        const cx = width * 0.5;
        const cy = height - 14;
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx - size, cy + size);
        ctx.lineTo(cx + size, cy + size);
      } else {
        const cx = 14;
        const cy = height * 0.5;
        ctx.moveTo(cx + size, cy);
        ctx.lineTo(cx - size, cy - size);
        ctx.lineTo(cx - size, cy + size);
      }
      ctx.closePath();
      ctx.fill();
    }

    drawSwarmBanner() {
      const run = this.currentRun;
      if (!run || !run.spawn || !run.spawn.swarm) return;
      const swarmState = run.spawn.swarm;
      if (!swarmState.enabled) return;

      let event = null;
      let text = "";
      let warning = false;
      if (swarmState.warningTimer > 0 && swarmState.pendingEvent) {
        event = swarmState.pendingEvent;
        text = event.warningText || "Swarm Incoming";
        warning = true;
      } else if (swarmState.activeTimer > 0 && swarmState.currentEvent) {
        event = swarmState.currentEvent;
        text = event.activeText || "Swarm Active";
      }

      if (!event || !text) return;

      const ctx = this.ctx;
      const width = run.world.width;
      const panelWidth = Math.min(320, Math.max(190, width - 130));
      const panelX = (width - panelWidth) * 0.5;
      const panelY = 14;
      const panelH = 28;
      const bg = warning ? "rgba(37, 62, 95, 0.78)" : "rgba(112, 35, 35, 0.82)";
      const border = warning ? "rgba(137, 185, 255, 0.85)" : "rgba(255, 137, 137, 0.86)";
      const textColor = warning ? "#d7e8ff" : "#ffe2e2";

      ctx.fillStyle = bg;
      ctx.fillRect(panelX, panelY, panelWidth, panelH);
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(panelX, panelY, panelWidth, panelH);
      ctx.fillStyle = textColor;
      ctx.font = "bold 13px Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, panelX + panelWidth * 0.5, panelY + panelH * 0.5);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      if (event.type === "rush") {
        this.drawRushDirectionMarker(event.direction, warning ? "rgba(124, 184, 255, 0.9)" : "rgba(255, 126, 126, 0.92)");
      }
    }

    nextEntityId() {
      this.entityIds += 1;
      return this.entityIds;
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    const app = new GameApp();
    app.init();
    window.RL_GAME_APP = app;
  });
})();
