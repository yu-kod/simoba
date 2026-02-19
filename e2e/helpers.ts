import type { Page, Locator } from '@playwright/test'

export type TestApi = {
  getHeroType: () => string
  getHeroPosition: () => { x: number; y: number }
  getHeroHp: () => { current: number; max: number }
  getHeroDead: () => boolean
  getEnemyHp: () => { current: number; max: number }
  getEnemyPosition: () => { x: number; y: number }
  getEnemyDead: () => boolean
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

type GameWindow = {
  game: { scene: { isActive: (key: string) => boolean } }
}

/**
 * Wait for a specific Phaser scene to be active.
 */
export async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction(
    (key: string) => {
      const game = (window as unknown as GameWindow).game
      return game?.scene?.isActive(key)
    },
    sceneKey,
    { timeout: 10000 }
  )
}

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
 * Navigate to the page, click "Offline Play" in the lobby, and wait for GameScene.
 * Use this as the standard entry point for E2E tests that need GameScene.
 */
export async function startOfflineGame(page: Page): Promise<void> {
  await page.goto('/')

  const canvas = page.locator('#game-container canvas')
  await canvas.waitFor({ state: 'visible', timeout: 10000 })

  await waitForScene(page, 'LobbyScene')

  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Canvas not found')

  // "Offline Play" button center: (GAME_WIDTH/2, 420) = (640, 420)
  const scaleX = bounds.width / GAME_WIDTH
  const scaleY = bounds.height / GAME_HEIGHT
  await page.mouse.click(
    bounds.x + 640 * scaleX,
    bounds.y + 420 * scaleY
  )

  await waitForTestApi(page)
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
