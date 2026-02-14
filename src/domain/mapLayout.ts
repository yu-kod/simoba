import { WORLD_WIDTH, WORLD_HEIGHT } from '@/domain/constants'

// --- Layout geometry ---

const LANE_HEIGHT = 200
const LANE_Y = (WORLD_HEIGHT - LANE_HEIGHT) / 2

const BASE_WIDTH = 120
const BASE_HEIGHT = 160
const BASE_Y = (WORLD_HEIGHT - BASE_HEIGHT) / 2

const TOWER_RADIUS = 24
const TOWER_DISTANCE_FROM_EDGE = 600

const BUSH_WIDTH = 140
const BUSH_HEIGHT = 60
const BUSH_DISTANCE_FROM_EDGE = 1200
const BUSH_LANE_OVERLAP = 10

const BOSS_MARKER_RADIUS = 16
const BOSS_MARKER_INNER_RADIUS = 8

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
      x: TOWER_DISTANCE_FROM_EDGE,
      y: WORLD_HEIGHT / 2,
      radius: TOWER_RADIUS,
    },
    red: {
      x: WORLD_WIDTH - TOWER_DISTANCE_FROM_EDGE,
      y: WORLD_HEIGHT / 2,
      radius: TOWER_RADIUS,
    },
  },

  bushes: [
    {
      x: BUSH_DISTANCE_FROM_EDGE,
      y: LANE_Y - BUSH_HEIGHT + BUSH_LANE_OVERLAP,
      width: BUSH_WIDTH,
      height: BUSH_HEIGHT,
    },
    {
      x: WORLD_WIDTH - BUSH_DISTANCE_FROM_EDGE - BUSH_WIDTH,
      y: LANE_Y + LANE_HEIGHT - BUSH_LANE_OVERLAP,
      width: BUSH_WIDTH,
      height: BUSH_HEIGHT,
    },
  ],

  bossSpawn: {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    markerRadius: BOSS_MARKER_RADIUS,
    markerInnerRadius: BOSS_MARKER_INNER_RADIUS,
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
