import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { peerService } from '../services/peerService';
import type { DuelMessage } from '../services/peerService';
import { soundService } from '../services/soundService';
import type { GameId, Difficulty } from '../types';
export type { GameId, Difficulty };
export type DuelStatus = 'idle' | 'waiting' | 'starting' | 'playing' | 'result';

export interface ActiveStickerEvent {
  id: string;
  stickerId: string;
  senderId: string;
  senderName: string;
  isMe: boolean;
  timestamp: number;
}

export interface DuelPlayer {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  streak: number;
  isFinished: boolean;
  stats?: any;
  progress?: number;
}

interface DuelState {
  playerName: string;
  roomCode: string;
  isHost: boolean;
  gameId: GameId;
  difficulty: Difficulty;
  status: DuelStatus;
  players: DuelPlayer[];
  countdown: number;
  seed: number;
  currentTurnPlayerId: string;
  lastBoardMove: { id: string; moveData: any; score: number } | null;
  matchDuration: number;
  activeStickers: ActiveStickerEvent[];
  lastStickerSentTime: number;
  stickerUsage: Record<string, number>;
  isStickerTrayOpen: boolean;
  
  setPlayerName: (name: string) => void;
  setMatchDuration: (duration: number) => void;
  createRoom: (gameId: GameId, diff: Difficulty, duration?: number, code?: string) => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  startGame: () => void;
  updateMyScore: (score: number, streak: number, progress?: number) => void;
  sendBoardMove: (moveData: any, myNewScore: number, explicitNextTurnId?: string) => void;
  finishMyGame: (score: number, stats?: any) => void;
  forfeitMyGame: () => void;
  requestRematch: () => void;
  leaveRoom: () => void;
  sendSticker: (stickerId: string) => boolean;
  dismissSticker: (id: string) => void;
  setStickerTrayOpen: (open: boolean) => void;
}

const generateCode = () => 'MB' + Math.floor(1000 + Math.random() * 9000).toString();

export const useDuelStore = create<DuelState>()(
  persist(
    (set, get) => {
      peerService.onMessage((msg: DuelMessage) => {
        const state = get();
        switch (msg.type) {
          case 'JOIN':
            if (state.isHost) {
              const guestId = msg.payload.id || msg.senderId;
              const guestName = msg.payload.name || 'Lawan';
              const withoutGuest = state.players.filter(p => p.id !== guestId && (p.isHost || p.name !== guestName));
              const newPlayers = [
                ...withoutGuest,
                {
                  id: guestId,
                  name: guestName,
                  isHost: false,
                  score: 0,
                  streak: 0,
                  isFinished: false
                }
              ];
              set({ players: newPlayers });
              peerService.broadcast({
                type: 'ROOM_SYNC',
                payload: {
                  players: newPlayers,
                  gameId: state.gameId,
                  difficulty: state.difficulty,
                  status: state.status,
                  matchDuration: state.matchDuration,
                }
              });
            }
            break;
          case 'REQUEST_SYNC':
            if (state.isHost) {
              peerService.broadcast({
                type: 'ROOM_SYNC',
                payload: {
                  players: state.players,
                  gameId: state.gameId,
                  difficulty: state.difficulty,
                  status: state.status,
                  matchDuration: state.matchDuration,
                }
              });
            }
            break;
          case 'ROOM_SYNC':
            if (!state.isHost) {
              set({
                players: msg.payload.players,
                gameId: msg.payload.gameId as GameId,
                difficulty: msg.payload.difficulty as Difficulty,
                matchDuration: msg.payload.matchDuration || get().matchDuration,
                status: (msg.payload.status === 'playing' || msg.payload.status === 'starting') ? msg.payload.status as DuelStatus : get().status
              });
            }
            break;
          case 'START_COUNTDOWN': {
            const hostPlayer = get().players.find(p => p.isHost);
            set({
              status: 'starting',
              seed: msg.payload.seed,
              matchDuration: msg.payload.matchDuration || get().matchDuration,
              countdown: 3,
              currentTurnPlayerId: hostPlayer?.id || '',
              lastBoardMove: null,
            });
            const iv = setInterval(() => {
              const c = get().countdown;
              if (c > 1) {
                set({ countdown: c - 1 });
              } else {
                clearInterval(iv);
                set({ status: 'playing' });
              }
            }, 1000);
            break;
          }
          case 'BOARD_MOVE': {
            const senderId = msg.payload.id || msg.senderId;
            set({
              currentTurnPlayerId: msg.payload.nextTurnPlayerId,
              lastBoardMove: { id: senderId, moveData: msg.payload.moveData, score: msg.payload.score },
              players: get().players.map(p =>
                (p.id === senderId || (msg.senderId && p.id === msg.senderId))
                  ? { ...p, score: msg.payload.score }
                  : p
              ),
            });
            break;
          }
          case 'SCORE_UPDATE': {
            const targetId = msg.payload.id || msg.senderId;
            set({
              players: get().players.map(p =>
                (p.id === targetId || (msg.payload.name && p.name === msg.payload.name) || (msg.payload.isHost !== undefined && p.isHost === msg.payload.isHost))
                  ? { ...p, score: msg.payload.score, streak: msg.payload.streak, progress: msg.payload.progress }
                  : p
              )
            });
            break;
          }
          case 'FINISH_GAME': {
            const isSurrendered = Boolean(msg.payload.stats?.surrendered);
            const targetId = msg.payload.id || msg.senderId;
            const updatedPlayers = get().players.map(p => 
              (p.id === targetId || (msg.payload.name && p.name === msg.payload.name) || (msg.payload.isHost !== undefined && p.isHost === msg.payload.isHost))
                ? { ...p, score: msg.payload.score, isFinished: true, stats: msg.payload.stats }
                : p
            );
            const myId = peerService.getMyId();
            const myPlayer = updatedPlayers.find(p => p.id === myId || (p.isHost && get().isHost) || p.name === get().playerName);
            const allFinished = isSurrendered || (Boolean(myPlayer?.isFinished) && updatedPlayers.every(p => p.isFinished));
            set({
              players: updatedPlayers,
              status: (isSurrendered || allFinished) ? 'result' : get().status,
            });
            break;
          }
          case 'REMATCH': {
            const resetPlayers = get().players.map(p => ({
              ...p,
              score: 0,
              streak: 0,
              progress: 0,
              isFinished: false,
              stats: undefined,
            }));
            set({
              status: 'waiting',
              players: resetPlayers,
            });
            if (state.isHost) {
              peerService.broadcast({
                type: 'ROOM_SYNC',
                payload: {
                  players: resetPlayers,
                  gameId: state.gameId,
                  difficulty: state.difficulty,
                  status: 'waiting',
                },
              });
            }
            break;
          }
          case 'STICKER': {
            const stickerPayload = msg.payload;
            soundService.playStickerPop();
            const newEvent: ActiveStickerEvent = {
              id: stickerPayload.id || 'stk_' + Math.random().toString(36).substring(2, 9),
              stickerId: stickerPayload.stickerId,
              senderId: stickerPayload.senderId,
              senderName: stickerPayload.senderName || 'Lawan',
              isMe: false,
              timestamp: stickerPayload.timestamp || Date.now(),
            };
            set({
              activeStickers: [...get().activeStickers, newEvent],
            });
            setTimeout(() => {
              get().dismissSticker(newEvent.id);
            }, 2500);
            break;
          }
        }
      });

      return {
        playerName: 'Player ' + Math.floor(100 + Math.random() * 900),
        roomCode: '',
        isHost: false,
        gameId: 'speed-addition',
        difficulty: 'medium',
        status: 'idle',
        players: [],
        countdown: 3,
        seed: 0,
        currentTurnPlayerId: '',
        lastBoardMove: null,
        matchDuration: 1200,
        activeStickers: [],
        lastStickerSentTime: 0,
        stickerUsage: {},
        isStickerTrayOpen: false,
        
        setPlayerName: (name) => set({ playerName: name }),
        setMatchDuration: (duration: number) => {
          set({ matchDuration: duration });
          if (get().isHost) {
            peerService.broadcast({
              type: 'ROOM_SYNC',
              payload: {
                players: get().players,
                gameId: get().gameId,
                difficulty: get().difficulty,
                status: get().status,
                matchDuration: duration,
              }
            });
          }
        },
        
        createRoom: async (gameId, difficulty, duration = 1200, code) => {
          const roomCode = (code || generateCode()).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const myId = peerService.getMyId();
          await peerService.createRoom(roomCode);
          set({
            roomCode,
            isHost: true,
            gameId,
            difficulty,
            matchDuration: duration,
            status: 'waiting',
            currentTurnPlayerId: myId,
            lastBoardMove: null,
            players: [{
              id: myId,
              name: get().playerName,
              isHost: true,
              score: 0,
              streak: 0,
              isFinished: false
            }]
          });
        },
        
        joinRoom: async (code) => {
          const roomCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const myId = peerService.getMyId();
          await peerService.joinRoom(roomCode, get().playerName);
          set({
            roomCode,
            isHost: false,
            status: 'waiting',
            currentTurnPlayerId: '',
            lastBoardMove: null,
            players: [{
              id: myId,
              name: get().playerName,
              isHost: false,
              score: 0,
              streak: 0,
              isFinished: false
            }]
          });
          peerService.broadcast({
            type: 'JOIN',
            payload: { id: myId, name: get().playerName }
          });
        },

        startGame: () => {
          if (get().isHost && get().players.length >= 2) {
            const seed = Math.floor(Math.random() * 1000000);
            const myId = peerService.getMyId();
            peerService.broadcast({
              type: 'START_COUNTDOWN',
              payload: { seed, matchDuration: get().matchDuration }
            });
            set({
              status: 'starting',
              seed,
              countdown: 3,
              currentTurnPlayerId: myId,
              lastBoardMove: null,
            });
            const iv = setInterval(() => {
              const c = get().countdown;
              if (c > 1) {
                set({ countdown: c - 1 });
              } else {
                clearInterval(iv);
                set({ status: 'playing' });
              }
            }, 1000);
          }
        },
        
        sendBoardMove: (moveData: any, myNewScore: number, explicitNextTurnId?: string) => {
          const myId = peerService.getMyId();
          const myName = get().playerName;
          const isHost = get().isHost;
          const opponent = get().players.find(p => p.id !== myId && p.name !== myName);
          const nextTurnId = explicitNextTurnId || opponent?.id || (isHost ? 'guest' : 'host');

          set({
            currentTurnPlayerId: nextTurnId,
            lastBoardMove: { id: myId, moveData, score: myNewScore },
            players: get().players.map(p =>
              (p.id === myId || (p.isHost && isHost) || p.name === myName)
                ? { ...p, score: myNewScore }
                : p
            ),
          });

          peerService.broadcast({
            type: 'BOARD_MOVE',
            payload: {
              id: myId,
              moveData,
              score: myNewScore,
              nextTurnPlayerId: nextTurnId,
            },
          });
        },

        updateMyScore: (score, streak, progress) => {
          const myId = peerService.getMyId();
          const myName = get().playerName;
          const isHost = get().isHost;
          set({
            players: get().players.map(p =>
              (p.id === myId || (p.isHost && isHost) || p.name === myName)
                ? { ...p, score, streak, progress }
                : p
            )
          });
          peerService.broadcast({
            type: 'SCORE_UPDATE',
            payload: { id: myId, name: myName, isHost, score, streak, progress }
          });
        },
        
        finishMyGame: (score, stats) => {
          const myId = peerService.getMyId();
          const myName = get().playerName;
          const isHost = get().isHost;
          const currentPlayers = get().players.map(p =>
            (p.id === myId || (p.isHost && isHost) || p.name === myName)
              ? { ...p, score, isFinished: true, stats }
              : p
          );
          set({ players: currentPlayers });
          peerService.broadcast({
            type: 'FINISH_GAME',
            payload: { id: myId, name: myName, isHost, score, stats }
          });
          if (currentPlayers.every(p => p.isFinished)) {
            set({ status: 'result' });
          }
        },

        forfeitMyGame: () => {
          const myId = peerService.getMyId();
          const myName = get().playerName;
          const isHost = get().isHost;
          const me = get().players.find(p => p.id === myId || (p.isHost && isHost) || p.name === myName);
          const score = me?.score || 0;
          set({
            status: 'result',
            players: get().players.map(p =>
              (p.id === myId || (p.isHost && isHost) || p.name === myName)
                ? { ...p, score, isFinished: true, stats: { surrendered: true } }
                : { ...p, isFinished: true }
            ),
          });
          peerService.broadcast({
            type: 'FINISH_GAME',
            payload: { id: myId, name: myName, isHost, score, stats: { surrendered: true } },
          });
        },
        
        requestRematch: () => {
          const myId = peerService.getMyId();
          const resetPlayers = get().players.map(p => ({
            ...p,
            score: 0,
            streak: 0,
            progress: 0,
            isFinished: false,
            stats: undefined,
          }));
          set({
            status: 'waiting',
            players: resetPlayers,
            activeStickers: [],
            isStickerTrayOpen: false,
          });
          peerService.broadcast({
            type: 'REMATCH',
            payload: { id: myId },
          });
          if (get().isHost) {
            peerService.broadcast({
              type: 'ROOM_SYNC',
              payload: {
                players: resetPlayers,
                gameId: get().gameId,
                difficulty: get().difficulty,
                status: 'waiting',
              },
            });
          }
        },
        
        leaveRoom: () => {
          peerService.destroy();
          set({ status: 'idle', roomCode: '', players: [], activeStickers: [], isStickerTrayOpen: false });
        },

        sendSticker: (stickerId: string) => {
          const now = Date.now();
          const lastTime = get().lastStickerSentTime;
          if (now - lastTime < 3000) {
            return false;
          }
          const myId = peerService.getMyId();
          const myName = get().playerName;
          const eventId = 'stk_' + Math.random().toString(36).substring(2, 9);
          soundService.playStickerPop();

          const newEvent: ActiveStickerEvent = {
            id: eventId,
            stickerId,
            senderId: myId,
            senderName: myName,
            isMe: true,
            timestamp: now,
          };

          const currentUsage = get().stickerUsage || {};
          const newUsage = { ...currentUsage, [stickerId]: (currentUsage[stickerId] || 0) + 1 };

          set({
            lastStickerSentTime: now,
            activeStickers: [...get().activeStickers, newEvent],
            stickerUsage: newUsage,
          });

          peerService.broadcast({
            type: 'STICKER',
            payload: {
              id: eventId,
              stickerId,
              senderId: myId,
              senderName: myName,
              timestamp: now,
            },
          });

          setTimeout(() => {
            get().dismissSticker(eventId);
          }, 2500);

          return true;
        },

        dismissSticker: (id: string) => {
          set({
            activeStickers: get().activeStickers.filter(s => s.id !== id),
          });
        },

        setStickerTrayOpen: (open: boolean) => {
          set({ isStickerTrayOpen: open });
        }
      };
    },
    {
      name: 'duel-storage',
      partialize: (state) => ({ 
        playerName: state.playerName,
        stickerUsage: state.stickerUsage 
      }),
    }
  )
);
