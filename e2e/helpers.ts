import type { Page } from '@playwright/test'

export type TowerTestData = {
  id: string
  team: string
  position: { x: number; y: number }
  hp: number
  maxHp: number
  dead: boolean
}

export type TestApi = {
  getHeroType: () => string
  getHeroHp: () => { current: number; max: number }
  getTowers: () => TowerTestData[]
}

export type TestWindow = { __test__: TestApi }

// Game constants — duplicated from src/config/gameConfig.ts and src/domain/constants.ts.
// E2E tests run in Playwright (Node.js) and cannot import Vite-bundled game modules.
// If these values change in the source, update here too.
const GAME_WIDTH = 2560
const GAME_HEIGHT = 1440

// Lobby button positions (must match LobbyScene layout)
// Online Battle: y=740, Solo Play: y=880
const SOLO_PLAY_BUTTON = { x: 1280, y: 880 }

// Hero selection button positions (y=600, horizontal row centered at GAME_WIDTH/2)
// HERO_BUTTON_WIDTH=192, HERO_BUTTON_GAP=24, 3 buttons
const HERO_BUTTON_Y = 600
const HERO_BUTTON_POSITIONS: Record<string, { x: number; y: number }> = {
  BLADE: { x: 1064, y: HERO_BUTTON_Y },
  BOLT: { x: 1280, y: HERO_BUTTON_Y },
  AURA: { x: 1496, y: HERO_BUTTON_Y },
}

type GameWindow = {
  game: { scene: { isActive: (key: string) => boolean } }
}

/**
 * Wait for a specific Phaser scene to be active.
 */
export async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction(
    (key: string) => {
      const game = (window as unknown as GameWindow).game
      return game?.scene?.isActive(key)
    },
    sceneKey,
    { timeout: 15000 }
  )
}

/**
 * Wait for the E2E test API to become available.
 */
export async function waitForTestApi(page: Page): Promise<void> {
  await page.waitForFunction(
    () => (window as unknown as TestWindow).__test__ !== undefined,
    { timeout: 15000 }
  )
  await page.waitForTimeout(500)
}

/**
 * Click a hero selection button in the lobby.
 * Must be called after LobbyScene is active but before clicking "Solo Play".
 */
export async function selectHeroInLobby(page: Page, heroType: 'BLADE' | 'BOLT' | 'AURA'): Promise<void> {
  const canvas = page.locator('#game-container canvas')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Canvas not found')

  const pos = HERO_BUTTON_POSITIONS[heroType]
  const scaleX = bounds.width / GAME_WIDTH
  const scaleY = bounds.height / GAME_HEIGHT
  await page.mouse.click(
    bounds.x + pos.x * scaleX,
    bounds.y + pos.y * scaleY
  )
  await page.waitForTimeout(200)
}

/**
 * Navigate to the page, click "Solo Play" in the lobby, and wait for GameScene.
 * Use this as the standard entry point for E2E tests that need GameScene.
 * Pass heroType to select a specific hero before starting (default: BLADE).
 *
 * Requires the Colyseus server to be running (started by `npm run dev`).
 */
export async function startSoloGame(page: Page, heroType?: 'BLADE' | 'BOLT' | 'AURA'): Promise<void> {
  await page.goto('/')

  const canvas = page.locator('#game-container canvas')
  await canvas.waitFor({ state: 'visible', timeout: 10000 })

  await waitForScene(page, 'LobbyScene')

  if (heroType) {
    await selectHeroInLobby(page, heroType)
  }

  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Canvas not found')

  const scaleX = bounds.width / GAME_WIDTH
  const scaleY = bounds.height / GAME_HEIGHT
  await page.mouse.click(
    bounds.x + SOLO_PLAY_BUTTON.x * scaleX,
    bounds.y + SOLO_PLAY_BUTTON.y * scaleY
  )

  await waitForTestApi(page)
}
