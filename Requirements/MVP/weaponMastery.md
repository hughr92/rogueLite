## Weapon Mastery for Equipped Weapons

### Summary
Add persistent, item-instance weapon mastery that grows from kill usage and grants flat damage bonuses by tier.  
Mastery applies only to equipped combat weapons (primary melee and ranged), progresses on kill sources during runs, updates damage immediately when tiers unlock, and persists across inventory/sell/buyback because it is stored on the item itself.

### Implementation Changes
- Add a global mastery config (exported in runtime data) with decision-locked values:
  - Tier count by rarity: `grey=1, blue=2, purple=3, gold=4, green=5`.
  - Total-kill pacing (medium curve): `grey~100, blue~350, purple~900, gold~1800, green~3200`.
  - Per-tier flat bonus by rarity: `grey+1, blue+1, purple+2, gold+2, green+3`.
  - Per-rarity cumulative tier thresholds (explicit arrays so no runtime guesswork), chosen to match totals and “later tiers are harder”.
- Extend item model for weapon instances with normalized mastery state:
  - `item.mastery = { killsTotal, tiersUnlocked }` for melee/ranged items.
  - Non-weapon items keep `mastery` absent/null.
  - Existing items from old saves are backfilled on normalize.
- Add save-layer mutation API for run-end mastery persistence:
  - `applyWeaponMasteryProgress(characterId, progressByInstanceId)`:
    - Locates matching inventory/equipped item instances by `instanceId`.
    - Adds gained kills, recomputes unlocked tiers from config, clamps to rarity cap.
    - Keeps mastery when items are sold and bought back (same instance state retained).
- Add run-time mastery binding and source attribution:
  - Bind melee mastery target to `primaryMeleeWeapon` (fallback to secondary only if primary is not a valid melee weapon).
  - Bind ranged mastery target to `rangedWeapon`.
  - Tag combat kills by source (`melee` from axe swings, `ranged` from javelin direct + splash).
  - Increment mastery progress on killing blow only, update tier in-run, and immediately recalc weapon stats when tier increases.
- Apply mastery bonus in damage calculation **before multipliers**:
  - Axe/Javelin damage uses `(baseDamage + masteryFlatBonus) * existingMultipliers`.
  - Preserves all current attribute/upgrade/rage/fury scaling behavior.
- UI updates (Inventory + Merchant):
  - Show mastery line for weapon items in equipment/storage/shop/buyback cards:
    - Format example: `Mastery T1/3 • 220/480 kills • +2 dmg`.
  - For non-weapons, no mastery line.
  - For unmastered weapons, show tier 0 progress toward next threshold.
- Keep economy behavior unchanged:
  - Mastery does **not** alter merchant price formulas (buy/sell/buyback pricing remains stat-budget-based as-is).

### Public/API & Data Interface Additions
- New exported config block for weapon mastery values and thresholds.
- New save API function:
  - `applyWeaponMasteryProgress(characterId, progressByInstanceId) -> { ok, character? , error? }`
- Item schema extension (weapon instances):
  - `mastery.killsTotal: number`
  - `mastery.tiersUnlocked: number`

### Test Plan
- Progression + tiers:
  - Grey weapon reaches tier cap at ~100 kills.
  - Blue/purple/gold/green unlock correct tier counts and stop at cap.
  - Higher rarities require more total kills than lower rarities.
- Source correctness:
  - Axe kills only progress melee-bound equipped weapon.
  - Javelin direct and splash kills progress ranged-bound equipped weapon.
  - Non-player or untagged kills do not progress mastery.
- Damage application:
  - Tier unlock immediately increases run DPS (same run) and uses pre-multiplier behavior.
  - Rage/attribute/upgrade multipliers still stack as before.
- Persistence:
  - Mastery survives run end, reload, moving between equipment/storage, selling and buying back.
  - New drops start with zero mastery.
- UI:
  - Mastery line appears in inventory/equipment and merchant/buyback weapon cards.
  - Non-weapon cards remain unchanged.
- Safety/regression:
  - Legacy items without mastery load safely.
  - No breakage in merchant stock generation, buy/sell/buyback, or existing loot flow.

### Assumptions Locked
- Melee mastery target: **primary melee slot for now**.
- Bonus type: **flat damage**.
- Curve: **medium** (grey around 100, green in the thousands).
- Per-tier bonus: **rarity-weighted** (`+1/+1/+2/+2/+3` for grey/blue/purple/gold/green).
- Apply stage: **before multipliers**.
- UI scope: **Inventory + Merchant**.
- Sell/buyback behavior: **mastery retained on the item instance**.
