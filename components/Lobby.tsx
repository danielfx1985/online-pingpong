import React, { useState } from 'react';
import { GameStatus } from '../types';

interface LobbyProps {
  status: GameStatus;
  peerId: string | null; // Kept for interface compatibility but not used
  onJoin: (hostIp: string) => void;
  onCancel: () => void;
  setStatus: (status: GameStatus) => void;
  error: string | null;
}

const Lobby: React.FC<LobbyProps> = ({ status, onJoin, onCancel, setStatus, error }) => {
  const [targetIp, setTargetIp] = useState(window.location.hostname);

  if (status === GameStatus.MENU) {
    return (
      <div className="flex flex-col gap-6 max-w-md w-full animate-fade-in">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 text-center mb-8 drop-shadow-lg tracking-tight">
          NEON PONG
        </h1>
        
        <button
          onClick={() => setStatus(GameStatus.LOBBY_HOST)}
          className="group relative px-8 py-4 bg-cyan-900/30 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-100 rounded-xl transition-all duration-300 backdrop-blur-sm overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-cyan-400/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          <span className="relative text-xl font-bold tracking-wider flex items-center justify-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            CREATE GAME
          </span>
        </button>

        <button
          onClick={() => setStatus(GameStatus.LOBBY_JOIN)}
          className="group relative px-8 py-4 bg-pink-900/30 border border-pink-500/50 hover:bg-pink-500/20 text-pink-100 rounded-xl transition-all duration-300 backdrop-blur-sm overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-pink-400/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          <span className="relative text-xl font-bold tracking-wider flex items-center justify-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            JOIN GAME
          </span>
        </button>
      </div>
    );
  }

  if (status === GameStatus.LOBBY_HOST) {
    return (
      <div className="bg-gray-800/80 p-8 rounded-2xl border border-cyan-500/30 backdrop-blur-md max-w-lg w-full shadow-2xl shadow-cyan-900/20">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">Hosting Game</h2>
        
        <div className="space-y-4 mb-8">
          <p className="text-gray-300 text-sm text-center">
            Tell your friend to connect to your IP address.
            <br/>
            (If on same WiFi, usually 192.168.x.x)
          </p>
          
          <div className="flex justify-center">
            <div className="flex items-center gap-3 text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-full text-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              Waiting for player to connect...
            </div>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (status === GameStatus.LOBBY_JOIN) {
    return (
      <div className="bg-gray-800/80 p-8 rounded-2xl border border-pink-500/30 backdrop-blur-md max-w-lg w-full shadow-2xl shadow-pink-900/20">
        <h2 className="text-2xl font-bold text-pink-400 mb-6 text-center">Join Game</h2>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Host IP Address</label>
            <input
              type="text"
              value={targetIp}
              onChange={(e) => setTargetIp(e.target.value)}
              placeholder="e.g. 192.168.1.5"
              className="w-full bg-gray-900 border border-gray-700 focus:border-pink-500 rounded-lg p-4 text-white placeholder-gray-600 outline-none transition-colors font-mono"
            />
            <p className="text-xs text-gray-500 mt-2">
              Default: {window.location.hostname} (if you are visiting the host's page)
            </p>
          </div>
          
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onJoin(targetIp)}
            disabled={!targetIp}
            className="w-full py-3 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-bold tracking-wide shadow-lg shadow-pink-900/30"
          >
            CONNECT
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default Lobby;
