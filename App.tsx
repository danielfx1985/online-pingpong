import React, { useState, useEffect, useRef, useCallback } from 'react';
import Lobby from './components/Lobby';
import Game from './components/Game';
import { GameStatus, GameState, NetworkMessage } from './types';
import { initialGameState, updatePhysics } from './utils/gameLogic';
import { CANVAS_HEIGHT, PADDLE_HEIGHT } from './constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [gameState, setGameState] = useState<GameState>(initialGameState());
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const isHostRef = useRef<boolean>(false);
  const gameStateRef = useRef<GameState>(initialGameState());
  const requestRef = useRef<number>(0);

  // 1. Handle incoming data (MUST be defined before startHosting/joinGame)
  const handleData = useCallback((data: NetworkMessage) => {
    if (data.type === 'SYNC') {
      if (!isHostRef.current) {
        // CLIENT AUTHORITY: Preserve local paddle position
        const localY = gameStateRef.current.player2.y;
        const syncedState = { ...data.payload };
        syncedState.player2.y = localY; 
        
        setGameState(syncedState);
        gameStateRef.current = syncedState;
      }
    } else if (data.type === 'INPUT') {
      if (isHostRef.current) {
        // Host updates guest position
        gameStateRef.current.player2.y = data.payload;
        // Optimization: update state immediately for smooth rendering on host
        setGameState(prev => ({
          ...prev,
          player2: { ...prev.player2, y: data.payload }
        }));
      }
    }
  }, []);

  // 2. Initialize Peer for Host with a custom ID
  const startHosting = useCallback((customId: string) => {
    // Sanitize ID: PeerJS IDs must be alphanumeric, dashes, or underscores.
    // Replace dots with dashes (192.168.1.1 -> 192-168-1-1)
    const sanitizedId = customId.replace(/\./g, '-').replace(/[^a-zA-Z0-9-_]/g, '');

    if (!sanitizedId) {
      setConnectionError("Invalid address format.");
      return;
    }

    const Peer = window.Peer;
    if (!Peer) {
      setConnectionError("PeerJS library not loaded");
      return;
    }

    // Cleanup existing peer
    if (peerRef.current) peerRef.current.destroy();
    setConnectionError(null);

    // Initialize Peer
    const peer = new Peer(sanitizedId, { debug: 1 });

    peer.on('open', (id: string) => {
      console.log('Host Peer Opened:', id);
      setPeerId(id);
      setStatus(GameStatus.LOBBY_HOST); // Move to waiting screen
      isHostRef.current = true;
    });

    peer.on('error', (err: any) => {
      console.error('Peer error:', err);
      if (err.type === 'unavailable-id') {
        setConnectionError(`Address '${sanitizedId}' is already in use. Try another.`);
      } else {
        setConnectionError(`Connection Error: ${err.type}`);
      }
    });

    peer.on('connection', (conn: any) => {
      console.log('Host received connection');
      connRef.current = conn;
      conn.on('open', () => {
         setStatus(GameStatus.PLAYING);
         conn.on('data', handleData);
         // Initial Sync
         const startingState = initialGameState();
         gameStateRef.current = startingState;
         setGameState(startingState);
         conn.send({ type: 'SYNC', payload: startingState });
      });
      conn.on('close', () => {
        alert('Opponent disconnected');
        resetGame();
      });
    });

    peerRef.current = peer;
  }, [handleData]);

  // 3. Join Game function
  const joinGame = useCallback((hostId: string) => {
    // Sanitize input similarly
    const sanitizedId = hostId.replace(/\./g, '-').replace(/[^a-zA-Z0-9-_]/g, '');
    
    if (!sanitizedId) {
        setConnectionError("Invalid host address format.");
        return;
    }

    isHostRef.current = false;
    const Peer = window.Peer;
    if (!Peer) return;

    if (peerRef.current) peerRef.current.destroy();
    setConnectionError(null);

    const peer = new Peer(undefined, { debug: 1 }); // Guest gets random ID
    peerRef.current = peer;

    peer.on('open', () => {
      const conn = peer.connect(sanitizedId);
      connRef.current = conn;

      conn.on('open', () => {
        setStatus(GameStatus.PLAYING);
        conn.on('data', handleData);
      });
      
      conn.on('error', (err: any) => {
          console.error("Conn Error", err);
          setConnectionError("Could not connect. Check address.");
      });

      conn.on('close', () => {
          alert('Host disconnected');
          resetGame();
      });
    });

    peer.on('error', (err: any) => {
        console.error('Peer error:', err);
        setConnectionError('Connection failed: ' + err.type);
    });

  }, [handleData]);

  const gameLoop = useCallback(() => {
    if (isHostRef.current && status === GameStatus.PLAYING) {
      const nextState = updatePhysics(gameStateRef.current);
      gameStateRef.current = nextState;
      setGameState(nextState);

      if (connRef.current && connRef.current.open) {
        connRef.current.send({ type: 'SYNC', payload: nextState });
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

  const handleMouseMove = useCallback((y: number) => {
    if (isHostRef.current) {
      gameStateRef.current.player1.y = y;
      setGameState(prev => ({ ...prev, player1: { ...prev.player1, y } }));
    } else {
      // Guest local update
      gameStateRef.current.player2.y = y;
      setGameState(prev => ({ ...prev, player2: { ...prev.player2, y } }));
      // Send to host
      if (connRef.current && connRef.current.open) {
        connRef.current.send({ type: 'INPUT', payload: y });
      }
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (isHostRef.current) {
       const newState = initialGameState();
       if (gameStateRef.current.winner) {
          newState.player1.score = 0;
          newState.player2.score = 0;
       }
       newState.isPaused = false;
       gameStateRef.current = newState;
       setGameState(newState);
       if (connRef.current) {
         connRef.current.send({ type: 'SYNC', payload: newState });
       }
    }
  }, []);

  const resetGame = useCallback(() => {
    if (peerRef.current) peerRef.current.destroy();
    if (connRef.current) connRef.current.close();
    setPeerId(null);
    setStatus(GameStatus.MENU);
    setGameState(initialGameState());
    gameStateRef.current = initialGameState();
    setConnectionError(null);
    isHostRef.current = false;
  }, []);

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
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
             <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
          </div>
          <div className="z-10">
             <Lobby 
               status={status}
               peerId={peerId}
               onJoin={joinGame}
               onHost={startHosting}
               onCancel={resetGame}
               setStatus={setStatus}
               error={connectionError}
               setConnectionError={setConnectionError}
             />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;