# PRD: Quest System + Unlockable Magnet Pickup

## Objective

Add a new **Quest** tab to character progression and use it to introduce the first unlockable gameplay power-up.

The first quest should:

- track permanent character progression
- complete when the player reaches **100 Legacy XP**
- reward the player with a new unlockable pickup:
  - **Magnet**

The Magnet should then become part of the gameplay drop pool and appear rarely during runs.

For now, this PRD only covers:
- quest system foundation
- first quest
- first unlockable power-up
- magnet drop behavior

Do not add other quests or power-ups yet.

---

## Design Goals

- Create a clear progression layer outside of runs
- Make quests feel tied to long-term character advancement
- Introduce unlockable run modifiers in a controlled way
- Keep the first reward simple, readable, and satisfying
- Build a structure that can support many future quests

---

## High-Level System

Add a new tab to the character progression UI:

- Weapons
- Attributes or Class
- Inventory
- Merchant
- **Quests** (new)

The Quests tab should show:
- available quests
- progress toward completion
- whether a reward is ready to claim
- whether a reward has been claimed

Quests are tied to character progression and should persist.

---

## First Quest

### Quest Name
Choose a simple readable name such as:

- First Legacy
- Magnetic Pull
- Lesson of Attraction
- Legacy Awakening

A good default for MVP:
- **Magnetic Pull**

---

## First Quest Requirement

The first quest is completed when the character reaches:

- **100 Legacy XP**

This is based on the character’s persistent Legacy XP total, not run XP.

---

## First Quest Reward

When the quest is completed and the player claims the reward, they unlock:

- **Magnet pickup**

This unlock should be permanent for that character progression profile.

Once unlocked:
- Magnet can begin dropping during runs
- before unlock, Magnet cannot appear at all

---

## Reward Claiming Rule

Quest completion and reward claim should be separate.

Flow:

1. Player reaches 100 Legacy XP
2. Quest becomes marked as completed
3. Reward becomes available to claim
4. Player opens Quests tab
5. Player clicks Claim Reward
6. Magnet unlock is applied permanently

Do not auto-claim the reward.
Claiming it manually makes the progression feel clearer.

---

## Quest UI Requirements

## Quests Tab Layout

The Quests tab should show a quest list or quest cards.

Each quest entry should display:

- quest name
- short description
- progress
- status
- reward
- claim button if available

---

## First Quest Display Content

### Title
Magnetic Pull

### Description
Reach 100 Legacy XP

### Progress
Show current Legacy XP progress toward 100

Examples:
- 42 / 100 Legacy XP
- 100 / 100 Legacy XP

### Reward
Unlocks Magnet pickup

### States
- Locked / In Progress
- Complete – Reward Ready
- Claimed

---

## Visual States

### In Progress
- progress bar or progress text
- claim button hidden or disabled

### Complete, Not Claimed
- highlighted state
- claim button enabled

### Claimed
- clearly marked complete
- claim button removed or disabled
- reward shown as unlocked

---

## Magnet Pickup Overview

The Magnet is a rare in-run pickup.

When the player touches it:

- all currently available XP pickups on the map are pulled rapidly toward the player
- the player collects them in a short burst

For MVP:
- Magnet affects **currently spawned XP pickups**
- it does not need to affect future XP drops after pickup

This is a strong, clear first implementation and aligns with common survivor-style vacuum pickups. :contentReference[oaicite:1]{index=1}

---

## Magnet Visual

For now, use a simple placeholder SVG.

Recommended placeholder:
- ring or circular icon
- light green color
- readable from the battlefield
- distinct from XP gems and gold

Do not spend time on final art.
This is a functional placeholder.

---

## Magnet Gameplay Behavior

### On Spawn
- appears in the world like a pickup
- remains visible until picked up or despawn rules are applied

### On Pickup
- all active XP pickups on the map begin moving toward the player
- movement should be fast and visually satisfying
- once they reach the player, they are collected normally

### Effect Scope
For MVP:
- only affects XP
- does not affect gold
- does not affect items
- does not affect future drops created after pickup

This keeps the behavior simple and easy to understand.

---

## Magnet Drop Eligibility

The Magnet should only be eligible to drop if:

- the player has claimed the Magnet quest reward

Before that:
- it should never appear in runs

---

## Magnet Drop Frequency

The Magnet should be rare.

Design target:
- not guaranteed in a run
- may not appear at all in some runs
- on average, roughly one drop every **5 to 10 minutes** is a reasonable starting target for tuning

This should be treated as an adjustable design target, not a locked number.

Reasoning:
- survivor-style vacuum pickups are strongest when they feel like a moment of relief or payoff, not constant automation
- overly frequent magnets reduce the value of movement and pickup routing
- rare magnets create memorable bursts of progression without trivializing collection gameplay :contentReference[oaicite:2]{index=2}

---

## Magnet Drop System Rules

### General Rule
The Magnet should use a low random drop chance during gameplay once unlocked.

### Suggested MVP Approach
Use one of these approaches:

#### Option A: Time-Weighted Random Drop
- periodically check whether a magnet should drop
- low chance per check
- chance can gently increase the longer it has been since the last magnet

#### Option B: Enemy-Death-Based Rare Roll
- rare chance from enemy deaths after unlock
- with a minimum cooldown between magnet drops

Recommended MVP:
- use a simple low-frequency timed or weighted drop system
- avoid tying it to every enemy death if that causes noisy tuning

---

## Magnet Spawn Constraints

To keep drops fair and readable:

- do not spawn directly on top of player
- do not spawn off-screen too far away
- do not allow multiple magnets to pile up frequently

Recommended rules:
- only one magnet may exist at a time
- do not spawn a new magnet if one is already active on the ground
- apply a cooldown after pickup before another can spawn

---

## Magnet Collection Feel

The effect should feel:

- immediate
- rewarding
- visually clear
- easy to understand

The player should clearly see:
- XP from across the current map rushing inward
- a satisfying burst of progression
- possible level-up chain reaction if enough XP was waiting

This is one of the main emotional rewards of the feature.

---

## Interaction With Existing Systems

The Magnet must work with:

- XP drop system
- player-centered world movement
- pickup logic
- level-up system
- quest unlock persistence

It should not break:
- normal pickup collection
- XP storage on map
- existing run pacing

---

## Data Structure Guidance

## Quest Data

Each quest should conceptually store:

- quest id
- quest name
- description
- requirement type
- requirement target
- current progress
- completed status
- reward type
- claimed status

---

## First Quest Data Needs

For the first quest, track:

- requirement type: legacy XP total
- target: 100
- reward type: unlock pickup
- reward id: magnet

---

## Character Progression Data

Character save data should support:

- unlocked pickups
- quest completion states
- quest claimed states

For this first feature, the important persistent flag is:

- Magnet unlocked: true or false

---

## Gameplay Pickup Data

Magnet should be added to the pickup system as a new pickup type.

Pickup types now conceptually include:
- XP
- Gold
- Magnet

The magnet should have:
- pickup id
- spawn rules
- icon / visual
- effect on pickup

---

## Tuning Controls

Make these values easy to tune later:

### Quest Tuning
- Legacy XP target for first quest

### Magnet Spawn Tuning
- unlocked required: yes
- average intended drop frequency
- minimum time between magnet spawns
- maximum active magnets on map
- spawn chance logic

### Magnet Effect Tuning
- pull speed
- pickup attraction duration if needed
- whether it affects only current XP or also future XP during a brief window

For MVP:
- start with current XP only
- keep it simple

---

## Recommended MVP Rules

To keep implementation focused, use these starting rules:

- Quest unlocks at 100 Legacy XP
- Player must claim reward manually
- Claiming reward permanently unlocks Magnet
- Magnet may now drop during runs
- Magnet is rare
- Only one may be active at a time
- Touching it pulls all currently spawned XP to the player
- Gold and items are unaffected

This is enough for a satisfying first version.

---

## Future Expansion Hooks

This system should be built so future quests can unlock:

- new pickups
- passive systems
- new item pools
- new merchant features
- level access
- class features
- gameplay modifiers

Future pickup unlock examples:
- healing orb
- temporary shield
- rage burst pickup
- gold vacuum
- time slow pickup

Do not implement these now.
Just keep the system extensible.

---

## Edge Cases

### Quest Completed Before Tab Is Opened
- quest should still show completed and reward ready

### Reward Already Claimed
- do not allow duplicate unlocks

### Magnet Not Yet Unlocked
- no magnet drops should occur

### Multiple Magnets
- do not allow magnet spam
- only one active at a time for MVP

### No XP On Map
If player picks up Magnet and there is little or no XP currently on the map:
- effect still triggers
- no error
- pickup is consumed normally

---

## Acceptance Criteria

This feature is complete when:

1. A new Quests tab exists in character progression
2. The first quest is visible there
3. The first quest tracks progress toward 100 Legacy XP
4. Reaching 100 Legacy XP marks the quest complete
5. The reward must be manually claimed
6. Claiming the reward unlocks the Magnet pickup permanently
7. Magnet cannot drop before it is unlocked
8. Magnet can drop rarely during runs after unlock
9. Magnet uses a simple placeholder visual
10. Touching the Magnet pulls all current XP pickups toward the player
11. The system is persistent and future-safe for more quests and more unlockable pickups

---

## Deliverable

Implement:

- Quest tab
- first quest based on 100 Legacy XP
- claimable reward flow
- Magnet unlock
- rare Magnet in-run drop logic
- Magnet XP vacuum effect

Output full updated project files with clean structure and readable logic.