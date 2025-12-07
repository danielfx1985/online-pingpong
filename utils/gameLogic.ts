import { GameState, BallState, PlayerState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_HEIGHT, PADDLE_WIDTH, BALL_RADIUS, BALL_SPEED_MAX, WINNING_SCORE } from '../constants';

export const initialGameState = (): GameState => ({
  player1: { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, score: 0, name: 'Host', connected: true },
  player2: { y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, score: 0, name: 'Guest', connected: false },
  ball: resetBall(),
  isPaused: true,
});

export function resetBall(): BallState {
  const direction = Math.random() > 0.5 ? 1 : -1;
  const speed = 5; // Start slow
  return {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: direction * speed,
    vy: (Math.random() * 2 - 1) * speed,
  };
}

export function updatePhysics(state: GameState): GameState {
  if (state.isPaused || state.winner) return state;

  const { ball, player1, player2 } = state;
  let nextBall = { ...ball };
  let nextP1 = { ...player1 };
  let nextP2 = { ...player2 };
  let winner = undefined;
  let isPaused = false;

  // Move Ball
  nextBall.x += nextBall.vx;
  nextBall.y += nextBall.vy;

  // Wall Collisions (Top/Bottom)
  if (nextBall.y - BALL_RADIUS < 0) {
    nextBall.y = BALL_RADIUS;
    nextBall.vy *= -1;
  }
  if (nextBall.y + BALL_RADIUS > CANVAS_HEIGHT) {
    nextBall.y = CANVAS_HEIGHT - BALL_RADIUS;
    nextBall.vy *= -1;
  }

  // Paddle Collisions
  // Player 1 (Left)
  if (
    nextBall.x - BALL_RADIUS < PADDLE_WIDTH &&
    nextBall.y > nextP1.y &&
    nextBall.y < nextP1.y + PADDLE_HEIGHT
  ) {
    nextBall.x = PADDLE_WIDTH + BALL_RADIUS;
    nextBall.vx *= -1.05; // Increase speed slightly
    // Add "spin" based on where it hit the paddle
    const hitPoint = nextBall.y - (nextP1.y + PADDLE_HEIGHT / 2);
    nextBall.vy += hitPoint * 0.1;
  }

  // Player 2 (Right)
  if (
    nextBall.x + BALL_RADIUS > CANVAS_WIDTH - PADDLE_WIDTH &&
    nextBall.y > nextP2.y &&
    nextBall.y < nextP2.y + PADDLE_HEIGHT
  ) {
    nextBall.x = CANVAS_WIDTH - PADDLE_WIDTH - BALL_RADIUS;
    nextBall.vx *= -1.05;
    const hitPoint = nextBall.y - (nextP2.y + PADDLE_HEIGHT / 2);
    nextBall.vy += hitPoint * 0.1;
  }

  // Cap speed
  const currentSpeed = Math.sqrt(nextBall.vx ** 2 + nextBall.vy ** 2);
  if (currentSpeed > BALL_SPEED_MAX) {
    const scale = BALL_SPEED_MAX / currentSpeed;
    nextBall.vx *= scale;
    nextBall.vy *= scale;
  }

  // Scoring
  if (nextBall.x < 0) {
    // P2 Scores
    nextP2.score += 1;
    nextBall = resetBall();
    if (nextP2.score >= WINNING_SCORE) {
      winner = 'Player 2';
    }
  } else if (nextBall.x > CANVAS_WIDTH) {
    // P1 Scores
    nextP1.score += 1;
    nextBall = resetBall();
    if (nextP1.score >= WINNING_SCORE) {
      winner = 'Player 1';
    }
  }

  return {
    ...state,
    ball: nextBall,
    player1: nextP1,
    player2: nextP2,
    winner,
    isPaused: !!winner,
  };
}
