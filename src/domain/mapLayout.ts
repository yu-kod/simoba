import { WORLD_WIDTH, WORLD_HEIGHT } from '@/domain/constants'

// --- Layout geometry ---

const LANE_HEIGHT = 200
const LANE_Y = (WORLD_HEIGHT - LANE_HEIGHT) / 2

const BASE_WIDTH = 120
const BASE_HEIGHT = 160
const BASE_Y = (WORLD_HEIGHT - BASE_HEIGHT) / 2

const TOWER_RADIUS = 24

const BUSH_WIDTH = 140
const BUSH_HEIGHT = 60

export const MAP_LAYOUT = {
  lane: {
    x: 0,
    y: LANE_Y,
    width: WORLD_WIDTH,
    height: LANE_HEIGHT,
  },

  bases: {
    blue: {
      x: 0,
      y: BASE_Y,
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
    },
    red: {
      x: WORLD_WIDTH - BASE_WIDTH,
      y: BASE_Y,
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
    },
  },

  towers: {
    blue: {
      x: 600,
      y: WORLD_HEIGHT / 2,
      radius: TOWER_RADIUS,
    },
    red: {
      x: WORLD_WIDTH - 600,
      y: WORLD_HEIGHT / 2,
      radius: TOWER_RADIUS,
    },
  },

  bushes: [
    {
      x: 1200,
      y: LANE_Y - BUSH_HEIGHT + 10,
      width: BUSH_WIDTH,
      height: BUSH_HEIGHT,
    },
    {
      x: WORLD_WIDTH - 1200 - BUSH_WIDTH,
      y: LANE_Y + LANE_HEIGHT - 10,
      width: BUSH_WIDTH,
      height: BUSH_HEIGHT,
    },
  ],

  bossSpawn: {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
  },
} as const

// --- Color palette ---

export const MAP_COLORS = {
  background: 0x2d3436,
  lane: 0x636e72,
  bases: {
    blue: 0x2980b9,
    red: 0xc0392b,
  },
  towers: {
    blue: 0x3498db,
    red: 0xe74c3c,
  },
  bush: 0x27ae60,
  bossSpawn: 0xf39c12,
} as const
