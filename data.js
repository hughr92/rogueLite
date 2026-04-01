(function () {
  const ENEMY_TYPES = {
    grunt: {
      id: "grunt",
      label: "Raider",
      behavior: "chaser",
      bountyLevel: 1,
      bountyTarget: 60,
      bountyRewardItemCount: 1,
      color: "#f06d6d",
      radius: 14,
      hp: 24,
      damage: 12,
      resistances: ["slashing"],
      weaknesses: ["piercing"],
      speed: 86,
      xpDrop: 8,
      goldChance: 0.18,
      goldDrop: 1
    },
    runner: {
      id: "runner",
      label: "Skitter",
      behavior: "fast",
      bountyLevel: 1,
      bountyTarget: 70,
      bountyRewardItemCount: 1,
      color: "#f6a35f",
      radius: 10,
      hp: 14,
      damage: 8,
      resistances: [],
      weaknesses: ["slashing"],
      speed: 132,
      xpDrop: 7,
      goldChance: 0.12,
      goldDrop: 1
    },
    shooter: {
      id: "shooter",
      label: "Hex Archer",
      behavior: "ranged",
      bountyLevel: 1,
      bountyTarget: 55,
      bountyRewardItemCount: 1,
      color: "#a56cf2",
      radius: 12,
      hp: 22,
      damage: 10,
      resistances: ["piercing"],
      weaknesses: ["bludgeoning"],
      speed: 66,
      xpDrop: 12,
      goldChance: 0.22,
      goldDrop: 1,
      shotCooldown: 2.2,
      preferredRange: 230,
      projectileSpeed: 215
    },
    trishot: {
      id: "trishot",
      label: "Volley Shaman",
      behavior: "tri_ranged",
      bountyLevel: 2,
      bountyTarget: 65,
      bountyRewardItemCount: 1,
      color: "#8c79ff",
      radius: 13,
      hp: 34,
      damage: 14,
      resistances: ["piercing"],
      weaknesses: ["slashing"],
      speed: 50,
      xpDrop: 18,
      goldChance: 0.24,
      goldDrop: 2,
      shotCooldown: 2.9,
      preferredRange: 250,
      projectileSpeed: 190,
      spreadRadians: 0.32,
      sideProjectileDamageScale: 0.82
    },
    shieldbearer: {
      id: "shieldbearer",
      label: "Bulwark",
      behavior: "chaser",
      bountyLevel: 1,
      bountyTarget: 58,
      bountyRewardItemCount: 1,
      color: "#6f9bf0",
      radius: 13,
      hp: 30,
      shieldHp: 24,
      damage: 11,
      resistances: ["piercing"],
      weaknesses: ["bludgeoning"],
      speed: 76,
      xpDrop: 11,
      goldChance: 0.2,
      goldDrop: 1
    },
    dasher: {
      id: "dasher",
      label: "Lancer",
      behavior: "dash",
      bountyLevel: 1,
      bountyTarget: 40,
      bountyRewardItemCount: 1,
      color: "#65c8db",
      radius: 13,
      hp: 28,
      damage: 13,
      resistances: ["piercing"],
      weaknesses: ["bludgeoning"],
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
      bountyLevel: 1,
      bountyTarget: 5,
      bountyRewardItemCount: 2,
      color: "#f5c65d",
      radius: 28,
      hp: 620,
      damage: 20,
      resistances: ["slashing", "piercing"],
      weaknesses: ["bludgeoning"],
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
      bountyLevel: 1,
      bountyTarget: 1,
      bountyRewardItemCount: 2,
      color: "#ff4972",
      radius: 42,
      hp: 4400,
      damage: 28,
      resistances: ["fire", "poison"],
      weaknesses: ["lightning"],
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

  const WEAPON_MASTERY = {
    tiersByRarity: {
      grey: 1,
      blue: 2,
      purple: 3,
      gold: 4,
      green: 5
    },
    perTierFlatBonusByRarity: {
      grey: 1,
      blue: 1,
      purple: 2,
      gold: 2,
      green: 3
    },
    thresholdsByRarity: {
      grey: [100],
      blue: [120, 350],
      purple: [220, 520, 900],
      gold: [300, 700, 1200, 1800],
      green: [420, 920, 1600, 2350, 3200]
    }
  };

  const ITEM_TYPES = {
    melee_weapon: { id: "melee_weapon", label: "Melee Weapon" },
    ranged_weapon: { id: "ranged_weapon", label: "Ranged Weapon" },
    helmet: { id: "helmet", label: "Helmet" },
    chest: { id: "chest", label: "Chest" },
    leggings: { id: "leggings", label: "Leggings" },
    boots: { id: "boots", label: "Boots" },
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

  const LEVELS = [
    {
      id: "level_1",
      index: 1,
      label: "Level 1",
      subtitle: "Barbarian Last Stand"
    },
    {
      id: "level_2",
      index: 2,
      label: "Level 2",
      subtitle: "Bloodwind Approach",
      spawnWeightAdditions: [
        { trishot: 0.04 },
        { trishot: 0.08 },
        { trishot: 0.12 },
        { trishot: 0.16 },
        { trishot: 0.2 }
      ]
    }
  ];

  const GAME_LEVEL_SCALING = {
    defaultProfile: {
      enemyHealthMultiplier: 1,
      enemyDamageMultiplier: 1,
      enemyXpMultiplier: 1,
      enemySpawnRateMultiplier: 1,
      itemDamageMultiplier: 1
    },
    perLevelGrowth: {
      enemyHealthMultiplier: 0.2,
      enemyDamageMultiplier: 0.12,
      enemyXpMultiplier: 0.17,
      enemySpawnRateMultiplier: 0.08,
      itemDamageMultiplier: 0.22
    },
    byLevel: {
      1: {
        enemyHealthMultiplier: 1,
        enemyDamageMultiplier: 1,
        enemyXpMultiplier: 1,
        enemySpawnRateMultiplier: 1,
        itemDamageMultiplier: 1
      },
      2: {
        enemyHealthMultiplier: 1.45,
        enemyDamageMultiplier: 1.3,
        enemyXpMultiplier: 1.42,
        enemySpawnRateMultiplier: 1.34,
        itemDamageMultiplier: 1.22
      }
    },
    itemDamageStatKeys: ["slashingDamageBonus", "piercingDamageBonus", "bludgeoningDamageBonus"]
  };

  const DIFFICULTY_MODIFIER = {
    defaultDifficulty: 1,
    maxDifficulty: 10,
    enemyHealthPerDifficulty: 0.18,
    enemyDamagePerDifficulty: 0.13,
    enemySpeedPerDifficulty: 0.04,
    enemyXpPerDifficulty: 0.2
  };

  const BOUNTIES = {
    defaultTarget: 50,
    defaultXpReward: 30,
    maxSteps: 5,
    killMultipliersByStep: [1, 1.55, 2.2, 3.05, 4.1],
    xpMultipliersByStep: [1, 1.35, 1.75, 2.2, 2.75],
    damageBonusPctPerStep: 0.03,
    targetByBehavior: {
      chaser: 60,
      fast: 70,
      ranged: 55,
      dash: 40,
      miniboss: 5,
      finalBoss: 1
    },
    defaultRewardItemCount: 1,
    rewardItemCountByBehavior: {
      miniboss: 2,
      finalBoss: 2
    },
    levelRewardRarity: {
      1: "purple",
      2: "gold",
      3: "green"
    },
    levelRewardXp: {
      1: 30,
      2: 50,
      3: 70
    }
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
      },
      {
        id: "leggings",
        label: "Leggings",
        slotLabel: "Leggings",
        coreStats: ["Armor", "Health"],
        rarityTiers: [
          {
            rarity: "grey",
            valueRange: "Armor +1 to +3",
            optionalStats: ["Health +3 to +7"]
          },
          {
            rarity: "blue",
            valueRange: "Armor +3 to +6",
            optionalStats: ["Health +6 to +12", "Damage Reduction +1% to +2%"]
          },
          {
            rarity: "purple",
            valueRange: "Armor +6 to +9",
            optionalStats: ["Health +12 to +18", "Mitigation support"]
          },
          {
            rarity: "gold",
            valueRange: "Armor +9 to +13",
            optionalStats: ["Strong conditionals", "Low-health defense effects"]
          }
        ]
      },
      {
        id: "boots",
        label: "Boots",
        slotLabel: "Boots",
        coreStats: ["Move Speed", "Status Effect Resistance"],
        rarityTiers: [
          {
            rarity: "grey",
            valueRange: "Move Speed +2% to +4%",
            optionalStats: ["Status Effect Resistance +4% to +8%"]
          },
          {
            rarity: "blue",
            valueRange: "Move Speed +4% to +7%",
            optionalStats: ["Status Effect Resistance +8% to +12%"]
          },
          {
            rarity: "purple",
            valueRange: "Move Speed +7% to +10%",
            optionalStats: ["Status Effect Resistance +12% to +18%"]
          },
          {
            rarity: "gold",
            valueRange: "Move Speed +10% to +14%",
            optionalStats: ["Status Effect Resistance +18% to +24%", "Mobility conditionals"]
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
    common_helmet: {
      id: "common_helmet",
      name: "Helm",
      rarity: "grey",
      itemType: "helmet",
      itemCategory: "armor",
      allowedSlot: "helmet",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        armor: 1,
        maxHpBonus: 4
      }
    },
    common_leggings: {
      id: "common_leggings",
      name: "Leggings",
      rarity: "grey",
      itemType: "leggings",
      itemCategory: "armor",
      allowedSlot: "leggings",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        armor: 2,
        maxHpBonus: 6
      }
    },
    common_boots: {
      id: "common_boots",
      name: "Boots",
      rarity: "grey",
      itemType: "boots",
      itemCategory: "armor",
      allowedSlot: "boots",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        moveSpeedBonusPct: 4,
        statusEffectResistPct: 8
      }
    },
    common_ring: {
      id: "common_ring",
      name: "Ring",
      rarity: "grey",
      itemType: "ring",
      itemCategory: "accessory",
      allowedSlots: ["ring1", "ring2"],
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        slashingDamageBonus: 1,
        piercingDamageBonus: 1
      }
    },
    common_amulet: {
      id: "common_amulet",
      name: "Amulet",
      rarity: "grey",
      itemType: "amulet",
      itemCategory: "accessory",
      allowedSlot: "amulet",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        maxHpBonus: 4,
        statusEffectResistPct: 4
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
    blue_helmet: {
      id: "blue_helmet",
      name: "Helm",
      rarity: "blue",
      itemType: "helmet",
      itemCategory: "armor",
      allowedSlot: "helmet",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        armor: 3,
        maxHpBonus: 8
      }
    },
    blue_leggings: {
      id: "blue_leggings",
      name: "Leggings",
      rarity: "blue",
      itemType: "leggings",
      itemCategory: "armor",
      allowedSlot: "leggings",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        armor: 4,
        maxHpBonus: 12
      }
    },
    blue_boots: {
      id: "blue_boots",
      name: "Boots",
      rarity: "blue",
      itemType: "boots",
      itemCategory: "armor",
      allowedSlot: "boots",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        moveSpeedBonusPct: 7,
        statusEffectResistPct: 14
      }
    },
    blue_ring: {
      id: "blue_ring",
      name: "Ring",
      rarity: "blue",
      itemType: "ring",
      itemCategory: "accessory",
      allowedSlots: ["ring1", "ring2"],
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        slashingDamageBonus: 2,
        piercingDamageBonus: 2
      }
    },
    blue_amulet: {
      id: "blue_amulet",
      name: "Amulet",
      rarity: "blue",
      itemType: "amulet",
      itemCategory: "accessory",
      allowedSlot: "amulet",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 1,
      merchantLevelMax: 1,
      stats: {
        maxHpBonus: 8,
        statusEffectResistPct: 8
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
      merchantLevelMin: 5,
      merchantLevelMax: 30,
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
      merchantLevelMin: 5,
      merchantLevelMax: 30,
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
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        armor: 8
      }
    },
    purple_helmet: {
      id: "purple_helmet",
      name: "Helm",
      rarity: "purple",
      itemType: "helmet",
      itemCategory: "armor",
      allowedSlot: "helmet",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        armor: 5,
        maxHpBonus: 13
      }
    },
    purple_leggings: {
      id: "purple_leggings",
      name: "Leggings",
      rarity: "purple",
      itemType: "leggings",
      itemCategory: "armor",
      allowedSlot: "leggings",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        armor: 7,
        maxHpBonus: 18
      }
    },
    purple_boots: {
      id: "purple_boots",
      name: "Boots",
      rarity: "purple",
      itemType: "boots",
      itemCategory: "armor",
      allowedSlot: "boots",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        moveSpeedBonusPct: 10,
        statusEffectResistPct: 20
      }
    },
    purple_ring: {
      id: "purple_ring",
      name: "Ring",
      rarity: "purple",
      itemType: "ring",
      itemCategory: "accessory",
      allowedSlots: ["ring1", "ring2"],
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        slashingDamageBonus: 3,
        piercingDamageBonus: 3
      }
    },
    purple_amulet: {
      id: "purple_amulet",
      name: "Amulet",
      rarity: "purple",
      itemType: "amulet",
      itemCategory: "accessory",
      allowedSlot: "amulet",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        maxHpBonus: 14,
        statusEffectResistPct: 12
      }
    },
    gold_axe: {
      id: "gold_axe",
      name: "Axe",
      rarity: "gold",
      itemType: "melee_weapon",
      itemCategory: "weapon",
      weaponCategory: "melee",
      physicalDamageType: "slashing",
      allowedSlots: ["primaryMeleeWeapon", "secondaryMeleeWeapon"],
      weaponSlotWeight: 1,
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        slashingDamageBonus: 9
      }
    },
    gold_javelin: {
      id: "gold_javelin",
      name: "Javelin",
      rarity: "gold",
      itemType: "ranged_weapon",
      itemCategory: "weapon",
      weaponCategory: "ranged",
      physicalDamageType: "piercing",
      allowedSlot: "rangedWeapon",
      weaponSlotWeight: 1,
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        piercingDamageBonus: 9
      }
    },
    gold_chest_piece: {
      id: "gold_chest_piece",
      name: "Chest Piece",
      rarity: "gold",
      itemType: "chest",
      itemCategory: "armor",
      allowedSlot: "chest",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        armor: 12,
        maxHpBonus: 24
      }
    },
    gold_helmet: {
      id: "gold_helmet",
      name: "Helm",
      rarity: "gold",
      itemType: "helmet",
      itemCategory: "armor",
      allowedSlot: "helmet",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        armor: 8,
        maxHpBonus: 18
      }
    },
    gold_leggings: {
      id: "gold_leggings",
      name: "Leggings",
      rarity: "gold",
      itemType: "leggings",
      itemCategory: "armor",
      allowedSlot: "leggings",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        armor: 10,
        maxHpBonus: 24
      }
    },
    gold_boots: {
      id: "gold_boots",
      name: "Boots",
      rarity: "gold",
      itemType: "boots",
      itemCategory: "armor",
      allowedSlot: "boots",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        moveSpeedBonusPct: 13,
        statusEffectResistPct: 26
      }
    },
    gold_ring: {
      id: "gold_ring",
      name: "Ring",
      rarity: "gold",
      itemType: "ring",
      itemCategory: "accessory",
      allowedSlots: ["ring1", "ring2"],
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        slashingDamageBonus: 5,
        piercingDamageBonus: 5
      }
    },
    gold_amulet: {
      id: "gold_amulet",
      name: "Amulet",
      rarity: "gold",
      itemType: "amulet",
      itemCategory: "accessory",
      allowedSlot: "amulet",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 5,
      merchantLevelMax: 30,
      stats: {
        maxHpBonus: 22,
        statusEffectResistPct: 18
      }
    },
    green_berserker_helmet: {
      id: "green_berserker_helmet",
      name: "Berserker Helm",
      rarity: "green",
      itemType: "helmet",
      itemCategory: "armor",
      setId: "berserker_set",
      setName: "Berserker Set",
      setPiece: "helmet",
      allowedSlot: "helmet",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 999,
      merchantLevelMax: 999,
      stats: {
        armor: 10,
        maxHpBonus: 24
      }
    },
    green_berserker_chest: {
      id: "green_berserker_chest",
      name: "Berserker Chestguard",
      rarity: "green",
      itemType: "chest",
      itemCategory: "armor",
      setId: "berserker_set",
      setName: "Berserker Set",
      setPiece: "chest",
      allowedSlot: "chest",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 999,
      merchantLevelMax: 999,
      stats: {
        armor: 14,
        maxHpBonus: 32
      }
    },
    green_berserker_leggings: {
      id: "green_berserker_leggings",
      name: "Berserker Legguards",
      rarity: "green",
      itemType: "leggings",
      itemCategory: "armor",
      setId: "berserker_set",
      setName: "Berserker Set",
      setPiece: "leggings",
      allowedSlot: "leggings",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 999,
      merchantLevelMax: 999,
      stats: {
        armor: 12,
        maxHpBonus: 28
      }
    },
    green_berserker_boots: {
      id: "green_berserker_boots",
      name: "Berserker Boots",
      rarity: "green",
      itemType: "boots",
      itemCategory: "armor",
      setId: "berserker_set",
      setName: "Berserker Set",
      setPiece: "boots",
      allowedSlot: "boots",
      itemLevel: 1,
      classIds: ["barbarian"],
      merchantLevelMin: 999,
      merchantLevelMax: 999,
      stats: {
        moveSpeedBonusPct: 16,
        statusEffectResistPct: 30
      }
    }
  };

  const STARTER_LOADOUTS = {
    barbarian: ["common_axe", "common_javelin", "common_chest_piece"]
  };

  const MERCHANT = {
    refreshRuns: 1,
    refreshMinRunSeconds: 120,
    defaultInventorySize: 6,
    defaultProgressionLevel: 1,
    manualRefresh: {
      baseCost: 50,
      costPerUnlockedLevel: 20
    },
    progression: {
      xpPerGoldSpent: 1.35,
      baseXpToLevel: 180,
      growth: 1.32,
      levelsPerGameLevel: 5,
      maxLevel: 30,
      maxPurpleListingsAtLevel5: 1,
      blueStatScaling: {
        startLevel: 2,
        perLevel: 0.08,
        maxMultiplier: 1.35
      },
      reviveConsumable: {
        id: "revive_sigil",
        name: "Phoenix Sigil",
        rarity: "blue",
        description: "Consumed on death to revive and continue the run.",
        price: 220,
        unlockAtMaxLevelOnly: true,
        maxOwned: 1,
        reviveHpPct: 0.45,
        postReviveInvulnSeconds: 2.4
      },
      healthPotion: {
        id: "health_potion",
        name: "Health Potion",
        rarity: "blue",
        description: "Use during a run (Q) to restore 50% of max HP.",
        price: 50,
        unlockAtMerchantLevel: 1,
        maxOwned: 3,
        healHpPct: 0.5
      }
    },
    levelPools: {
      1: {
        id: "level_1_merchant",
        label: "Level 1 Merchant",
        allowedRarities: ["grey", "blue"],
        rarityWeights: {
          grey: 0.7,
          blue: 0.3
        },
        minItemLevel: 1,
        maxItemLevel: 1
      },
      2: {
        id: "level_2_merchant",
        label: "Level 2 Merchant",
        allowedRarities: ["grey", "blue"],
        rarityWeights: {
          grey: 0.55,
          blue: 0.45
        },
        minItemLevel: 1,
        maxItemLevel: 1
      },
      3: {
        id: "level_3_merchant",
        label: "Level 3 Merchant",
        allowedRarities: ["grey", "blue", "purple"],
        rarityWeights: {
          grey: 0.35,
          blue: 0.45,
          purple: 0.2
        },
        minItemLevel: 1,
        maxItemLevel: 1
      },
      4: {
        id: "level_4_merchant",
        label: "Level 4 Merchant",
        allowedRarities: ["blue", "purple"],
        rarityWeights: {
          blue: 0.6,
          purple: 0.4
        },
        minItemLevel: 1,
        maxItemLevel: 1
      },
      5: {
        id: "level_5_merchant",
        label: "Level 5 Merchant",
        allowedRarities: ["blue", "purple", "gold"],
        rarityWeights: {
          blue: 0.52,
          purple: 0.4,
          gold: 0.08
        },
        minItemLevel: 1,
        maxItemLevel: 1
      }
    },
    classRules: {
      barbarian: {
        allowedItemTypes: ["melee_weapon", "ranged_weapon", "helmet", "chest", "leggings", "boots", "ring", "amulet"],
        varietyBuckets: {
          melee: ["melee_weapon"],
          ranged: ["ranged_weapon"],
          armor: ["helmet", "chest", "leggings", "boots", "ring", "amulet"]
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
        leggings: 13,
        boots: 11,
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
        allowedItemTypes: ["melee_weapon", "ranged_weapon", "helmet", "chest", "leggings", "boots", "ring", "amulet"]
      }
    },
    sources: {
      miniboss: {
        enabled: true,
        minDrops: 1,
        extraDropChances: [],
        rarityWeightsByLevel: {
          1: {
            purple: 0.9,
            gold: 0.1
          }
        },
        allowedItemTypes: ["melee_weapon", "ranged_weapon", "helmet", "chest", "leggings", "boots", "ring", "amulet"],
        maxRarityByLevel: {
          1: "gold"
        }
      },
      finalBoss: {
        enabled: true,
        minDrops: 3,
        extraDropChances: [],
        rarityWeightsByLevel: {
          1: {
            gold: 0.9,
            green: 0.1
          }
        },
        allowedItemTypes: ["melee_weapon", "ranged_weapon", "helmet", "chest", "leggings", "boots", "ring", "amulet"],
        maxRarityByLevel: {
          1: "green"
        }
      }
    },
    weaponScaling: {
      baseDamagePerGameLevel: 5,
      bonusRangesByLevel: {
        1: { min: 2, max: 4 },
        2: { min: 5, max: 8 },
        3: { min: 8, max: 12 }
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
      },
      bossDropGlow: {
        enabled: true,
        minBlur: 10,
        maxBlur: 18,
        pulseSpeed: 5.5
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
      shieldbearer: { mass: 1.1, collisionScale: 0.94 },
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
      spawnRadiusMultiplier: 2,
      minRingRadius: 240,
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

  const TERRAIN_TYPES = [
    {
      id: "rock_cluster",
      label: "Rock Cluster",
      category: "small",
      spritePath: "assets/terrain/rock-cluster.svg",
      minWidth: 28,
      maxWidth: 38,
      minHeight: 24,
      maxHeight: 34
    },
    {
      id: "tree_stump",
      label: "Tree Stump",
      category: "small",
      spritePath: "assets/terrain/tree-stump.svg",
      minWidth: 24,
      maxWidth: 34,
      minHeight: 26,
      maxHeight: 36
    },
    {
      id: "crate_stack",
      label: "Crate Stack",
      category: "small",
      spritePath: "assets/terrain/crate-stack.svg",
      minWidth: 28,
      maxWidth: 40,
      minHeight: 28,
      maxHeight: 40
    },
    {
      id: "broken_pillar",
      label: "Broken Pillar",
      category: "medium",
      spritePath: "assets/terrain/broken-pillar.svg",
      minWidth: 30,
      maxWidth: 42,
      minHeight: 42,
      maxHeight: 62
    },
    {
      id: "bone_pile",
      label: "Bone Pile",
      category: "small",
      spritePath: "assets/terrain/bone-pile.svg",
      minWidth: 30,
      maxWidth: 42,
      minHeight: 22,
      maxHeight: 30
    },
    {
      id: "ruins_debris",
      label: "Ruins Debris",
      category: "medium",
      spritePath: "assets/terrain/ruins-debris.svg",
      minWidth: 34,
      maxWidth: 52,
      minHeight: 28,
      maxHeight: 42
    }
  ];

  const OBSTACLES = {
    enabled: true,
    useSprites: false,
    startWithTerrain: false,
    movementSpawnOnly: true,
    minCount: 8,
    maxCount: 14,
    densityByArena: {
      small: { minCount: 3, maxCount: 6 },
      medium: { minCount: 5, maxCount: 10 },
      large: { minCount: 8, maxCount: 14 }
    },
    arenaAreaThresholds: {
      smallMax: 420000,
      mediumMax: 820000
    },
    guaranteedInViewMin: 4,
    guaranteedInViewMax: 6,
    minVisibleOnScreen: 3,
    movementSpawnIntervalSeconds: 0.18,
    maxDirectionalSpawnPerTick: 2,
    spawnOffscreenBuffer: 24,
    spawnOffscreenBufferJitter: 18,
    maxObstacleCount: 160,
    pruneOffscreenMargin: 260,
    directionalSpawnChance: 0.35,
    minWidth: 26,
    maxWidth: 38,
    minHeight: 44,
    maxHeight: 68,
    verticalBias: 0.58,
    minGap: 14,
    edgePadding: 30,
    minDistanceFromPlayerStart: 95,
    spawnAreaWidthMultiplier: 3.2,
    spawnAreaHeightMultiplier: 3.2,
    playerCollisionPadding: 2,
    enemyCollisionPadding: 1,
    debug: {
      showColliderOutlines: false,
      terrainEnabled: true
    },
    fillColor: "#4f6486",
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

  const CLASS_SKILLS = {
    barbarian: {
      classId: "barbarian",
      title: "Warrior Skills",
      subtitle: "Class-specific combat skills for Barbarian characters.",
      unlockProgressionLabel: "Unlocks from character Level",
      skills: [
        {
          id: "sever_artery",
          name: "Sever Artery",
          type: "passive",
          category: "Damage Over Time",
          classIds: ["barbarian"],
          unlockLegacyLevel: 1,
          description: "Melee hits apply Bleed stacks that tick once per second.",
          baseValues: {
            maxStacks: 3,
            damagePerStack: 5,
            tickSeconds: 1,
            durationSeconds: 4
          },
          scalingValues: {
            maxStacksPerRank: 2,
            damagePerStackPerRank: 2
          },
          currentLevel: 1
        },
        {
          id: "blood_frenzy",
          name: "Blood Frenzy",
          type: "passive_triggered",
          category: "Attack Speed Buff",
          classIds: ["barbarian"],
          unlockLegacyLevel: 1,
          description: "Enemy kills grant a temporary attack speed buff.",
          baseValues: {
            attackSpeedBonusPct: 0.1,
            durationSeconds: 2
          },
          scalingValues: {
            attackSpeedBonusPctPerRank: 0.05,
            durationSecondsPerRank: 1
          },
          currentLevel: 1
        },
        {
          id: "ground_slam",
          name: "Ground Slam",
          type: "active",
          category: "AoE + Crowd Control",
          classIds: ["barbarian"],
          unlockLegacyLevel: 3,
          description: "Slam in a forward cone, damaging and stunning enemies.",
          keybind: "E",
          baseValues: {
            coneDegrees: 45,
            rangeMultiplier: 1.2,
            damageMultiplier: 0.85,
            stunSeconds: 0.5,
            cooldownSeconds: 10
          },
          scalingValues: {
            coneDegreesPerRank: 15,
            stunSecondsPerRank: 0.25
          },
          currentLevel: 1
        },
        {
          id: "war_cry",
          name: "War Cry",
          type: "active",
          category: "AoE Debuff",
          classIds: ["barbarian"],
          unlockLegacyLevel: 5,
          description: "Shout in an area and reduce enemy movement speed.",
          keybind: "R",
          baseValues: {
            radius: 132,
            slowPct: 0.2,
            durationSeconds: 2,
            cooldownSeconds: 14
          },
          scalingValues: {
            radiusPerRank: 18,
            slowPctPerRank: 0.1
          },
          currentLevel: 1
        }
      ]
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
    LEVELS,
    GAME_LEVEL_SCALING,
    DIFFICULTY_MODIFIER,
    ITEM_RARITIES,
    WEAPON_MASTERY,
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
    BOUNTIES,
    WEAPON_CATALOG,
    ITEM_REFERENCE_PANEL,
    WEAPONS: {
      axe: {
        id: "axe",
        label: "Axe",
        baseDamage: 22,
        cooldown: 1.05,
        range: 96,
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
      finalBossTimeSeconds: 600,
      minibossIntervalSeconds: 300,
      baseSpawnRatePerSecond: 1.05,
      baseSpawnPackMin: 1,
      baseSpawnPackMax: 2,
      maxSkillChoicesPerRun: 4,
      healthScalingPerMinute: 0.085,
      damageScalingPerMinute: 0.055,
      inRunXpGainMultiplier: 1.45,
      xpScalingPerMinute: 0.07,
      goldPickupMultiplier: 0.5,
      goldRewardPerSecond: 0.04,
      legacyPerMinute: 6
    },
    SWARM_EVENTS,
    TERRAIN_TYPES,
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
        end: 150,
        spawnRateMultiplier: 1,
        packMin: 1,
        packMax: 2,
        burstChance: 0.08,
        weights: {
          grunt: 0.66,
          runner: 0.24,
          shooter: 0.03,
          shieldbearer: 0.07,
          dasher: 0
        }
      },
      {
        start: 150,
        end: 300,
        spawnRateMultiplier: 1.22,
        packMin: 2,
        packMax: 3,
        burstChance: 0.12,
        weights: {
          grunt: 0.5,
          runner: 0.24,
          shooter: 0.1,
          shieldbearer: 0.08,
          dasher: 0.14
        }
      },
      {
        start: 300,
        end: 450,
        spawnRateMultiplier: 1.45,
        packMin: 2,
        packMax: 4,
        burstChance: 0.15,
        weights: {
          grunt: 0.37,
          runner: 0.23,
          shooter: 0.14,
          shieldbearer: 0.07,
          dasher: 0.19
        }
      },
      {
        start: 450,
        end: 600,
        spawnRateMultiplier: 1.62,
        packMin: 3,
        packMax: 5,
        burstChance: 0.2,
        weights: {
          grunt: 0.32,
          runner: 0.2,
          shooter: 0.18,
          shieldbearer: 0.06,
          dasher: 0.24
        }
      },
      {
        start: 600,
        end: 99999,
        spawnRateMultiplier: 1.78,
        packMin: 3,
        packMax: 6,
        burstChance: 0.24,
        weights: {
          grunt: 0.28,
          runner: 0.18,
          shooter: 0.2,
          shieldbearer: 0.06,
          dasher: 0.28
        }
      }
    ],
    ENEMIES: ENEMY_TYPES,
    UPGRADES: UPGRADE_DEFINITIONS,
    TOTAL_UPGRADE_CAPACITY,
    SKILL_TREES: SKILL_TREE_DEFINITIONS,
    CLASS_SKILLS
  });
})();
