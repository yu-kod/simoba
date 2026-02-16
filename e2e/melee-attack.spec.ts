import { test, expect } from '@playwright/test'

/** Helper type for accessing Phaser game from window */
type GameWindow = {
  game: {
    scene: {
      isActive: (key: string) => boolean
      getScene: (key: string) => {
        heroState: {
          hp: number
          position: { x: number; y: number }
          attackTargetId: string | null
          attackCooldown: number
        }
        enemyState: {
          hp: number
          maxHp: number
          position: { x: number; y: number }
        }
      }
    }
    canvas: HTMLCanvasElement
  }
}

test.describe('Melee Attack', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForFunction(
      () => {
        const game = (window as unknown as GameWindow).game
        return game?.scene?.isActive('GameScene')
      },
      { timeout: 10000 }
    )
    // Allow initial rendering to complete
    await page.waitForTimeout(500)
  })

  test('should display an enemy hero on the map', async ({ page }) => {
    const enemyInfo = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return {
        hp: scene.enemyState.hp,
        maxHp: scene.enemyState.maxHp,
        x: scene.enemyState.position.x,
        y: scene.enemyState.position.y,
      }
    })

    expect(enemyInfo.hp).toBe(enemyInfo.maxHp)
    expect(enemyInfo.hp).toBeGreaterThan(0)
  })

  test('should reduce enemy HP when hero attacks in range', async ({
    page,
  }) => {
    // Get initial enemy HP
    const initialHp = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return scene.enemyState.hp
    })

    // Move hero close to enemy and set attack target via game state
    // This directly tests the attack integration (update loop + damage)
    // without relying on Phaser's pointer handling in headless mode
    await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')

      // Place hero within attack range of enemy
      // BLADE radius=22, attackRange=60, so max center distance = 22+22+60 = 104
      const enemyPos = scene.enemyState.position
      const heroState = scene.heroState as Record<string, unknown>
      heroState.position = { x: enemyPos.x - 80, y: enemyPos.y }
      heroState.attackTargetId = 'enemy-1'
      heroState.attackCooldown = 0
    })

    // Wait for attack loop to fire (multiple cycles)
    await page.waitForTimeout(3000)

    // Check enemy HP decreased
    const finalHp = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return scene.enemyState.hp
    })

    expect(finalHp).toBeLessThan(initialHp)
  })

  test('should not attack when right-clicking ground', async ({ page }) => {
    const initialHp = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return scene.enemyState.hp
    })

    // Right-click on empty ground (far from enemy)
    const canvas = page.locator('#game-container canvas')
    const canvasBounds = await canvas.boundingBox()
    if (!canvasBounds) throw new Error('Canvas not found')

    // Click at left side of canvas (away from enemy)
    await page.mouse.click(
      canvasBounds.x + 100,
      canvasBounds.y + canvasBounds.height / 2,
      { button: 'right' }
    )

    await page.waitForTimeout(1500)

    // HP should remain unchanged
    const finalHp = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return scene.enemyState.hp
    })

    expect(finalHp).toBe(initialHp)
  })
})
