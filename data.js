(function () {
  const ENEMY_TYPES = {
    grunt: {
      id: "grunt",
      label: "Raider",
      behavior: "chaser",
      color: "#f06d6d",
      radius: 14,
      hp: 24,
      damage: 12,
      speed: 86,
      xpDrop: 8,
      goldChance: 0.18,
      goldDrop: 1
    },
    runner: {
      id: "runner",
      label: "Skitter",
      behavior: "fast",
      color: "#f6a35f",
      radius: 10,
      hp: 14,
      damage: 8,
      speed: 132,
      xpDrop: 7,
      goldChance: 0.12,
      goldDrop: 1
    },
    shooter: {
      id: "shooter",
      label: "Hex Archer",
      behavior: "ranged",
      color: "#a56cf2",
      radius: 12,
      hp: 22,
      damage: 10,
      speed: 66,
      xpDrop: 12,
      goldChance: 0.22,
      goldDrop: 1,
      shotCooldown: 2.2,
      preferredRange: 230,
      projectileSpeed: 215
    },
    dasher: {
      id: "dasher",
      label: "Lancer",
      behavior: "dash",
      color: "#65c8db",
      radius: 13,
      hp: 28,
      damage: 13,
      speed: 88,
      xpDrop: 13,
      goldChance: 0.2,
      goldDrop: 2,
      dashCooldown: 3.6,
      dashDuration: 0.24,
      dashMultiplier: 4.1
    },
    miniboss: {
      id: "miniboss",
      label: "War Captain",
      behavior: "miniboss",
      color: "#f5c65d",
      radius: 28,
      hp: 620,
      damage: 20,
      speed: 64,
      xpDrop: 230,
      goldChance: 1,
      goldDrop: 35,
      shotCooldown: 2.6,
      projectileSpeed: 240,
      legacyReward: 45
    },
    finalBoss: {
      id: "finalBoss",
      label: "Abyss Tyrant",
      behavior: "finalBoss",
      color: "#ff4972",
      radius: 42,
      hp: 4400,
      damage: 28,
      speed: 72,
      xpDrop: 800,
      goldChance: 1,
      goldDrop: 160,
      shotCooldown: 1.8,
      projectileSpeed: 290,
      legacyReward: 180
    }
  };

  const ITEM_RARITIES = {
    grey: { id: "grey", label: "Grey", color: "#9ba4b6", rank: 1 },
    blue: { id: "blue", label: "Blue", color: "#6ea6ff", rank: 2 },
    purple: { id: "purple", label: "Purple", color: "#b584ff", rank: 3 },
    gold: { id: "gold", label: "Gold", color: "#f2c35f", rank: 4 },
    green: { id: "green", label: "Green", color: "#76d68c", rank: 5 }
  };

  const ITEM_TYPES = {
    melee_weapon: { id: "melee_weapon", label: "Melee Weapon" },
    ranged_weapon: { id: "ranged_weapon", label: "Ranged Weapon" },
    helmet: { id: "helmet", label: "Helmet" },
    chest: { id: "chest", label: "Chest" },
    ring: { id: "ring", label: "Ring" },
    amulet: { id: "amulet", label: "Amulet" }
  };

  const PHYSICAL_DAMAGE_TYPES = {
    slashing: { id: "slashing", label: "Slashing" },
    piercing: { id: "piercing", label: "Piercing" },
    bludgeoning: { id: "bludgeoning", label: "Bludgeoning" }
  };

  const ELEMENTAL_DAMAGE_TYPES = {
    fire: { id: "fire", label: "Fire" },
    lightning: { id: "lightning", label: "Lightning" },
    ice: { id: "ice", label: "Ice" },
    poison: { id: "poison", label: "Poison" },
    acid: { id: "acid", label: "Acid" }
  };

  const STATUS_RIDER_TYPES = {
    bleed: { id: "bleed", label: "Bleed" },
    burn: { id: "burn", label: "Burn" },
    shock: { id: "shock", label: "Shock" },
    chill: { id: "chill", label: "Chill" },
    poisoned: { id: "poisoned", label: "Poisoned" },
    corrode: { id: "corrode", label: "Corrode" }
  };

  const WEAPON_CATALOG = [
    {
      id: "axe",
      label: "Axe",
      weaponCategory: "melee",
      physicalDamageType: "slashing",
      compatibleSlots: ["primaryMeleeWeapon", "secondaryMeleeWeapon"],
      slotWeightOptions: [1],
      availableInMvp: true,
      dropEnabled: false
    },
    {
      id: "javelin",
      label: "Javelin",
      weaponCategory: "ranged",
      physicalDamageType: "piercing",
      compatibleSlots: ["rangedWeapon"],
      slotWeightOptions: [1],
      availableInMvp: true,
      dropEnabled: false
    },
    {
      id: "sword",
      label: "Sword",
      weaponCategory: "melee",
      physicalDamageType: "slashing",
      compatibleSlots: ["primaryMeleeWeapon", "secondaryMeleeWeapon"],
      slotWeightOptions: [1],
      availableInMvp: false,
      dropEnabled: false
    },
    {
      id: "mace",
      label: "Mace",
      weaponCategory: "melee",
      physicalDamageType: "bludgeoning",
      compatibleSlots: ["primaryMeleeWeapon", "secondaryMeleeWeapon"],
      slotWeightOptions: [1],
      availableInMvp: false,
      dropEnabled: false
    },
    {
      id: "spear",
      label: "Spear",
      weaponCategory: "melee",
      physicalDamageType: "piercing",
      compatibleSlots: ["primaryMeleeWeapon", "secondaryMeleeWeapon"],
      slotWeightOptions: [1],
      availableInMvp: false,
      dropEnabled: false
    },
    {
      id: "hammer",
      label: "Hammer",
      weaponCategory: "melee",
      physicalDamageType: "bludgeoning",
      compatibleSlots: ["primaryMeleeWeapon", "secondaryMeleeWeapon"],
      slotWeightOptions: [1],
      availableInMvp: false,
      dropEnabled: false
    },
    {
      id: "great_axe",
      label: "Great Axe",
      weaponCategory: "melee",
      physicalDamageType: "slashing",
      compatibleSlots: ["primaryMeleeWeapon", "secondaryMeleeWeapon"],
      slotWeightOptions: [2],
      availableInMvp: false,
      dropEnabled: false
    },
    {
      id: "bow",
      label: "Bow",
      weaponCategory: "ranged",
      physicalDamageType: "piercing",
      compatibleSlots: ["rangedWeapon"],
      slotWeightOptions: [1],
      availableInMvp: false,
      dropEnabled: false
    }
  ];

  const ITEM_REFERENCE_PANEL = {
    title: "Item Reference",
    subtitle: "Testing reference for item families and future drop options",
    supportedRarities: ["grey", "blue", "purple", "gold", "green (reserved)"],
    elementalOptions: ["fire", "lightning", "ice", "poison", "acid"],
    weapons: [
      {
        id: "axe",
        label: "Axe",
        slotLabel: "Primary / Secondary Melee",
        weaponTypeLabel: "Melee",
        physicalDamageType: "slashing",
        rarityTiers: [
          {
            rarity: "grey",
            valueRange: "Slashing Damage +2 to +4",
            optionalStats: ["Attack Speed", "Cleave Width"]
          },
          {
            rarity: "blue",
            valueRange: "Slashing Damage +4 to +7",
            optionalStats: ["Attack Speed", "Cleave Width", "Cooldown Reduction"]
          },
          {
            rarity: "purple",
            valueRange: "Slashing Damage +7 to +11",
            optionalStats: ["Attack Speed", "Cleave Width", "Cooldown Reduction"],
            elementalOptions: ["fire", "lightning", "ice", "poison", "acid"]
          },
          {
            rarity: "gold",
            valueRange: "Slashing Damage +11 to +16",
            optionalStats: ["High stat budget", "Conditional bonuses", "Unique modifiers"]
          }
        ],
        goldThemes: ["Bleed", "Wider cleaves", "Rage synergy", "Heavy impact effects"]
      },
      {
        id: "javelin",
        label: "Javelin",
        slotLabel: "Ranged",
        weaponTypeLabel: "Ranged",
        physicalDamageType: "piercing",
        rarityTiers: [
          {
            rarity: "grey",
            valueRange: "Piercing Damage +2 to +4",
            optionalStats: ["Throw Rate", "Projectile Speed"]
          },
          {
            rarity: "blue",
            valueRange: "Piercing Damage +4 to +7",
            optionalStats: ["Throw Rate", "Projectile Speed", "Cooldown Reduction"]
          },
          {
            rarity: "purple",
            valueRange: "Piercing Damage +7 to +11",
            optionalStats: ["Projectile Range", "Projectile Speed", "Cooldown Reduction"],
            elementalOptions: ["fire", "lightning", "ice", "poison", "acid"]
          },
          {
            rarity: "gold",
            valueRange: "Piercing Damage +11 to +16",
            optionalStats: ["High stat budget", "Conditional bonuses", "Unique modifiers"]
          }
        ],
        goldThemes: ["Piercing-through behavior", "Chain or bounce logic", "High velocity", "Status application"]
      }
    ],
    armor: [
      {
        id: "chestpiece",
        label: "Chestpiece",
        slotLabel: "Chest",
        coreStats: ["Armor", "Health"],
        rarityTiers: [
          {
            rarity: "grey",
            valueRange: "Armor +2 to +4",
            optionalStats: ["Health +4 to +8"]
          },
          {
            rarity: "blue",
            valueRange: "Armor +4 to +7",
            optionalStats: ["Health +8 to +14", "Damage Reduction +1% to +2%"]
          },
          {
            rarity: "purple",
            valueRange: "Armor +7 to +11",
            optionalStats: ["Health +14 to +22", "Regen or mitigation support"]
          },
          {
            rarity: "gold",
            valueRange: "Armor +11 to +16",
            optionalStats: ["Strong conditionals", "Low-health survival effects", "Surrounded-by-enemies effects"]
          }
        ]
      }
    ]
  };

  const ITEM_DEFINITIONS = {
    common_axe: {
      id: "common_axe",
      name: "Axe",
      rarity: "grey",
      itemType: "melee_weapon",
      itemCategory: "weapon",
      weaponCategory: "melee",
      physicalDamageType: "slashing",
      allowedSlots: ["primaryMeleeWeapon", "secondaryMeleeWeapon"],
      weaponSlotWeight: 1,
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        slashingDamageBonus: 2
      }
    },
    common_javelin: {
      id: "common_javelin",
      name: "Javelin",
      rarity: "grey",
      itemType: "ranged_weapon",
      itemCategory: "weapon",
      weaponCategory: "ranged",
      physicalDamageType: "piercing",
      allowedSlot: "rangedWeapon",
      weaponSlotWeight: 1,
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        piercingDamageBonus: 2
      }
    },
    common_chest_piece: {
      id: "common_chest_piece",
      name: "Chest Piece",
      rarity: "grey",
      itemType: "chest",
      itemCategory: "armor",
      allowedSlot: "chest",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        armor: 2
      }
    },
    blue_axe: {
      id: "blue_axe",
      name: "Axe",
      rarity: "blue",
      itemType: "melee_weapon",
      itemCategory: "weapon",
      weaponCategory: "melee",
      physicalDamageType: "slashing",
      allowedSlots: ["primaryMeleeWeapon", "secondaryMeleeWeapon"],
      weaponSlotWeight: 1,
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        slashingDamageBonus: 4
      }
    },
    blue_javelin: {
      id: "blue_javelin",
      name: "Javelin",
      rarity: "blue",
      itemType: "ranged_weapon",
      itemCategory: "weapon",
      weaponCategory: "ranged",
      physicalDamageType: "piercing",
      allowedSlot: "rangedWeapon",
      weaponSlotWeight: 1,
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        piercingDamageBonus: 4
      }
    },
    blue_chest_piece: {
      id: "blue_chest_piece",
      name: "Chest Piece",
      rarity: "blue",
      itemType: "chest",
      itemCategory: "armor",
      allowedSlot: "chest",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        armor: 5
      }
    },
    purple_axe: {
      id: "purple_axe",
      name: "Axe",
      rarity: "purple",
      itemType: "melee_weapon",
      itemCategory: "weapon",
      weaponCategory: "melee",
      physicalDamageType: "slashing",
      allowedSlots: ["primaryMeleeWeapon", "secondaryMeleeWeapon"],
      weaponSlotWeight: 1,
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 2,
      merchantLevelMax: 3,
      stats: {
        slashingDamageBonus: 6
      }
    },
    purple_javelin: {
      id: "purple_javelin",
      name: "Javelin",
      rarity: "purple",
      itemType: "ranged_weapon",
      itemCategory: "weapon",
      weaponCategory: "ranged",
      physicalDamageType: "piercing",
      allowedSlot: "rangedWeapon",
      weaponSlotWeight: 1,
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 2,
      merchantLevelMax: 3,
      stats: {
        piercingDamageBonus: 6
      }
    },
    purple_chest_piece: {
      id: "purple_chest_piece",
      name: "Chest Piece",
      rarity: "purple",
      itemType: "chest",
      itemCategory: "armor",
      allowedSlot: "chest",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 2,
      merchantLevelMax: 3,
      stats: {
        armor: 8
      }
    }
  };

  const STARTER_LOADOUTS = {
    barbarian: ["common_axe", "common_javelin", "common_chest_piece"]
  };

  const MERCHANT = {
    refreshRuns: 5,
    defaultInventorySize: 6,
    defaultProgressionLevel: 1,
    levelPools: {
      1: {
        id: "level_1_merchant",
        label: "Level 1 Merchant",
        allowedRarities: ["grey", "blue"],
        rarityWeights: {
          grey: 0.78,
          blue: 0.22
        },
        minItemLevel: 1,
        maxItemLevel: 1
      }
    },
    classRules: {
      barbarian: {
        allowedItemTypes: ["melee_weapon", "ranged_weapon", "chest", "helmet", "ring", "amulet"],
        varietyBuckets: {
          melee: ["melee_weapon"],
          ranged: ["ranged_weapon"],
          armor: ["chest", "helmet"]
        }
      }
    },
    pricing: {
      sellRate: 0.3,
      rarityMultiplier: {
        grey: 1,
        blue: 1.7,
        purple: 2.8,
        gold: 4.1,
        green: 5
      },
      baseByItemType: {
        melee_weapon: 16,
        ranged_weapon: 16,
        chest: 14,
        helmet: 12,
        ring: 10,
        amulet: 12
      },
      statPointValue: 4
    }
  };

  const LOOT_SYSTEM = {
    enabled: true,
    levelRules: {
      1: {
        allowedItemTypes: ["melee_weapon", "ranged_weapon", "chest"]
      }
    },
    sources: {
      miniboss: {
        enabled: true,
        minDrops: 1,
        extraDropChances: [0.22],
        rarityWeightsByLevel: {
          1: {
            grey: 0.74,
            blue: 0.26
          }
        },
        allowedItemTypes: ["melee_weapon", "ranged_weapon", "chest"],
        maxRarityByLevel: {
          1: "blue"
        }
      },
      finalBoss: {
        enabled: true,
        minDrops: 1,
        extraDropChances: [0.52, 0.18],
        rarityWeightsByLevel: {
          1: {
            grey: 0.27,
            blue: 0.56,
            purple: 0.17
          }
        },
        allowedItemTypes: ["melee_weapon", "ranged_weapon", "chest"],
        maxRarityByLevel: {
          1: "purple"
        }
      }
    },
    visuals: {
      itemPickupRadius: 8,
      rarityColors: {
        grey: "#c2c8d6",
        blue: "#6ea6ff",
        purple: "#b584ff",
        gold: "#f2c35f",
        green: "#76d68c"
      }
    }
  };

  const QUESTS = {
    firstSet: [
      {
        id: "merchant_access",
        title: "Trader's Trust",
        description: "Collect 50 Gold across your runs",
        availableFromStart: true,
        requirement: {
          type: "total_gold_collected",
          target: 50
        },
        reward: {
          type: "unlock_feature",
          featureId: "merchant",
          label: "Unlocks Merchant access",
          autoClaimOnComplete: true
        }
      },
      {
        id: "power_of_attraction",
        title: "The Power of Attraction",
        description: "Reach 100 Legacy XP",
        availableFromStart: true,
        requirement: {
          type: "legacy_xp_total",
          target: 100
        },
        reward: {
          type: "unlock_pickup",
          pickupId: "magnet",
          label: "Unlocks Magnet pickup"
        }
      },
      {
        id: "first_miniboss_fury",
        title: "First Bloodline Trial",
        description: "Defeat your first miniboss",
        availableFromStart: true,
        requirement: {
          type: "miniboss_kills_total",
          target: 1
        },
        reward: {
          type: "unlock_pickup",
          pickupId: "battle_fury",
          label: "Unlocks Battle Fury pickup"
        }
      },
      {
        id: "hundred_kills_blue_reward",
        title: "Hunter's Momentum",
        description: "Defeat 100 enemies across your runs",
        availableFromStart: true,
        requirement: {
          type: "enemy_kills_total",
          target: 100
        },
        reward: {
          type: "grant_item_by_rarity",
          rarity: "blue",
          count: 1,
          label: "Grants 1 Blue item"
        }
      },
      {
        id: "five_falls_healing",
        title: "Second Wind",
        description: "Die 5 times across your runs",
        availableFromStart: true,
        requirement: {
          type: "deaths_total",
          target: 5
        },
        reward: {
          type: "unlock_pickup",
          pickupId: "healing_orb",
          label: "Unlocks Healing Orb pickup"
        }
      }
    ]
  };

  const POWERUPS = {
    magnet: {
      id: "magnet",
      label: "Magnet",
      unlockQuestId: "power_of_attraction",
      description: "Pulls all currently spawned XP pickups rapidly toward the player.",
      drop: {
        requiresUnlock: true,
        checkIntervalSeconds: 10,
        baseChancePerCheck: 0.022,
        badLuckRampSeconds: 240,
        maxBadLuckBonusChance: 0.08,
        firstDropDelaySeconds: 50,
        minSecondsBetweenDrops: 150,
        maxActiveOnGround: 1,
        minSpawnDistanceFromPlayer: 85,
        maxSpawnDistanceFromPlayer: 260,
        spawnEdgePadding: 24
      },
      effect: {
        appliesTo: "current_xp_only",
        pullSpeed: 1450,
        pullDurationSeconds: 1.55
      },
      visual: {
        radius: 8,
        fillColor: "#76d68c",
        ringColor: "#c6ffdb"
      }
    },
    battle_fury: {
      id: "battle_fury",
      label: "Battle Fury",
      unlockQuestId: "first_miniboss_fury",
      description: "Temporarily boosts damage and attack speed.",
      drop: {
        requiresUnlock: true,
        chanceOnEnemyKill: 0.022,
        firstDropDelaySeconds: 35,
        minSecondsBetweenDrops: 55,
        maxActiveOnGround: 1
      },
      effect: {
        damageMultiplier: 1.35,
        attackSpeedMultiplier: 1.3,
        durationSeconds: 10
      },
      visual: {
        radius: 8,
        fillColor: "#ff9f5f",
        ringColor: "#ffd5b0"
      }
    },
    healing_orb: {
      id: "healing_orb",
      label: "Healing Orb",
      unlockQuestId: "five_falls_healing",
      description: "Restores a chunk of health when collected.",
      drop: {
        requiresUnlock: true,
        checkIntervalSeconds: 10,
        baseChancePerCheck: 0.34,
        badLuckRampSeconds: 160,
        maxBadLuckBonusChance: 0.36,
        firstDropDelaySeconds: 24,
        minSecondsBetweenDrops: 120,
        maxActiveOnGround: 1,
        minSpawnDistanceFromPlayer: 70,
        maxSpawnDistanceFromPlayer: 220,
        spawnEdgePadding: 22
      },
      effect: {
        healAmount: 15
      },
      visual: {
        radius: 8,
        fillColor: "#7ee28e",
        ringColor: "#d4ffdc"
      }
    }
  };

  const ENEMY_COLLISION = {
    separationStrength: 0.72,
    personalSpaceBuffer: 4,
    maxCorrectionPerFrame: 11,
    typeSettings: {
      grunt: { mass: 1, collisionScale: 0.92 },
      runner: { mass: 0.85, collisionScale: 0.86 },
      shooter: { mass: 0.95, collisionScale: 0.9 },
      dasher: { mass: 0.9, collisionScale: 0.88 },
      miniboss: { mass: 4.5, collisionScale: 1.05 },
      finalBoss: { mass: 9, collisionScale: 1.12 }
    }
  };

  const SWARM_EVENTS = {
    enabled: true,
    firstSwarmDelaySeconds: {
      min: 40,
      max: 55
    },
    intervalSeconds: {
      min: 56,
      max: 78
    },
    telegraphSeconds: 1.2,
    eventDurationSeconds: 6.4,
    normalSpawnRateMultiplierDuringSwarm: 0.18,
    rush: {
      enabled: true,
      weight: 1,
      directions: ["left_to_right", "right_to_left", "top_to_bottom", "bottom_to_top"],
      baseEnemyCount: 11,
      enemyCountPerMinute: 1.3,
      maxEnemyCount: 26,
      spawnMargin: 72,
      laneWidth: 170,
      lateralJitter: 10,
      speedMultiplier: 1.55,
      speedMultiplierPerMinute: 0.04,
      maxSpeedMultiplier: 2.2,
      enemyWeights: {
        runner: 0.62,
        grunt: 0.3,
        dasher: 0.08
      }
    },
    encirclement: {
      enabled: true,
      weight: 1,
      baseEnemyCount: 10,
      enemyCountPerMinute: 1.2,
      maxEnemyCount: 24,
      ringRadius: 220,
      ringRadiusGrowthPerMinute: 7,
      brokenRingChance: 0.56,
      brokenRingGapRadians: 1.05,
      speedMultiplier: 1.08,
      speedMultiplierPerMinute: 0.03,
      maxSpeedMultiplier: 1.46,
      enemyWeights: {
        grunt: 0.58,
        runner: 0.34,
        dasher: 0.08
      }
    }
  };

  const OBSTACLES = {
    enabled: true,
    minCount: 6,
    maxCount: 9,
    minRadius: 22,
    maxRadius: 44,
    minGap: 14,
    edgePadding: 30,
    minDistanceFromPlayerStart: 95,
    spawnAreaWidthMultiplier: 3.2,
    spawnAreaHeightMultiplier: 3.2,
    playerCollisionPadding: 2,
    enemyCollisionPadding: 1,
    fillColor: "rgba(78, 88, 112, 0.85)",
    strokeColor: "rgba(188, 201, 229, 0.36)"
  };

  const UPGRADE_DEFINITIONS = [
    {
      id: "generic_damage",
      type: "generic",
      title: "Damage Increase",
      description: "Increase all weapon damage.",
      maxRank: 5,
      weight: 1
    },
    {
      id: "generic_cooldown",
      type: "generic",
      title: "Cooldown Reduction",
      description: "Reduce cooldowns for all weapons.",
      maxRank: 5,
      weight: 1
    },
    {
      id: "axe_widen_arc",
      type: "path",
      weaponId: "axe",
      title: "Widen Arc",
      description: "Expand attack width and cleave coverage.",
      maxRank: 5,
      weight: 0.95
    },
    {
      id: "axe_twin_swing",
      type: "path",
      weaponId: "axe",
      title: "Twin Swing",
      description: "Add follow-up cleave swings.",
      maxRank: 5,
      weight: 0.9
    },
    {
      id: "axe_whirlwind",
      type: "ultimate",
      weaponId: "axe",
      title: "Whirlwind",
      description: "Convert axe attacks into full-circle cleaves.",
      maxRank: 1,
      weight: 4,
      requirements: {
        allAtMax: ["axe_widen_arc", "axe_twin_swing"]
      }
    },
    {
      id: "javelin_volley",
      type: "path",
      weaponId: "javelin",
      title: "Volley",
      description: "Throw additional javelins per attack cycle.",
      maxRank: 5,
      weight: 0.92
    },
    {
      id: "javelin_long_flight",
      type: "path",
      weaponId: "javelin",
      title: "Piercing Throw",
      description: "Javelins pierce through additional enemies.",
      maxRank: 5,
      weight: 0.9
    },
    {
      id: "javelin_piercing_volley",
      type: "ultimate",
      weaponId: "javelin",
      title: "Explosive Volley",
      description: "Javelins explode on hit, dealing splash damage in an area.",
      maxRank: 1,
      weight: 4,
      requirements: {
        allAtMax: ["javelin_volley", "javelin_long_flight"]
      }
    }
  ];

  const TOTAL_UPGRADE_CAPACITY = UPGRADE_DEFINITIONS.reduce((sum, upgrade) => sum + upgrade.maxRank, 0);

  const SKILL_TREE_DEFINITIONS = {
    barbarian: {
      weapons: {
        title: "Weapon Skill Tree",
        subtitle: "Available weapon specializations for this class",
        categories: [
          {
            id: "melee",
            label: "Melee",
            description: "Close-range combat options focused on control and burst damage",
            weapons: [
              {
                id: "axe",
                label: "Axe",
                description: "Directional cleave weapon with high impact and area control",
                paths: [
                  {
                    upgradeId: "axe_widen_arc",
                    label: "Widen Arc",
                    maxLevel: 5,
                    description: "Expands attack width / cleave angle."
                  },
                  {
                    upgradeId: "axe_twin_swing",
                    label: "Twin Swing",
                    maxLevel: 5,
                    description: "Adds additional follow-up swings."
                  }
                ],
                ultimate: {
                  upgradeId: "axe_whirlwind",
                  label: "Whirlwind",
                  description: "Converts attacks into full-circle or near full-circle cleaves.",
                  requirementText: "Requires both paths at max level"
                }
              }
            ]
          },
          {
            id: "ranged",
            label: "Ranged",
            description: "Distance-based weapons for pressure and targeting",
            weapons: [
              {
                id: "javelin",
                label: "Javelin",
                description: "Auto-targeted projectile weapon for consistent ranged pressure",
                paths: [
                  {
                    upgradeId: "javelin_volley",
                    label: "Volley",
                    maxLevel: 5,
                    description: "Throws additional javelins."
                  },
                  {
                    upgradeId: "javelin_long_flight",
                    label: "Piercing Throw",
                    maxLevel: 5,
                    description: "Adds piercing hits to each javelin."
                  }
                ],
                ultimate: {
                  upgradeId: "javelin_piercing_volley",
                  label: "Explosive Volley",
                  description: "Javelin impacts explode and deal splash AoE damage.",
                  requirementText: "Requires both paths at max level"
                }
              }
            ]
          }
        ]
      },
      classTree: {
        title: "Barbarian Attributes",
        subtitle: "Attribute-based progression powered by Legacy XP",
        maxLevel: 10,
        intro: [
          "Attributes scale your existing systems instead of unlocking isolated skills.",
          "Spend Legacy-earned points to build a damage, tank, or hybrid Barbarian."
        ],
        attributes: [
          {
            id: "strength",
            label: "Strength",
            description: "Raw physical power that boosts all weapon damage types.",
            summaryEffect: "+3% physical damage per level",
            scaling: [
              "+3% Slashing / Piercing / Bludgeoning damage per level",
              "+1% armor penetration per level (future-facing hook)"
            ],
            thresholds: [
              { level: 3, label: "Armored Breaker", description: "Bonus damage against armored enemies." },
              { level: 6, label: "Partial Armor Ignore", description: "Ignore part of enemy armor." },
              { level: 10, label: "Defense Bypass", description: "Bypass a large portion of enemy defenses." }
            ]
          },
          {
            id: "ferocity",
            label: "Ferocity",
            legacyBranchId: "ferocity",
            description: "Aggression and Rage scaling.",
            summaryEffect: "+8% Rage gain and +6% Rage duration per level",
            scaling: [
              "+8% Rage gain per level",
              "+6% Rage duration per level"
            ],
            thresholds: [
              { level: 3, label: "Rage Speed", description: "Rage grants attack speed." },
              { level: 6, label: "Rage Momentum", description: "Kills extend active Rage duration." },
              { level: 10, label: "Rage Modifier", description: "Rage also improves attack behavior." }
            ]
          },
          {
            id: "endurance",
            label: "Endurance",
            legacyBranchId: "survivor",
            description: "Survivability and mitigation.",
            summaryEffect: "+5% Max HP and +1% damage reduction per level",
            scaling: [
              "+5% Max HP per level",
              "+1% base damage reduction per level",
              "+4% armor scaling per level (future-facing hook)"
            ],
            thresholds: [
              { level: 3, label: "Last Stand", description: "Extra mitigation while low HP." },
              { level: 6, label: "Hit Hardened", description: "Taking repeated hits grants bonus mitigation." },
              { level: 10, label: "Pain Into Rage", description: "Part of incoming damage converts into Rage." }
            ]
          },
          {
            id: "instinct",
            label: "Instinct",
            legacyBranchId: "instinct",
            description: "Flow, responsiveness, and utility.",
            summaryEffect: "+3% move speed and +1.5% cooldown efficiency per level",
            scaling: [
              "+3% movement speed per level",
              "+1.5% cooldown efficiency per level",
              "+4% pickup radius per level"
            ],
            thresholds: [
              { level: 3, label: "Kill Flow", description: "Kills trigger minor cooldown recovery." },
              { level: 6, label: "Adrenal Response", description: "Taking damage grants a short speed burst." },
              { level: 10, label: "Primal Trigger", description: "Automatically triggers Rage at low HP." }
            ]
          }
        ],
        buildIdentityExamples: [
          "Damage build: High Strength + Ferocity, low Endurance.",
          "Tank build: High Endurance with medium Strength.",
          "Hybrid build: Balanced attributes for consistency."
        ],
        notes: [
          "MVP attributes cap at level 10.",
          "Strength is the Barbarian-specific primary class attribute.",
          "Future classes will define their own class-specific primary attributes.",
          "System is designed to scale for future classes and item modifiers."
        ]
      }
    }
  };

  window.RL_DATA = Object.freeze({
    GAME_TITLE: "Barbarian Last Stand",
    STORAGE: {
      charactersKey: "rlgame_characters_v1"
    },
    RACES: {
      human: {
        id: "human",
        label: "Human"
      }
    },
    CLASSES: {
      barbarian: {
        id: "barbarian",
        label: "Barbarian",
        startingWeapons: ["axe", "javelin"],
        attributeIdentity:
          "Strength is the Barbarian-specific primary class attribute. Future classes will define their own class-specific primary attributes."
      }
    },
    ITEM_RARITIES,
    ITEM_TYPES,
    PHYSICAL_DAMAGE_TYPES,
    ELEMENTAL_DAMAGE_TYPES,
    STATUS_RIDER_TYPES,
    ITEM_DEFINITIONS,
    STARTER_LOADOUTS,
    MERCHANT,
    LOOT_SYSTEM,
    QUESTS,
    POWERUPS,
    WEAPON_CATALOG,
    ITEM_REFERENCE_PANEL,
    WEAPONS: {
      axe: {
        id: "axe",
        label: "Axe",
        baseDamage: 22,
        cooldown: 1.05,
        range: 80,
        arcRadians: 1.18,
        swingDuration: 0.15
      },
      javelin: {
        id: "javelin",
        label: "Javelin",
        baseDamage: 17,
        cooldown: 1.36,
        speed: 420,
        range: 280,
        radius: 4,
        lifetime: 1.9,
        count: 1,
        pierce: 0,
        explosiveRadius: 54,
        explosiveDamageMultiplier: 0.45
      }
    },
    PLAYER_BASE: {
      radius: 16,
      moveSpeed: 195,
      maxHp: 120,
      invulnDuration: 0.62,
      pickupRadius: 30
    },
    RUN: {
      finalBossTimeSeconds: 1200,
      minibossIntervalSeconds: 300,
      baseSpawnRatePerSecond: 1.05,
      baseSpawnPackMin: 1,
      baseSpawnPackMax: 2,
      healthScalingPerMinute: 0.085,
      damageScalingPerMinute: 0.055,
      xpScalingPerMinute: 0.07,
      goldPickupMultiplier: 0.65,
      goldRewardPerSecond: 0.06,
      legacyPerMinute: 6
    },
    SWARM_EVENTS,
    OBSTACLES,
    ENEMY_COLLISION,
    LEGACY_PROGRESSION: {
      baseXp: 80,
      growth: 1.16
    },
    LEVEL_CURVE: {
      baseXp: 35,
      growth: 1.31
    },
    SPAWN_TABLES: [
      {
        start: 0,
        end: 300,
        spawnRateMultiplier: 1,
        packMin: 1,
        packMax: 2,
        burstChance: 0.08,
        weights: {
          grunt: 0.72,
          runner: 0.25,
          shooter: 0.03,
          dasher: 0
        }
      },
      {
        start: 300,
        end: 600,
        spawnRateMultiplier: 1.22,
        packMin: 2,
        packMax: 3,
        burstChance: 0.12,
        weights: {
          grunt: 0.56,
          runner: 0.25,
          shooter: 0.1,
          dasher: 0.14
        }
      },
      {
        start: 600,
        end: 900,
        spawnRateMultiplier: 1.45,
        packMin: 2,
        packMax: 4,
        burstChance: 0.15,
        weights: {
          grunt: 0.42,
          runner: 0.25,
          shooter: 0.14,
          dasher: 0.19
        }
      },
      {
        start: 900,
        end: 1200,
        spawnRateMultiplier: 1.7,
        packMin: 3,
        packMax: 5,
        burstChance: 0.2,
        weights: {
          grunt: 0.36,
          runner: 0.22,
          shooter: 0.18,
          dasher: 0.24
        }
      },
      {
        start: 1200,
        end: 99999,
        spawnRateMultiplier: 1.86,
        packMin: 3,
        packMax: 6,
        burstChance: 0.24,
        weights: {
          grunt: 0.32,
          runner: 0.2,
          shooter: 0.2,
          dasher: 0.28
        }
      }
    ],
    ENEMIES: ENEMY_TYPES,
    UPGRADES: UPGRADE_DEFINITIONS,
    TOTAL_UPGRADE_CAPACITY,
    SKILL_TREES: SKILL_TREE_DEFINITIONS
  });
})();
