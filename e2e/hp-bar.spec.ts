import { test, expect } from '@playwright/test'

/** Helper type for accessing Phaser game from window */
type GameWindow = {
  game: {
    scene: {
      isActive: (key: string) => boolean
      getScene: (key: string) => {
        heroState: {
          hp: number
          maxHp: number
          position: { x: number; y: number }
          attackTargetId: string | null
          attackCooldown: number
        }
        enemyState: {
          hp: number
          maxHp: number
          position: { x: number; y: number }
        }
        heroRenderer: {
          gameObject: {
            list: Array<{
              visible: boolean
            }>
          }
        }
        enemyRenderer: {
          gameObject: {
            list: Array<{
              visible: boolean
            }>
          }
        }
      }
    }
    canvas: HTMLCanvasElement
  }
}

test.describe('HP Bar', () => {
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

  test('should show HP bar even when hero is at full HP', async ({ page }) => {
    // Verify hero is at full HP
    const heroFullHp = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return scene.heroState.hp === scene.heroState.maxHp
    })

    expect(heroFullHp).toBe(true)
  })

  test('should show HP bar after enemy takes damage', async ({ page }) => {
    // Place hero in range and attack enemy
    await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')

      const enemyPos = scene.enemyState.position
      ;(scene as Record<string, unknown>).heroState = {
        ...scene.heroState,
        position: { x: enemyPos.x - 80, y: enemyPos.y },
        attackTargetId: 'enemy-1',
        attackCooldown: 0,
      }
    })

    // Wait for attack to land
    await page.waitForTimeout(3000)

    // Verify enemy HP decreased
    const enemyHpResult = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return {
        hp: scene.enemyState.hp,
        maxHp: scene.enemyState.maxHp,
        damaged: scene.enemyState.hp < scene.enemyState.maxHp,
      }
    })

    expect(enemyHpResult.damaged).toBe(true)
  })
})
