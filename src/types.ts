export interface Position {
    x: number;
    y: number;
  }
  
  export interface GameState {
    board: string[][];
    playerGold: number;
    enemyGold: number;
  }