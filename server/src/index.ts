import http from 'node:http'
import express from 'express'
import { Server } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { GameRoom } from './rooms/GameRoom.js'

const PORT = Number(process.env.PORT) || 2567

const app = express()

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

const httpServer = http.createServer(app)

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
})

gameServer.define('game', GameRoom)

gameServer.listen(PORT).then(() => {
  // eslint-disable-next-line no-console
  console.log(`Colyseus server listening on ws://localhost:${PORT}`)
})
