import { MAP_LAYOUT, MAP_COLORS } from '@/domain/mapLayout'
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/domain/constants'

describe('mapLayout', () => {
  describe('MAP_LAYOUT', () => {
    describe('lane', () => {
      it('should span the full world width', () => {
        expect(MAP_LAYOUT.lane.x).toBe(0)
        expect(MAP_LAYOUT.lane.width).toBe(WORLD_WIDTH)
      })

      it('should be vertically centered in the world', () => {
        const laneCenter = MAP_LAYOUT.lane.y + MAP_LAYOUT.lane.height / 2
        expect(laneCenter).toBeCloseTo(WORLD_HEIGHT / 2)
      })

      it('should be within world bounds', () => {
        expect(MAP_LAYOUT.lane.y).toBeGreaterThanOrEqual(0)
        expect(MAP_LAYOUT.lane.y + MAP_LAYOUT.lane.height).toBeLessThanOrEqual(
          WORLD_HEIGHT
        )
      })
    })

    describe('bases', () => {
      it('should place blue base at the left edge', () => {
        expect(MAP_LAYOUT.bases.blue.x).toBe(0)
      })

      it('should place red base at the right edge', () => {
        const redRight =
          MAP_LAYOUT.bases.red.x + MAP_LAYOUT.bases.red.width
        expect(redRight).toBe(WORLD_WIDTH)
      })

      it('should have both bases within world bounds vertically', () => {
        expect(MAP_LAYOUT.bases.blue.y).toBeGreaterThanOrEqual(0)
        expect(
          MAP_LAYOUT.bases.blue.y + MAP_LAYOUT.bases.blue.height
        ).toBeLessThanOrEqual(WORLD_HEIGHT)

        expect(MAP_LAYOUT.bases.red.y).toBeGreaterThanOrEqual(0)
        expect(
          MAP_LAYOUT.bases.red.y + MAP_LAYOUT.bases.red.height
        ).toBeLessThanOrEqual(WORLD_HEIGHT)
      })
    })

    describe('towers', () => {
      it('should place blue tower between blue base and world center', () => {
        const baseRight =
          MAP_LAYOUT.bases.blue.x + MAP_LAYOUT.bases.blue.width
        expect(MAP_LAYOUT.towers.blue.x).toBeGreaterThan(baseRight)
        expect(MAP_LAYOUT.towers.blue.x).toBeLessThan(WORLD_WIDTH / 2)
      })

      it('should place red tower between world center and red base', () => {
        expect(MAP_LAYOUT.towers.red.x).toBeGreaterThan(WORLD_WIDTH / 2)
        expect(MAP_LAYOUT.towers.red.x).toBeLessThan(MAP_LAYOUT.bases.red.x)
      })

      it('should place towers within lane y range', () => {
        const laneTop = MAP_LAYOUT.lane.y
        const laneBottom = MAP_LAYOUT.lane.y + MAP_LAYOUT.lane.height

        expect(MAP_LAYOUT.towers.blue.y).toBeGreaterThanOrEqual(laneTop)
        expect(MAP_LAYOUT.towers.blue.y).toBeLessThanOrEqual(laneBottom)

        expect(MAP_LAYOUT.towers.red.y).toBeGreaterThanOrEqual(laneTop)
        expect(MAP_LAYOUT.towers.red.y).toBeLessThanOrEqual(laneBottom)
      })
    })

    describe('bushes', () => {
      it('should have exactly 2 bushes', () => {
        expect(MAP_LAYOUT.bushes).toHaveLength(2)
      })

      it('should place all bushes within world bounds', () => {
        for (const bush of MAP_LAYOUT.bushes) {
          expect(bush.x).toBeGreaterThanOrEqual(0)
          expect(bush.x + bush.width).toBeLessThanOrEqual(WORLD_WIDTH)
          expect(bush.y).toBeGreaterThanOrEqual(0)
          expect(bush.y + bush.height).toBeLessThanOrEqual(WORLD_HEIGHT)
        }
      })

      it('should place bushes near the lane edges', () => {
        const laneTop = MAP_LAYOUT.lane.y
        const laneBottom = MAP_LAYOUT.lane.y + MAP_LAYOUT.lane.height

        for (const bush of MAP_LAYOUT.bushes) {
          const bushCenter = bush.y + bush.height / 2
          const nearTop = Math.abs(bushCenter - laneTop) < 100
          const nearBottom = Math.abs(bushCenter - laneBottom) < 100
          expect(nearTop || nearBottom).toBe(true)
        }
      })
    })

    describe('bossSpawn', () => {
      it('should be at world center horizontally', () => {
        expect(MAP_LAYOUT.bossSpawn.x).toBe(WORLD_WIDTH / 2)
      })

      it('should be at world center vertically', () => {
        expect(MAP_LAYOUT.bossSpawn.y).toBe(WORLD_HEIGHT / 2)
      })
    })
  })

  describe('MAP_COLORS', () => {
    it('should have distinct colors for all elements', () => {
      const colors = [
        MAP_COLORS.background,
        MAP_COLORS.lane,
        MAP_COLORS.bases.blue,
        MAP_COLORS.bases.red,
        MAP_COLORS.bush,
        MAP_COLORS.bossSpawn,
      ]
      const unique = new Set(colors)
      expect(unique.size).toBe(colors.length)
    })

    it('should have different colors for blue and red teams', () => {
      expect(MAP_COLORS.bases.blue).not.toBe(MAP_COLORS.bases.red)
      expect(MAP_COLORS.towers.blue).not.toBe(MAP_COLORS.towers.red)
    })
  })
})
