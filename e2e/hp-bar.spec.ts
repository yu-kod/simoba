import { test, expect } from '@playwright/test'
import { type TestWindow, startOfflineGame, rightClickOnEnemy } from './helpers'

test.describe('HP Bar', () => {
  test.beforeEach(async ({ page }) => {
    await startOfflineGame(page)
  })

  test('should show HP bar even when hero is at full HP', async ({ page }) => {
    const heroHp = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getHeroHp()
    )
    expect(heroHp.current).toBe(heroHp.max)
  })

  test('should show HP bar after enemy takes damage', async ({ page }) => {
    // Move hero right until within attack range of the enemy
    await page.keyboard.down('d')
    await page.waitForFunction(
      () => {
        const t = (window as unknown as TestWindow).__test__
        const hero = t.getHeroPosition()
        const enemy = t.getEnemyPosition()
        const dist = Math.abs(hero.x - enemy.x) + Math.abs(hero.y - enemy.y)
        return dist < 100
      },
      { timeout: 10000 }
    )
    await page.keyboard.up('d')
    await page.waitForTimeout(200)

    // Right-click on enemy using computed screen position
    const canvas = page.locator('#game-container canvas')
    await rightClickOnEnemy(page, canvas)

    // Wait for enemy HP to decrease
    await page.waitForFunction(
      () => {
        const hp = (window as unknown as TestWindow).__test__.getEnemyHp()
        return hp.current < hp.max
      },
      { timeout: 5000 }
    )

    const enemyHp = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getEnemyHp()
    )
    expect(enemyHp.current).toBeLessThan(enemyHp.max)
  })
})
