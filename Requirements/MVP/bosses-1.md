# 🧾 PRD: Mini-Boss System (Necromancer Class) – MVP

## 1. Overview

This feature introduces **mini-boss encounters** with class-based abilities to create more engaging and skill-driven gameplay moments.

For MVP:
- Implement **Necromancer mini-boss**
- Introduce **boss skill casting system**
- Add **boss UI (health + cast bar)**
- Add **arena enclosure mechanic**
- Create **2 core abilities**
- Enable **player interaction (movement + future interrupt hooks)**

---

## 2. Goals

- Make mini-boss encounters feel **distinct and dangerous**
- Introduce **telegraphed attacks** (learnable patterns)
- Lay foundation for:
  - Boss classes (mage, barbarian, etc.)
  - Interrupt mechanics
  - Status effects
- Prevent players from **kiting indefinitely**

---

## 3. Core Systems

### 3.1 Boss Entity Structure

Each boss should follow a structured schema:

- `name`: string  
- `class`: string (e.g. `"Necromancer"`)  
- `type`: `"mini-boss"` | `"boss"`  
- `maxHealth`: number  
- `currentHealth`: number  
- `abilities`: array of ability objects  
- `currentAbility`: ability | null  
- `castStartTime`: timestamp  
- `castDuration`: number (ms)  
- `state`: `"idle"` | `"casting"` | `"cooldown"`  
- `cooldownTimer`: number  
- `arenaActive`: boolean  

---

### 3.2 Ability Structure

Each ability should follow:

- `id`: string  
- `name`: string  
- `castTime`: number (ms)  
- `cooldown`: number (ms)  
- `telegraphType`: `"area"` | `"line"` | `"spawn"`  
- `effect`: function handler  
- `visualIndicator`: function handler  

---

## 4. Mini-Boss: Necromancer (MVP)

### 4.1 Identity

- **Class:** Necromancer  
- **Role:** Summoner / Ranged caster  

### 4.2 Behavior

- Alternates between summoning and targeted attacks  
- Always casting or preparing next ability  

---

## 5. Abilities (MVP)

### 5.1 Summon Undead

**Description:**  
Summons a ring of skeleton enemies at arena perimeter that move inward toward player.

**Specs:**
- `castTime`: 2000ms  
- `cooldown`: 5000ms  
- `telegraphType`: `"spawn"`  

**Behavior:**
1. Boss begins cast (2s)  
2. Visual indicator appears around arena edge  
3. On completion:
   - Spawn enemies evenly spaced in a circle  
   - Enemies path toward player  

**Enemy Type:**
- Basic skeleton units (reuse existing enemy logic)

---

### 5.2 Ray of Sickness

**Description:**  
A targeted beam attack that damages player if not avoided.

**Specs:**
- `castTime`: 1500ms  
- `cooldown`: 3000ms  
- `telegraphType`: `"line"`  

**Behavior:**
1. Boss targets player position at cast start  
2. Draw **line indicator** from boss → target  
3. Line persists during cast duration  
4. Final 200ms → increase brightness (warning flash)  
5. On cast completion:
   - Fire beam  
   - If player intersects → apply damage  

---

## 6. Boss AI Logic

### 6.1 Ability Loop

Basic rotation:
while (boss alive):
if not casting:
pick next ability (random or alternating)
begin cast
if casting complete:
execute ability
enter cooldown

---

### 6.2 Priority (MVP)

- Alternate abilities OR random selection  
- No advanced weighting yet  

---

## 7. Boss UI

### 7.1 Health Bar (Top of Screen)

Display:
- Boss Name  
- Boss Class (e.g. "Necromancer")  
- Health bar  

**Example:**
[Necromancer] - Bonecaller Xath
[██████████------]


---

### 7.2 Cast Bar

Displayed below health bar:

- Shows:
  - Ability name  
  - Cast progress (left → right)  

**Example:**
Casting: Ray of Sickness
[██████------]


---

## 8. Arena Enclosure System

### 8.1 Purpose

Prevent player from escaping boss fight indefinitely.

---

### 8.2 Behavior

When boss spawns:

- Activate arena  
- Define boundary:
  - Size ≈ **2x screen area**  
- Player cannot exit bounds  

---

### 8.3 MVP Visual

- Simple **red rectangular boundary**  
- Collision prevents player movement beyond edge  

---

### 8.4 Future Expansion (Not in MVP)

- Bone walls  
- Animated barriers  
- Shrinking arenas  
- Environmental hazards  

---

## 9. Player Interaction Hooks (Future-Proofing)

Even if not implemented yet, design system to support:

- Interrupt abilities  
- Cast delay effects  
- Slows / debuffs on boss  
- Dodge-based gameplay  

---

## 10. Visual Feedback Requirements

### 10.1 Telegraphing (Critical)

All abilities must clearly signal:

- Where damage will occur  
- When it will occur  

---

### 10.2 Indicators

| Type         | Visual                     |
|--------------|--------------------------|
| Line Attack  | Thin line → bright flash |
| Spawn        | Circle at perimeter      |
| Cast         | UI cast bar              |

---

## 11. State Flow
Idle → Casting → Execute → Cooldown → Idle


---

## 12. MVP Scope Checklist

### Required

- [ ] Boss entity system  
- [ ] Ability system  
- [ ] Necromancer mini-boss  
- [ ] Summon Undead ability  
- [ ] Ray of Sickness ability  
- [ ] Boss health bar UI  
- [ ] Cast bar UI  
- [ ] Arena enclosure (red boundary)  
- [ ] Enemy spawn ring logic  
- [ ] Line telegraph + damage system  

---

### Not Required (Later)

- Interrupt mechanics  
- Advanced AI logic  
- Multiple boss classes  
- Status effects  
- Complex visuals  

---

## 13. Success Criteria

- Player recognizes:
  - Incoming attacks  
  - Need to dodge  

- Boss feels:
  - More dangerous than normal enemies  
  - Mechanically distinct  

- Player cannot:
  - Escape encounter easily  

- Fight creates:
  - Movement pressure  
  - Awareness of timing  

---

## 14. Notes for Codex

- Keep implementation **modular**  
- Abilities should be **data-driven**  
- Avoid hardcoding boss logic  
- Build for reuse with future boss classes  