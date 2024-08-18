import { useEffect, useRef, useState } from 'react';

const GRID_WIDTH = 15;
const GRID_HEIGHT = 9;
const CELL_SIZE = 50;
const PLAYER_BASE_HEALTH = 2000;
const ENEMY_BASE_HEALTH = 1000;

interface GridObject {
  type: 'K' | 'E' | '@' | '#' | 'Bk' | 'Be';
  x: number;
  y: number;
}

const generateRandomObstacles = (num: number): GridObject[] => {
  const obstacles: GridObject[] = [];
  while (obstacles.length < num) {
    const randomX = Math.floor(Math.random() * GRID_WIDTH);
    const randomY = Math.floor(Math.random() * GRID_HEIGHT);
    if (
      !obstacles.some(o => o.x === randomX && o.y === randomY) &&
      (randomX !== 2 || randomY !== 2) &&
      (randomX !== GRID_WIDTH - 3 || randomY !== GRID_HEIGHT - 3)
    ) {
      const type = Math.random() < 0.5 ? '@' : '#';
      obstacles.push({ type, x: randomX, y: randomY });
    }
  }
  return obstacles;
};

const App: React.FC = () => {
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [grid, setGrid] = useState<GridObject[]>([
    ...generateRandomObstacles(20),
    { type: 'K', x: 2, y: 2 },
    { type: 'E', x: GRID_WIDTH - 3, y: GRID_HEIGHT - 3 },
  ]);
  const [playerGold, setPlayerGold] = useState(12010);
  const [enemyGold, setEnemyGold] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number } | null>(null);

  const baseHealth = {
    player: PLAYER_BASE_HEALTH,
    enemy: ENEMY_BASE_HEALTH,
  };

  const CONTROL_RADIUS = 1;
  const CONTROL_RADIUS_INCREMENT = .0; // Каждая казарма увеличивает радиус контроля

  useEffect(() => {
    if (gridCanvasRef.current) {
      const canvas = gridCanvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        renderGrid(context);
      }
    }
  }, [grid]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayerGold((prev) => prev + 2);
      setEnemyGold((prev) => prev + 222);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (enemyGold >= 120) {
      buildEnemyBarracks();
    }
  }, [enemyGold]);

  const renderGrid = (context: CanvasRenderingContext2D) => {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const controlledByPlayer = isControlledByPlayer(x, y);
        const controlledByEnemy = isControlledByEnemy(x, y);

        if (controlledByPlayer) {
          context.fillStyle = 'rgba(0, 0, 255, 0.15)';
        } else if (controlledByEnemy) {
          context.fillStyle = 'rgba(255, 0, 0, 0.15)';
        } else {
          context.fillStyle = 'white';
        }
        context.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        context.strokeStyle = 'black';
        context.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    for (const obj of grid) {
      context.fillStyle = getObjectColor(obj.type);
      context.fillRect(obj.x * CELL_SIZE, obj.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      context.strokeStyle = 'black';
      context.strokeRect(obj.x * CELL_SIZE, obj.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  };

  const isControlledByPlayer = (x: number, y: number) => {
    const playerCastle = grid.find(obj => obj.type === 'K');
    const playerBarracks = grid.filter(obj => obj.type === 'Bk');

    const totalRadiusIncrease = playerBarracks.length * CONTROL_RADIUS_INCREMENT;
    const controlRadius = CONTROL_RADIUS + totalRadiusIncrease;

    return playerCastle && (
      isControlledBy(x, y, playerCastle, controlRadius) ||
      playerBarracks.some(b => isControlledBy(x, y, b, controlRadius))
    );
  };

  const isControlledByEnemy = (x: number, y: number) => {
    const enemyCastle = grid.find(obj => obj.type === 'E');
    const enemyBarracks = grid.filter(obj => obj.type === 'Be');

    const totalRadiusIncrease = enemyBarracks.length * CONTROL_RADIUS_INCREMENT;
    const controlRadius = CONTROL_RADIUS + totalRadiusIncrease;

    return enemyCastle && (
      isControlledBy(x, y, enemyCastle, controlRadius) ||
      enemyBarracks.some(b => isControlledBy(x, y, b, controlRadius))
    );
  };

  const isControlledBy = (x: number, y: number, obj: GridObject, radius: number) => {
    const dx = Math.abs(x - obj.x);
    const dy = Math.abs(y - obj.y);
    return dx <= radius && dy <= radius;
  };

  const getObjectColor = (type: GridObject['type']) => {
    switch (type) {
      case 'K':
        return 'blue';
      case 'E':
        return 'red';
      case '@':
        return 'green';
      case '#':
        return 'brown';
      case 'Bk':
        return 'gray';
      case 'Be':
        return 'darkgray';
      default:
        return 'white';
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (playerGold < 120) return;

    const rect = gridCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    const isControlled = isControlledByPlayer(x, y) && !grid.some((obj) => obj.x === x && obj.y === y);

    if (isControlled) {
      setModalPosition({ x, y });
      setIsModalOpen(true);
    }
  };

  const handleBuildBarracks = () => {
    if (modalPosition) {
      setGrid([...grid, { type: 'Bk', x: modalPosition.x, y: modalPosition.y }]);
      setPlayerGold((prev) => prev - 120);
      setModalPosition(null);
      setIsModalOpen(false);
    }
  };

  const buildEnemyBarracks = () => {
    const enemyCastle = grid.find((obj) => obj.type === 'E');
    const barracks = grid.filter(obj => obj.type === 'Be');
    if (!enemyCastle) return;

    let availablePositions = [];

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const isControlled = isControlledByEnemy(x, y) && !grid.some((obj) => obj.x === x && obj.y === y);
        if (isControlled) {
          availablePositions.push({ x, y });
        }
      }
    }

    if (availablePositions.length > 0) {
      const pos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      setGrid([...grid, { type: 'Be', x: pos.x, y: pos.y }]);
      setEnemyGold((prev) => prev - 120);
    }
  };

  return (
    <div>
      <h1>Игра с замками</h1>
      <div className="canvas-wrapper">
        <canvas
          ref={gridCanvasRef}
          width={GRID_WIDTH * CELL_SIZE}
          height={GRID_HEIGHT * CELL_SIZE}
          onClick={handleCanvasClick}
        />
        {isModalOpen && modalPosition && (
          <div className='modal-mini'
            style={{
              top: modalPosition.y * CELL_SIZE,
              left: modalPosition.x * CELL_SIZE,
            }}
          >
            <h3>Выбор постройки</h3>
            <button onClick={handleBuildBarracks}>Казарма (120 золота)</button>
          </div>
        )}
      </div>

      <div className="flex">
        <div>
          <div>Ваше золото: {playerGold}</div>
          <div>Здоровье игрока: {baseHealth.player}</div>
        </div>
        <div>
          <div>Вражеское золото: {enemyGold}</div>
          <div>Здоровье врага: {baseHealth.enemy}</div>
        </div>
      </div>
    </div>
  );
};

export default App;