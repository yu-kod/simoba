import { test, expect } from '@playwright/test'
import { type TestWindow, startOfflineGame, rightClickOnEnemy } from './helpers'

test.describe('Projectile Attack', () => {
  test.beforeEach(async ({ page }) => {
    await startOfflineGame(page)
  })

  test('should reduce enemy HP when BOLT attacks with projectile', async ({ page }) => {
    // Switch to BOLT (ranged hero)
    await page.keyboard.press('2')
    await page.waitForTimeout(200)

    expect(
      await page.evaluate(() => (window as unknown as TestWindow).__test__.getHeroType())
    ).toBe('BOLT')

    const initialHp = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getEnemyHp().current
    )

    // BOLT attackRange=300, initial distance=200 → already in range
    // Right-click on enemy using computed screen position
    const canvas = page.locator('#game-container canvas')
    await rightClickOnEnemy(page, canvas)

    // Wait for projectile to fly and hit
    await page.waitForFunction(
      (initial) =>
        (window as unknown as TestWindow).__test__.getEnemyHp().current < initial,
      initialHp,
      { timeout: 5000 }
    )

    const finalHp = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getEnemyHp().current
    )
    expect(finalHp).toBeLessThan(initialHp)
  })

  test('should spawn projectiles when BOLT attacks (not instant damage)', async ({ page }) => {
    // Switch to BOLT
    await page.keyboard.press('2')
    await page.waitForTimeout(200)

    // Right-click on enemy using computed screen position
    const canvas = page.locator('#game-container canvas')
    await rightClickOnEnemy(page, canvas)

    // Wait briefly — projectile should be in flight before reaching target
    await page.waitForFunction(
      () => (window as unknown as TestWindow).__test__.getProjectileCount() >= 1,
      { timeout: 3000 }
    )

    const count = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getProjectileCount()
    )
    expect(count).toBeGreaterThanOrEqual(1)
  })
})
