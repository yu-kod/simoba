import { Client, Room } from 'colyseus.js'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected'

export class NetworkClient {
  private client: Client
  private room: Room | null = null
  private _state: ConnectionState = 'disconnected'

  constructor(serverUrl: string = 'ws://localhost:2567') {
    this.client = new Client(serverUrl)
  }

  get state(): ConnectionState {
    return this._state
  }

  get currentRoom(): Room | null {
    return this.room
  }

  async connect(roomName: string = 'game'): Promise<Room> {
    this._state = 'connecting'
    try {
      this.room = await this.client.joinOrCreate(roomName)
      this._state = 'connected'
      return this.room
    } catch (error) {
      this._state = 'disconnected'
      throw error
    }
  }

  disconnect(): void {
    if (this.room) {
      this.room.leave()
      this.room = null
    }
    this._state = 'disconnected'
  }
}
