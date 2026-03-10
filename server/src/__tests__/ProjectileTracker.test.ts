import { describe, it, expect, beforeEach } from 'vitest'
import { ProjectileTracker } from '../game/ProjectileTracker.js'

describe('ProjectileTracker', () => {
  let tracker: ProjectileTracker

  beforeEach(() => {
    tracker = new ProjectileTracker()
  })

  describe('ID generation', () => {
    it('should generate unique combat projectile IDs', () => {
      expect(tracker.nextCombatProjectileId()).toBe('proj-1')
      expect(tracker.nextCombatProjectileId()).toBe('proj-2')
      expect(tracker.nextCombatProjectileId()).toBe('proj-3')
    })

    it('should generate unique skill projectile IDs', () => {
      expect(tracker.nextSkillProjectileId()).toBe('skill-proj-1')
      expect(tracker.nextSkillProjectileId()).toBe('skill-proj-2')
    })

    it('should generate unique tower projectile IDs', () => {
      expect(tracker.nextTowerProjectileId()).toBe('tower-proj-1')
      expect(tracker.nextTowerProjectileId()).toBe('tower-proj-2')
    })

    it('should maintain independent counters per type', () => {
      tracker.nextCombatProjectileId() // proj-1
      tracker.nextSkillProjectileId()  // skill-proj-1
      tracker.nextTowerProjectileId()  // tower-proj-1
      expect(tracker.nextCombatProjectileId()).toBe('proj-2')
      expect(tracker.nextSkillProjectileId()).toBe('skill-proj-2')
      expect(tracker.nextTowerProjectileId()).toBe('tower-proj-2')
    })
  })

  describe('distance tracking', () => {
    it('should return 0 for unknown projectile', () => {
      expect(tracker.getDistanceTraveled('unknown')).toBe(0)
    })

    it('should store and retrieve distance traveled', () => {
      tracker.setDistanceTraveled('proj-1', 150)
      expect(tracker.getDistanceTraveled('proj-1')).toBe(150)
    })

    it('should update distance traveled', () => {
      tracker.setDistanceTraveled('proj-1', 100)
      tracker.setDistanceTraveled('proj-1', 250)
      expect(tracker.getDistanceTraveled('proj-1')).toBe(250)
    })
  })

  describe('hit set tracking', () => {
    it('should create empty hit set for new projectile', () => {
      const hitSet = tracker.getHitSet('proj-1')
      expect(hitSet.size).toBe(0)
    })

    it('should return same set on repeated access', () => {
      const set1 = tracker.getHitSet('proj-1')
      set1.add('enemy-1')
      const set2 = tracker.getHitSet('proj-1')
      expect(set2.has('enemy-1')).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('should remove distance and hit set for projectile', () => {
      tracker.setDistanceTraveled('proj-1', 200)
      tracker.getHitSet('proj-1').add('enemy-1')

      tracker.cleanupTracking('proj-1')

      expect(tracker.getDistanceTraveled('proj-1')).toBe(0)
      expect(tracker.getHitSet('proj-1').size).toBe(0)
    })

    it('should not affect other projectiles', () => {
      tracker.setDistanceTraveled('proj-1', 100)
      tracker.setDistanceTraveled('proj-2', 200)

      tracker.cleanupTracking('proj-1')

      expect(tracker.getDistanceTraveled('proj-2')).toBe(200)
    })
  })

  describe('room isolation', () => {
    it('should maintain independent state per instance', () => {
      const tracker2 = new ProjectileTracker()

      expect(tracker.nextCombatProjectileId()).toBe('proj-1')
      expect(tracker2.nextCombatProjectileId()).toBe('proj-1')

      tracker.setDistanceTraveled('proj-1', 100)
      expect(tracker2.getDistanceTraveled('proj-1')).toBe(0)
    })
  })
})
