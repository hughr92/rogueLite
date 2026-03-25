(function () {
  const STORAGE_KEY = window.RL_DATA.STORAGE.charactersKey;
  const LEGACY = window.RL_DATA.LEGACY_PROGRESSION || { baseXp: 90, growth: 1.18 };
  const ITEM_DEFINITIONS = window.RL_DATA.ITEM_DEFINITIONS || {};
  const STARTER_LOADOUTS = window.RL_DATA.STARTER_LOADOUTS || {};
  const MERCHANT = window.RL_DATA.MERCHANT || {};
  const QUESTS = window.RL_DATA.QUESTS || {};
  const POWERUPS = window.RL_DATA.POWERUPS || {};

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
    const allowedSlots = getAllowedSlotsForItem(item);
    const weaponSlotWeight = getNormalizedWeaponSlotWeight(item.itemType, item.weaponSlotWeight);
    return {
      ...item,
      allowedSlots,
      allowedSlot: allowedSlots[0] || null,
      weaponSlotWeight,
      itemCategory: item.itemCategory || null,
      weaponCategory: item.weaponCategory || null,
      physicalDamageType: item.physicalDamageType || null,
      stats: normalizeItemStats(item.stats)
    };
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
    return {
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
      ownerCharacterId: ownerCharacterId || null
    };
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

  function getMerchantRefreshRuns() {
    const configured = Number(MERCHANT.refreshRuns);
    if (Number.isNaN(configured)) return 5;
    return Math.max(1, Math.floor(configured));
  }

  function getMerchantInventorySize() {
    const configured = Number(MERCHANT.defaultInventorySize);
    if (Number.isNaN(configured)) return 6;
    return Math.max(1, Math.floor(configured));
  }

  function getDefaultProgressionLevel() {
    const configured = Number(MERCHANT.defaultProgressionLevel);
    if (Number.isNaN(configured)) return 1;
    return Math.max(1, Math.floor(configured));
  }

  function normalizeProgressionLevel(levelValue) {
    const parsed = Number(levelValue);
    if (Number.isNaN(parsed)) return getDefaultProgressionLevel();
    return Math.max(1, Math.floor(parsed));
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
    return pools[normalizedLevel] || fallback;
  }

  function getMerchantClassRule(classId) {
    const rules = MERCHANT.classRules || {};
    const rule = rules[classId];
    if (rule && typeof rule === "object") return rule;
    return {
      allowedItemTypes: ["melee_weapon", "ranged_weapon", "helmet", "chest", "ring", "amulet"],
      varietyBuckets: {
        melee: ["melee_weapon"],
        ranged: ["ranged_weapon"],
        armor: ["helmet", "chest"]
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

      const requiredMin = Number.isNaN(Number(definition.merchantLevelMin))
        ? 1
        : Math.max(1, Math.floor(definition.merchantLevelMin));
      const requiredMax = Number.isNaN(Number(definition.merchantLevelMax))
        ? 999
        : Math.max(requiredMin, Math.floor(definition.merchantLevelMax));
      if (progressionLevel < requiredMin || progressionLevel > requiredMax) return false;

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

  function createMerchantListingFromDefinition(definition, ownerCharacterId) {
    if (!definition || !definition.id) return null;
    const item = createItemInstance(definition.id, ownerCharacterId);
    if (!item) return null;
    return {
      listingId: `shop_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
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
      const item = listing.item || {};
      const uniqueId = item.templateId || item.instanceId || listing.listingId || null;
      if (!uniqueId || seen[uniqueId]) continue;
      seen[uniqueId] = true;
      result.push(listing);
      if (limit && result.length >= limit) break;
    }

    return result;
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

  function generateMerchantStock(classId, characterId, progressionLevel, inventorySize) {
    const targetCount = Math.max(1, Math.floor(inventorySize || getMerchantInventorySize()));
    const normalizedLevel = normalizeProgressionLevel(progressionLevel);
    const levelConfig = getMerchantLevelConfig(normalizedLevel);
    const classRule = getMerchantClassRule(classId);
    const rarityWeights = levelConfig.rarityWeights || { grey: 0.8, blue: 0.2 };
    const definitions = getEligibleMerchantItemDefinitions(classId, normalizedLevel);
    if (!definitions.length) return [];
    const maxUniqueCount = Math.min(targetCount, definitions.length);

    const selected = [];
    const selectedDefinitionIds = {};
    const selectedItemTypes = {};
    const randomFn = Math.random;
    const varietyGroups = buildMerchantVarietyGroups(definitions, classRule);
    for (let i = 0; i < varietyGroups.length && selected.length < maxUniqueCount; i += 1) {
      const chosen = pickDefinitionForMerchant(varietyGroups[i].pool, rarityWeights, randomFn, {
        excludedDefinitionIds: selectedDefinitionIds
      });
      if (!chosen) continue;
      selected.push(chosen);
      selectedDefinitionIds[chosen.id] = true;
      selectedItemTypes[chosen.itemType] = true;
    }

    while (selected.length < maxUniqueCount) {
      const missingItemTypes = new Set();
      varietyGroups.forEach((group) => {
        if (!group || !Array.isArray(group.itemTypes)) return;
        const groupCovered = group.itemTypes.some((itemType) => selectedItemTypes[itemType]);
        if (groupCovered) return;
        group.itemTypes.forEach((itemType) => missingItemTypes.add(itemType));
      });

      const chosen = pickDefinitionForMerchant(definitions, rarityWeights, randomFn, {
        excludedDefinitionIds: selectedDefinitionIds,
        preferredItemTypes: missingItemTypes.size ? missingItemTypes : null
      });
      if (!chosen) break;
      selected.push(chosen);
      selectedDefinitionIds[chosen.id] = true;
      selectedItemTypes[chosen.itemType] = true;
    }

    return selected
      .map((definition) => createMerchantListingFromDefinition(definition, characterId))
      .filter(Boolean)
      .slice(0, maxUniqueCount);
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
      item: normalizedItem,
      price
    };
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
    const progressionLevel = normalizeProgressionLevel(safeContext.progressionLevel);
    const levelConfig = getMerchantLevelConfig(progressionLevel);
    const refreshRuns = Number.isNaN(Number(rawMerchant && rawMerchant.refreshRuns))
      ? getMerchantRefreshRuns()
      : Math.max(1, Math.floor(rawMerchant.refreshRuns));
    const inventorySize = Number.isNaN(Number(rawMerchant && rawMerchant.inventorySize))
      ? getMerchantInventorySize()
      : Math.max(1, Math.floor(rawMerchant.inventorySize));

    const hasPersistedStock = Array.isArray(rawMerchant && rawMerchant.stock);
    const rawStock = hasPersistedStock ? rawMerchant.stock : [];
    const stock = rawStock
      .map((listing) => normalizeMerchantListing(listing, characterId))
      .filter(Boolean);
    const dedupedStock = dedupeMerchantStockByTemplate(stock, inventorySize);
    const hasDuplicatesInStock = dedupedStock.length < stock.length;
    const hasFullPersistedStock = stock.length >= inventorySize;
    const definitions = getEligibleMerchantItemDefinitions(classId, progressionLevel);
    const varietyGroups = buildMerchantVarietyGroups(definitions, getMerchantClassRule(classId));
    const expectedVarietyCoverage = Math.min(varietyGroups.length, inventorySize);
    const currentVarietyCoverage = countMerchantVarietyCoverage(dedupedStock, varietyGroups);
    const lacksVariety =
      hasFullPersistedStock &&
      expectedVarietyCoverage > 1 &&
      currentVarietyCoverage < expectedVarietyCoverage;

    const initializedStock =
      !hasPersistedStock ||
      (rawStock.length > 0 && stock.length === 0) ||
      (hasFullPersistedStock && (hasDuplicatesInStock || lacksVariety))
        ? generateMerchantStock(classId, characterId, progressionLevel, inventorySize)
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

    return {
      level: progressionLevel,
      levelId: (rawMerchant && rawMerchant.levelId) || levelConfig.id || `level_${progressionLevel}_merchant`,
      levelLabel: (rawMerchant && rawMerchant.levelLabel) || levelConfig.label || `Level ${progressionLevel} Merchant`,
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
      stock: generateMerchantStock(context.classId, context.characterId, context.progressionLevel, merchant.inventorySize),
      buyback: [],
      lastRefreshAt: nowIso()
    };
  }

  function createDefaultInventory() {
    return {
      equipment: {
        helmet: null,
        chest: null,
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
    const legacyClassNodeRanks = normalizeClassNodeRanks(raw.classNodeRanks);
    const attributeLevels = normalizeAttributeLevels(raw.attributeLevels, normalizedClassId, legacyClassNodeRanks);
    const spentAttributePoints = getSpentAttributePoints(attributeLevels);
    const legacy = calculateLegacyProgress(Number(raw.legacyXp || 0), spentAttributePoints);
    const inventory = normalizeInventory(raw.inventory);
    const merchant = normalizeMerchantState(raw.merchant, {
      classId: normalizedClassId,
      characterId: raw.id,
      progressionLevel
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

  function applyRunRewards(characterId, runSummary) {
    return updateCharacter(characterId, (current) => {
      const progressionLevel = normalizeProgressionLevel(current.progressionLevel);
      const merchant = incrementMerchantRunCounter(current.merchant, {
        classId: current.classId,
        characterId: current.id,
        progressionLevel
      });
      return {
        progressionLevel,
        merchant,
        gold: current.gold + (runSummary.goldEarned || 0),
        lifetimeGoldCollected: Math.max(0, Math.floor(Number(current.lifetimeGoldCollected || 0))) + Math.max(0, Math.floor(Number(runSummary.goldEarned || 0))),
        legacyXp: current.legacyXp + (runSummary.legacyXpEarned || 0),
        bestSurvivalTime: Math.max(current.bestSurvivalTime, runSummary.timeSurvived || 0),
        runsPlayed: current.runsPlayed + 1,
        minibossKills: current.minibossKills + (runSummary.minibossesDefeated || 0),
        enemyKills: current.enemyKills + (runSummary.enemiesKilled || 0),
        deaths: current.deaths + (runSummary.deaths || 0)
      };
    });
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
        const progressionLevel = normalizeProgressionLevel(current.progressionLevel);
        const merchant = normalizeMerchantState(current.merchant, {
          classId: current.classId,
          characterId: current.id,
          progressionLevel
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

        const inventory = cloneInventory(current.inventory);
        const purchasedItem = normalizeItem({
          ...(listing.item || {}),
          ownerCharacterId: current.id
        });
        if (!purchasedItem) {
          throw new Error("Could not purchase this item.");
        }

        const insertedLocation = insertItemIntoFirstStorageSlot(inventory, purchasedItem);
        if (!insertedLocation) {
          throw new Error("Storage is full.");
        }

        const remainingStock = stock.filter((candidate, index) => {
          if (index === listingIndex) return false;
          return !isSameMerchantTemplate(candidate && candidate.item, purchasedItem);
        });
        purchase = {
          itemName: purchasedItem.name || "Item",
          price,
          storageLocation: insertedLocation
        };

        return {
          gold: current.gold - price,
          inventory,
          merchant: {
            ...merchant,
            stock: remainingStock
          }
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
        const progressionLevel = normalizeProgressionLevel(current.progressionLevel);
        const merchant = normalizeMerchantState(current.merchant, {
          classId: current.classId,
          characterId: current.id,
          progressionLevel
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

        const price = calculateMerchantSellPrice(normalizedItem);
        setItemAtLocation(inventory, location, null);

        const buybackEntry = {
          buybackId: `buyback_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
          item: normalizedItem,
          price,
          soldAt: nowIso()
        };
        const buyback = [buybackEntry].concat(Array.isArray(merchant.buyback) ? merchant.buyback : []).slice(0, 30);

        sale = {
          itemName: normalizedItem.name || "Item",
          price
        };

        return {
          gold: current.gold + price,
          inventory,
          merchant: {
            ...merchant,
            buyback
          }
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
        const progressionLevel = normalizeProgressionLevel(current.progressionLevel);
        const merchant = normalizeMerchantState(current.merchant, {
          classId: current.classId,
          characterId: current.id,
          progressionLevel
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

        const insertedLocation = insertItemIntoFirstStorageSlot(inventory, item);
        if (!insertedLocation) {
          throw new Error("Storage is full.");
        }

        buyback.splice(listingIndex, 1);
        purchase = {
          itemName: item.name || "Item",
          price,
          storageLocation: insertedLocation
        };

        return {
          gold: current.gold - price,
          inventory,
          merchant: {
            ...merchant,
            buyback
          }
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
    applyRunRewards,
    claimQuestReward,
    moveInventoryItem,
    purchaseMerchantItem,
    sellInventoryItem,
    buybackMerchantItem,
    storeItemInStorage,
    spendAttributePoint,
    spendClassSkillPoint,
    xpRequiredForNextLegacyLevel,
    calculateLegacyProgress,
    calculateMerchantSellPrice,
    getRunsUntilMerchantRefresh
  });
})();
