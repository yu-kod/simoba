import http from 'node:http'
import express from 'express'
import cors from 'cors'
import { Server } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { GameRoom } from './rooms/GameRoom.js'
import { setupServerLogging } from './config/logging.js'
import { createServerLogger } from '@shared/logging'

await setupServerLogging()

const logger = createServerLogger('system')

const PORT = Number(process.env.PORT) || 2567
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173']

const app = express()

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST'],
  credentials: true,
}))

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

const httpServer = http.createServer(app)

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
})

gameServer.define('game', GameRoom)

gameServer.listen(PORT).then(() => {
  logger.info`Colyseus server listening on ws://localhost:${PORT}`
})
