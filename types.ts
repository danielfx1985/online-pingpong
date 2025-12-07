export enum GameStatus {
  MENU = 'MENU',
  LOBBY_HOST = 'LOBBY_HOST',
  LOBBY_JOIN = 'LOBBY_JOIN',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface PlayerState {
  y: number;
  score: number;
  name: string;
  connected: boolean;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GameState {
  player1: PlayerState; // Host (Left)
  player2: PlayerState; // Client (Right)
  ball: BallState;
  isPaused: boolean;
  winner?: string;
}

export interface NetworkMessage {
  type: 'SYNC' | 'INPUT' | 'START' | 'RESET';
  payload?: any;
}

