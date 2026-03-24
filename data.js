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
      speed: 76,
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
      title: "Long Flight",
      description: "Increase projectile speed and targeting range.",
      maxRank: 5,
      weight: 0.9
    },
    {
      id: "javelin_piercing_volley",
      type: "ultimate",
      weaponId: "javelin",
      title: "Piercing Volley",
      description: "Javelins pierce through enemies and complete ranged evolution.",
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
                    label: "Long Flight",
                    maxLevel: 5,
                    description: "Improves projectile speed and targeting range."
                  }
                ],
                ultimate: {
                  upgradeId: "javelin_piercing_volley",
                  label: "Piercing Volley",
                  description: "Javelins pass through additional enemies.",
                  requirementText: "Requires both paths at max level"
                }
              }
            ]
          }
        ]
      },
      classTree: {
        title: "Barbarian Skill Tree",
        subtitle: "Concept draft: branching class progression powered by Legacy XP (future system)",
        philosophy: [
          "Aggressive, momentum-driven combat identity with risk-reward escalation.",
          "The longer the fight lasts, the stronger the Barbarian becomes.",
          "Class progression enhances combat style without replacing weapon progression."
        ],
        coreMechanic: {
          title: "Core Mechanic: Rage Meter",
          buildsFrom: ["Kills", "Successful hits"],
          effects: ["Increased player size", "Increased attack radius", "Increased damage"]
        },
        branches: [
          {
            id: "ferocity",
            label: "Ferocity (Offense)",
            focus: "Damage scaling, rage uptime, kill momentum, and area pressure.",
            nodes: [
              {
                id: "blood_rush",
                label: "Blood Rush",
                levels: "1-5",
                description: "Gain Rage faster from kills."
              },
              {
                id: "overflowing_rage",
                label: "Overflowing Rage",
                levels: "1-5",
                description: "Rage meter can exceed 100%, extending Rage windows."
              },
              {
                id: "savage_reach",
                label: "Savage Reach",
                levels: "1-5",
                description: "Increase attack radius during Rage."
              },
              {
                id: "giants_presence",
                label: "Giant's Presence",
                levels: "1-5",
                description: "Increase size during Rage and apply slight contact knockback."
              },
              {
                id: "brutal_momentum",
                label: "Brutal Momentum",
                levels: "1-5",
                description: "Kills grant temporary stacking damage that decays over time."
              },
              {
                id: "relentless_strikes",
                label: "Relentless Strikes",
                levels: "1-5",
                description: "Increase attack speed while in Rage."
              },
              {
                id: "blood_explosion",
                label: "Blood Explosion",
                levels: "1-5",
                description: "Enemies explode on death during Rage for small AoE damage."
              },
              {
                id: "apex_rage",
                label: "Apex Rage",
                levels: "1/1",
                capstone: true,
                requirement: "Requires prior Ferocity investment",
                description: "Massive Rage spike with circular amplification and heavy damage boost."
              }
            ]
          },
          {
            id: "survivor",
            label: "Survivor (Defense)",
            focus: "Durability, sustain, mitigation, and long-fight stability.",
            nodes: [
              {
                id: "thick_hide",
                label: "Thick Hide",
                levels: "1-5",
                description: "Gain flat damage reduction."
              },
              {
                id: "vitality",
                label: "Vitality",
                levels: "1-5",
                description: "Increase max health."
              },
              {
                id: "war_recovery",
                label: "War Recovery",
                levels: "1-5",
                description: "Recover a small amount of health on kill."
              },
              {
                id: "last_stand",
                label: "Last Stand",
                levels: "1-5",
                description: "Gain stronger mitigation while at low HP."
              },
              {
                id: "iron_will",
                label: "Iron Will",
                levels: "1-5",
                description: "Reduce hit recovery and control-loss pressure."
              },
              {
                id: "battle_hardened",
                label: "Battle Hardened",
                levels: "1-5",
                description: "Gain stacking armor while taking repeated hits."
              },
              {
                id: "unyielding",
                label: "Unyielding",
                levels: "1-5",
                description: "Chance to ignore fatal damage with cooldown gating."
              },
              {
                id: "immortal_rage",
                label: "Immortal Rage",
                levels: "1/1",
                capstone: true,
                requirement: "Requires prior Survivor investment",
                description: "While enraged, Rage drains instead of HP when taking lethal damage."
              }
            ]
          },
          {
            id: "instinct",
            label: "Instinct (Utility / Hybrid)",
            focus: "Mobility, awareness, combat flow, and offense-defense bridge tools.",
            nodes: [
              {
                id: "predator_sense",
                label: "Predator Sense",
                levels: "1-5",
                description: "Improve nearest-target awareness and threat tracking feel."
              },
              {
                id: "hunters_step",
                label: "Hunter's Step",
                levels: "1-5",
                description: "Increase movement speed."
              },
              {
                id: "battle_flow",
                label: "Battle Flow",
                levels: "1-5",
                description: "Kills grant slight temporary cooldown reduction."
              },
              {
                id: "adrenaline",
                label: "Adrenaline",
                levels: "1-5",
                description: "Taking damage grants a short speed burst."
              },
              {
                id: "war_magnetism",
                label: "War Magnetism",
                levels: "1-5",
                description: "Increase pickup radius for XP and gold."
              },
              {
                id: "tactical_rage",
                label: "Tactical Rage",
                levels: "1-5",
                description: "Rage also increases movement speed."
              },
              {
                id: "combat_rhythm",
                label: "Combat Rhythm",
                levels: "1-5",
                description: "Sustained alternating attacks increase effectiveness."
              },
              {
                id: "primal_instinct",
                label: "Primal Instinct",
                levels: "1/1",
                capstone: true,
                requirement: "Requires prior Instinct investment",
                description: "Automatically trigger Rage at low HP with a brief reaction window."
              }
            ]
          }
        ],
        buildIdentityExamples: [
          "Aggressive build: Ferocity-heavy, high Rage uptime, explosive but risky.",
          "Tank build: Survivor-heavy, durable and stable over long fights.",
          "Hybrid build: Instinct + Ferocity mix for mobility and consistent pressure."
        ],
        notes: [
          "Prototype supports spending class skill points from Legacy levels in menu UI.",
          "Node effects are preview-only for now and do not modify combat yet."
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
        startingWeapons: ["axe", "javelin"]
      }
    },
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
        pierce: 0
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
      goldRewardPerSecond: 0.06,
      legacyPerMinute: 6
    },
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
          grunt: 0.68,
          runner: 0.26,
          shooter: 0.06,
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
          grunt: 0.49,
          runner: 0.24,
          shooter: 0.18,
          dasher: 0.09
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
          grunt: 0.34,
          runner: 0.24,
          shooter: 0.24,
          dasher: 0.18
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
          grunt: 0.28,
          runner: 0.2,
          shooter: 0.3,
          dasher: 0.22
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
          grunt: 0.24,
          runner: 0.18,
          shooter: 0.34,
          dasher: 0.24
        }
      }
    ],
    ENEMIES: ENEMY_TYPES,
    UPGRADES: UPGRADE_DEFINITIONS,
    TOTAL_UPGRADE_CAPACITY,
    SKILL_TREES: SKILL_TREE_DEFINITIONS
  });
})();
