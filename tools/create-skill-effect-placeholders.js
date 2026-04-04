const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EFFECTS_ROOT = path.join(ROOT, "assets", "skills", "effects");

// 1x1 transparent PNG
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBgJ6GfZkAAAAASUVORK5CYII=",
  "base64"
);

const SKILL_EFFECTS = {
  class: {
    barbarian: [
      "sever_artery",
      "blood_frenzy",
      "ground_slam",
      "war_cry",
      "berserk",
      "twin_swing"
    ]
  },
  weapon: {
    axe: ["cleave", "whirlwind", "widen_arc", "twin_swing"],
    sword: ["sever_artery", "twin_slash"],
    javelin: ["piercing_throw", "volley", "long_flight", "explosive_volley"],
    bow: ["power_shot", "volley"],
    shield: ["shield_bash", "fortify"]
  },
  general: ["generic_damage", "generic_cooldown", "damage_increase", "cooldown_reduction", "damage_reduction"]
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writePlaceholderPng(filePath) {
  if (fs.existsSync(filePath)) return false;
  fs.writeFileSync(filePath, TRANSPARENT_PNG);
  return true;
}

function main() {
  ensureDir(EFFECTS_ROOT);

  let createdCount = 0;
  let existingCount = 0;

  const createdFiles = [];

  Object.entries(SKILL_EFFECTS.class).forEach(([classId, skills]) => {
    const dir = path.join(EFFECTS_ROOT, "class", classId);
    ensureDir(dir);
    skills.forEach((skillId) => {
      const filename = `${skillId}_effect.png`;
      const filePath = path.join(dir, filename);
      if (writePlaceholderPng(filePath)) {
        createdCount += 1;
        createdFiles.push(path.relative(ROOT, filePath));
      } else {
        existingCount += 1;
      }
    });
  });

  Object.entries(SKILL_EFFECTS.weapon).forEach(([weaponId, skills]) => {
    const dir = path.join(EFFECTS_ROOT, "weapon", weaponId);
    ensureDir(dir);
    skills.forEach((skillId) => {
      const filename = `${skillId}_effect.png`;
      const filePath = path.join(dir, filename);
      if (writePlaceholderPng(filePath)) {
        createdCount += 1;
        createdFiles.push(path.relative(ROOT, filePath));
      } else {
        existingCount += 1;
      }
    });
  });

  const generalDir = path.join(EFFECTS_ROOT, "general");
  ensureDir(generalDir);
  SKILL_EFFECTS.general.forEach((skillId) => {
    const filename = `${skillId}_effect.png`;
    const filePath = path.join(generalDir, filename);
    if (writePlaceholderPng(filePath)) {
      createdCount += 1;
      createdFiles.push(path.relative(ROOT, filePath));
    } else {
      existingCount += 1;
    }
  });

  console.log(`Created ${createdCount} skill effect placeholder(s).`);
  console.log(`Already existed: ${existingCount}.`);
  if (createdFiles.length) {
    console.log("New files:");
    createdFiles.forEach((file) => console.log(`- ${file}`));
  }
}

main();
