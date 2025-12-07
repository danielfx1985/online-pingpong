import React, { useEffect, useRef } from 'react';
import { GameState, GameStatus } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_RADIUS, COLORS } from '../constants';

interface GameProps {
  gameState: GameState;
  isHost: boolean;
  onMouseMove: (y: number) => void;
  onRestart: () => void;
  onExit: () => void;
}

const Game: React.FC<GameProps> = ({ gameState, isHost, onMouseMove, onRestart, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Input
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleY = CANVAS_HEIGHT / rect.height;
      
      let clientY;
      if (window.TouchEvent && e instanceof TouchEvent) {
         clientY = e.touches[0].clientY;
      } else if (e instanceof MouseEvent) {
         clientY = e.clientY;
      } else {
        return;
      }

      const relativeY = (clientY - rect.top) * scaleY;
      // Clamp paddle position
      const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, relativeY - PADDLE_HEIGHT / 2));
      
      onMouseMove(clampedY);
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMove);
      canvas.addEventListener('touchmove', handleMove, { passive: false });
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMove);
        canvas.removeEventListener('touchmove', handleMove);
      }
    };
  }, [onMouseMove]);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Clear
      ctx.fillStyle = COLORS.BACKGROUND;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Center Line
      ctx.setLineDash([10, 15]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.strokeStyle = '#374151'; // gray-700
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Paddles
      // Player 1 (Left - Cyan)
      ctx.fillStyle = COLORS.P1;
      ctx.shadowColor = COLORS.P1;
      ctx.shadowBlur = 15;
      ctx.fillRect(0, gameState.player1.y, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Player 2 (Right - Pink)
      ctx.fillStyle = COLORS.P2;
      ctx.shadowColor = COLORS.P2;
      ctx.shadowBlur = 15;
      ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, gameState.player2.y, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Draw Ball
      ctx.beginPath();
      ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.BALL;
      ctx.shadowColor = COLORS.BALL;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.closePath();
      
      // Reset Shadow for text/UI to keep clean
      ctx.shadowBlur = 0;

      // Draw Names
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = isHost ? COLORS.P1 : '#4b5563';
      ctx.fillText(gameState.player1.name, 40, 30);
      
      ctx.fillStyle = !isHost ? COLORS.P2 : '#4b5563';
      ctx.textAlign = 'right';
      ctx.fillText(gameState.player2.name, CANVAS_WIDTH - 40, 30);
      ctx.textAlign = 'left';

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, isHost]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 bg-gray-950">
      
      {/* Score Board */}
      <div className="flex items-center gap-12 mb-6 select-none">
        <div className="flex flex-col items-center">
          <span className="text-sm text-cyan-500 font-bold tracking-widest uppercase mb-1">Host</span>
          <span className="text-6xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-b from-cyan-300 to-cyan-700 stroke-2 border-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            {gameState.player1.score}
          </span>
        </div>
        <div className="text-gray-700 text-2xl font-light">vs</div>
        <div className="flex flex-col items-center">
          <span className="text-sm text-pink-500 font-bold tracking-widest uppercase mb-1">Guest</span>
          <span className="text-6xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-b from-pink-300 to-pink-700 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            {gameState.player2.score}
          </span>
        </div>
      </div>

      {/* Game Canvas Container */}
      <div 
        ref={containerRef}
        className="relative group rounded-xl overflow-hidden shadow-2xl ring-4 ring-gray-800 bg-gray-900 aspect-[8/5] w-full max-w-[800px]"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full cursor-none touch-none"
        />

        {/* Overlay for Game Over or Pause */}
        {(gameState.winner || gameState.isPaused) && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-fade-in">
             {gameState.winner ? (
               <div className="text-center">
                 <h2 className="text-5xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">
                   {gameState.winner === 'Player 1' ? 'HOST WINS!' : 'GUEST WINS!'}
                 </h2>
                 <p className="text-gray-300 mb-8">Great match!</p>
                 {isHost ? (
                    <button onClick={onRestart} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
                      PLAY AGAIN
                    </button>
                 ) : (
                   <p className="text-sm text-gray-400 animate-pulse">Waiting for host to restart...</p>
                 )}
               </div>
             ) : (
                <div className="text-center">
                   <h3 className="text-3xl font-bold text-white mb-2">READY?</h3>
                   <p className="text-gray-400">Move mouse or drag to control paddle</p>
                   {isHost && (
                     <button onClick={onRestart} className="mt-6 px-6 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 transition-colors">
                       START GAME
                     </button>
                   )}
                   {!isHost && <p className="mt-4 text-pink-400 animate-pulse">Waiting for host to start...</p>}
                </div>
             )}
          </div>
        )}
      </div>
      
      <div className="mt-8 flex gap-4">
        <button 
          onClick={onExit}
          className="px-4 py-2 text-sm text-gray-500 hover:text-red-400 hover:bg-red-900/10 rounded transition-colors"
        >
          Quit Game
        </button>
      </div>
    </div>
  );
};

export default Game;
