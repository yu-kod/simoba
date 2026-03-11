import { describe, it, expect, vi } from 'vitest'
import { NetworkBridge } from '@/scenes/NetworkBridge'
import type { GameMode, ServerHeroState, ServerZoneState } from '@/network/GameMode'

function createMockGameMode(): GameMode & {
  _triggerServerHeroUpdate: (state: ServerHeroState) => void
  _triggerServerHeroRemove: (sessionId: string) => void
  _triggerServerZoneAdd: (state: ServerZoneState) => void
  _triggerServerZoneRemove: (zoneId: string) => void
} {
  let heroUpdateCb: ((state: ServerHeroState) => void) | null = null
  let heroRemoveCb: ((sessionId: string) => void) | null = null
  let zoneAddCb: ((state: ServerZoneState) => void) | null = null
  let zoneRemoveCb: ((zoneId: string) => void) | null = null

  return {
    localSessionId: 'local-1',
    onSceneCreate: vi.fn().mockResolvedValue(undefined),
    sendInput: vi.fn(),
    onServerHeroUpdate: (cb) => { heroUpdateCb = cb },
    onServerHeroRemove: (cb) => { heroRemoveCb = cb },
    onServerTowerUpdate: vi.fn(),
    onServerMinionUpdate: vi.fn(),
    onServerMinionRemove: vi.fn(),
    onServerProjectileUpdate: vi.fn(),
    onServerZoneAdd: (cb) => { zoneAddCb = cb },
    onServerZoneRemove: (cb) => { zoneRemoveCb = cb },
    onAttackEvent: vi.fn(),
    onDamageEvent: vi.fn(),
    onDeathEvent: vi.fn(),
    sendAcquireTalent: vi.fn(),
    sendAssignSkillSlot: vi.fn(),
    sendSwapSkillSlots: vi.fn(),
    sendUnequipSkillSlot: vi.fn(),
    sendUseSkill: vi.fn(),
    sendMaxLevel: vi.fn(),
    onSkillEvent: vi.fn(),
    onMatchEnd: vi.fn(),
    dispose: vi.fn(),
    _triggerServerHeroUpdate: (s) => heroUpdateCb?.(s),
    _triggerServerHeroRemove: (id) => heroRemoveCb?.(id),
    _triggerServerZoneAdd: (s) => zoneAddCb?.(s),
    _triggerServerZoneRemove: (id) => zoneRemoveCb?.(id),
  }
}

const HERO_STATE: ServerHeroState = {
  sessionId: 'sess-1',
  x: 400, y: 300, facing: 1.0,
  hp: 100, maxHp: 100,
  heroType: 'AURA', team: 'red', radius: 20,
  dead: false, attackTargetId: '', attackCooldown: 0,
  respawnTimer: 0, lastProcessedSeq: 0,
  xp: 0, level: 1, talentPoints: 0,
  acquiredTalents: [], ownedSkills: [],
  skillSlotQ: '', skillSlotE: '', skillSlotR: '',
  cooldownQ: 0, cooldownE: 0, cooldownR: 0, dashTimer: 0,
}

describe('NetworkBridge', () => {
  describe('setupCallbacks', () => {
    it('fires onServerHeroUpdated callback', () => {
      const gm = createMockGameMode()
      const onUpdated = vi.fn()
      const bridge = new NetworkBridge(gm, { onServerHeroUpdated: onUpdated })
      bridge.setupCallbacks()

      gm._triggerServerHeroUpdate(HERO_STATE)
      expect(onUpdated).toHaveBeenCalledWith(HERO_STATE)
    })

    it('fires onRemotePlayerRemoved callback on hero remove', () => {
      const gm = createMockGameMode()
      const onRemoved = vi.fn()
      const bridge = new NetworkBridge(gm, { onRemotePlayerRemoved: onRemoved })
      bridge.setupCallbacks()

      gm._triggerServerHeroRemove('sess-1')
      expect(onRemoved).toHaveBeenCalledWith('sess-1')
    })

    it('fires onServerZoneAdded callback on zone add', () => {
      const gm = createMockGameMode()
      const onAdded = vi.fn()
      const bridge = new NetworkBridge(gm, { onServerZoneAdded: onAdded })
      bridge.setupCallbacks()

      const zoneState: ServerZoneState = {
        id: 'zone-1', x: 300, y: 100, radius: 200,
        skillId: 'aura-slow-field', team: 'blue', followHeroId: '',
      }
      gm._triggerServerZoneAdd(zoneState)
      expect(onAdded).toHaveBeenCalledWith(zoneState)
    })

    it('fires onServerZoneRemoved callback on zone remove', () => {
      const gm = createMockGameMode()
      const onRemoved = vi.fn()
      const bridge = new NetworkBridge(gm, { onServerZoneRemoved: onRemoved })
      bridge.setupCallbacks()

      gm._triggerServerZoneRemove('zone-1')
      expect(onRemoved).toHaveBeenCalledWith('zone-1')
    })
  })

  describe('sendInput', () => {
    it('forwards input to GameMode', () => {
      const gm = createMockGameMode()
      const bridge = new NetworkBridge(gm)
      const input = { seq: 1, moveDir: { x: 1, y: 0 }, attackTargetId: null, facing: 0 }
      bridge.sendInput(input)
      expect(gm.sendInput).toHaveBeenCalledWith(input)
    })
  })

  describe('localSessionId', () => {
    it('returns GameMode localSessionId', () => {
      const gm = createMockGameMode()
      const bridge = new NetworkBridge(gm)
      expect(bridge.localSessionId).toBe('local-1')
    })
  })

  describe('dispose', () => {
    it('calls GameMode dispose', () => {
      const gm = createMockGameMode()
      const bridge = new NetworkBridge(gm)
      bridge.dispose()
      expect(gm.dispose).toHaveBeenCalled()
    })
  })
})
