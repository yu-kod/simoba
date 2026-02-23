import { test, expect } from '@playwright/test'
import { startOfflineGame } from './helpers'

test.describe('Game Launch', () => {
  test('should render a canvas element inside game-container', async ({ page }) => {
    await page.goto('/')
    const canvas = page.locator('#game-container canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })
  })

  test('should have window.game available in dev mode', async ({ page }) => {
    await page.goto('/')
    await page.waitForFunction(
      () => (window as unknown as { game: unknown }).game !== undefined,
      { timeout: 10000 }
    )

    const hasGame = await page.evaluate(
      () => (window as unknown as { game: unknown }).game !== undefined
    )
    expect(hasGame).toBe(true)
  })

  test('should load GameScene after selecting Offline Play', async ({ page }) => {
    await startOfflineGame(page)

    const isActive = await page.evaluate(() => {
      const game = (window as unknown as { game: { scene: { isActive: (key: string) => boolean } } }).game
      return game.scene.isActive('GameScene')
    })
    expect(isActive).toBe(true)
  })
})
