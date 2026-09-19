import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';

export type DuelMessage =
  | { type: 'JOIN'; payload: { id: string; name: string }; roomCode: string; senderId: string }
  | { type: 'REQUEST_SYNC'; payload: { id: string; name: string }; roomCode: string; senderId: string }
  | { type: 'ROOM_SYNC'; payload: { players: any[]; gameId: string; difficulty: string; status: string; matchDuration?: number }; roomCode: string; senderId: string }
  | { type: 'START_COUNTDOWN'; payload: { seed: number; matchDuration?: number }; roomCode: string; senderId: string }
  | { type: 'SCORE_UPDATE'; payload: { id: string; name?: string; isHost?: boolean; score: number; streak: number; progress?: number }; roomCode: string; senderId: string }
  | { type: 'BOARD_MOVE'; payload: { id: string; moveData: any; score: number; nextTurnPlayerId: string }; roomCode: string; senderId: string }
  | { type: 'FINISH_GAME'; payload: { id: string; name?: string; isHost?: boolean; score: number; stats?: any }; roomCode: string; senderId: string }
  | { type: 'REMATCH'; payload: { id: string }; roomCode: string; senderId: string }
  | { type: 'LEAVE'; payload: { id: string }; roomCode: string; senderId: string }
  | { type: 'STICKER'; payload: { id: string; stickerId: string; senderId: string; senderName: string; timestamp: number }; roomCode: string; senderId: string };

class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private messageHandlers: ((msg: DuelMessage) => void)[] = [];
  private myId: string = '';
  private currentRoomCode: string = '';

  constructor() {
    this.myId = 'player_' + Math.random().toString(36).substring(2, 9);
    try {
      this.broadcastChannel = new BroadcastChannel('mathbrain_duel_network');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && typeof event.data === 'object') {
          const msg = event.data as DuelMessage;
          // Filter out our own messages and messages from other rooms
          if (msg.senderId !== this.myId && (!this.currentRoomCode || msg.roomCode === this.currentRoomCode)) {
            this.handleMessage(msg);
          }
        }
      };
    } catch {
      // BroadcastChannel fallback
    }
  }

  public getMyId(): string {
    return this.myId;
  }

  public getRoomCode(): string {
    return this.currentRoomCode;
  }

  public createRoom(code: string): Promise<string> {
    this.currentRoomCode = code.toUpperCase();
    this.destroyPeerOnly();

    return new Promise((resolve) => {
      const hostPeerId = `mb-room-${this.currentRoomCode.toLowerCase()}`;
      
      try {
        this.peer = new Peer(hostPeerId, {
          debug: 1,
        });

        this.peer.on('open', (id) => {
          this.setupHostListeners();
          resolve(id);
        });

        this.peer.on('error', (err) => {
          console.warn('Peer error during createRoom:', err);
          // If Peer ID already registered (e.g. refresh), fallback is ready via BroadcastChannel
          resolve(hostPeerId);
        });

        // Resolve after 2s if broker is slow
        setTimeout(() => resolve(hostPeerId), 2000);
      } catch (err) {
        console.warn('Failed to init Peer:', err);
        resolve(hostPeerId);
      }
    });
  }

  public joinRoom(code: string, playerName: string = ''): Promise<void> {
    this.currentRoomCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.destroyPeerOnly();

    return new Promise((resolve) => {
      const guestPeerId = `mb-guest-${this.myId}`;
      const targetHostId = `mb-room-${this.currentRoomCode.toLowerCase()}`;

      try {
        this.peer = new Peer(guestPeerId, {
          debug: 1,
        });

        this.peer.on('open', () => {
          try {
            const conn = this.peer!.connect(targetHostId, { reliable: true });

            conn.on('open', () => {
              this.connections.set(targetHostId, conn);
              conn.send({
                type: 'JOIN',
                payload: { id: this.myId, name: playerName },
                roomCode: this.currentRoomCode,
                senderId: this.myId,
              });
              resolve();
            });

            conn.on('data', (data) => {
              this.handleMessage(data as DuelMessage);
            });

            conn.on('error', (err) => {
              console.warn('Guest connection error:', err);
              resolve();
            });

            setTimeout(() => resolve(), 2500);
          } catch {
            resolve();
          }
        });

        this.peer.on('error', (err) => {
          console.warn('Guest peer error:', err);
          resolve();
        });

        setTimeout(() => resolve(), 2500);
      } catch (err) {
        console.warn('Failed to init guest peer:', err);
        resolve();
      }
    });
  }

  private setupHostListeners() {
    if (!this.peer) return;

    this.peer.on('connection', (conn) => {
      this.connections.set(conn.peer, conn);

      conn.on('data', (data) => {
        const msg = data as DuelMessage;
        this.handleMessage(msg);

        // Host relays message to other connected clients
        this.connections.forEach((otherConn, id) => {
          if (id !== conn.peer && otherConn.open) {
            otherConn.send(msg);
          }
        });
      });

      conn.on('close', () => {
        this.connections.delete(conn.peer);
      });
    });
  }

  public broadcast(msgPayload: { type: DuelMessage['type']; payload: any }) {
    const fullMsg: DuelMessage = {
      ...msgPayload,
      roomCode: this.currentRoomCode,
      senderId: this.myId,
    } as DuelMessage;

    // 1. Send through WebRTC DataConnections
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(fullMsg);
      }
    });

    // 2. BroadcastChannel for instant local tab sync
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(fullMsg);
    }
  }

  public onMessage(handler: (msg: DuelMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  private handleMessage(msg: DuelMessage) {
    if (!msg || typeof msg !== 'object') return;
    this.messageHandlers.forEach((h) => {
      try {
        h(msg);
      } catch (e) {
        console.error('Error in message handler:', e);
      }
    });
  }

  private destroyPeerOnly() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  public destroy() {
    this.destroyPeerOnly();
    this.currentRoomCode = '';
  }
}

export const peerService = new PeerService();
