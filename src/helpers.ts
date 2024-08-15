import { BOARD_SIZE, PLAYER_CASTLE, ENEMY_CASTLE, STONE, TREE, MIN_OBSTACLES, MAX_OBSTACLES } from './constants';
import { Position, GameState } from './types';

export const createEmptyBoard = (): string[][] => {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(''));
};

export const getRandomPosition = (): Position => {
  return { x: Math.floor(Math.random() * BOARD_SIZE), y: Math.floor(Math.random() * BOARD_SIZE) };
};

export const placeCastlesOnBoard = (board: string[][]): void => {
  board[0][0] = PLAYER_CASTLE;
  board[BOARD_SIZE - 1][BOARD_SIZE - 1] = ENEMY_CASTLE;
};

export const placeObstaclesOnBoard = (board: string[][]): void => {
  const totalObstacles = MIN_OBSTACLES + Math.floor(Math.random() * (MAX_OBSTACLES - MIN_OBSTACLES + 1));
  let placedObstacles = 0;

  while (placedObstacles < totalObstacles) {
    const pos = getRandomPosition();
    if (board[pos.x][pos.y] === '') {
      board[pos.x][pos.y] = Math.random() > 0.5 ? STONE : TREE;
      placedObstacles += 1;
    }
  }
};

export const initializeGameState = (): GameState => {
  const board = createEmptyBoard();
  placeCastlesOnBoard(board);
  placeObstaclesOnBoard(board);
  return { board, playerGold: 0, enemyGold: 0 };
};

