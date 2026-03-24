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

  function toTitle(id) {
    const text = String(id || "").replace(/_/g, " ");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  const UPGRADE_BY_ID = Object.fromEntries(window.RL_DATA.UPGRADES.map((upgrade) => [upgrade.id, upgrade]));

  function createUiController() {
    const dom = {
      homeScreen: byId("homeScreen"),
      gameScreen: byId("gameScreen"),
      createCharacterBtn: byId("createCharacterBtn"),
      startRunBtn: byId("startRunBtn"),
      homeStatus: byId("homeStatus"),
      characterList: byId("characterList"),
      skillTreeEmpty: byId("skillTreeEmpty"),
      skillTreeView: byId("skillTreeView"),
      characterSummary: byId("characterSummary"),
      weaponsTabBtn: byId("weaponsTabBtn"),
      classTabBtn: byId("classTabBtn"),
      skillTreeContent: byId("skillTreeContent"),
      createCharacterModal: byId("createCharacterModal"),
      characterNameInput: byId("characterNameInput"),
      createCharacterError: byId("createCharacterError"),
      saveCharacterBtn: byId("saveCharacterBtn"),
      cancelCharacterBtn: byId("cancelCharacterBtn"),
      levelUpOverlay: byId("levelUpOverlay"),
      levelUpOptions: byId("levelUpOptions"),
      pauseOverlay: byId("pauseOverlay"),
      resumeBtn: byId("resumeBtn"),
      restartBtn: byId("restartBtn"),
      returnHomeBtn: byId("returnHomeBtn"),
      endRunOverlay: byId("endRunOverlay"),
      endRunStats: byId("endRunStats"),
      playAgainBtn: byId("playAgainBtn"),
      endReturnHomeBtn: byId("endReturnHomeBtn"),
      hudName: byId("hudName"),
      hudHp: byId("hudHp"),
      hudLevel: byId("hudLevel"),
      hudGold: byId("hudGold"),
      hudLegacy: byId("hudLegacy"),
      hudTimer: byId("hudTimer"),
      xpFill: byId("xpFill")
    };

    const handlers = {
      onCreateCharacter: null,
      onSelectCharacter: null,
      onStartRun: null,
      onChooseUpgrade: null,
      onSpendClassPoint: null,
      onResume: null,
      onRestart: null,
      onReturnHome: null,
      onPlayAgain: null
    };

    const state = {
      selectedCharacter: null,
      activeSkillTab: "weapons",
      skillTreeProgress: null
    };

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
          `Gold ${character.gold} | Legacy XP ${character.legacyXp} | Best ${formatTime(character.bestSurvivalTime)}`
        );
        const meta3 = createElement(
          "div",
          "char-meta",
          `Runs ${character.runsPlayed} | Minibosses ${character.minibossKills}`
        );

        card.append(name, meta1, meta2, meta3);
        card.addEventListener("click", () => {
          if (handlers.onSelectCharacter) handlers.onSelectCharacter(character.id);
        });
        dom.characterList.appendChild(card);
      });

      dom.startRunBtn.disabled = !selectedCharacterId;
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

    function renderCharacterDetails(character, options) {
      state.selectedCharacter = character || null;
      if (options && options.resetTab) {
        state.activeSkillTab = "weapons";
      }
      state.skillTreeProgress = normalizeSkillTreeProgress(options && options.skillTreeProgress);

      if (!character) {
        dom.characterSummary.innerHTML = "";
        dom.skillTreeContent.innerHTML = "";
        setVisible(dom.skillTreeEmpty, true);
        setVisible(dom.skillTreeView, false);
        return;
      }

      setVisible(dom.skillTreeEmpty, false);
      setVisible(dom.skillTreeView, true);
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
        { label: "Legacy XP", value: String(character.legacyXp) },
        { label: "Legacy Level", value: String(character.legacyLevel || 1) },
        { label: "Class Points", value: String(character.classSkillPoints || 0) },
        { label: "Best Time", value: formatTime(character.bestSurvivalTime || 0) }
      ];

      items.forEach((item) => {
        const cell = createElement("div", "summary-item");
        const label = createElement("strong", "", item.label);
        const value = createElement("span", "", item.value);
        cell.append(label, value);
        dom.characterSummary.appendChild(cell);
      });
    }

    function setActiveSkillTab(tabName) {
      if (!state.selectedCharacter) return;
      state.activeSkillTab = tabName === "class" ? "class" : "weapons";
      dom.weaponsTabBtn.classList.toggle("active", state.activeSkillTab === "weapons");
      dom.classTabBtn.classList.toggle("active", state.activeSkillTab === "class");
      renderSkillTreeTab();
    }

    function renderSkillTreeTab() {
      dom.skillTreeContent.innerHTML = "";
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
            const label = createElement("strong", "", `${path.label}: `);
            const desc = createElement("span", "", path.description);
            const level = createElement("span", "upgrade-level", `${rank}/${path.maxLevel}`);
            node.append(label, desc);
            node.appendChild(level);
            upgrades.appendChild(node);
          });

          if (weapon.ultimate) {
            const ultimateRank = getProgressRank(weapon.ultimate.upgradeId);
            const unlocked = isUltimateUnlocked(weapon.ultimate.upgradeId);
            const ultimateNode = createElement("li", "upgrade-node ultimate-node");
            const label = createElement("strong", "", `${weapon.ultimate.label}: `);
            const desc = createElement("span", "", weapon.ultimate.description);
            const status = createElement("span", "ultimate-status");

            if (ultimateRank > 0) {
              ultimateNode.classList.add("ultimate-complete");
              status.textContent = "Complete";
            } else if (unlocked) {
              ultimateNode.classList.add("ultimate-available");
              status.textContent = "Available";
            } else {
              ultimateNode.classList.add("ultimate-locked");
              status.textContent = "Locked";
            }

            ultimateNode.append(label, desc, status);
            if (!unlocked && ultimateRank <= 0 && weapon.ultimate.requirementText) {
              ultimateNode.appendChild(
                createElement("div", "ultimate-requirement", weapon.ultimate.requirementText)
              );
            }
            upgrades.appendChild(ultimateNode);
          }

          weaponCard.append(weaponName, weaponDesc, upgrades);
          categoryCard.appendChild(weaponCard);
        });

        dom.skillTreeContent.appendChild(categoryCard);
      });
    }

    function parseNodeMaxRank(nodeInfo) {
      if (!nodeInfo) return 1;
      if (typeof nodeInfo.maxRank === "number") return Math.max(1, Math.floor(nodeInfo.maxRank));
      if (typeof nodeInfo.levels === "string") {
        const text = nodeInfo.levels.trim();
        if (text.includes("-")) {
          const rangeParts = text.split("-");
          const maxPart = Number(rangeParts[1]);
          if (!Number.isNaN(maxPart)) return Math.max(1, Math.floor(maxPart));
        }
        if (text.includes("/")) {
          const slashParts = text.split("/");
          const maxPart = Number(slashParts[1]);
          if (!Number.isNaN(maxPart)) return Math.max(1, Math.floor(maxPart));
        }
        const numeric = Number(text);
        if (!Number.isNaN(numeric)) return Math.max(1, Math.floor(numeric));
      }
      return nodeInfo.capstone ? 1 : 5;
    }

    function getClassNodeRank(branchId, nodeId) {
      const ranks = (state.selectedCharacter && state.selectedCharacter.classNodeRanks) || {};
      return Number(ranks[`${branchId}.${nodeId}`] || 0);
    }

    function getBranchSpentPoints(branch) {
      return (branch.nodes || []).reduce((sum, nodeInfo) => {
        return sum + getClassNodeRank(branch.id, nodeInfo.id);
      }, 0);
    }

    function isClassNodeSpendable(branch, nodeInfo, nodeIndex) {
      const character = state.selectedCharacter;
      if (!character) return false;
      if ((character.classSkillPoints || 0) <= 0) return false;

      const currentRank = getClassNodeRank(branch.id, nodeInfo.id);
      const maxRank = parseNodeMaxRank(nodeInfo);
      if (currentRank >= maxRank) return false;

      if (nodeIndex > 0) {
        const previousNode = branch.nodes[nodeIndex - 1];
        if (getClassNodeRank(branch.id, previousNode.id) <= 0) return false;
      }

      if (nodeInfo.capstone) {
        const branchSpent = getBranchSpentPoints(branch);
        const needed = nodeInfo.branchPointsRequired || 15;
        if (branchSpent < needed) return false;
      }

      return true;
    }

    function renderClassTab(classDefinition) {
      if (!classDefinition) return;
      const title = createElement("div", "skill-title", classDefinition.title);
      const subtitle = createElement("div", "skill-subtitle", classDefinition.subtitle);

      const panel = createElement("div", "class-placeholder");
      const pointsBar = createElement("div", "class-points-bar");
      pointsBar.appendChild(
        createElement(
          "div",
          "class-points-primary",
          `Unspent Class Points: ${(state.selectedCharacter && state.selectedCharacter.classSkillPoints) || 0}`
        )
      );
      pointsBar.appendChild(
        createElement(
          "div",
          "class-points-secondary",
          `Legacy Level ${(state.selectedCharacter && state.selectedCharacter.legacyLevel) || 1}`
        )
      );
      panel.appendChild(pointsBar);

      const introList = Array.isArray(classDefinition.philosophy) ? classDefinition.philosophy : classDefinition.flavor;
      if (Array.isArray(introList)) {
        introList.forEach((line) => {
          panel.appendChild(createElement("p", "class-flavor", line));
        });
      }

      if (classDefinition.coreMechanic) {
        const mechanic = createElement("div", "class-mechanic");
        mechanic.appendChild(createElement("div", "class-mechanic-title", classDefinition.coreMechanic.title));

        if (Array.isArray(classDefinition.coreMechanic.buildsFrom)) {
          const buildsFrom = createElement(
            "div",
            "class-mechanic-line",
            `Builds from: ${classDefinition.coreMechanic.buildsFrom.join(", ")}`
          );
          mechanic.appendChild(buildsFrom);
        }

        if (Array.isArray(classDefinition.coreMechanic.effects)) {
          const effects = createElement(
            "div",
            "class-mechanic-line",
            `Base effects: ${classDefinition.coreMechanic.effects.join(" | ")}`
          );
          mechanic.appendChild(effects);
        }
        panel.appendChild(mechanic);
      }

      if (Array.isArray(classDefinition.branches) && classDefinition.branches.length) {
        const branchGrid = createElement("div", "class-branch-grid");
        classDefinition.branches.forEach((branch) => {
          const branchCard = createElement("section", "class-branch-card");
          branchCard.appendChild(createElement("div", "class-branch-title", branch.label));
          branchCard.appendChild(createElement("div", "class-branch-focus", branch.focus || ""));

          const nodes = createElement("ul", "class-node-list");
          (branch.nodes || []).forEach((nodeInfo, nodeIndex) => {
            const node = createElement("li", "class-node");
            if (nodeInfo.capstone) node.classList.add("class-node-capstone");

            const currentRank = getClassNodeRank(branch.id, nodeInfo.id);
            const maxRank = parseNodeMaxRank(nodeInfo);
            const isMaxed = currentRank >= maxRank;
            const isSpendable = isClassNodeSpendable(branch, nodeInfo, nodeIndex);

            const nodeTitle = createElement("div", "class-node-title");
            nodeTitle.appendChild(createElement("strong", "", nodeInfo.label));
            nodeTitle.appendChild(createElement("span", "class-node-levels", `${currentRank}/${maxRank}`));
            node.appendChild(nodeTitle);
            node.appendChild(createElement("div", "class-node-desc", nodeInfo.description));

            const nodeStatus = createElement("div", "class-node-status");
            if (isMaxed) {
              node.classList.add("class-node-maxed");
              nodeStatus.textContent = "Maxed";
            } else if (isSpendable) {
              node.classList.add("class-node-spendable");
              nodeStatus.textContent = "Available - click to spend 1 point";
            } else {
              node.classList.add("class-node-locked");
              nodeStatus.textContent = "Locked";
            }
            node.appendChild(nodeStatus);

            if (nodeInfo.requirement) {
              node.appendChild(createElement("div", "class-node-req", `Requirement: ${nodeInfo.requirement}`));
            }

            if (isSpendable && handlers.onSpendClassPoint) {
              node.addEventListener("click", () => {
                handlers.onSpendClassPoint(branch.id, nodeInfo.id);
              });
            }
            nodes.appendChild(node);
          });

          branchCard.appendChild(nodes);
          branchGrid.appendChild(branchCard);
        });
        panel.appendChild(branchGrid);
      } else if (Array.isArray(classDefinition.placeholders)) {
        const fallback = createElement("ul", "class-points");
        classDefinition.placeholders.forEach((point) => {
          fallback.appendChild(createElement("li", "", point));
        });
        panel.appendChild(fallback);
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

    function setHomeStatus(text) {
      dom.homeStatus.textContent = text;
    }

    function showHomeScreen() {
      setVisible(dom.homeScreen, true);
      setVisible(dom.gameScreen, false);
      setVisible(dom.levelUpOverlay, false);
      setVisible(dom.pauseOverlay, false);
      setVisible(dom.endRunOverlay, false);
    }

    function showGameScreen() {
      setVisible(dom.homeScreen, false);
      setVisible(dom.gameScreen, true);
      setVisible(dom.levelUpOverlay, false);
      setVisible(dom.pauseOverlay, false);
      setVisible(dom.endRunOverlay, false);
    }

    function updateHud(hud) {
      dom.hudName.textContent = hud.name || "-";
      dom.hudHp.textContent = `HP: ${Math.max(0, Math.ceil(hud.hp || 0))}/${Math.ceil(hud.maxHp || 0)}`;
      dom.hudLevel.textContent = `Level: ${hud.level || 1}`;
      dom.hudGold.textContent = `Gold: ${hud.gold || 0}`;
      dom.hudLegacy.textContent = `Legacy XP: ${hud.legacy || 0}`;
      dom.hudTimer.textContent = formatTime(hud.time || 0);
      const xpProgress = Math.max(0, Math.min(1, hud.xpProgress || 0));
      dom.xpFill.style.width = `${(xpProgress * 100).toFixed(2)}%`;
    }

    function showLevelUp(options) {
      dom.levelUpOptions.innerHTML = "";
      options.forEach((option) => {
        const button = createElement("button", "upgrade-option");
        button.type = "button";
        const name = createElement("div", "upgrade-name", option.title);
        const desc = createElement("div", "upgrade-desc", option.description);
        button.append(name, desc);
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
        `Time survived: ${formatTime(summary.timeSurvived)}`,
        `Enemies defeated: ${summary.enemiesKilled}`,
        `Gold earned: ${summary.goldEarned}`,
        `Legacy XP earned: ${summary.legacyXpEarned}`,
        `Minibosses defeated: ${summary.minibossesDefeated}`,
        `Final boss appeared: ${summary.finalBossAppeared ? "Yes" : "No"}`,
        `Final boss defeated: ${summary.finalBossDefeated ? "Yes" : "No"}`
      ];
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
