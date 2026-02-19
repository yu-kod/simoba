import { test, expect } from '@playwright/test'
import { type TestWindow, startOfflineGame } from './helpers'

test.describe('Debug Hero Switch', () => {
  test.beforeEach(async ({ page }) => {
    await startOfflineGame(page)
  })

  test('should start as BLADE by default', async ({ page }) => {
    const heroType = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getHeroType()
    )
    expect(heroType).toBe('BLADE')
  })

  test('should switch to BOLT when pressing key 2', async ({ page }) => {
    await page.keyboard.press('2')
    await page.waitForTimeout(200)

    const state = await page.evaluate(() => {
      const api = (window as unknown as TestWindow).__test__
      return { type: api.getHeroType(), maxHp: api.getHeroHp().max }
    })

    expect(state.type).toBe('BOLT')
    expect(state.maxHp).toBe(400)
  })

  test('should switch to AURA when pressing key 3', async ({ page }) => {
    await page.keyboard.press('3')
    await page.waitForTimeout(200)

    const state = await page.evaluate(() => {
      const api = (window as unknown as TestWindow).__test__
      return { type: api.getHeroType(), maxHp: api.getHeroHp().max }
    })

    expect(state.type).toBe('AURA')
    expect(state.maxHp).toBe(500)
  })

  test('should switch back to BLADE when pressing key 1', async ({ page }) => {
    await page.keyboard.press('2')
    await page.waitForTimeout(200)

    await page.keyboard.press('1')
    await page.waitForTimeout(200)

    const state = await page.evaluate(() => {
      const api = (window as unknown as TestWindow).__test__
      return { type: api.getHeroType(), maxHp: api.getHeroHp().max }
    })

    expect(state.type).toBe('BLADE')
    expect(state.maxHp).toBe(650)
  })

  test('should reset position to spawn on switch', async ({ page }) => {
    const spawnPos = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getHeroPosition()
    )

    await page.keyboard.down('d')
    await page.waitForTimeout(500)
    await page.keyboard.up('d')
    await page.waitForTimeout(100)

    const movedPos = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getHeroPosition()
    )
    expect(movedPos.x).toBeGreaterThan(spawnPos.x)

    await page.keyboard.press('2')
    await page.waitForTimeout(200)

    const resetPos = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getHeroPosition()
    )
    expect(resetPos.x).toBeCloseTo(spawnPos.x, 0)
    expect(resetPos.y).toBeCloseTo(spawnPos.y, 0)
  })
})
