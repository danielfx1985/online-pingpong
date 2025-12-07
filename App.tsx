import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Lobby from './components/Lobby';
import Game from './components/Game';
import { GameStatus, GameState, NetworkMessage } from './types';
import { initialGameState, updatePhysics } from './utils/gameLogic';
import { CANVAS_HEIGHT, PADDLE_HEIGHT } from './constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [gameState, setGameState] = useState<GameState>(initialGameState());
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Refs for logic that doesn't need to trigger re-renders
  const socketRef = useRef<Socket | null>(null);
  const isHostRef = useRef<boolean>(false);
  const gameStateRef = useRef<GameState>(initialGameState());
  const requestRef = useRef<number>(0);

  // --- Network Setup ---

  const connectSocket = useCallback((ip?: string) => {
    // If we already have a socket, disconnect it to be safe
    if (socketRef.current) {
        socketRef.current.disconnect();
    }

    const url = ip ? `http://${ip}:3000` : undefined; // undefined defaults to window.location
    const socket = io(url, {
        reconnection: false, // Don't auto reconnect for this game logic
        transports: ['websocket']
    });

    socketRef.current = socket;

    socket.on('connect_error', (err) => {
        console.error('Socket error:', err);
        setConnectionError(`Connection failed: ${err.message}`);
    });

    socket.on('disconnect', () => {
        // Handle disconnect if needed
    });

    return socket;
  }, []);

  const handleData = useCallback((data: NetworkMessage) => {
    if (data.type === 'SYNC') {
      // Client receives state from Host
      if (!isHostRef.current) {
        setGameState(data.payload);
        gameStateRef.current = data.payload;
      }
    } else if (data.type === 'INPUT') {
      // Host receives input from Client
      if (isHostRef.current) {
        gameStateRef.current.player2.y = data.payload;
      }
    } else if (data.type === 'START') {
       // Client start signal
       setGameState(prev => ({ ...prev, isPaused: false }));
    } else if (data.type === 'RESET') {
       // Client reset signal
       setGameState(initialGameState());
       gameStateRef.current = initialGameState();
    }
  }, []);

  // --- Host Logic ---
  useEffect(() => {
    if (status === GameStatus.LOBBY_HOST) {
      isHostRef.current = true;
      const socket = connectSocket();
      
      socket.on('connect', () => {
          socket.emit('register_host');
      });

      socket.on('player_connected', () => {
          setStatus(GameStatus.PLAYING);
          // Initial Sync
          socket.emit('SYNC', { type: 'SYNC', payload: gameStateRef.current });
      });

      socket.on('INPUT', (msg: NetworkMessage) => {
          handleData(msg);
      });

      socket.on('client_disconnected', () => {
          alert('Player 2 disconnected');
          resetGame();
      });

      // Cleanup
      return () => {
          socket.off('player_connected');
          socket.off('INPUT');
          socket.off('client_disconnected');
      };
    }
  }, [status, connectSocket, handleData]);

  // --- Client Logic ---
  const joinGame = (hostIp: string) => {
    isHostRef.current = false;
    const socket = connectSocket(hostIp);

    socket.on('connect', () => {
        socket.emit('register_client');
    });

    socket.on('connected_to_host', () => {
        setStatus(GameStatus.PLAYING);
    });

    socket.on('SYNC', (msg: NetworkMessage) => {
        handleData(msg);
    });

    socket.on('error_message', (msg: string) => {
        setConnectionError(msg);
    });

    socket.on('host_disconnected', () => {
        alert('Host disconnected');
        resetGame();
    });
  };

  // --- Game Loop (Host Only) ---
  const gameLoop = useCallback(() => {
    if (isHostRef.current && status === GameStatus.PLAYING) {
      // Update Physics
      const nextState = updatePhysics(gameStateRef.current);
      gameStateRef.current = nextState;
      setGameState(nextState); // Trigger React Render

      // Send to Client
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('SYNC', { type: 'SYNC', payload: nextState });
      }
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [status]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && isHostRef.current) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, gameLoop]);

  // --- Controls ---
  const handleMouseMove = (y: number) => {
    if (isHostRef.current) {
      gameStateRef.current.player1.y = y;
    } else {
      // Client sends input to host
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('INPUT', { type: 'INPUT', payload: y });
        // Optimistic local update
        setGameState(prev => ({
           ...prev,
           player2: { ...prev.player2, y }
        }));
      }
    }
  };

  const handleRestart = () => {
    if (isHostRef.current) {
       const newState = initialGameState();
       if (gameStateRef.current.winner) {
          newState.player1.score = 0;
          newState.player2.score = 0;
       }
       newState.isPaused = false;
       gameStateRef.current = newState;
       setGameState(newState);
       
       if (socketRef.current) {
         socketRef.current.emit('SYNC', { type: 'SYNC', payload: newState });
       }
    }
  };

  const resetGame = () => {
    if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
    }
    setStatus(GameStatus.MENU);
    setGameState(initialGameState());
    gameStateRef.current = initialGameState();
    setConnectionError(null);
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-sans">
      
      {status === GameStatus.PLAYING || status === GameStatus.GAME_OVER ? (
        <Game 
          gameState={gameState} 
          isHost={isHostRef.current} 
          onMouseMove={handleMouseMove}
          onRestart={handleRestart}
          onExit={resetGame}
        />
      ) : (
        <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
             <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="z-10">
             <Lobby 
               status={status}
               // PeerId is not used in IP mode
               peerId={null} 
               onJoin={joinGame}
               onCancel={resetGame}
               setStatus={setStatus}
               error={connectionError}
             />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
