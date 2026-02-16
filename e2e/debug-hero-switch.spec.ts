import { test, expect } from '@playwright/test'

/** Helper type for accessing Phaser game from window */
type GameWindow = {
  game: {
    scene: {
      isActive: (key: string) => boolean
      getScene: (key: string) => {
        heroState: {
          type: string
          position: { x: number; y: number }
          hp: number
          maxHp: number
        }
      }
    }
  }
}

test.describe('Debug Hero Switch', () => {
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

  test('should start as BLADE by default', async ({ page }) => {
    const heroType = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return scene.heroState.type
    })

    expect(heroType).toBe('BLADE')
  })

  test('should switch to BOLT when pressing key 2', async ({ page }) => {
    await page.keyboard.press('2')
    await page.waitForTimeout(200)

    const state = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return {
        type: scene.heroState.type,
        maxHp: scene.heroState.maxHp,
      }
    })

    expect(state.type).toBe('BOLT')
    expect(state.maxHp).toBe(400)
  })

  test('should switch to AURA when pressing key 3', async ({ page }) => {
    await page.keyboard.press('3')
    await page.waitForTimeout(200)

    const state = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return {
        type: scene.heroState.type,
        maxHp: scene.heroState.maxHp,
      }
    })

    expect(state.type).toBe('AURA')
    expect(state.maxHp).toBe(500)
  })

  test('should switch back to BLADE when pressing key 1', async ({ page }) => {
    // First switch to BOLT
    await page.keyboard.press('2')
    await page.waitForTimeout(200)

    // Then switch back to BLADE
    await page.keyboard.press('1')
    await page.waitForTimeout(200)

    const state = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return {
        type: scene.heroState.type,
        maxHp: scene.heroState.maxHp,
      }
    })

    expect(state.type).toBe('BLADE')
    expect(state.maxHp).toBe(650)
  })

  test('should reset position to spawn on switch', async ({ page }) => {
    // Get initial spawn position
    const spawnPos = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return { ...scene.heroState.position }
    })

    // Move hero away from spawn using WASD
    await page.keyboard.down('d')
    await page.waitForTimeout(500)
    await page.keyboard.up('d')
    await page.waitForTimeout(100)

    // Verify hero moved
    const movedPos = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return { ...scene.heroState.position }
    })
    expect(movedPos.x).toBeGreaterThan(spawnPos.x)

    // Switch type — position should reset
    await page.keyboard.press('2')
    await page.waitForTimeout(200)

    const resetPos = await page.evaluate(() => {
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      return { ...scene.heroState.position }
    })

    expect(resetPos.x).toBeCloseTo(spawnPos.x, 0)
    expect(resetPos.y).toBeCloseTo(spawnPos.y, 0)
  })
})
