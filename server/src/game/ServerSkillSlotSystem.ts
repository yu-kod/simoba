import type { SkillSlot } from '@shared/talents/types'
import type { HeroSchema } from '../schema/HeroSchema.js'

function hasOwnedSkill(hero: HeroSchema, skillId: string): boolean {
  for (let i = 0; i < hero.ownedSkills.length; i++) {
    if (hero.ownedSkills.at(i) === skillId) return true
  }
  return false
}

function removeOwnedSkill(hero: HeroSchema, skillId: string): void {
  for (let i = 0; i < hero.ownedSkills.length; i++) {
    if (hero.ownedSkills.at(i) === skillId) {
      hero.ownedSkills.splice(i, 1)
      return
    }
  }
}

function getSlotValue(hero: HeroSchema, slot: SkillSlot): string {
  switch (slot) {
    case 'Q': return hero.skillSlotQ
    case 'E': return hero.skillSlotE
    case 'R': return hero.skillSlotR
  }
}

function setSlotValue(hero: HeroSchema, slot: SkillSlot, value: string): void {
  switch (slot) {
    case 'Q': hero.skillSlotQ = value; break
    case 'E': hero.skillSlotE = value; break
    case 'R': hero.skillSlotR = value; break
  }
}

/**
 * Assign a skill to an empty slot. Allowed anywhere on the map.
 * Returns true if assignment succeeded.
 */
export function assignSkillSlot(
  hero: HeroSchema,
  skillId: string,
  slot: SkillSlot,
): boolean {
  if (!hasOwnedSkill(hero, skillId)) return false
  if (getSlotValue(hero, slot) !== '') return false
  setSlotValue(hero, slot, skillId)
  removeOwnedSkill(hero, skillId)
  return true
}

/**
 * Swap skills between two slots. Only allowed in base.
 * Returns true if swap succeeded.
 */
export function swapSkillSlots(
  hero: HeroSchema,
  slotA: SkillSlot,
  slotB: SkillSlot,
  isInBase: boolean,
): boolean {
  if (!isInBase) return false
  if (slotA === slotB) return false
  const valA = getSlotValue(hero, slotA)
  const valB = getSlotValue(hero, slotB)
  setSlotValue(hero, slotA, valB)
  setSlotValue(hero, slotB, valA)
  return true
}

/**
 * Remove a skill from a slot (move back to owned skills). Only allowed in base.
 * Returns true if unequip succeeded.
 */
export function unequipSkillSlot(
  hero: HeroSchema,
  slot: SkillSlot,
  isInBase: boolean,
): boolean {
  if (!isInBase) return false
  const skillId = getSlotValue(hero, slot)
  if (skillId === '') return false
  setSlotValue(hero, slot, '')
  hero.ownedSkills.push(skillId)
  return true
}
