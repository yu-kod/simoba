import { test, expect } from '@playwright/test'
import { startOfflineGame, type TestWindow } from './helpers'

test.describe('Tower Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await startOfflineGame(page)
    await page.waitForTimeout(500)
  })

  test('should register two towers with correct teams', async ({ page }) => {
    const towers = await page.evaluate(() => {
      return (window as unknown as TestWindow).__test__.getTowers()
    })

    expect(towers).toHaveLength(2)

    const blueTower = towers.find((t) => t.team === 'blue')
    const redTower = towers.find((t) => t.team === 'red')

    expect(blueTower).toBeDefined()
    expect(redTower).toBeDefined()
    expect(blueTower!.id).toBe('tower-blue')
    expect(redTower!.id).toBe('tower-red')
  })

  test('should have towers at correct positions', async ({ page }) => {
    const towers = await page.evaluate(() => {
      return (window as unknown as TestWindow).__test__.getTowers()
    })

    const blueTower = towers.find((t) => t.team === 'blue')!
    const redTower = towers.find((t) => t.team === 'red')!

    // Blue tower at x=600, Red tower at x=2600
    expect(blueTower.position.x).toBe(600)
    expect(redTower.position.x).toBe(2600)
  })

  test('should have towers alive with full HP', async ({ page }) => {
    const towers = await page.evaluate(() => {
      return (window as unknown as TestWindow).__test__.getTowers()
    })

    for (const tower of towers) {
      expect(tower.dead).toBe(false)
      expect(tower.hp).toBe(tower.maxHp)
      expect(tower.maxHp).toBeGreaterThan(0)
    }
  })

  test('should render tower visually on canvas', async ({ page }) => {
    // The blue tower (x=600) should be visible from the default camera position
    // Take a screenshot to verify visual rendering
    await expect(page.locator('#game-container canvas')).toHaveScreenshot(
      'tower-blue-visible.png',
      { maxDiffPixelRatio: 0.01 }
    )
  })
})
