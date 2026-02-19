import { test, expect } from '@playwright/test'
import { type TestWindow, startOfflineGame, rightClickOnEnemy } from './helpers'

// Killing enemy takes ~15s (BLADE 60dmg * 0.8atk/s vs 650HP) + 5s respawn
test.describe('Death and Respawn', () => {
  test.beforeEach(async ({ page }) => {
    await startOfflineGame(page)
  })

  test('enemy should die when HP reaches zero and respawn after timer', async ({ page }) => {
    test.setTimeout(60000)

    // Move hero near enemy
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

    // Right-click enemy to start attacking
    const canvas = page.locator('#game-container canvas')
    await rightClickOnEnemy(page, canvas)

    // Wait for enemy to die (HP reaches 0 → dead: true)
    await page.waitForFunction(
      () => (window as unknown as TestWindow).__test__.getEnemyDead(),
      { timeout: 30000 }
    )

    const deadState = await page.evaluate(() => {
      const t = (window as unknown as TestWindow).__test__
      return { dead: t.getEnemyDead(), hp: t.getEnemyHp().current }
    })
    expect(deadState.dead).toBe(true)
    expect(deadState.hp).toBeLessThanOrEqual(0)

    // Wait for enemy to respawn (DEFAULT_RESPAWN_TIME = 5s)
    await page.waitForFunction(
      () => !((window as unknown as TestWindow).__test__.getEnemyDead()),
      { timeout: 10000 }
    )

    const respawnState = await page.evaluate(() => {
      const t = (window as unknown as TestWindow).__test__
      return {
        dead: t.getEnemyDead(),
        hp: t.getEnemyHp(),
      }
    })
    expect(respawnState.dead).toBe(false)
    expect(respawnState.hp.current).toBe(respawnState.hp.max)
  })

  test('dead enemy should not be targetable', async ({ page }) => {
    test.setTimeout(60000)

    // Move hero near enemy
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

    // Attack enemy until dead
    const canvas = page.locator('#game-container canvas')
    await rightClickOnEnemy(page, canvas)

    await page.waitForFunction(
      () => (window as unknown as TestWindow).__test__.getEnemyDead(),
      { timeout: 30000 }
    )

    // Right-click on dead enemy position — should not reduce HP further
    // (enemy is dead and filtered from getEnemies)
    await rightClickOnEnemy(page, canvas)
    await page.waitForTimeout(1000)

    // Enemy should still be dead (no double-death)
    const stillDead = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getEnemyDead()
    )
    expect(stillDead).toBe(true)
  })
})
