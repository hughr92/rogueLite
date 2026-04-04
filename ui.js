(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  }

  function formatTime(seconds) {
    const clamped = Math.max(0, Math.floor(seconds));
    const minutes = String(Math.floor(clamped / 60)).padStart(2, "0");
    const remainder = String(clamped % 60).padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  function formatCompactCount(value) {
    const count = Math.max(0, Math.floor(Number(value) || 0));
    if (count < 1000) return String(count);

    const suffixes = ["K", "M", "B", "T", "Qa", "Qi"];
    let scaled = count;
    let suffixIndex = -1;
    while (scaled >= 1000 && suffixIndex < suffixes.length - 1) {
      scaled /= 1000;
      suffixIndex += 1;
    }

    const floored = Math.floor(scaled * 100) / 100;
    const trimmed = floored.toFixed(2).replace(/\.?0+$/, "");
    const suffix = suffixes[Math.max(0, suffixIndex)];
    return `${trimmed}${suffix}`;
  }

  function formatInteger(value) {
    const number = Math.max(0, Math.floor(Number(value) || 0));
    return number.toLocaleString("en-US");
  }

  function toTitle(id) {
    const text = String(id || "").replace(/_/g, " ");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function normalizeRarityKey(rarityId) {
    return String(rarityId || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  }

  function getRarityTextClass(rarityId) {
    const key = normalizeRarityKey(rarityId);
    if (key === "grey") return "rarity-text-grey";
    if (key === "blue") return "rarity-text-blue";
    if (key === "purple") return "rarity-text-purple";
    if (key === "gold") return "rarity-text-gold";
    if (key === "green") return "rarity-text-green";
    return "";
  }

  function getRarityBorderClass(rarityId) {
    const key = normalizeRarityKey(rarityId);
    if (key === "grey") return "rarity-border-grey";
    if (key === "blue") return "rarity-border-blue";
    if (key === "purple") return "rarity-border-purple";
    if (key === "gold") return "rarity-border-gold";
    if (key === "green") return "rarity-border-green";
    return "";
  }

  const UPGRADE_BY_ID = Object.fromEntries(window.RL_DATA.UPGRADES.map((upgrade) => [upgrade.id, upgrade]));
  const MAX_CLASS_SKILLS_PER_RUN = Math.max(
    1,
    Math.floor(Number((window.RL_DATA.RUN && window.RL_DATA.RUN.maxSkillChoicesPerRun) || 4))
  );
  const COIN_ICON_PATH = "assets/pickups/coin.png";
  const BESTIARY_ENEMY_ICON_PATH_BY_TYPE = Object.freeze({
    grunt: "images/enemies/melee_basic/1_raider/base/skeleton_melee_top.png",
    runner: "images/enemies/melee_fast/1_skitter/base/skeleton_skitter_top.png",
    shooter: "images/enemies/ranged_archer/1_hex_archer/base/skeleton_archer_top.png",
    trishot: "images/enemies/ranged_volley_caster/1_volley_shaman/base/placeholder.png",
    shieldbearer: "images/enemies/melee_tank/1_bulwark/base/skeleton_bulwark_top_shield.png",
    dasher: "images/enemies/melee_charge/1_lancer/base/skeleton_lancer_top.png",
    miniboss: "images/enemies/elite_leader/1_war_captain/base/placeholder.png",
    finalBoss: "images/enemies/boss_final/1_abyss_tyrant/base/placeholder.png"
  });
  const SKILL_ICON_PATH_BY_ID = Object.freeze({
    ground_slam: "assets/skills/class/barbarian/ground_slam.png",
    twin_swing: "assets/skills/class/barbarian/twin_swing.png",
    blood_frenzy: "assets/skills/class/barbarian/blood_frenzy.png",
    war_cry: "assets/skills/class/barbarian/war_cry.png",
    berserk: "assets/skills/class/barbarian/berserk.png",
    generic_damage: "assets/skills/general/damage_increase.png",
    generic_cooldown: "assets/skills/general/cooldown_reduction.png",
    damage_increase: "assets/skills/general/damage_increase.png",
    cooldown_reduction: "assets/skills/general/cooldown_reduction.png",
    damage_reduction: "assets/skills/general/damage_increase.png",
    sever_artery: "assets/skills/class/barbarian/sever_artery.jpg",
    axe_widen_arc: "assets/skills/weapon/axe/cleave.png",
    axe_twin_swing: "assets/skills/class/barbarian/twin_swing.png",
    axe_whirlwind: "assets/skills/weapon/axe/whirlwind.png",
    javelin_volley: "assets/skills/weapon/javelin/volley.jpg",
    javelin_long_flight: "assets/skills/weapon/javelin/piercing_throw.png",
    javelin_piercing_volley: "assets/skills/weapon/javelin/explosive_vollery.jpg",
    twin_slash: "assets/skills/weapon/sword/twin_slash.png",
    piercing_throw: "assets/skills/weapon/javelin/piercing_throw.png",
    power_shot: "assets/skills/weapon/bow/power_shot.png",
    volley: "assets/skills/weapon/bow/volley.png",
    shield_bash: "assets/skills/weapon/shield/shield_bash.png",
    fortify: "assets/skills/weapon/shield/fortify.png",
    cleave: "assets/skills/weapon/axe/cleave.png",
    whirlwind: "assets/skills/weapon/axe/whirlwind.png"
  });

  function resolveSkillIconPathById(rawId) {
    const id = String(rawId || "").trim().toLowerCase();
    if (!id) return "";
    const withoutAlt = id.replace(/_alt_\d+$/i, "");
    if (withoutAlt.startsWith("class_skill_unlock:")) {
      const skillId = withoutAlt.slice("class_skill_unlock:".length).trim();
      return SKILL_ICON_PATH_BY_ID[skillId] || "";
    }
    return SKILL_ICON_PATH_BY_ID[withoutAlt] || "";
  }

  function createSkillIcon(path, alt, className) {
    if (!path) return null;
    const img = createElement("img", className || "skill-icon");
    img.src = path;
    img.alt = alt || "Skill icon";
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => {
      img.classList.add("hidden");
    });
    return img;
  }

  function toSnakeCaseToken(rawValue) {
    return String(rawValue || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function getItemAssetSlug(templateId, rarityId) {
    const id = String(templateId || "").trim().toLowerCase();
    const rarity = normalizeRarityKey(rarityId) || "grey";
    if (!id) return "";
    if (rarity === "grey" && id.startsWith("common_")) return id.slice("common_".length);
    if (id.startsWith(`${rarity}_`)) return id.slice(rarity.length + 1);
    return id;
  }

  function resolveItemIconPath(item) {
    if (!item || typeof item !== "object") return "";
    const rarity = normalizeRarityKey(item.rarity) || "grey";
    const slug =
      getItemAssetSlug(item.templateId || item.id, rarity) ||
      toSnakeCaseToken(item.name || item.templateId || item.id || "");
    if (!slug) return "";
    return `assets/items/${rarity}/${slug}/icon.png`;
  }

  function resolveConsumableIconPath(consumable) {
    if (!consumable || typeof consumable !== "object") return "";
    const explicitId = toSnakeCaseToken(consumable.consumableId || consumable.id || "");
    if (explicitId) return `assets/items/utility/${explicitId}/icon.png`;
    const kind = String(consumable.kind || "").trim().toLowerCase();
    if (kind === "consumable_health_potion") return "assets/items/utility/health_potion/icon.png";
    if (kind === "consumable_revival") return "assets/items/utility/revive_sigil/icon.png";
    return "";
  }

  function resolveBestiaryEnemyIconPath(enemyTypeId) {
    const id = String(enemyTypeId || "").trim();
    if (!id) return "";
    return BESTIARY_ENEMY_ICON_PATH_BY_TYPE[id] || "";
  }

  function createItemIcon(path, altText, className) {
    const frame = createElement(
      "div",
      `item-icon-frame${className ? ` ${className}` : ""}`.trim()
    );
    const img = createElement("img", "item-icon-image");
    img.alt = altText || "Item icon";
    img.loading = "lazy";
    img.decoding = "async";
    if (!path) {
      frame.classList.add("item-icon-fallback");
      return frame;
    }
    img.src = path;
    img.addEventListener("error", () => {
      frame.classList.add("item-icon-fallback");
    });
    img.addEventListener("load", () => {
      const width = Math.max(0, Number(img.naturalWidth || 0));
      const height = Math.max(0, Number(img.naturalHeight || 0));
      if (width <= 1 && height <= 1) {
        frame.classList.add("item-icon-fallback");
      } else {
        frame.classList.remove("item-icon-fallback");
      }
    });
    frame.appendChild(img);
    return frame;
  }

  function createCoinAmount(value, className) {
    const amount = Math.max(0, Math.floor(Number(value || 0)));
    const wrapper = createElement(
      "span",
      `coin-amount${className ? ` ${className}` : ""}`.trim()
    );
    const icon = createElement("img", "coin-icon");
    icon.src = COIN_ICON_PATH;
    icon.alt = "Gold";
    icon.loading = "lazy";
    icon.decoding = "async";
    icon.addEventListener("error", () => {
      icon.classList.add("hidden");
    });
    wrapper.append(icon, createElement("span", "coin-value", String(amount)));
    return wrapper;
  }

  function createMerchantPriceLine(label, price) {
    const row = createElement("div", "merchant-price merchant-price-line");
    row.appendChild(createElement("span", "merchant-price-label", `${label}:`));
    row.appendChild(createCoinAmount(price));
    return row;
  }

  function createUiController() {
    const dom = {
      homeScreen: byId("homeScreen"),
      gameScreen: byId("gameScreen"),
      createCharacterBtn: byId("createCharacterBtn"),
      startRunBtn: byId("startRunBtn"),
      startRunXpWarning: byId("startRunXpWarning"),
      levelSelector: byId("levelSelector"),
      difficultySelector: byId("difficultySelector"),
      homeStatus: byId("homeStatus"),
      characterList: byId("characterList"),
      itemReferenceToggleBtn: byId("itemReferenceToggleBtn"),
      itemReferencePanel: byId("itemReferencePanel"),
      itemReferenceCloseBtn: byId("itemReferenceCloseBtn"),
      itemReferenceContent: byId("itemReferenceContent"),
      deleteCharacterBtn: byId("deleteCharacterBtn"),
      skillTreeEmpty: byId("skillTreeEmpty"),
      skillTreeView: byId("skillTreeView"),
      characterSummary: byId("characterSummary"),
      weaponsTabBtn: byId("weaponsTabBtn"),
      classTabBtn: byId("classTabBtn"),
      skillsTabBtn: byId("skillsTabBtn"),
      inventoryTabBtn: byId("inventoryTabBtn"),
      merchantTabBtn: byId("merchantTabBtn"),
      questsTabBtn: byId("questsTabBtn"),
      bestiaryTabBtn: byId("bestiaryTabBtn"),
      skillTreeContent: byId("skillTreeContent"),
      createCharacterModal: byId("createCharacterModal"),
      characterNameInput: byId("characterNameInput"),
      createCharacterError: byId("createCharacterError"),
      saveCharacterBtn: byId("saveCharacterBtn"),
      cancelCharacterBtn: byId("cancelCharacterBtn"),
      levelUpOverlay: byId("levelUpOverlay"),
      levelUpTitle: byId("levelUpTitle"),
      levelUpOptions: byId("levelUpOptions"),
      pauseOverlay: byId("pauseOverlay"),
      resumeBtn: byId("resumeBtn"),
      restartBtn: byId("restartBtn"),
      returnHomeBtn: byId("returnHomeBtn"),
      endRunOverlay: byId("endRunOverlay"),
      endRunStats: byId("endRunStats"),
      playAgainBtn: byId("playAgainBtn"),
      endReturnHomeBtn: byId("endReturnHomeBtn"),
      deleteCharacterOverlay: byId("deleteCharacterOverlay"),
      deleteCharacterText: byId("deleteCharacterText"),
      cancelDeleteCharacterBtn: byId("cancelDeleteCharacterBtn"),
      confirmDeleteCharacterBtn: byId("confirmDeleteCharacterBtn"),
      hudName: byId("hudName"),
      hudHp: byId("hudHp"),
      healthHudLabel: byId("healthHudLabel"),
      healthFill: byId("healthFill"),
      healthPotionHudLabel: byId("healthPotionHudLabel"),
      classSkillHud: byId("classSkillHud"),
      roundTimerHudLabel: byId("roundTimerHudLabel"),
      hudLevel: byId("hudLevel"),
      hudGold: byId("hudGold"),
      hudLegacy: byId("hudLegacy"),
      hudRage: byId("hudRage"),
      hudTimer: byId("hudTimer"),
      rageFill: byId("rageFill"),
      xpFill: byId("xpFill")
    };

    const handlers = {
      onCreateCharacter: null,
      onSelectCharacter: null,
      onSelectLevel: null,
      onSelectDifficulty: null,
      onDeleteCharacter: null,
      onStartRun: null,
      onChooseUpgrade: null,
      onSpendClassPoint: null,
      onMoveInventoryItem: null,
      onBuyMerchantItem: null,
      onSellInventoryItem: null,
      onBuybackMerchantItem: null,
      onClaimQuestReward: null,
      onClaimBountyReward: null,
      onSetEquippedClassSkills: null,
      onResume: null,
      onRestart: null,
      onReturnHome: null,
      onPlayAgain: null
    };

    const state = {
      selectedCharacter: null,
      activeSkillTab: "weapons",
      skillTreeProgress: null,
      inventoryStorageTabByCharacter: {},
      merchantBuyCategoryTabByCharacter: {},
      questViewTabByCharacter: {},
      inventoryRevealByCharacter: {},
      draggingInventorySource: null,
      pendingDeleteCharacterId: null,
      itemReferenceOpen: false,
      itemReferenceWeaponTypeFilter: "all",
      selectedLevelId: null,
      selectedDifficulty: 1
    };
    let inventoryContextMenuEl = null;
    let skillStripCache = {
      signature: "",
      byId: {}
    };

    function closeInventoryContextMenu() {
      if (!inventoryContextMenuEl) return;
      if (inventoryContextMenuEl.parentNode) {
        inventoryContextMenuEl.parentNode.removeChild(inventoryContextMenuEl);
      }
      inventoryContextMenuEl = null;
    }

    function openInventoryContextMenu(event, options) {
      const safeOptions = options || {};
      if (typeof safeOptions.onSell !== "function") return;
      event.preventDefault();
      closeInventoryContextMenu();

      const menu = createElement("div", "inventory-context-menu");
      const sellPrice = Math.max(1, Math.floor(Number(safeOptions.sellPrice || 0)));
      const sellButton = createElement("button", "inventory-context-menu-item");
      sellButton.type = "button";
      sellButton.appendChild(createElement("span", "inventory-context-menu-label", "Sell for"));
      sellButton.appendChild(createCoinAmount(sellPrice, "inventory-context-coin"));
      sellButton.addEventListener("click", (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        closeInventoryContextMenu();
        safeOptions.onSell();
      });
      menu.appendChild(sellButton);
      document.body.appendChild(menu);
      inventoryContextMenuEl = menu;

      const padding = 8;
      const rect = menu.getBoundingClientRect();
      let left = Number(event.clientX || 0);
      let top = Number(event.clientY || 0);
      if (left + rect.width > window.innerWidth - padding) {
        left = window.innerWidth - rect.width - padding;
      }
      if (top + rect.height > window.innerHeight - padding) {
        top = window.innerHeight - rect.height - padding;
      }
      menu.style.left = `${Math.max(padding, left)}px`;
      menu.style.top = `${Math.max(padding, top)}px`;
    }

    function setVisible(element, visible) {
      element.classList.toggle("hidden", !visible);
    }

    function init(userHandlers) {
      Object.assign(handlers, userHandlers || {});

      dom.createCharacterBtn.addEventListener("click", () => {
        dom.characterNameInput.value = "";
        hideCreateError();
        setVisible(dom.createCharacterModal, true);
        dom.characterNameInput.focus();
      });

      dom.cancelCharacterBtn.addEventListener("click", () => {
        setVisible(dom.createCharacterModal, false);
      });

      dom.saveCharacterBtn.addEventListener("click", () => {
        const name = dom.characterNameInput.value;
        if (!handlers.onCreateCharacter) return;
        const result = handlers.onCreateCharacter(name);
        if (result && result.ok) {
          setVisible(dom.createCharacterModal, false);
          return;
        }
        showCreateError((result && result.error) || "Could not create character.");
      });

      dom.characterNameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          dom.saveCharacterBtn.click();
        }
      });

      dom.startRunBtn.addEventListener("click", () => {
        if (handlers.onStartRun) handlers.onStartRun();
      });

      dom.deleteCharacterBtn.addEventListener("click", () => {
        if (!state.selectedCharacter || !handlers.onDeleteCharacter) return;
        state.pendingDeleteCharacterId = state.selectedCharacter.id;
        dom.deleteCharacterText.textContent = `Delete ${state.selectedCharacter.name}? This cannot be undone.`;
        setVisible(dom.deleteCharacterOverlay, true);
      });

      dom.cancelDeleteCharacterBtn.addEventListener("click", () => {
        state.pendingDeleteCharacterId = null;
        setVisible(dom.deleteCharacterOverlay, false);
      });

      dom.confirmDeleteCharacterBtn.addEventListener("click", () => {
        if (!state.pendingDeleteCharacterId || !handlers.onDeleteCharacter) {
          setVisible(dom.deleteCharacterOverlay, false);
          return;
        }
        const deleteId = state.pendingDeleteCharacterId;
        state.pendingDeleteCharacterId = null;
        setVisible(dom.deleteCharacterOverlay, false);
        handlers.onDeleteCharacter(deleteId);
      });

      dom.resumeBtn.addEventListener("click", () => {
        if (handlers.onResume) handlers.onResume();
      });

      dom.restartBtn.addEventListener("click", () => {
        if (handlers.onRestart) handlers.onRestart();
      });

      dom.returnHomeBtn.addEventListener("click", () => {
        if (handlers.onReturnHome) handlers.onReturnHome();
      });

      dom.playAgainBtn.addEventListener("click", () => {
        if (handlers.onPlayAgain) handlers.onPlayAgain();
      });

      dom.endReturnHomeBtn.addEventListener("click", () => {
        if (handlers.onReturnHome) handlers.onReturnHome();
      });

      dom.weaponsTabBtn.addEventListener("click", () => {
        setActiveSkillTab("weapons");
      });

      dom.classTabBtn.addEventListener("click", () => {
        setActiveSkillTab("class");
      });

      if (dom.skillsTabBtn) {
        dom.skillsTabBtn.addEventListener("click", () => {
          setActiveSkillTab("skills");
        });
      }

      dom.inventoryTabBtn.addEventListener("click", () => {
        setActiveSkillTab("inventory");
      });

      if (dom.merchantTabBtn) {
        dom.merchantTabBtn.addEventListener("click", () => {
          setActiveSkillTab("merchant");
        });
      }

      if (dom.questsTabBtn) {
        dom.questsTabBtn.addEventListener("click", () => {
          setActiveSkillTab("quests");
        });
      }

      if (dom.bestiaryTabBtn) {
        dom.bestiaryTabBtn.addEventListener("click", () => {
          setActiveSkillTab("bestiary");
        });
      }

      if (dom.itemReferenceToggleBtn) {
        dom.itemReferenceToggleBtn.addEventListener("click", () => {
          state.itemReferenceOpen = !state.itemReferenceOpen;
          syncItemReferenceVisibility();
          if (state.itemReferenceOpen) {
            renderItemReferencePanel();
          }
        });
      }

      if (dom.itemReferenceCloseBtn) {
        dom.itemReferenceCloseBtn.addEventListener("click", () => {
          state.itemReferenceOpen = false;
          syncItemReferenceVisibility();
        });
      }

      renderItemReferencePanel();
      syncItemReferenceVisibility();

      document.addEventListener("click", () => {
        closeInventoryContextMenu();
      });
      document.addEventListener(
        "contextmenu",
        (event) => {
          if (!inventoryContextMenuEl) return;
          if (inventoryContextMenuEl.contains(event.target)) return;
          closeInventoryContextMenu();
        },
        true
      );
      window.addEventListener("resize", () => {
        closeInventoryContextMenu();
      });
      window.addEventListener("blur", () => {
        closeInventoryContextMenu();
      });
    }

    function hideCreateError() {
      dom.createCharacterError.classList.add("hidden");
      dom.createCharacterError.textContent = "";
    }

    function showCreateError(text) {
      dom.createCharacterError.classList.remove("hidden");
      dom.createCharacterError.textContent = text;
    }

    function renderCharacterList(characters, selectedCharacterId) {
      dom.characterList.innerHTML = "";
      if (!characters.length) {
        const empty = createElement("p", "char-meta", "No saved characters.");
        dom.characterList.appendChild(empty);
        dom.startRunBtn.disabled = true;
        return;
      }

      characters.forEach((character) => {
        const card = createElement("button", "character-card");
        card.type = "button";
        if (character.id === selectedCharacterId) {
          card.classList.add("selected");
        }

        const name = createElement("div", "char-name", character.name);
        const race = window.RL_DATA.RACES[character.race];
        const classInfo = window.RL_DATA.CLASSES[character.classId];
        const meta1 = createElement(
          "div",
          "char-meta",
          `${race ? race.label : toTitle(character.race)} ${classInfo ? classInfo.label : toTitle(character.classId)}`
        );
        const meta2 = createElement(
          "div",
          "char-meta",
          `Gold ${character.gold} | XP ${character.legacyXp} | Best ${formatTime(character.bestSurvivalTime)}`
        );
        const meta3 = createElement(
          "div",
          "char-meta",
          `Runs ${character.runsPlayed} | Minibosses ${character.minibossKills} | Kills ${formatCompactCount(character.enemyKills)}`
        );

        card.append(name, meta1, meta2, meta3);
        card.addEventListener("click", () => {
          if (handlers.onSelectCharacter) handlers.onSelectCharacter(character.id);
        });
        dom.characterList.appendChild(card);
      });

      dom.startRunBtn.disabled = !selectedCharacterId;
    }

    function getLevelDefinitions() {
      const configured = Array.isArray(window.RL_DATA.LEVELS) ? window.RL_DATA.LEVELS : [];
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

    function getDifficultyConfig() {
      const configured = (window.RL_DATA && window.RL_DATA.DIFFICULTY_MODIFIER) || {};
      const parsedDefault = Number(configured.defaultDifficulty);
      const parsedMax = Number(configured.maxDifficulty);
      const defaultDifficulty = Number.isNaN(parsedDefault) ? 1 : Math.max(1, Math.floor(parsedDefault));
      const maxDifficulty = Number.isNaN(parsedMax) ? 10 : Math.max(defaultDifficulty, Math.floor(parsedMax));
      return {
        defaultDifficulty,
        maxDifficulty
      };
    }

    function normalizeDifficulty(value) {
      const config = getDifficultyConfig();
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return config.defaultDifficulty;
      return Math.max(config.defaultDifficulty, Math.min(config.maxDifficulty, Math.floor(parsed)));
    }

    function getCharacterUnlockedDifficultyByLevel(character, levelId) {
      const config = getDifficultyConfig();
      if (!character || !levelId) return config.defaultDifficulty;
      const map =
        character.highestDifficultyByLevel && typeof character.highestDifficultyByLevel === "object"
          ? character.highestDifficultyByLevel
          : {};
      const explicit = Number(map[levelId]);
      if (Number.isNaN(explicit)) return config.defaultDifficulty;
      return Math.max(config.defaultDifficulty, Math.min(config.maxDifficulty, Math.floor(explicit)));
    }

    function getLevelIndexFromId(levelId) {
      const normalized = String(levelId || "").trim();
      if (!normalized) return 1;
      const level = getLevelDefinitions().find((entry) => entry && entry.id === normalized);
      if (level && Number(level.index) > 0) {
        return Math.max(1, Math.floor(Number(level.index)));
      }
      const match = normalized.match(/\d+/);
      if (!match) return 1;
      return Math.max(1, Math.floor(Number(match[0])));
    }

    function getLegacyXpEligibilityForSelection(character, levelId, difficulty) {
      const playerLevel = Math.max(1, Math.floor(Number((character && character.legacyLevel) || 1)));
      const levelNumber = getLevelIndexFromId(levelId);
      const normalizedDifficulty = normalizeDifficulty(difficulty);
      const requiredScore = Math.max(0, playerLevel - 3);
      const runScore = levelNumber + normalizedDifficulty;
      return {
        eligible: runScore >= requiredScore,
        playerLevel,
        requiredScore,
        runScore,
        levelNumber,
        difficulty: normalizedDifficulty
      };
    }

    function setStartRunXpWarning(text) {
      if (!dom.startRunXpWarning) return;
      const message = String(text || "").trim();
      if (!message) {
        dom.startRunXpWarning.textContent = "";
        dom.startRunXpWarning.classList.add("hidden");
        return;
      }
      dom.startRunXpWarning.textContent = message;
      dom.startRunXpWarning.classList.remove("hidden");
    }

    function renderLevelSelector(character, options) {
      if (!dom.levelSelector) return;
      dom.levelSelector.innerHTML = "";
      if (!character) {
        dom.levelSelector.appendChild(createElement("div", "level-selector-empty", "Select a character to choose a level."));
        return;
      }

      const levels = getLevelDefinitions();
      const highestUnlockedLevel = Math.max(1, Math.floor(Number(character.highestUnlockedLevel || 1)));
      const visibleLevels = levels.filter((level) => level.index <= highestUnlockedLevel);
      const availableLevels = visibleLevels.length ? visibleLevels : [levels[0]];
      const selectedFromOptions = options && typeof options.selectedLevelId === "string" ? options.selectedLevelId : null;
      if (selectedFromOptions) {
        state.selectedLevelId = selectedFromOptions;
      }
      if (!availableLevels.some((level) => level.id === state.selectedLevelId)) {
        state.selectedLevelId = availableLevels[0].id;
      }

      availableLevels.forEach((level) => {
        const button = createElement("button", "btn level-selector-btn", level.label);
        button.type = "button";
        if (level.id === state.selectedLevelId) {
          button.classList.add("active");
        }
        if (level.subtitle) {
          button.title = `${level.label} - ${level.subtitle}`;
        }
        button.addEventListener("click", () => {
          state.selectedLevelId = level.id;
          renderLevelSelector(character, null);
          renderDifficultySelector(character, null);
          if (handlers.onSelectLevel) handlers.onSelectLevel(level.id);
        });
        dom.levelSelector.appendChild(button);
      });
    }

    function renderDifficultySelector(character, options) {
      if (!dom.difficultySelector) return;
      dom.difficultySelector.innerHTML = "";
      if (!character) {
        setStartRunXpWarning("");
        dom.difficultySelector.appendChild(
          createElement("div", "level-selector-empty", "Select a level to choose difficulty.")
        );
        return;
      }

      const config = getDifficultyConfig();
      const selectedLevelId = String(state.selectedLevelId || "").trim() || "level_1";
      const selectedLevel = getLevelDefinitions().find((level) => level && level.id === selectedLevelId) || null;
      const unlockedDifficulty = getCharacterUnlockedDifficultyByLevel(character, selectedLevelId);
      const selectedFromOptions = options ? Number(options.selectedDifficulty) : Number.NaN;
      if (!Number.isNaN(selectedFromOptions)) {
        state.selectedDifficulty = normalizeDifficulty(selectedFromOptions);
      }
      state.selectedDifficulty = Math.max(config.defaultDifficulty, Math.min(unlockedDifficulty, normalizeDifficulty(state.selectedDifficulty)));

      const circleRow = createElement("div", "difficulty-circle-row");
      circleRow.setAttribute("role", "radiogroup");
      circleRow.setAttribute("aria-label", "Difficulty");
      for (let difficulty = config.defaultDifficulty; difficulty <= config.maxDifficulty; difficulty += 1) {
        const isUnlocked = difficulty <= unlockedDifficulty;
        const isFilled = difficulty <= state.selectedDifficulty;
        const isSelected = difficulty === state.selectedDifficulty;
        const button = createElement("button", "difficulty-circle-btn");
        button.type = "button";
        button.setAttribute("role", "radio");
        button.setAttribute("aria-checked", isSelected ? "true" : "false");
        button.setAttribute("aria-label", isUnlocked ? `Difficulty ${difficulty}` : `Difficulty ${difficulty} locked`);
        button.title = isUnlocked ? `D${difficulty}` : `D${difficulty} (Locked)`;
        if (isFilled) {
          button.classList.add("filled");
        }
        if (isSelected) {
          button.classList.add("active");
        }
        if (!isUnlocked) {
          button.classList.add("locked");
          button.disabled = true;
        }
        button.addEventListener("click", () => {
          if (!isUnlocked) return;
          if (difficulty === state.selectedDifficulty) return;
          state.selectedDifficulty = difficulty;
          renderDifficultySelector(character, null);
          if (handlers.onSelectDifficulty) handlers.onSelectDifficulty(difficulty);
        });
        circleRow.appendChild(button);
      }
      dom.difficultySelector.appendChild(circleRow);

      if (unlockedDifficulty < config.maxDifficulty) {
        const nextLocked = unlockedDifficulty + 1;
        dom.difficultySelector.appendChild(
          createElement(
            "div",
            "difficulty-select-hint",
            `Beat ${(selectedLevel && selectedLevel.label) || selectedLevelId.replace(/_/g, " ")} on D${unlockedDifficulty} to unlock D${nextLocked}.`
          )
        );
      }

      const xpEligibility = getLegacyXpEligibilityForSelection(character, selectedLevelId, state.selectedDifficulty);
      if (!xpEligibility.eligible) {
        setStartRunXpWarning(
          `No character XP: need Level + Difficulty >= ${xpEligibility.requiredScore} ` +
            `(current ${xpEligibility.levelNumber} + ${xpEligibility.difficulty} = ${xpEligibility.runScore}).`
        );
      } else {
        setStartRunXpWarning("");
      }
    }

    function createDefaultSkillTreeProgress() {
      const ranks = {};
      window.RL_DATA.UPGRADES.forEach((upgrade) => {
        ranks[upgrade.id] = 0;
      });
      return { ranks };
    }

    function normalizeSkillTreeProgress(progress) {
      const base = createDefaultSkillTreeProgress();
      if (!progress || !progress.ranks) return base;
      return {
        ranks: {
          ...base.ranks,
          ...progress.ranks
        }
      };
    }

    function getProgressRank(upgradeId) {
      if (!state.skillTreeProgress || !state.skillTreeProgress.ranks) return 0;
      return state.skillTreeProgress.ranks[upgradeId] || 0;
    }

    function isUltimateUnlocked(upgradeId) {
      const upgrade = UPGRADE_BY_ID[upgradeId];
      if (!upgrade || !upgrade.requirements || !upgrade.requirements.allAtMax) {
        return false;
      }
      return upgrade.requirements.allAtMax.every((requiredId) => {
        const required = UPGRADE_BY_ID[requiredId];
        if (!required) return false;
        return getProgressRank(requiredId) >= required.maxRank;
      });
    }

    function getMainQuestDefinitions() {
      const questsConfig = (window.RL_DATA && window.RL_DATA.QUESTS) || {};
      return Object.values(questsConfig)
        .reduce((list, entry) => {
          if (!Array.isArray(entry)) return list;
          return list.concat(entry.filter((quest) => quest && typeof quest === "object" && quest.id));
        }, [])
        .filter((quest) => quest.availableFromStart !== false);
    }

    function getMainQuestProgressValue(character, requirement) {
      const req = requirement || {};
      const requirementType = String(req.type || "").trim();
      if (requirementType === "legacy_xp_total") {
        return Math.max(0, Math.floor(Number(character.legacyXp || 0)));
      }
      if (requirementType === "total_gold_collected") {
        return Math.max(0, Math.floor(Number(character.lifetimeGoldCollected || 0)));
      }
      if (requirementType === "miniboss_kills_total") {
        return Math.max(0, Math.floor(Number(character.minibossKills || 0)));
      }
      if (requirementType === "enemy_kills_total") {
        return Math.max(0, Math.floor(Number(character.enemyKills || 0)));
      }
      if (requirementType === "deaths_total") {
        return Math.max(0, Math.floor(Number(character.deaths || 0)));
      }
      return 0;
    }

    function getClaimableMainQuestCount(character, questDefinitions) {
      if (!character) return 0;
      const definitions = Array.isArray(questDefinitions) ? questDefinitions : getMainQuestDefinitions();
      const claims = character.questClaims && typeof character.questClaims === "object" ? character.questClaims : {};
      return definitions.reduce((count, quest) => {
        if (!quest || !quest.id) return count;
        if (claims[quest.id] === true) return count;
        const autoClaimOnComplete = Boolean(quest.reward && quest.reward.autoClaimOnComplete);
        if (autoClaimOnComplete) return count;
        const target = Math.max(1, Math.floor(Number((quest.requirement && quest.requirement.target) || 1)));
        const current = getMainQuestProgressValue(character, quest.requirement);
        if (current >= target) {
          return count + 1;
        }
        return count;
      }, 0);
    }

    function getClaimableBountyCount(character) {
      if (!character) return 0;
      const enemyDefinitions = window.RL_DATA.ENEMIES || {};
      const discovered = character.bestiaryDiscoveries && typeof character.bestiaryDiscoveries === "object"
        ? character.bestiaryDiscoveries
        : {};
      const discoveredEnemyIds = Object.keys(enemyDefinitions).filter((enemyTypeId) => discovered[enemyTypeId] === true);
      if (!discoveredEnemyIds.length) return 0;

      const enemyKillCounts = character.enemyKillCounts && typeof character.enemyKillCounts === "object"
        ? character.enemyKillCounts
        : {};
      const bountyClaims = character.bountyClaims && typeof character.bountyClaims === "object"
        ? character.bountyClaims
        : {};

      return discoveredEnemyIds.reduce((count, enemyTypeId) => {
        const bountyProfile = window.RL_SAVE && typeof window.RL_SAVE.getBountyProfileForEnemy === "function"
          ? window.RL_SAVE.getBountyProfileForEnemy(enemyTypeId)
          : null;
        if (!bountyProfile) return count;

        const stepCount = Math.max(1, Math.floor(Number(bountyProfile.stepCount || 1)));
        const claimedSteps = Math.max(0, Math.floor(Number(bountyClaims[enemyTypeId] || 0)));
        if (claimedSteps >= stepCount) return count;

        const steps = Array.isArray(bountyProfile.steps) ? bountyProfile.steps : [];
        const nextStep = steps[Math.max(0, Math.min(steps.length - 1, claimedSteps))];
        if (!nextStep) return count;

        const target = Math.max(1, Math.floor(Number(nextStep.target || bountyProfile.target || 1)));
        const current = Math.max(0, Math.floor(Number(enemyKillCounts[enemyTypeId] || 0)));
        if (current >= target) {
          return count + 1;
        }
        return count;
      }, 0);
    }

    function getQuestClaimCounts(character) {
      if (!character) {
        return { main: 0, bounties: 0, total: 0 };
      }
      const mainQuestDefinitions = getMainQuestDefinitions();
      const main = getClaimableMainQuestCount(character, mainQuestDefinitions);
      const bounties = getClaimableBountyCount(character);
      return {
        main,
        bounties,
        total: main + bounties,
        mainQuestDefinitions
      };
    }

    function renderCharacterDetails(character, options) {
      state.selectedCharacter = character || null;
      if (options && options.resetTab) {
        state.activeSkillTab = "weapons";
      }
      state.skillTreeProgress = normalizeSkillTreeProgress(options && options.skillTreeProgress);

      if (!character) {
        if (dom.classTabBtn) {
          dom.classTabBtn.textContent = "Attributes";
        }
        if (dom.skillsTabBtn) {
          dom.skillsTabBtn.textContent = "Skills";
        }
        if (dom.questsTabBtn) {
          dom.questsTabBtn.textContent = "Quests";
        }
        dom.characterSummary.innerHTML = "";
        dom.skillTreeContent.innerHTML = "";
        dom.skillTreeContent.classList.remove("inventory-content");
        setVisible(dom.skillTreeEmpty, true);
        setVisible(dom.skillTreeView, false);
        dom.deleteCharacterBtn.disabled = true;
        if (dom.merchantTabBtn) {
          setVisible(dom.merchantTabBtn, true);
        }
        state.pendingDeleteCharacterId = null;
        setVisible(dom.deleteCharacterOverlay, false);
        renderLevelSelector(null, null);
        renderDifficultySelector(null, null);
        return;
      }

      const merchantUnlocked = Boolean(
        character.merchantUnlocked || (character.unlockedFeatures && character.unlockedFeatures.merchant)
      );
      if (dom.merchantTabBtn) {
        setVisible(dom.merchantTabBtn, merchantUnlocked);
      }
      if (!merchantUnlocked && state.activeSkillTab === "merchant") {
        state.activeSkillTab = "quests";
      }

      setVisible(dom.skillTreeEmpty, false);
      setVisible(dom.skillTreeView, true);
      dom.deleteCharacterBtn.disabled = false;
      if (dom.classTabBtn) {
        const unspentAttributePoints = Math.max(
          0,
          Math.floor(Number(character.attributePoints || character.classSkillPoints || 0))
        );
        dom.classTabBtn.textContent =
          unspentAttributePoints > 0 ? `Attributes (${unspentAttributePoints})` : "Attributes";
      }
      if (dom.questsTabBtn) {
        const questCounts = getQuestClaimCounts(character);
        dom.questsTabBtn.textContent =
          questCounts.total > 0 ? `Quests (${questCounts.total})` : "Quests";
      }
      renderLevelSelector(character, options || null);
      renderDifficultySelector(character, options || null);
      renderCharacterSummary(character);
      setActiveSkillTab(state.activeSkillTab);
    }

    function renderCharacterSummary(character) {
      dom.characterSummary.innerHTML = "";
      const classInfo = window.RL_DATA.CLASSES[character.classId];
      const raceInfo = window.RL_DATA.RACES[character.race];
      const items = [
        { label: "Character", value: character.name },
        { label: "Race", value: raceInfo ? raceInfo.label : toTitle(character.race) },
        { label: "Class", value: classInfo ? classInfo.label : toTitle(character.classId) },
        { label: "Gold", value: String(character.gold) },
        { label: "Total Kills", value: formatCompactCount(character.enemyKills || 0) },
        { label: "XP", value: String(character.legacyXp) },
        { label: "Level", value: String(character.legacyLevel || 1) },
        { label: "Attribute Points", value: String(character.attributePoints || character.classSkillPoints || 0) },
        { label: "Best Time", value: formatTime(character.bestSurvivalTime || 0) }
      ];

      items.forEach((item) => {
        const cell = createElement("div", "summary-item");
        const label = createElement("strong", "", item.label);
        const value = createElement("span", "", item.value);
        cell.append(label, value);
        dom.characterSummary.appendChild(cell);
      });

      const xpIntoLevel = Math.max(0, Math.floor(Number(character.legacyXpIntoLevel || 0)));
      const xpToNextLevel = Math.max(1, Math.floor(Number(character.legacyXpToNextLevel || 1)));
      const xpProgress = Math.max(0, Math.min(1, xpIntoLevel / xpToNextLevel));
      const xpTooltip = `XP to next level: ${formatInteger(xpIntoLevel)} / ${formatInteger(xpToNextLevel)}`;

      const xpBar = createElement("div", "summary-xp");
      xpBar.title = xpTooltip;

      const xpHead = createElement("div", "summary-xp-head");
      xpHead.append(
        createElement("strong", "", "XP"),
        createElement("span", "", `${(xpProgress * 100).toFixed(1)}%`)
      );

      const xpTrack = createElement("div", "summary-xp-track");
      xpTrack.title = xpTooltip;
      const xpFill = createElement("div", "summary-xp-fill");
      xpFill.style.width = `${(xpProgress * 100).toFixed(2)}%`;
      xpTrack.appendChild(xpFill);

      const xpText = createElement(
        "div",
        "summary-xp-value",
        `${formatInteger(xpIntoLevel)} / ${formatInteger(xpToNextLevel)}`
      );

      xpBar.append(xpHead, xpTrack, xpText);
      dom.characterSummary.appendChild(xpBar);
    }

    function setActiveSkillTab(tabName) {
      if (!state.selectedCharacter) return;
      closeInventoryContextMenu();
      const merchantUnlocked = Boolean(
        state.selectedCharacter.merchantUnlocked ||
          (state.selectedCharacter.unlockedFeatures && state.selectedCharacter.unlockedFeatures.merchant)
      );
      if (tabName === "class") {
        state.activeSkillTab = "class";
      } else if (tabName === "skills") {
        state.activeSkillTab = "skills";
      } else if (tabName === "inventory") {
        state.activeSkillTab = "inventory";
      } else if (tabName === "merchant" && merchantUnlocked) {
        state.activeSkillTab = "merchant";
      } else if (tabName === "quests") {
        state.activeSkillTab = "quests";
      } else if (tabName === "bestiary") {
        state.activeSkillTab = "bestiary";
      } else {
        state.activeSkillTab = "weapons";
      }
      dom.weaponsTabBtn.classList.toggle("active", state.activeSkillTab === "weapons");
      dom.classTabBtn.classList.toggle("active", state.activeSkillTab === "class");
      if (dom.skillsTabBtn) {
        dom.skillsTabBtn.classList.toggle("active", state.activeSkillTab === "skills");
      }
      dom.inventoryTabBtn.classList.toggle("active", state.activeSkillTab === "inventory");
      if (dom.merchantTabBtn) {
        dom.merchantTabBtn.classList.toggle("active", state.activeSkillTab === "merchant");
      }
      if (dom.questsTabBtn) {
        dom.questsTabBtn.classList.toggle("active", state.activeSkillTab === "quests");
      }
      if (dom.bestiaryTabBtn) {
        dom.bestiaryTabBtn.classList.toggle("active", state.activeSkillTab === "bestiary");
      }
      renderSkillTreeTab();
    }

    function renderSkillTreeTab() {
      closeInventoryContextMenu();
      dom.skillTreeContent.innerHTML = "";
      dom.skillTreeContent.classList.remove("inventory-content");
      dom.skillTreeContent.classList.remove("quest-content");
      if (!state.selectedCharacter) return;

      const classId = state.selectedCharacter.classId || state.selectedCharacter.class;
      const treeDefinition = window.RL_DATA.SKILL_TREES[classId];
      if (!treeDefinition) {
        const fallback = createElement("div", "skill-empty", "Skill tree not available for this class.");
        dom.skillTreeContent.appendChild(fallback);
        return;
      }

      if (state.activeSkillTab === "class") {
        renderClassTab(treeDefinition.classTree);
      } else if (state.activeSkillTab === "skills") {
        renderSkillsTab(state.selectedCharacter);
      } else if (state.activeSkillTab === "inventory") {
        dom.skillTreeContent.classList.add("inventory-content");
        renderInventoryTab(state.selectedCharacter);
      } else if (state.activeSkillTab === "merchant") {
        renderMerchantTab(state.selectedCharacter);
      } else if (state.activeSkillTab === "quests") {
        dom.skillTreeContent.classList.add("quest-content");
        renderQuestsTab(state.selectedCharacter);
      } else if (state.activeSkillTab === "bestiary") {
        renderBestiaryTab(state.selectedCharacter);
      } else {
        renderWeaponsTab(treeDefinition.weapons);
      }
    }

    function renderWeaponsTab(weaponsDefinition) {
      if (!weaponsDefinition) return;

      const title = createElement("div", "skill-title", weaponsDefinition.title);
      const subtitle = createElement("div", "skill-subtitle", weaponsDefinition.subtitle);
      dom.skillTreeContent.append(title, subtitle);

      weaponsDefinition.categories.forEach((category) => {
        const categoryCard = createElement("div", "category-card");
        const categoryHeader = createElement("div", "category-header", category.label);
        const categoryDesc = createElement("div", "category-desc", category.description);
        categoryCard.append(categoryHeader, categoryDesc);

        category.weapons.forEach((weapon) => {
          const weaponCard = createElement("div", "weapon-card");
          const weaponName = createElement("div", "weapon-name", weapon.label);
          const weaponDesc = createElement("div", "weapon-desc", weapon.description);
          const upgrades = createElement("ul", "upgrade-list");

          weapon.paths.forEach((path) => {
            const rank = getProgressRank(path.upgradeId);
            const node = createElement("li", "upgrade-node");
            const icon = createSkillIcon(
              resolveSkillIconPathById(path.upgradeId),
              path.label || path.upgradeId,
              "skill-inline-icon"
            );
            const copy = createElement("div", "upgrade-node-copy");
            const label = createElement("div", "upgrade-node-title", path.label);
            const desc = createElement("div", "upgrade-node-desc", path.description);
            const level = createElement("span", "upgrade-level", `${rank}/${path.maxLevel}`);
            copy.append(label, desc, level);
            if (icon) {
              node.appendChild(icon);
            } else {
              node.classList.add("upgrade-node-no-icon");
            }
            node.appendChild(copy);
            upgrades.appendChild(node);
          });

          if (weapon.ultimate) {
            const ultimateRank = getProgressRank(weapon.ultimate.upgradeId);
            const unlocked = isUltimateUnlocked(weapon.ultimate.upgradeId);
            const ultimateNode = createElement("li", "upgrade-node ultimate-node");
            const icon = createSkillIcon(
              resolveSkillIconPathById(weapon.ultimate.upgradeId),
              weapon.ultimate.label || weapon.ultimate.upgradeId,
              "skill-inline-icon"
            );
            const copy = createElement("div", "upgrade-node-copy");
            const label = createElement("div", "upgrade-node-title", weapon.ultimate.label);
            const desc = createElement("div", "upgrade-node-desc", weapon.ultimate.description);
            const status = createElement("span", "ultimate-status");

            if (ultimateRank > 0) {
              ultimateNode.classList.add("ultimate-complete");
              status.textContent = "Complete";
            } else if (unlocked) {
              ultimateNode.classList.add("ultimate-available");
              status.textContent = "Available";
            } else {
              ultimateNode.classList.add("ultimate-locked");
              status.textContent = "";
            }

            copy.append(label, desc);
            if (status.textContent) {
              copy.appendChild(status);
            }
            if (icon) {
              ultimateNode.appendChild(icon);
            } else {
              ultimateNode.classList.add("upgrade-node-no-icon");
            }
            ultimateNode.appendChild(copy);
            upgrades.appendChild(ultimateNode);
          }

          weaponCard.append(weaponName, weaponDesc, upgrades);
          categoryCard.appendChild(weaponCard);
        });

        dom.skillTreeContent.appendChild(categoryCard);
      });
    }

    function renderClassTab(classDefinition) {
      if (!classDefinition) return;
      const title = createElement("div", "skill-title", classDefinition.title);
      const subtitle = createElement("div", "skill-subtitle", classDefinition.subtitle);
      const character = state.selectedCharacter;
      const maxLevel = Math.max(1, Math.floor(classDefinition.maxLevel || 10));
      const attributes = Array.isArray(classDefinition.attributes) ? classDefinition.attributes : [];
      const availablePoints = (character && (character.attributePoints || character.classSkillPoints)) || 0;

      const panel = createElement("div", "class-placeholder");
      const pointsBar = createElement("div", "class-points-bar");
      pointsBar.appendChild(
        createElement(
          "div",
          "class-points-primary",
          `Unspent Attribute Points: ${availablePoints}`
        )
      );
      pointsBar.appendChild(
        createElement(
          "div",
          "class-points-secondary",
          `Level ${(character && character.legacyLevel) || 1}`
        )
      );
      panel.appendChild(pointsBar);

      const introList = Array.isArray(classDefinition.intro) ? classDefinition.intro : classDefinition.philosophy;
      if (Array.isArray(introList)) {
        introList.forEach((line) => {
          panel.appendChild(createElement("p", "class-flavor", line));
        });
      }

      if (attributes.length) {
        const branchGrid = createElement("div", "class-branch-grid");
        attributes.forEach((attribute) => {
          const currentLevel = Number((character && character.attributeLevels && character.attributeLevels[attribute.id]) || 0);
          const isMaxed = currentLevel >= maxLevel;
          const spendable = availablePoints > 0 && !isMaxed;
          const nextThreshold = (attribute.thresholds || []).find((threshold) => currentLevel < threshold.level) || null;
          const progress = Math.max(0, Math.min(1, currentLevel / maxLevel));

          const branchCard = createElement("section", "class-branch-card");
          branchCard.appendChild(createElement("div", "class-branch-title", attribute.label));
          branchCard.appendChild(createElement("div", "class-branch-focus", attribute.description || ""));

          const levelRow = createElement("div", "attribute-level-row");
          levelRow.appendChild(createElement("div", "attribute-level-text", `Level ${currentLevel}/${maxLevel}`));
          const barTrack = createElement("div", "attribute-level-track");
          const barFill = createElement("div", "attribute-level-fill");
          barFill.style.width = `${(progress * 100).toFixed(1)}%`;
          barTrack.appendChild(barFill);
          levelRow.appendChild(barTrack);
          branchCard.appendChild(levelRow);

          if (attribute.summaryEffect) {
            branchCard.appendChild(createElement("div", "attribute-summary", attribute.summaryEffect));
          }

          if (Array.isArray(attribute.scaling) && attribute.scaling.length) {
            const scalingList = createElement("ul", "attribute-effect-list");
            attribute.scaling.forEach((effect) => {
              scalingList.appendChild(createElement("li", "", effect));
            });
            branchCard.appendChild(scalingList);
          }

          if (Array.isArray(attribute.thresholds) && attribute.thresholds.length) {
            const thresholds = createElement("div", "attribute-thresholds");
            thresholds.appendChild(createElement("div", "attribute-thresholds-title", "Thresholds"));
            const thresholdList = createElement("ul", "attribute-threshold-list");
            attribute.thresholds.forEach((threshold) => {
              const item = createElement("li", "attribute-threshold-item");
              if (currentLevel >= threshold.level) {
                item.classList.add("attribute-threshold-unlocked");
              } else if (nextThreshold && nextThreshold.level === threshold.level) {
                item.classList.add("attribute-threshold-next");
              }
              const header = createElement("div", "attribute-threshold-header");
              header.appendChild(createElement("strong", "", `Lv.${threshold.level} ${threshold.label || ""}`.trim()));
              item.appendChild(header);
              if (threshold.description) {
                item.appendChild(createElement("div", "attribute-threshold-desc", threshold.description));
              }
              thresholdList.appendChild(item);
            });
            thresholds.appendChild(thresholdList);
            branchCard.appendChild(thresholds);
          }

          const spendStatus = createElement(
            "div",
            "class-node-status",
            isMaxed ? "Maxed" : spendable ? "Available - spend 1 point" : "Not enough points"
          );
          branchCard.appendChild(spendStatus);

          if (!isMaxed && handlers.onSpendClassPoint) {
            const spendButton = createElement("button", "btn");
            spendButton.type = "button";
            spendButton.textContent = "Spend Point";
            spendButton.disabled = !spendable;
            spendButton.addEventListener("click", () => {
              handlers.onSpendClassPoint(attribute.id);
            });
            branchCard.appendChild(spendButton);
          }

          if (nextThreshold) {
            branchCard.appendChild(
              createElement(
                "div",
                "class-node-req",
                `Next threshold at Lv.${nextThreshold.level}: ${nextThreshold.label || "Attribute milestone"}`
              )
            );
          } else {
            branchCard.appendChild(createElement("div", "class-node-req", "All thresholds unlocked."));
          }

          branchGrid.appendChild(branchCard);
          });
        panel.appendChild(branchGrid);
      }

      if (Array.isArray(classDefinition.buildIdentityExamples) && classDefinition.buildIdentityExamples.length) {
        const builds = createElement("div", "class-builds");
        builds.appendChild(createElement("div", "class-builds-title", "Build Identity Examples"));
        const list = createElement("ul", "class-points");
        classDefinition.buildIdentityExamples.forEach((item) => {
          list.appendChild(createElement("li", "", item));
        });
        builds.appendChild(list);
        panel.appendChild(builds);
      }

      if (Array.isArray(classDefinition.notes) && classDefinition.notes.length) {
        const notes = createElement("div", "class-notes");
        classDefinition.notes.forEach((note) => {
          notes.appendChild(createElement("div", "class-note", note));
        });
        panel.appendChild(notes);
      }

      dom.skillTreeContent.append(title, subtitle, panel);
    }

    function getClassSkillConfiguration(character) {
      const classId = character && (character.classId || character.class);
      if (!classId) return null;
      const allClassSkills = (window.RL_DATA && window.RL_DATA.CLASS_SKILLS) || {};
      const config = allClassSkills[classId];
      if (!config || !Array.isArray(config.skills)) return null;
      return config;
    }

    function getClassSkillViewModels(character) {
      const config = getClassSkillConfiguration(character);
      if (!config) return [];
      const classId = character && (character.classId || character.class);
      const equippedIds = Array.isArray(character && character.equippedClassSkillIds)
        ? character.equippedClassSkillIds.map((id) => String(id || "").trim()).filter((id) => id.length > 0)
        : [];
      const equippedSet = new Set(equippedIds);
      return config.skills
        .filter((skill) => {
          if (!skill || typeof skill !== "object") return false;
          const classIds = Array.isArray(skill.classIds) ? skill.classIds : [];
          if (!classIds.length) return true;
          return classIds.includes(classId);
        })
        .map((skill) => {
          const unlockRunLevel = 1;
          return {
            ...skill,
            unlockRunLevel,
            availableFromStart: true,
            isEquipped: equippedSet.has(String(skill.id || "").trim())
          };
        })
        .sort((a, b) => a.unlockRunLevel - b.unlockRunLevel);
    }

    function renderSkillsTab(character) {
      if (!character) return;
      const config = getClassSkillConfiguration(character);
      const skills = getClassSkillViewModels(character);
      if (!config || !skills.length) {
        dom.skillTreeContent.appendChild(
          createElement("div", "skill-empty", "No class skills are configured for this character class.")
        );
        return;
      }

      const title = createElement("div", "skill-title", config.title || "Skills");
      const subtitle = createElement(
        "div",
        "skill-subtitle",
        config.subtitle || "Choose which class skills are active when a run begins."
      );
      const panel = createElement("div", "class-skills-panel");
      const equippedCount = skills.reduce((count, skill) => (skill.isEquipped ? count + 1 : count), 0);
      panel.appendChild(
        createElement(
          "div",
          "class-skills-progress",
          `Equipped for run: ${equippedCount}/${MAX_CLASS_SKILLS_PER_RUN}`
        )
      );

      const list = createElement("div", "class-skills-list");
      skills.forEach((skill) => {
        const card = createElement("article", "class-skill-card");
        if (skill.availableFromStart) {
          card.classList.add("class-skill-card-unlocked");
        } else {
          card.classList.add("class-skill-card-locked");
        }

        const header = createElement("div", "class-skill-head");
        const icon = createSkillIcon(
          resolveSkillIconPathById(skill.id),
          skill.name || skill.id,
          "class-skill-icon"
        );
        const layout = createElement("div", "class-skill-layout");
        const content = createElement("div", "class-skill-content");
        if (icon) {
          layout.appendChild(icon);
        } else {
          layout.classList.add("class-skill-layout-no-icon");
        }
        header.appendChild(createElement("div", "class-skill-name", skill.name || toTitle(skill.id)));
        content.appendChild(header);

        const equipLabel = createElement("label", "class-skill-equip-toggle class-skill-equip-corner");
        equipLabel.appendChild(createElement("span", "class-skill-equip-label", "Equipped for run start"));
        const equipInput = createElement("input", "class-skill-equip-input");
        equipInput.type = "checkbox";
        equipInput.checked = Boolean(skill.isEquipped);
        equipInput.setAttribute("aria-label", `Equip ${skill.name || toTitle(skill.id)} for run`);
        equipLabel.title = "Equip for run";
        const canEquipMore = equippedCount < MAX_CLASS_SKILLS_PER_RUN;
        if (!skill.isEquipped && !canEquipMore) {
          equipInput.disabled = true;
        }
        equipInput.addEventListener("change", () => {
          if (!handlers.onSetEquippedClassSkills) return;
          const nextSet = new Set(
            skills.filter((entry) => entry && entry.isEquipped).map((entry) => String(entry.id || "").trim())
          );
          const normalizedSkillId = String(skill.id || "").trim();
          if (equipInput.checked) {
            nextSet.add(normalizedSkillId);
          } else {
            nextSet.delete(normalizedSkillId);
          }
          const orderedIds = skills
            .map((entry) => String((entry && entry.id) || "").trim())
            .filter((id) => id && nextSet.has(id))
            .slice(0, MAX_CLASS_SKILLS_PER_RUN);
          const result = handlers.onSetEquippedClassSkills(orderedIds);
          if (result && result.ok === false) {
            equipInput.checked = Boolean(skill.isEquipped);
          }
        });
        equipLabel.appendChild(equipInput);
        card.appendChild(equipLabel);

        const metaParts = [];
        if (skill.type) metaParts.push(toTitle(String(skill.type).replace(/_/g, " ")));
        if (skill.category) metaParts.push(skill.category);
        if (skill.currentLevel) metaParts.push(`Rank ${Math.max(1, Math.floor(Number(skill.currentLevel || 1)))}`);
        content.appendChild(createElement("div", "class-skill-meta", metaParts.join(" | ")));

        if (skill.description) {
          content.appendChild(createElement("div", "class-skill-desc", skill.description));
        }

        if (skill.keybind) {
          content.appendChild(createElement("div", "class-skill-keybind", `Keybind: ${skill.keybind}`));
        }

        const baseValues = skill.baseValues && typeof skill.baseValues === "object" ? skill.baseValues : null;
        if (baseValues) {
          const baseText = Object.entries(baseValues)
            .map(([key, value]) => {
              if (typeof value === "number") {
                if (key.toLowerCase().includes("pct")) return `${toTitle(key)} ${Math.round(value * 100)}%`;
                return `${toTitle(key)} ${value}`;
              }
              return `${toTitle(key)} ${value}`;
            })
            .join(" | ");
          if (baseText) {
            content.appendChild(createElement("div", "class-skill-base", `Base: ${baseText}`));
          }
        }

        layout.appendChild(content);
        card.appendChild(layout);

        list.appendChild(card);
      });
      panel.appendChild(list);
      dom.skillTreeContent.append(title, subtitle, panel);
    }

    function getActiveStorageTabId(character) {
      const fallback = "general";
      if (!character) return fallback;
      const fromState = state.inventoryStorageTabByCharacter[character.id];
      return fromState || fallback;
    }

    function setActiveStorageTabId(character, tabId) {
      if (!character) return;
      state.inventoryStorageTabByCharacter[character.id] = tabId;
    }

    function getActiveMerchantBuyCategoryTabId(character) {
      const fallback = "weapons";
      if (!character) return fallback;
      const fromState = state.merchantBuyCategoryTabByCharacter[character.id];
      if (fromState === "armor") return "armor";
      if (fromState === "utility") return "utility";
      if (fromState === "buyback") return "buyback";
      return fallback;
    }

    function setActiveMerchantBuyCategoryTabId(character, tabId) {
      if (!character) return;
      if (tabId === "armor") {
        state.merchantBuyCategoryTabByCharacter[character.id] = "armor";
        return;
      }
      if (tabId === "utility") {
        state.merchantBuyCategoryTabByCharacter[character.id] = "utility";
        return;
      }
      if (tabId === "buyback") {
        state.merchantBuyCategoryTabByCharacter[character.id] = "buyback";
        return;
      }
      state.merchantBuyCategoryTabByCharacter[character.id] = "weapons";
    }

    function getActiveQuestViewTabId(character) {
      const fallback = "quests";
      if (!character) return fallback;
      const fromState = state.questViewTabByCharacter[character.id];
      return fromState === "bounties" ? "bounties" : fallback;
    }

    function setActiveQuestViewTabId(character, tabId) {
      if (!character) return;
      state.questViewTabByCharacter[character.id] = tabId === "bounties" ? "bounties" : "quests";
    }

    function normalizeStorageLocation(location) {
      if (!location || typeof location !== "object") return null;
      const tabId = typeof location.tabId === "string" ? location.tabId : "";
      const index = Number(location.index);
      const allowedTabs = ["general", "reserve1", "reserve2"];
      if (!allowedTabs.includes(tabId)) return null;
      if (!Number.isInteger(index) || index < 0 || index >= 30) return null;
      return { tabId, index };
    }

    function revealStorageLocation(character, location) {
      if (!character) return;
      const normalized = normalizeStorageLocation(location);
      if (!normalized) return;
      state.selectedCharacter = character;
      setActiveStorageTabId(character, normalized.tabId);
      state.inventoryRevealByCharacter[character.id] = {
        ...normalized,
        expiresAt: Date.now() + 2600
      };
      setActiveSkillTab("inventory");
    }

    function renderInventoryTab(character, options) {
      if (!character) return;
      const safeOptions = options || {};
      const onSellInventoryItem =
        typeof safeOptions.onSellInventoryItem === "function" ? safeOptions.onSellInventoryItem : handlers.onSellInventoryItem;
      const getSellPrice =
        typeof safeOptions.getSellPrice === "function"
          ? safeOptions.getSellPrice
          : window.RL_SAVE && typeof window.RL_SAVE.calculateMerchantSellPrice === "function"
          ? window.RL_SAVE.calculateMerchantSellPrice
          : null;
      const mountEl = safeOptions.mountEl || dom.skillTreeContent;
      const merchantUnlocked = Boolean(
        character.merchantUnlocked || (character.unlockedFeatures && character.unlockedFeatures.merchant)
      );
      const canUseInventorySellMenu =
        merchantUnlocked && typeof onSellInventoryItem === "function" && typeof getSellPrice === "function";

      const inventory = character.inventory || {};
      const equipment = inventory.equipment || {};
      const storageTabs = inventory.storageTabs || {};
      const tabDefinitions = [
        { id: "general", label: "General" },
        { id: "reserve1", label: "Tab 2" },
        { id: "reserve2", label: "Tab 3" }
      ];

      const activeStorageTabId = getActiveStorageTabId(character);
      const safeTabId = tabDefinitions.some((tab) => tab.id === activeStorageTabId) ? activeStorageTabId : "general";
      setActiveStorageTabId(character, safeTabId);
      const revealState = state.inventoryRevealByCharacter[character.id] || null;
      let revealedSlotElement = null;
      const isRevealActive = revealState && Date.now() <= Number(revealState.expiresAt || 0);
      if (revealState && !isRevealActive) {
        delete state.inventoryRevealByCharacter[character.id];
      }

      const rarityLabel = (rarityId) => {
        const rarity = window.RL_DATA.ITEM_RARITIES && window.RL_DATA.ITEM_RARITIES[rarityId];
        return rarity ? rarity.label : "";
      };

      const itemTypeLabel = (itemTypeId) => {
        const itemType = window.RL_DATA.ITEM_TYPES && window.RL_DATA.ITEM_TYPES[itemTypeId];
        return itemType ? itemType.label : "";
      };

      const isWeaponItemType = (itemTypeId) => itemTypeId === "melee_weapon" || itemTypeId === "ranged_weapon";

      const getMasteryText = (itemValue) => {
        if (!itemValue || typeof itemValue !== "object" || !isWeaponItemType(itemValue.itemType)) return "";
        const masteryConfig = (window.RL_DATA && window.RL_DATA.WEAPON_MASTERY) || {};
        const rarityId = String(itemValue.rarity || "grey").trim().toLowerCase() || "grey";
        const rawThresholds = masteryConfig.thresholdsByRarity && masteryConfig.thresholdsByRarity[rarityId];
        const thresholds = Array.isArray(rawThresholds)
          ? rawThresholds
              .map((value) => Math.max(1, Math.floor(Number(value || 0))))
              .filter((value) => Number.isFinite(value) && value > 0)
          : [];
        const normalizedThresholds = [];
        thresholds.forEach((value) => {
          if (!normalizedThresholds.length || value > normalizedThresholds[normalizedThresholds.length - 1]) {
            normalizedThresholds.push(value);
          }
        });
        if (!normalizedThresholds.length) {
          normalizedThresholds.push(100);
        }
        const tierCapRaw = Number(masteryConfig.tiersByRarity && masteryConfig.tiersByRarity[rarityId]);
        const tierCap = Math.max(
          1,
          Math.min(
            normalizedThresholds.length,
            Number.isNaN(tierCapRaw) ? normalizedThresholds.length : Math.floor(tierCapRaw)
          )
        );
        const mastery = itemValue.mastery && typeof itemValue.mastery === "object" ? itemValue.mastery : {};
        const killsTotal = Math.max(0, Math.floor(Number(mastery.killsTotal || 0)));
        let tiersFromKills = 0;
        for (let i = 0; i < normalizedThresholds.length && tiersFromKills < tierCap; i += 1) {
          if (killsTotal >= normalizedThresholds[i]) {
            tiersFromKills += 1;
          } else {
            break;
          }
        }
        const explicitTiers = Math.max(0, Math.floor(Number(mastery.tiersUnlocked || 0)));
        const tiersUnlocked = Math.max(0, Math.min(tierCap, Math.max(tiersFromKills, explicitTiers)));
        const nextThresholdIndex = Math.min(tiersUnlocked, normalizedThresholds.length - 1);
        const nextThreshold = Math.max(1, normalizedThresholds[nextThresholdIndex] || normalizedThresholds[0]);
        const perTierBonusRaw = Number(
          masteryConfig.perTierFlatBonusByRarity && masteryConfig.perTierFlatBonusByRarity[rarityId]
        );
        const perTierBonus = Number.isNaN(perTierBonusRaw) ? 1 : Math.max(0, Math.floor(perTierBonusRaw));
        const totalBonus = tiersUnlocked * perTierBonus;
        const displayedKills = Math.min(killsTotal, nextThreshold);
        return `Mastery T${tiersUnlocked}/${tierCap} | ${displayedKills}/${nextThreshold} kills | +${totalBonus} dmg`;
      };

      const normalizeStatKey = (statKey) => {
        if (statKey === "meleeDamageBonus") return "slashingDamageBonus";
        if (statKey === "rangedDamageBonus") return "piercingDamageBonus";
        return statKey;
      };

      const formatStatLabel = (statKey, rawAmount) => {
        const amount = Number(rawAmount);
        if (Number.isNaN(amount)) return "";
        const key = normalizeStatKey(statKey);
        if (key === "slashingDamageBonus") return `+${amount} Slashing Damage`;
        if (key === "piercingDamageBonus") return `+${amount} Piercing Damage`;
        if (key === "bludgeoningDamageBonus") return `+${amount} Bludgeoning Damage`;
        if (key === "baseWeaponDamage") return `+${amount} Base Weapon Damage`;
        if (key === "armor") return `+${amount} Armor`;
        if (key === "maxHpBonus") return `+${amount} Max HP`;
        if (key === "attackSpeedBonusPct") return `${amount >= 0 ? "+" : ""}${amount}% Attack Speed`;
        if (key === "moveSpeedBonusPct") return `${amount >= 0 ? "+" : ""}${amount}% Move Speed`;
        if (key === "statusEffectResistPct") return `${amount >= 0 ? "+" : ""}${amount}% Status Resist`;
        const label = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ");
        const normalized = label.charAt(0).toUpperCase() + label.slice(1);
        return `${amount >= 0 ? "+" : ""}${amount} ${normalized}`.trim();
      };

      const getStatText = (statsObj) => {
        const stats = statsObj && typeof statsObj === "object" ? statsObj : {};
        return Object.entries(stats)
          .map(([key, rawValue]) => formatStatLabel(key, rawValue))
          .filter(Boolean)
          .join(" | ");
      };

      const getItemDisplay = (itemValue) => {
        if (!itemValue) {
          return {
            name: "Empty",
            meta: "",
            stats: "",
            mastery: "",
            rarityTextClass: "",
            rarityBorderClass: "",
            iconPath: ""
          };
        }
        if (typeof itemValue === "string") {
          return {
            name: itemValue,
            meta: "",
            stats: "",
            mastery: "",
            rarityTextClass: "",
            rarityBorderClass: "",
            iconPath: ""
          };
        }
        const name = itemValue.name || itemValue.templateId || "Item";
        const rarity = rarityLabel(itemValue.rarity);
        const rarityTextClass = getRarityTextClass(itemValue.rarity);
        const rarityBorderClass = getRarityBorderClass(itemValue.rarity);
        const type = itemTypeLabel(itemValue.itemType);
        const weaponWeight = Number(itemValue.weaponSlotWeight);
        const hasWeaponWeight =
          (itemValue.itemType === "melee_weapon" || itemValue.itemType === "ranged_weapon") &&
          !Number.isNaN(weaponWeight);
        const weightLabel = hasWeaponWeight
          ? `${Math.max(1, Math.min(2, Math.floor(weaponWeight)))} Slot${Math.floor(weaponWeight) === 1 ? "" : "s"}`
          : "";
        const metaParts = [rarity, type, weightLabel].filter(Boolean);
        const statText = getStatText(itemValue.stats);
        const masteryText = getMasteryText(itemValue);
        const iconPath = resolveItemIconPath(itemValue);
        return {
          name,
          meta: metaParts.join(" | "),
          stats: statText,
          mastery: masteryText,
          rarityTextClass,
          rarityBorderClass,
          iconPath
        };
      };

      const normalizeEquipmentSlotKey = (slotKey) => {
        if (!slotKey || typeof slotKey !== "string") return "";
        if (slotKey === "primaryWeapon") return "primaryMeleeWeapon";
        if (slotKey === "secondaryWeapon") return "rangedWeapon";
        return slotKey;
      };

      const getAllowedSlotsForItem = (item) => {
        if (!item || typeof item !== "object") return [];
        const rawSlots = Array.isArray(item.allowedSlots)
          ? item.allowedSlots
          : typeof item.allowedSlot === "string"
          ? [item.allowedSlot]
          : [];
        const normalizedSlots = rawSlots
          .map((slotKey) => normalizeEquipmentSlotKey(slotKey))
          .filter((slotKey, index, list) => slotKey && list.indexOf(slotKey) === index);
        if (normalizedSlots.length) return normalizedSlots;
        if (item.itemType === "melee_weapon") return ["primaryMeleeWeapon", "secondaryMeleeWeapon"];
        if (item.itemType === "ranged_weapon") return ["rangedWeapon"];
        if (item.itemType === "helmet") return ["helmet"];
        if (item.itemType === "chest") return ["chest"];
        if (item.itemType === "leggings") return ["leggings"];
        if (item.itemType === "gloves") return ["gloves"];
        if (item.itemType === "boots") return ["boots"];
        if (item.itemType === "ring") return ["ring1", "ring2"];
        if (item.itemType === "amulet") return ["amulet"];
        return [];
      };

      const serializeLocation = (location) => JSON.stringify(location);
      const parseLocation = (serialized) => {
        try {
          return JSON.parse(serialized);
        } catch (error) {
          return null;
        }
      };

      const startDrag = (event, sourceLocation) => {
        state.draggingInventorySource = sourceLocation;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", serializeLocation(sourceLocation));
      };

      const clearDragState = () => {
        state.draggingInventorySource = null;
      };

      const clearDropHighlight = (element) => {
        element.classList.remove("inventory-drop-valid");
        element.classList.remove("inventory-drop-invalid");
      };

      const isValidLocation = (location) => {
        if (!location || typeof location !== "object") return false;
        if (location.kind === "equipment") {
          return typeof location.slot === "string" && typeof equipment[location.slot] !== "undefined";
        }
        if (location.kind === "storage") {
          if (!Array.isArray(storageTabs[location.tabId])) return false;
          return Number.isInteger(location.index) && location.index >= 0 && location.index < 30;
        }
        return false;
      };

      const getItemAtLocation = (location) => {
        if (!isValidLocation(location)) return null;
        if (location.kind === "equipment") return equipment[location.slot] || null;
        return storageTabs[location.tabId][location.index] || null;
      };

      const fitsTargetLocation = (item, location) => {
        if (!item) return true;
        if (location.kind !== "equipment") return true;
        return getAllowedSlotsForItem(item).includes(location.slot);
      };

      const canDropFromTo = (fromLocation, toLocation) => {
        if (!isValidLocation(fromLocation) || !isValidLocation(toLocation)) return false;
        const sameLocation =
          fromLocation.kind === toLocation.kind &&
          ((fromLocation.kind === "equipment" && fromLocation.slot === toLocation.slot) ||
            (fromLocation.kind === "storage" &&
              fromLocation.tabId === toLocation.tabId &&
              fromLocation.index === toLocation.index));
        if (sameLocation) return true;

        const sourceItem = getItemAtLocation(fromLocation);
        if (!sourceItem) return false;
        const targetItem = getItemAtLocation(toLocation);

        if (!fitsTargetLocation(sourceItem, toLocation)) return false;
        if (fromLocation.kind === "equipment" && targetItem && !fitsTargetLocation(targetItem, fromLocation)) {
          return false;
        }
        return true;
      };

      const attachDropHandlers = (element, targetLocation) => {
        element.addEventListener("dragover", (event) => {
          event.preventDefault();
          const fromData = parseLocation(event.dataTransfer.getData("text/plain")) || state.draggingInventorySource;
          const canDrop = canDropFromTo(fromData, targetLocation);
          event.dataTransfer.dropEffect = canDrop ? "move" : "none";
          clearDropHighlight(element);
          element.classList.add(canDrop ? "inventory-drop-valid" : "inventory-drop-invalid");
        });
        element.addEventListener("dragleave", () => {
          clearDropHighlight(element);
        });
        element.addEventListener("drop", (event) => {
          event.preventDefault();
          clearDropHighlight(element);
          const fromData = parseLocation(event.dataTransfer.getData("text/plain")) || state.draggingInventorySource;
          const canDrop = canDropFromTo(fromData, targetLocation);
          clearDragState();
          if (!fromData || !canDrop || !handlers.onMoveInventoryItem) return;
          handlers.onMoveInventoryItem(fromData, targetLocation);
        });
      };

      const panel = createElement("div", "inventory-panel");

      const equipmentSection = createElement("section", "inventory-section");
      equipmentSection.appendChild(createElement("div", "skill-title", "Equipment"));
      equipmentSection.appendChild(
        createElement(
          "div",
          "skill-subtitle",
          canUseInventorySellMenu
            ? "Equip items to enhance your character. Right-click an item to sell."
            : "Equip items to enhance your character."
        )
      );

      const equipmentLayout = createElement("div", "equipment-layout");
      equipmentLayout.appendChild(createElement("div", "equipment-silhouette", "Barbarian"));

      const slots = [
        { key: "helmet", label: "Helmet", className: "slot-head" },
        { key: "chest", label: "Chest", className: "slot-chest" },
        { key: "leggings", label: "Leggings", className: "slot-leggings" },
        { key: "gloves", label: "Gloves", className: "slot-gloves" },
        { key: "boots", label: "Boots", className: "slot-boots" },
        { key: "primaryMeleeWeapon", label: "Primary Melee", className: "slot-primary-melee" },
        { key: "secondaryMeleeWeapon", label: "Secondary Melee", className: "slot-secondary-melee" },
        { key: "rangedWeapon", label: "Ranged", className: "slot-ranged-weapon" },
        { key: "ring1", label: "Ring 1", className: "slot-ring1" },
        { key: "ring2", label: "Ring 2", className: "slot-ring2" },
        { key: "amulet", label: "Amulet", className: "slot-amulet" }
      ];

      slots.forEach((slot) => {
        const value = equipment[slot.key];
        const display = getItemDisplay(value);
        const slotBox = createElement("div", `equipment-slot ${slot.className}`);
        const location = { kind: "equipment", slot: slot.key };
        attachDropHandlers(slotBox, location);
        slotBox.appendChild(createElement("div", "equipment-slot-label", slot.label));
        if (value) {
          const itemChip = createElement("div", "inventory-item-chip");
          if (display.rarityBorderClass) {
            itemChip.classList.add(display.rarityBorderClass);
          }
          itemChip.draggable = true;
          itemChip.addEventListener("dragstart", (event) => startDrag(event, location));
          itemChip.addEventListener("dragend", () => clearDragState());
          if (canUseInventorySellMenu) {
            itemChip.classList.add("inventory-item-sellable");
            itemChip.addEventListener("contextmenu", (event) => {
              event.preventDefault();
              event.stopPropagation();
              openInventoryContextMenu(event, {
                sellPrice: getSellPrice(value),
                onSell: () => onSellInventoryItem(location)
              });
            });
          }
          const itemLayout = createElement("div", "inventory-item-layout");
          const itemIcon = createItemIcon(display.iconPath, `${display.name} icon`, "inventory-item-icon");
          const itemContent = createElement("div", "inventory-item-content");
          const itemNameEl = createElement("div", "equipment-slot-value", display.name);
          if (display.rarityTextClass) {
            itemNameEl.classList.add(display.rarityTextClass);
          }
          itemContent.appendChild(itemNameEl);
          if (display.stats) {
            itemContent.appendChild(createElement("div", "equipment-slot-stat", display.stats));
          }
          if (display.mastery) {
            itemContent.appendChild(createElement("div", "equipment-slot-stat", display.mastery));
          }
          itemLayout.append(itemIcon, itemContent);
          itemChip.appendChild(itemLayout);
          slotBox.appendChild(itemChip);
        } else {
          slotBox.appendChild(createElement("div", "equipment-slot-value", display.name));
        }
        equipmentLayout.appendChild(slotBox);
      });

      equipmentSection.appendChild(equipmentLayout);
      const cumulativeStats = {};
      Object.values(equipment).forEach((itemValue) => {
        if (!itemValue || typeof itemValue !== "object") return;
        const stats = itemValue.stats && typeof itemValue.stats === "object" ? itemValue.stats : {};
        Object.entries(stats).forEach(([key, rawValue]) => {
          const normalizedKey = normalizeStatKey(key);
          const amount = Number(rawValue);
          if (!normalizedKey || Number.isNaN(amount)) return;
          cumulativeStats[normalizedKey] = Number(cumulativeStats[normalizedKey] || 0) + amount;
        });
      });
      const orderedStatKeys = [
        "slashingDamageBonus",
        "piercingDamageBonus",
        "bludgeoningDamageBonus",
        "armor",
        "maxHpBonus",
        "attackSpeedBonusPct",
        "moveSpeedBonusPct",
        "statusEffectResistPct"
      ];
      const cumulativeStatKeys = Object.keys(cumulativeStats)
        .filter((key) => Number(cumulativeStats[key]) !== 0)
        .sort((a, b) => {
          const indexA = orderedStatKeys.indexOf(a);
          const indexB = orderedStatKeys.indexOf(b);
          const safeA = indexA === -1 ? orderedStatKeys.length + 1 : indexA;
          const safeB = indexB === -1 ? orderedStatKeys.length + 1 : indexB;
          if (safeA !== safeB) return safeA - safeB;
          return a.localeCompare(b);
        });
      const bonusSummary = createElement("div", "equipment-bonus-summary");
      bonusSummary.appendChild(createElement("div", "equipment-bonus-title", "Total Equipped Bonuses"));
      if (!cumulativeStatKeys.length) {
        bonusSummary.appendChild(createElement("div", "equipment-bonus-empty", "No active item bonuses."));
      } else {
        const bonusList = createElement("div", "equipment-bonus-list");
        cumulativeStatKeys.forEach((statKey) => {
          bonusList.appendChild(createElement("div", "equipment-bonus-item", formatStatLabel(statKey, cumulativeStats[statKey])));
        });
        bonusSummary.appendChild(bonusList);
      }
      equipmentSection.appendChild(bonusSummary);
      panel.appendChild(equipmentSection);

      const storageSection = createElement("section", "inventory-section");
      storageSection.appendChild(createElement("div", "skill-title", "Storage"));
      storageSection.appendChild(
        createElement(
          "div",
          "skill-subtitle",
          canUseInventorySellMenu
            ? "Items collected during your journey will appear here. Right-click an item to sell."
            : "Items collected during your journey will appear here."
        )
      );

      const storageTabsRow = createElement("div", "storage-tabs");
      tabDefinitions.forEach((tab) => {
        const button = createElement("button", "btn storage-tab-btn", tab.label);
        button.type = "button";
        if (tab.id === safeTabId) {
          button.classList.add("active");
        }
        button.addEventListener("click", () => {
          setActiveStorageTabId(character, tab.id);
          renderSkillTreeTab();
        });
        storageTabsRow.appendChild(button);
      });
      storageSection.appendChild(storageTabsRow);

      const slotsForTab = Array.isArray(storageTabs[safeTabId]) ? storageTabs[safeTabId] : [];
      const storageGrid = createElement("div", "storage-grid");
      for (let i = 0; i < 30; i += 1) {
        const value = slotsForTab[i];
        const slot = createElement("div", "storage-slot");
        if (isRevealActive && revealState.tabId === safeTabId && revealState.index === i) {
          slot.classList.add("storage-slot-reveal");
          revealedSlotElement = slot;
        }
        const location = { kind: "storage", tabId: safeTabId, index: i };
        attachDropHandlers(slot, location);
        if (value) {
          slot.classList.add("storage-slot-filled");
          const display = getItemDisplay(value);
          const itemChip = createElement("div", "inventory-item-chip");
          if (display.rarityBorderClass) {
            itemChip.classList.add(display.rarityBorderClass);
          }
          itemChip.draggable = true;
          itemChip.addEventListener("dragstart", (event) => startDrag(event, location));
          itemChip.addEventListener("dragend", () => clearDragState());
          if (canUseInventorySellMenu) {
            itemChip.classList.add("inventory-item-sellable");
            itemChip.addEventListener("contextmenu", (event) => {
              event.preventDefault();
              event.stopPropagation();
              openInventoryContextMenu(event, {
                sellPrice: getSellPrice(value),
                onSell: () => onSellInventoryItem(location)
              });
            });
          }
          const itemLayout = createElement("div", "inventory-item-layout");
          const itemIcon = createItemIcon(display.iconPath, `${display.name} icon`, "inventory-item-icon");
          const itemContent = createElement("div", "inventory-item-content");
          const itemNameEl = createElement("div", "storage-slot-value", display.name);
          if (display.rarityTextClass) {
            itemNameEl.classList.add(display.rarityTextClass);
          }
          itemContent.appendChild(itemNameEl);
          if (display.stats) {
            itemContent.appendChild(createElement("div", "storage-slot-stat", display.stats));
          }
          if (display.mastery) {
            itemContent.appendChild(createElement("div", "storage-slot-stat", display.mastery));
          }
          itemLayout.append(itemIcon, itemContent);
          itemChip.appendChild(itemLayout);
          slot.appendChild(itemChip);
        }
        storageGrid.appendChild(slot);
      }
      storageSection.appendChild(storageGrid);
      panel.appendChild(storageSection);

      mountEl.appendChild(panel);
      if (revealedSlotElement) {
        setTimeout(() => {
          revealedSlotElement.classList.remove("storage-slot-reveal");
          revealedSlotElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }, 0);
      }
    }

    function renderMerchantTab(character) {
      if (!character) return;

      const inventory = character.inventory || {};
      const storageTabs = inventory.storageTabs || {};
      const merchant = character.merchant || {};
      const stock = Array.isArray(merchant.stock) ? merchant.stock : [];
      const buyback = Array.isArray(merchant.buyback) ? merchant.buyback : [];
      const levelLabel = merchant.levelLabel || `Level ${merchant.level || 1} Merchant`;
      const activeMerchantCategoryTabId = getActiveMerchantBuyCategoryTabId(character);
      setActiveMerchantBuyCategoryTabId(character, activeMerchantCategoryTabId);

      const allStorageSlots = Object.values(storageTabs).reduce((list, slots) => {
        if (!Array.isArray(slots)) return list;
        return list.concat(slots);
      }, []);
      const freeStorageSlots = allStorageSlots.filter((slot) => !slot).length;
      const storageFull = freeStorageSlots <= 0;

      const rarityMap = window.RL_DATA.ITEM_RARITIES || {};
      const itemTypes = window.RL_DATA.ITEM_TYPES || {};
      const physicalTypes = window.RL_DATA.PHYSICAL_DAMAGE_TYPES || {};

      const getStatText = (item) => {
        const stats = item && item.stats && typeof item.stats === "object" ? item.stats : {};
        return Object.entries(stats)
          .map(([key, rawValue]) => {
            const amount = Number(rawValue);
            if (Number.isNaN(amount)) return "";
            if (key === "slashingDamageBonus" || key === "meleeDamageBonus") return `+${amount} Slashing Damage`;
            if (key === "piercingDamageBonus" || key === "rangedDamageBonus") return `+${amount} Piercing Damage`;
            if (key === "bludgeoningDamageBonus") return `+${amount} Bludgeoning Damage`;
            if (key === "baseWeaponDamage") return `+${amount} Base Weapon Damage`;
            if (key === "armor") return `+${amount} Armor`;
            if (key === "maxHpBonus") return `+${amount} Max HP`;
            if (key === "attackSpeedBonusPct") return `${amount >= 0 ? "+" : ""}${amount}% Attack Speed`;
            if (key === "moveSpeedBonusPct") return `${amount >= 0 ? "+" : ""}${amount}% Move Speed`;
            if (key === "statusEffectResistPct") return `${amount >= 0 ? "+" : ""}${amount}% Status Resist`;
            const label = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ");
            const normalized = label.charAt(0).toUpperCase() + label.slice(1);
            return `${amount >= 0 ? "+" : ""}${amount} ${normalized}`.trim();
          })
          .filter(Boolean)
          .join(" | ");
      };

      const isWeaponItemType = (itemTypeId) => itemTypeId === "melee_weapon" || itemTypeId === "ranged_weapon";

      const getMasteryText = (item) => {
        if (!item || typeof item !== "object" || !isWeaponItemType(item.itemType)) return "";
        const masteryConfig = (window.RL_DATA && window.RL_DATA.WEAPON_MASTERY) || {};
        const rarityId = String(item.rarity || "grey").trim().toLowerCase() || "grey";
        const rawThresholds = masteryConfig.thresholdsByRarity && masteryConfig.thresholdsByRarity[rarityId];
        const thresholds = Array.isArray(rawThresholds)
          ? rawThresholds
              .map((value) => Math.max(1, Math.floor(Number(value || 0))))
              .filter((value) => Number.isFinite(value) && value > 0)
          : [];
        const normalizedThresholds = [];
        thresholds.forEach((value) => {
          if (!normalizedThresholds.length || value > normalizedThresholds[normalizedThresholds.length - 1]) {
            normalizedThresholds.push(value);
          }
        });
        if (!normalizedThresholds.length) {
          normalizedThresholds.push(100);
        }
        const tierCapRaw = Number(masteryConfig.tiersByRarity && masteryConfig.tiersByRarity[rarityId]);
        const tierCap = Math.max(
          1,
          Math.min(
            normalizedThresholds.length,
            Number.isNaN(tierCapRaw) ? normalizedThresholds.length : Math.floor(tierCapRaw)
          )
        );
        const mastery = item.mastery && typeof item.mastery === "object" ? item.mastery : {};
        const killsTotal = Math.max(0, Math.floor(Number(mastery.killsTotal || 0)));
        let tiersFromKills = 0;
        for (let i = 0; i < normalizedThresholds.length && tiersFromKills < tierCap; i += 1) {
          if (killsTotal >= normalizedThresholds[i]) {
            tiersFromKills += 1;
          } else {
            break;
          }
        }
        const explicitTiers = Math.max(0, Math.floor(Number(mastery.tiersUnlocked || 0)));
        const tiersUnlocked = Math.max(0, Math.min(tierCap, Math.max(tiersFromKills, explicitTiers)));
        const nextThresholdIndex = Math.min(tiersUnlocked, normalizedThresholds.length - 1);
        const nextThreshold = Math.max(1, normalizedThresholds[nextThresholdIndex] || normalizedThresholds[0]);
        const perTierBonusRaw = Number(
          masteryConfig.perTierFlatBonusByRarity && masteryConfig.perTierFlatBonusByRarity[rarityId]
        );
        const perTierBonus = Number.isNaN(perTierBonusRaw) ? 1 : Math.max(0, Math.floor(perTierBonusRaw));
        const totalBonus = tiersUnlocked * perTierBonus;
        const displayedKills = Math.min(killsTotal, nextThreshold);
        return `Mastery T${tiersUnlocked}/${tierCap} | ${displayedKills}/${nextThreshold} kills | +${totalBonus} dmg`;
      };

      const slotLabelMap = {
        helmet: "Helmet",
        chest: "Chest",
        leggings: "Leggings",
        boots: "Boots",
        gloves: "Gloves",
        primaryMeleeWeapon: "Primary Melee",
        secondaryMeleeWeapon: "Secondary Melee",
        rangedWeapon: "Ranged",
        ring1: "Ring 1",
        ring2: "Ring 2",
        amulet: "Amulet"
      };

      const panel = createElement("div", "merchant-panel");
      panel.appendChild(createElement("div", "skill-title", "Merchant"));
      panel.appendChild(createElement("div", "skill-subtitle", "Buy upgrades and recover accidental sales from Buyback."));

      const summary = createElement("div", "merchant-summary");
      summary.appendChild(createElement("div", "merchant-summary-item", `${levelLabel}`));
      const merchantLevel = Math.max(1, Math.floor(Number(merchant.level || 1)));
      const merchantLevelCap = Math.max(1, Math.floor(Number(merchant.levelCap || 1)));
      const reviveConsumableCharges = Math.max(0, Math.floor(Number(character.reviveConsumableCharges || 0)));
      const healthPotionCharges = Math.max(0, Math.floor(Number(character.healthPotionCharges || 0)));
      summary.appendChild(createElement("div", "merchant-summary-item", `Level: ${merchantLevel} / ${merchantLevelCap}`));
      const goldSummary = createElement("div", "merchant-summary-item merchant-summary-currency");
      goldSummary.appendChild(createElement("span", "merchant-summary-currency-label", "Gold:"));
      goldSummary.appendChild(createCoinAmount(character.gold || 0));
      summary.appendChild(goldSummary);
      summary.appendChild(createElement("div", "merchant-summary-item", `Storage Free: ${freeStorageSlots}`));
      summary.appendChild(
        createElement("div", "merchant-summary-item", `Revive Sigil: ${reviveConsumableCharges > 0 ? "Ready" : "None"}`)
      );
      summary.appendChild(createElement("div", "merchant-summary-item", `Health Potions: ${healthPotionCharges}`));

      const merchantXpIntoLevel = Math.max(0, Math.floor(Number(merchant.xpIntoLevel || 0)));
      const merchantXpToNextLevel = Math.max(1, Math.floor(Number(merchant.xpToNextLevel || 1)));
      const merchantXpProgress = merchantLevel >= merchantLevelCap ? 1 : Math.max(0, Math.min(1, merchantXpIntoLevel / merchantXpToNextLevel));
      const merchantXpBlock = createElement("div", "merchant-xp-block");
      const merchantXpHead = createElement("div", "merchant-xp-head");
      merchantXpHead.appendChild(createElement("strong", "", "Merchant XP"));
      merchantXpHead.appendChild(
        createElement(
          "span",
          "",
          merchantLevel >= merchantLevelCap
            ? `Level cap reached (${merchantLevelCap})`
            : `${merchantXpIntoLevel}/${merchantXpToNextLevel}`
        )
      );
      merchantXpBlock.appendChild(merchantXpHead);
      const merchantXpTrack = createElement("div", "merchant-xp-track");
      const merchantXpFill = createElement("div", "merchant-xp-fill");
      merchantXpFill.style.width = `${(merchantXpProgress * 100).toFixed(2)}%`;
      merchantXpTrack.appendChild(merchantXpFill);
      merchantXpBlock.appendChild(merchantXpTrack);
      if (merchantLevel >= merchantLevelCap) {
        merchantXpBlock.appendChild(
          createElement("div", "merchant-xp-note", "Beat the current game level boss to raise the merchant cap.")
        );
      } else {
        merchantXpBlock.appendChild(
          createElement("div", "merchant-xp-note", "Buy or sell at the merchant to gain XP and improve stock quality.")
        );
      }
      summary.appendChild(merchantXpBlock);
      panel.appendChild(summary);

      const buyCategoryDefinitions = [
        {
          id: "weapons",
          label: "Weapons",
          filterFn: (listing) => {
            const itemType = listing && listing.item && listing.item.itemType;
            return itemType === "melee_weapon" || itemType === "ranged_weapon";
          }
        },
        {
          id: "armor",
          label: "Armor",
          filterFn: (listing) => {
            const itemType = listing && listing.item && listing.item.itemType;
            return ["helmet", "chest", "leggings", "gloves", "boots", "ring", "amulet"].includes(itemType);
          }
        },
        {
          id: "utility",
          label: "Utility",
          filterFn: (listing) => String((listing && listing.kind) || "").startsWith("consumable_")
        },
        {
          id: "buyback",
          label: "Buyback"
        }
      ];
      const currentBuyCategory =
        buyCategoryDefinitions.find((category) => category.id === activeMerchantCategoryTabId) || buyCategoryDefinitions[0];
      setActiveMerchantBuyCategoryTabId(character, currentBuyCategory.id);

      const buyCategoryTabsRow = createElement("div", "merchant-buy-category-tabs");
      buyCategoryDefinitions.forEach((category) => {
        const button = createElement("button", "btn merchant-buy-category-tab-btn", category.label);
        button.type = "button";
        if (category.id === currentBuyCategory.id) {
          button.classList.add("active");
        }
        button.addEventListener("click", () => {
          setActiveMerchantBuyCategoryTabId(character, category.id);
          renderSkillTreeTab();
        });
        buyCategoryTabsRow.appendChild(button);
      });
      panel.appendChild(buyCategoryTabsRow);

      if (currentBuyCategory.id === "buyback") {
        const buybackGrid = createElement("div", "merchant-grid");
        if (!buyback.length) {
          buybackGrid.appendChild(createElement("div", "merchant-empty", "No items available for buyback."));
        } else {
          buyback.forEach((listing) => {
            const item = listing.item || {};
            const rarity = rarityMap[item.rarity] || null;
            const type = itemTypes[item.itemType] || null;
            const physical = physicalTypes[item.physicalDamageType] || null;
            const allowedSlots = Array.isArray(item.allowedSlots) ? item.allowedSlots : [];
            const slotLabel = allowedSlots.length
              ? allowedSlots.map((slot) => slotLabelMap[slot] || toTitle(slot)).join(", ")
              : "-";
            const stats = getStatText(item) || "-";
            const masteryText = getMasteryText(item);
            const weightValue = Number(item.weaponSlotWeight);
            const weightLabel =
              (item.itemType === "melee_weapon" || item.itemType === "ranged_weapon") && !Number.isNaN(weightValue)
                ? `${Math.max(1, Math.min(2, Math.floor(weightValue)))} Slot${Math.floor(weightValue) === 1 ? "" : "s"}`
                : "";

            const card = createElement("article", "merchant-card");
            const rarityBorderClass = getRarityBorderClass(item.rarity);
            if (rarityBorderClass) {
              card.classList.add(rarityBorderClass);
            }
            const cardLayout = createElement("div", "merchant-card-layout");
            const cardContent = createElement("div", "merchant-card-content");
            const iconPath = resolveItemIconPath(item);
            const itemIcon = createItemIcon(iconPath, `${item.name || "Item"} icon`, "merchant-item-icon");
            const itemName = createElement("div", "merchant-item-name", item.name || "Item");
            const rarityTextClass = getRarityTextClass(item.rarity);
            if (rarityTextClass) {
              itemName.classList.add(rarityTextClass);
            }
            cardContent.appendChild(itemName);
            cardContent.appendChild(
              createElement(
                "div",
                "merchant-item-meta",
                [rarity ? rarity.label : "", type ? type.label : "", weightLabel].filter(Boolean).join(" | ")
              )
            );
            cardContent.appendChild(createElement("div", "merchant-item-line", `Slot: ${slotLabel}`));
            if (physical && physical.label) {
              cardContent.appendChild(createElement("div", "merchant-item-line", `Damage Type: ${physical.label}`));
            }
            cardContent.appendChild(createElement("div", "merchant-item-line", `Stats: ${stats}`));
            if (masteryText) {
              cardContent.appendChild(createElement("div", "merchant-item-line", masteryText));
            }
            cardContent.appendChild(createMerchantPriceLine("Buyback", listing.price || 0));

            const buybackButton = createElement("button", "btn merchant-buy-btn", "Buy Back");
            buybackButton.type = "button";
            const hasGold = (character.gold || 0) >= (listing.price || 0);
            buybackButton.disabled = !hasGold || storageFull || !handlers.onBuybackMerchantItem;
            buybackButton.addEventListener("click", () => {
              if (!handlers.onBuybackMerchantItem) return;
              handlers.onBuybackMerchantItem(listing.buybackId);
            });
            cardContent.appendChild(buybackButton);

            const reason = !hasGold
              ? "Not enough gold"
              : storageFull
              ? "Storage is full"
              : "";
            if (reason) {
              cardContent.appendChild(createElement("div", "merchant-buy-reason", reason));
            }

            cardLayout.append(itemIcon, cardContent);
            card.appendChild(cardLayout);
            buybackGrid.appendChild(card);
          });
        }
        panel.appendChild(buybackGrid);
        dom.skillTreeContent.appendChild(panel);
        return;
      }

      const filteredStock = stock.filter((listing) => {
        return currentBuyCategory.filterFn(listing);
      });

      const list = createElement("div", "merchant-grid");
      if (!filteredStock.length) {
        const empty = createElement(
          "div",
          "merchant-empty",
          stock.length
            ? `No ${currentBuyCategory.label.toLowerCase()} items are currently available in stock.`
            : "Merchant stock is sold out."
        );
        list.appendChild(empty);
      } else {
        filteredStock.forEach((listing) => {
          const listingKind = String((listing && listing.kind) || "item");
          if (listingKind.startsWith("consumable_")) {
            const rarityTextClass = getRarityTextClass(listing.rarity);
            const card = createElement("article", "merchant-card");
            const rarityBorderClass = getRarityBorderClass(listing.rarity);
            if (rarityBorderClass) {
              card.classList.add(rarityBorderClass);
            }
            const cardLayout = createElement("div", "merchant-card-layout");
            const cardContent = createElement("div", "merchant-card-content");
            const consumableIconPath = resolveConsumableIconPath(listing);
            const itemIcon = createItemIcon(consumableIconPath, `${listing.name || "Consumable"} icon`, "merchant-item-icon");
            const itemName = createElement("div", "merchant-item-name", listing.name || "Consumable");
            if (rarityTextClass) {
              itemName.classList.add(rarityTextClass);
            }
            cardContent.appendChild(itemName);
            const maxOwned = Math.max(1, Math.floor(Number(listing.maxOwned || 1)));
            const currentHeld =
              listingKind === "consumable_health_potion"
                ? Math.max(0, Math.floor(Number(character.healthPotionCharges || 0)))
                : Math.max(0, Math.floor(Number(character.reviveConsumableCharges || 0)));
            cardContent.appendChild(createElement("div", "merchant-item-meta", `Consumable | Held ${currentHeld}/${maxOwned}`));
            cardContent.appendChild(
              createElement(
                "div",
                "merchant-item-line",
                listing.description ||
                  (listingKind === "consumable_health_potion"
                    ? "Use during a run to restore health."
                    : "Consumed on death to revive and continue the run.")
              )
            );
            cardContent.appendChild(createMerchantPriceLine("Price", listing.price || 0));

            const alreadyOwned = currentHeld >= maxOwned;
            const hasGold = (character.gold || 0) >= (listing.price || 0);
            const buyButton = createElement("button", "btn btn-primary merchant-buy-btn", "Buy");
            buyButton.type = "button";
            buyButton.disabled = !hasGold || alreadyOwned || !handlers.onBuyMerchantItem;
            buyButton.addEventListener("click", () => {
              if (!handlers.onBuyMerchantItem) return;
              handlers.onBuyMerchantItem(listing.listingId);
            });
            cardContent.appendChild(buyButton);

            const reason = !hasGold
              ? "Not enough gold"
              : alreadyOwned
              ? "Already at max carried"
              : "";
            if (reason) {
              cardContent.appendChild(createElement("div", "merchant-buy-reason", reason));
            }

            cardLayout.append(itemIcon, cardContent);
            card.appendChild(cardLayout);
            list.appendChild(card);
            return;
          }

          const item = listing.item || {};
          const rarity = rarityMap[item.rarity] || null;
          const type = itemTypes[item.itemType] || null;
          const physical = physicalTypes[item.physicalDamageType] || null;
          const allowedSlots = Array.isArray(item.allowedSlots) ? item.allowedSlots : [];
          const slotLabel = allowedSlots.length
            ? allowedSlots.map((slot) => slotLabelMap[slot] || toTitle(slot)).join(", ")
            : "-";
          const stats = getStatText(item) || "-";
          const masteryText = getMasteryText(item);
          const weightValue = Number(item.weaponSlotWeight);
          const weightLabel =
            (item.itemType === "melee_weapon" || item.itemType === "ranged_weapon") && !Number.isNaN(weightValue)
              ? `${Math.max(1, Math.min(2, Math.floor(weightValue)))} Slot${Math.floor(weightValue) === 1 ? "" : "s"}`
              : "";

          const card = createElement("article", "merchant-card");
          const rarityBorderClass = getRarityBorderClass(item.rarity);
          if (rarityBorderClass) {
            card.classList.add(rarityBorderClass);
          }
          const cardLayout = createElement("div", "merchant-card-layout");
          const cardContent = createElement("div", "merchant-card-content");
          const iconPath = resolveItemIconPath(item);
          const itemIcon = createItemIcon(iconPath, `${item.name || "Item"} icon`, "merchant-item-icon");
          const itemName = createElement("div", "merchant-item-name", item.name || "Item");
          const rarityTextClass = getRarityTextClass(item.rarity);
          if (rarityTextClass) {
            itemName.classList.add(rarityTextClass);
          }
          cardContent.appendChild(itemName);
          cardContent.appendChild(
            createElement(
              "div",
              "merchant-item-meta",
              [rarity ? rarity.label : "", type ? type.label : "", weightLabel].filter(Boolean).join(" | ")
            )
          );
          cardContent.appendChild(createElement("div", "merchant-item-line", `Slot: ${slotLabel}`));
          if (physical && physical.label) {
            cardContent.appendChild(createElement("div", "merchant-item-line", `Damage Type: ${physical.label}`));
          }
          cardContent.appendChild(createElement("div", "merchant-item-line", `Stats: ${stats}`));
          if (masteryText) {
            cardContent.appendChild(createElement("div", "merchant-item-line", masteryText));
          }
          cardContent.appendChild(createMerchantPriceLine("Price", listing.price || 0));

          const buyButton = createElement("button", "btn btn-primary merchant-buy-btn", "Buy");
          buyButton.type = "button";
          const hasGold = (character.gold || 0) >= (listing.price || 0);
          buyButton.disabled = !hasGold || storageFull || !handlers.onBuyMerchantItem;
          buyButton.addEventListener("click", () => {
            if (!handlers.onBuyMerchantItem) return;
            handlers.onBuyMerchantItem(listing.listingId);
          });
          cardContent.appendChild(buyButton);

          const reason = !hasGold
            ? "Not enough gold"
            : storageFull
            ? "Storage is full"
            : "";
          if (reason) {
            cardContent.appendChild(createElement("div", "merchant-buy-reason", reason));
          }

          cardLayout.append(itemIcon, cardContent);
          card.appendChild(cardLayout);
          list.appendChild(card);
        });
      }

      panel.appendChild(list);

      dom.skillTreeContent.appendChild(panel);
    }

    function renderQuestsTab(character) {
      if (!character) return;

      const questCounts = getQuestClaimCounts(character);
      const questDefinitions = Array.isArray(questCounts.mainQuestDefinitions)
        ? questCounts.mainQuestDefinitions
        : getMainQuestDefinitions();
      const activeQuestViewTabId = getActiveQuestViewTabId(character);
      setActiveQuestViewTabId(character, activeQuestViewTabId);

      const panel = createElement("div", "quest-panel");

      const tabsRow = createElement("div", "quest-mode-tabs");
      [
        {
          id: "quests",
          label: questCounts.main > 0 ? `Main (${questCounts.main})` : "Main"
        },
        {
          id: "bounties",
          label: questCounts.bounties > 0 ? `Bounties (${questCounts.bounties})` : "Bounties"
        }
      ].forEach((tab) => {
        const button = createElement("button", "btn quest-mode-tab-btn", tab.label);
        button.type = "button";
        if (tab.id === activeQuestViewTabId) {
          button.classList.add("active");
        }
        button.addEventListener("click", () => {
          setActiveQuestViewTabId(character, tab.id);
          renderSkillTreeTab();
        });
        tabsRow.appendChild(button);
      });
      panel.appendChild(tabsRow);

      if (activeQuestViewTabId === "bounties") {
        const enemyDefinitions = window.RL_DATA.ENEMIES || {};
        const discovered = character.bestiaryDiscoveries && typeof character.bestiaryDiscoveries === "object"
          ? character.bestiaryDiscoveries
          : {};
        const discoveredEnemyIds = Object.keys(enemyDefinitions)
          .filter((enemyTypeId) => discovered[enemyTypeId] === true)
          .sort((a, b) => {
            const enemyA = enemyDefinitions[a] || {};
            const enemyB = enemyDefinitions[b] || {};
            const labelA = String(enemyA.label || toTitle(a));
            const labelB = String(enemyB.label || toTitle(b));
            return labelA.localeCompare(labelB);
          });

        if (!discoveredEnemyIds.length) {
          panel.appendChild(
            createElement(
              "div",
              "skill-empty",
              "No bounty targets yet. Discover enemies in the Bestiary first."
            )
          );
          dom.skillTreeContent.appendChild(panel);
          return;
        }

        const enemyKillCounts = character.enemyKillCounts && typeof character.enemyKillCounts === "object"
          ? character.enemyKillCounts
          : {};
        const bountyClaims = character.bountyClaims && typeof character.bountyClaims === "object"
          ? character.bountyClaims
          : {};
        const bountyDamageBonuses = character.bountyDamageBonuses && typeof character.bountyDamageBonuses === "object"
          ? character.bountyDamageBonuses
          : {};
        const cards = createElement("div", "quest-list");

        discoveredEnemyIds.forEach((enemyTypeId) => {
          const enemy = enemyDefinitions[enemyTypeId] || {};
          const bountyProfile = window.RL_SAVE && typeof window.RL_SAVE.getBountyProfileForEnemy === "function"
            ? window.RL_SAVE.getBountyProfileForEnemy(enemyTypeId)
            : null;
          if (!bountyProfile) return;

          const current = Math.max(0, Math.floor(Number(enemyKillCounts[enemyTypeId] || 0)));
          const stepCount = Math.max(1, Math.floor(Number(bountyProfile.stepCount || 1)));
          const claimedSteps = Math.max(0, Math.floor(Number(bountyClaims[enemyTypeId] || 0)));
          const steps = Array.isArray(bountyProfile.steps) ? bountyProfile.steps : [];
          const completedAllSteps = claimedSteps >= stepCount;
          const nextStep = completedAllSteps
            ? null
            : steps[Math.max(0, Math.min(steps.length - 1, claimedSteps))];
          const activeStep = nextStep || steps[Math.max(0, Math.min(steps.length - 1, stepCount - 1))] || null;
          const target = Math.max(1, Math.floor(Number(activeStep && activeStep.target ? activeStep.target : bountyProfile.target || 1)));
          const progress = completedAllSteps ? target : Math.min(target, current);
          const progressPct = target > 0 ? (progress / target) * 100 : 0;
          const completed = Boolean(nextStep && current >= target);
          const cumulativeBonusPct = Math.max(
            0,
            Math.round(Number(bountyDamageBonuses[enemyTypeId] || 0) * 1000) / 10
          );

          let statusText = "In Progress";
          if (completedAllSteps) {
            statusText = "Completed";
          } else if (completed) {
            statusText = `Step ${claimedSteps + 1}/${stepCount} Complete - Reward Ready`;
          }

          const enemyLabel = enemy.label || toTitle(enemyTypeId);
          const card = createElement("article", "quest-card");
          if (completedAllSteps) {
            card.classList.add("quest-card-claimed");
          } else if (completed) {
            card.classList.add("quest-card-ready");
          }

          card.appendChild(createElement("div", "quest-title", `${enemyLabel} Bounty`));
          if (nextStep) {
            card.appendChild(createElement("div", "quest-desc", `Step ${nextStep.step}/${stepCount}`));
          } else {
            card.appendChild(createElement("div", "quest-desc", `All ${stepCount} steps claimed.`));
          }
          card.appendChild(
            createElement(
              "div",
              "quest-desc",
              completedAllSteps
                ? `Final target reached: ${target} ${enemyLabel}${target === 1 ? "" : "s"}.`
                : `Defeat ${target} ${enemyLabel}${target === 1 ? "" : "s"} for the next claim.`
            )
          );
          card.appendChild(createElement("div", "quest-progress-text", `${progress} / ${target} Defeated`));
          card.appendChild(createElement("div", "quest-progress-text", `Total Defeated: ${current}`));
          card.appendChild(createElement("div", "quest-progress-text", `Damage Bonus vs ${enemyLabel}: +${cumulativeBonusPct}%`));

          const track = createElement("div", "quest-progress-track");
          const fill = createElement("div", "quest-progress-fill");
          fill.style.width = `${progressPct.toFixed(1)}%`;
          track.appendChild(fill);
          card.appendChild(track);

          if (nextStep) {
            const rewardXp = Math.max(0, Math.floor(Number(nextStep.xpReward || 0)));
            const rewardDamageBonusPct = Math.max(0, Math.round(Number(nextStep.damageBonusPct || 0) * 1000) / 10);
            const rewardRarityLabel = toTitle(nextStep.rewardRarity || bountyProfile.rewardRarity || "purple");
            const rewardItemCount = Math.max(0, Math.floor(Number(nextStep.rewardItemCount || 0)));
            let rewardText = `Reward: +${rewardDamageBonusPct}% damage vs ${enemyLabel}`;
            if (rewardXp > 0) {
              rewardText += ` + ${rewardXp} XP`;
            }
            if (nextStep.grantsItem && rewardItemCount > 0) {
              rewardText += ` + ${rewardItemCount} ${rewardRarityLabel} item${rewardItemCount === 1 ? "" : "s"}`;
            }
            card.appendChild(createElement("div", "quest-reward", rewardText));
          } else {
            card.appendChild(
              createElement(
                "div",
                "quest-reward",
                `Bounty line complete. Final reward rarity: ${toTitle(bountyProfile.rewardRarity || "purple")}`
              )
            );
          }
          card.appendChild(createElement("div", "quest-status", `Status: ${statusText}`));

          if (!completedAllSteps && nextStep) {
            const claimButton = createElement("button", "btn quest-claim-btn", "Claim Reward");
            claimButton.type = "button";
            claimButton.disabled = !completed || !handlers.onClaimBountyReward;
            claimButton.addEventListener("click", () => {
              if (!handlers.onClaimBountyReward) return;
              handlers.onClaimBountyReward(enemyTypeId);
            });
            card.appendChild(claimButton);
          } else {
            card.appendChild(createElement("div", "quest-claimed-note", "All bounty rewards claimed"));
          }

          cards.appendChild(card);
        });

        if (!cards.children.length) {
          panel.appendChild(createElement("div", "skill-empty", "No bounty profiles are configured yet."));
        } else {
          panel.appendChild(cards);
        }
        dom.skillTreeContent.appendChild(panel);
        return;
      }

      if (!questDefinitions.length) {
        panel.appendChild(createElement("div", "skill-empty", "No quests available yet."));
        dom.skillTreeContent.appendChild(panel);
        return;
      }

      const claims = (character.questClaims && typeof character.questClaims === "object" ? character.questClaims : {});
      const cards = createElement("div", "quest-list");

      questDefinitions.forEach((quest) => {
        const requirement = quest.requirement || {};
        const target = Math.max(1, Math.floor(Number(requirement.target || 1)));
        let current = 0;
        let progressLabel = "Progress";
        if (requirement.type === "legacy_xp_total") {
          current = Math.max(0, Math.floor(Number(character.legacyXp || 0)));
          progressLabel = "XP";
        } else if (requirement.type === "total_gold_collected") {
          current = Math.max(0, Math.floor(Number(character.lifetimeGoldCollected || 0)));
          progressLabel = "Gold Collected";
        } else if (requirement.type === "miniboss_kills_total") {
          current = Math.max(0, Math.floor(Number(character.minibossKills || 0)));
          progressLabel = "Minibosses Defeated";
        } else if (requirement.type === "enemy_kills_total") {
          current = Math.max(0, Math.floor(Number(character.enemyKills || 0)));
          progressLabel = "Enemies Defeated";
        } else if (requirement.type === "deaths_total") {
          current = Math.max(0, Math.floor(Number(character.deaths || 0)));
          progressLabel = "Deaths";
        }
        const progress = Math.min(target, current);
        const progressPct = target > 0 ? (progress / target) * 100 : 0;
        const completed = current >= target;
        const claimed = claims[quest.id] === true;
        const autoClaimOnComplete = Boolean(quest.reward && quest.reward.autoClaimOnComplete);

        let statusText = "In Progress";
        if (claimed) {
          statusText = "Claimed";
        } else if (completed) {
          statusText = autoClaimOnComplete ? "Complete - Reward Applied" : "Complete - Reward Ready";
        }

        const card = createElement("article", "quest-card");
        if (claimed) {
          card.classList.add("quest-card-claimed");
        } else if (completed) {
          card.classList.add("quest-card-ready");
        }

        card.appendChild(createElement("div", "quest-title", quest.title || "Quest"));
        card.appendChild(createElement("div", "quest-desc", quest.description || ""));
        card.appendChild(
          createElement("div", "quest-progress-text", `${progress} / ${target} ${progressLabel}`)
        );

        const track = createElement("div", "quest-progress-track");
        const fill = createElement("div", "quest-progress-fill");
        fill.style.width = `${progressPct.toFixed(1)}%`;
        track.appendChild(fill);
        card.appendChild(track);

        const rewardLabel = (quest.reward && quest.reward.label) || "Reward";
        card.appendChild(createElement("div", "quest-reward", `Reward: ${rewardLabel}`));
        card.appendChild(createElement("div", "quest-status", `Status: ${statusText}`));

        if (!claimed && !autoClaimOnComplete) {
          const claimButton = createElement("button", "btn quest-claim-btn", "Claim Reward");
          claimButton.type = "button";
          claimButton.disabled = !completed || !handlers.onClaimQuestReward;
          claimButton.addEventListener("click", () => {
            if (!handlers.onClaimQuestReward) return;
            handlers.onClaimQuestReward(quest.id);
          });
          card.appendChild(claimButton);
        } else {
          card.appendChild(createElement("div", "quest-claimed-note", "Reward unlocked"));
        }

        cards.appendChild(card);
      });

      panel.appendChild(cards);
      dom.skillTreeContent.appendChild(panel);
    }

    function renderBestiaryTab(character) {
      if (!character) return;

      const enemyDefinitions = window.RL_DATA.ENEMIES || {};
      const discovered = character.bestiaryDiscoveries && typeof character.bestiaryDiscoveries === "object"
        ? character.bestiaryDiscoveries
        : {};
      const allEnemyIds = Object.keys(enemyDefinitions);
      const discoveredEnemyIds = allEnemyIds.filter((enemyTypeId) => discovered[enemyTypeId] === true);
      const orderedEnemyIds = discoveredEnemyIds.sort((a, b) => {
        const enemyA = enemyDefinitions[a] || {};
        const enemyB = enemyDefinitions[b] || {};
        const labelA = String(enemyA.label || toTitle(a));
        const labelB = String(enemyB.label || toTitle(b));
        return labelA.localeCompare(labelB);
      });

      const physicalTypes = window.RL_DATA.PHYSICAL_DAMAGE_TYPES || {};
      const elementalTypes = window.RL_DATA.ELEMENTAL_DAMAGE_TYPES || {};
      const statusTypes = window.RL_DATA.STATUS_RIDER_TYPES || {};
      const typeMaps = [physicalTypes, elementalTypes, statusTypes];

      const getDamageTypeLabel = (typeId) => {
        const id = String(typeId || "").trim();
        if (!id) return "";
        for (let i = 0; i < typeMaps.length; i += 1) {
          const map = typeMaps[i];
          if (map[id] && map[id].label) return map[id].label;
        }
        return toTitle(id);
      };

      const formatTypeList = (typeIds) => {
        if (!Array.isArray(typeIds) || !typeIds.length) return "None";
        const labels = typeIds
          .map((typeId) => getDamageTypeLabel(typeId))
          .filter(Boolean);
        return labels.length ? labels.join(", ") : "None";
      };

      const panel = createElement("div", "bestiary-panel");
      panel.appendChild(createElement("div", "skill-title", "Bestiary Codex"));
      panel.appendChild(
        createElement(
          "div",
          "skill-subtitle",
          "New enemies are recorded on first encounter. Stats shown are base values before run scaling."
        )
      );
      panel.appendChild(
        createElement(
          "div",
          "bestiary-progress",
          `Discovered ${orderedEnemyIds.length} / ${allEnemyIds.length} enemies`
        )
      );

      if (!orderedEnemyIds.length) {
        panel.appendChild(
          createElement(
            "div",
            "bestiary-empty",
            "No enemies discovered yet. Start a run to add entries to the codex."
          )
        );
        dom.skillTreeContent.appendChild(panel);
        return;
      }

      const list = createElement("div", "bestiary-list");
      orderedEnemyIds.forEach((enemyTypeId) => {
        const enemy = enemyDefinitions[enemyTypeId] || {};
        const card = createElement("article", "bestiary-card");
        const cardBody = createElement("div", "bestiary-card-body");
        const enemyLabel = enemy.label || toTitle(enemyTypeId);
        const enemyIcon = createItemIcon(
          resolveBestiaryEnemyIconPath(enemyTypeId),
          `${enemyLabel} portrait`,
          "bestiary-enemy-icon"
        );
        const cardContent = createElement("div", "bestiary-card-content");
        const header = createElement("div", "bestiary-card-header");
        header.appendChild(createElement("div", "bestiary-name", enemyLabel));
        header.appendChild(createElement("div", "bestiary-behavior", toTitle(enemy.behavior || "enemy")));
        cardContent.appendChild(header);

        const stats = createElement("div", "bestiary-stats");
        stats.appendChild(createElement("div", "bestiary-stat", `HP: ${Math.max(1, Math.floor(Number(enemy.hp || 1)))}`));
        stats.appendChild(createElement("div", "bestiary-stat", `Damage: ${Math.max(0, Math.floor(Number(enemy.damage || 0)))}`));
        cardContent.appendChild(stats);

        cardContent.appendChild(
          createElement("div", "bestiary-line", `Resistances: ${formatTypeList(enemy.resistances)}`)
        );
        cardContent.appendChild(
          createElement("div", "bestiary-line", `Weaknesses: ${formatTypeList(enemy.weaknesses)}`)
        );
        cardBody.append(enemyIcon, cardContent);
        card.appendChild(cardBody);
        list.appendChild(card);
      });
      panel.appendChild(list);
      dom.skillTreeContent.appendChild(panel);
    }

    function syncItemReferenceVisibility() {
      if (dom.itemReferencePanel) {
        setVisible(dom.itemReferencePanel, state.itemReferenceOpen);
      }
      if (dom.itemReferenceToggleBtn) {
        dom.itemReferenceToggleBtn.textContent = state.itemReferenceOpen ? "Hide Info" : "Test Info";
      }
    }

    function renderItemReferencePanel() {
      if (!dom.itemReferenceContent) return;
      const reference = window.RL_DATA.ITEM_REFERENCE_PANEL || {};
      const weaponCatalog = Array.isArray(window.RL_DATA.WEAPON_CATALOG) ? window.RL_DATA.WEAPON_CATALOG : [];
      const rarities = window.RL_DATA.ITEM_RARITIES || {};
      const physicalTypes = window.RL_DATA.PHYSICAL_DAMAGE_TYPES || {};
      const elementalTypes = window.RL_DATA.ELEMENTAL_DAMAGE_TYPES || {};

      const getLabel = (map, id) => {
        if (!id) return "";
        const value = map[id];
        return value && value.label ? value.label : toTitle(id);
      };

      const weaponRefsById = {};
      (reference.weapons || []).forEach((weaponRef) => {
        if (!weaponRef || !weaponRef.id) return;
        weaponRefsById[weaponRef.id] = weaponRef;
      });

      const defaultRarityOrder = ["grey", "blue", "purple", "gold"];
      const defaultTierProfiles = {
        grey: {
          valueRange: "Starter range (testing)",
          optionalStats: ["Attack Speed", "Cooldown Reduction"]
        },
        blue: {
          valueRange: "Improved range (testing)",
          optionalStats: ["Attack Speed", "Cooldown Reduction", "Reach/Width/Speed"]
        },
        purple: {
          valueRange: "Strong range (testing)",
          optionalStats: ["Attack Speed", "Cooldown Reduction", "Reach/Width/Speed"],
          elementalOptions: Array.isArray(reference.elementalOptions) ? reference.elementalOptions : []
        },
        gold: {
          valueRange: "High range (testing)",
          optionalStats: ["High stat budget", "Conditional bonuses", "Unique modifiers"],
          elementalOptions: Array.isArray(reference.elementalOptions) ? reference.elementalOptions : []
        }
      };

      const getWeightLabel = (weapon) => {
        if (!weapon || !Array.isArray(weapon.slotWeightOptions) || !weapon.slotWeightOptions.length) return "1 Slot";
        return weapon.slotWeightOptions
          .map((weight) => `${weight} Slot${weight === 1 ? "" : "s"}`)
          .join(" / ");
      };

      const weaponTypeFilters = ["all", ...Array.from(new Set(weaponCatalog.map((weapon) => weapon.weaponCategory).filter(Boolean)))];
      if (!weaponTypeFilters.includes(state.itemReferenceWeaponTypeFilter)) {
        state.itemReferenceWeaponTypeFilter = "all";
      }

      const filteredWeapons =
        state.itemReferenceWeaponTypeFilter === "all"
          ? weaponCatalog.slice()
          : weaponCatalog.filter((weapon) => weapon.weaponCategory === state.itemReferenceWeaponTypeFilter);

      dom.itemReferenceContent.innerHTML = "";

      const intro = createElement("section", "item-ref-intro");
      intro.appendChild(createElement("div", "item-ref-section-title", reference.title || "Item Reference"));
      intro.appendChild(
        createElement(
          "div",
          "item-ref-subtitle",
          reference.subtitle || "Use weapon type filters below to inspect the current and planned catalog."
        )
      );
      const raritySummary = (reference.supportedRarities || defaultRarityOrder)
        .map((rarityId) => getLabel(rarities, rarityId))
        .filter(Boolean)
        .join(" | ");
      intro.appendChild(createElement("div", "item-ref-subtitle", `Rarity Order: ${raritySummary}`));
      dom.itemReferenceContent.appendChild(intro);

      const filterSection = createElement("section", "item-ref-section");
      filterSection.appendChild(createElement("div", "item-ref-section-title", "Weapon Type"));
      const filterRow = createElement("div", "item-ref-filter-row");
      weaponTypeFilters.forEach((filterId) => {
        const button = createElement(
          "button",
          "btn item-ref-filter-btn",
          filterId === "all" ? "All Weapons" : toTitle(filterId)
        );
        button.type = "button";
        if (filterId === state.itemReferenceWeaponTypeFilter) {
          button.classList.add("active");
        }
        button.addEventListener("click", () => {
          state.itemReferenceWeaponTypeFilter = filterId;
          renderItemReferencePanel();
        });
        filterRow.appendChild(button);
      });
      filterSection.appendChild(filterRow);
      filterSection.appendChild(
        createElement(
          "div",
          "item-ref-subtitle",
          `Showing ${filteredWeapons.length} weapon${filteredWeapons.length === 1 ? "" : "s"} in this view.`
        )
      );
      dom.itemReferenceContent.appendChild(filterSection);

      const tableSection = createElement("section", "item-ref-section");
      tableSection.appendChild(createElement("div", "item-ref-section-title", "Weapons and Stats Table"));
      tableSection.appendChild(
        createElement(
          "div",
          "item-ref-subtitle",
          "Rows are grouped by rarity category for each weapon. Planned rows are placeholders for future drops."
        )
      );

      const tableWrap = createElement("div", "item-ref-table-wrap");
      const table = createElement("table", "item-ref-table");
      const thead = createElement("thead", "");
      const headerRow = createElement("tr", "");
      [
        "Category",
        "Weapon Type",
        "Weight",
        "Damage Type",
        "Damage Buff Range",
        "Extra Stats Possible",
        "Elemental Stats",
        "Unique Stats"
      ].forEach((heading) => {
        const th = createElement("th", "", heading);
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = createElement("tbody", "");
      const normalizeRarityKey = (rarityValue) => String(rarityValue || "").toLowerCase().replace(/[^a-z]/g, "");
      const rarityCellClass = (rarityValue) => {
        const key = normalizeRarityKey(rarityValue);
        if (key === "grey") return "item-ref-rarity-grey";
        if (key === "blue") return "item-ref-rarity-blue";
        if (key === "purple") return "item-ref-rarity-purple";
        if (key === "gold") return "item-ref-rarity-gold";
        if (key === "green") return "item-ref-rarity-green";
        return "item-ref-rarity-unknown";
      };
      const optionalStatPercentRanges = {
        grey: {
          default: [2, 5],
          attackSpeed: [2, 4],
          throwRate: [2, 4],
          cooldownReduction: [1, 3],
          cleaveWidth: [3, 7],
          meleeRange: [3, 7],
          projectileSpeed: [4, 8],
          projectileRange: [4, 8],
          reachWidthSpeed: [3, 7],
          highStatBudget: [6, 10],
          conditionalBonuses: [4, 8],
          uniqueModifiers: [3, 7]
        },
        blue: {
          default: [5, 9],
          attackSpeed: [4, 7],
          throwRate: [4, 7],
          cooldownReduction: [3, 5],
          cleaveWidth: [7, 12],
          meleeRange: [7, 12],
          projectileSpeed: [8, 14],
          projectileRange: [8, 14],
          reachWidthSpeed: [7, 12],
          highStatBudget: [10, 14],
          conditionalBonuses: [8, 12],
          uniqueModifiers: [6, 10]
        },
        purple: {
          default: [9, 14],
          attackSpeed: [7, 11],
          throwRate: [7, 11],
          cooldownReduction: [5, 8],
          cleaveWidth: [12, 18],
          meleeRange: [12, 18],
          projectileSpeed: [14, 22],
          projectileRange: [14, 22],
          reachWidthSpeed: [12, 18],
          highStatBudget: [14, 20],
          conditionalBonuses: [12, 18],
          uniqueModifiers: [10, 16]
        },
        gold: {
          default: [14, 22],
          attackSpeed: [11, 16],
          throwRate: [11, 16],
          cooldownReduction: [8, 12],
          cleaveWidth: [18, 28],
          meleeRange: [18, 28],
          projectileSpeed: [22, 32],
          projectileRange: [22, 32],
          reachWidthSpeed: [18, 28],
          highStatBudget: [20, 30],
          conditionalBonuses: [18, 28],
          uniqueModifiers: [15, 25]
        },
        green: {
          default: [20, 32],
          attackSpeed: [16, 24],
          throwRate: [16, 24],
          cooldownReduction: [12, 18],
          cleaveWidth: [28, 40],
          meleeRange: [28, 40],
          projectileSpeed: [32, 46],
          projectileRange: [32, 46],
          reachWidthSpeed: [28, 40],
          highStatBudget: [30, 44],
          conditionalBonuses: [28, 40],
          uniqueModifiers: [22, 34]
        }
      };
      const getOptionalStatRangeKey = (statText) => {
        const normalized = String(statText || "").toLowerCase();
        if (normalized.includes("attack speed")) return "attackSpeed";
        if (normalized.includes("throw rate")) return "throwRate";
        if (normalized.includes("cooldown reduction")) return "cooldownReduction";
        if (normalized.includes("cleave width")) return "cleaveWidth";
        if (normalized.includes("melee range")) return "meleeRange";
        if (normalized.includes("projectile speed")) return "projectileSpeed";
        if (normalized.includes("projectile range")) return "projectileRange";
        if (normalized.includes("reach/width/speed") || normalized.includes("reach width speed")) return "reachWidthSpeed";
        if (normalized.includes("high stat budget")) return "highStatBudget";
        if (normalized.includes("conditional bonuses")) return "conditionalBonuses";
        if (normalized.includes("unique modifiers")) return "uniqueModifiers";
        return "default";
      };
      const formatOptionalStatWithRange = (statText, rarityValue) => {
        const raw = String(statText || "").trim();
        if (!raw) return "";
        if (raw.includes("%")) return raw;
        const rarityKey = normalizeRarityKey(rarityValue);
        const tierRanges = optionalStatPercentRanges[rarityKey] || optionalStatPercentRanges.grey;
        const rangeKey = getOptionalStatRangeKey(raw);
        const range = tierRanges[rangeKey] || tierRanges.default;
        return `${raw} (+${range[0]}% to +${range[1]}%)`;
      };
      filteredWeapons.forEach((weapon) => {
        const weaponRef = weaponRefsById[weapon.id] || null;
        const rarityRows =
          weaponRef && Array.isArray(weaponRef.rarityTiers) && weaponRef.rarityTiers.length
            ? weaponRef.rarityTiers
            : defaultRarityOrder.map((rarityId) => ({
                rarity: rarityId,
                valueRange: defaultTierProfiles[rarityId].valueRange,
                optionalStats: defaultTierProfiles[rarityId].optionalStats,
                elementalOptions: defaultTierProfiles[rarityId].elementalOptions
              }));

        const goldUniqueNotes =
          weaponRef && Array.isArray(weaponRef.goldThemes) && weaponRef.goldThemes.length
            ? weaponRef.goldThemes.join(", ")
            : "Planned unique behavior";

        rarityRows.forEach((tier) => {
          const row = createElement("tr", "");
          if (!weapon.availableInMvp) {
            row.classList.add("item-ref-row-planned");
          }
          const rarityLabel = getLabel(rarities, tier.rarity || "") || toTitle(tier.rarity || "tier");
          const weaponType = `${weapon.label || toTitle(weapon.id)} (${toTitle(weapon.weaponCategory || "unknown")})`;
          const damageType = getLabel(physicalTypes, weapon.physicalDamageType || "");
          const damageRange = tier.valueRange || "Planned";
          const extraStats =
            Array.isArray(tier.optionalStats) && tier.optionalStats.length
              ? tier.optionalStats
                  .map((statText) => formatOptionalStatWithRange(statText, tier.rarity))
                  .filter(Boolean)
                  .join("; ")
              : "-";
          const elementalStats =
            Array.isArray(tier.elementalOptions) && tier.elementalOptions.length
              ? tier.elementalOptions.map((id) => getLabel(elementalTypes, id)).join(", ")
              : "-";
          const uniqueStats = String(tier.rarity || "").toLowerCase() === "gold" ? goldUniqueNotes : "-";
          const rarityCell = createElement("td", `item-ref-rarity-cell ${rarityCellClass(tier.rarity)}`, rarityLabel);
          row.appendChild(rarityCell);
          row.appendChild(createElement("td", "", weaponType));
          row.appendChild(createElement("td", "", getWeightLabel(weapon)));
          row.appendChild(createElement("td", "", damageType || "-"));
          row.appendChild(createElement("td", "", damageRange));
          row.appendChild(createElement("td", "", extraStats));
          row.appendChild(createElement("td", "", elementalStats));
          row.appendChild(createElement("td", "", uniqueStats));
          tbody.appendChild(row);
        });
      });

      if (!tbody.children.length) {
        const row = createElement("tr", "");
        const cell = createElement("td", "", "No weapons found for this type.");
        cell.colSpan = 8;
        row.appendChild(cell);
        tbody.appendChild(row);
      }

      table.appendChild(tbody);
      tableWrap.appendChild(table);
      tableSection.appendChild(tableWrap);
      dom.itemReferenceContent.appendChild(tableSection);
    }

    function setHomeStatus(text) {
      dom.homeStatus.textContent = text;
    }

    function showHomeScreen() {
      setVisible(dom.homeScreen, true);
      setVisible(dom.gameScreen, false);
      setVisible(dom.levelUpOverlay, false);
      setVisible(dom.pauseOverlay, false);
      setVisible(dom.endRunOverlay, false);
      setVisible(dom.deleteCharacterOverlay, false);
    }

    function showGameScreen() {
      setVisible(dom.homeScreen, false);
      setVisible(dom.gameScreen, true);
      setVisible(dom.levelUpOverlay, false);
      setVisible(dom.pauseOverlay, false);
      setVisible(dom.endRunOverlay, false);
      setVisible(dom.deleteCharacterOverlay, false);
    }

    function formatClassSkillTypeLabel(typeId) {
      const normalized = String(typeId || "").trim().toLowerCase();
      if (normalized === "active") return "Active";
      if (normalized === "passive_triggered") return "Triggered Passive";
      if (normalized === "passive") return "Passive";
      return toTitle(normalized || "skill");
    }

    function renderClassSkillHud(skills) {
      if (!dom.classSkillHud) return;
      const entries = Array.isArray(skills) ? skills.filter((entry) => entry && typeof entry === "object") : [];
      if (!entries.length) {
        dom.classSkillHud.innerHTML = "";
        dom.classSkillHud.classList.add("hidden");
        skillStripCache.signature = "";
        skillStripCache.byId = {};
        return;
      }

      dom.classSkillHud.classList.remove("hidden");
      const signature = entries.map((entry) => String(entry.id || "").trim()).join("|");
      if (skillStripCache.signature !== signature) {
        dom.classSkillHud.innerHTML = "";
        skillStripCache.signature = signature;
        skillStripCache.byId = {};

        const strip = createElement("div", "skill-strip");
        entries.forEach((entry) => {
          const skillId = String(entry.id || "").trim();
          if (!skillId) return;
          const item = createElement("article", "skill-item");
          item.dataset.skillId = skillId;

          const background = createElement("div", "skill-background");
          const iconPath = entry.iconPath || resolveSkillIconPathById(skillId);
          if (iconPath) {
            background.style.backgroundImage = `url(\"${iconPath}\")`;
          }

          const cooldownOverlay = createElement("div", "cooldown-overlay");
          const skillName = createElement("div", "skill-name", entry.name || toTitle(skillId));
          const keybind = createElement("div", "keybind-label", entry.keybind || "Passive");

          item.append(background, cooldownOverlay, skillName, keybind);
          strip.appendChild(item);
          skillStripCache.byId[skillId] = {
            item,
            background,
            cooldownOverlay,
            skillName,
            keybind
          };
        });

        dom.classSkillHud.appendChild(strip);
      }

      entries.forEach((entry) => {
        const skillId = String(entry.id || "").trim();
        const refs = skillStripCache.byId[skillId];
        if (!refs) return;
        const cooldownDuration = Math.max(0, Number(entry.cooldownDuration || 0));
        const cooldownRemaining = Math.max(0, Number(entry.cooldownRemaining || 0));
        const cooldownProgress =
          cooldownDuration > 0 ? Math.max(0, Math.min(1, cooldownRemaining / cooldownDuration)) : 0;

        refs.skillName.textContent = entry.name || toTitle(skillId);
        refs.keybind.textContent = entry.keybind || "Passive";
        refs.item.classList.toggle("skill-item-ready", cooldownProgress <= 0);
        refs.item.classList.toggle("skill-item-cooldown", cooldownProgress > 0);
        refs.item.setAttribute("aria-label", `${refs.skillName.textContent} - ${entry.statusText || "Ready"}`);
        refs.cooldownOverlay.style.height = `${(cooldownProgress * 100).toFixed(2)}%`;
        refs.cooldownOverlay.style.opacity = cooldownProgress > 0 ? "0.62" : "0";
      });
    }

    function updateHud(hud) {
      const hpCurrent = Math.max(0, Math.ceil(hud.hp || 0));
      const hpMax = Math.max(1, Math.ceil(hud.maxHp || 0));
      const healthPotionCharges = Math.max(0, Math.floor(Number(hud.healthPotionCharges || 0)));
      dom.hudName.textContent = hud.name || "-";
      dom.hudHp.textContent = `HP: ${hpCurrent}/${hpMax}`;
      dom.healthHudLabel.textContent = `HP: ${hpCurrent}/${hpMax}`;
      if (dom.healthPotionHudLabel) {
        dom.healthPotionHudLabel.textContent = `Potions (Q): ${healthPotionCharges}`;
      }
      dom.hudLevel.textContent = `Level: ${hud.level || 1}`;
      dom.hudGold.textContent = `Gold: ${hud.gold || 0}`;
      dom.hudLegacy.textContent = `Legacy XP: ${hud.legacy || 0}`;
      const rageCurrent = Math.max(0, Number(hud.rageCurrent || 0));
      const rageMax = Math.max(1, Number(hud.rageMax || 100));
      const rageActive = Boolean(hud.rageActive);
      const rageSeconds = Math.max(0, Number(hud.rageSeconds || 0));
      dom.hudRage.textContent = rageActive
        ? `Rage: ${Math.floor(rageCurrent)}/${Math.floor(rageMax)} (Active ${rageSeconds.toFixed(1)}s)`
        : `Rage: ${Math.floor(rageCurrent)}/${Math.floor(rageMax)}`;
      const timerText = formatTime(hud.time || 0);
      if (dom.roundTimerHudLabel) {
        dom.roundTimerHudLabel.textContent = timerText;
      }
      if (dom.hudTimer) {
        dom.hudTimer.textContent = timerText;
      }
      const rageProgress = Math.max(0, Math.min(1, rageCurrent / rageMax));
      dom.rageFill.style.width = `${(rageProgress * 100).toFixed(2)}%`;
      dom.rageFill.classList.toggle("active", rageActive);
      const hpProgress = Math.max(0, Math.min(1, hpCurrent / hpMax));
      dom.healthFill.style.width = `${(hpProgress * 100).toFixed(2)}%`;
      const xpProgress = Math.max(0, Math.min(1, hud.xpProgress || 0));
      dom.xpFill.style.width = `${(xpProgress * 100).toFixed(2)}%`;
      renderClassSkillHud(hud.classSkills);
    }

    function showLevelUp(options, level) {
      if (dom.levelUpTitle) {
        const safeLevel = Math.max(1, Math.floor(Number(level || 1)));
        dom.levelUpTitle.textContent = `Level ${safeLevel}`;
      }
      dom.levelUpOptions.innerHTML = "";
      options.forEach((option) => {
        const button = createElement("button", "upgrade-option");
        button.type = "button";
        const iconPath =
          resolveSkillIconPathById(option.skillId || option.upgradeId || option.id) ||
          resolveSkillIconPathById(option.id);
        const icon = createSkillIcon(iconPath, option.title || option.id, "upgrade-skill-icon");
        const head = createElement("div", "upgrade-head");
        if (icon) {
          head.appendChild(icon);
        } else {
          head.classList.add("upgrade-head-no-icon");
        }
        const name = createElement("div", "upgrade-name", option.title);
        const desc = createElement("div", "upgrade-desc", option.description);
        const textWrap = createElement("div", "upgrade-copy");
        textWrap.append(name, desc);
        head.appendChild(textWrap);
        button.append(head);
        button.addEventListener("click", () => {
          if (handlers.onChooseUpgrade) handlers.onChooseUpgrade(option.id);
        });
        dom.levelUpOptions.appendChild(button);
      });
      setVisible(dom.levelUpOverlay, true);
    }

    function hideLevelUp() {
      setVisible(dom.levelUpOverlay, false);
    }

    function showPause() {
      setVisible(dom.pauseOverlay, true);
    }

    function hidePause() {
      setVisible(dom.pauseOverlay, false);
    }

    function showEndRun(summary) {
      dom.endRunStats.innerHTML = "";
      const rows = [
        `Character: ${summary.characterName}`,
        `Level completed: ${summary.levelLabel || "Level 1"}`,
        `Difficulty: D${Math.max(1, Math.floor(Number(summary.completedDifficulty || 1)))}`,
        `Time survived: ${formatTime(summary.timeSurvived)}`,
        `Enemies defeated: ${summary.enemiesKilled}`,
        `Gold earned: ${summary.goldEarned}`,
        `New bestiary entries: ${Math.max(0, Math.floor(Number(summary.newBestiaryEntries || 0)))}`,
        `Legacy XP earned: ${summary.legacyXpEarned}`,
        `Minibosses defeated: ${summary.minibossesDefeated}`,
        `Final boss appeared: ${summary.finalBossAppeared ? "Yes" : "No"}`,
        `Final boss defeated: ${summary.finalBossDefeated ? "Yes" : "No"}`
      ];
      if (summary.legacyXpBlockedReason) {
        rows.push(String(summary.legacyXpBlockedReason));
      }
      if (summary.finalBossDefeated) {
        rows.push(`Boss chest opened: ${summary.bossChestOpened ? "Yes" : "No"}`);
        rows.push(`Boss chest loot found: ${Math.max(0, Number(summary.bossChestItemsFound || 0))}`);
        rows.push(`Boss chest loot stored: ${Math.max(0, Number(summary.bossChestItemsStored || 0))}`);
        if (Number(summary.bossChestItemsOverflow || 0) > 0) {
          rows.push(`Boss chest overflow (storage full): ${Math.max(0, Number(summary.bossChestItemsOverflow || 0))}`);
        }
      }
      rows.forEach((text) => {
        const row = createElement("div", "", text);
        dom.endRunStats.appendChild(row);
      });
      setVisible(dom.endRunOverlay, true);
    }

    function hideEndRun() {
      setVisible(dom.endRunOverlay, false);
    }

    return {
      init,
      showHomeScreen,
      showGameScreen,
      setHomeStatus,
      renderCharacterList,
      renderCharacterDetails,
      revealStorageLocation,
      updateHud,
      showLevelUp,
      hideLevelUp,
      showPause,
      hidePause,
      showEndRun,
      hideEndRun
    };
  }

  window.RL_UI = Object.freeze({
    createUiController
  });
})();
