import { test, expect } from '@playwright/test'

/** Helper type for accessing Phaser game from window */
type GameWindow = {
  game: {
    scene: {
      isActive: (key: string) => boolean
      getScene: (key: string) => {
        heroState: {
          type: string
          hp: number
          position: { x: number; y: number }
          attackTargetId: string | null
          attackCooldown: number
          stats: { attackRange: number }
        }
        enemyState: {
          hp: number
          maxHp: number
          position: { x: number; y: number }
        }
        projectiles: readonly { id: string }[]
      }
    }
  }
}

test.describe('Projectile Attack', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForFunction(
      () => {
        const game = (window as unknown as GameWindow).game
        return game?.scene?.isActive('GameScene')
      },
      { timeout: 10000 }
    )
    await page.waitForTimeout(500)
  })

  test('should reduce enemy HP when BOLT attacks with projectile', async ({
    page,
  }) => {
    // Switch to BOLT (ranged hero)
    await page.keyboard.press('2')
    await page.waitForTimeout(200)

    // Verify switched to BOLT
    const heroType = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return scene.heroState.type
    })
    expect(heroType).toBe('BOLT')

    // Get initial enemy HP
    const initialHp = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return scene.enemyState.hp
    })

    // Place hero within BOLT attack range and set attack target
    // BOLT: radius=18, attackRange=300
    await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      const enemyPos = scene.enemyState.position
      ;(scene as Record<string, unknown>).heroState = {
        ...scene.heroState,
        position: { x: enemyPos.x - 150, y: enemyPos.y },
        attackTargetId: 'enemy-1',
        attackCooldown: 0,
      }
    })

    // Wait for projectile to spawn, fly, and hit
    // BOLT speed=600, distance=150 → travel time ≈ 0.25s
    // Plus attack cooldown reset (1/1.0 = 1s), allow multiple hits
    await page.waitForTimeout(4000)

    // Check enemy HP decreased
    const finalHp = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return scene.enemyState.hp
    })

    expect(finalHp).toBeLessThan(initialHp)
  })

  test('should spawn projectiles when BOLT attacks (not instant damage)', async ({
    page,
  }) => {
    // Switch to BOLT
    await page.keyboard.press('2')
    await page.waitForTimeout(200)

    // Place hero in range and set attack target with cooldown = 0
    await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      const enemyPos = scene.enemyState.position
      ;(scene as Record<string, unknown>).heroState = {
        ...scene.heroState,
        position: { x: enemyPos.x - 250, y: enemyPos.y },
        attackTargetId: 'enemy-1',
        attackCooldown: 0,
      }
    })

    // Wait briefly for attack to fire — projectile should exist in flight
    // before reaching target (distance 250, speed 600 → ~0.42s flight time)
    await page.waitForTimeout(200)

    const projectileCount = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return scene.projectiles.length
    })

    // At least one projectile should be in flight
    expect(projectileCount).toBeGreaterThanOrEqual(1)
  })
})
