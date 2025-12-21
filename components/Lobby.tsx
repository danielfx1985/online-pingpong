import React, { useState, useEffect } from 'react';
import { GameStatus } from '../types';

interface LobbyProps {
  status: GameStatus;
  peerId: string | null;
  onJoin: (hostId: string) => void;
  onCancel: () => void;
  setStatus: (status: GameStatus) => void;
  error: string | null;
}

const Lobby: React.FC<LobbyProps> = ({ status, peerId, onJoin, onCancel, setStatus, error }) => {
  const [targetId, setTargetId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const copyToClipboard = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      setCopied(true);
    }
  };

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
          <p className="text-gray-300 text-sm text-center">Share this ID with your friend:</p>
          <div className="flex items-center gap-2 bg-gray-900/80 p-4 rounded-lg border border-gray-700">
            <code className="flex-1 text-center font-mono text-lg text-cyan-300 break-all">
              {peerId || 'Generating ID...'}
            </code>
            <button 
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-white"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              )}
            </button>
          </div>
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
            <label className="block text-sm font-medium text-gray-400 mb-2">Enter Host ID</label>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="e.g. 1234-abcd-..."
              className="w-full bg-gray-900 border border-gray-700 focus:border-pink-500 rounded-lg p-4 text-white placeholder-gray-600 outline-none transition-colors font-mono"
            />
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
            onClick={() => onJoin(targetId)}
            disabled={!targetId}
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
