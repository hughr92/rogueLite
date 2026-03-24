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
      this.currentRun = null;
      this.previousTime = performance.now();
      this.entityIds = 1;

      this.input = {
        keys: { KeyW: false, KeyA: false, KeyS: false, KeyD: false },
        mouseX: 0,
        mouseY: 0
      };

      this.boundLoop = this.loop.bind(this);
      this.boundResize = this.handleResize.bind(this);
    }

    init() {
      this.ui.init({
        onCreateCharacter: (name) => this.handleCreateCharacter(name),
        onSelectCharacter: (id) => this.handleSelectCharacter(id),
        onStartRun: () => this.startRunFromSelection(),
        onChooseUpgrade: (upgradeId) => this.chooseUpgrade(upgradeId),
        onSpendClassPoint: (branchId, nodeId) => this.handleSpendClassPoint(branchId, nodeId),
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
        const player = this.currentRun.player;
        player.x = clamp(player.x, player.radius, width - player.radius);
        player.y = clamp(player.y, player.radius, height - player.radius);
      }
    }

    refreshCharacters(initialLoad) {
      this.characters = SAVE.listCharacters();
      if (!this.characters.length) {
        this.selectedCharacterId = null;
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
        this.ui.renderCharacterDetails(selected, { resetTab: true });
        const best = formatTime(selected.bestSurvivalTime || 0);
        const message = initialLoad
          ? `Selected ${selected.name}. Best survival: ${best}.`
          : `${selected.name} ready. Gold ${selected.gold}, Legacy XP ${selected.legacyXp}.`;
        this.ui.setHomeStatus(message);
      }
      this.ui.showHomeScreen();
    }

    getSelectedCharacter() {
      return this.characters.find((character) => character.id === this.selectedCharacterId) || null;
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
        this.ui.renderCharacterDetails(selected, { resetTab: true });
        this.ui.setHomeStatus(`Selected ${selected.name}. Press Start Run when ready.`);
      }
    }

    handleSpendClassPoint(branchId, nodeId) {
      const selected = this.getSelectedCharacter();
      if (!selected) return;

      const spendResult = SAVE.spendClassSkillPoint(selected.id, branchId, nodeId);
      if (!spendResult || !spendResult.ok) {
        this.ui.setHomeStatus((spendResult && spendResult.error) || "Could not spend class skill point.");
        return;
      }

      this.characters = SAVE.listCharacters();
      const updated = this.getSelectedCharacter();
      this.ui.renderCharacterList(this.characters, this.selectedCharacterId);
      if (updated) {
        this.ui.renderCharacterDetails(updated, { resetTab: false });
        this.ui.setHomeStatus(
          `${updated.name} is Legacy Lv.${updated.legacyLevel} with ${updated.classSkillPoints} class points remaining.`
        );
      }
    }

    createRunState(character) {
      const axeData = DATA.WEAPONS.axe;
      const javelinData = DATA.WEAPONS.javelin;
      const playerBase = DATA.PLAYER_BASE;
      const width = Math.max(1, this.canvas.clientWidth);
      const height = Math.max(1, this.canvas.clientHeight);

      const runState = {
        characterId: character.id,
        characterName: character.name,
        classId: character.classId,
        world: { width, height },
        time: 0,
        ended: false,
        pauseReason: null,
        reasonEnded: null,
        player: {
          x: width * 0.5,
          y: height * 0.5,
          radius: playerBase.radius,
          moveSpeed: playerBase.moveSpeed,
          maxHp: playerBase.maxHp,
          hp: playerBase.maxHp,
          invulnTimer: 0,
          pickupRadius: playerBase.pickupRadius,
          facing: 0,
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
            damage: javelinData.baseDamage,
            cooldown: javelinData.cooldown,
            cooldownLeft: 0.5,
            speed: javelinData.speed,
            range: javelinData.range,
            radius: javelinData.radius,
            lifetime: javelinData.lifetime,
            count: javelinData.count,
            pierce: javelinData.pierce,
            piercingVolleyActive: false
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
          finalBossSpawned: false
        },
        entities: {
          enemies: [],
          playerProjectiles: [],
          enemyProjectiles: [],
          pickups: [],
          attackEffects: []
        },
        stats: {
          enemiesKilled: 0,
          goldEarned: 0,
          legacyXpEarned: 0,
          minibossesDefeated: 0,
          finalBossAppeared: false,
          finalBossDefeated: false
        }
      };
      this.recalculateWeaponStats(runState);
      return runState;
    }

    startRunFromSelection() {
      const character = this.getSelectedCharacter();
      if (!character) {
        this.ui.setHomeStatus("Select a character first.");
        return;
      }
      this.currentRun = this.createRunState(character);
      this.ui.showGameScreen();
      this.ui.hidePause();
      this.ui.hideLevelUp();
      this.ui.hideEndRun();
      this.handleResize();
    }

    restartRun() {
      if (!this.currentRun) return;
      const character = SAVE.getCharacter(this.currentRun.characterId);
      if (!character) return;
      this.currentRun = this.createRunState(character);
      this.ui.showGameScreen();
      this.ui.hidePause();
      this.ui.hideLevelUp();
      this.ui.hideEndRun();
      this.handleResize();
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

      this.updatePlayerFacing();
      this.updatePlayerMovement(dt);
      this.updatePlayerInvulnerability(dt);
      this.updateAxe(dt);
      this.updateJavelin(dt);
      this.updateSpawns(dt);
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
      const axisX = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
      const axisY = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);

      let moveX = axisX;
      let moveY = axisY;
      if (moveX !== 0 || moveY !== 0) {
        const normalized = normalizeVector(moveX, moveY);
        moveX = normalized.x;
        moveY = normalized.y;
      }

      player.x += moveX * player.moveSpeed * dt;
      player.y += moveY * player.moveSpeed * dt;
      player.x = clamp(player.x, player.radius, run.world.width - player.radius);
      player.y = clamp(player.y, player.radius, run.world.height - player.radius);
    }

    updatePlayerInvulnerability(dt) {
      const player = this.currentRun.player;
      if (player.invulnTimer > 0) {
        player.invulnTimer = Math.max(0, player.invulnTimer - dt);
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
          hitMap: {}
        });
      }
    }

    updateSpawns(dt) {
      const run = this.currentRun;
      const phase = getSpawnTableForTime(run.time);
      const minute = run.time / 60;
      const spawnRate = DATA.RUN.baseSpawnRatePerSecond * phase.spawnRateMultiplier * (1 + minute * 0.04);
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

      const enemy = {
        id: this.nextEntityId(),
        typeId: definition.id,
        behavior: definition.behavior,
        color: definition.color,
        x,
        y,
        radius: definition.radius,
        maxHp: Math.floor(definition.hp * healthScale),
        hp: Math.floor(definition.hp * healthScale),
        damage: Math.ceil(definition.damage * damageScale),
        speed: definition.speed,
        xpDrop: definition.xpDrop,
        goldChance: definition.goldChance,
        goldDrop: definition.goldDrop,
        shotTimer: randRange(0.3, definition.shotCooldown || 0.8),
        contactTimer: 0,
        dashCooldownLeft: randRange(0.2, definition.dashCooldown || 2),
        dashTimeLeft: 0,
        dashDirX: 0,
        dashDirY: 0,
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

        if (enemy.behavior === "chaser" || enemy.behavior === "fast") {
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

        if (distance <= enemy.radius + player.radius && enemy.contactTimer <= 0) {
          enemy.contactTimer = 0.55;
          this.damagePlayer(enemy.damage);
        }
      });

      run.entities.enemies = enemies.filter((enemy) => !enemy.dead);
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
      const kept = [];

      run.entities.pickups.forEach((pickup) => {
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const pullRange = player.pickupRadius * 2.1;
        if (distance <= pullRange) {
          const strength = clamp(1 - distance / pullRange, 0, 1);
          pickup.x += (dx / distance) * (40 + 200 * strength) * dt;
          pickup.y += (dy / distance) * (40 + 200 * strength) * dt;
        }

        if (distance <= player.pickupRadius + pickup.radius) {
          if (pickup.type === "xp") {
            this.gainXp(pickup.value);
          } else if (pickup.type === "gold") {
            run.stats.goldEarned += pickup.value;
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

    recalculateWeaponStats(run) {
      const player = run.player;
      const genericDamageRank = this.getUpgradeRankForRun(run, "generic_damage");
      const genericCooldownRank = this.getUpgradeRankForRun(run, "generic_cooldown");
      const damageMultiplier = 1 + genericDamageRank * 0.11;
      const cooldownMultiplier = Math.max(0.55, 1 - genericCooldownRank * 0.06);

      const axeArcRank = this.getUpgradeRankForRun(run, "axe_widen_arc");
      const axeTwinRank = this.getUpgradeRankForRun(run, "axe_twin_swing");
      const axeWhirlwind = this.getUpgradeRankForRun(run, "axe_whirlwind") > 0;

      player.axe.damage = player.axe.baseDamage * damageMultiplier * (axeWhirlwind ? 1.2 : 1);
      player.axe.cooldown = Math.max(0.14, player.axe.baseCooldown * cooldownMultiplier);
      player.axe.range = player.axe.baseRange * (1 + axeArcRank * 0.08 + (axeWhirlwind ? 0.12 : 0));
      player.axe.arcRadians = axeWhirlwind
        ? Math.PI * 2
        : Math.min(Math.PI * 1.9, player.axe.baseArcRadians * (1 + axeArcRank * 0.17));
      player.axe.extraSwings = axeTwinRank;
      player.axe.whirlwindActive = axeWhirlwind;

      const javelinVolleyRank = this.getUpgradeRankForRun(run, "javelin_volley");
      const javelinLongFlightRank = this.getUpgradeRankForRun(run, "javelin_long_flight");
      const javelinUltimate = this.getUpgradeRankForRun(run, "javelin_piercing_volley") > 0;

      player.javelin.damage = player.javelin.baseDamage * damageMultiplier * (javelinUltimate ? 1.12 : 1);
      player.javelin.cooldown = Math.max(0.1, player.javelin.baseCooldown * cooldownMultiplier);
      player.javelin.speed = player.javelin.baseSpeed * (1 + javelinLongFlightRank * 0.12);
      player.javelin.range =
        player.javelin.baseRange * (1 + javelinLongFlightRank * 0.1 + (javelinUltimate ? 0.18 : 0));
      player.javelin.count = player.javelin.baseCount + javelinVolleyRank + (javelinUltimate ? 1 : 0);
      player.javelin.pierce = player.javelin.basePierce + (javelinUltimate ? 3 : 0);
      player.javelin.piercingVolleyActive = javelinUltimate;
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
      player.hp -= amount;
      player.invulnTimer = DATA.PLAYER_BASE.invulnDuration;
      if (player.hp <= 0) {
        player.hp = 0;
      }
    }

    damageEnemy(enemy, amount) {
      if (enemy.dead) return;
      enemy.hp -= amount;
      if (enemy.hp > 0) return;
      enemy.dead = true;
      this.onEnemyKilled(enemy);
    }

    onEnemyKilled(enemy) {
      const run = this.currentRun;
      run.stats.enemiesKilled += 1;

      this.spawnPickup(enemy.x, enemy.y, "xp", enemy.xpDrop);
      if (Math.random() <= enemy.goldChance) {
        this.spawnPickup(enemy.x + randRange(-8, 8), enemy.y + randRange(-8, 8), "gold", enemy.goldDrop);
      }

      if (enemy.typeId === "miniboss") {
        run.stats.minibossesDefeated += 1;
        run.stats.legacyXpEarned += DATA.ENEMIES.miniboss.legacyReward;
        this.spawnPickup(enemy.x, enemy.y, "xp", enemy.xpDrop * 0.75);
        this.spawnPickup(enemy.x + 14, enemy.y - 12, "gold", Math.floor(enemy.goldDrop * 0.6));
      }

      if (enemy.typeId === "finalBoss") {
        run.stats.finalBossDefeated = true;
        run.stats.legacyXpEarned += DATA.ENEMIES.finalBoss.legacyReward;
        this.spawnPickup(enemy.x, enemy.y, "gold", enemy.goldDrop);
        this.finishRun("victory");
      }
    }

    spawnPickup(x, y, type, value) {
      this.currentRun.entities.pickups.push({
        id: this.nextEntityId(),
        x,
        y,
        radius: type === "xp" ? 5 : 6,
        type,
        value: Math.max(1, Math.floor(value))
      });
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
        timeSurvived: Math.floor(run.time),
        enemiesKilled: run.stats.enemiesKilled,
        goldEarned: run.stats.goldEarned,
        legacyXpEarned: run.stats.legacyXpEarned,
        minibossesDefeated: run.stats.minibossesDefeated,
        finalBossAppeared: run.stats.finalBossAppeared,
        finalBossDefeated: run.stats.finalBossDefeated
      };

      SAVE.applyRunRewards(run.characterId, summary);
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
      this.drawPickups();
      this.drawPlayerProjectiles();
      this.drawEnemyProjectiles();
      this.drawEnemies();
      this.drawPlayer();
      this.drawAttackEffects();
      this.drawTopTimers();
    }

    drawBackgroundGrid(width, height) {
      const ctx = this.ctx;
      ctx.fillStyle = "#10151d";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(55, 70, 95, 0.28)";
      ctx.lineWidth = 1;
      const spacing = 48;
      const offsetX = ((this.currentRun.time * 8) % spacing + spacing) % spacing;
      const offsetY = ((this.currentRun.time * 5) % spacing + spacing) % spacing;

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
      this.currentRun.entities.pickups.forEach((pickup) => {
        ctx.fillStyle = pickup.type === "xp" ? "#66c4ff" : "#f4c542";
        ctx.beginPath();
        ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
        ctx.fill();
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
      ctx.fillStyle = "rgba(11, 14, 21, 0.72)";
      ctx.fillRect(run.world.width - 236, 10, 226, 56);
      ctx.fillStyle = "#dde5f5";
      ctx.font = "12px Trebuchet MS, sans-serif";
      ctx.fillText(`Next miniboss: ${formatTime(timeUntilMiniboss)}`, run.world.width - 224, 31);
      ctx.fillText(`Final boss: ${formatTime(finalBossIn)}`, run.world.width - 224, 50);
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
