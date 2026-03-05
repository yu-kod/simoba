import type Phaser from 'phaser'

/**
 * Draw a regular flat-top hexagon path on a Phaser Graphics object.
 * Call gfx.fillPath() / gfx.strokePath() after this to render.
 */
export function drawHexPath(
  gfx: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  r: number,
): void {
  gfx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6
    const px = cx + Math.cos(a) * r
    const py = cy + Math.sin(a) * r
    if (i === 0) gfx.moveTo(px, py)
    else gfx.lineTo(px, py)
  }
  gfx.closePath()
}
