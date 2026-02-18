import type { Page, Locator } from '@playwright/test'

export type TestApi = {
  getHeroType: () => string
  getHeroPosition: () => { x: number; y: number }
  getHeroHp: () => { current: number; max: number }
  getEnemyHp: () => { current: number; max: number }
  getEnemyPosition: () => { x: number; y: number }
  getProjectileCount: () => number
}

export type TestWindow = { __test__: TestApi }

// Game constants — duplicated from src/config/gameConfig.ts and src/domain/constants.ts.
// E2E tests run in Playwright (Node.js) and cannot import Vite-bundled game modules.
// If these values change in the source, update here too.
const GAME_WIDTH = 1280
const GAME_HEIGHT = 720
const WORLD_WIDTH = 3200
const WORLD_HEIGHT = 720

/**
 * Wait for the E2E test API to become available.
 */
export async function waitForTestApi(page: Page): Promise<void> {
  await page.waitForFunction(
    () => (window as unknown as TestWindow).__test__ !== undefined,
    { timeout: 10000 }
  )
  await page.waitForTimeout(500)
}

/**
 * Right-click on the enemy's screen position.
 *
 * Computes the enemy's screen coordinates by:
 * 1. Getting world positions from the test API
 * 2. Approximating camera scroll (camera follows hero, clamped to world bounds)
 * 3. Accounting for Phaser Scale.FIT ratio
 */
export async function rightClickOnEnemy(page: Page, canvas: Locator): Promise<void> {
  const positions = await page.evaluate(() => {
    const t = (window as unknown as TestWindow).__test__
    return {
      enemy: t.getEnemyPosition(),
      hero: t.getHeroPosition(),
    }
  })

  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Canvas not found')

  // Approximate camera scroll (camera follows hero, clamped to world bounds)
  const cameraScrollX = Math.max(0, Math.min(positions.hero.x - GAME_WIDTH / 2, WORLD_WIDTH - GAME_WIDTH))
  const cameraScrollY = Math.max(0, Math.min(positions.hero.y - GAME_HEIGHT / 2, WORLD_HEIGHT - GAME_HEIGHT))

  // Scale factor: Phaser Scale.FIT maps logical pixels to actual canvas size
  const scaleX = bounds.width / GAME_WIDTH
  const scaleY = bounds.height / GAME_HEIGHT

  const screenX = bounds.x + (positions.enemy.x - cameraScrollX) * scaleX
  const screenY = bounds.y + (positions.enemy.y - cameraScrollY) * scaleY

  await page.mouse.click(screenX, screenY, { button: 'right' })
}
