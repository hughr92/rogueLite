(function () {
  const STORAGE_KEY = window.RL_DATA.STORAGE.charactersKey;
  const LEGACY = window.RL_DATA.LEGACY_PROGRESSION || { baseXp: 90, growth: 1.18 };
  const ITEM_DEFINITIONS = window.RL_DATA.ITEM_DEFINITIONS || {};
  const STARTER_LOADOUTS = window.RL_DATA.STARTER_LOADOUTS || {};
  const MERCHANT = window.RL_DATA.MERCHANT || {};
  const QUESTS = window.RL_DATA.QUESTS || {};
  const POWERUPS = window.RL_DATA.POWERUPS || {};
  const BOUNTIES = window.RL_DATA.BOUNTIES || {};
  const LEVELS = Array.isArray(window.RL_DATA.LEVELS) ? window.RL_DATA.LEVELS : [];
  const WEAPON_MASTERY = window.RL_DATA.WEAPON_MASTERY || {};
  const DIFFICULTY_MODIFIER = window.RL_DATA.DIFFICULTY_MODIFIER || {};

  function nowIso() {
    return new Date().toISOString();
  }

  function xpRequiredForNextLegacyLevel(level) {
    return Math.max(1, Math.floor(LEGACY.baseXp * Math.pow(level, LEGACY.growth)));
  }

  function getAllQuestDefinitions() {
    const groups = QUESTS && typeof QUESTS === "object" ? Object.values(QUESTS) : [];
    return groups.reduce((list, value) => {
      if (!Array.isArray(value)) return list;
      return list.concat(value.filter((quest) => quest && typeof quest === "object" && quest.id));
    }, []);
  }

  function getQuestDefinitionById(questId) {
    const normalizedId = String(questId || "").trim();
    if (!normalizedId) return null;
    const quests = getAllQuestDefinitions();
    return quests.find((quest) => quest.id === normalizedId) || null;
  }

  function isQuestAvailableForCharacter(characterLike, questDefinition) {
    if (!questDefinition || typeof questDefinition !== "object") return false;
    if (questDefinition.availableFromStart !== false) return true;
    const character = characterLike && typeof characterLike === "object" ? characterLike : {};
    const requiredQuestId = String(questDefinition.requiredQuestId || "").trim();
    if (!requiredQuestId) return false;
    const claims = normalizeQuestClaims(character.questClaims);
    return claims[requiredQuestId] === true;
  }

  function normalizeQuestClaims(rawClaims) {
    const result = {};
    if (!rawClaims || typeof rawClaims !== "object" || Array.isArray(rawClaims)) return result;
    Object.entries(rawClaims).forEach(([questId, value]) => {
      if (!questId) return;
      if (value === true) {
        result[questId] = true;
      }
    });
    return result;
  }

  function normalizeUnlockedPickups(rawUnlocked) {
    const result = {};
    if (!rawUnlocked || typeof rawUnlocked !== "object" || Array.isArray(rawUnlocked)) return result;
    Object.entries(rawUnlocked).forEach(([pickupId, value]) => {
      if (!pickupId) return;
      if (value === true) {
        result[pickupId] = true;
      }
    });
    return result;
  }

  function normalizeUnlockedFeatures(rawUnlocked) {
    const result = {};
    if (!rawUnlocked || typeof rawUnlocked !== "object" || Array.isArray(rawUnlocked)) return result;
    Object.entries(rawUnlocked).forEach(([featureId, value]) => {
      if (!featureId) return;
      if (value === true) {
        result[featureId] = true;
      }
    });
    return result;
  }

  function normalizeBestiaryDiscoveries(rawDiscoveries) {
    const result = {};
    if (Array.isArray(rawDiscoveries)) {
      rawDiscoveries.forEach((enemyTypeId) => {
        const id = String(enemyTypeId || "").trim();
        if (!id) return;
        result[id] = true;
      });
      return result;
    }
    if (!rawDiscoveries || typeof rawDiscoveries !== "object") return result;
    Object.entries(rawDiscoveries).forEach(([enemyTypeId, discovered]) => {
      const id = String(enemyTypeId || "").trim();
      if (!id || discovered !== true) return;
      result[id] = true;
    });
    return result;
  }

  function normalizeEnemyKillCounts(rawCounts) {
    const result = {};
    if (!rawCounts || typeof rawCounts !== "object" || Array.isArray(rawCounts)) return result;
    Object.entries(rawCounts).forEach(([enemyTypeId, value]) => {
      const id = String(enemyTypeId || "").trim();
      if (!id) return;
      const numeric = Math.max(0, Math.floor(Number(value || 0)));
      if (numeric <= 0) return;
      result[id] = numeric;
    });
    return result;
  }

  function normalizeBountyClaims(rawClaims) {
    const stepCap = getBountyStepCount();
    const result = {};
    if (Array.isArray(rawClaims)) {
      rawClaims.forEach((enemyTypeId) => {
        const id = String(enemyTypeId || "").trim();
        if (!id) return;
        result[id] = stepCap;
      });
      return result;
    }
    if (!rawClaims || typeof rawClaims !== "object" || Array.isArray(rawClaims)) return result;
    Object.entries(rawClaims).forEach(([enemyTypeId, claimedValue]) => {
      const id = String(enemyTypeId || "").trim();
      if (!id) return;
      if (claimedValue === true) {
        result[id] = stepCap;
        return;
      }
      if (claimedValue === false || claimedValue === null || typeof claimedValue === "undefined") return;
      const parsed = Number(claimedValue);
      if (Number.isNaN(parsed)) return;
      const claimedStep = Math.max(0, Math.min(stepCap, Math.floor(parsed)));
      if (claimedStep <= 0) return;
      result[id] = claimedStep;
    });
    return result;
  }

  function normalizeBountyDamageBonuses(rawBonuses) {
    const result = {};
    if (!rawBonuses || typeof rawBonuses !== "object" || Array.isArray(rawBonuses)) return result;
    Object.entries(rawBonuses).forEach(([enemyTypeId, rawValue]) => {
      const id = String(enemyTypeId || "").trim();
      if (!id) return;
      const numeric = Number(rawValue);
      if (Number.isNaN(numeric)) return;
      const bonus = Math.max(0, Math.min(5, numeric));
      if (bonus <= 0) return;
      result[id] = bonus;
    });
    return result;
  }

  function normalizeReviveConsumableCharges(rawValue, maxOwned) {
    const parsed = Number(rawValue);
    const cap = Math.max(0, Math.floor(Number(maxOwned || 1)));
    if (Number.isNaN(parsed)) return 0;
    return Math.max(0, Math.min(cap, Math.floor(parsed)));
  }

  function normalizeHealthPotionCharges(rawValue, maxOwned) {
    const parsed = Number(rawValue);
    const cap = Math.max(0, Math.floor(Number(maxOwned || 1)));
    if (Number.isNaN(parsed)) return 0;
    return Math.max(0, Math.min(cap, Math.floor(parsed)));
  }

  function roundXpRewardToNearestTen(rawValue) {
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) return 0;
    return Math.max(0, Math.round(parsed / 10) * 10);
  }

  function getBountyStepCount() {
    const configured = Number(BOUNTIES && BOUNTIES.maxSteps);
    if (Number.isNaN(configured)) return 5;
    return Math.max(1, Math.floor(configured));
  }

  function getQuestProgressSnapshot(characterLike, questDefinition) {
    const character = characterLike && typeof characterLike === "object" ? characterLike : {};
    const requirement = (questDefinition && questDefinition.requirement) || {};
    const requirementType = requirement.type || "";
    const target = Math.max(1, Math.floor(Number(requirement.target || 1)));

    if (requirementType === "legacy_xp_total") {
      const current = Math.max(0, Math.floor(Number(character.legacyXp || 0)));
      return {
        current,
        target,
        complete: current >= target
      };
    }
    if (requirementType === "total_gold_collected") {
      const current = Math.max(0, Math.floor(Number(character.lifetimeGoldCollected || 0)));
      return {
        current,
        target,
        complete: current >= target
      };
    }
    if (requirementType === "miniboss_kills_total") {
      const current = Math.max(0, Math.floor(Number(character.minibossKills || 0)));
      return {
        current,
        target,
        complete: current >= target
      };
    }
    if (requirementType === "enemy_kills_total") {
      const current = Math.max(0, Math.floor(Number(character.enemyKills || 0)));
      return {
        current,
        target,
        complete: current >= target
      };
    }
    if (requirementType === "deaths_total") {
      const current = Math.max(0, Math.floor(Number(character.deaths || 0)));
      return {
        current,
        target,
        complete: current >= target
      };
    }

    return {
      current: 0,
      target,
      complete: false
    };
  }

  function applyQuestRewardUnlocks(unlockedState, questDefinition) {
    const source = unlockedState && typeof unlockedState === "object" ? unlockedState : {};
    const next = {
      pickups: normalizeUnlockedPickups(source.pickups),
      features: normalizeUnlockedFeatures(source.features)
    };
    const reward = (questDefinition && questDefinition.reward) || {};
    if (reward.type === "unlock_pickup" && reward.pickupId) {
      next.pickups[reward.pickupId] = true;
      return next;
    }
    if (reward.type === "unlock_feature" && reward.featureId) {
      next.features[reward.featureId] = true;
      return next;
    }
    return next;
  }

  function createEmptyStorageSlots() {
    return new Array(30).fill(null);
  }

  function normalizeEquipmentSlotKey(slotKey) {
    if (!slotKey || typeof slotKey !== "string") return "";
    if (slotKey === "primaryWeapon") return "primaryMeleeWeapon";
    if (slotKey === "secondaryWeapon") return "rangedWeapon";
    return slotKey;
  }

  function getDefaultAllowedSlotsForItemType(itemType) {
    if (itemType === "melee_weapon") return ["primaryMeleeWeapon", "secondaryMeleeWeapon"];
    if (itemType === "ranged_weapon") return ["rangedWeapon"];
    if (itemType === "helmet") return ["helmet"];
    if (itemType === "chest") return ["chest"];
    if (itemType === "leggings") return ["leggings"];
    if (itemType === "boots") return ["boots"];
    if (itemType === "ring") return ["ring1", "ring2"];
    if (itemType === "amulet") return ["amulet"];
    return [];
  }

  function uniqueStrings(values) {
    const seen = {};
    const result = [];
    values.forEach((value) => {
      if (!value || seen[value]) return;
      seen[value] = true;
      result.push(value);
    });
    return result;
  }

  function getAllowedSlotsForItem(item) {
    if (!item || typeof item !== "object") return [];
    const rawSlots = Array.isArray(item.allowedSlots)
      ? item.allowedSlots
      : typeof item.allowedSlot === "string"
      ? [item.allowedSlot]
      : [];
    const normalizedSlots = uniqueStrings(
      rawSlots
        .map((slotKey) => normalizeEquipmentSlotKey(slotKey))
        .filter((slotKey) => typeof slotKey === "string" && slotKey.length > 0)
    );
    if (normalizedSlots.length) return normalizedSlots;
    return getDefaultAllowedSlotsForItemType(item.itemType);
  }

  function getNormalizedWeaponSlotWeight(itemType, weightValue) {
    if (itemType !== "melee_weapon" && itemType !== "ranged_weapon") return null;
    const parsed = Number(weightValue);
    if (Number.isNaN(parsed)) return 1;
    return Math.max(1, Math.min(2, Math.floor(parsed)));
  }

  function isWeaponItemType(itemType) {
    return itemType === "melee_weapon" || itemType === "ranged_weapon";
  }

  function getWeaponMasteryThresholdsForRarity(rarityId) {
    const normalizedRarity = String(rarityId || "").trim().toLowerCase();
    const rawThresholds = WEAPON_MASTERY.thresholdsByRarity && WEAPON_MASTERY.thresholdsByRarity[normalizedRarity];
    const parsedThresholds = Array.isArray(rawThresholds)
      ? rawThresholds
          .map((value) => Math.max(1, Math.floor(Number(value || 0))))
          .filter((value) => Number.isFinite(value) && value > 0)
      : [];
    const deduped = [];
    parsedThresholds.forEach((value) => {
      if (!deduped.length || value > deduped[deduped.length - 1]) {
        deduped.push(value);
      }
    });
    if (deduped.length) return deduped;
    return [100];
  }

  function getWeaponMasteryTierCapForRarity(rarityId) {
    const normalizedRarity = String(rarityId || "").trim().toLowerCase();
    const explicitCap = Number(
      WEAPON_MASTERY.tiersByRarity && WEAPON_MASTERY.tiersByRarity[normalizedRarity]
    );
    const thresholdCap = getWeaponMasteryThresholdsForRarity(normalizedRarity).length;
    const tierCap = Number.isNaN(explicitCap) ? thresholdCap : Math.max(1, Math.floor(explicitCap));
    return Math.min(tierCap, thresholdCap);
  }

  function getWeaponMasteryUnlockedTiers(rarityId, killsTotal) {
    const thresholds = getWeaponMasteryThresholdsForRarity(rarityId);
    const tierCap = getWeaponMasteryTierCapForRarity(rarityId);
    const kills = Math.max(0, Math.floor(Number(killsTotal || 0)));
    let unlocked = 0;
    for (let i = 0; i < thresholds.length && unlocked < tierCap; i += 1) {
      if (kills >= thresholds[i]) {
        unlocked += 1;
      } else {
        break;
      }
    }
    return Math.max(0, Math.min(tierCap, unlocked));
  }

  function normalizeWeaponMasteryState(rawMastery, rarityId) {
    const source = rawMastery && typeof rawMastery === "object" ? rawMastery : {};
    const tierCap = getWeaponMasteryTierCapForRarity(rarityId);
    const killsTotal = Math.max(0, Math.floor(Number(source.killsTotal || 0)));
    const unlockedFromKills = getWeaponMasteryUnlockedTiers(rarityId, killsTotal);
    const explicitTiers = Math.max(0, Math.floor(Number(source.tiersUnlocked || 0)));
    const tiersUnlocked = Math.max(0, Math.min(tierCap, Math.max(unlockedFromKills, explicitTiers)));
    return {
      killsTotal,
      tiersUnlocked
    };
  }

  function normalizeItemStats(rawStats) {
    const base = rawStats && typeof rawStats === "object" ? { ...rawStats } : {};

    const legacyMelee = Number(base.meleeDamageBonus);
    if (!Number.isNaN(legacyMelee)) {
      const current = Number(base.slashingDamageBonus);
      base.slashingDamageBonus = (Number.isNaN(current) ? 0 : current) + legacyMelee;
      delete base.meleeDamageBonus;
    }

    const legacyRanged = Number(base.rangedDamageBonus);
    if (!Number.isNaN(legacyRanged)) {
      const current = Number(base.piercingDamageBonus);
      base.piercingDamageBonus = (Number.isNaN(current) ? 0 : current) + legacyRanged;
      delete base.rangedDamageBonus;
    }

    return base;
  }

  function normalizeItem(item) {
    if (!item || typeof item !== "object") return null;
    const { mastery: rawMastery, ...restItem } = item;
    const allowedSlots = getAllowedSlotsForItem(item);
    const weaponSlotWeight = getNormalizedWeaponSlotWeight(item.itemType, item.weaponSlotWeight);
    const normalized = {
      ...restItem,
      allowedSlots,
      allowedSlot: allowedSlots[0] || null,
      weaponSlotWeight,
      itemCategory: item.itemCategory || null,
      weaponCategory: item.weaponCategory || null,
      physicalDamageType: item.physicalDamageType || null,
      merchantXpEligible: item.merchantXpEligible !== false,
      stats: normalizeItemStats(item.stats)
    };
    if (isWeaponItemType(normalized.itemType)) {
      normalized.mastery = normalizeWeaponMasteryState(rawMastery, normalized.rarity);
    }
    return normalized;
  }

  function isStoredInventoryItem(item) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const hasType = typeof item.itemType === "string" && item.itemType.length > 0;
    const hasIdentity =
      (typeof item.templateId === "string" && item.templateId.length > 0) ||
      (typeof item.name === "string" && item.name.trim().length > 0);
    return hasType && hasIdentity;
  }

  function createItemInstance(itemDefinitionId, ownerCharacterId) {
    const definition = ITEM_DEFINITIONS[itemDefinitionId];
    if (!definition) return null;
    const rawAllowedSlots = Array.isArray(definition.allowedSlots)
      ? definition.allowedSlots
      : typeof definition.allowedSlot === "string"
      ? [definition.allowedSlot]
      : [];
    const normalizedAllowedSlots = uniqueStrings(
      rawAllowedSlots
        .map((slotKey) => normalizeEquipmentSlotKey(slotKey))
        .filter((slotKey) => slotKey.length > 0)
    );
    const allowedSlots = normalizedAllowedSlots.length
      ? normalizedAllowedSlots
      : getDefaultAllowedSlotsForItemType(definition.itemType);
    const weaponSlotWeight = getNormalizedWeaponSlotWeight(definition.itemType, definition.weaponSlotWeight);
    const item = {
      instanceId: `itm_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      templateId: definition.id,
      name: definition.name,
      rarity: definition.rarity,
      itemType: definition.itemType,
      itemCategory: definition.itemCategory || null,
      weaponCategory: definition.weaponCategory || null,
      physicalDamageType: definition.physicalDamageType || null,
      allowedSlots,
      allowedSlot: allowedSlots[0] || null,
      weaponSlotWeight,
      itemLevel: definition.itemLevel || 1,
      stats: normalizeItemStats(definition.stats),
      merchantXpEligible: true,
      ownerCharacterId: ownerCharacterId || null
    };
    if (isWeaponItemType(item.itemType)) {
      item.mastery = normalizeWeaponMasteryState(null, item.rarity);
    }
    return item;
  }

  function getEligibleQuestRewardDefinitions(classId, rarityId) {
    const normalizedRarity = String(rarityId || "").trim().toLowerCase();
    if (!normalizedRarity) return [];
    return Object.values(ITEM_DEFINITIONS).filter((definition) => {
      if (!definition || typeof definition !== "object") return false;
      if (String(definition.rarity || "").toLowerCase() !== normalizedRarity) return false;
      const classIds = Array.isArray(definition.classIds) ? definition.classIds : [];
      if (!classIds.length) return true;
      return classIds.includes(classId);
    });
  }

  function getBountyProfileForEnemy(enemyTypeId) {
    const normalizedEnemyTypeId = String(enemyTypeId || "").trim();
    if (!normalizedEnemyTypeId) return null;
    const enemyDefinitions = window.RL_DATA.ENEMIES || {};
    const enemy = enemyDefinitions[normalizedEnemyTypeId];
    if (!enemy || typeof enemy !== "object") return null;

    const targetByBehavior = (BOUNTIES && BOUNTIES.targetByBehavior) || {};
    const rewardItemCountByBehavior = (BOUNTIES && BOUNTIES.rewardItemCountByBehavior) || {};
    const levelRewardRarity = (BOUNTIES && BOUNTIES.levelRewardRarity) || { 1: "purple" };
    const levelRewardXp = (BOUNTIES && BOUNTIES.levelRewardXp) || {};
    const killMultipliersByStep = Array.isArray(BOUNTIES && BOUNTIES.killMultipliersByStep)
      ? BOUNTIES.killMultipliersByStep
      : [];
    const xpMultipliersByStep = Array.isArray(BOUNTIES && BOUNTIES.xpMultipliersByStep)
      ? BOUNTIES.xpMultipliersByStep
      : [];
    const parsedDamageBonusPct = Number(BOUNTIES && BOUNTIES.damageBonusPctPerStep);
    const damageBonusPctPerStep = Number.isNaN(parsedDamageBonusPct) ? 0.03 : Math.max(0.005, Math.min(0.25, parsedDamageBonusPct));
    const stepCount = getBountyStepCount();
    const parsedDefaultTarget = Number(BOUNTIES && BOUNTIES.defaultTarget);
    const defaultTarget = Number.isNaN(parsedDefaultTarget) ? 50 : Math.max(1, Math.floor(parsedDefaultTarget));
    const parsedDefaultRewardCount = Number(BOUNTIES && BOUNTIES.defaultRewardItemCount);
    const defaultRewardItemCount = Number.isNaN(parsedDefaultRewardCount)
      ? 1
      : Math.max(1, Math.floor(parsedDefaultRewardCount));
    const parsedDefaultXpReward = Number(BOUNTIES && BOUNTIES.defaultXpReward);
    const defaultXpReward = roundXpRewardToNearestTen(Number.isNaN(parsedDefaultXpReward) ? 30 : parsedDefaultXpReward);

    const parsedLevel = Number(enemy.bountyLevel || enemy.level || 1);
    const level = Number.isNaN(parsedLevel) ? 1 : Math.max(1, Math.floor(parsedLevel));
    const rewardRarityKeys = Object.keys(levelRewardRarity)
      .map((key) => Math.floor(Number(key)))
      .filter((value) => !Number.isNaN(value) && value > 0)
      .sort((a, b) => a - b);
    let rewardRarityLookupLevel = 1;
    if (rewardRarityKeys.length) {
      rewardRarityLookupLevel = rewardRarityKeys[0];
      for (let i = 0; i < rewardRarityKeys.length; i += 1) {
        if (rewardRarityKeys[i] <= level) {
          rewardRarityLookupLevel = rewardRarityKeys[i];
        }
      }
    }
    const rewardRarity =
      String(levelRewardRarity[rewardRarityLookupLevel] || levelRewardRarity[1] || "purple").trim().toLowerCase() ||
      "purple";

    const behavior = String(enemy.behavior || "").trim();
    const behaviorTarget = Number(targetByBehavior[behavior]);
    const baseTarget = Math.max(
      1,
      Math.floor(
        Number(enemy.bountyTarget) ||
          (Number.isNaN(behaviorTarget) ? defaultTarget : behaviorTarget) ||
          defaultTarget
      )
    );

    const behaviorRewardCount = Number(rewardItemCountByBehavior[behavior]);
    const rewardItemCount = Math.max(
      1,
      Math.floor(
        Number(enemy.bountyRewardItemCount) ||
          (Number.isNaN(behaviorRewardCount) ? defaultRewardItemCount : behaviorRewardCount) ||
          defaultRewardItemCount
      )
    );
    const configuredLevelXp = Number(levelRewardXp[level]);
    const enemyConfiguredXp = Number(enemy.bountyXpReward);
    let xpRewardSource = defaultXpReward + Math.max(0, level - 1) * 20;
    if (!Number.isNaN(configuredLevelXp)) {
      xpRewardSource = configuredLevelXp;
    }
    if (!Number.isNaN(enemyConfiguredXp)) {
      xpRewardSource = enemyConfiguredXp;
    }
    const baseXpReward = roundXpRewardToNearestTen(xpRewardSource);

    const steps = [];
    let previousTarget = 0;
    for (let i = 0; i < stepCount; i += 1) {
      const configuredKillMultiplier = Number(killMultipliersByStep[i]);
      const killMultiplier = Number.isNaN(configuredKillMultiplier)
        ? (i === 0 ? 1 : 1 + i * 0.8)
        : Math.max(0.1, configuredKillMultiplier);
      const stepTarget = Math.max(previousTarget + 1, Math.floor(baseTarget * killMultiplier));
      previousTarget = stepTarget;

      const configuredXpMultiplier = Number(xpMultipliersByStep[i]);
      const xpMultiplier = Number.isNaN(configuredXpMultiplier)
        ? (1 + i * 0.35)
        : Math.max(0.1, configuredXpMultiplier);
      const stepXpReward = roundXpRewardToNearestTen(baseXpReward * xpMultiplier);
      const isFinalStep = i === stepCount - 1;

      steps.push({
        step: i + 1,
        target: stepTarget,
        xpReward: stepXpReward,
        damageBonusPct: damageBonusPctPerStep,
        grantsItem: isFinalStep,
        rewardRarity: isFinalStep ? rewardRarity : null,
        rewardItemCount: isFinalStep ? rewardItemCount : 0
      });
    }

    return {
      enemyTypeId: normalizedEnemyTypeId,
      enemyLabel: enemy.label || normalizedEnemyTypeId,
      behavior,
      level,
      target: steps.length ? steps[steps.length - 1].target : baseTarget,
      rewardRarity,
      rewardItemCount,
      xpReward: baseXpReward,
      damageBonusPctPerStep,
      stepCount,
      steps
    };
  }

  function getMerchantRefreshRuns() {
    const configured = Number(MERCHANT.refreshRuns);
    if (Number.isNaN(configured)) return 5;
    return Math.max(1, Math.floor(configured));
  }

  function getMerchantRefreshMinRunSeconds() {
    const configured = Number(MERCHANT.refreshMinRunSeconds);
    if (Number.isNaN(configured)) return 120;
    return Math.max(0, Math.floor(configured));
  }

  function getMerchantInventorySize() {
    const configured = Number(MERCHANT.defaultInventorySize);
    if (Number.isNaN(configured)) return 6;
    return Math.max(1, Math.floor(configured));
  }

  function getMerchantManualRefreshCost(highestUnlockedLevel) {
    const manualRefresh = (MERCHANT && MERCHANT.manualRefresh) || {};
    const parsedBaseCost = Number(manualRefresh.baseCost);
    const parsedPerLevel = Number(manualRefresh.costPerUnlockedLevel);
    const baseCost = Number.isNaN(parsedBaseCost) ? 50 : Math.max(1, Math.floor(parsedBaseCost));
    const perLevel = Number.isNaN(parsedPerLevel) ? 20 : Math.max(0, Math.floor(parsedPerLevel));
    const level = normalizeHighestUnlockedLevel(highestUnlockedLevel || 1);
    return Math.max(1, baseCost + Math.max(0, level - 1) * perLevel);
  }

  function getDefaultProgressionLevel() {
    const configured = Number(MERCHANT.defaultProgressionLevel);
    if (Number.isNaN(configured)) return 1;
    return Math.max(1, Math.floor(configured));
  }

  function getConfiguredMaxRunLevel() {
    if (!Array.isArray(LEVELS) || !LEVELS.length) return 1;
    let maxLevel = 1;
    LEVELS.forEach((level) => {
      const parsed = Math.max(1, Math.floor(Number(level && level.index)));
      if (!Number.isNaN(parsed)) {
        maxLevel = Math.max(maxLevel, parsed);
      }
    });
    return maxLevel;
  }

  function normalizeHighestUnlockedLevel(value) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return 1;
    return Math.max(1, Math.floor(parsed));
  }

  function getDefaultDifficultyLevel() {
    const parsed = Number(DIFFICULTY_MODIFIER.defaultDifficulty);
    if (Number.isNaN(parsed)) return 1;
    return Math.max(1, Math.floor(parsed));
  }

  function getMaxDifficultyLevel() {
    const parsed = Number(DIFFICULTY_MODIFIER.maxDifficulty);
    if (Number.isNaN(parsed)) return 10;
    return Math.max(getDefaultDifficultyLevel(), Math.floor(parsed));
  }

  function normalizeDifficultyLevel(value) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return getDefaultDifficultyLevel();
    return clampToRange(Math.floor(parsed), getDefaultDifficultyLevel(), getMaxDifficultyLevel());
  }

  function getCanonicalLevelIdsByIndex() {
    const map = {};
    LEVELS.forEach((level) => {
      if (!level || typeof level !== "object") return;
      const index = Math.max(1, Math.floor(Number(level.index || 1)));
      const levelId = String(level.id || `level_${index}`).trim();
      if (!levelId) return;
      map[index] = levelId;
    });
    if (!map[1]) map[1] = "level_1";
    return map;
  }

  function getLevelIdFromIndex(levelIndex) {
    const index = Math.max(1, Math.floor(Number(levelIndex || 1)));
    const map = getCanonicalLevelIdsByIndex();
    return map[index] || `level_${index}`;
  }

  function normalizeHighestDifficultyByLevel(rawMap, highestUnlockedLevel) {
    const source = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
    const normalized = {};
    const maxDifficulty = getMaxDifficultyLevel();
    const defaultDifficulty = getDefaultDifficultyLevel();
    const maxUnlockedLevel = normalizeHighestUnlockedLevel(highestUnlockedLevel || 1);

    for (let levelIndex = 1; levelIndex <= maxUnlockedLevel; levelIndex += 1) {
      const levelId = getLevelIdFromIndex(levelIndex);
      const explicitRaw = source[levelId];
      const legacyRaw = source[levelIndex];
      const fallbackRaw = source[`level_${levelIndex}`];
      const explicitValue =
        typeof explicitRaw !== "undefined"
          ? explicitRaw
          : typeof legacyRaw !== "undefined"
          ? legacyRaw
          : fallbackRaw;
      const parsedExplicit = Number(explicitValue);
      const unlockedDifficulty = Number.isNaN(parsedExplicit)
        ? defaultDifficulty
        : clampToRange(Math.floor(parsedExplicit), defaultDifficulty, maxDifficulty);
      normalized[levelId] = unlockedDifficulty;
    }

    if (!Object.keys(normalized).length) {
      normalized.level_1 = defaultDifficulty;
    }

    return normalized;
  }

  function clampToRange(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeProgressionLevel(levelValue) {
    const parsed = Number(levelValue);
    if (Number.isNaN(parsed)) return getDefaultProgressionLevel();
    return Math.max(1, Math.floor(parsed));
  }

  function getMerchantProgressionConfig() {
    const base = (MERCHANT && MERCHANT.progression) || {};
    const parsedXpPerGold = Number(base.xpPerGoldSpent);
    const parsedBaseXp = Number(base.baseXpToLevel);
    const parsedGrowth = Number(base.growth);
    const parsedLevelsPerGame = Number(base.levelsPerGameLevel);
    const parsedMaxLevel = Number(base.maxLevel);
    const parsedMaxPurpleAt5 = Number(base.maxPurpleListingsAtLevel5);
    const blueScaling = (base.blueStatScaling && typeof base.blueStatScaling === "object")
      ? base.blueStatScaling
      : {};
    const parsedBlueStart = Number(blueScaling.startLevel);
    const parsedBluePerLevel = Number(blueScaling.perLevel);
    const parsedBlueMaxMultiplier = Number(blueScaling.maxMultiplier);
    const reviveRaw = (base.reviveConsumable && typeof base.reviveConsumable === "object")
      ? base.reviveConsumable
      : {};
    const parsedRevivePrice = Number(reviveRaw.price);
    const parsedReviveMaxOwned = Number(reviveRaw.maxOwned);
    const parsedReviveHpPct = Number(reviveRaw.reviveHpPct);
    const parsedReviveInvulnSeconds = Number(reviveRaw.postReviveInvulnSeconds);
    const healthPotionRaw = (base.healthPotion && typeof base.healthPotion === "object")
      ? base.healthPotion
      : {};
    const parsedHealthPotionPrice = Number(healthPotionRaw.price);
    const parsedHealthPotionUnlockAt = Number(healthPotionRaw.unlockAtMerchantLevel);
    const parsedHealthPotionMaxOwned = Number(healthPotionRaw.maxOwned);
    const parsedHealthPotionHealPct = Number(healthPotionRaw.healHpPct);

    return {
      xpPerGoldSpent: Number.isNaN(parsedXpPerGold) ? 1 : Math.max(0, parsedXpPerGold),
      baseXpToLevel: Number.isNaN(parsedBaseXp) ? 300 : Math.max(20, Math.floor(parsedBaseXp)),
      growth: Number.isNaN(parsedGrowth) ? 1.5 : Math.max(1.05, parsedGrowth),
      levelsPerGameLevel: Number.isNaN(parsedLevelsPerGame) ? 5 : Math.max(1, Math.floor(parsedLevelsPerGame)),
      maxLevel: Number.isNaN(parsedMaxLevel) ? 30 : Math.max(1, Math.floor(parsedMaxLevel)),
      maxPurpleListingsAtLevel5: Number.isNaN(parsedMaxPurpleAt5) ? 1 : Math.max(0, Math.floor(parsedMaxPurpleAt5)),
      blueStatScaling: {
        startLevel: Number.isNaN(parsedBlueStart) ? 2 : Math.max(1, Math.floor(parsedBlueStart)),
        perLevel: Number.isNaN(parsedBluePerLevel) ? 0.05 : Math.max(0, parsedBluePerLevel),
        maxMultiplier: Number.isNaN(parsedBlueMaxMultiplier) ? 1.2 : Math.max(1, parsedBlueMaxMultiplier)
      },
      reviveConsumable: {
        id: String(reviveRaw.id || "revive_sigil").trim() || "revive_sigil",
        name: String(reviveRaw.name || "Phoenix Sigil").trim() || "Phoenix Sigil",
        rarity: String(reviveRaw.rarity || "purple").trim().toLowerCase() || "purple",
        description:
          String(reviveRaw.description || "Consumed on death to revive and continue the run.").trim() ||
          "Consumed on death to revive and continue the run.",
        price: Number.isNaN(parsedRevivePrice) ? 220 : Math.max(1, Math.floor(parsedRevivePrice)),
        unlockAtMaxLevelOnly: reviveRaw.unlockAtMaxLevelOnly !== false,
        maxOwned: Number.isNaN(parsedReviveMaxOwned) ? 1 : Math.max(1, Math.floor(parsedReviveMaxOwned)),
        reviveHpPct: Number.isNaN(parsedReviveHpPct) ? 0.45 : clampToRange(parsedReviveHpPct, 0.1, 1),
        postReviveInvulnSeconds: Number.isNaN(parsedReviveInvulnSeconds)
          ? 2.4
          : Math.max(0.2, parsedReviveInvulnSeconds)
      },
      healthPotion: {
        id: String(healthPotionRaw.id || "health_potion").trim() || "health_potion",
        name: String(healthPotionRaw.name || "Health Potion").trim() || "Health Potion",
        rarity: String(healthPotionRaw.rarity || "blue").trim().toLowerCase() || "blue",
        description:
          String(healthPotionRaw.description || "Use during a run to restore 50% of max HP.").trim() ||
          "Use during a run to restore 50% of max HP.",
        price: Number.isNaN(parsedHealthPotionPrice) ? 50 : Math.max(1, Math.floor(parsedHealthPotionPrice)),
        unlockAtMerchantLevel: Number.isNaN(parsedHealthPotionUnlockAt)
          ? 1
          : Math.max(1, Math.floor(parsedHealthPotionUnlockAt)),
        maxOwned: Number.isNaN(parsedHealthPotionMaxOwned) ? 3 : Math.max(1, Math.floor(parsedHealthPotionMaxOwned)),
        healHpPct: Number.isNaN(parsedHealthPotionHealPct)
          ? 0.5
          : clampToRange(parsedHealthPotionHealPct, 0.05, 1)
      }
    };
  }

  function getMerchantLevelCapForCharacter(highestUnlockedLevel) {
    const config = getMerchantProgressionConfig();
    const unlockedRunLevel = Math.max(1, Math.floor(Number(highestUnlockedLevel || 1)));
    return Math.max(1, Math.min(config.maxLevel, unlockedRunLevel * config.levelsPerGameLevel));
  }

  function getMerchantXpRequiredForNextLevel(level) {
    const config = getMerchantProgressionConfig();
    const normalizedLevel = Math.max(1, Math.floor(Number(level || 1)));
    return Math.max(10, Math.floor(config.baseXpToLevel * Math.pow(config.growth, normalizedLevel - 1)));
  }

  function calculateMerchantProgressFromXp(totalXp, levelCap) {
    const cappedLevel = Math.max(1, Math.floor(Number(levelCap || 1)));
    const xpValue = Math.max(0, Math.floor(Number(totalXp || 0)));
    let level = 1;
    let xpIntoLevel = xpValue;
    let xpToNextLevel = getMerchantXpRequiredForNextLevel(level);

    while (level < cappedLevel && xpIntoLevel >= xpToNextLevel) {
      xpIntoLevel -= xpToNextLevel;
      level += 1;
      xpToNextLevel = getMerchantXpRequiredForNextLevel(level);
    }

    if (level >= cappedLevel) {
      const cappedRequirement = getMerchantXpRequiredForNextLevel(cappedLevel);
      return {
        level: cappedLevel,
        xpIntoLevel: cappedRequirement,
        xpToNextLevel: cappedRequirement,
        capped: true
      };
    }

    return {
      level,
      xpIntoLevel,
      xpToNextLevel,
      capped: false
    };
  }

  function getMerchantLevelConfig(progressionLevel) {
    const pools = MERCHANT.levelPools || {};
    const normalizedLevel = normalizeProgressionLevel(progressionLevel);
    const fallback = pools[1] || {
      id: "level_1_merchant",
      label: "Level 1 Merchant",
      allowedRarities: ["grey", "blue"],
      rarityWeights: { grey: 0.8, blue: 0.2 },
      minItemLevel: 1,
      maxItemLevel: 1
    };
    if (pools[normalizedLevel]) return pools[normalizedLevel];
    const sortedKeys = Object.keys(pools)
      .map((key) => Math.floor(Number(key)))
      .filter((value) => !Number.isNaN(value) && value > 0)
      .sort((a, b) => a - b);
    if (!sortedKeys.length) return fallback;
    let chosenLevel = sortedKeys[0];
    for (let i = 0; i < sortedKeys.length; i += 1) {
      if (sortedKeys[i] <= normalizedLevel) {
        chosenLevel = sortedKeys[i];
      }
    }
    return pools[chosenLevel] || fallback;
  }

  function getMerchantClassRule(classId) {
    const rules = MERCHANT.classRules || {};
    const rule = rules[classId];
    if (rule && typeof rule === "object") return rule;
    return {
      allowedItemTypes: ["melee_weapon", "ranged_weapon", "helmet", "chest", "leggings", "boots", "ring", "amulet"],
      varietyBuckets: {
        melee: ["melee_weapon"],
        ranged: ["ranged_weapon"],
        armor: ["helmet", "chest", "leggings", "boots", "ring", "amulet"]
      }
    };
  }

  function getMerchantPricingConfig() {
    const pricing = MERCHANT.pricing || {};
    const configuredSellRate = Number(pricing.sellRate);
    return {
      rarityMultiplier: pricing.rarityMultiplier || { grey: 1, blue: 1.7, purple: 2.8, gold: 4, green: 5 },
      baseByItemType: pricing.baseByItemType || {
        melee_weapon: 16,
        ranged_weapon: 16,
        chest: 14,
        leggings: 13,
        boots: 11,
        helmet: 12,
        ring: 10,
        amulet: 12
      },
      statPointValue: Number.isNaN(Number(pricing.statPointValue)) ? 4 : Math.max(1, Number(pricing.statPointValue)),
      sellRate: Number.isNaN(configuredSellRate) ? 0.3 : Math.max(0.05, Math.min(0.95, configuredSellRate))
    };
  }

  function calculateMerchantItemPrice(item) {
    if (!item || typeof item !== "object") return 1;
    const pricing = getMerchantPricingConfig();
    const base = Number(pricing.baseByItemType[item.itemType]) || 10;
    const rarityMultiplier = Number(pricing.rarityMultiplier[item.rarity]) || 1;
    const stats = item.stats && typeof item.stats === "object" ? item.stats : {};
    const statBudget = Object.values(stats).reduce((sum, rawValue) => {
      const value = Number(rawValue);
      if (Number.isNaN(value)) return sum;
      return sum + Math.abs(value);
    }, 0);
    return Math.max(1, Math.floor(base * rarityMultiplier + statBudget * pricing.statPointValue));
  }

  function calculateMerchantSellPrice(item) {
    if (!item || typeof item !== "object") return 1;
    const pricing = getMerchantPricingConfig();
    const buyPrice = calculateMerchantItemPrice(item);
    return Math.max(1, Math.floor(buyPrice * pricing.sellRate));
  }

  function getEligibleMerchantItemDefinitions(classId, progressionLevel) {
    const levelConfig = getMerchantLevelConfig(progressionLevel);
    const classRule = getMerchantClassRule(classId);
    const allowedItemTypes = Array.isArray(classRule.allowedItemTypes) ? classRule.allowedItemTypes : [];
    const allowedRarities = Array.isArray(levelConfig.allowedRarities) ? levelConfig.allowedRarities : ["grey", "blue"];
    const minItemLevel = Number.isNaN(Number(levelConfig.minItemLevel))
      ? 1
      : Math.max(1, Math.floor(levelConfig.minItemLevel));
    const maxItemLevel = Number.isNaN(Number(levelConfig.maxItemLevel))
      ? minItemLevel
      : Math.max(minItemLevel, Math.floor(levelConfig.maxItemLevel));

    return Object.values(ITEM_DEFINITIONS).filter((definition) => {
      if (!definition || typeof definition !== "object") return false;
      if (!allowedRarities.includes(definition.rarity)) return false;
      if (allowedItemTypes.length && !allowedItemTypes.includes(definition.itemType)) return false;

      const classIds = Array.isArray(definition.classIds) ? definition.classIds : [];
      if (classIds.length && !classIds.includes(classId)) return false;

      const itemLevel = Number.isNaN(Number(definition.itemLevel)) ? 1 : Math.max(1, Math.floor(definition.itemLevel));
      return itemLevel >= minItemLevel && itemLevel <= maxItemLevel;
    });
  }

  function chooseWeightedRarityForPool(pool, rarityWeights, randomFn) {
    const available = {};
    pool.forEach((definition) => {
      const rarity = definition.rarity || "grey";
      if (!available[rarity]) available[rarity] = 0;
      available[rarity] += 1;
    });

    const entries = Object.entries(available).map(([rarity, count]) => {
      const configuredWeight = Number(rarityWeights && rarityWeights[rarity]);
      const weight = Number.isNaN(configuredWeight) ? 1 : Math.max(0, configuredWeight);
      return { rarity, weight: weight > 0 ? weight : 0.0001, count };
    });

    if (!entries.length) return "grey";
    let total = 0;
    entries.forEach((entry) => {
      total += entry.weight;
    });
    let roll = randomFn() * total;
    for (let i = 0; i < entries.length; i += 1) {
      roll -= entries[i].weight;
      if (roll <= 0) return entries[i].rarity;
    }
    return entries[entries.length - 1].rarity;
  }

  function pickDefinitionForMerchant(pool, rarityWeights, randomFn, options) {
    if (!Array.isArray(pool) || !pool.length) return null;
    const safeOptions = options || {};
    const excludedDefinitionIds = safeOptions.excludedDefinitionIds || {};
    const preferredItemTypes = safeOptions.preferredItemTypes || null;

    const eligiblePool = pool.filter((definition) => {
      if (!definition || !definition.id) return false;
      if (excludedDefinitionIds[definition.id]) return false;
      return true;
    });
    if (!eligiblePool.length) return null;

    const preferredPool =
      preferredItemTypes && typeof preferredItemTypes.has === "function"
        ? eligiblePool.filter((definition) => preferredItemTypes.has(definition.itemType))
        : [];
    const sourcePool = preferredPool.length ? preferredPool : eligiblePool;

    const rarity = chooseWeightedRarityForPool(sourcePool, rarityWeights, randomFn);
    const candidates = sourcePool.filter((definition) => definition.rarity === rarity);
    const source = candidates.length ? candidates : sourcePool;
    const index = Math.floor(randomFn() * source.length);
    return source[Math.max(0, Math.min(source.length - 1, index))];
  }

  function getMaxPurpleListingsForMerchantLevel(merchantLevel) {
    const level = Math.max(1, Math.floor(Number(merchantLevel || 1)));
    const config = getMerchantProgressionConfig();
    if (level <= 2) return 0;
    if (level === 3) return 1;
    if (level === 4) return 2;
    if (level === 5) return config.maxPurpleListingsAtLevel5;
    return Math.max(config.maxPurpleListingsAtLevel5, 1 + Math.floor((level - 5) / 5));
  }

  function getMaxGoldListingsForMerchantLevel(merchantLevel) {
    const level = Math.max(1, Math.floor(Number(merchantLevel || 1)));
    if (level < 5) return 0;
    if (level === 5) return 1;
    return 1 + Math.floor((level - 5) / 6);
  }

  function scaleBlueItemStatsForMerchant(item, merchantLevel) {
    if (!item || typeof item !== "object") return item;
    const rarity = String(item.rarity || "").toLowerCase();
    if (rarity !== "blue" && rarity !== "purple" && rarity !== "gold") return item;
    const level = Math.max(1, Math.floor(Number(merchantLevel || 1)));
    const config = getMerchantProgressionConfig();
    const scaling = config.blueStatScaling || {};
    let startLevel = Math.max(1, Math.floor(Number(scaling.startLevel || 2)));
    let perLevel = Math.max(0, Number(scaling.perLevel || 0.05));
    let maxMultiplier = Math.max(1, Number(scaling.maxMultiplier || 1.2));
    if (rarity === "purple") {
      startLevel = Math.max(1, startLevel + 1);
      perLevel = Math.max(perLevel, 0.05);
      maxMultiplier = Math.max(maxMultiplier, 1.24);
    } else if (rarity === "gold") {
      startLevel = Math.max(1, startLevel + 3);
      perLevel = Math.max(perLevel, 0.04);
      maxMultiplier = Math.max(maxMultiplier, 1.18);
    }
    if (level < startLevel) return item;
    const multiplier = Math.min(maxMultiplier, 1 + Math.max(0, level - startLevel + 1) * perLevel);
    if (multiplier <= 1) return item;
    const rawStats = item.stats && typeof item.stats === "object" ? item.stats : {};
    const nextStats = {};
    Object.entries(rawStats).forEach(([key, rawValue]) => {
      const numeric = Number(rawValue);
      if (Number.isNaN(numeric)) {
        nextStats[key] = rawValue;
        return;
      }
      if (numeric === 0) {
        nextStats[key] = 0;
        return;
      }
      const scaled = numeric * multiplier;
      const rounded = numeric > 0 ? Math.max(1, Math.round(scaled)) : Math.min(-1, Math.round(scaled));
      nextStats[key] = rounded;
    });
    return {
      ...item,
      stats: nextStats
    };
  }

  function rollMerchantItemStats(item, merchantLevel) {
    if (!item || typeof item !== "object") return item;
    const rawStats = item.stats && typeof item.stats === "object" ? item.stats : {};
    const rarity = String(item.rarity || "grey").trim().toLowerCase();
    const level = Math.max(1, Math.floor(Number(merchantLevel || 1)));
    const baseJitterByRarity = {
      grey: 1,
      blue: 2,
      purple: 3,
      gold: 4,
      green: 4
    };
    const baseJitter = Number(baseJitterByRarity[rarity]) || 1;
    const levelJitter = Math.max(0, Math.floor((level - 1) / 3));
    const jitter = Math.max(0, baseJitter + levelJitter);
    if (jitter <= 0) return item;

    const nextStats = {};
    Object.entries(rawStats).forEach(([key, rawValue]) => {
      const numeric = Number(rawValue);
      if (Number.isNaN(numeric)) {
        nextStats[key] = rawValue;
        return;
      }
      if (numeric === 0) {
        nextStats[key] = 0;
        return;
      }
      const sign = numeric >= 0 ? 1 : -1;
      const baseMagnitude = Math.abs(Math.round(numeric));
      const upwardBiasByRarity = {
        grey: 0,
        blue: 1,
        purple: 2,
        gold: 3,
        green: 3
      };
      const upwardBias = Math.max(0, Math.floor((level - 1) / 2) + (upwardBiasByRarity[rarity] || 0));
      const delta = Math.floor(Math.random() * (jitter * 2 + 1 + upwardBias)) - jitter;
      const rolledMagnitude = Math.max(1, baseMagnitude + delta);
      nextStats[key] = rolledMagnitude * sign;
    });
    return {
      ...item,
      stats: nextStats
    };
  }

  function getReviveConsumableConfig() {
    return getMerchantProgressionConfig().reviveConsumable;
  }

  function getHealthPotionConsumableConfig() {
    return getMerchantProgressionConfig().healthPotion;
  }

  function createReviveConsumableMerchantListing(ownerCharacterId) {
    const config = getReviveConsumableConfig();
    return {
      listingId: `shop_revive_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      kind: "consumable_revival",
      consumableId: config.id,
      name: config.name,
      rarity: config.rarity,
      description: config.description,
      price: config.price,
      maxOwned: config.maxOwned,
      ownerCharacterId: ownerCharacterId || null
    };
  }

  function createHealthPotionConsumableMerchantListing(ownerCharacterId) {
    const config = getHealthPotionConsumableConfig();
    return {
      listingId: `shop_health_potion_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      kind: "consumable_health_potion",
      consumableId: config.id,
      name: config.name,
      rarity: config.rarity,
      description: config.description,
      price: config.price,
      maxOwned: config.maxOwned,
      healHpPct: config.healHpPct,
      ownerCharacterId: ownerCharacterId || null
    };
  }

  function createMerchantListingFromDefinition(definition, ownerCharacterId, merchantLevel) {
    if (!definition || !definition.id) return null;
    const baseItem = createItemInstance(definition.id, ownerCharacterId);
    const scaledItem = scaleBlueItemStatsForMerchant(baseItem, merchantLevel);
    const item = rollMerchantItemStats(scaledItem, merchantLevel);
    if (!item) return null;
    return {
      listingId: `shop_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      kind: "item",
      item,
      price: calculateMerchantItemPrice(item)
    };
  }

  function buildMerchantVarietyGroups(definitions, classRule) {
    const result = [];
    const varietyBuckets = (classRule && classRule.varietyBuckets) || {};
    Object.entries(varietyBuckets).forEach(([bucketId, itemTypes]) => {
      if (!Array.isArray(itemTypes) || !itemTypes.length) return;
      const groupPool = definitions.filter((definition) => itemTypes.includes(definition.itemType));
      if (!groupPool.length) return;
      result.push({
        id: bucketId,
        itemTypes: uniqueStrings(itemTypes),
        pool: groupPool
      });
    });
    return result;
  }

  function dedupeMerchantStockByTemplate(listings, maxCount) {
    if (!Array.isArray(listings) || !listings.length) return [];
    const seen = {};
    const result = [];
    const limit = Number.isNaN(Number(maxCount)) ? null : Math.max(1, Math.floor(maxCount));

    for (let i = 0; i < listings.length; i += 1) {
      const listing = listings[i];
      if (!listing || typeof listing !== "object") continue;
      if (String(listing.kind || "").startsWith("consumable_")) {
        const specialId = `${listing.kind}:${listing.consumableId || listing.kind}`;
        if (seen[specialId]) continue;
        seen[specialId] = true;
        result.push(listing);
        if (limit && result.length >= limit) break;
        continue;
      }
      const item = listing.item || {};
      const uniqueId = item.templateId || item.instanceId || listing.listingId || null;
      if (!uniqueId || seen[uniqueId]) continue;
      seen[uniqueId] = true;
      result.push(listing);
      if (limit && result.length >= limit) break;
    }

    return result;
  }

  function getMerchantListingTemplateId(listing) {
    if (!listing || typeof listing !== "object") return "";
    const listingKind = String(listing.kind || "item");
    if (listingKind.startsWith("consumable_")) {
      return `consumable:${String(listing.consumableId || listingKind)}`;
    }
    const item = listing.item || {};
    return String(item.templateId || item.id || item.instanceId || listing.listingId || "").trim();
  }

  function getMerchantListingSignature(listing) {
    if (!listing || typeof listing !== "object") return "";
    const listingKind = String(listing.kind || "item");
    if (listingKind.startsWith("consumable_")) {
      const fallbackId = listingKind === "consumable_health_potion" ? "health_potion" : "revive_sigil";
      const consumableId = String(listing.consumableId || fallbackId).trim() || fallbackId;
      const price = Math.max(1, Math.floor(Number(listing.price || 0)));
      return `consumable:${consumableId}:price:${price}`;
    }
    const item = listing.item || {};
    const templateId = String(item.templateId || item.id || item.instanceId || "").trim();
    const price = Math.max(1, Math.floor(Number(listing.price || 0)));
    const stats = item.stats && typeof item.stats === "object" ? item.stats : {};
    const statSignature = Object.entries(stats)
      .map(([key, value]) => {
        const numeric = Number(value);
        const statValue = Number.isNaN(numeric) ? String(value) : String(Math.floor(numeric));
        return `${key}:${statValue}`;
      })
      .sort()
      .join("|");
    return `${templateId}:price:${price}:stats:${statSignature}`;
  }

  function areMerchantStocksEquivalent(stockA, stockB) {
    const listA = Array.isArray(stockA) ? stockA : [];
    const listB = Array.isArray(stockB) ? stockB : [];
    if (listA.length !== listB.length) return false;
    if (!listA.length && !listB.length) return true;

    const signaturesA = listA
      .map((listing) => getMerchantListingSignature(listing))
      .filter((id) => id.length > 0)
      .sort();
    const signaturesB = listB
      .map((listing) => getMerchantListingSignature(listing))
      .filter((id) => id.length > 0)
      .sort();
    if (signaturesA.length !== signaturesB.length) return false;
    for (let i = 0; i < signaturesA.length; i += 1) {
      if (signaturesA[i] !== signaturesB[i]) return false;
    }
    return true;
  }

  function countMerchantVarietyCoverage(listings, varietyGroups) {
    if (!Array.isArray(listings) || !Array.isArray(varietyGroups) || !varietyGroups.length) return 0;
    const covered = {};
    varietyGroups.forEach((group) => {
      if (!group || !group.id || !Array.isArray(group.itemTypes)) return;
      const match = listings.some((listing) => {
        const itemType = listing && listing.item && listing.item.itemType;
        return group.itemTypes.includes(itemType);
      });
      if (match) covered[group.id] = true;
    });
    return Object.keys(covered).length;
  }

  function generateMerchantStock(classId, characterId, progressionLevel, inventorySize, options) {
    const targetCount = Math.max(1, Math.floor(inventorySize || getMerchantInventorySize()));
    const normalizedLevel = normalizeProgressionLevel(progressionLevel);
    const levelConfig = getMerchantLevelConfig(normalizedLevel);
    const maxPurpleListings = getMaxPurpleListingsForMerchantLevel(normalizedLevel);
    const maxGoldListings = getMaxGoldListingsForMerchantLevel(normalizedLevel);
    const safeOptions = options || {};
    const levelCap = Math.max(1, Math.floor(Number(safeOptions.levelCap || normalizedLevel)));
    const hasReviveConsumable = normalizeReviveConsumableCharges(
      safeOptions.reviveConsumableCharges,
      getReviveConsumableConfig().maxOwned
    ) > 0;
    const healthPotionConfig = getHealthPotionConsumableConfig();
    const healthPotionCharges = normalizeHealthPotionCharges(
      safeOptions.healthPotionCharges,
      healthPotionConfig.maxOwned
    );
    const reviveConfig = getReviveConsumableConfig();
    const canOfferReviveAtLevel =
      reviveConfig.unlockAtMaxLevelOnly !== false ? normalizedLevel >= levelCap : normalizedLevel >= 1;
    const shouldOfferReviveListing = canOfferReviveAtLevel && !hasReviveConsumable;
    const shouldOfferHealthPotionListing =
      normalizedLevel >= Math.max(1, Math.floor(Number(healthPotionConfig.unlockAtMerchantLevel || 1))) &&
      healthPotionCharges < Math.max(1, Math.floor(Number(healthPotionConfig.maxOwned || 1)));
    const classRule = getMerchantClassRule(classId);
    const rarityWeights = levelConfig.rarityWeights || { grey: 0.8, blue: 0.2 };
    const definitions = getEligibleMerchantItemDefinitions(classId, normalizedLevel);
    if (!definitions.length) return [];
    const rawExcludedDefinitionIds =
      safeOptions.excludedDefinitionIds && typeof safeOptions.excludedDefinitionIds === "object"
        ? safeOptions.excludedDefinitionIds
        : {};
    const excludedDefinitionIds = {};
    Object.entries(rawExcludedDefinitionIds).forEach(([definitionId, excluded]) => {
      if (!definitionId || excluded !== true) return;
      excludedDefinitionIds[definitionId] = true;
    });
    const selectableDefinitions = definitions.filter((definition) => !excludedDefinitionIds[definition.id]);
    if (!selectableDefinitions.length) {
      const onlyUtilityListings = [];
      if (shouldOfferHealthPotionListing) {
        onlyUtilityListings.push(createHealthPotionConsumableMerchantListing(characterId));
      }
      if (shouldOfferReviveListing) {
        onlyUtilityListings.push(createReviveConsumableMerchantListing(characterId));
      }
      return onlyUtilityListings.slice(0, targetCount);
    }
    const reservedUtilitySlots = (shouldOfferReviveListing ? 1 : 0) + (shouldOfferHealthPotionListing ? 1 : 0);
    const targetItemCount = Math.max(0, targetCount - reservedUtilitySlots);
    const maxUniqueCount = Math.min(targetItemCount, selectableDefinitions.length);

    const selected = [];
    const selectedDefinitionIds = { ...excludedDefinitionIds };
    const selectedItemTypes = {};
    let selectedPurpleCount = 0;
    let selectedGoldCount = 0;
    const randomFn = Math.random;
    const varietyGroups = buildMerchantVarietyGroups(selectableDefinitions, classRule);
    for (let i = 0; i < varietyGroups.length && selected.length < maxUniqueCount; i += 1) {
      const chosen = pickDefinitionForMerchant(varietyGroups[i].pool, rarityWeights, randomFn, {
        excludedDefinitionIds: selectedDefinitionIds
      });
      if (!chosen) continue;
      const isPurple = String(chosen.rarity || "").toLowerCase() === "purple";
      const isGold = String(chosen.rarity || "").toLowerCase() === "gold";
      if (isPurple && selectedPurpleCount >= maxPurpleListings) {
        selectedDefinitionIds[chosen.id] = true;
        continue;
      }
      if (isGold && selectedGoldCount >= maxGoldListings) {
        selectedDefinitionIds[chosen.id] = true;
        continue;
      }
      selected.push(chosen);
      selectedDefinitionIds[chosen.id] = true;
      selectedItemTypes[chosen.itemType] = true;
      if (isPurple) selectedPurpleCount += 1;
      if (isGold) selectedGoldCount += 1;
    }

    while (selected.length < maxUniqueCount) {
      const missingItemTypes = new Set();
      varietyGroups.forEach((group) => {
        if (!group || !Array.isArray(group.itemTypes)) return;
        const groupCovered = group.itemTypes.some((itemType) => selectedItemTypes[itemType]);
        if (groupCovered) return;
        group.itemTypes.forEach((itemType) => missingItemTypes.add(itemType));
      });

      const chosen = pickDefinitionForMerchant(selectableDefinitions, rarityWeights, randomFn, {
        excludedDefinitionIds: selectedDefinitionIds,
        preferredItemTypes: missingItemTypes.size ? missingItemTypes : null
      });
      if (!chosen) break;
      const isPurple = String(chosen.rarity || "").toLowerCase() === "purple";
      const isGold = String(chosen.rarity || "").toLowerCase() === "gold";
      if (isPurple && selectedPurpleCount >= maxPurpleListings) {
        selectedDefinitionIds[chosen.id] = true;
        continue;
      }
      if (isGold && selectedGoldCount >= maxGoldListings) {
        selectedDefinitionIds[chosen.id] = true;
        continue;
      }
      selected.push(chosen);
      selectedDefinitionIds[chosen.id] = true;
      selectedItemTypes[chosen.itemType] = true;
      if (isPurple) selectedPurpleCount += 1;
      if (isGold) selectedGoldCount += 1;
    }

    const itemListings = selected
      .map((definition) => createMerchantListingFromDefinition(definition, characterId, normalizedLevel))
      .filter(Boolean);
    if (shouldOfferHealthPotionListing) {
      itemListings.push(createHealthPotionConsumableMerchantListing(characterId));
    }
    if (shouldOfferReviveListing) {
      itemListings.push(createReviveConsumableMerchantListing(characterId));
    }
    return itemListings.slice(0, targetCount);
  }

  function normalizeMerchantConsumableListing(rawListing, ownerCharacterId) {
    if (!rawListing || typeof rawListing !== "object") return null;
    const reviveConfig = getReviveConsumableConfig();
    const healthPotionConfig = getHealthPotionConsumableConfig();
    const rawKind = String(rawListing.kind || "").trim();
    const rawConsumableId = String(rawListing.consumableId || "").trim();
    const isHealthPotion =
      rawKind === "consumable_health_potion" ||
      rawConsumableId === healthPotionConfig.id ||
      rawConsumableId === "health_potion";
    const config = isHealthPotion ? healthPotionConfig : reviveConfig;
    const parsedPrice = Number(rawListing.price);
    const parsedMaxOwned = Number(rawListing.maxOwned);
    const parsedHealHpPct = Number(rawListing.healHpPct);
    return {
      listingId:
        rawListing.listingId ||
        (isHealthPotion
          ? `shop_health_potion_${Date.now()}_${Math.floor(Math.random() * 100000)}`
          : `shop_revive_${Date.now()}_${Math.floor(Math.random() * 100000)}`),
      kind: isHealthPotion ? "consumable_health_potion" : "consumable_revival",
      consumableId: String(rawListing.consumableId || config.id || (isHealthPotion ? "health_potion" : "revive_sigil")).trim() ||
        (isHealthPotion ? "health_potion" : "revive_sigil"),
      name: String(rawListing.name || config.name || (isHealthPotion ? "Health Potion" : "Phoenix Sigil")).trim() ||
        (isHealthPotion ? "Health Potion" : "Phoenix Sigil"),
      rarity: String(rawListing.rarity || config.rarity || (isHealthPotion ? "blue" : "purple")).trim().toLowerCase() ||
        (isHealthPotion ? "blue" : "purple"),
      description:
        String(
          rawListing.description ||
            config.description ||
            (isHealthPotion
              ? "Use during a run to restore 50% of max HP."
              : "Consumed on death to revive and continue the run.")
        ).trim() ||
        (isHealthPotion
          ? "Use during a run to restore 50% of max HP."
          : "Consumed on death to revive and continue the run."),
      price: Number.isNaN(parsedPrice) ? config.price : Math.max(1, Math.floor(parsedPrice)),
      maxOwned: Number.isNaN(parsedMaxOwned)
        ? Math.max(1, Math.floor(Number(config.maxOwned || 1)))
        : Math.max(1, Math.floor(parsedMaxOwned)),
      healHpPct: isHealthPotion
        ? (Number.isNaN(parsedHealHpPct)
          ? clampToRange(Number(config.healHpPct || 0.5), 0.05, 1)
          : clampToRange(parsedHealHpPct, 0.05, 1))
        : undefined,
      ownerCharacterId: ownerCharacterId || null
    };
  }

  function normalizeMerchantListing(rawListing, ownerCharacterId) {
    if (!rawListing || typeof rawListing !== "object") return null;
    const item = normalizeItem(rawListing.item);
    if (!item) return null;
    const ownerId = ownerCharacterId || item.ownerCharacterId || null;
    const normalizedItem = {
      ...item,
      ownerCharacterId: ownerId
    };
    const parsedPrice = Number(rawListing.price);
    const price = Number.isNaN(parsedPrice) ? calculateMerchantItemPrice(normalizedItem) : Math.max(1, Math.floor(parsedPrice));
    return {
      listingId: rawListing.listingId || `shop_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      kind: "item",
      item: normalizedItem,
      price
    };
  }

  function normalizeMerchantStockListing(rawListing, ownerCharacterId) {
    if (!rawListing || typeof rawListing !== "object") return null;
    if (
      String(rawListing.kind || "").startsWith("consumable_") ||
      rawListing.consumableId
    ) {
      return normalizeMerchantConsumableListing(rawListing, ownerCharacterId);
    }
    if (rawListing.kind === "item" || rawListing.item) {
      return normalizeMerchantListing(rawListing, ownerCharacterId);
    }
    return null;
  }

  function normalizeMerchantBuybackListing(rawListing, ownerCharacterId) {
    if (!rawListing || typeof rawListing !== "object") return null;
    const item = normalizeItem(rawListing.item);
    if (!item) return null;
    const ownerId = ownerCharacterId || item.ownerCharacterId || null;
    const normalizedItem = {
      ...item,
      ownerCharacterId: ownerId
    };
    const parsedPrice = Number(rawListing.price);
    const price = Number.isNaN(parsedPrice)
      ? calculateMerchantSellPrice(normalizedItem)
      : Math.max(1, Math.floor(parsedPrice));
    return {
      buybackId: rawListing.buybackId || `buyback_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      item: normalizedItem,
      price,
      soldAt: rawListing.soldAt || nowIso()
    };
  }

  function isSameMerchantTemplate(itemA, itemB) {
    if (!itemA || !itemB || typeof itemA !== "object" || typeof itemB !== "object") return false;
    if (itemA.templateId && itemB.templateId) return itemA.templateId === itemB.templateId;
    return (
      String(itemA.name || "") === String(itemB.name || "") &&
      String(itemA.rarity || "") === String(itemB.rarity || "") &&
      String(itemA.itemType || "") === String(itemB.itemType || "")
    );
  }

  function normalizeMerchantState(rawMerchant, context) {
    const safeContext = context || {};
    const classId = safeContext.classId || "barbarian";
    const characterId = safeContext.characterId || null;
    const highestUnlockedLevel = normalizeHighestUnlockedLevel(safeContext.highestUnlockedLevel || 1);
    const reviveConfig = getReviveConsumableConfig();
    const reviveConsumableCharges = normalizeReviveConsumableCharges(
      safeContext.reviveConsumableCharges,
      reviveConfig.maxOwned
    );
    const healthPotionConfig = getHealthPotionConsumableConfig();
    const healthPotionCharges = normalizeHealthPotionCharges(
      safeContext.healthPotionCharges,
      healthPotionConfig.maxOwned
    );
    const merchantLevelCap = getMerchantLevelCapForCharacter(highestUnlockedLevel);
    const rawXp = Number(rawMerchant && rawMerchant.xp);
    const rawTotalGoldSpent = Number(rawMerchant && rawMerchant.totalGoldSpent);
    const totalSpent = Number.isNaN(rawTotalGoldSpent)
      ? Math.max(0, Math.floor(Number.isNaN(rawXp) ? 0 : rawXp))
      : Math.max(0, Math.floor(rawTotalGoldSpent));
    const merchantXp = Number.isNaN(rawXp)
      ? totalSpent
      : Math.max(0, Math.floor(rawXp));
    const progress = calculateMerchantProgressFromXp(merchantXp, merchantLevelCap);
    const merchantLevel = progress.level;
    const levelConfig = getMerchantLevelConfig(merchantLevel);
    const refreshRuns = getMerchantRefreshRuns();
    const inventorySize = Number.isNaN(Number(rawMerchant && rawMerchant.inventorySize))
      ? getMerchantInventorySize()
      : Math.max(1, Math.floor(rawMerchant.inventorySize));

    const hasPersistedStock = Array.isArray(rawMerchant && rawMerchant.stock);
    const rawStock = hasPersistedStock ? rawMerchant.stock : [];
    const stock = rawStock
      .map((listing) => normalizeMerchantStockListing(listing, characterId))
      .filter(Boolean);
    const filteredStock = stock.filter((listing) => {
      if (!listing || typeof listing !== "object") return false;
      const listingKind = String(listing.kind || "item");
      if (listingKind === "consumable_revival") {
        const maxOwned = Math.max(1, Math.floor(Number(listing.maxOwned || reviveConfig.maxOwned || 1)));
        return reviveConsumableCharges < maxOwned;
      }
      if (listingKind === "consumable_health_potion") {
        const maxOwned = Math.max(1, Math.floor(Number(listing.maxOwned || healthPotionConfig.maxOwned || 1)));
        return healthPotionCharges < maxOwned;
      }
      return true;
    });
    const dedupedStock = dedupeMerchantStockByTemplate(filteredStock, inventorySize);
    const hasDuplicatesInStock = dedupedStock.length < filteredStock.length;
    const hasFullPersistedStock = filteredStock.length >= inventorySize;
    const definitions = getEligibleMerchantItemDefinitions(classId, merchantLevel);
    const varietyGroups = buildMerchantVarietyGroups(definitions, getMerchantClassRule(classId));
    const expectedVarietyCoverage = Math.min(varietyGroups.length, inventorySize);
    const currentVarietyCoverage = countMerchantVarietyCoverage(dedupedStock, varietyGroups);
    const lacksVariety =
      hasFullPersistedStock &&
      expectedVarietyCoverage > 1 &&
      currentVarietyCoverage < expectedVarietyCoverage;
    const reviveMaxOwned = Math.max(1, Math.floor(Number(reviveConfig.maxOwned || 1)));
    const shouldOfferReviveNow =
      (reviveConfig.unlockAtMaxLevelOnly !== false ? merchantLevel >= merchantLevelCap : merchantLevel >= 1) &&
      reviveConsumableCharges < reviveMaxOwned;
    const hasReviveListingInStock = dedupedStock.some(
      (listing) => listing && listing.kind === "consumable_revival"
    );
    const needsReviveListing = shouldOfferReviveNow && !hasReviveListingInStock;
    const healthPotionUnlockAt = Math.max(1, Math.floor(Number(healthPotionConfig.unlockAtMerchantLevel || 1)));
    const healthPotionMaxOwned = Math.max(1, Math.floor(Number(healthPotionConfig.maxOwned || 1)));
    const shouldOfferHealthPotionNow =
      merchantLevel >= healthPotionUnlockAt && healthPotionCharges < healthPotionMaxOwned;
    const hasHealthPotionListingInStock = dedupedStock.some(
      (listing) => listing && listing.kind === "consumable_health_potion"
    );
    const needsHealthPotionListing = shouldOfferHealthPotionNow && !hasHealthPotionListingInStock;

    const initializedStock =
      !hasPersistedStock ||
      (rawStock.length > 0 && filteredStock.length === 0) ||
      (hasFullPersistedStock && (hasDuplicatesInStock || lacksVariety || needsReviveListing || needsHealthPotionListing))
        ? generateMerchantStock(classId, characterId, merchantLevel, inventorySize, {
            levelCap: merchantLevelCap,
            reviveConsumableCharges,
            healthPotionCharges
          })
        : dedupedStock;
    const buyback = Array.isArray(rawMerchant && rawMerchant.buyback)
      ? rawMerchant.buyback
          .map((listing) => normalizeMerchantBuybackListing(listing, characterId))
          .filter(Boolean)
      : [];

    const rawRuns = Number(rawMerchant && rawMerchant.runsSinceRefresh);
    const runsSinceRefresh = Number.isNaN(rawRuns)
      ? 0
      : ((Math.floor(rawRuns) % refreshRuns) + refreshRuns) % refreshRuns;
    const rawFreeRefreshCharges = Number(rawMerchant && rawMerchant.freeRefreshCharges);
    const freeRefreshCharges = Number.isNaN(rawFreeRefreshCharges)
      ? 0
      : Math.max(0, Math.floor(rawFreeRefreshCharges));

    return {
      level: merchantLevel,
      levelCap: merchantLevelCap,
      manualRefreshCost: getMerchantManualRefreshCost(highestUnlockedLevel),
      refreshMinRunSeconds: getMerchantRefreshMinRunSeconds(),
      freeRefreshCharges,
      xp: merchantXp,
      totalGoldSpent: totalSpent,
      xpIntoLevel: progress.xpIntoLevel,
      xpToNextLevel: progress.xpToNextLevel,
      levelCapped: progress.capped,
      levelId: levelConfig.id || `level_${merchantLevel}_merchant`,
      levelLabel: `Level ${merchantLevel} Merchant`,
      refreshRuns,
      inventorySize,
      runsSinceRefresh,
      stock: initializedStock,
      buyback,
      lastRefreshAt: (rawMerchant && rawMerchant.lastRefreshAt) || nowIso()
    };
  }

  function getRunsUntilMerchantRefresh(merchantState) {
    const refreshRuns = Math.max(1, Math.floor((merchantState && merchantState.refreshRuns) || getMerchantRefreshRuns()));
    const runsSinceRefresh = Math.max(0, Math.floor((merchantState && merchantState.runsSinceRefresh) || 0));
    return Math.max(0, refreshRuns - runsSinceRefresh);
  }

  function incrementMerchantRunCounter(merchantState, context) {
    const merchant = normalizeMerchantState(merchantState, context);
    const safeContext = context || {};
    const minRunSeconds = getMerchantRefreshMinRunSeconds();
    const runDurationSeconds = Math.max(0, Number(safeContext.runDurationSeconds || 0));
    if (runDurationSeconds < minRunSeconds) {
      return {
        ...merchant,
        buyback: []
      };
    }
    const nextRuns = merchant.runsSinceRefresh + 1;
    if (nextRuns < merchant.refreshRuns) {
      return {
        ...merchant,
        runsSinceRefresh: nextRuns,
        buyback: []
      };
    }
    return {
      ...merchant,
      runsSinceRefresh: 0,
      stock: generateMerchantStock(safeContext.classId, safeContext.characterId, merchant.level, merchant.inventorySize, {
        levelCap: merchant.levelCap,
        reviveConsumableCharges: safeContext.reviveConsumableCharges,
        healthPotionCharges: safeContext.healthPotionCharges
      }),
      buyback: [],
      lastRefreshAt: nowIso()
    };
  }

  function createDefaultInventory() {
    return {
      equipment: {
        helmet: null,
        chest: null,
        leggings: null,
        boots: null,
        primaryMeleeWeapon: null,
        secondaryMeleeWeapon: null,
        rangedWeapon: null,
        ring1: null,
        ring2: null,
        amulet: null
      },
      storageTabs: {
        general: createEmptyStorageSlots(),
        reserve1: createEmptyStorageSlots(),
        reserve2: createEmptyStorageSlots()
      }
    };
  }

  function createStarterInventory(classId, ownerCharacterId) {
    const inventory = createDefaultInventory();
    const starterItemIds = STARTER_LOADOUTS[classId] || [];

    starterItemIds.forEach((itemDefinitionId) => {
      const item = createItemInstance(itemDefinitionId, ownerCharacterId);
      if (!item) return;
      const allowedSlots = getAllowedSlotsForItem(item);
      for (let i = 0; i < allowedSlots.length; i += 1) {
        const slotKey = allowedSlots[i];
        if (typeof inventory.equipment[slotKey] === "undefined") continue;
        if (inventory.equipment[slotKey]) continue;
        inventory.equipment[slotKey] = item;
        return;
      }
    });

    return inventory;
  }

  function cloneInventory(inventory) {
    const normalized = normalizeInventory(inventory);
    const cloneItem = (item) => normalizeItem(item);

    const cloneSlots = (slots) => slots.map((item) => cloneItem(item));

    return {
      equipment: {
        helmet: cloneItem(normalized.equipment.helmet),
        chest: cloneItem(normalized.equipment.chest),
        leggings: cloneItem(normalized.equipment.leggings),
        boots: cloneItem(normalized.equipment.boots),
        primaryMeleeWeapon: cloneItem(normalized.equipment.primaryMeleeWeapon),
        secondaryMeleeWeapon: cloneItem(normalized.equipment.secondaryMeleeWeapon),
        rangedWeapon: cloneItem(normalized.equipment.rangedWeapon),
        ring1: cloneItem(normalized.equipment.ring1),
        ring2: cloneItem(normalized.equipment.ring2),
        amulet: cloneItem(normalized.equipment.amulet)
      },
      storageTabs: {
        general: cloneSlots(normalized.storageTabs.general),
        reserve1: cloneSlots(normalized.storageTabs.reserve1),
        reserve2: cloneSlots(normalized.storageTabs.reserve2)
      }
    };
  }

  function findFirstEmptyStorageLocation(inventory) {
    if (!inventory || !inventory.storageTabs) return null;
    const orderedTabs = ["general", "reserve1", "reserve2"];
    for (let tabIndex = 0; tabIndex < orderedTabs.length; tabIndex += 1) {
      const tabId = orderedTabs[tabIndex];
      const slots = inventory.storageTabs[tabId];
      if (!Array.isArray(slots)) continue;
      for (let i = 0; i < slots.length; i += 1) {
        if (!isStoredInventoryItem(slots[i])) {
          return { tabId, index: i };
        }
      }
    }
    return null;
  }

  function insertItemIntoFirstStorageSlot(inventory, item) {
    const target = findFirstEmptyStorageLocation(inventory);
    if (!target) return null;
    if (!Array.isArray(inventory.storageTabs[target.tabId])) return null;
    inventory.storageTabs[target.tabId][target.index] = normalizeItem(item);
    return target;
  }

  function isValidInventoryLocation(location, inventory) {
    if (!location || typeof location !== "object") return false;
    if (location.kind === "equipment") {
      return Object.prototype.hasOwnProperty.call(inventory.equipment, location.slot);
    }
    if (location.kind === "storage") {
      if (!Object.prototype.hasOwnProperty.call(inventory.storageTabs, location.tabId)) return false;
      return Number.isInteger(location.index) && location.index >= 0 && location.index < 30;
    }
    return false;
  }

  function getItemAtLocation(inventory, location) {
    if (location.kind === "equipment") return inventory.equipment[location.slot] || null;
    return inventory.storageTabs[location.tabId][location.index] || null;
  }

  function setItemAtLocation(inventory, location, item) {
    if (location.kind === "equipment") {
      inventory.equipment[location.slot] = item || null;
      return;
    }
    inventory.storageTabs[location.tabId][location.index] = item || null;
  }

  function isItemValidForEquipmentSlot(item, slotKey) {
    if (!item) return true;
    if (typeof item !== "object") return false;
    return getAllowedSlotsForItem(item).includes(slotKey);
  }

  function moveInventoryItem(characterId, fromLocation, toLocation) {
    return updateCharacter(characterId, (current) => {
      const inventory = cloneInventory(current.inventory);
      if (!isValidInventoryLocation(fromLocation, inventory)) {
        throw new Error("Invalid source location.");
      }
      if (!isValidInventoryLocation(toLocation, inventory)) {
        throw new Error("Invalid destination location.");
      }

      const sameLocation =
        fromLocation.kind === toLocation.kind &&
        ((fromLocation.kind === "equipment" && fromLocation.slot === toLocation.slot) ||
          (fromLocation.kind === "storage" &&
            fromLocation.tabId === toLocation.tabId &&
            fromLocation.index === toLocation.index));
      if (sameLocation) {
        return { inventory };
      }

      const sourceItem = getItemAtLocation(inventory, fromLocation);
      if (!sourceItem) {
        throw new Error("No item in source slot.");
      }
      const targetItem = getItemAtLocation(inventory, toLocation);

      if (toLocation.kind === "equipment" && !isItemValidForEquipmentSlot(sourceItem, toLocation.slot)) {
        throw new Error("That item cannot be equipped in this slot.");
      }
      if (fromLocation.kind === "equipment" && targetItem && !isItemValidForEquipmentSlot(targetItem, fromLocation.slot)) {
        throw new Error("Swap target cannot fit the original equipment slot.");
      }

      setItemAtLocation(inventory, fromLocation, targetItem || null);
      setItemAtLocation(inventory, toLocation, sourceItem);

      return { inventory };
    });
  }

  function normalizeStorageSlots(rawSlots) {
    const normalized = createEmptyStorageSlots();
    if (!Array.isArray(rawSlots)) return normalized;
    for (let i = 0; i < normalized.length; i += 1) {
      const normalizedItem = typeof rawSlots[i] === "undefined" ? null : normalizeItem(rawSlots[i]);
      normalized[i] = isStoredInventoryItem(normalizedItem) ? normalizedItem : null;
    }
    return normalized;
  }

  function normalizeInventory(rawInventory) {
    const defaults = createDefaultInventory();
    if (!rawInventory || typeof rawInventory !== "object" || Array.isArray(rawInventory)) {
      return defaults;
    }

    const rawEquipment = rawInventory.equipment || {};
    const rawTabs = rawInventory.storageTabs || {};
    const equipment = defaults.equipment;
    const equipmentEntries = [
      { slotKey: "helmet", item: rawEquipment.helmet },
      { slotKey: "chest", item: rawEquipment.chest },
      { slotKey: "leggings", item: rawEquipment.leggings },
      { slotKey: "boots", item: rawEquipment.boots },
      { slotKey: "primaryMeleeWeapon", item: rawEquipment.primaryMeleeWeapon },
      { slotKey: "secondaryMeleeWeapon", item: rawEquipment.secondaryMeleeWeapon },
      { slotKey: "rangedWeapon", item: rawEquipment.rangedWeapon },
      { slotKey: "primaryWeapon", item: rawEquipment.primaryWeapon },
      { slotKey: "secondaryWeapon", item: rawEquipment.secondaryWeapon },
      { slotKey: "ring1", item: rawEquipment.ring1 },
      { slotKey: "ring2", item: rawEquipment.ring2 },
      { slotKey: "amulet", item: rawEquipment.amulet }
    ];

    equipmentEntries.forEach((entry) => {
      const normalizedSlotKey = normalizeEquipmentSlotKey(entry.slotKey);
      const rawItem = entry.item;
      const item = normalizeItem(rawItem);
      if (!item) return;
      if (
        Object.prototype.hasOwnProperty.call(equipment, normalizedSlotKey) &&
        !equipment[normalizedSlotKey] &&
        isItemValidForEquipmentSlot(item, normalizedSlotKey)
      ) {
        equipment[normalizedSlotKey] = item;
        return;
      }
      const allowedSlots = getAllowedSlotsForItem(item);
      for (let i = 0; i < allowedSlots.length; i += 1) {
        const slotKey = allowedSlots[i];
        if (!Object.prototype.hasOwnProperty.call(equipment, slotKey)) continue;
        if (equipment[slotKey]) continue;
        equipment[slotKey] = item;
        return;
      }
    });

    return {
      equipment,
      storageTabs: {
        general: normalizeStorageSlots(rawTabs.general),
        reserve1: normalizeStorageSlots(rawTabs.reserve1),
        reserve2: normalizeStorageSlots(rawTabs.reserve2)
      }
    };
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

  function getAttributeConfigForClass(classId) {
    const classTree = window.RL_DATA.SKILL_TREES[classId] && window.RL_DATA.SKILL_TREES[classId].classTree;
    if (!classTree) {
      return {
        maxLevel: 10,
        attributes: []
      };
    }
    const attributes = Array.isArray(classTree.attributes) ? classTree.attributes : [];
    const maxLevel = Math.max(1, Math.floor(classTree.maxLevel || 10));
    return {
      maxLevel,
      attributes
    };
  }

  function normalizeAttributeLevels(rawAttributeLevels, classId, legacyClassNodeRanks) {
    const config = getAttributeConfigForClass(classId);
    const levels = {};
    const source = rawAttributeLevels && typeof rawAttributeLevels === "object" ? rawAttributeLevels : {};
    const legacy = legacyClassNodeRanks && typeof legacyClassNodeRanks === "object" ? legacyClassNodeRanks : {};

    const getLegacyBranchPoints = (branchId) => {
      if (!branchId) return 0;
      return Object.entries(legacy).reduce((sum, [key, value]) => {
        if (!key.startsWith(`${branchId}.`)) return sum;
        return sum + Math.max(0, Math.floor(value || 0));
      }, 0);
    };

    config.attributes.forEach((attribute) => {
      const id = attribute.id;
      const explicitLevel = source[id];
      const migratedBranch = attribute.legacyBranchId || attribute.id;
      const migratedLevel = getLegacyBranchPoints(migratedBranch);
      const chosen = typeof explicitLevel === "number" ? explicitLevel : migratedLevel;
      levels[id] = Math.max(0, Math.min(config.maxLevel, Math.floor(chosen || 0)));
    });

    return levels;
  }

  function getSpentAttributePoints(attributeLevels) {
    return Object.values(attributeLevels || {}).reduce((sum, value) => sum + Math.max(0, Math.floor(value || 0)), 0);
  }

  function calculateLegacyProgress(totalLegacyXp, spentAttributePoints) {
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
    const attributePoints = Math.max(0, totalEarnedSkillPoints - Math.max(0, spentAttributePoints || 0));

    return {
      legacyLevel: level,
      attributePoints,
      classSkillPoints: attributePoints,
      totalEarnedSkillPoints,
      legacyXpIntoLevel: xpIntoLevel,
      legacyXpToNextLevel: xpToNextLevel
    };
  }

  function normalizeCharacter(raw) {
    const normalizedClassId = raw.classId || raw.class || "barbarian";
    const progressionLevel = normalizeProgressionLevel(raw.progressionLevel);
    const normalizedHighestUnlockedLevel = normalizeHighestUnlockedLevel(raw.highestUnlockedLevel || raw.maxUnlockedLevel || 1);
    const highestDifficultyByLevel = normalizeHighestDifficultyByLevel(
      raw.highestDifficultyByLevel || raw.levelDifficultyProgress || raw.levelDifficultyUnlocks,
      normalizedHighestUnlockedLevel
    );
    const reviveConsumableCharges = normalizeReviveConsumableCharges(
      raw.reviveConsumableCharges || raw.reviveCharges || raw.extraLifeCharges || 0,
      getReviveConsumableConfig().maxOwned
    );
    const healthPotionCharges = normalizeHealthPotionCharges(
      raw.healthPotionCharges || raw.potionCharges || 0,
      getHealthPotionConsumableConfig().maxOwned
    );
    const legacyClassNodeRanks = normalizeClassNodeRanks(raw.classNodeRanks);
    const attributeLevels = normalizeAttributeLevels(raw.attributeLevels, normalizedClassId, legacyClassNodeRanks);
    const spentAttributePoints = getSpentAttributePoints(attributeLevels);
    const legacy = calculateLegacyProgress(Number(raw.legacyXp || 0), spentAttributePoints);
    const inventory = normalizeInventory(raw.inventory);
    const merchant = normalizeMerchantState(raw.merchant, {
      classId: normalizedClassId,
      characterId: raw.id,
      highestUnlockedLevel: normalizedHighestUnlockedLevel,
      reviveConsumableCharges,
      healthPotionCharges
    });
    const legacyXpValue = Number(raw.legacyXp || 0);
    const lifetimeGoldCollected = Math.max(
      0,
      Math.floor(
        Number(
          raw.lifetimeGoldCollected ||
            raw.totalGoldCollected ||
            raw.goldCollectedLifetime ||
            raw.gold ||
            0
        )
      )
    );
    const questClaimsBase = normalizeQuestClaims(raw.questClaims || raw.questsClaimed || raw.questState);
    const unlockedPickupsBase = normalizeUnlockedPickups(raw.unlockedPickups || raw.unlockedPowerups || raw.unlocks);
    const unlockedFeaturesBase = normalizeUnlockedFeatures(raw.unlockedFeatures || raw.featuresUnlocked || raw.featureUnlocks);
    const questClaims = { ...questClaimsBase };
    const unlockedState = {
      pickups: { ...unlockedPickupsBase },
      features: { ...unlockedFeaturesBase }
    };

    Object.keys(questClaims).forEach((questId) => {
      const quest = getQuestDefinitionById(questId);
      const withReward = applyQuestRewardUnlocks(unlockedState, quest);
      unlockedState.pickups = withReward.pickups;
      unlockedState.features = withReward.features;
    });

    const snapshotForQuestProgress = {
      legacyXp: legacyXpValue,
      lifetimeGoldCollected,
      minibossKills: Number(raw.minibossKills || 0),
      enemyKills: Number(raw.enemyKills || 0),
      deaths: Number(raw.deaths || raw.totalDeaths || 0)
    };
    getAllQuestDefinitions().forEach((quest) => {
      if (!quest || !quest.id || questClaims[quest.id]) return;
      const progress = getQuestProgressSnapshot(snapshotForQuestProgress, quest);
      const autoClaim = Boolean(quest.reward && quest.reward.autoClaimOnComplete);
      if (!autoClaim || !progress.complete) return;
      questClaims[quest.id] = true;
      const withReward = applyQuestRewardUnlocks(unlockedState, quest);
      unlockedState.pickups = withReward.pickups;
      unlockedState.features = withReward.features;
    });
    const merchantUnlocked = unlockedState.features.merchant === true;
    const bestiaryDiscoveries = normalizeBestiaryDiscoveries(
      raw.bestiaryDiscoveries || raw.bestiary || raw.enemyCodex || raw.enemyDiscoveries
    );
    const enemyKillCounts = normalizeEnemyKillCounts(
      raw.enemyKillCounts || raw.killsByEnemy || raw.enemyTypeKills
    );
    const bountyClaims = normalizeBountyClaims(raw.bountyClaims || raw.claimedBounties);
    const bountyDamageBonuses = normalizeBountyDamageBonuses(
      raw.bountyDamageBonuses || raw.bountyBonuses || raw.enemyDamageBonuses
    );

    return {
      id: raw.id,
      name: raw.name || "Unnamed",
      race: raw.race || "human",
      classId: normalizedClassId,
      class: normalizedClassId,
      progressionLevel,
      gold: Number(raw.gold || 0),
      legacyXp: legacyXpValue,
      lifetimeGoldCollected,
      legacyLevel: legacy.legacyLevel,
      attributePoints: legacy.attributePoints,
      classSkillPoints: legacy.classSkillPoints,
      totalEarnedSkillPoints: legacy.totalEarnedSkillPoints,
      legacyXpIntoLevel: legacy.legacyXpIntoLevel,
      legacyXpToNextLevel: legacy.legacyXpToNextLevel,
      attributeLevels,
      classNodeRanks: {},
      questClaims,
      unlockedPickups: unlockedState.pickups,
      unlockedFeatures: unlockedState.features,
      merchantUnlocked,
      bestiaryDiscoveries,
      enemyKillCounts,
      bountyClaims,
      bountyDamageBonuses,
      highestUnlockedLevel: normalizedHighestUnlockedLevel,
      highestDifficultyByLevel,
      reviveConsumableCharges,
      healthPotionCharges,
      inventory,
      merchant,
      bestSurvivalTime: Number(raw.bestSurvivalTime || 0),
      runsPlayed: Number(raw.runsPlayed || 0),
      minibossKills: Number(raw.minibossKills || 0),
      enemyKills: Number(raw.enemyKills || 0),
      deaths: Number(raw.deaths || raw.totalDeaths || 0),
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
      const normalized = parsed.map(normalizeCharacter);
      const needsMerchantMigration = parsed.some((rawCharacter) => {
        if (!rawCharacter || typeof rawCharacter !== "object") return true;
        if (typeof rawCharacter.progressionLevel === "undefined") return true;
        const rawMerchant = rawCharacter.merchant;
        if (!rawMerchant || typeof rawMerchant !== "object") return true;
        if (!Array.isArray(rawMerchant.stock)) return true;
        if (Number.isNaN(Number(rawMerchant.runsSinceRefresh))) return true;
        if (Number.isNaN(Number(rawMerchant.refreshRuns))) return true;
        if (Number.isNaN(Number(rawMerchant.inventorySize))) return true;
        if (!rawMerchant.levelId) return true;
        if (!rawMerchant.levelLabel) return true;
        return false;
      });
      if (needsMerchantMigration) {
        writeCharacters(normalized);
      }
      return normalized;
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
    const characterId = `char_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const character = normalizeCharacter({
      id: characterId,
      name: trimmedName.slice(0, 16),
      race: "human",
      classId: "barbarian",
      class: "barbarian",
      progressionLevel: getDefaultProgressionLevel(),
      gold: 0,
      lifetimeGoldCollected: 0,
      legacyXp: 0,
      attributeLevels: {},
      inventory: createStarterInventory("barbarian", characterId),
      bestiaryDiscoveries: {},
      enemyKillCounts: {},
      bountyClaims: {},
      bountyDamageBonuses: {},
      highestUnlockedLevel: 1,
      highestDifficultyByLevel: { level_1: getDefaultDifficultyLevel() },
      reviveConsumableCharges: 0,
      healthPotionCharges: 0,
      bestSurvivalTime: 0,
      runsPlayed: 0,
      minibossKills: 0,
      enemyKills: 0,
      deaths: 0,
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

  function deleteCharacter(characterId) {
    const characters = readCharacters();
    const remaining = characters.filter((item) => item.id !== characterId);
    if (remaining.length === characters.length) {
      return false;
    }
    writeCharacters(remaining);
    return true;
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

  function getAttributeDefinition(classId, attributeId) {
    const config = getAttributeConfigForClass(classId);
    const attribute = config.attributes.find((item) => item.id === attributeId);
    if (!attribute) return null;
    return {
      attribute,
      maxLevel: Math.max(1, Math.floor(attribute.maxLevel || config.maxLevel || 10))
    };
  }

  function spendAttributePoint(characterId, attributeId) {
    const characters = readCharacters();
    const index = characters.findIndex((item) => item.id === characterId);
    if (index < 0) {
      return { ok: false, error: "Character not found." };
    }

    const current = normalizeCharacter(characters[index]);
    if ((current.attributePoints || 0) <= 0) {
      return { ok: false, error: "No unspent attribute points." };
    }

    const definition = getAttributeDefinition(current.classId, attributeId);
    if (!definition) {
      return { ok: false, error: "Attribute not found." };
    }

    const currentLevel = Number((current.attributeLevels && current.attributeLevels[attributeId]) || 0);
    if (currentLevel >= definition.maxLevel) {
      return { ok: false, error: `${definition.attribute.label} is already maxed.` };
    }

    const updatedAttributeLevels = {
      ...(current.attributeLevels || {}),
      [attributeId]: currentLevel + 1
    };

    const updated = normalizeCharacter({
      ...current,
      attributeLevels: updatedAttributeLevels,
      updatedAt: nowIso()
    });

    characters[index] = updated;
    writeCharacters(characters);
    return { ok: true, character: updated };
  }

  function spendClassSkillPoint(characterId, branchId, nodeId) {
    const attributeId = branchId || nodeId;
    return spendAttributePoint(characterId, attributeId);
  }

  function claimQuestReward(characterId, questId) {
    const normalizedQuestId = String(questId || "").trim();
    if (!normalizedQuestId) {
      return { ok: false, error: "Invalid quest." };
    }
    const questDefinition = getQuestDefinitionById(normalizedQuestId);
    if (!questDefinition) {
      return { ok: false, error: "Quest not found." };
    }

    let claim = null;
    try {
      const updated = updateCharacter(characterId, (current) => {
        const claims = normalizeQuestClaims(current.questClaims);
        if (!isQuestAvailableForCharacter(current, questDefinition)) {
          throw new Error("Quest is not available yet.");
        }
        if (claims[normalizedQuestId]) {
          throw new Error("Reward already claimed.");
        }

        const progress = getQuestProgressSnapshot(current, questDefinition);
        if (!progress.complete) {
          throw new Error("Quest requirement is not complete yet.");
        }

        const nextClaims = {
          ...claims,
          [normalizedQuestId]: true
        };
        const nextUnlocked = applyQuestRewardUnlocks(
          {
            pickups: current.unlockedPickups,
            features: current.unlockedFeatures
          },
          questDefinition
        );
        const reward = (questDefinition && questDefinition.reward) || {};
        let inventory = null;
        let rewardLabel = reward.label || "Reward unlocked";
        if (reward.type === "grant_item_by_rarity") {
          const rarityId = String(reward.rarity || "blue").trim().toLowerCase() || "blue";
          const grantCount = Math.max(1, Math.floor(Number(reward.count || 1)));
          const eligibleDefinitions = getEligibleQuestRewardDefinitions(current.classId, rarityId);
          if (!eligibleDefinitions.length) {
            throw new Error("No eligible items are configured for this reward.");
          }

          inventory = cloneInventory(current.inventory);
          const grantedItems = [];
          for (let i = 0; i < grantCount; i += 1) {
            const randomIndex = Math.floor(Math.random() * eligibleDefinitions.length);
            const definition = eligibleDefinitions[Math.max(0, Math.min(eligibleDefinitions.length - 1, randomIndex))];
            const grantedItem = createItemInstance(definition.id, current.id);
            if (!grantedItem) continue;
            const insertedLocation = insertItemIntoFirstStorageSlot(inventory, grantedItem);
            if (!insertedLocation) {
              throw new Error("Storage is full. Make room before claiming this quest reward.");
            }
            grantedItems.push(grantedItem);
          }
          if (!grantedItems.length) {
            throw new Error("Could not generate the quest reward item.");
          }

          const rarityLabel = rarityId.charAt(0).toUpperCase() + rarityId.slice(1);
          rewardLabel =
            reward.label ||
            `Granted ${grantedItems.length} ${rarityLabel} item${grantedItems.length === 1 ? "" : "s"}.`;
          if (grantedItems.length === 1 && grantedItems[0].name) {
            rewardLabel = `${rewardLabel}: ${grantedItems[0].name}`;
          }
        }
        claim = {
          questId: normalizedQuestId,
          questTitle: questDefinition.title || "Quest",
          rewardLabel
        };
        const patch = {
          questClaims: nextClaims,
          unlockedPickups: nextUnlocked.pickups,
          unlockedFeatures: nextUnlocked.features
        };
        if (inventory) {
          patch.inventory = inventory;
        }
        return patch;
      });

      if (!updated) {
        return { ok: false, error: "Character not found." };
      }
      return { ok: true, character: updated, claim };
    } catch (error) {
      return {
        ok: false,
        error: error && error.message ? error.message : "Could not claim reward."
      };
    }
  }

  function mergeEnemyKillCounts(baseCounts, earnedCounts) {
    const merged = normalizeEnemyKillCounts(baseCounts);
    const gained = normalizeEnemyKillCounts(earnedCounts);
    Object.entries(gained).forEach(([enemyTypeId, amount]) => {
      merged[enemyTypeId] = Math.max(0, Math.floor(Number(merged[enemyTypeId] || 0))) + Math.max(0, Math.floor(Number(amount || 0)));
    });
    return merged;
  }

  function normalizeMasteryProgressByInstanceId(progressByInstanceId) {
    const normalized = {};
    if (!progressByInstanceId || typeof progressByInstanceId !== "object" || Array.isArray(progressByInstanceId)) {
      return normalized;
    }
    Object.entries(progressByInstanceId).forEach(([instanceId, rawKills]) => {
      const id = String(instanceId || "").trim();
      if (!id) return;
      const kills = Math.max(0, Math.floor(Number(rawKills || 0)));
      if (kills <= 0) return;
      normalized[id] = Math.max(0, Math.floor(Number(normalized[id] || 0))) + kills;
    });
    return normalized;
  }

  function applyWeaponMasteryProgress(characterId, progressByInstanceId) {
    const progressMap = normalizeMasteryProgressByInstanceId(progressByInstanceId);
    if (!Object.keys(progressMap).length) {
      const current = getCharacter(characterId);
      if (!current) {
        return { ok: false, error: "Character not found." };
      }
      return { ok: true, character: current };
    }

    try {
      const updated = updateCharacter(characterId, (current) => {
        const inventory = cloneInventory(current.inventory);
        const remainingProgress = { ...progressMap };
        let changed = false;

        const applyProgressToItem = (item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return item;
          if (!isWeaponItemType(item.itemType)) return item;
          const instanceId = String(item.instanceId || "").trim();
          if (!instanceId) return item;
          const gainedKills = Math.max(0, Math.floor(Number(remainingProgress[instanceId] || 0)));
          if (gainedKills <= 0) return item;

          const mastery = normalizeWeaponMasteryState(item.mastery, item.rarity);
          const nextKillsTotal = Math.max(0, mastery.killsTotal + gainedKills);
          const nextTiersUnlocked = getWeaponMasteryUnlockedTiers(item.rarity, nextKillsTotal);
          delete remainingProgress[instanceId];
          changed = true;
          return {
            ...item,
            mastery: {
              killsTotal: nextKillsTotal,
              tiersUnlocked: nextTiersUnlocked
            }
          };
        };

        Object.keys(inventory.equipment).forEach((slotKey) => {
          inventory.equipment[slotKey] = applyProgressToItem(inventory.equipment[slotKey]);
        });

        Object.keys(inventory.storageTabs).forEach((tabId) => {
          const slots = inventory.storageTabs[tabId];
          if (!Array.isArray(slots)) return;
          for (let i = 0; i < slots.length; i += 1) {
            slots[i] = applyProgressToItem(slots[i]);
          }
        });

        if (!changed) return {};
        return { inventory };
      });

      if (!updated) {
        return { ok: false, error: "Character not found." };
      }
      return { ok: true, character: updated };
    } catch (error) {
      return {
        ok: false,
        error: error && error.message ? error.message : "Could not apply weapon mastery progress."
      };
    }
  }

  function applyRunRewards(characterId, runSummary) {
    return updateCharacter(characterId, (current) => {
      const summary = runSummary && typeof runSummary === "object" ? runSummary : {};
      const progressionLevel = normalizeProgressionLevel(current.progressionLevel);
      const currentUnlockedLevel = normalizeHighestUnlockedLevel(current.highestUnlockedLevel || 1);
      const rawCompletedLevelNumber = Number(summary.completedLevelNumber);
      const completedLevelNumber = Number.isNaN(rawCompletedLevelNumber) ? 1 : Math.max(1, Math.floor(rawCompletedLevelNumber));
      const unlockedByVictory = summary.victory === true ? completedLevelNumber + 1 : currentUnlockedLevel;
      const nextHighestUnlockedLevel = normalizeHighestUnlockedLevel(Math.max(currentUnlockedLevel, unlockedByVictory));
      const completedLevelIdFromSummary = String(summary.completedLevelId || "").trim();
      const completedLevelId = completedLevelIdFromSummary || getLevelIdFromIndex(completedLevelNumber);
      const completedDifficulty = normalizeDifficultyLevel(summary.completedDifficulty || getDefaultDifficultyLevel());
      const nextHighestDifficultyByLevel = normalizeHighestDifficultyByLevel(
        current.highestDifficultyByLevel,
        nextHighestUnlockedLevel
      );
      if (summary.victory === true && completedLevelId) {
        const currentUnlockedDifficulty = normalizeDifficultyLevel(
          nextHighestDifficultyByLevel[completedLevelId] || getDefaultDifficultyLevel()
        );
        const unlockedByVictoryDifficulty = normalizeDifficultyLevel(completedDifficulty + 1);
        nextHighestDifficultyByLevel[completedLevelId] = Math.max(currentUnlockedDifficulty, unlockedByVictoryDifficulty);
      }
      const merchant = incrementMerchantRunCounter(current.merchant, {
        classId: current.classId,
        characterId: current.id,
        highestUnlockedLevel: nextHighestUnlockedLevel,
        reviveConsumableCharges: current.reviveConsumableCharges,
        healthPotionCharges: current.healthPotionCharges,
        runDurationSeconds: summary.timeSurvived
      });
      return {
        progressionLevel,
        merchant,
        highestUnlockedLevel: nextHighestUnlockedLevel,
        highestDifficultyByLevel: nextHighestDifficultyByLevel,
        gold: current.gold + (summary.goldEarned || 0),
        lifetimeGoldCollected: Math.max(0, Math.floor(Number(current.lifetimeGoldCollected || 0))) + Math.max(0, Math.floor(Number(summary.goldEarned || 0))),
        legacyXp: current.legacyXp + (summary.legacyXpEarned || 0),
        enemyKillCounts: mergeEnemyKillCounts(current.enemyKillCounts, summary.enemyKillsByType),
        bestSurvivalTime: Math.max(current.bestSurvivalTime, summary.timeSurvived || 0),
        runsPlayed: current.runsPlayed + 1,
        minibossKills: current.minibossKills + (summary.minibossesDefeated || 0),
        enemyKills: current.enemyKills + (summary.enemiesKilled || 0),
        deaths: current.deaths + (summary.deaths || 0)
      };
    });
  }

  function markBestiaryEncounter(characterId, enemyTypeId) {
    const normalizedEnemyTypeId = String(enemyTypeId || "").trim();
    if (!normalizedEnemyTypeId) {
      return { ok: false, error: "Invalid enemy type." };
    }
    const enemyDefinitions = window.RL_DATA.ENEMIES || {};
    if (!enemyDefinitions[normalizedEnemyTypeId]) {
      return { ok: false, error: "Enemy type not found." };
    }

    const current = getCharacter(characterId);
    if (!current) {
      return { ok: false, error: "Character not found." };
    }
    const existingDiscoveries = normalizeBestiaryDiscoveries(current.bestiaryDiscoveries);
    if (existingDiscoveries[normalizedEnemyTypeId]) {
      return {
        ok: true,
        discovered: false,
        enemyTypeId: normalizedEnemyTypeId,
        character: current
      };
    }

    const updated = updateCharacter(characterId, (character) => {
      const currentDiscoveries = normalizeBestiaryDiscoveries(character.bestiaryDiscoveries);
      if (currentDiscoveries[normalizedEnemyTypeId]) return {};
      return {
        bestiaryDiscoveries: {
          ...currentDiscoveries,
          [normalizedEnemyTypeId]: true
        }
      };
    });

    if (!updated) {
      return { ok: false, error: "Character not found." };
    }
    return {
      ok: true,
      discovered: true,
      enemyTypeId: normalizedEnemyTypeId,
      character: updated
    };
  }

  function claimBountyReward(characterId, enemyTypeId) {
    const normalizedEnemyTypeId = String(enemyTypeId || "").trim();
    if (!normalizedEnemyTypeId) {
      return { ok: false, error: "Invalid bounty target." };
    }
    const profile = getBountyProfileForEnemy(normalizedEnemyTypeId);
    if (!profile) {
      return { ok: false, error: "Bounty target not found." };
    }

    let claim = null;
    try {
      const updated = updateCharacter(characterId, (current) => {
        const discovered = normalizeBestiaryDiscoveries(current.bestiaryDiscoveries);
        if (!discovered[normalizedEnemyTypeId]) {
          throw new Error("Discover this enemy in the Bestiary first.");
        }

        const claims = normalizeBountyClaims(current.bountyClaims);
        const claimedSteps = Math.max(0, Math.floor(Number(claims[normalizedEnemyTypeId] || 0)));
        const totalSteps = Math.max(1, Math.floor(Number(profile.stepCount || 1)));
        if (claimedSteps >= totalSteps) {
          throw new Error("All bounty steps for this enemy are already claimed.");
        }
        const steps = Array.isArray(profile.steps) ? profile.steps : [];
        const nextStep = steps[Math.max(0, Math.min(steps.length - 1, claimedSteps))];
        if (!nextStep) {
          throw new Error("Bounty step configuration is invalid.");
        }

        const killCounts = normalizeEnemyKillCounts(current.enemyKillCounts);
        const currentKills = Math.max(0, Math.floor(Number(killCounts[normalizedEnemyTypeId] || 0)));
        const stepTarget = Math.max(1, Math.floor(Number(nextStep.target || 1)));
        if (currentKills < stepTarget) {
          throw new Error("Bounty requirement is not complete yet.");
        }

        let inventory = null;
        const grantedItems = [];
        const grantsItem = nextStep.grantsItem === true;
        if (grantsItem) {
          const rewardRarity = String(nextStep.rewardRarity || profile.rewardRarity || "purple").trim().toLowerCase() || "purple";
          const rewardItemCount = Math.max(1, Math.floor(Number(nextStep.rewardItemCount || profile.rewardItemCount || 1)));
          const eligibleDefinitions = getEligibleQuestRewardDefinitions(current.classId, rewardRarity);
          if (!eligibleDefinitions.length) {
            throw new Error("No eligible bounty reward items are configured.");
          }
          inventory = cloneInventory(current.inventory);
          for (let i = 0; i < rewardItemCount; i += 1) {
            const randomIndex = Math.floor(Math.random() * eligibleDefinitions.length);
            const definition =
              eligibleDefinitions[Math.max(0, Math.min(eligibleDefinitions.length - 1, randomIndex))];
            const grantedItem = createItemInstance(definition.id, current.id);
            if (!grantedItem) continue;
            const insertedLocation = insertItemIntoFirstStorageSlot(inventory, grantedItem);
            if (!insertedLocation) {
              throw new Error("Storage is full. Make room before claiming this bounty.");
            }
            grantedItems.push(grantedItem);
          }
          if (!grantedItems.length) {
            throw new Error("Could not generate bounty reward item.");
          }
        }

        const nextClaims = {
          ...claims,
          [normalizedEnemyTypeId]: claimedSteps + 1
        };
        const bountyDamageBonuses = normalizeBountyDamageBonuses(current.bountyDamageBonuses);
        const bonusGain = Math.max(0, Number(nextStep.damageBonusPct || profile.damageBonusPctPerStep || 0));
        if (bonusGain > 0) {
          bountyDamageBonuses[normalizedEnemyTypeId] = Math.max(
            0,
            Number(bountyDamageBonuses[normalizedEnemyTypeId] || 0) + bonusGain
          );
        }
        const cumulativeBonusPct = Math.max(
          0,
          Math.round(Number(bountyDamageBonuses[normalizedEnemyTypeId] || 0) * 1000) / 10
        );
        const xpReward = roundXpRewardToNearestTen(Number(nextStep.xpReward || 0));
        const stepNumber = claimedSteps + 1;
        const totalStepCount = totalSteps;
        const rewardParts = [];
        if (xpReward > 0) {
          rewardParts.push(`${xpReward} XP`);
        }
        if (bonusGain > 0) {
          rewardParts.push(`+${Math.round(bonusGain * 1000) / 10}% vs ${profile.enemyLabel || normalizedEnemyTypeId}`);
        }
        if (grantedItems.length) {
          const rewardRarity = String(nextStep.rewardRarity || profile.rewardRarity || "purple").trim().toLowerCase() || "purple";
          const rarityLabel = rewardRarity.charAt(0).toUpperCase() + rewardRarity.slice(1);
          rewardParts.push(`${grantedItems.length} ${rarityLabel} item${grantedItems.length === 1 ? "" : "s"}`);
        }
        claim = {
          enemyTypeId: normalizedEnemyTypeId,
          enemyLabel: profile.enemyLabel || normalizedEnemyTypeId,
          target: stepTarget,
          step: stepNumber,
          totalSteps: totalStepCount,
          cumulativeDamageBonusPct: cumulativeBonusPct,
          rewardXp: xpReward,
          rewardLabel:
            rewardParts.length > 0
              ? `Step ${stepNumber}/${totalStepCount}: ${rewardParts.join(" + ")}`
              : `Step ${stepNumber}/${totalStepCount} claimed.`
        };
        const patch = {
          bountyClaims: nextClaims,
          bountyDamageBonuses,
          legacyXp: Math.max(0, Math.floor(Number(current.legacyXp || 0))) + xpReward
        };
        if (inventory) {
          patch.inventory = inventory;
        }
        return patch;
      });

      if (!updated) {
        return { ok: false, error: "Character not found." };
      }
      return { ok: true, character: updated, claim };
    } catch (error) {
      return {
        ok: false,
        error: error && error.message ? error.message : "Could not claim bounty reward."
      };
    }
  }

  function applyMerchantSpendProgress(merchantState, spentGold, context) {
    const safeContext = context || {};
    const merchant = normalizeMerchantState(merchantState, safeContext);
    const config = getMerchantProgressionConfig();
    const spent = Math.max(0, Math.floor(Number(spentGold || 0)));
    const xpGain = Math.max(0, Math.floor(spent * config.xpPerGoldSpent));
    if (xpGain <= 0) return merchant;

    const currentLevel = Math.max(1, Math.floor(Number(merchant.level || 1)));
    const nextXp = Math.max(0, Math.floor(Number(merchant.xp || 0))) + xpGain;
    const nextTotalSpent = Math.max(0, Math.floor(Number(merchant.totalGoldSpent || 0))) + spent;
    const levelCap = getMerchantLevelCapForCharacter(safeContext.highestUnlockedLevel || 1);
    const progress = calculateMerchantProgressFromXp(nextXp, levelCap);
    const levelGain = Math.max(0, Math.floor(progress.level) - currentLevel);
    const leveledUp = levelGain > 0;
    const reviveConsumableCharges = normalizeReviveConsumableCharges(
      safeContext.reviveConsumableCharges,
      getReviveConsumableConfig().maxOwned
    );
    const healthPotionCharges = normalizeHealthPotionCharges(
      safeContext.healthPotionCharges,
      getHealthPotionConsumableConfig().maxOwned
    );
    const nextStock = leveledUp
      ? generateMerchantStock(safeContext.classId, safeContext.characterId, progress.level, merchant.inventorySize, {
          levelCap,
          reviveConsumableCharges,
          healthPotionCharges
        })
      : merchant.stock;
    const currentFreeRefreshCharges = Math.max(0, Math.floor(Number(merchant.freeRefreshCharges || 0)));
    const nextFreeRefreshCharges = currentFreeRefreshCharges + levelGain;

    return {
      ...merchant,
      level: progress.level,
      levelCap,
      freeRefreshCharges: nextFreeRefreshCharges,
      xp: nextXp,
      totalGoldSpent: nextTotalSpent,
      xpIntoLevel: progress.xpIntoLevel,
      xpToNextLevel: progress.xpToNextLevel,
      levelCapped: progress.capped,
      levelId: (getMerchantLevelConfig(progress.level).id) || `level_${progress.level}_merchant`,
      levelLabel: `Level ${progress.level} Merchant`,
      stock: nextStock
    };
  }

  function purchaseMerchantItem(characterId, listingId) {
    const normalizedListingId = String(listingId || "").trim();
    if (!normalizedListingId) {
      return { ok: false, error: "Invalid merchant item." };
    }

    let purchase = null;
    try {
      const updated = updateCharacter(characterId, (current) => {
        if (!current.merchantUnlocked) {
          throw new Error("Merchant is locked. Complete the merchant quest first.");
        }
        const merchant = normalizeMerchantState(current.merchant, {
          classId: current.classId,
          characterId: current.id,
          highestUnlockedLevel: current.highestUnlockedLevel,
          reviveConsumableCharges: current.reviveConsumableCharges,
          healthPotionCharges: current.healthPotionCharges
        });
        const stock = merchant.stock.slice();
        const listingIndex = stock.findIndex((listing) => listing.listingId === normalizedListingId);
        if (listingIndex < 0) {
          throw new Error("That item is no longer in stock.");
        }

        const listing = stock[listingIndex];
        const price = Math.max(1, Math.floor(Number(listing.price || 0)));
        if (current.gold < price) {
          throw new Error("Not enough gold.");
        }

        const listingKind = String(listing.kind || "item");
        let inventory = cloneInventory(current.inventory);
        let nextReviveConsumableCharges = normalizeReviveConsumableCharges(
          current.reviveConsumableCharges,
          getReviveConsumableConfig().maxOwned
        );
        let nextHealthPotionCharges = normalizeHealthPotionCharges(
          current.healthPotionCharges,
          getHealthPotionConsumableConfig().maxOwned
        );
        let remainingStock = stock.filter((candidate, index) => index !== listingIndex);
        let insertedLocation = null;
        if (listingKind === "consumable_revival") {
          const reviveConfig = getReviveConsumableConfig();
          const maxOwned = Math.max(1, Math.floor(Number(listing.maxOwned || reviveConfig.maxOwned || 1)));
          if (nextReviveConsumableCharges >= maxOwned) {
            throw new Error("You can only hold one revive consumable at a time.");
          }
          nextReviveConsumableCharges = maxOwned;
          purchase = {
            itemName: listing.name || reviveConfig.name || "Revive Consumable",
            price,
            type: "consumable_revival"
          };
        } else if (listingKind === "consumable_health_potion") {
          const healthPotionConfig = getHealthPotionConsumableConfig();
          const maxOwned = Math.max(1, Math.floor(Number(listing.maxOwned || healthPotionConfig.maxOwned || 1)));
          if (nextHealthPotionCharges >= maxOwned) {
            throw new Error("You are already carrying the maximum number of health potions.");
          }
          nextHealthPotionCharges = Math.min(maxOwned, nextHealthPotionCharges + 1);
          purchase = {
            itemName: listing.name || healthPotionConfig.name || "Health Potion",
            price,
            type: "consumable_health_potion"
          };
        } else {
          const purchasedItem = normalizeItem({
            ...(listing.item || {}),
            ownerCharacterId: current.id
          });
          if (!purchasedItem) {
            throw new Error("Could not purchase this item.");
          }

          insertedLocation = insertItemIntoFirstStorageSlot(inventory, purchasedItem);
          if (!insertedLocation) {
            throw new Error("Storage is full.");
          }

          remainingStock = stock.filter((candidate, index) => {
            if (index === listingIndex) return false;
            return !isSameMerchantTemplate(candidate && candidate.item, purchasedItem);
          });
          purchase = {
            itemName: purchasedItem.name || "Item",
            price,
            storageLocation: insertedLocation
          };
        }

        const progressedMerchant = applyMerchantSpendProgress(
          {
            ...merchant,
            stock: remainingStock
          },
          price,
          {
            classId: current.classId,
            characterId: current.id,
            highestUnlockedLevel: current.highestUnlockedLevel,
            reviveConsumableCharges: nextReviveConsumableCharges,
            healthPotionCharges: nextHealthPotionCharges
          }
        );

        return {
          gold: current.gold - price,
          inventory,
          reviveConsumableCharges: nextReviveConsumableCharges,
          healthPotionCharges: nextHealthPotionCharges,
          merchant: progressedMerchant
        };
      });

      if (!updated) {
        return { ok: false, error: "Character not found." };
      }
      return { ok: true, character: updated, purchase };
    } catch (error) {
      return {
        ok: false,
        error: error && error.message ? error.message : "Could not complete purchase."
      };
    }
  }

  function sellInventoryItem(characterId, location) {
    if (!location || typeof location !== "object") {
      return { ok: false, error: "Invalid item location." };
    }

    let sale = null;
    try {
      const updated = updateCharacter(characterId, (current) => {
        if (!current.merchantUnlocked) {
          throw new Error("Merchant is locked. Complete the merchant quest first.");
        }
        const merchant = normalizeMerchantState(current.merchant, {
          classId: current.classId,
          characterId: current.id,
          highestUnlockedLevel: current.highestUnlockedLevel,
          reviveConsumableCharges: current.reviveConsumableCharges,
          healthPotionCharges: current.healthPotionCharges
        });
        const inventory = cloneInventory(current.inventory);
        if (!isValidInventoryLocation(location, inventory)) {
          throw new Error("Invalid item location.");
        }

        const itemToSell = getItemAtLocation(inventory, location);
        if (!itemToSell) {
          throw new Error("No item to sell.");
        }

        const normalizedItem = normalizeItem({
          ...itemToSell,
          ownerCharacterId: current.id
        });
        if (!normalizedItem) {
          throw new Error("Could not sell this item.");
        }
        const saleGrantsMerchantXp = normalizedItem.merchantXpEligible !== false;
        const itemForBuyback = {
          ...normalizedItem,
          merchantXpEligible: false
        };

        const price = calculateMerchantSellPrice(normalizedItem);
        setItemAtLocation(inventory, location, null);

        const buybackEntry = {
          buybackId: `buyback_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
          item: itemForBuyback,
          price,
          soldAt: nowIso()
        };
        const buyback = [buybackEntry].concat(Array.isArray(merchant.buyback) ? merchant.buyback : []).slice(0, 30);

        sale = {
          itemName: normalizedItem.name || "Item",
          price
        };

        const progressedMerchant = applyMerchantSpendProgress(
          {
            ...merchant,
            buyback
          },
          saleGrantsMerchantXp ? price : 0,
          {
            classId: current.classId,
            characterId: current.id,
            highestUnlockedLevel: current.highestUnlockedLevel,
            reviveConsumableCharges: current.reviveConsumableCharges,
            healthPotionCharges: current.healthPotionCharges
          }
        );

        return {
          gold: current.gold + price,
          inventory,
          merchant: progressedMerchant
        };
      });

      if (!updated) {
        return { ok: false, error: "Character not found." };
      }
      return { ok: true, character: updated, sale };
    } catch (error) {
      return {
        ok: false,
        error: error && error.message ? error.message : "Could not sell item."
      };
    }
  }

  function buybackMerchantItem(characterId, buybackId) {
    const normalizedBuybackId = String(buybackId || "").trim();
    if (!normalizedBuybackId) {
      return { ok: false, error: "Invalid buyback item." };
    }

    let purchase = null;
    try {
      const updated = updateCharacter(characterId, (current) => {
        if (!current.merchantUnlocked) {
          throw new Error("Merchant is locked. Complete the merchant quest first.");
        }
        const merchant = normalizeMerchantState(current.merchant, {
          classId: current.classId,
          characterId: current.id,
          highestUnlockedLevel: current.highestUnlockedLevel,
          reviveConsumableCharges: current.reviveConsumableCharges,
          healthPotionCharges: current.healthPotionCharges
        });
        const buyback = Array.isArray(merchant.buyback) ? merchant.buyback.slice() : [];
        const listingIndex = buyback.findIndex((listing) => listing.buybackId === normalizedBuybackId);
        if (listingIndex < 0) {
          throw new Error("That buyback item is no longer available.");
        }

        const listing = buyback[listingIndex];
        const price = Math.max(1, Math.floor(Number(listing.price || 0)));
        if (current.gold < price) {
          throw new Error("Not enough gold.");
        }

        const inventory = cloneInventory(current.inventory);
        const item = normalizeItem({
          ...(listing.item || {}),
          ownerCharacterId: current.id
        });
        if (!item) {
          throw new Error("Could not recover this item.");
        }
        const recoveredItem = {
          ...item,
          merchantXpEligible: false
        };

        const insertedLocation = insertItemIntoFirstStorageSlot(inventory, recoveredItem);
        if (!insertedLocation) {
          throw new Error("Storage is full.");
        }

        buyback.splice(listingIndex, 1);
        purchase = {
          itemName: recoveredItem.name || "Item",
          price,
          storageLocation: insertedLocation
        };

        const progressedMerchant = applyMerchantSpendProgress(
          {
            ...merchant,
            buyback
          },
          0,
          {
            classId: current.classId,
            characterId: current.id,
            highestUnlockedLevel: current.highestUnlockedLevel,
            reviveConsumableCharges: current.reviveConsumableCharges,
            healthPotionCharges: current.healthPotionCharges
          }
        );

        return {
          gold: current.gold - price,
          inventory,
          merchant: progressedMerchant
        };
      });

      if (!updated) {
        return { ok: false, error: "Character not found." };
      }
      return { ok: true, character: updated, purchase };
    } catch (error) {
      return {
        ok: false,
        error: error && error.message ? error.message : "Could not complete buyback."
      };
    }
  }

  function refreshMerchantStock(characterId) {
    let refresh = null;
    try {
      const updated = updateCharacter(characterId, (current) => {
        if (!current.merchantUnlocked) {
          throw new Error("Merchant is locked. Complete the merchant quest first.");
        }

        const highestUnlockedLevel = normalizeHighestUnlockedLevel(current.highestUnlockedLevel || 1);
        const merchant = normalizeMerchantState(current.merchant, {
          classId: current.classId,
          characterId: current.id,
          highestUnlockedLevel,
          reviveConsumableCharges: current.reviveConsumableCharges,
          healthPotionCharges: current.healthPotionCharges
        });
        const freeRefreshCharges = Math.max(0, Math.floor(Number(merchant.freeRefreshCharges || 0)));
        const usesFreeRefresh = freeRefreshCharges > 0;
        const refreshCost = usesFreeRefresh ? 0 : getMerchantManualRefreshCost(highestUnlockedLevel);
        if (!usesFreeRefresh && current.gold < refreshCost) {
          throw new Error(`Not enough gold. Need ${refreshCost}g.`);
        }
        const previousStock = Array.isArray(merchant.stock) ? merchant.stock.slice() : [];
        let refreshedStock = [];
        const rerollOptions = {
          levelCap: merchant.levelCap,
          reviveConsumableCharges: current.reviveConsumableCharges,
          healthPotionCharges: current.healthPotionCharges
        };
        for (let attempt = 0; attempt < 8; attempt += 1) {
          refreshedStock = generateMerchantStock(
            current.classId,
            current.id,
            merchant.level,
            merchant.inventorySize,
            rerollOptions
          );
          if (!areMerchantStocksEquivalent(previousStock, refreshedStock)) {
            break;
          }
        }
        if (areMerchantStocksEquivalent(previousStock, refreshedStock) && previousStock.length > 0) {
          const previousTemplateIds = previousStock
            .map((listing) => getMerchantListingTemplateId(listing))
            .filter((id) => id && !id.startsWith("consumable:"));
          for (let i = 0; i < previousTemplateIds.length; i += 1) {
            const candidateStock = generateMerchantStock(
              current.classId,
              current.id,
              merchant.level,
              merchant.inventorySize,
              {
                ...rerollOptions,
                excludedDefinitionIds: {
                  [previousTemplateIds[i]]: true
                }
              }
            );
            if (!areMerchantStocksEquivalent(previousStock, candidateStock)) {
              refreshedStock = candidateStock;
              break;
            }
          }
        }
        if (areMerchantStocksEquivalent(previousStock, refreshedStock) && refreshedStock.length > 0) {
          const nextStock = refreshedStock.slice();
          for (let i = 0; i < nextStock.length; i += 1) {
            const listing = nextStock[i];
            if (!listing || String(listing.kind || "item") !== "item") continue;
            const currentPrice = Math.max(1, Math.floor(Number(listing.price || 0)));
            nextStock[i] = {
              ...listing,
              price: currentPrice + 1
            };
            refreshedStock = nextStock;
            break;
          }
        }
        const remainingFreeRefreshCharges = usesFreeRefresh ? Math.max(0, freeRefreshCharges - 1) : freeRefreshCharges;

        refresh = {
          cost: refreshCost,
          usedFreeRefresh: usesFreeRefresh,
          freeRefreshChargesRemaining: remainingFreeRefreshCharges
        };

        return {
          gold: current.gold - refreshCost,
          merchant: {
            ...merchant,
            stock: refreshedStock,
            runsSinceRefresh: 0,
            freeRefreshCharges: remainingFreeRefreshCharges,
            lastRefreshAt: nowIso()
          }
        };
      });

      if (!updated) {
        return { ok: false, error: "Character not found." };
      }
      return { ok: true, character: updated, refresh };
    } catch (error) {
      return {
        ok: false,
        error: error && error.message ? error.message : "Could not refresh merchant stock."
      };
    }
  }

  function consumeReviveConsumable(characterId) {
    const current = getCharacter(characterId);
    if (!current) {
      return { ok: false, error: "Character not found.", consumed: false };
    }
    const maxOwned = getReviveConsumableConfig().maxOwned;
    const charges = normalizeReviveConsumableCharges(current.reviveConsumableCharges, maxOwned);
    if (charges <= 0) {
      return { ok: true, consumed: false, character: current };
    }
    const updated = updateCharacter(characterId, () => ({
      reviveConsumableCharges: Math.max(0, charges - 1)
    }));
    if (!updated) {
      return { ok: false, error: "Character not found.", consumed: false };
    }
    return { ok: true, consumed: true, character: updated };
  }

  function consumeHealthPotion(characterId) {
    const current = getCharacter(characterId);
    if (!current) {
      return { ok: false, error: "Character not found.", consumed: false };
    }
    const maxOwned = getHealthPotionConsumableConfig().maxOwned;
    const charges = normalizeHealthPotionCharges(current.healthPotionCharges, maxOwned);
    if (charges <= 0) {
      return { ok: true, consumed: false, character: current };
    }
    const updated = updateCharacter(characterId, () => ({
      healthPotionCharges: Math.max(0, charges - 1)
    }));
    if (!updated) {
      return { ok: false, error: "Character not found.", consumed: false };
    }
    return { ok: true, consumed: true, character: updated };
  }

  function storeItemInStorage(characterId, rawItem) {
    const item = normalizeItem(rawItem);
    if (!item) {
      return { ok: false, error: "Invalid item data." };
    }
    try {
      const updated = updateCharacter(characterId, (current) => {
        const inventory = cloneInventory(current.inventory);
        const itemWithOwner = {
          ...item,
          ownerCharacterId: current.id
        };
        const insertedLocation = insertItemIntoFirstStorageSlot(inventory, itemWithOwner);
        if (!insertedLocation) {
          throw new Error("Storage is full.");
        }
        return { inventory };
      });

      if (!updated) {
        return { ok: false, error: "Character not found." };
      }
      return { ok: true, character: updated };
    } catch (error) {
      return {
        ok: false,
        error: error && error.message ? error.message : "Could not store item."
      };
    }
  }

  window.RL_SAVE = Object.freeze({
    listCharacters,
    createCharacter,
    getCharacter,
    deleteCharacter,
    updateCharacter,
    applyWeaponMasteryProgress,
    applyRunRewards,
    claimQuestReward,
    claimBountyReward,
    moveInventoryItem,
    purchaseMerchantItem,
    sellInventoryItem,
    buybackMerchantItem,
    refreshMerchantStock,
    consumeReviveConsumable,
    consumeHealthPotion,
    markBestiaryEncounter,
    storeItemInStorage,
    spendAttributePoint,
    spendClassSkillPoint,
    xpRequiredForNextLegacyLevel,
    calculateLegacyProgress,
    calculateMerchantSellPrice,
    getRunsUntilMerchantRefresh,
    getBountyProfileForEnemy
  });
})();
