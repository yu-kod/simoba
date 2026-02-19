import { test, expect } from '@playwright/test'
import { startOfflineGame } from './helpers'

test.describe('Map Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await startOfflineGame(page)
    // Allow a frame for rendering to complete
    await page.waitForTimeout(500)
  })

  test('should render the map on canvas', async ({ page }) => {
    const canvas = page.locator('#game-container canvas')
    await expect(canvas).toBeVisible()
    await expect(canvas).toHaveScreenshot('map-initial-view.png', {
      maxDiffPixelRatio: 0.01,
    })
  })

  test('should have map graphics objects in the scene', async ({ page }) => {
    // Verify that renderMap() created Graphics objects in GameScene
    const mapInfo = await page.evaluate(() => {
      type GameWindow = {
        game: {
          scene: {
            getScene: (key: string) => {
              children: {
                list: Array<{ type: string; commandBuffer?: unknown[] }>
              }
            }
          }
        }
      }
      const game = (window as unknown as GameWindow).game
      const scene = game.scene.getScene('GameScene')
      const children = scene.children.list

      // Count Graphics objects (renderMap creates one, hero creates another)
      const graphicsCount = children.filter(
        (c) => c.type === 'Graphics'
      ).length

      // Total display objects should include: Graphics (map), Container (hero)
      const totalCount = children.length

      return { graphicsCount, totalCount }
    })

    // renderMap creates 1 Graphics object, hero has 1 Container + 1 Graphics
    expect(mapInfo.graphicsCount).toBeGreaterThanOrEqual(1)
    expect(mapInfo.totalCount).toBeGreaterThanOrEqual(3)
  })

  test('should display map elements across the full world', async ({
    page,
  }) => {
    // Move hero to the right to bring red base area into view
    // Press D key for ~3 seconds to traverse the map (WASD movement)
    await page.keyboard.down('d')
    await page.waitForTimeout(3000)
    await page.keyboard.up('d')
    await page.waitForTimeout(500)

    await expect(page.locator('#game-container canvas')).toHaveScreenshot(
      'map-right-side-view.png',
      { maxDiffPixelRatio: 0.01 }
    )
  })
})
