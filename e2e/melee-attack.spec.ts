import { test, expect } from '@playwright/test'
import { type TestWindow, startOfflineGame, rightClickOnEnemy } from './helpers'

test.describe('Melee Attack', () => {
  test.beforeEach(async ({ page }) => {
    await startOfflineGame(page)
  })

  test('should display an enemy hero on the map', async ({ page }) => {
    const enemyHp = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getEnemyHp()
    )

    // Enemy may have taken tower damage by now, so just verify they exist alive
    expect(enemyHp.max).toBeGreaterThan(0)
    expect(enemyHp.current).toBeGreaterThan(0)
  })

  test('should reduce enemy HP when hero attacks in range', async ({ page }) => {
    const initialHp = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getEnemyHp().current
    )

    // Move hero right until within attack range of the enemy
    // (condition-based, not time-based — headless Chromium FPS varies)
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

    // Wait for enemy HP to decrease (condition-based, not fixed timeout)
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

  test('should not attack when right-clicking ground', async ({ page }) => {
    // Right-click on empty ground (far left of canvas, away from enemy)
    const canvas = page.locator('#game-container canvas')
    const bounds = await canvas.boundingBox()
    if (!bounds) throw new Error('Canvas not found')

    await page.mouse.click(
      bounds.x + 100,
      bounds.y + bounds.height / 2,
      { button: 'right' }
    )

    await page.waitForTimeout(500)

    // Verify hero has no attack target (ground click should not set one)
    // Note: enemy HP may change from tower attacks, so we check attack state instead
    const attackTarget = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getHeroAttackTarget()
    )
    expect(attackTarget).toBeNull()
  })
})
