(function () {
  "use strict";

  const STORAGE_KEY = "rl_skill_prompter_state_v1";
  const EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
  const OUTPUT_SIZE_OPTIONS = Object.freeze(["64x64", "96x96", "128x128", "160x160", "200x200"]);
  const DEFAULT_OUTPUT_SIZE = "128x128";
  const OUTPUT_ASPECT_RATIO_OPTIONS = Object.freeze(["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"]);
  const WEAPON_FOLDER_CANDIDATES = Object.freeze({
    axe: ["axe"],
    sword: ["sword"],
    hammer: ["hammer", "shield"],
    javelin: ["javelin"],
    slingshot: ["slingshot", "bow"],
    bow: ["bow"],
    shield: ["shield"]
  });
  const SKILL_ICON_PATH_HINTS_BY_ID = Object.freeze({
    ground_slam: "assets/skills/class/barbarian/ground_slam.png",
    twin_swing: "assets/skills/class/barbarian/twin_swing.png",
    blood_frenzy: "assets/skills/class/barbarian/blood_frenzy.png",
    war_cry: "assets/skills/class/barbarian/war_cry.png",
    berserk: "assets/skills/class/barbarian/berserk.png",
    sever_artery: "assets/skills/class/barbarian/sever_artery.jpg",
    generic_damage: "assets/skills/general/damage_increase.png",
    generic_cooldown: "assets/skills/general/cooldown_reduction.png",
    damage_increase: "assets/skills/general/damage_increase.png",
    cooldown_reduction: "assets/skills/general/cooldown_reduction.png",
    damage_reduction: "assets/skills/general/damage_increase.png",
    axe_widen_arc: "assets/skills/weapon/axe/cleave.png",
    axe_twin_swing: "assets/skills/class/barbarian/twin_swing.png",
    axe_whirlwind: "assets/skills/weapon/axe/whirlwind.png",
    javelin_volley: "assets/skills/weapon/javelin/volley.jpg",
    javelin_long_flight: "assets/skills/weapon/javelin/piercing_throw.png",
    javelin_piercing_volley: "assets/skills/weapon/javelin/explosive_vollery.jpg",
    sword_flurry_strikes: "assets/skills/weapon/sword/twin_slash.png",
    sword_hemorrhage_edge: "assets/skills/class/barbarian/sever_artery.jpg",
    sword_bladestorm_oath: "assets/skills/weapon/sword/twin_slash.png",
    hammer_crushing_impact: "assets/skills/weapon/shield/shield_bash.png",
    hammer_seismic_pulse: "assets/skills/weapon/shield/fortify.png",
    hammer_worldbreaker: "assets/skills/weapon/shield/shield_bash.png",
    slingshot_rapid_pebbles: "assets/skills/weapon/bow/rapid_pebbles.jpg",
    slingshot_shatterstone: "assets/skills/weapon/bow/shatterstone.jpg",
    slingshot_meteor_barrage: "assets/skills/weapon/bow/barrage.jpg"
  });
  const BASE_CLASS_FLAVOR_PROFILES = Object.freeze({
    none: Object.freeze({
      id: "none",
      label: "No Class",
      parentPrompt: "",
      defaultColorTheme: "",
      defaultPalette: [],
      consistencyTags: []
    }),
    barbarian: Object.freeze({
      id: "barbarian",
      label: "Barbarian",
      parentPrompt:
        "barbarian class identity, primal brutality, heavy impact silhouettes, rugged steel and worn leather motifs",
      defaultColorTheme: "ember orange, blood red accents, weathered steel neutrals",
      defaultPalette: ["#b44527", "#8d2e1e", "#f1872d", "#4d4f58", "#2b2d34"],
      consistencyTags: [
        "class-consistent palette",
        "bold readable forms",
        "aggressive dark fantasy tone"
      ]
    }),
    ranger: Object.freeze({
      id: "ranger",
      label: "Ranger",
      parentPrompt:
        "ranger class identity, swift precision, natural survival motifs, leather and wood gear language",
      defaultColorTheme: "forest greens, bark browns, muted moss accents",
      defaultPalette: ["#2f5f38", "#4b6b3d", "#6f7e46", "#5a4630", "#2e2d24"],
      consistencyTags: ["clean silhouettes", "nature-toned readability", "grounded fantasy look"]
    }),
    monk: Object.freeze({
      id: "monk",
      label: "Monk",
      parentPrompt:
        "monk class identity, disciplined martial flow, sacred balance motifs, elegant restrained energy",
      defaultColorTheme: "soft gold, ivory white, warm bronze accents",
      defaultPalette: ["#d1b469", "#f0e3c2", "#b8904c", "#6f5a3f", "#312a20"],
      consistencyTags: ["refined forms", "clean icon rhythm", "harmonious highlights"]
    }),
    necromancer: Object.freeze({
      id: "necromancer",
      label: "Necromancer",
      parentPrompt:
        "necromancer class identity, death magic motifs, corrupted arcane symbols, eerie ritual intensity",
      defaultColorTheme: "sickly green, deep violet, shadow-black undertones",
      defaultPalette: ["#6e3e8a", "#3f214f", "#7ea86a", "#3f5f3f", "#1f1b24"],
      consistencyTags: ["grim fantasy contrast", "ominous readability", "arcane corruption language"]
    }),
    weapon: Object.freeze({
      id: "weapon",
      label: "Weapon",
      parentPrompt:
        "weapon-class identity, neutral combat utility, forged metal clarity, practical combat silhouettes",
      defaultColorTheme: "steel gray, iron black, worn leather neutrals",
      defaultPalette: ["#7e8794", "#4f5560", "#2a2f37", "#7a6045", "#a7b0ba"],
      consistencyTags: ["neutral utility style", "high readability", "metal-centric visual language"]
    })
  });
  const BUILT_IN_SCOPE_PROMPTS = Object.freeze({
    weapon:
      "weapon-skill icon treatment, clear focal point, stylized energy trails, controlled particle accents, small-size readability"
  });
  const BUILT_IN_SCOPE_STYLE_TAGS = Object.freeze({
    class: Object.freeze([]),
    weapon: Object.freeze(["weapon", "fx", "clarity"])
  });

  const state = {
    classFlavorProfiles: [],
    builder: {
      globalRules: "",
      globalExclusions: "",
      globalArtistInfluence: "",
      subjectImageReference: "",
      subjectPaletteSwatches: [],
      subject: "",
      classTheme: "",
      colorTheme: "",
      classExclusions: "",
      classFlavorId: "barbarian",
      classFlavor: "barbarian",
      classPaletteByClass: {},
      paletteInfluencePct: 60,
      styleTags: "",
      outputSize: DEFAULT_OUTPUT_SIZE,
      outputAspectRatio: "1:1",
      outputStandardizationEnabled: true
    },
    skills: [],
    selectedSkillId: "",
    skillSearchTerm: "",
    promptLinkSkillSearchTerm: "",
    promptLinkSkillId: "",
    assetStatusBySkillId: {},
    importedFileMap: new Map(),
    importedObjectUrls: [],
    imageProbeCache: new Map(),
    activeAuditRunId: 0,
    selectedSubjectPaletteSwatchIndex: -1,
    selectedClassPaletteSwatchIndexByClass: {},
    classPaletteUndoStackByClass: {}
  };

  const dom = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheDom();
    hydrateState();
    initializeSkillEntryAccordion();
    bindEvents();
    renderClassFlavorOptions();
    syncBuilderInputs();
    updateFinalPromptOutput();
    renderSkillList();
    renderPromptLinkSkillOptions();
    syncSkillEditor();
    refreshAssetAudit();
  }

  function cacheDom() {
    dom.skillEntryPanel = byId("skillEntryPanel");
    dom.skillEntryHeader = byId("skillEntryHeader");
    dom.skillEntryContent = byId("skillEntryContent");
    dom.skillEntryChevron = byId("skillEntryChevron");
    dom.globalRulesInput = byId("globalRulesInput");
    dom.globalExclusionsInput = byId("globalExclusionsInput");
    dom.globalArtistInfluenceInput = byId("globalArtistInfluenceInput");
    dom.globalOutputSizeSelect = byId("globalOutputSizeSelect");
    dom.globalAspectRatioSelect = byId("globalAspectRatioSelect");
    dom.enforceGlobalOutputStandardCheckbox = byId("enforceGlobalOutputStandardCheckbox");
    dom.subjectImageReferenceInput = byId("subjectImageReferenceInput");
    dom.subjectPaletteSwatches = byId("subjectPaletteSwatches");
    dom.subjectPaletteHexInput = byId("subjectPaletteHexInput");
    dom.subjectPaletteColorInput = byId("subjectPaletteColorInput");
    dom.subjectPaletteSwatchInfluenceInput = byId("subjectPaletteSwatchInfluenceInput");
    dom.addSubjectPaletteSwatchBtn = byId("addSubjectPaletteSwatchBtn");
    dom.clearSubjectPaletteBtn = byId("clearSubjectPaletteBtn");
    dom.subjectInput = byId("subjectInput");
    dom.classThemeInput = byId("classThemeInput");
    dom.modifierColorInput = byId("modifierColorInput");
    dom.classExclusionsInput = byId("classExclusionsInput");
    dom.classFlavorSelect = byId("classFlavorSelect");
    dom.classFlavorNameInput = byId("classFlavorNameInput");
    dom.renameClassFlavorBtn = byId("renameClassFlavorBtn");
    dom.newClassFlavorBtn = byId("newClassFlavorBtn");
    dom.classFlavorStatus = byId("classFlavorStatus");
    dom.classPaletteSwatches = byId("classPaletteSwatches");
    dom.classPaletteHexInput = byId("classPaletteHexInput");
    dom.classPaletteColorInput = byId("classPaletteColorInput");
    dom.classPaletteSwatchInfluenceInput = byId("classPaletteSwatchInfluenceInput");
    dom.addClassPaletteSwatchBtn = byId("addClassPaletteSwatchBtn");
    dom.undoClassPaletteBtn = byId("undoClassPaletteBtn");
    dom.resetClassPaletteBtn = byId("resetClassPaletteBtn");
    dom.classPaletteInfluenceInput = byId("classPaletteInfluenceInput");
    dom.classPaletteInfluenceValue = byId("classPaletteInfluenceValue");
    dom.modifierStyleTagsInput = byId("modifierStyleTagsInput");
    dom.finalPromptOutput = byId("finalPromptOutput");
    dom.promptLinkSkillSearchInput = byId("promptLinkSkillSearchInput");
    dom.promptLinkSkillSelect = byId("promptLinkSkillSelect");
    dom.savePromptToSkillBtn = byId("savePromptToSkillBtn");
    dom.promptLinkStatus = byId("promptLinkStatus");
    dom.copyPromptBtn = byId("copyPromptBtn");
    dom.savePromptToVersionBtn = byId("savePromptToVersionBtn");
    dom.newVersionFromPromptBtn = byId("newVersionFromPromptBtn");
    dom.copyStatus = byId("copyStatus");

    dom.newSkillEntryBtn = byId("newSkillEntryBtn");
    dom.skillsFolderInput = byId("skillsFolderInput");
    dom.skillsFolderStatus = byId("skillsFolderStatus");
    dom.skillSearchInput = byId("skillSearchInput");
    dom.previewPromptSettingsBtn = byId("previewPromptSettingsBtn");
    dom.promptConfigSummary = byId("promptConfigSummary");
    dom.promptConfigVersionSelect = byId("promptConfigVersionSelect");
    dom.loadPromptConfigVersionBtn = byId("loadPromptConfigVersionBtn");
    dom.skillList = byId("skillList");
    dom.skillNameInput = byId("skillNameInput");
    dom.skillClassInput = byId("skillClassInput");
    dom.skillTierSelect = byId("skillTierSelect");
    dom.skillFolderPathInput = byId("skillFolderPathInput");
    dom.suggestPathBtn = byId("suggestPathBtn");
    dom.skillVersionSelect = byId("skillVersionSelect");
    dom.newVersionBtn = byId("newVersionBtn");
    dom.duplicateVersionBtn = byId("duplicateVersionBtn");
    dom.versionImagePathInput = byId("versionImagePathInput");
    dom.versionPaletteInfluenceInput = byId("versionPaletteInfluenceInput");
    dom.versionPaletteInfluenceValue = byId("versionPaletteInfluenceValue");
    dom.versionNotesInput = byId("versionNotesInput");
    dom.mainPreview = byId("mainPreview");
    dom.versionThumbGrid = byId("versionThumbGrid");
    dom.refreshAuditBtn = byId("refreshAuditBtn");
    dom.auditSummary = byId("auditSummary");
    dom.missingList = byId("missingList");
  }

  function bindEvents() {
    if (dom.skillEntryHeader) {
      dom.skillEntryHeader.addEventListener("click", onSkillEntryHeaderClick);
      dom.skillEntryHeader.addEventListener("keydown", onSkillEntryHeaderKeyDown);
    }
    dom.globalRulesInput.addEventListener("input", onBuilderFieldChange);
    dom.globalExclusionsInput.addEventListener("input", onBuilderFieldChange);
    dom.globalArtistInfluenceInput.addEventListener("input", onBuilderFieldChange);
    dom.globalOutputSizeSelect.addEventListener("change", onBuilderFieldChange);
    dom.globalAspectRatioSelect.addEventListener("change", onBuilderFieldChange);
    dom.enforceGlobalOutputStandardCheckbox.addEventListener("change", onBuilderFieldChange);
    dom.subjectImageReferenceInput.addEventListener("input", onBuilderFieldChange);
    dom.subjectPaletteHexInput.addEventListener("input", onSubjectPaletteHexInputChange);
    dom.subjectPaletteColorInput.addEventListener("input", onSubjectPaletteColorInputChange);
    dom.subjectPaletteSwatchInfluenceInput.addEventListener("input", onSubjectPaletteSwatchInfluenceInputChange);
    dom.addSubjectPaletteSwatchBtn.addEventListener("click", addSubjectPaletteSwatchFromInputs);
    dom.clearSubjectPaletteBtn.addEventListener("click", clearSubjectPaletteSwatches);
    dom.subjectInput.addEventListener("input", onBuilderFieldChange);
    dom.classThemeInput.addEventListener("input", onBuilderFieldChange);
    dom.modifierColorInput.addEventListener("input", onBuilderFieldChange);
    dom.classExclusionsInput.addEventListener("input", onBuilderFieldChange);
    if (dom.classFlavorSelect) {
      dom.classFlavorSelect.addEventListener("change", onClassFlavorChange);
    }
    if (dom.classFlavorNameInput) {
      dom.classFlavorNameInput.addEventListener("keydown", onClassFlavorNameInputKeyDown);
    }
    if (dom.renameClassFlavorBtn) {
      dom.renameClassFlavorBtn.addEventListener("click", renameSelectedClassFlavor);
    }
    if (dom.newClassFlavorBtn) {
      dom.newClassFlavorBtn.addEventListener("click", createNewClassFlavorFromCurrent);
    }
    dom.classPaletteHexInput.addEventListener("input", onClassPaletteHexInputChange);
    dom.classPaletteColorInput.addEventListener("input", onClassPaletteColorInputChange);
    dom.classPaletteSwatchInfluenceInput.addEventListener("input", onClassPaletteSwatchInfluenceInputChange);
    dom.addClassPaletteSwatchBtn.addEventListener("click", addClassPaletteSwatchFromInputs);
    dom.undoClassPaletteBtn.addEventListener("click", undoClassPaletteChange);
    dom.resetClassPaletteBtn.addEventListener("click", resetCurrentClassPalette);
    dom.classPaletteInfluenceInput.addEventListener("input", onClassPaletteInfluenceChange);
    dom.modifierStyleTagsInput.addEventListener("input", onBuilderFieldChange);
    if (dom.promptLinkSkillSearchInput) {
      dom.promptLinkSkillSearchInput.addEventListener("input", onPromptLinkSkillSearchInputChange);
    }
    if (dom.promptLinkSkillSelect) {
      dom.promptLinkSkillSelect.addEventListener("change", onPromptLinkSkillSelectChange);
    }
    if (dom.savePromptToSkillBtn) {
      dom.savePromptToSkillBtn.addEventListener("click", savePromptToLinkedSkill);
    }
    dom.copyPromptBtn.addEventListener("click", copyPromptToClipboard);
    dom.savePromptToVersionBtn.addEventListener("click", savePromptToActiveVersion);
    dom.newVersionFromPromptBtn.addEventListener("click", createVersionFromPrompt);

    dom.newSkillEntryBtn.addEventListener("click", createSkillEntry);
    dom.skillsFolderInput.addEventListener("change", onSkillsFolderSelected);
    dom.skillSearchInput.addEventListener("input", () => {
      state.skillSearchTerm = String(dom.skillSearchInput.value || "").trim().toLowerCase();
      renderSkillList();
    });
    if (dom.previewPromptSettingsBtn) {
      dom.previewPromptSettingsBtn.addEventListener("click", previewPromptSettingsForSelectedSkill);
    }
    if (dom.promptConfigVersionSelect) {
      dom.promptConfigVersionSelect.addEventListener("change", onPromptConfigVersionSelectChange);
    }
    if (dom.loadPromptConfigVersionBtn) {
      dom.loadPromptConfigVersionBtn.addEventListener("click", loadSelectedPromptConfigVersion);
    }
    dom.skillNameInput.addEventListener("input", () => updateSkillField("skillName", dom.skillNameInput.value));
    dom.skillClassInput.addEventListener("change", () => updateSkillField("className", dom.skillClassInput.value));
    dom.skillTierSelect.addEventListener("change", () => updateSkillField("skillTier", dom.skillTierSelect.value));
    dom.skillFolderPathInput.addEventListener("input", () => updateSkillField("folderPath", dom.skillFolderPathInput.value));
    dom.suggestPathBtn.addEventListener("click", suggestPathForActiveSkill);
    dom.skillVersionSelect.addEventListener("change", () => {
      const entry = getSelectedSkillEntry();
      if (!entry) return;
      const value = String(dom.skillVersionSelect.value || "");
      if (!findVersion(entry, value)) return;
      entry.activeVersion = value;
      syncSkillEditor();
      saveState();
    });
    dom.newVersionBtn.addEventListener("click", createNewVersion);
    dom.duplicateVersionBtn.addEventListener("click", duplicateVersion);
    dom.versionImagePathInput.addEventListener("input", () => updateActiveVersionField("imagePath", dom.versionImagePathInput.value));
    dom.versionPaletteInfluenceInput.addEventListener("input", onVersionPaletteInfluenceInputChange);
    dom.versionNotesInput.addEventListener("input", () => updateActiveVersionField("notes", dom.versionNotesInput.value));
    dom.refreshAuditBtn.addEventListener("click", refreshAssetAudit);
  }

  function hydrateState() {
    const defaults = createDefaultState();
    const savedRaw = loadJson(STORAGE_KEY);
    const saved = normalizeSavedState(savedRaw);

    state.classFlavorProfiles = normalizeSavedClassFlavorProfiles(saved.classFlavorProfiles);
    state.builder = {
      subject: String(saved.builder && saved.builder.subject || defaults.builder.subject || ""),
      subjectImageReference: String(
        saved.builder && saved.builder.subjectImageReference || defaults.builder.subjectImageReference || ""
      ),
      subjectPaletteSwatches: normalizePaletteSwatches(
        saved.builder && saved.builder.subjectPaletteSwatches || defaults.builder.subjectPaletteSwatches
      ),
      globalRules: String(saved.builder && saved.builder.globalRules || defaults.builder.globalRules || ""),
      globalExclusions: String(saved.builder && saved.builder.globalExclusions || defaults.builder.globalExclusions || ""),
      globalArtistInfluence: String(
        saved.builder && saved.builder.globalArtistInfluence || defaults.builder.globalArtistInfluence || ""
      ),
      classTheme: String(saved.builder && saved.builder.classTheme || defaults.builder.classTheme || ""),
      colorTheme: String(saved.builder && saved.builder.colorTheme || defaults.builder.colorTheme || ""),
      classExclusions: String(saved.builder && saved.builder.classExclusions || defaults.builder.classExclusions || ""),
      classFlavorId: resolveClassFlavorId(
        saved.builder && (saved.builder.classFlavorId || saved.builder.classFlavor) ||
          defaults.builder.classFlavorId ||
          defaults.builder.classFlavor
      ),
      classFlavor: String(saved.builder && saved.builder.classFlavor || defaults.builder.classFlavor || ""),
      classPaletteByClass: normalizeClassPaletteByClass(
        (saved.builder && saved.builder.classPaletteByClass) || defaults.builder.classPaletteByClass
      ),
      paletteInfluencePct: clampPaletteInfluence(
        saved.builder && saved.builder.paletteInfluencePct,
        defaults.builder.paletteInfluencePct
      ),
      styleTags: String(saved.builder && saved.builder.styleTags || defaults.builder.styleTags || ""),
      outputSize: normalizeOutputSize(
        saved.builder && saved.builder.outputSize,
        defaults.builder.outputSize
      ),
      outputAspectRatio: normalizeOutputAspectRatio(
        saved.builder && saved.builder.outputAspectRatio,
        defaults.builder.outputAspectRatio
      ),
      outputStandardizationEnabled:
        saved.builder && typeof saved.builder.outputStandardizationEnabled === "boolean"
          ? saved.builder.outputStandardizationEnabled
          : Boolean(defaults.builder.outputStandardizationEnabled)
    };

    state.skills = mergeSkills(defaults.skills, saved.skills);
    reconcileSkillPathsWithHints(state.skills);
    state.selectedSkillId = pickExistingId(saved.selectedSkillId, state.skills) || defaults.selectedSkillId;
    state.skillSearchTerm = String(saved.skillSearchTerm || "");
    state.promptLinkSkillSearchTerm = String(saved.promptLinkSkillSearchTerm || "");
    state.promptLinkSkillId =
      pickExistingId(saved.promptLinkSkillId, state.skills) ||
      pickExistingId(state.selectedSkillId, state.skills) ||
      (state.skills.length ? state.skills[0].id : "");
  }

  function createDefaultState() {
    const skills = buildDefaultSkillEntries();
    return {
      classFlavorProfiles: [],
      builder: {
        globalRules: "",
        globalExclusions: "",
        globalArtistInfluence: "",
        subjectImageReference: "",
      subjectPaletteSwatches: [],
      subject: "",
      classTheme: "",
      colorTheme: "",
      classExclusions: "",
      classFlavorId: "barbarian",
      classFlavor: "barbarian",
      classPaletteByClass: createDefaultClassPaletteByClass(),
        paletteInfluencePct: 60,
        styleTags: "",
        outputSize: DEFAULT_OUTPUT_SIZE,
        outputAspectRatio: "1:1",
        outputStandardizationEnabled: true
      },
      skills,
      selectedSkillId: skills.length ? skills[0].id : "",
      promptLinkSkillSearchTerm: "",
      promptLinkSkillId: skills.length ? skills[0].id : ""
    };
  }

  function buildDefaultSkillEntries() {
    const entries = [];
    const idSet = new Set();
    const data = window.RL_DATA || {};

    const classSkills = data.CLASS_SKILLS || {};
    Object.keys(classSkills).forEach((classId) => {
      const group = classSkills[classId];
      const skills = group && Array.isArray(group.skills) ? group.skills : [];
      skills.forEach((skill) => {
        if (!skill || !skill.id) return;
        const skillId = String(skill.id);
        if (idSet.has(skillId)) return;
        idSet.add(skillId);
        const hintPath = getSkillIconHintPath(skillId);
        const slug = hintPath ? extractBaseNameWithoutExt(hintPath) : slugify(skillId);
        const folderPath = hintPath ? extractDirName(hintPath) : `assets/skills/class/${slugify(classId)}/${slug}`;
        entries.push(createSkillEntryRecord({
          id: skillId,
          skillName: String(skill.name || titleCaseFromId(skillId)),
          className: String(classId),
          classFlavorId: String(classId),
          category: String(skill.category || "Class Skill"),
          scope: "class",
          weaponId: "",
          slug,
          folderPath,
          imagePath: hintPath || ""
        }));
      });
    });

    const upgrades = Array.isArray(data.UPGRADES) ? data.UPGRADES : [];
    upgrades.forEach((upgrade) => {
      if (!upgrade || !upgrade.id) return;
      const skillId = String(upgrade.id);
      if (idSet.has(skillId)) return;
      idSet.add(skillId);
      const weaponId = String(upgrade.weaponId || "");
      const scope = weaponId ? "weapon" : "general";
      const hintPath = getSkillIconHintPath(skillId);
      const slug = hintPath ? extractBaseNameWithoutExt(hintPath) : deriveUpgradeSlug(skillId, weaponId);
      const folderPath = hintPath ? extractDirName(hintPath) : suggestFolderPath({
        scope,
        className: "",
        weaponId,
        slug,
        skillName: String(upgrade.title || titleCaseFromId(skillId))
      });
      entries.push(createSkillEntryRecord({
        id: skillId,
        skillName: String(upgrade.title || titleCaseFromId(skillId)),
        className: "",
        category: String(upgrade.type || "upgrade"),
        scope,
        weaponId,
        slug,
        folderPath,
        imagePath: hintPath || ""
      }));
    });

    entries.sort((a, b) => {
      if (a.scope !== b.scope) return a.scope.localeCompare(b.scope);
      if (a.className !== b.className) return a.className.localeCompare(b.className);
      if (a.weaponId !== b.weaponId) return a.weaponId.localeCompare(b.weaponId);
      return a.skillName.localeCompare(b.skillName);
    });

    return entries;
  }

  function createSkillEntryRecord(seed) {
    const slug = slugify(seed.slug || seed.id || seed.skillName || "skill");
    const folderPath = normalizePath(seed.folderPath || suggestFolderPath(seed));
    const explicitImagePath = normalizePath(seed.imagePath || "");
    const defaultImagePath = explicitImagePath || `${folderPath}/${slug}.png`;
    const skillTier = normalizeSkillTier(seed.skillTier || (seed.isElite ? "elite" : "normal"));
    return {
      id: String(seed.id || makeId("skill")),
      skillName: String(seed.skillName || "New Skill"),
      className: String(seed.className || ""),
      category: String(seed.category || ""),
      scope: String(seed.scope || "general"),
      weaponId: String(seed.weaponId || ""),
      skillTier,
      slug,
      folderPath,
      tags: Array.isArray(seed.tags) ? seed.tags.slice() : [],
      versions: [
        {
          versionNumber: "v01",
          prompt: "",
          imagePath: defaultImagePath,
          classFlavorId: resolveClassFlavorId(seed.classFlavorId || state.builder.classFlavorId),
          classPaletteSwatches: normalizePaletteSwatches(seed.classPaletteSwatches || getActiveClassPalette()),
          paletteInfluencePct: clampPaletteInfluence(seed.paletteInfluencePct, state.builder.paletteInfluencePct),
          createdAt: new Date().toISOString(),
          notes: ""
        }
      ],
      activeVersion: "v01",
      promptConfigs: [],
      activePromptConfigVersion: ""
    };
  }

  function normalizeSavedState(saved) {
    if (!saved || typeof saved !== "object") return {};
    return saved;
  }

  function mergeSkills(defaults, saved) {
    const byId = new Map();
    defaults.forEach((skill) => byId.set(skill.id, skill));

    const savedList = Array.isArray(saved) ? saved : [];
    savedList.forEach((raw) => {
      if (!raw || !raw.id) return;
      const fallback = byId.get(String(raw.id)) || createSkillEntryRecord({ id: raw.id, skillName: raw.skillName || raw.id });
      const merged = {
        id: String(raw.id),
        skillName: String(raw.skillName || fallback.skillName || "Skill"),
        className: String(raw.className || fallback.className || ""),
        category: String(raw.category || fallback.category || ""),
        scope: String(raw.scope || fallback.scope || "general"),
        weaponId: String(raw.weaponId || fallback.weaponId || ""),
        skillTier: normalizeSkillTier(raw.skillTier || (raw.isElite ? "elite" : fallback.skillTier)),
        slug: slugify(raw.slug || fallback.slug || raw.id),
        folderPath: normalizePath(raw.folderPath || fallback.folderPath || suggestFolderPath(fallback)),
        tags: Array.isArray(raw.tags) ? raw.tags.map(String) : fallback.tags || [],
        versions: normalizeVersions(raw.versions, fallback),
        activeVersion: String(raw.activeVersion || ""),
        promptConfigs: normalizePromptConfigs(raw.promptConfigs, fallback),
        activePromptConfigVersion: String(raw.activePromptConfigVersion || "")
      };
      if (!findVersion(merged, merged.activeVersion)) {
        merged.activeVersion = merged.versions.length ? merged.versions[0].versionNumber : "";
      }
      if (!findPromptConfigByVersion(merged, merged.activePromptConfigVersion)) {
        const latestPromptConfig = getLatestPromptConfig(merged);
        merged.activePromptConfigVersion = latestPromptConfig ? latestPromptConfig.versionNumber : "";
      }
      byId.set(merged.id, merged);
    });

    return Array.from(byId.values()).sort((a, b) => {
      if (a.scope !== b.scope) return a.scope.localeCompare(b.scope);
      return a.skillName.localeCompare(b.skillName);
    });
  }

  function reconcileSkillPathsWithHints(skills) {
    if (!Array.isArray(skills) || !skills.length) return;
    skills.forEach((entry) => {
      if (!entry || !entry.id) return;
      entry.skillTier = normalizeSkillTier(entry.skillTier || (entry.isElite ? "elite" : "normal"));
      const hintPath = getSkillIconHintPath(entry.id);
      if (!hintPath) return;

      const hintDir = extractDirName(hintPath);
      const hintSlug = extractBaseNameWithoutExt(hintPath);
      const currentSlug = slugify(entry.slug || entry.id || entry.skillName || "");
      const idSlug = slugify(entry.id);
      const folderPath = normalizePath(entry.folderPath || "");
      const folderLooksLegacy =
        Boolean(currentSlug && hintSlug && currentSlug !== hintSlug) &&
        (folderPath.endsWith(`/${currentSlug}`) || folderPath.endsWith(`/${idSlug}`) || folderPath.includes(`/${currentSlug}/`));

      if (!folderPath || folderLooksLegacy) entry.folderPath = hintDir;
      if (!currentSlug || currentSlug !== hintSlug) entry.slug = hintSlug;

      if (!Array.isArray(entry.versions) || !entry.versions.length) return;
      entry.versions.forEach((version) => {
        const imagePath = normalizePath(version && version.imagePath || "");
        if (!imagePath) {
          version.imagePath = hintPath;
          return;
        }
        const imageSlug = extractBaseNameWithoutExt(imagePath);
        if (
          imageSlug === currentSlug ||
          imageSlug === idSlug ||
          imagePath.includes(`/${currentSlug}.`) ||
          imagePath.includes(`/${idSlug}.`)
        ) {
          version.imagePath = hintPath;
        }
      });
    });
  }

  function normalizeVersions(rawVersions, fallbackSkill) {
    const base = Array.isArray(rawVersions) && rawVersions.length ? rawVersions : fallbackSkill.versions || [];
    const mapped = base
      .map((version, index) => {
        const number = normalizeVersionNumber(version && version.versionNumber, index + 1);
        const slug = slugify(fallbackSkill.slug || fallbackSkill.id || fallbackSkill.skillName || "skill");
        const folder = normalizePath(fallbackSkill.folderPath || suggestFolderPath(fallbackSkill));
        return {
          versionNumber: number,
          prompt: String(version && version.prompt || ""),
          imagePath: String(version && version.imagePath || `${folder}/${slug}${number === "v01" ? "" : `_${number}`}.png`),
          classFlavorId: resolveClassFlavorId(version && version.classFlavorId || fallbackSkill.className || "none"),
          classPaletteSwatches: normalizePaletteSwatches(version && version.classPaletteSwatches),
          paletteInfluencePct: clampPaletteInfluence(version && version.paletteInfluencePct, state.builder.paletteInfluencePct),
          createdAt: String(version && version.createdAt || new Date().toISOString()),
          notes: String(version && version.notes || "")
        };
      })
      .sort((a, b) => compareVersionNumber(a.versionNumber, b.versionNumber));
    return mapped.length ? mapped : [{
      versionNumber: "v01",
      prompt: "",
      imagePath: `${normalizePath(fallbackSkill.folderPath)}/${slugify(fallbackSkill.slug || fallbackSkill.id)}.png`,
      classFlavorId: "none",
      classPaletteSwatches: [],
      paletteInfluencePct: clampPaletteInfluence(state.builder.paletteInfluencePct, 60),
      createdAt: new Date().toISOString(),
      notes: ""
    }];
  }

  function normalizePromptConfigs(rawPromptConfigs, fallbackSkill) {
    const baseList = Array.isArray(rawPromptConfigs) ? rawPromptConfigs : [];
    const byVersion = new Map();
    baseList.forEach((rawConfig, index) => {
      if (!rawConfig || typeof rawConfig !== "object") return;
      const versionNumber = normalizeVersionNumber(rawConfig.versionNumber || rawConfig.version, index + 1);
      const normalizedPalette = normalizePromptConfigModifiers(rawConfig.modifiers);
      const normalized = {
        id: String(rawConfig.id || makeId("spv")),
        skillId: String(rawConfig.skillId || fallbackSkill.id || ""),
        versionNumber,
        subjectDescription: String(rawConfig.subjectDescription || rawConfig.subject || ""),
        imageReference: String(rawConfig.imageReference || rawConfig.referenceImage || rawConfig.subjectImageReference || ""),
        paletteOverride: normalizePaletteSwatches(rawConfig.paletteOverride || normalizedPalette.paletteOverride),
        finalPrompt: String(rawConfig.finalPrompt || rawConfig.prompt || ""),
        createdAt: String(rawConfig.createdAt || new Date().toISOString())
      };
      byVersion.set(versionNumber, normalized);
    });
    return Array.from(byVersion.values()).sort((a, b) => compareVersionNumber(a.versionNumber, b.versionNumber));
  }

  function normalizePromptConfigModifiers(rawModifiers) {
    const source = rawModifiers && typeof rawModifiers === "object" ? rawModifiers : {};
    const paletteSource = source.paletteOverride || source.subjectPaletteSwatches;
    return {
      paletteOverride: normalizePaletteSwatches(paletteSource),
      paletteInfluencePct: clampPaletteInfluence(source.paletteInfluencePct, 60)
    };
  }

  function renderClassFlavorOptions() {
    const profiles = getClassFlavorProfiles();
    const current = resolveClassFlavorId(state.builder.classFlavorId || state.builder.classFlavor);
    state.builder.classFlavorId = resolveClassFlavorId(current);
    state.builder.classFlavor = state.builder.classFlavorId;
    ensureClassPaletteFor(state.builder.classFlavorId);
    if (dom.classFlavorSelect) {
      dom.classFlavorSelect.innerHTML = "";
      profiles.forEach((profile) => {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.label;
        dom.classFlavorSelect.appendChild(option);
      });
      dom.classFlavorSelect.value = state.builder.classFlavorId;
    }
    syncClassFlavorNameInput();
    renderClassPaletteControls();
  }

  function syncBuilderInputs() {
    renderClassFlavorOptions();
    dom.globalRulesInput.value = state.builder.globalRules || "";
    dom.globalExclusionsInput.value = state.builder.globalExclusions || "";
    dom.globalArtistInfluenceInput.value = state.builder.globalArtistInfluence || "";
    dom.globalOutputSizeSelect.value = normalizeOutputSize(state.builder.outputSize, DEFAULT_OUTPUT_SIZE);
    dom.globalAspectRatioSelect.value = normalizeOutputAspectRatio(state.builder.outputAspectRatio, "1:1");
    dom.enforceGlobalOutputStandardCheckbox.checked = Boolean(state.builder.outputStandardizationEnabled);
    dom.subjectImageReferenceInput.value = state.builder.subjectImageReference || "";
    renderSubjectPaletteControls();
    dom.subjectInput.value = state.builder.subject || "";
    dom.classThemeInput.value = state.builder.classTheme || "";
    dom.modifierColorInput.value = state.builder.colorTheme || "";
    dom.classExclusionsInput.value = state.builder.classExclusions || "";
    dom.modifierStyleTagsInput.value = state.builder.styleTags || "";
  }

  function onBuilderFieldChange() {
    state.builder.globalRules = String(dom.globalRulesInput.value || "");
    state.builder.globalExclusions = String(dom.globalExclusionsInput.value || "");
    state.builder.globalArtistInfluence = String(dom.globalArtistInfluenceInput.value || "");
    state.builder.outputSize = normalizeOutputSize(dom.globalOutputSizeSelect.value, state.builder.outputSize);
    state.builder.outputAspectRatio = normalizeOutputAspectRatio(
      dom.globalAspectRatioSelect.value,
      state.builder.outputAspectRatio
    );
    state.builder.outputStandardizationEnabled = Boolean(dom.enforceGlobalOutputStandardCheckbox.checked);
    state.builder.subjectImageReference = String(dom.subjectImageReferenceInput.value || "").trim();
    state.builder.subject = String(dom.subjectInput.value || "");
    state.builder.classTheme = String(dom.classThemeInput.value || "");
    state.builder.colorTheme = String(dom.modifierColorInput.value || "");
    state.builder.classExclusions = String(dom.classExclusionsInput.value || "");
    state.builder.styleTags = String(dom.modifierStyleTagsInput.value || "");
    updateFinalPromptOutput();
    saveState();
  }

  function onSubjectPaletteHexInputChange() {
    const normalized = normalizeHexColor(dom.subjectPaletteHexInput.value);
    if (!normalized) return;
    dom.subjectPaletteHexInput.value = normalized;
    dom.subjectPaletteColorInput.value = normalized;
  }

  function onSubjectPaletteColorInputChange() {
    const normalized = normalizeHexColor(dom.subjectPaletteColorInput.value);
    if (!normalized) return;
    dom.subjectPaletteColorInput.value = normalized;
    dom.subjectPaletteHexInput.value = normalized;
  }

  function onSubjectPaletteSwatchInfluenceInputChange() {
    const influence = clampPaletteInfluence(dom.subjectPaletteSwatchInfluenceInput.value, 100);
    dom.subjectPaletteSwatchInfluenceInput.value = String(influence);
  }

  function getSubjectPaletteSwatches() {
    return normalizePaletteSwatches(state.builder.subjectPaletteSwatches || []);
  }

  function addSubjectPaletteSwatchFromInputs() {
    const normalized = normalizeHexColor(dom.subjectPaletteHexInput.value || dom.subjectPaletteColorInput.value);
    if (!normalized) return;
    const influencePct = clampPaletteInfluence(dom.subjectPaletteSwatchInfluenceInput.value, 100);
    const swatches = getSubjectPaletteSwatches();
    const selectedIndex = Number.isFinite(Number(state.selectedSubjectPaletteSwatchIndex))
      ? Number(state.selectedSubjectPaletteSwatchIndex)
      : -1;
    if (selectedIndex >= 0 && selectedIndex < swatches.length) {
      swatches[selectedIndex] = { hex: normalized, influencePct };
    } else {
      const existing = swatches.find((swatch) => swatch.hex === normalized);
      if (existing) {
        existing.influencePct = influencePct;
      } else {
        swatches.push({ hex: normalized, influencePct });
      }
    }
    state.builder.subjectPaletteSwatches = normalizePaletteSwatches(swatches);
    state.selectedSubjectPaletteSwatchIndex = (state.builder.subjectPaletteSwatches || []).findIndex(
      (swatch) => swatch.hex === normalized
    );
    renderSubjectPaletteControls();
    updateFinalPromptOutput();
    saveState();
  }

  function removeSubjectPaletteSwatch(index) {
    const swatches = getSubjectPaletteSwatches();
    if (index < 0 || index >= swatches.length) return;
    swatches.splice(index, 1);
    state.builder.subjectPaletteSwatches = normalizePaletteSwatches(swatches);
    const selectedIndex = Number(state.selectedSubjectPaletteSwatchIndex);
    if (!Number.isFinite(selectedIndex) || selectedIndex === index) {
      state.selectedSubjectPaletteSwatchIndex = -1;
    } else if (selectedIndex > index) {
      state.selectedSubjectPaletteSwatchIndex = selectedIndex - 1;
    }
    renderSubjectPaletteControls();
    updateFinalPromptOutput();
    saveState();
  }

  function clearSubjectPaletteSwatches() {
    state.builder.subjectPaletteSwatches = [];
    state.selectedSubjectPaletteSwatchIndex = -1;
    renderSubjectPaletteControls();
    updateFinalPromptOutput();
    saveState();
  }

  function renderSubjectPaletteControls() {
    if (!dom.subjectPaletteSwatches) return;
    const swatches = getSubjectPaletteSwatches();
    let selectedIndex = Number.isFinite(Number(state.selectedSubjectPaletteSwatchIndex))
      ? Number(state.selectedSubjectPaletteSwatchIndex)
      : -1;
    if (selectedIndex >= swatches.length) {
      selectedIndex = -1;
      state.selectedSubjectPaletteSwatchIndex = -1;
    }

    dom.subjectPaletteSwatches.innerHTML = "";
    if (!swatches.length) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = "No subject swatches.";
      dom.subjectPaletteSwatches.appendChild(empty);
      if (dom.addSubjectPaletteSwatchBtn) dom.addSubjectPaletteSwatchBtn.textContent = "Add";
      return;
    }

    swatches.forEach((swatchData, index) => {
      const swatch = document.createElement("div");
      swatch.className = `class-palette-swatch${index === selectedIndex ? " selected" : ""}`;
      swatch.style.background = swatchData.hex;
      swatch.title = `${swatchData.hex} (${clampPaletteInfluence(swatchData.influencePct, 100)}%)`;
      swatch.addEventListener("click", () => {
        if (Number(state.selectedSubjectPaletteSwatchIndex) === index) {
          state.selectedSubjectPaletteSwatchIndex = -1;
        } else {
          state.selectedSubjectPaletteSwatchIndex = index;
        }
        renderSubjectPaletteControls();
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "class-palette-swatch-remove";
      removeButton.textContent = "x";
      removeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        removeSubjectPaletteSwatch(index);
      });

      const label = document.createElement("div");
      label.className = "class-palette-swatch-label";
      label.textContent = swatchData.hex;

      const influenceLabel = document.createElement("div");
      influenceLabel.className = "class-palette-swatch-influence";
      influenceLabel.textContent = `${clampPaletteInfluence(swatchData.influencePct, 100)}%`;

      swatch.appendChild(removeButton);
      swatch.appendChild(label);
      swatch.appendChild(influenceLabel);
      dom.subjectPaletteSwatches.appendChild(swatch);
    });

    if (selectedIndex >= 0 && selectedIndex < swatches.length) {
      const selected = swatches[selectedIndex];
      dom.subjectPaletteHexInput.value = selected.hex;
      dom.subjectPaletteColorInput.value = selected.hex;
      dom.subjectPaletteSwatchInfluenceInput.value = String(clampPaletteInfluence(selected.influencePct, 100));
      if (dom.addSubjectPaletteSwatchBtn) dom.addSubjectPaletteSwatchBtn.textContent = "Update";
    } else if (dom.addSubjectPaletteSwatchBtn) {
      dom.addSubjectPaletteSwatchBtn.textContent = "Add";
    }
  }

  function onClassFlavorChange() {
    if (!dom.classFlavorSelect) return;
    state.builder.classFlavorId = resolveClassFlavorId(dom.classFlavorSelect.value);
    state.builder.classFlavor = state.builder.classFlavorId;
    ensureClassPaletteFor(state.builder.classFlavorId);
    setSelectedClassPaletteSwatchIndex(-1);
    syncClassFlavorNameInput();
    renderPromptLinkSkillOptions();
    renderClassPaletteControls();
    updateFinalPromptOutput();
    saveState();
  }

  function onClassFlavorNameInputKeyDown(event) {
    const key = String(event && event.key || "");
    if (key !== "Enter") return;
    event.preventDefault();
    renameSelectedClassFlavor();
  }

  function renameSelectedClassFlavor() {
    const profile = getSelectedClassFlavorProfile();
    const nextLabel = String(dom.classFlavorNameInput && dom.classFlavorNameInput.value || "").trim();
    if (!profile || !nextLabel) {
      setClassFlavorStatus("Enter a class type name before renaming.");
      return;
    }
    upsertClassFlavorProfile({
      id: profile.id,
      label: nextLabel,
      parentPrompt: profile.parentPrompt,
      defaultColorTheme: profile.defaultColorTheme,
      defaultPalette: profile.defaultPalette,
      consistencyTags: profile.consistencyTags,
      isCustom: !Object.prototype.hasOwnProperty.call(BASE_CLASS_FLAVOR_PROFILES, profile.id)
    });
    renderClassFlavorOptions();
    syncSkillEditor();
    renderSkillList();
    updateFinalPromptOutput();
    saveState();
    setClassFlavorStatus(`Renamed class type to ${nextLabel}.`);
  }

  function createNewClassFlavorFromCurrent() {
    const sourceProfile = getSelectedClassFlavorProfile();
    const nextLabel = String(dom.classFlavorNameInput && dom.classFlavorNameInput.value || "").trim() || "New Class";
    const nextId = createUniqueClassFlavorId(nextLabel);
    const activePalette = getActiveClassPalette();
    upsertClassFlavorProfile({
      id: nextId,
      label: nextLabel,
      parentPrompt: sourceProfile && sourceProfile.parentPrompt ? sourceProfile.parentPrompt : "",
      defaultColorTheme: sourceProfile && sourceProfile.defaultColorTheme ? sourceProfile.defaultColorTheme : "",
      defaultPalette: activePalette,
      consistencyTags: sourceProfile && Array.isArray(sourceProfile.consistencyTags) ? sourceProfile.consistencyTags.slice() : [],
      isCustom: true
    });
    state.builder.classFlavorId = nextId;
    state.builder.classFlavor = nextId;
    state.builder.classPaletteByClass[nextId] = normalizePaletteSwatches(activePalette);
    state.classPaletteUndoStackByClass[nextId] = [];
    state.selectedClassPaletteSwatchIndexByClass[nextId] = -1;
    renderClassFlavorOptions();
    syncSkillEditor();
    renderSkillList();
    renderPromptLinkSkillOptions();
    updateFinalPromptOutput();
    saveState();
    setClassFlavorStatus(`Created class type ${nextLabel}.`);
  }

  function onClassPaletteHexInputChange() {
    const normalized = normalizeHexColor(dom.classPaletteHexInput.value);
    if (normalized) {
      dom.classPaletteHexInput.value = normalized;
      dom.classPaletteColorInput.value = normalized;
    }
  }

  function onClassPaletteColorInputChange() {
    const normalized = normalizeHexColor(dom.classPaletteColorInput.value);
    if (!normalized) return;
    dom.classPaletteColorInput.value = normalized;
    dom.classPaletteHexInput.value = normalized;
  }

  function onClassPaletteSwatchInfluenceInputChange() {
    const influence = clampPaletteInfluence(
      dom.classPaletteSwatchInfluenceInput.value,
      100
    );
    dom.classPaletteSwatchInfluenceInput.value = String(influence);
  }

  function addClassPaletteSwatchFromInputs() {
    const normalized = normalizeHexColor(dom.classPaletteHexInput.value || dom.classPaletteColorInput.value);
    if (!normalized) return;
    const swatchInfluence = clampPaletteInfluence(
      dom.classPaletteSwatchInfluenceInput.value,
      100
    );
    const classId = resolveClassFlavorId(state.builder.classFlavorId);
    ensureClassPaletteFor(classId);
    pushClassPaletteUndoSnapshot();
    const existing = normalizePaletteSwatches(state.builder.classPaletteByClass[classId] || []);
    const selectedIndex = getSelectedClassPaletteSwatchIndex();

    if (selectedIndex >= 0 && selectedIndex < existing.length) {
      existing[selectedIndex] = {
        hex: normalized,
        influencePct: swatchInfluence
      };
    } else {
      const match = existing.find((swatch) => swatch.hex === normalized);
      if (match) {
        match.influencePct = swatchInfluence;
      } else {
        existing.push({ hex: normalized, influencePct: swatchInfluence });
      }
    }
    state.builder.classPaletteByClass[classId] = normalizePaletteSwatches(existing);
    const finalIndex = (state.builder.classPaletteByClass[classId] || []).findIndex(
      (swatch) => swatch.hex === normalized
    );
    setSelectedClassPaletteSwatchIndex(finalIndex);
    dom.classPaletteHexInput.value = normalized;
    dom.classPaletteColorInput.value = normalized;
    dom.classPaletteSwatchInfluenceInput.value = String(swatchInfluence);
    renderClassPaletteControls();
    updateFinalPromptOutput();
    saveState();
  }

  function removeClassPaletteSwatch(index) {
    const classId = resolveClassFlavorId(state.builder.classFlavorId);
    ensureClassPaletteFor(classId);
    const palette = normalizePaletteSwatches(state.builder.classPaletteByClass[classId] || []);
    if (index < 0 || index >= palette.length) return;
    pushClassPaletteUndoSnapshot();
    palette.splice(index, 1);
    state.builder.classPaletteByClass[classId] = palette;
    const selectedIndex = getSelectedClassPaletteSwatchIndex();
    if (selectedIndex === index) {
      setSelectedClassPaletteSwatchIndex(-1);
    } else if (selectedIndex > index) {
      setSelectedClassPaletteSwatchIndex(selectedIndex - 1);
    }
    renderClassPaletteControls();
    updateFinalPromptOutput();
    saveState();
  }

  function resetCurrentClassPalette() {
    const classId = resolveClassFlavorId(state.builder.classFlavorId);
    const profile = getClassFlavorProfileById(classId);
    pushClassPaletteUndoSnapshot();
    state.builder.classPaletteByClass[classId] = normalizePaletteSwatches(profile.defaultPalette || []);
    setSelectedClassPaletteSwatchIndex(-1);
    renderClassPaletteControls();
    updateFinalPromptOutput();
    saveState();
  }

  function onClassPaletteInfluenceChange() {
    const influence = clampPaletteInfluence(dom.classPaletteInfluenceInput.value, 60);
    pushClassPaletteUndoSnapshot();
    state.builder.paletteInfluencePct = influence;
    dom.classPaletteInfluenceValue.textContent = `${influence}%`;
    const entry = getSelectedSkillEntry();
    const version = getActiveVersion(entry);
    if (version) {
      version.paletteInfluencePct = influence;
      version.classFlavorId = resolveClassFlavorId(state.builder.classFlavorId);
      version.classPaletteSwatches = getActiveClassPalette();
      if (dom.versionPaletteInfluenceInput) dom.versionPaletteInfluenceInput.value = String(influence);
      if (dom.versionPaletteInfluenceValue) dom.versionPaletteInfluenceValue.textContent = `${influence}%`;
    }
    updateFinalPromptOutput();
    saveState();
  }

  function onVersionPaletteInfluenceInputChange() {
    const influence = clampPaletteInfluence(dom.versionPaletteInfluenceInput.value, state.builder.paletteInfluencePct);
    const entry = getSelectedSkillEntry();
    const version = getActiveVersion(entry);
    if (!version) return;
    pushClassPaletteUndoSnapshot();
    version.paletteInfluencePct = influence;
    state.builder.paletteInfluencePct = influence;
    dom.versionPaletteInfluenceValue.textContent = `${influence}%`;
    dom.classPaletteInfluenceInput.value = String(influence);
    dom.classPaletteInfluenceValue.textContent = `${influence}%`;
    updateFinalPromptOutput();
    saveState();
  }

  function renderClassPaletteControls() {
    if (!dom.classPaletteSwatches) return;
    const classId = resolveClassFlavorId(state.builder.classFlavorId);
    ensureClassPaletteFor(classId);
    const palette = getActiveClassPalette();
    let selectedIndex = getSelectedClassPaletteSwatchIndex();
    if (selectedIndex >= palette.length) {
      selectedIndex = -1;
      setSelectedClassPaletteSwatchIndex(-1);
    }
    dom.classPaletteSwatches.innerHTML = "";
    if (!palette.length) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = "No swatches yet.";
      dom.classPaletteSwatches.appendChild(empty);
    } else {
      palette.forEach((swatchData, index) => {
        const hex = swatchData.hex;
        const influencePct = clampPaletteInfluence(swatchData.influencePct, 100);
        const swatch = document.createElement("div");
        swatch.className = `class-palette-swatch${index === selectedIndex ? " selected" : ""}`;
        swatch.style.background = hex;
        swatch.title = `${hex} (${influencePct}%)`;
        swatch.addEventListener("click", () => {
          if (getSelectedClassPaletteSwatchIndex() === index) {
            setSelectedClassPaletteSwatchIndex(-1);
          } else {
            setSelectedClassPaletteSwatchIndex(index);
          }
          renderClassPaletteControls();
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "class-palette-swatch-remove";
        removeButton.textContent = "x";
        removeButton.addEventListener("click", (event) => {
          event.stopPropagation();
          removeClassPaletteSwatch(index);
        });

        const label = document.createElement("div");
        label.className = "class-palette-swatch-label";
        label.textContent = hex;

        const influenceLabel = document.createElement("div");
        influenceLabel.className = "class-palette-swatch-influence";
        influenceLabel.textContent = `${influencePct}%`;

        swatch.appendChild(removeButton);
        swatch.appendChild(label);
        swatch.appendChild(influenceLabel);
        dom.classPaletteSwatches.appendChild(swatch);
      });
    }
    const influence = clampPaletteInfluence(state.builder.paletteInfluencePct, 60);
    dom.classPaletteInfluenceInput.value = String(influence);
    dom.classPaletteInfluenceValue.textContent = `${influence}%`;
    if (dom.classPaletteSwatchInfluenceInput) {
      dom.classPaletteSwatchInfluenceInput.value = String(
        clampPaletteInfluence(dom.classPaletteSwatchInfluenceInput.value, 100)
      );
    }

    const validSelectedIndex = selectedIndex >= 0 && selectedIndex < palette.length ? selectedIndex : -1;
    if (validSelectedIndex >= 0) {
      const selectedSwatch = palette[validSelectedIndex];
      dom.classPaletteHexInput.value = selectedSwatch.hex;
      dom.classPaletteColorInput.value = selectedSwatch.hex;
      dom.classPaletteSwatchInfluenceInput.value = String(
        clampPaletteInfluence(selectedSwatch.influencePct, 100)
      );
      if (dom.addClassPaletteSwatchBtn) dom.addClassPaletteSwatchBtn.textContent = "Update";
    } else if (palette.length && !normalizeHexColor(dom.classPaletteHexInput.value)) {
      dom.classPaletteHexInput.value = palette[palette.length - 1].hex;
      dom.classPaletteColorInput.value = palette[palette.length - 1].hex;
      dom.classPaletteSwatchInfluenceInput.value = String(
        clampPaletteInfluence(palette[palette.length - 1].influencePct, 100)
      );
      if (dom.addClassPaletteSwatchBtn) dom.addClassPaletteSwatchBtn.textContent = "Add";
    } else if (dom.addClassPaletteSwatchBtn) {
      dom.addClassPaletteSwatchBtn.textContent = "Add";
    }
    updateClassPaletteUndoButtonState();
  }

  function updateFinalPromptOutput() {
    const scope = inferClassRulesTemplateScope();
    const scopePrompt = getBuiltInScopePrompt(scope);
    const classProfile = getSelectedClassFlavorProfile();
    const activePalette = getActiveClassPalette();
    const paletteInfluence = clampPaletteInfluence(state.builder.paletteInfluencePct, 60);
    const globalRulesParts = [];
    const classRulesParts = [];
    const subjectRulesParts = [];

    if (state.builder.globalRules.trim()) globalRulesParts.push(state.builder.globalRules.trim());
    if (state.builder.globalExclusions.trim()) globalRulesParts.push(`exclude: ${state.builder.globalExclusions.trim()}`);
    if (state.builder.globalArtistInfluence.trim()) {
      globalRulesParts.push(`artist influence: ${state.builder.globalArtistInfluence.trim()}`);
    }
    const outputSize = normalizeOutputSize(state.builder.outputSize, DEFAULT_OUTPUT_SIZE);
    const outputAspectRatio = normalizeOutputAspectRatio(state.builder.outputAspectRatio, "1:1");
    if (state.builder.outputStandardizationEnabled) {
      globalRulesParts.push(`standardized output size: ${outputSize}`);
      globalRulesParts.push(`standardized aspect ratio: ${outputAspectRatio}`);
    }

    if (scopePrompt) classRulesParts.push(scopePrompt);
    if (state.builder.classTheme.trim()) classRulesParts.push(`theme notes: ${state.builder.classTheme.trim()}`);
    const resolvedColorTheme = state.builder.colorTheme.trim() || classProfile.defaultColorTheme.trim();
    if (resolvedColorTheme) classRulesParts.push(`color theme: ${resolvedColorTheme}`);
    if (state.builder.classExclusions.trim()) classRulesParts.push(`exclude: ${state.builder.classExclusions.trim()}`);
    if (activePalette.length) {
      const palettePrompt = activePalette
        .map((swatch) => `${swatch.hex} (${clampPaletteInfluence(swatch.influencePct, 100)}%)`)
        .join(", ");
      classRulesParts.push(`class palette: ${palettePrompt}`);
    }
    classRulesParts.push(`palette influence: ${paletteInfluence}%`);

    if (state.builder.subject.trim()) subjectRulesParts.push(state.builder.subject.trim());
    const subjectPalette = normalizePaletteSwatches(state.builder.subjectPaletteSwatches || []);
    if (subjectPalette.length) {
      const subjectPalettePrompt = subjectPalette
        .map((swatch) => `${swatch.hex} (${clampPaletteInfluence(swatch.influencePct, 100)}%)`)
        .join(", ");
      subjectRulesParts.push(`subject palette: ${subjectPalettePrompt}`);
    }

    const styleTags = dedupe(
      []
        .concat(getBuiltInScopeStyleTags(scope))
        .concat(parseTagString(state.builder.styleTags || ""))
    );
    if (styleTags.length) globalRulesParts.push(`style tags: ${styleTags.join(", ")}`);

    const sectionBlocks = [];
    const imageReference = String(state.builder.subjectImageReference || "").trim();
    if (imageReference) sectionBlocks.push(imageReference);
    if (globalRulesParts.length) sectionBlocks.push(`Global Rules: ${globalRulesParts.join(", ")}`);
    if (classRulesParts.length) sectionBlocks.push(`Class Rules: ${classRulesParts.join(", ")}`);
    if (subjectRulesParts.length) sectionBlocks.push(`Subject Rules: ${subjectRulesParts.join(", ")}`);
    const finalPrompt = sectionBlocks.join(" | ");
    dom.finalPromptOutput.value = finalPrompt;
  }

  async function copyPromptToClipboard() {
    const prompt = String(dom.finalPromptOutput.value || "").trim();
    if (!prompt) {
      dom.copyStatus.textContent = "Nothing to copy yet.";
      return;
    }
    try {
      await navigator.clipboard.writeText(prompt);
      dom.copyStatus.textContent = "Prompt copied to clipboard.";
    } catch (error) {
      dom.copyStatus.textContent = "Copy failed. Select and copy manually.";
    }
  }

  function savePromptToActiveVersion() {
    const entry = getSelectedSkillEntry();
    const version = getActiveVersion(entry);
    if (!entry || !version) return;
    version.prompt = String(dom.finalPromptOutput.value || "");
    version.classFlavorId = resolveClassFlavorId(state.builder.classFlavorId);
    version.classPaletteSwatches = getActiveClassPalette();
    version.paletteInfluencePct = clampPaletteInfluence(state.builder.paletteInfluencePct, 60);
    if (!version.createdAt) version.createdAt = new Date().toISOString();
    syncSkillEditor();
    saveState();
  }

  function createVersionFromPrompt() {
    const entry = getSelectedSkillEntry();
    if (!entry) return;
    const prompt = String(dom.finalPromptOutput.value || "");
    const newVersion = addNewVersion(entry, prompt, {
      classFlavorId: resolveClassFlavorId(state.builder.classFlavorId),
      classPaletteSwatches: getActiveClassPalette(),
      paletteInfluencePct: clampPaletteInfluence(state.builder.paletteInfluencePct, 60)
    });
    entry.activeVersion = newVersion.versionNumber;
    syncSkillEditor();
    saveState();
  }

  function onPromptLinkSkillSearchInputChange() {
    state.promptLinkSkillSearchTerm = String(dom.promptLinkSkillSearchInput.value || "").trim().toLowerCase();
    renderPromptLinkSkillOptions();
    saveState();
  }

  function onPromptLinkSkillSelectChange() {
    const skillId = String(dom.promptLinkSkillSelect.value || "");
    selectSkillForPromptBuilder(skillId, { focusBuilder: false, source: "prompt-link" });
    saveState();
  }

  function getPromptLinkVisibleSkills() {
    const query = String(state.promptLinkSkillSearchTerm || "").trim().toLowerCase();
    const classFilteredSkills = getPromptLinkSkillsForSelectedClass();
    if (!query) return classFilteredSkills;
    return classFilteredSkills.filter((entry) => {
      const haystack = [
        entry.skillName,
        entry.id,
        entry.className,
        entry.weaponId,
        entry.category,
        entry.scope
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }

  function getPromptLinkSkillsForSelectedClass() {
    const selectedClassId = resolveClassFlavorId(state.builder.classFlavorId || state.builder.classFlavor);
    return state.skills.filter((entry) => doesSkillMatchPromptLinkClass(entry, selectedClassId));
  }

  function doesSkillMatchPromptLinkClass(entry, classId) {
    if (!entry || typeof entry !== "object") return false;
    const resolvedClassId = resolveClassFlavorId(classId);
    const scope = String(entry.scope || "").trim().toLowerCase();
    if (resolvedClassId === "weapon") {
      return scope === "weapon";
    }
    const entryClassId =
      findMatchingClassFlavorId(entry.className || "") ||
      findMatchingClassFlavorId(entry.classFlavorId || "");
    return scope === "class" && entryClassId === resolvedClassId;
  }

  function renderPromptLinkSkillOptions() {
    if (dom.promptLinkSkillSearchInput) {
      dom.promptLinkSkillSearchInput.value = state.promptLinkSkillSearchTerm || "";
    }
    if (!dom.promptLinkSkillSelect) return;
    dom.promptLinkSkillSelect.innerHTML = "";

    const visibleSkills = getPromptLinkVisibleSkills();
    if (!visibleSkills.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No skills available for selected class";
      dom.promptLinkSkillSelect.appendChild(option);
      dom.promptLinkSkillSelect.value = "";
      state.promptLinkSkillId = "";
      return;
    }

    visibleSkills.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.id;
      option.textContent = `${entry.skillName} (${entry.id})`;
      dom.promptLinkSkillSelect.appendChild(option);
    });

    const selected = pickExistingId(state.promptLinkSkillId, visibleSkills) ||
      pickExistingId(state.selectedSkillId, visibleSkills) ||
      visibleSkills[0].id;
    state.promptLinkSkillId = selected;
    dom.promptLinkSkillSelect.value = selected;
  }

  function setPromptLinkStatus(message) {
    if (!dom.promptLinkStatus) return;
    dom.promptLinkStatus.textContent = String(message || "");
  }

  function selectSkillForPromptBuilder(skillId, options) {
    const opts = options && typeof options === "object" ? options : {};
    const entry = state.skills.find((skill) => skill.id === String(skillId || "")) || null;
    if (!entry) return;

    state.selectedSkillId = entry.id;
    state.promptLinkSkillId = entry.id;

    const promptConfig = getActivePromptConfig(entry);
    if (promptConfig) {
      applyPromptConfigToBuilder(entry, promptConfig, { focusBuilder: Boolean(opts.focusBuilder) });
      setPromptLinkStatus(`Loaded ${entry.skillName} prompt settings ${promptConfig.versionNumber}.`);
    } else {
      clearSubjectRulesForSkillSelection();
      syncBuilderInputs();
      updateFinalPromptOutput();
      renderPromptLinkSkillOptions();
      renderSkillList();
      syncSkillEditor();
      setPromptLinkStatus(`${entry.skillName} has no saved prompt settings yet. Subject rules reset.`);
      if (opts.focusBuilder) focusPromptBuilderForPreview();
    }
  }

  function clearSubjectRulesForSkillSelection() {
    state.builder.subjectImageReference = "";
    state.builder.subjectPaletteSwatches = [];
    state.builder.subject = "";
    state.selectedSubjectPaletteSwatchIndex = -1;
  }

  function savePromptToLinkedSkill() {
    const skillId = String(state.promptLinkSkillId || "");
    const entry = state.skills.find((skill) => skill.id === skillId) || null;
    if (!entry) {
      setPromptLinkStatus("Select a valid skill before saving prompt settings.");
      return;
    }

    const promptConfig = createPromptConfigFromBuilder(entry);
    const created = addPromptConfigToSkill(entry, promptConfig);
    entry.activePromptConfigVersion = created.versionNumber;
    state.selectedSkillId = entry.id;
    setPromptLinkStatus(`Saved ${entry.skillName} prompt settings as ${created.versionNumber}.`);
    renderSkillList();
    renderPromptLinkSkillOptions();
    syncSkillEditor();
    saveState();
  }

  function createPromptConfigFromBuilder(entry) {
    return {
      id: makeId("spv"),
      skillId: String(entry && entry.id || ""),
      subjectDescription: String(state.builder.subject || ""),
      imageReference: String(state.builder.subjectImageReference || "").trim(),
      paletteOverride: normalizePaletteSwatches(state.builder.subjectPaletteSwatches || []),
      finalPrompt: String(dom.finalPromptOutput.value || ""),
      createdAt: new Date().toISOString()
    };
  }

  function addPromptConfigToSkill(entry, configSeed) {
    if (!entry.promptConfigs || !Array.isArray(entry.promptConfigs)) {
      entry.promptConfigs = [];
    }
    const nextVersion = getNextVersionNumber(entry.promptConfigs);
    const created = {
      id: String(configSeed.id || makeId("spv")),
      skillId: String(configSeed.skillId || entry.id || ""),
      versionNumber: nextVersion,
      subjectDescription: String(configSeed.subjectDescription || ""),
      imageReference: String(configSeed.imageReference || ""),
      paletteOverride: normalizePaletteSwatches(configSeed.paletteOverride || []),
      finalPrompt: String(configSeed.finalPrompt || ""),
      createdAt: String(configSeed.createdAt || new Date().toISOString())
    };
    entry.promptConfigs.push(created);
    entry.promptConfigs.sort((a, b) => compareVersionNumber(a.versionNumber, b.versionNumber));
    return created;
  }

  function previewPromptSettingsForSelectedSkill() {
    const entry = getSelectedSkillEntry();
    if (!entry) return;
    const promptConfig = getActivePromptConfig(entry);
    if (!promptConfig) {
      setPromptLinkStatus(`${entry.skillName} has no saved prompt settings yet.`);
      return;
    }
    applyPromptConfigToBuilder(entry, promptConfig, { focusBuilder: true });
    setPromptLinkStatus(`Loaded ${entry.skillName} prompt settings ${promptConfig.versionNumber}.`);
    saveState();
  }

  function applyPromptConfigToBuilder(entry, promptConfig, options) {
    if (!entry || !promptConfig) return;
    const opts = options && typeof options === "object" ? options : {};

    state.builder.subject = String(promptConfig.subjectDescription || "");
    state.builder.subjectImageReference = String(promptConfig.imageReference || "");
    state.builder.subjectPaletteSwatches = normalizePaletteSwatches(promptConfig.paletteOverride || []);
    state.selectedSubjectPaletteSwatchIndex = -1;

    state.promptLinkSkillId = entry.id;
    state.selectedSkillId = entry.id;
    entry.activePromptConfigVersion = String(promptConfig.versionNumber || "");
    syncBuilderInputs();
    updateFinalPromptOutput();
    if (promptConfig.finalPrompt && String(promptConfig.finalPrompt).trim()) {
      dom.finalPromptOutput.value = String(promptConfig.finalPrompt);
    }
    renderPromptLinkSkillOptions();
    renderSkillList();
    syncSkillEditor();
    if (opts.focusBuilder) focusPromptBuilderForPreview();
  }

  function focusPromptBuilderForPreview() {
    const sections = Array.from(document.querySelectorAll(".builder-panel .builder-accordion"));
    sections.forEach((section, index) => {
      if (!section) return;
      section.open = index === 2;
    });
    const builderPanel = document.querySelector(".builder-panel");
    if (builderPanel && typeof builderPanel.scrollIntoView === "function") {
      builderPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function createSkillEntry() {
    const created = createSkillEntryRecord({
      id: makeId("skill"),
      skillName: "New Skill",
      className: "",
      category: "Utility",
      skillTier: "normal",
      scope: "general",
      weaponId: "",
      slug: "new_skill",
      folderPath: "assets/skills/general/new_skill"
    });
    state.skills.unshift(created);
    state.selectedSkillId = created.id;
    state.promptLinkSkillId = created.id;
    renderSkillList();
    syncSkillEditor();
    renderPromptLinkSkillOptions();
    saveState();
  }

  function renderSkillList() {
    dom.skillSearchInput.value = state.skillSearchTerm || "";
    dom.skillList.innerHTML = "";

    const visible = getVisibleSkills();
    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = "No matching skills.";
      dom.skillList.appendChild(empty);
      return;
    }

    const grouped = new Map();
    visible.forEach((entry) => {
      const key = getSkillGroupKey(entry);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(entry);
    });

    Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b)).forEach((groupKey) => {
      const title = document.createElement("div");
      title.className = "skill-group-title";
      title.textContent = groupKey;
      dom.skillList.appendChild(title);

      grouped.get(groupKey).forEach((entry) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `skill-item skill-tier-${getSkillTier(entry)}${entry.id === state.selectedSkillId ? " active" : ""}`;
        button.addEventListener("click", () => {
          selectSkillForPromptBuilder(entry.id, { focusBuilder: false, source: "skill-list" });
          saveState();
        });

        const main = document.createElement("div");
        main.className = "skill-item-main";
        const name = document.createElement("div");
        name.className = "skill-name";
        name.textContent = entry.skillName;
        const meta = document.createElement("div");
        meta.className = "skill-meta";
        meta.textContent = entry.id;
        main.append(name, meta);

        const status = document.createElement("span");
        const assetStatus = state.assetStatusBySkillId[entry.id];
        status.className = `status-badge ${assetStatus ? (assetStatus.found ? "found" : "missing") : "unknown"}`;
        status.textContent = assetStatus ? (assetStatus.found ? "found" : "missing") : "unchecked";

        button.append(main, status);
        dom.skillList.appendChild(button);
      });
    });

    syncSkillEditor();
    renderPromptLinkSkillOptions();
  }

  function getVisibleSkills() {
    const query = state.skillSearchTerm;
    if (!query) return state.skills.slice();
    return state.skills.filter((entry) => {
      const haystack = [
        entry.skillName,
        entry.id,
        entry.category,
        entry.className,
        entry.weaponId,
        entry.scope
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }

  function getSkillGroupKey(entry) {
    if (entry.scope === "class") return `Class - ${getClassFlavorDisplayName(entry.className)}`;
    if (entry.scope === "weapon") return `Weapon - ${entry.weaponId || "Unknown"}`;
    return "General";
  }

  function getSelectedSkillEntry() {
    return state.skills.find((entry) => entry.id === state.selectedSkillId) || null;
  }

  function syncSkillEditor() {
    const entry = getSelectedSkillEntry();
    const version = getActiveVersion(entry);
    renderSkillClassOptions(entry ? entry.className : "");

    if (!entry) {
      dom.skillNameInput.value = "";
      dom.skillTierSelect.value = "normal";
      dom.skillFolderPathInput.value = "";
      dom.skillVersionSelect.innerHTML = "";
      dom.versionImagePathInput.value = "";
      if (dom.versionPaletteInfluenceInput) dom.versionPaletteInfluenceInput.value = String(clampPaletteInfluence(state.builder.paletteInfluencePct, 60));
      if (dom.versionPaletteInfluenceValue) dom.versionPaletteInfluenceValue.textContent = `${clampPaletteInfluence(state.builder.paletteInfluencePct, 60)}%`;
      dom.versionNotesInput.value = "";
      if (dom.promptConfigSummary) dom.promptConfigSummary.textContent = "No prompt settings saved yet.";
      renderPromptConfigVersionSelect(null);
      renderMainPreview(null, null);
      dom.versionThumbGrid.innerHTML = "";
      return;
    }

    dom.skillNameInput.value = entry.skillName || "";
    dom.skillTierSelect.value = getSkillTier(entry);
    dom.skillFolderPathInput.value = entry.folderPath || "";

    renderVersionSelect(entry, version);
    dom.versionImagePathInput.value = version ? version.imagePath || "" : "";
    const versionInfluence = clampPaletteInfluence(
      version ? version.paletteInfluencePct : state.builder.paletteInfluencePct,
      state.builder.paletteInfluencePct
    );
    state.builder.paletteInfluencePct = versionInfluence;
    renderClassPaletteControls();
    if (dom.versionPaletteInfluenceInput) dom.versionPaletteInfluenceInput.value = String(versionInfluence);
    if (dom.versionPaletteInfluenceValue) dom.versionPaletteInfluenceValue.textContent = `${versionInfluence}%`;
    dom.versionNotesInput.value = version ? version.notes || "" : "";

    const activePromptConfig = getActivePromptConfig(entry);
    renderPromptConfigVersionSelect(entry, activePromptConfig);
    if (dom.promptConfigSummary) {
      if (activePromptConfig) {
        const savedAt = formatTimestampForDisplay(activePromptConfig.createdAt);
        dom.promptConfigSummary.textContent =
          `Active prompt settings: ${activePromptConfig.versionNumber}${savedAt ? ` | ${savedAt}` : ""}`;
      } else {
        dom.promptConfigSummary.textContent = "No prompt settings saved yet.";
      }
    }
    state.promptLinkSkillId = entry.id;

    renderVersionThumbnails(entry, version);
    renderSelectedPreview(entry, version);
  }

  function renderPromptConfigVersionSelect(entry, activePromptConfig) {
    if (!dom.promptConfigVersionSelect) return;
    dom.promptConfigVersionSelect.innerHTML = "";
    if (!entry || !Array.isArray(entry.promptConfigs) || !entry.promptConfigs.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No saved prompt versions";
      dom.promptConfigVersionSelect.appendChild(option);
      dom.promptConfigVersionSelect.value = "";
      dom.promptConfigVersionSelect.disabled = true;
      if (dom.loadPromptConfigVersionBtn) dom.loadPromptConfigVersionBtn.disabled = true;
      return;
    }

    const sortedPromptConfigs = entry.promptConfigs
      .slice()
      .sort((a, b) => compareVersionNumber(a.versionNumber, b.versionNumber));
    sortedPromptConfigs.forEach((config) => {
      const option = document.createElement("option");
      option.value = String(config.versionNumber || "");
      option.textContent = String(config.versionNumber || "");
      dom.promptConfigVersionSelect.appendChild(option);
    });
    const activeVersionNumber = String(
      (activePromptConfig && activePromptConfig.versionNumber) ||
      entry.activePromptConfigVersion ||
      sortedPromptConfigs[sortedPromptConfigs.length - 1].versionNumber
    );
    dom.promptConfigVersionSelect.value = activeVersionNumber;
    dom.promptConfigVersionSelect.disabled = false;
    if (dom.loadPromptConfigVersionBtn) dom.loadPromptConfigVersionBtn.disabled = false;
  }

  function onPromptConfigVersionSelectChange() {
    loadSelectedPromptConfigVersion();
  }

  function loadSelectedPromptConfigVersion() {
    const entry = getSelectedSkillEntry();
    if (!entry || !dom.promptConfigVersionSelect) return;
    const selectedVersionNumber = String(dom.promptConfigVersionSelect.value || "");
    const selectedPromptConfig = findPromptConfigByVersion(entry, selectedVersionNumber);
    if (!selectedPromptConfig) return;
    applyPromptConfigToBuilder(entry, selectedPromptConfig, { focusBuilder: false });
    setPromptLinkStatus(`Loaded ${entry.skillName} prompt settings ${selectedPromptConfig.versionNumber}.`);
    saveState();
  }

  function renderVersionSelect(entry, activeVersion) {
    dom.skillVersionSelect.innerHTML = "";
    entry.versions
      .slice()
      .sort((a, b) => compareVersionNumber(a.versionNumber, b.versionNumber))
      .forEach((version) => {
        const option = document.createElement("option");
        option.value = version.versionNumber;
        option.textContent = version.versionNumber;
        dom.skillVersionSelect.appendChild(option);
      });
    dom.skillVersionSelect.value = activeVersion ? activeVersion.versionNumber : "";
  }

  function updateSkillField(field, value) {
    const entry = getSelectedSkillEntry();
    if (!entry) return;
    if (field === "tags") {
      entry.tags = Array.isArray(value) ? value : [];
    } else if (field === "skillTier") {
      entry.skillTier = normalizeSkillTier(value);
    } else {
      entry[field] = String(value || "");
    }
    if (field === "skillName") {
      entry.slug = slugify(entry.slug || entry.skillName || entry.id);
    }
    if (field === "folderPath") {
      entry.folderPath = normalizePath(entry.folderPath);
    }
    renderSkillList();
    syncSkillEditor();
    saveState();
    refreshAssetAudit();
  }

  function suggestPathForActiveSkill() {
    const entry = getSelectedSkillEntry();
    if (!entry) return;
    entry.folderPath = suggestFolderPath(entry);
    const version = getActiveVersion(entry);
    if (version && !version.imagePath) {
      version.imagePath = `${entry.folderPath}/${entry.slug}.png`;
    }
    syncSkillEditor();
    saveState();
    refreshAssetAudit();
  }

  function createNewVersion() {
    const entry = getSelectedSkillEntry();
    if (!entry) return;
    const created = addNewVersion(entry, "");
    entry.activeVersion = created.versionNumber;
    syncSkillEditor();
    saveState();
  }

  function duplicateVersion() {
    const entry = getSelectedSkillEntry();
    const version = getActiveVersion(entry);
    if (!entry || !version) return;
    const clone = addNewVersion(entry, version.prompt || "", {
      classFlavorId: version.classFlavorId,
      classPaletteSwatches: version.classPaletteSwatches,
      paletteInfluencePct: version.paletteInfluencePct
    });
    clone.notes = version.notes || "";
    clone.imagePath = version.imagePath || clone.imagePath;
    entry.activeVersion = clone.versionNumber;
    syncSkillEditor();
    saveState();
  }

  function addNewVersion(entry, prompt, seed) {
    const nextNumber = getNextVersionNumber(entry.versions);
    const slug = slugify(entry.slug || entry.id || entry.skillName || "skill");
    const defaultPath = `${normalizePath(entry.folderPath || suggestFolderPath(entry))}/${slug}_${nextNumber}.png`;
    const defaults = seed && typeof seed === "object" ? seed : {};
    const created = {
      versionNumber: nextNumber,
      prompt: String(prompt || ""),
      imagePath: defaultPath,
      classFlavorId: resolveClassFlavorId(defaults.classFlavorId || state.builder.classFlavorId),
      classPaletteSwatches: normalizePaletteSwatches(defaults.classPaletteSwatches || getActiveClassPalette()),
      paletteInfluencePct: clampPaletteInfluence(defaults.paletteInfluencePct, state.builder.paletteInfluencePct),
      createdAt: new Date().toISOString(),
      notes: ""
    };
    entry.versions.push(created);
    entry.versions.sort((a, b) => compareVersionNumber(a.versionNumber, b.versionNumber));
    return created;
  }

  function updateActiveVersionField(field, value) {
    const entry = getSelectedSkillEntry();
    const version = getActiveVersion(entry);
    if (!entry || !version) return;
    version[field] = String(value || "");
    syncSkillEditor();
    saveState();
    if (field === "imagePath") refreshAssetAudit();
  }

  function getActiveVersion(entry) {
    if (!entry || !Array.isArray(entry.versions)) return null;
    const active = findVersion(entry, entry.activeVersion);
    if (active) return active;
    const first = entry.versions[0] || null;
    if (first) entry.activeVersion = first.versionNumber;
    return first;
  }

  function findVersion(entry, versionNumber) {
    if (!entry || !Array.isArray(entry.versions)) return null;
    return entry.versions.find((version) => version.versionNumber === versionNumber) || null;
  }

  function findPromptConfigByVersion(entry, version) {
    if (!entry || !Array.isArray(entry.promptConfigs)) return null;
    return entry.promptConfigs.find((config) => {
      const currentVersion = String(config.versionNumber || config.version || "");
      return currentVersion === String(version || "");
    }) || null;
  }

  function getLatestPromptConfig(entry) {
    if (!entry || !Array.isArray(entry.promptConfigs) || !entry.promptConfigs.length) return null;
    const sorted = entry.promptConfigs
      .slice()
      .sort((a, b) => compareVersionNumber(a.versionNumber, b.versionNumber));
    return sorted[sorted.length - 1] || null;
  }

  function getActivePromptConfig(entry) {
    if (!entry || !Array.isArray(entry.promptConfigs)) return null;
    const active = findPromptConfigByVersion(entry, entry.activePromptConfigVersion);
    if (active) return active;
    const latest = getLatestPromptConfig(entry);
    if (latest) entry.activePromptConfigVersion = latest.versionNumber;
    return latest;
  }

  async function renderSelectedPreview(entry, version) {
    if (!entry || !version) {
      renderMainPreview(null, null);
      return;
    }
    const resolution = await resolveImageForEntry(entry, version);
    renderMainPreview(resolution, entry);
  }

  function renderMainPreview(resolution, entry) {
    dom.mainPreview.innerHTML = "";
    dom.mainPreview.classList.remove("skill-tier-normal", "skill-tier-elite");
    dom.mainPreview.classList.add(`skill-tier-${getSkillTier(entry)}`);
    if (!resolution || !resolution.found || !resolution.url) {
      dom.mainPreview.classList.add("empty");
      dom.mainPreview.textContent = "No image preview available for current version.";
      return;
    }
    dom.mainPreview.classList.remove("empty");
    const image = document.createElement("img");
    image.src = resolution.url;
    image.alt = entry ? `${entry.skillName} preview` : "Skill preview";
    image.loading = "lazy";
    dom.mainPreview.appendChild(image);
  }

  async function renderVersionThumbnails(entry, activeVersion) {
    dom.versionThumbGrid.innerHTML = "";
    if (!entry || !Array.isArray(entry.versions) || !entry.versions.length) return;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < entry.versions.length; i += 1) {
      const version = entry.versions[i];
      const resolution = await resolveImageForEntry(entry, version);
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = `version-thumb skill-tier-${getSkillTier(entry)}${activeVersion && version.versionNumber === activeVersion.versionNumber ? " active" : ""}`;
      thumb.addEventListener("click", () => {
        entry.activeVersion = version.versionNumber;
        syncSkillEditor();
        saveState();
      });

      const imageFrame = document.createElement("div");
      imageFrame.className = `version-thumb-image skill-tier-${getSkillTier(entry)}`;
      if (resolution && resolution.found && resolution.url) {
        const image = document.createElement("img");
        image.src = resolution.url;
        image.alt = `${entry.skillName} ${version.versionNumber}`;
        image.loading = "lazy";
        imageFrame.appendChild(image);
      } else {
        imageFrame.textContent = "missing";
      }

      const meta = document.createElement("div");
      meta.className = "version-thumb-meta";
      meta.textContent = version.versionNumber;

      thumb.append(imageFrame, meta);
      fragment.appendChild(thumb);
    }
    dom.versionThumbGrid.appendChild(fragment);
  }

  async function resolveImageForEntry(entry, version) {
    const candidates = buildCandidateImagePaths(entry, version);
    if (!candidates.length) return missingResolution(entry);

    for (let i = 0; i < candidates.length; i += 1) {
      const candidate = candidates[i];
      const imported = lookupImportedImage(candidate);
      if (imported && imported.url) {
        return {
          found: true,
          url: imported.url,
          resolvedPath: normalizePath(candidate),
          source: "imported"
        };
      }
    }

    for (let i = 0; i < candidates.length; i += 1) {
      const candidate = candidates[i];
      const loaded = await probeImagePath(candidate);
      if (loaded) {
        return {
          found: true,
          url: loaded.src,
          resolvedPath: normalizePath(candidate),
          source: "project"
        };
      }
    }

    return missingResolution(entry, candidates);
  }

  function missingResolution(entry, candidates) {
    return {
      found: false,
      url: "",
      resolvedPath: normalizePath((candidates && candidates[0]) || `${entry.folderPath}/${entry.slug}.png`),
      source: "missing"
    };
  }

  function buildCandidateImagePaths(entry, version) {
    const candidates = [];
    const hintPath = getSkillIconHintPath(entry && entry.id);
    const slug = slugify(entry.slug || entry.id || entry.skillName || "skill");
    const folderPath = normalizePath(entry.folderPath || suggestFolderPath(entry));
    const versionNumber = normalizeVersionNumber(version && version.versionNumber, 1);

    if (hintPath) candidates.push(hintPath);
    if (version && version.imagePath) candidates.push(version.imagePath);
    if (folderPath) {
      candidates.push(`${folderPath}/${slug}.png`);
      if (versionNumber && versionNumber !== "v01") {
        candidates.push(`${folderPath}/${slug}_${versionNumber}.png`);
        candidates.push(`${folderPath}/${slug}-${versionNumber}.png`);
      }
    }

    if (entry.scope === "weapon") {
      const folderCandidates = getWeaponFolderCandidates(entry.weaponId);
      const skillFileName = slug;
      folderCandidates.forEach((folder) => {
        candidates.push(`assets/skills/weapon/${folder}/${skillFileName}.png`);
        candidates.push(`assets/skills/weapon/${folder}/${skillFileName}.jpg`);
      });
    } else if (entry.scope === "class") {
      const classId = slugify(entry.className || "barbarian");
      candidates.push(`assets/skills/class/${classId}/${slug}.png`);
      candidates.push(`assets/skills/class/${classId}/${slug}.jpg`);
    } else {
      candidates.push(`assets/skills/general/${slug}.png`);
      candidates.push(`assets/skills/general/${slug}.jpg`);
    }

    const expanded = [];
    dedupe(candidates).forEach((candidate) => {
      const normalized = normalizePath(candidate);
      if (!normalized) return;
      if (hasKnownExtension(normalized)) {
        expanded.push(normalized);
      } else {
        EXTENSIONS.forEach((ext) => expanded.push(`${normalized}${ext}`));
      }
    });
    return dedupe(expanded);
  }

  async function probeImagePath(pathValue) {
    const src = toWebSrc(pathValue);
    if (!src) return null;
    if (state.imageProbeCache.has(src)) return state.imageProbeCache.get(src);
    const promise = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ src });
      image.onerror = () => resolve(null);
      image.src = src;
    });
    state.imageProbeCache.set(src, promise);
    return promise;
  }

  function toWebSrc(pathValue) {
    if (!pathValue) return "";
    const raw = String(pathValue).trim();
    if (!raw) return "";
    if (/^(https?:|data:|blob:|file:)/i.test(raw)) return raw;
    const normalized = normalizePath(raw);
    if (!normalized) return "";
    if (normalized.startsWith("assets/") || normalized.startsWith("images/") || normalized.startsWith("art/")) {
      return `../../${normalized}`;
    }
    if (normalized.startsWith("skills/")) {
      return `../../assets/${normalized}`;
    }
    return `../../${normalized}`;
  }

  async function refreshAssetAudit() {
    const runId = ++state.activeAuditRunId;
    dom.auditSummary.textContent = "Scanning skills and icon assets...";

    const results = await Promise.all(
      state.skills.map(async (entry) => {
        const version = getActiveVersion(entry);
        const resolution = await resolveImageForEntry(entry, version);
        return { entryId: entry.id, entry, resolution };
      })
    );

    if (runId !== state.activeAuditRunId) return;

    state.assetStatusBySkillId = {};
    let foundCount = 0;
    results.forEach((result) => {
      state.assetStatusBySkillId[result.entryId] = result.resolution;
      if (result.resolution && result.resolution.found) foundCount += 1;
    });

    const missing = results.filter((result) => !result.resolution || !result.resolution.found);
    dom.auditSummary.textContent = `${foundCount}/${results.length} skills have icon assets. Missing: ${missing.length}.`;
    renderMissingList(missing);
    renderSkillList();
    syncSkillEditor();
    saveState();
  }

  function renderMissingList(missingResults) {
    dom.missingList.innerHTML = "";
    if (!missingResults.length) {
      const ok = document.createElement("div");
      ok.className = "muted";
      ok.textContent = "No missing skill assets detected for current entries.";
      dom.missingList.appendChild(ok);
      return;
    }

    const fragment = document.createDocumentFragment();
    missingResults.forEach((result) => {
      const row = document.createElement("div");
      row.className = "missing-item";
      const name = document.createElement("div");
      name.className = "missing-item-name";
      name.textContent = `${result.entry.skillName} (${result.entry.id})`;
      const path = document.createElement("div");
      path.className = "missing-item-path";
      path.textContent = result.resolution && result.resolution.resolvedPath
        ? result.resolution.resolvedPath
        : `${result.entry.folderPath}/${result.entry.slug}.png`;
      row.append(name, path);
      fragment.appendChild(row);
    });
    dom.missingList.appendChild(fragment);
  }

  function onSkillsFolderSelected(event) {
    const files = Array.from(event.target.files || []);
    clearImportedFileCache();
    if (!files.length) {
      dom.skillsFolderStatus.textContent = "No folder selected. Using project-relative paths.";
      refreshAssetAudit();
      return;
    }

    const fileMap = new Map();
    files.forEach((file) => {
      const basePath = normalizePath(file.webkitRelativePath || file.name);
      const pathVariants = buildImportedPathVariants(basePath);
      const url = URL.createObjectURL(file);
      state.importedObjectUrls.push(url);
      const payload = {
        file,
        url,
        size: Number(file.size || 0)
      };
      pathVariants.forEach((variant) => {
        fileMap.set(variant.toLowerCase(), payload);
      });
    });
    state.importedFileMap = fileMap;
    dom.skillsFolderStatus.textContent = `Loaded ${files.length} files from selected skills folder.`;
    refreshAssetAudit();
  }

  function buildImportedPathVariants(basePath) {
    const normalized = normalizePath(basePath);
    const segments = normalized.split("/").filter(Boolean);
    const trimmed = segments.length > 1 ? segments.slice(1).join("/") : normalized;
    const variants = [];

    const add = (value) => {
      const candidate = normalizePath(value);
      if (!candidate) return;
      variants.push(candidate);
    };

    add(normalized);
    add(trimmed);

    if (trimmed.startsWith("skills/")) {
      add(`assets/${trimmed}`);
      add(trimmed.replace(/^skills\//, ""));
    } else if (trimmed.startsWith("assets/")) {
      add(trimmed.replace(/^assets\//, ""));
    } else {
      add(`skills/${trimmed}`);
      add(`assets/skills/${trimmed}`);
    }

    if (normalized.startsWith("assets/")) add(normalized.replace(/^assets\//, ""));
    if (normalized.startsWith("skills/")) add(`assets/${normalized}`);
    if (normalized.startsWith("assets/skills/")) add(normalized.replace(/^assets\/skills\//, ""));

    return dedupe(variants);
  }

  function clearImportedFileCache() {
    state.importedFileMap.clear();
    state.importedObjectUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
      }
    });
    state.importedObjectUrls = [];
  }

  function lookupImportedImage(pathValue) {
    if (!pathValue) return null;
    if (!(state.importedFileMap instanceof Map) || !state.importedFileMap.size) return null;
    const normalized = normalizePath(pathValue).toLowerCase();
    const probes = [
      normalized,
      normalized.replace(/^assets\//, ""),
      normalized.replace(/^assets\/skills\//, ""),
      normalized.startsWith("skills/") ? `assets/${normalized}` : "",
      normalized.startsWith("assets/") ? normalized.replace(/^assets\//, "skills/") : "",
      normalized.startsWith("assets/skills/") ? normalized.replace(/^assets\/skills\//, "skills/") : "",
      normalized.startsWith("assets/skills/") ? normalized.replace(/^assets\/skills\//, "") : "",
      normalized && !normalized.startsWith("assets/skills/") ? `assets/skills/${normalized}` : ""
    ].filter(Boolean);

    for (let i = 0; i < probes.length; i += 1) {
      const value = state.importedFileMap.get(probes[i]);
      if (value) return value;
    }
    return null;
  }

  function suggestFolderPath(entry) {
    const scope = String(entry.scope || "").toLowerCase();
    const slug = slugify(entry.slug || entry.id || entry.skillName || "skill");
    if (scope === "class") {
      const classId = slugify(entry.className || "barbarian");
      return `assets/skills/class/${classId}/${slug}`;
    }
    if (scope === "weapon") {
      const folder = getWeaponFolderCandidates(entry.weaponId)[0] || slugify(entry.weaponId || "weapon");
      return `assets/skills/weapon/${folder}/${slug}`;
    }
    return `assets/skills/general/${slug}`;
  }

  function getWeaponFolderCandidates(weaponId) {
    const key = slugify(weaponId || "");
    const fromMap = WEAPON_FOLDER_CANDIDATES[key];
    if (Array.isArray(fromMap) && fromMap.length) return fromMap.slice();
    return [key || "weapon"];
  }

  function deriveUpgradeSlug(id, weaponId) {
    const cleanId = slugify(id);
    const weapon = slugify(weaponId || "");
    if (weapon && cleanId.startsWith(`${weapon}_`)) return cleanId.slice(weapon.length + 1);
    if (cleanId.startsWith("generic_")) return cleanId.slice("generic_".length);
    return cleanId;
  }

  function getClassFlavorProfiles() {
    const orderedIds = ["barbarian", "ranger", "monk", "necromancer", "weapon"];
    const baseProfiles = orderedIds
      .map((id) => BASE_CLASS_FLAVOR_PROFILES[id])
      .filter(Boolean)
      .map((profile) => Object.assign({}, profile));
    const overrides = Array.isArray(state.classFlavorProfiles) ? state.classFlavorProfiles : [];
    const byId = new Map(baseProfiles.map((profile) => [profile.id, profile]));
    const customProfiles = [];
    overrides.forEach((profile) => {
      if (!profile || !profile.id) return;
      const normalized = normalizeClassFlavorProfile(profile);
      if (!normalized) return;
      if (byId.has(normalized.id)) {
        byId.set(normalized.id, Object.assign({}, byId.get(normalized.id), normalized));
      } else {
        customProfiles.push(normalized);
      }
    });
    return orderedIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .concat(customProfiles);
  }

  function createDefaultClassPaletteByClass() {
    const map = {};
    getClassFlavorProfiles().forEach((profile) => {
      map[profile.id] = normalizePaletteSwatches(profile.defaultPalette || []);
    });
    return map;
  }

  function normalizeClassPaletteByClass(raw) {
    const defaults = createDefaultClassPaletteByClass();
    const output = Object.assign({}, defaults);
    const source = raw && typeof raw === "object" ? raw : {};
    Object.keys(source).forEach((key) => {
      const classId = resolveClassFlavorId(key);
      output[classId] = normalizePaletteSwatches(source[key]);
    });
    return output;
  }

  function normalizePalette(values) {
    return normalizePaletteSwatches(values).map((swatch) => swatch.hex);
  }

  function normalizePaletteSwatches(values) {
    if (!Array.isArray(values)) return [];
    const byHex = new Map();
    values.forEach((value) => {
      let hex = "";
      let influencePct = 100;
      if (typeof value === "string") {
        hex = normalizeHexColor(value);
      } else if (value && typeof value === "object") {
        hex = normalizeHexColor(value.hex || value.color || value.value);
        influencePct = clampPaletteInfluence(value.influencePct, 100);
      }
      if (!hex) return;
      byHex.set(hex, { hex, influencePct });
    });
    return Array.from(byHex.values()).slice(0, 12);
  }

  function normalizeHexColor(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const hex = raw.startsWith("#") ? raw : `#${raw}`;
    if (!/^#([0-9a-fA-F]{6})$/.test(hex)) return "";
    return hex.toLowerCase();
  }

  function normalizeOutputSize(value, fallback) {
    const raw = String(value || "").trim().toLowerCase();
    if (OUTPUT_SIZE_OPTIONS.includes(raw)) return raw;
    const fallbackRaw = String(fallback || "").trim().toLowerCase();
    if (OUTPUT_SIZE_OPTIONS.includes(fallbackRaw)) return fallbackRaw;
    return DEFAULT_OUTPUT_SIZE;
  }

  function normalizeOutputAspectRatio(value, fallback) {
    const raw = String(value || "").trim();
    if (OUTPUT_ASPECT_RATIO_OPTIONS.includes(raw)) return raw;
    const fallbackRaw = String(fallback || "").trim();
    if (OUTPUT_ASPECT_RATIO_OPTIONS.includes(fallbackRaw)) return fallbackRaw;
    return "1:1";
  }

  function clampPaletteInfluence(value, fallback) {
    const next = Number(value);
    const base = Number.isFinite(next) ? next : Number(fallback);
    const safe = Number.isFinite(base) ? base : 60;
    return Math.max(0, Math.min(100, Math.round(safe)));
  }

  function getClassFlavorProfileById(classId) {
    const resolved = resolveClassFlavorId(classId);
    const map = getClassFlavorProfileMap();
    return map.get(resolved) || map.get("none") || Object.assign({}, BASE_CLASS_FLAVOR_PROFILES.none);
  }

  function getClassFlavorDisplayName(classId) {
    const matchedId = findMatchingClassFlavorId(classId);
    if (!matchedId) {
      const raw = String(classId || "").trim();
      return raw || "Unknown";
    }
    const profile = getClassFlavorProfileById(matchedId);
    return String(profile && profile.label || matchedId);
  }

  function getClassFlavorProfileMap() {
    const map = new Map();
    getClassFlavorProfiles().forEach((profile) => {
      map.set(profile.id, profile);
    });
    return map;
  }

  function resolveClassFlavorId(value) {
    const raw = slugify(value || "");
    if (!raw || raw === "no_class" || raw === "none") return "barbarian";
    const map = getClassFlavorProfileMap();
    if (map.has(raw)) return raw;
    const profiles = getClassFlavorProfiles();
    const labelMatch = profiles.find((profile) => slugify(profile.label || "") === raw);
    if (labelMatch) return labelMatch.id;
    if (raw.includes("barbarian") && map.has("barbarian")) return "barbarian";
    if (raw.includes("ranger") && map.has("ranger")) return "ranger";
    if (raw.includes("monk") && map.has("monk")) return "monk";
    if (raw.includes("necro") && map.has("necromancer")) return "necromancer";
    if (raw.includes("weapon") && map.has("weapon")) return "weapon";
    return "barbarian";
  }

  function findMatchingClassFlavorId(value) {
    const raw = slugify(value || "");
    if (!raw || raw === "no_class" || raw === "none") return "";
    const profiles = getClassFlavorProfiles();
    const directMatch = profiles.find((profile) => profile.id === raw);
    if (directMatch) return directMatch.id;
    const labelMatch = profiles.find((profile) => slugify(profile.label || "") === raw);
    return labelMatch ? labelMatch.id : "";
  }

  function renderSkillClassOptions(currentValue) {
    if (!dom.skillClassInput) return;
    const profiles = getClassFlavorProfiles();
    const selectedId = findMatchingClassFlavorId(currentValue);
    dom.skillClassInput.innerHTML = "";

    const blankOption = document.createElement("option");
    blankOption.value = "";
    blankOption.textContent = "Unassigned";
    dom.skillClassInput.appendChild(blankOption);

    profiles.forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.label;
      dom.skillClassInput.appendChild(option);
    });

    dom.skillClassInput.value = selectedId || "";
  }

  function getSelectedClassFlavorProfile() {
    const resolvedId = resolveClassFlavorId(state.builder.classFlavorId || state.builder.classFlavor);
    return getClassFlavorProfileById(resolvedId);
  }

  function ensureClassPaletteFor(classId) {
    const resolved = resolveClassFlavorId(classId);
    if (!state.builder.classPaletteByClass || typeof state.builder.classPaletteByClass !== "object") {
      state.builder.classPaletteByClass = {};
    }
    if (!Array.isArray(state.builder.classPaletteByClass[resolved])) {
      const profile = getClassFlavorProfileById(resolved);
      state.builder.classPaletteByClass[resolved] = normalizePaletteSwatches(profile.defaultPalette || []);
    }
    return state.builder.classPaletteByClass[resolved];
  }

  function getActiveClassPalette() {
    const classId = resolveClassFlavorId(state.builder.classFlavorId);
    ensureClassPaletteFor(classId);
    return normalizePaletteSwatches(state.builder.classPaletteByClass[classId] || []);
  }

  function getClassPaletteUndoStackFor(classId) {
    const resolved = resolveClassFlavorId(classId);
    if (!state.classPaletteUndoStackByClass || typeof state.classPaletteUndoStackByClass !== "object") {
      state.classPaletteUndoStackByClass = {};
    }
    if (!Array.isArray(state.classPaletteUndoStackByClass[resolved])) {
      state.classPaletteUndoStackByClass[resolved] = [];
    }
    return state.classPaletteUndoStackByClass[resolved];
  }

  function pushClassPaletteUndoSnapshot() {
    const classId = resolveClassFlavorId(state.builder.classFlavorId);
    ensureClassPaletteFor(classId);
    const stack = getClassPaletteUndoStackFor(classId);
    const snapshot = {
      palette: normalizePaletteSwatches(state.builder.classPaletteByClass[classId] || []),
      selectedIndex: getSelectedClassPaletteSwatchIndex(),
      paletteInfluencePct: clampPaletteInfluence(state.builder.paletteInfluencePct, 60)
    };
    const previous = stack.length ? stack[stack.length - 1] : null;
    if (
      previous &&
      JSON.stringify(previous.palette) === JSON.stringify(snapshot.palette) &&
      previous.selectedIndex === snapshot.selectedIndex &&
      previous.paletteInfluencePct === snapshot.paletteInfluencePct
    ) {
      updateClassPaletteUndoButtonState();
      return;
    }
    stack.push(snapshot);
    if (stack.length > 80) stack.shift();
    updateClassPaletteUndoButtonState();
  }

  function undoClassPaletteChange() {
    const classId = resolveClassFlavorId(state.builder.classFlavorId);
    const stack = getClassPaletteUndoStackFor(classId);
    if (!stack.length) {
      updateClassPaletteUndoButtonState();
      return;
    }
    const snapshot = stack.pop();
    state.builder.classPaletteByClass[classId] = normalizePaletteSwatches(snapshot.palette || []);
    setSelectedClassPaletteSwatchIndex(Number.isFinite(snapshot.selectedIndex) ? snapshot.selectedIndex : -1);
    state.builder.paletteInfluencePct = clampPaletteInfluence(snapshot.paletteInfluencePct, state.builder.paletteInfluencePct);
    const entry = getSelectedSkillEntry();
    const version = getActiveVersion(entry);
    if (version) {
      version.classFlavorId = classId;
      version.classPaletteSwatches = getActiveClassPalette();
      version.paletteInfluencePct = clampPaletteInfluence(state.builder.paletteInfluencePct, 60);
      if (dom.versionPaletteInfluenceInput) dom.versionPaletteInfluenceInput.value = String(version.paletteInfluencePct);
      if (dom.versionPaletteInfluenceValue) dom.versionPaletteInfluenceValue.textContent = `${version.paletteInfluencePct}%`;
    }
    renderClassPaletteControls();
    updateFinalPromptOutput();
    saveState();
  }

  function updateClassPaletteUndoButtonState() {
    if (!dom.undoClassPaletteBtn) return;
    const classId = resolveClassFlavorId(state.builder.classFlavorId);
    const stack = getClassPaletteUndoStackFor(classId);
    dom.undoClassPaletteBtn.disabled = !stack.length;
  }

  function getSelectedClassPaletteSwatchIndex() {
    const classId = resolveClassFlavorId(state.builder.classFlavorId);
    const map = state.selectedClassPaletteSwatchIndexByClass || {};
    const raw = Number(map[classId]);
    if (!Number.isFinite(raw)) return -1;
    return Math.max(-1, Math.floor(raw));
  }

  function setSelectedClassPaletteSwatchIndex(index) {
    const classId = resolveClassFlavorId(state.builder.classFlavorId);
    if (!state.selectedClassPaletteSwatchIndexByClass || typeof state.selectedClassPaletteSwatchIndexByClass !== "object") {
      state.selectedClassPaletteSwatchIndexByClass = {};
    }
    const numericIndex = Number(index);
    const resolvedIndex = Number.isFinite(numericIndex) ? Math.floor(numericIndex) : -1;
    state.selectedClassPaletteSwatchIndexByClass[classId] = Math.max(-1, resolvedIndex);
  }

  function syncClassFlavorNameInput() {
    if (!dom.classFlavorNameInput) return;
    const profile = getSelectedClassFlavorProfile();
    dom.classFlavorNameInput.value = profile && profile.label ? profile.label : "";
  }

  function setClassFlavorStatus(message) {
    if (!dom.classFlavorStatus) return;
    dom.classFlavorStatus.textContent = String(message || "");
  }

  function normalizeSavedClassFlavorProfiles(raw) {
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    return raw
      .map((profile) => normalizeClassFlavorProfile(profile))
      .filter((profile) => {
        if (!profile || !profile.id || seen.has(profile.id)) return false;
        seen.add(profile.id);
        return true;
      });
  }

  function normalizeClassFlavorProfile(profile) {
    if (!profile || typeof profile !== "object") return null;
    const id = slugify(profile.id || profile.label || "");
    if (!id || id === "none" || id === "no_class") return null;
    return {
      id,
      label: String(profile.label || titleCaseFromId(id)),
      parentPrompt: String(profile.parentPrompt || ""),
      defaultColorTheme: String(profile.defaultColorTheme || ""),
      defaultPalette: normalizePalette(profile.defaultPalette || []),
      consistencyTags: Array.isArray(profile.consistencyTags) ? profile.consistencyTags.map(String).filter(Boolean) : [],
      isCustom: Boolean(profile.isCustom || !Object.prototype.hasOwnProperty.call(BASE_CLASS_FLAVOR_PROFILES, id))
    };
  }

  function upsertClassFlavorProfile(profile) {
    const normalized = normalizeClassFlavorProfile(profile);
    if (!normalized) return null;
    if (!Array.isArray(state.classFlavorProfiles)) {
      state.classFlavorProfiles = [];
    }
    const existingIndex = state.classFlavorProfiles.findIndex((entry) => entry && entry.id === normalized.id);
    if (existingIndex >= 0) {
      state.classFlavorProfiles[existingIndex] = normalized;
    } else {
      state.classFlavorProfiles.push(normalized);
    }
    return normalized;
  }

  function createUniqueClassFlavorId(label) {
    const base = slugify(label || "new_class") || "new_class";
    const map = getClassFlavorProfileMap();
    if (!map.has(base)) return base;
    let index = 2;
    while (map.has(`${base}_${index}`)) {
      index += 1;
    }
    return `${base}_${index}`;
  }

  function getSkillIconHintPath(skillId) {
    const key = String(skillId || "").trim();
    if (!key) return "";
    return normalizePath(SKILL_ICON_PATH_HINTS_BY_ID[key] || "");
  }

  function extractDirName(pathValue) {
    const normalized = normalizePath(pathValue);
    if (!normalized) return "";
    const parts = normalized.split("/");
    if (parts.length <= 1) return "";
    return parts.slice(0, -1).join("/");
  }

  function extractBaseNameWithoutExt(pathValue) {
    const normalized = normalizePath(pathValue);
    if (!normalized) return "";
    const parts = normalized.split("/");
    const fileName = parts[parts.length - 1] || "";
    return slugify(fileName.replace(/\.[a-z0-9]+$/i, ""));
  }

  function getNextVersionNumber(versions) {
    if (!Array.isArray(versions) || !versions.length) return "v01";
    let max = 0;
    versions.forEach((version) => {
      const match = String(version.versionNumber || "").match(/^v(\d+)$/i);
      if (!match) return;
      const number = Number(match[1]);
      if (Number.isFinite(number) && number > max) max = number;
    });
    return `v${String(max + 1).padStart(2, "0")}`;
  }

  function compareVersionNumber(a, b) {
    const an = Number(String(a || "").replace(/^v/i, "")) || 0;
    const bn = Number(String(b || "").replace(/^v/i, "")) || 0;
    return an - bn;
  }

  function normalizeVersionNumber(value, fallbackIndex) {
    const raw = String(value || "").trim().toLowerCase();
    if (/^v\d+$/.test(raw)) return `v${raw.slice(1).padStart(2, "0")}`;
    return `v${String(Number(fallbackIndex || 1)).padStart(2, "0")}`;
  }

  function hasKnownExtension(pathValue) {
    const lower = String(pathValue || "").toLowerCase();
    return EXTENSIONS.some((ext) => lower.endsWith(ext));
  }

  function saveState() {
    const payload = {
      classFlavorProfiles: state.classFlavorProfiles,
      builder: state.builder,
      skills: state.skills,
      selectedSkillId: state.selectedSkillId,
      skillSearchTerm: state.skillSearchTerm,
      promptLinkSkillSearchTerm: state.promptLinkSkillSearchTerm,
      promptLinkSkillId: state.promptLinkSkillId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function loadJson(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function isAccordionHeaderInteractiveTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    return Boolean(target.closest("select, input, textarea, button, a, label"));
  }

  function initializeSkillEntryAccordion() {
    if (!dom.skillEntryPanel) return;
    const startsExpanded = !dom.skillEntryPanel.classList.contains("collapsed");
    setSkillEntryExpanded(startsExpanded);
  }

  function onSkillEntryHeaderClick(event) {
    if (isAccordionHeaderInteractiveTarget(event && event.target)) return;
    toggleSkillEntryExpanded();
  }

  function onSkillEntryHeaderKeyDown(event) {
    const key = String(event && event.key || "");
    if (key !== "Enter" && key !== " ") return;
    event.preventDefault();
    toggleSkillEntryExpanded();
  }

  function toggleSkillEntryExpanded() {
    if (!dom.skillEntryPanel) return;
    const isExpanded = !dom.skillEntryPanel.classList.contains("collapsed");
    setSkillEntryExpanded(!isExpanded);
  }

  function setSkillEntryExpanded(isExpanded) {
    if (!dom.skillEntryPanel || !dom.skillEntryHeader) return;
    dom.skillEntryPanel.classList.toggle("collapsed", !isExpanded);
    dom.skillEntryHeader.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    if (dom.skillEntryContent) dom.skillEntryContent.hidden = !isExpanded;
    if (dom.skillEntryChevron) dom.skillEntryChevron.textContent = isExpanded ? "v" : ">";
  }

  function formatTimestampForDisplay(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleString();
  }

  function makeId(prefix) {
    const salt = Math.random().toString(36).slice(2, 10);
    return `${prefix}_${Date.now().toString(36)}_${salt}`;
  }

  function parseTagString(raw) {
    return String(raw || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  function inferClassRulesTemplateScope() {
    const selectedSkill = getSelectedSkillEntry();
    if (selectedSkill) {
      return String(selectedSkill.scope || "").trim().toLowerCase() === "weapon" ? "weapon" : "class";
    }
    return resolveClassFlavorId(state.builder.classFlavorId || state.builder.classFlavor) === "weapon"
      ? "weapon"
      : "class";
  }

  function getBuiltInScopePrompt(scope) {
    const resolvedScope = String(scope || "").trim().toLowerCase() === "weapon" ? "weapon" : "class";
    return String(BUILT_IN_SCOPE_PROMPTS[resolvedScope] || "");
  }

  function getBuiltInScopeStyleTags(scope) {
    const resolvedScope = String(scope || "").trim().toLowerCase() === "weapon" ? "weapon" : "class";
    return Array.isArray(BUILT_IN_SCOPE_STYLE_TAGS[resolvedScope]) ? BUILT_IN_SCOPE_STYLE_TAGS[resolvedScope].slice() : [];
  }

  function joinTags(tags) {
    return Array.isArray(tags) ? tags.join(", ") : "";
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_{2,}/g, "_");
  }

  function titleCaseFromId(id) {
    return String(id || "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (match) => match.toUpperCase());
  }

  function normalizePath(value) {
    const input = String(value || "").trim();
    if (!input) return "";
    let normalized = input.replace(/\\/g, "/");

    const lower = normalized.toLowerCase();
    const assetsIndex = lower.indexOf("/assets/");
    if (assetsIndex >= 0) {
      normalized = normalized.slice(assetsIndex + 1);
    }
    const skillsIndex = lower.indexOf("/skills/");
    if (skillsIndex >= 0 && !normalized.toLowerCase().includes("assets/skills/")) {
      const after = normalized.slice(skillsIndex + 1);
      if (!after.toLowerCase().startsWith("assets/")) normalized = after;
    }

    normalized = normalized.replace(/^\.?\//, "");
    normalized = normalized.replace(/\/{2,}/g, "/");
    return normalized;
  }

  function normalizeSkillTier(value) {
    return String(value || "").trim().toLowerCase() === "elite" ? "elite" : "normal";
  }

  function getSkillTier(entry) {
    if (!entry || typeof entry !== "object") return "normal";
    return normalizeSkillTier(entry.skillTier || (entry.isElite ? "elite" : "normal"));
  }

  function dedupe(values) {
    const seen = new Set();
    const result = [];
    values.forEach((value) => {
      const key = String(value || "").trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      result.push(key);
    });
    return result;
  }

  function pickExistingId(id, items) {
    const raw = String(id || "");
    if (!raw) return "";
    const match = Array.isArray(items) ? items.find((item) => item && item.id === raw) : null;
    return match ? raw : "";
  }
})();
