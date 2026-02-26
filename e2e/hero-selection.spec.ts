import { test, expect } from '@playwright/test'
import { type TestWindow, startSoloGame } from './helpers'

test.describe('Hero Selection', () => {
  test('should start as BLADE by default', async ({ page }) => {
    await startSoloGame(page)

    const heroType = await page.evaluate(
      () => (window as unknown as TestWindow).__test__.getHeroType()
    )
    expect(heroType).toBe('BLADE')
  })

  test('should start as BOLT when selected in lobby', async ({ page }) => {
    await startSoloGame(page, 'BOLT')

    const state = await page.evaluate(() => {
      const api = (window as unknown as TestWindow).__test__
      return { type: api.getHeroType(), maxHp: api.getHeroHp().max }
    })

    expect(state.type).toBe('BOLT')
    expect(state.maxHp).toBe(400)
  })

  test('should start as AURA when selected in lobby', async ({ page }) => {
    await startSoloGame(page, 'AURA')

    const state = await page.evaluate(() => {
      const api = (window as unknown as TestWindow).__test__
      return { type: api.getHeroType(), maxHp: api.getHeroHp().max }
    })

    expect(state.type).toBe('AURA')
    expect(state.maxHp).toBe(500)
  })
})
