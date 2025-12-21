import React, { useState, useEffect } from 'react';
import { GameStatus } from '../types';

interface LobbyProps {
  status: GameStatus;
  peerId: string | null;
  onJoin: (hostId: string) => void;
  onHost: (hostId: string) => void;
  onCancel: () => void;
  setStatus: (status: GameStatus) => void;
  error: string | null;
  setConnectionError: (error: string | null) => void;
}

const Lobby: React.FC<LobbyProps> = ({ status, peerId, onJoin, onHost, onCancel, setStatus, error, setConnectionError }) => {
  const [targetId, setTargetId] = useState('');
  const [hostIdInput, setHostIdInput] = useState('');
  const [mode, setMode] = useState<'MENU' | 'HOST_SETUP' | 'JOIN_SETUP'>('MENU');
  const [copied, setCopied] = useState(false);

  // Reset internal mode when status changes to MENU
  useEffect(() => {
    if (status === GameStatus.MENU) {
      setMode('MENU');
      setHostIdInput(''); // Reset host input
    }
  }, [status]);

  const copyToClipboard = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId.replace(/-/g, '.')); // Display back as IP-like if possible
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleHostSubmit = () => {
    if (hostIdInput.trim()) {
      onHost(hostIdInput.trim());
    }
  };

  const handleJoinSubmit = () => {
    if (targetId.trim()) {
      onJoin(targetId.trim());
    }
  };

  // Main Menu
  if (status === GameStatus.MENU && mode === 'MENU') {
    return (
      <div className="flex flex-col gap-6 max-w-md w-full animate-fade-in">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 text-center mb-8 drop-shadow-lg tracking-tight">
          NEON PONG
        </h1>
        
        <button
          onClick={() => setMode('HOST_SETUP')}
          className="group relative px-8 py-4 bg-cyan-900/30 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-100 rounded-xl transition-all duration-300 backdrop-blur-sm overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-cyan-400/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          <span className="relative text-xl font-bold tracking-wider flex items-center justify-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            HOST GAME
          </span>
        </button>

        <button
          onClick={() => {
             setStatus(GameStatus.LOBBY_JOIN); // Using existing status for Join flow or internal mode
             setMode('JOIN_SETUP');
          }}
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

  // Host Setup (Enter ID)
  if (status === GameStatus.MENU && mode === 'HOST_SETUP') {
     return (
      <div className="bg-gray-800/80 p-8 rounded-2xl border border-cyan-500/30 backdrop-blur-md max-w-lg w-full shadow-2xl shadow-cyan-900/20 animate-fade-in">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">Configure Server</h2>
        
        <div className="space-y-4 mb-8">
           <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Create Game Address</label>
            <div className="relative">
              <input
                type="text"
                value={hostIdInput}
                onChange={(e) => setHostIdInput(e.target.value)}
                placeholder="e.g. room1 or 192.168.1.5"
                className="w-full bg-gray-900 border border-gray-700 focus:border-cyan-500 rounded-lg p-4 text-white placeholder-gray-600 outline-none transition-colors font-mono"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Peers can connect to this address. Use a unique name or your local IP.</p>
          </div>
           {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleHostSubmit}
            disabled={!hostIdInput}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-bold tracking-wide shadow-lg shadow-cyan-900/30"
          >
            START SERVER
          </button>
          <button
            onClick={() => { setMode('MENU'); setConnectionError(null); }}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            Back
          </button>
        </div>
      </div>
     );
  }

  // Waiting for Player (LOBBY_HOST)
  if (status === GameStatus.LOBBY_HOST) {
    return (
      <div className="bg-gray-800/80 p-8 rounded-2xl border border-cyan-500/30 backdrop-blur-md max-w-lg w-full shadow-2xl shadow-cyan-900/20 animate-fade-in">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">Hosting Game</h2>
        
        <div className="space-y-4 mb-8">
          <p className="text-gray-300 text-sm text-center">Waiting for opponent to connect to:</p>
          <div className="flex items-center gap-2 bg-gray-900/80 p-4 rounded-lg border border-gray-700">
            <code className="flex-1 text-center font-mono text-2xl text-cyan-300 tracking-wider">
              {peerId ? peerId.replace(/-/g, '.') : 'Initializing...'}
            </code>
            <button 
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-white"
              title="Copy"
            >
              {copied ? <span className="text-green-500 font-bold">✓</span> : 
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>}
            </button>
          </div>
          <div className="flex justify-center mt-4">
             <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-900/30 border border-cyan-500/20">
               <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                <span className="text-cyan-200 text-sm animate-pulse">Listening for connections...</span>
             </div>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
        >
          Stop Server
        </button>
      </div>
    );
  }

  // Join Setup (Enter Target ID) - Replaces LOBBY_JOIN view
  if (status === GameStatus.LOBBY_JOIN || mode === 'JOIN_SETUP') {
    return (
      <div className="bg-gray-800/80 p-8 rounded-2xl border border-pink-500/30 backdrop-blur-md max-w-lg w-full shadow-2xl shadow-pink-900/20 animate-fade-in">
        <h2 className="text-2xl font-bold text-pink-400 mb-6 text-center">Join Game</h2>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Host Address</label>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="e.g. 192.168.1.5"
              className="w-full bg-gray-900 border border-gray-700 focus:border-pink-500 rounded-lg p-4 text-white placeholder-gray-600 outline-none transition-colors font-mono"
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg flex items-center gap-2 border border-red-500/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleJoinSubmit}
            disabled={!targetId}
            className="w-full py-3 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-bold tracking-wide shadow-lg shadow-pink-900/30"
          >
            CONNECT
          </button>
          <button
            onClick={() => { setMode('MENU'); setStatus(GameStatus.MENU); setConnectionError(null); }}
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