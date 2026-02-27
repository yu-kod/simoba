import Phaser from 'phaser'

const DEFAULT_FONT_FAMILY = '"Segoe UI", "Helvetica Neue", Arial, sans-serif'

export function createText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style?: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  const mergedStyle = {
    fontFamily: DEFAULT_FONT_FAMILY,
    ...style,
  }
  return scene.add.text(x, y, text, mergedStyle)
}
