import Phaser from 'phaser'
import type { Position } from '@/domain/types'
import type {
  InputState,
  WASDKeys,
  CastMode,
  SkillSlot,
} from '@/domain/input/InputState'
import { computeMovement } from '@/domain/input/computeMovement'
import { computeAimDirection } from '@/domain/input/computeAim'
import {
  updateTargeting,
  type TargetingAction,
} from '@/domain/input/targetingReducer'
import type { TargetingState } from '@/domain/input/InputState'

const DEFAULT_CAST_MODE: CastMode = 'normal'

const SKILL_KEY_MAP: Record<string, SkillSlot> = {
  Q: 'Q',
  E: 'E',
  R: 'R',
}

export class InputHandler {
  private readonly keys: {
    w: Phaser.Input.Keyboard.Key
    a: Phaser.Input.Keyboard.Key
    s: Phaser.Input.Keyboard.Key
    d: Phaser.Input.Keyboard.Key
    q: Phaser.Input.Keyboard.Key
    e: Phaser.Input.Keyboard.Key
    r: Phaser.Input.Keyboard.Key
    space: Phaser.Input.Keyboard.Key
  }
  private targeting: TargetingState = { phase: 'idle' }
  private attackTriggered = false
  private leftClickTriggered = false
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const keyboard = scene.input.keyboard!

    this.keys = {
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      q: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      e: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      r: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    }

    this.setupSkillKeyEvents()
    this.setupMouseEvents(scene)
    this.suppressContextMenu(scene)
  }

  read(heroPosition: Position): InputState {
    const wasd: WASDKeys = {
      w: this.keys.w.isDown,
      a: this.keys.a.isDown,
      s: this.keys.s.isDown,
      d: this.keys.d.isDown,
    }

    const mouseWorldPosition = this.getMouseWorldPosition()
    const movement = computeMovement(wasd)
    const aimDirection = computeAimDirection(heroPosition, mouseWorldPosition)

    const attack = this.attackTriggered
    this.attackTriggered = false

    // Process left click for targeting
    if (this.leftClickTriggered) {
      this.targeting = updateTargeting(this.targeting, {
        type: 'LEFT_CLICK',
        mouseWorldPosition,
      })
      this.leftClickTriggered = false
    }

    const targeting = this.targeting

    // Reset fired/cancelled states for next frame
    this.targeting = updateTargeting(this.targeting, { type: 'RESET' })

    const dodge = Phaser.Input.Keyboard.JustDown(this.keys.space)

    return {
      movement,
      aimDirection,
      aimWorldPosition: mouseWorldPosition,
      attack,
      targeting,
      dodge,
    }
  }

  private getMouseWorldPosition(): Position {
    const pointer = this.scene.input.activePointer
    const camera = this.scene.cameras.main
    const worldPoint = camera.getWorldPoint(pointer.x, pointer.y)
    return { x: worldPoint.x, y: worldPoint.y }
  }

  private setupSkillKeyEvents(): void {
    for (const [keyName, slot] of Object.entries(SKILL_KEY_MAP)) {
      const key = this.keys[keyName.toLowerCase() as 'q' | 'e' | 'r']

      key.on('down', () => {
        const action: TargetingAction = {
          type: 'SKILL_KEY_DOWN',
          skill: slot,
          mode: DEFAULT_CAST_MODE,
        }
        this.targeting = updateTargeting(this.targeting, action)
      })

      key.on('up', () => {
        const mouseWorldPosition = this.getMouseWorldPosition()
        const action: TargetingAction = {
          type: 'SKILL_KEY_UP',
          skill: slot,
          mouseWorldPosition,
        }
        this.targeting = updateTargeting(this.targeting, action)
      })
    }
  }

  private setupMouseEvents(scene: Phaser.Scene): void {
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        // Right click: attack or cancel targeting
        if (this.targeting.phase === 'targeting') {
          this.targeting = updateTargeting(this.targeting, {
            type: 'RIGHT_CLICK',
          })
        } else {
          this.attackTriggered = true
        }
      } else if (pointer.leftButtonDown()) {
        this.leftClickTriggered = true
      }
    })
  }

  private suppressContextMenu(scene: Phaser.Scene): void {
    scene.game.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })
  }
}
