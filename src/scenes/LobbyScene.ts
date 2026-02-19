import Phaser from 'phaser'
import { GAME_WIDTH } from '@/config/gameConfig'
import { NetworkClient } from '@/network/NetworkClient'
import { OnlineGameMode } from '@/network/OnlineGameMode'
import { OfflineGameMode } from '@/network/OfflineGameMode'
import type { GameMode } from '@/network/GameMode'
import type { Room } from 'colyseus.js'
import type { Team, Position } from '@/domain/types'

type LobbyState = 'menu' | 'connecting' | 'waiting' | 'starting' | 'error'

const TITLE_FONT_SIZE = '48px'
const BUTTON_FONT_SIZE = '28px'
const STATUS_FONT_SIZE = '24px'
const BG_COLOR = '#2d3436'
const TEXT_COLOR = '#ffffff'
const BUTTON_COLOR = '#636e72'
const BUTTON_HOVER_COLOR = '#74b9ff'
const BUTTON_WIDTH = 320
const BUTTON_HEIGHT = 56
const BUTTON_RADIUS = 12
const GAME_START_DELAY_MS = 1000

export class LobbyScene extends Phaser.Scene {
  private lobbyState: LobbyState = 'menu'
  private networkClient: NetworkClient | null = null
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
    const title = this.add.text(GAME_WIDTH / 2, 140, 'SIMOBA', {
      fontSize: TITLE_FONT_SIZE,
      color: TEXT_COLOR,
      fontStyle: 'bold',
    })
    title.setOrigin(0.5)

    const subtitle = this.add.text(GAME_WIDTH / 2, 200, '2v2 Micro Arena', {
      fontSize: STATUS_FONT_SIZE,
      color: '#b2bec3',
    })
    subtitle.setOrigin(0.5)

    // Menu container (buttons)
    this.menuContainer = this.add.container(0, 0)
    this.createButton(
      GAME_WIDTH / 2, 340,
      'Online Battle',
      () => this.startOnline(),
      this.menuContainer
    )
    this.createButton(
      GAME_WIDTH / 2, 420,
      'Offline Play',
      () => this.startOffline(),
      this.menuContainer
    )

    // Waiting container (hidden initially)
    this.waitingContainer = this.add.container(0, 0)
    this.waitingContainer.setVisible(false)

    // statusText is a standalone object (not in waitingContainer)
    // so it can remain visible in 'starting' state when waitingContainer is hidden.
    this.statusText = this.add.text(GAME_WIDTH / 2, 360, '', {
      fontSize: STATUS_FONT_SIZE,
      color: TEXT_COLOR,
      align: 'center',
    })
    this.statusText.setOrigin(0.5)
    this.statusText.setVisible(false)

    this.createButton(
      GAME_WIDTH / 2, 440,
      'Cancel',
      () => this.cancelWaiting(),
      this.waitingContainer
    )

    // Error text (hidden initially)
    this.errorText = this.add.text(GAME_WIDTH / 2, 320, '', {
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

  private startOffline(): void {
    const gameMode: GameMode = new OfflineGameMode()
    this.scene.start('GameScene', { gameMode })
  }

  private async startOnline(): Promise<void> {
    if (this.lobbyState !== 'menu') return

    this.setState('connecting')
    this.networkClient = new NetworkClient()

    try {
      const room = await this.networkClient.connect('game')
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
    const unsubscribe = room.onStateChange((state) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((state as any).gameStarted === true) {
        unsubscribe()
        this.onGameStart()
      }
    })
  }

  private onGameStart(): void {
    if (this.lobbyState !== 'waiting') return

    this.setState('starting')

    this.time.delayedCall(GAME_START_DELAY_MS, () => {
      const room = this.networkClient?.currentRoom
      if (!room) return
      const gameMode: GameMode = new OnlineGameMode({ room })

      // Read local player's team and position from server state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const localPlayer = (room.state as any)?.players?.get(room.sessionId)
      const localTeam: Team | undefined = localPlayer?.team
      const localPosition: Position | undefined = localPlayer
        ? { x: localPlayer.x as number, y: localPlayer.y as number }
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

    const text = this.add.text(x, y, label, {
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
