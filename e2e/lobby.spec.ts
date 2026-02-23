import { test, expect } from '@playwright/test'
import { waitForScene, startOfflineGame } from './helpers'

test.describe('Lobby', () => {
  test('should display LobbyScene on game load', async ({ page }) => {
    await page.goto('/')
    const canvas = page.locator('#game-container canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    await waitForScene(page, 'LobbyScene')

    const isLobbyActive = await page.evaluate(() => {
      const game = (window as unknown as {
        game: { scene: { isActive: (key: string) => boolean } }
      }).game
      return game.scene.isActive('LobbyScene')
    })
    expect(isLobbyActive).toBe(true)
  })

  test('should transition to GameScene when "Offline Play" is clicked', async ({ page }) => {
    await startOfflineGame(page)

    const isGameActive = await page.evaluate(() => {
      const game = (window as unknown as {
        game: { scene: { isActive: (key: string) => boolean } }
      }).game
      return game.scene.isActive('GameScene')
    })
    expect(isGameActive).toBe(true)
  })
})
