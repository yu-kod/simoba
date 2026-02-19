import { describe, it, expect, vi } from 'vitest'
import { EntityManager } from '@/scenes/EntityManager'
import { CombatManager } from '@/scenes/CombatManager'
import { NetworkBridge } from '@/scenes/NetworkBridge'
import type { GameMode, RemotePlayerState } from '@/network/GameMode'

function createMockGameMode(): GameMode & {
  _triggerJoin: (state: RemotePlayerState) => void
  _triggerLeave: (sessionId: string) => void
  _triggerUpdate: (state: RemotePlayerState) => void
  _triggerDamage: (event: { targetId: string; amount: number; attackerId: string }) => void
  _triggerProjectileSpawn: (event: { ownerId: string; targetId: string; startPosition: { x: number; y: number }; damage: number; speed: number }) => void
} {
  let joinCb: ((state: RemotePlayerState) => void) | null = null
  let leaveCb: ((sessionId: string) => void) | null = null
  let updateCb: ((state: RemotePlayerState) => void) | null = null
  let damageCb: ((event: { targetId: string; amount: number; attackerId: string }) => void) | null = null
  let projectileCb: ((event: { ownerId: string; targetId: string; startPosition: { x: number; y: number }; damage: number; speed: number }) => void) | null = null

  return {
    isServerAuthoritative: false,
    localSessionId: null,
    onSceneCreate: vi.fn().mockResolvedValue(undefined),
    sendInput: vi.fn(),
    sendLocalState: vi.fn(),
    sendDamageEvent: vi.fn(),
    sendProjectileSpawn: vi.fn(),
    onRemotePlayerJoin: (cb) => { joinCb = cb },
    onRemotePlayerLeave: (cb) => { leaveCb = cb },
    onRemotePlayerUpdate: (cb) => { updateCb = cb },
    onRemoteDamage: (cb) => { damageCb = cb },
    onRemoteProjectileSpawn: (cb) => { projectileCb = cb },
    onServerHeroUpdate: vi.fn(),
    onServerHeroRemove: vi.fn(),
    onServerTowerUpdate: vi.fn(),
    onServerProjectileUpdate: vi.fn(),
    dispose: vi.fn(),
    _triggerJoin: (s) => joinCb?.(s),
    _triggerLeave: (id) => leaveCb?.(id),
    _triggerUpdate: (s) => updateCb?.(s),
    _triggerDamage: (e) => damageCb?.(e),
    _triggerProjectileSpawn: (e) => projectileCb?.(e),
  }
}

function createSetup() {
  const em = new EntityManager(
    { id: 'player-1', type: 'BLADE', team: 'blue', position: { x: 100, y: 200 } },
    { id: 'enemy-1', type: 'BLADE', team: 'red', position: { x: 300, y: 200 } }
  )
  const cm = new CombatManager(em)
  const gm = createMockGameMode()
  const bridge = new NetworkBridge(gm, em, cm)
  bridge.setupCallbacks()
  return { em, cm, gm, bridge }
}

const REMOTE: RemotePlayerState = {
  sessionId: 'sess-1',
  x: 400, y: 300, facing: 1.0,
  hp: 100, maxHp: 100,
  heroType: 'AURA', team: 'red',
}

describe('NetworkBridge', () => {
  describe('setupCallbacks', () => {
    it('adds remote player on join', () => {
      const { em, gm } = createSetup()
      gm._triggerJoin(REMOTE)
      expect(em.getEntity('sess-1')).not.toBeNull()
    })

    it('removes remote player on leave', () => {
      const { em, gm } = createSetup()
      gm._triggerJoin(REMOTE)
      gm._triggerLeave('sess-1')
      expect(em.getEntity('sess-1')).toBeNull()
    })

    it('updates remote player state', () => {
      const { em, gm } = createSetup()
      gm._triggerJoin(REMOTE)
      gm._triggerUpdate({ ...REMOTE, x: 500, y: 400, hp: 80 })
      const entity = em.getEntity('sess-1')
      expect(entity!.position).toEqual({ x: 500, y: 400 })
      expect(entity!.hp).toBe(80)
    })

    it('applies remote damage to enemy via unified path', () => {
      const { em, gm } = createSetup()
      gm._triggerDamage({ targetId: 'enemy-1', amount: 50, attackerId: 'sess-1' })
      expect(em.getEntity('enemy-1')!.hp).toBe(600) // 650 - 50
    })

    it('adds remote projectile on spawn event', () => {
      const { em, cm, gm } = createSetup()
      em.addRemotePlayer({
        sessionId: 'remote-shooter', x: 0, y: 0, facing: 0,
        hp: 100, maxHp: 100, heroType: 'BOLT', team: 'red',
      })
      gm._triggerProjectileSpawn({
        ownerId: 'remote-shooter',
        targetId: 'player-1',
        startPosition: { x: 0, y: 0 },
        damage: 45,
        speed: 600,
      })
      expect(cm.projectiles).toHaveLength(1)
    })
  })

  describe('sendLocalState', () => {
    it('sends current hero state through GameMode', () => {
      const { gm, bridge } = createSetup()
      bridge.sendLocalState()
      expect(gm.sendLocalState).toHaveBeenCalledTimes(1)
    })
  })

  describe('sendDamageEvent', () => {
    it('forwards damage event to GameMode', () => {
      const { gm, bridge } = createSetup()
      bridge.sendDamageEvent({ targetId: 'enemy-1', amount: 50 })
      expect(gm.sendDamageEvent).toHaveBeenCalledWith({ targetId: 'enemy-1', amount: 50 })
    })
  })

  describe('sendProjectileSpawn', () => {
    it('forwards projectile spawn to GameMode', () => {
      const { gm, bridge } = createSetup()
      const event = { targetId: 'enemy-1', startPosition: { x: 100, y: 200 }, damage: 45, speed: 600 }
      bridge.sendProjectileSpawn(event)
      expect(gm.sendProjectileSpawn).toHaveBeenCalledWith(event)
    })
  })

  describe('callbacks', () => {
    it('fires onRemotePlayerAdded callback', () => {
      const em = new EntityManager(
        { id: 'player-1', type: 'BLADE', team: 'blue', position: { x: 100, y: 200 } },
        { id: 'enemy-1', type: 'BLADE', team: 'red', position: { x: 300, y: 200 } }
      )
      const cm = new CombatManager(em)
      const gm = createMockGameMode()
      const onAdded = vi.fn()
      const bridge = new NetworkBridge(gm, em, cm, { onRemotePlayerAdded: onAdded })
      bridge.setupCallbacks()

      gm._triggerJoin(REMOTE)
      expect(onAdded).toHaveBeenCalledWith('sess-1')
    })
  })

  describe('dispose', () => {
    it('calls GameMode dispose', () => {
      const { gm, bridge } = createSetup()
      bridge.dispose()
      expect(gm.dispose).toHaveBeenCalled()
    })
  })
})
