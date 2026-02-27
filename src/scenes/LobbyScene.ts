import Phaser from 'phaser'
import { GAME_WIDTH } from '@/config/gameConfig'
import { createText } from '@/scenes/ui/createText'
import { NetworkClient } from '@/network/NetworkClient'
import { OnlineGameMode } from '@/network/OnlineGameMode'
import type { GameMode } from '@/network/GameMode'
import type { Room } from 'colyseus.js'
import type { Team, Position, HeroType } from '@/domain/types'

type LobbyState = 'menu' | 'connecting' | 'waiting' | 'starting' | 'error'

const TITLE_FONT_SIZE = '96px'
const BUTTON_FONT_SIZE = '56px'
const STATUS_FONT_SIZE = '48px'
const BG_COLOR = '#2d3436'
const TEXT_COLOR = '#ffffff'
const BUTTON_COLOR = '#636e72'
const BUTTON_HOVER_COLOR = '#74b9ff'
const BUTTON_WIDTH = 640
const BUTTON_HEIGHT = 112
const BUTTON_RADIUS = 24
const HERO_BUTTON_WIDTH = 192
const HERO_BUTTON_HEIGHT = 96
const HERO_BUTTON_GAP = 24
const SELECTED_COLOR = '#74b9ff'
const HERO_TYPES: readonly HeroType[] = ['BLADE', 'BOLT', 'AURA'] as const
const GAME_START_DELAY_MS = 1000

export class LobbyScene extends Phaser.Scene {
  private lobbyState: LobbyState = 'menu'
  private networkClient: NetworkClient | null = null
  private selectedHeroType: HeroType = 'BLADE'
  private heroButtonGraphics: Map<HeroType, Phaser.GameObjects.Graphics> = new Map()
  private statusText!: Phaser.GameObjects.Text
  private errorText!: Phaser.GameObjects.Text
  private menuContainer!: Phaser.GameObjects.Container
  private waitingContainer!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'LobbyScene' })
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR)

    // Title
    const title = createText(this, GAME_WIDTH / 2, 280, 'SIMOBA', {
      fontSize: TITLE_FONT_SIZE,
      color: TEXT_COLOR,
      fontStyle: 'bold',
    })
    title.setOrigin(0.5)

    const subtitle = createText(this, GAME_WIDTH / 2, 400, '2v2 Micro Arena', {
      fontSize: STATUS_FONT_SIZE,
      color: '#b2bec3',
    })
    subtitle.setOrigin(0.5)

    // Menu container (buttons)
    this.menuContainer = this.add.container(0, 0)

    // Hero selection label
    const heroLabel = createText(this, GAME_WIDTH / 2, 520, 'Select Hero', {
      fontSize: '40px',
      color: '#b2bec3',
    })
    heroLabel.setOrigin(0.5)
    this.menuContainer.add(heroLabel)

    // Hero selection buttons (horizontal row)
    this.createHeroSelectionButtons(600, this.menuContainer)

    this.createButton(
      GAME_WIDTH / 2, 740,
      'Online Battle',
      () => this.startOnline(),
      this.menuContainer
    )

    this.createButton(
      GAME_WIDTH / 2, 880,
      'Solo Play',
      () => this.startSolo(),
      this.menuContainer
    )

    // Waiting container (hidden initially)
    this.waitingContainer = this.add.container(0, 0)
    this.waitingContainer.setVisible(false)

    // statusText is a standalone object (not in waitingContainer)
    // so it can remain visible in 'starting' state when waitingContainer is hidden.
    this.statusText = createText(this, GAME_WIDTH / 2, 720, '', {
      fontSize: STATUS_FONT_SIZE,
      color: TEXT_COLOR,
      align: 'center',
    })
    this.statusText.setOrigin(0.5)
    this.statusText.setVisible(false)

    this.createButton(
      GAME_WIDTH / 2, 1000,
      'Cancel',
      () => this.cancelWaiting(),
      this.waitingContainer
    )

    // Error text (hidden initially)
    this.errorText = createText(this, GAME_WIDTH / 2, 640, '', {
      fontSize: STATUS_FONT_SIZE,
      color: '#e74c3c',
      align: 'center',
    })
    this.errorText.setOrigin(0.5)
    this.errorText.setVisible(false)

    this.setState('menu')
  }

  private setState(newState: LobbyState): void {
    this.lobbyState = newState

    this.menuContainer.setVisible(newState === 'menu')
    this.waitingContainer.setVisible(newState === 'waiting')
    this.statusText.setVisible(false)
    this.errorText.setVisible(newState === 'error')

    switch (newState) {
      case 'menu':
        this.statusText.setText('')
        this.errorText.setText('')
        break
      case 'connecting':
        this.menuContainer.setVisible(false)
        this.waitingContainer.setVisible(true)
        this.statusText.setVisible(true)
        this.statusText.setText('Connecting...')
        break
      case 'waiting':
        this.statusText.setVisible(true)
        this.statusText.setText('Waiting for opponent...')
        break
      case 'starting':
        this.waitingContainer.setVisible(false)
        this.statusText.setVisible(true)
        this.statusText.setText('Game Start!')
        break
      case 'error':
        this.menuContainer.setVisible(true)
        break
    }
  }

  private async startSolo(): Promise<void> {
    if (this.lobbyState !== 'menu') return

    this.setState('connecting')
    this.networkClient = new NetworkClient()

    try {
      const room = await this.networkClient.connect('game', {
        mode: 'solo',
        heroType: this.selectedHeroType,
      })
      // Solo mode: server starts immediately (matchPhase = 'playing' on join)
      this.watchForGameReady(room)
    } catch {
      this.setState('error')
      this.errorText.setText('Connection failed.\nIs the server running?')
      this.networkClient = null
    }
  }

  private async startOnline(): Promise<void> {
    if (this.lobbyState !== 'menu') return

    this.setState('connecting')
    this.networkClient = new NetworkClient()

    try {
      const room = await this.networkClient.connect('game', { heroType: this.selectedHeroType })
      this.setState('waiting')
      this.watchForGameReady(room)
    } catch {
      this.setState('error')
      this.errorText.setText('Connection failed.\nIs the server running?')
      this.networkClient = null
    }
  }

  private watchForGameReady(room: Room): void {
    // Use state change instead of message to avoid race condition:
    // broadcast('gameStart') can fire before client registers onMessage listener.
    // State sync is guaranteed to arrive after joinOrCreate resolves.
    // Colyseus 0.16: onStateChange is an EventEmitter with .once()/.remove(),
    // NOT a function that returns an unsubscribe callback.
    const cb = (state: unknown): void => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((state as any).matchPhase === 'playing') {
        room.onStateChange.remove(cb)
        this.onGameStart()
      }
    }
    room.onStateChange(cb)
  }

  private onGameStart(): void {
    if (this.lobbyState !== 'waiting' && this.lobbyState !== 'connecting') return

    this.setState('starting')

    this.time.delayedCall(GAME_START_DELAY_MS, () => {
      const room = this.networkClient?.currentRoom
      if (!room) return
      const gameMode: GameMode = new OnlineGameMode({ room })

      // Read local player's team and position from server state (heroes map, not players)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const localHero = (room.state as any)?.heroes?.get(room.sessionId)
      const localTeam: Team | undefined = localHero?.team
      const localPosition: Position | undefined = localHero
        ? { x: localHero.x as number, y: localHero.y as number }
        : undefined

      this.scene.start('GameScene', { gameMode, localTeam, localPosition })
    })
  }

  private cancelWaiting(): void {
    if (this.lobbyState !== 'waiting' && this.lobbyState !== 'connecting') return

    this.networkClient?.disconnect()
    this.networkClient = null
    this.setState('menu')
  }

  private createHeroSelectionButtons(y: number, container: Phaser.GameObjects.Container): void {
    const totalWidth = HERO_TYPES.length * HERO_BUTTON_WIDTH + (HERO_TYPES.length - 1) * HERO_BUTTON_GAP
    const startX = GAME_WIDTH / 2 - totalWidth / 2 + HERO_BUTTON_WIDTH / 2

    for (const [i, ht] of HERO_TYPES.entries()) {
      const x = startX + i * (HERO_BUTTON_WIDTH + HERO_BUTTON_GAP)
      const isSelected = ht === this.selectedHeroType
      const color = isSelected ? SELECTED_COLOR : BUTTON_COLOR

      const bg = this.add.graphics()
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1)
      bg.fillRoundedRect(
        x - HERO_BUTTON_WIDTH / 2,
        y - HERO_BUTTON_HEIGHT / 2,
        HERO_BUTTON_WIDTH,
        HERO_BUTTON_HEIGHT,
        BUTTON_RADIUS
      )
      this.heroButtonGraphics.set(ht, bg)

      const text = createText(this, x, y, ht, {
        fontSize: '40px',
        color: TEXT_COLOR,
      })
      text.setOrigin(0.5)

      const hitZone = this.add.zone(x, y, HERO_BUTTON_WIDTH, HERO_BUTTON_HEIGHT)
      hitZone.setInteractive({ useHandCursor: true })
      hitZone.on('pointerdown', () => this.selectHero(ht))

      container.add([bg, text, hitZone])
    }
  }

  private selectHero(heroType: HeroType): void {
    if (this.selectedHeroType === heroType) return
    this.selectedHeroType = heroType

    for (const [type, bg] of this.heroButtonGraphics) {
      const isSelected = type === heroType
      const color = isSelected ? SELECTED_COLOR : BUTTON_COLOR
      const totalWidth = HERO_TYPES.length * HERO_BUTTON_WIDTH + (HERO_TYPES.length - 1) * HERO_BUTTON_GAP
      const startX = GAME_WIDTH / 2 - totalWidth / 2 + HERO_BUTTON_WIDTH / 2
      const i = HERO_TYPES.indexOf(type)
      const x = startX + i * (HERO_BUTTON_WIDTH + HERO_BUTTON_GAP)
      const y = 600

      bg.clear()
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1)
      bg.fillRoundedRect(
        x - HERO_BUTTON_WIDTH / 2,
        y - HERO_BUTTON_HEIGHT / 2,
        HERO_BUTTON_WIDTH,
        HERO_BUTTON_HEIGHT,
        BUTTON_RADIUS
      )
    }
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    container: Phaser.GameObjects.Container
  ): void {
    // NOTE: Graphics draw calls use absolute coordinates, not container-relative.
    // This works because all containers are positioned at (0, 0).
    // If containers are repositioned in the future, Graphics coordinates must be adjusted.
    const bg = this.add.graphics()
    bg.fillStyle(Phaser.Display.Color.HexStringToColor(BUTTON_COLOR).color, 1)
    bg.fillRoundedRect(
      x - BUTTON_WIDTH / 2,
      y - BUTTON_HEIGHT / 2,
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      BUTTON_RADIUS
    )

    const text = createText(this, x, y, label, {
      fontSize: BUTTON_FONT_SIZE,
      color: TEXT_COLOR,
    })
    text.setOrigin(0.5)

    // Interactive hit area on the text (covers the button area)
    const hitZone = this.add.zone(x, y, BUTTON_WIDTH, BUTTON_HEIGHT)
    hitZone.setInteractive({ useHandCursor: true })

    hitZone.on('pointerover', () => {
      bg.clear()
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(BUTTON_HOVER_COLOR).color, 1)
      bg.fillRoundedRect(
        x - BUTTON_WIDTH / 2,
        y - BUTTON_HEIGHT / 2,
        BUTTON_WIDTH,
        BUTTON_HEIGHT,
        BUTTON_RADIUS
      )
    })

    hitZone.on('pointerout', () => {
      bg.clear()
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(BUTTON_COLOR).color, 1)
      bg.fillRoundedRect(
        x - BUTTON_WIDTH / 2,
        y - BUTTON_HEIGHT / 2,
        BUTTON_WIDTH,
        BUTTON_HEIGHT,
        BUTTON_RADIUS
      )
    })

    hitZone.on('pointerdown', onClick)

    container.add([bg, text, hitZone])
  }
}
