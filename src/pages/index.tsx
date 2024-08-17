import { useEffect, useRef, useState } from 'react';

const GRID_WIDTH = 15;
const GRID_HEIGHT = 9;
const CELL_SIZE = 50;
const PLAYER_BASE_HEALTH = 2000;
const ENEMY_BASE_HEALTH = 1000;

interface GridObject {
  type: 'K' | 'E' | '@' | '#' | 'B';
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
}

const App = () => {
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [grid, setGrid] = useState<GridObject[]>(generateRandomObstacles(20));
  const [playerGold, setPlayerGold] = useState(0);
  const [enemyGold, setEnemyGold] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState<{ x: number, y: number } | null>(null);

  const baseHealth = {
    player: PLAYER_BASE_HEALTH,
    enemy: ENEMY_BASE_HEALTH
  };

  const castlePlayer = { type: 'K' as const, x: 2, y: 2 };
  const castleEnemy = { type: 'E' as const, x: GRID_WIDTH - 3, y: GRID_HEIGHT - 3 };

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
    // Таймер для накопления золота
    const interval = setInterval(() => {
      setPlayerGold(prev => prev + 2);
      setEnemyGold(prev => prev + 2);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const renderGrid = (context: CanvasRenderingContext2D) => {
    // Сначала закрашиваем области контроля замков
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (isControlledBy(x, y, castlePlayer)) {
          context.fillStyle = 'rgba(0, 0, 255, 0.15)'; // Полупрозрачный синий цвет для игрока
          context.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (isControlledBy(x, y, castleEnemy)) {
          context.fillStyle = 'rgba(255, 0, 0, 0.15)'; // Полупрозрачный красный цвет для врага
          context.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Затем рисуем остальные объекты, включая замки в полном цвете
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const gridObject = grid.find(obj => obj.x === x && obj.y === y);
        let borderColor = 'black';

        if (gridObject) {
          context.fillStyle = getObjectColor(gridObject.type);
          context.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }

        context.strokeStyle = borderColor;
        context.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // В последнюю очередь рисуем замки наверху полупрозрачных областей
    drawCastle(context, castlePlayer);
    drawCastle(context, castleEnemy);
  };

  const drawCastle = (context: CanvasRenderingContext2D, castle: GridObject) => {
    context.fillStyle = getObjectColor(castle.type);
    context.fillRect(castle.x * CELL_SIZE, castle.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    context.strokeStyle = 'black';
    context.strokeRect(castle.x * CELL_SIZE, castle.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  };

  const isControlledBy = (x: number, y: number, castle: GridObject) => {
    const dx = Math.abs(x - castle.x);
    const dy = Math.abs(y - castle.y);
    return dx <= 1 && dy <= 1;
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
      case 'B':
        return 'gray';
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

    if (isControlledBy(x, y, castlePlayer) && !grid.some(obj => obj.x === x && obj.y === y)) {
      setModalPosition({ x, y });
      setIsModalOpen(true);
    }
  };

  const handleBuildBarracks = () => {
    if (modalPosition) {
      setGrid([...grid, { type: 'B', x: modalPosition.x, y: modalPosition.y }]);
      setPlayerGold(prev => prev - 120);
      setModalPosition(null);
      setIsModalOpen(false);
    }
  };

  return (
    <div>
      <h1>Игра с замками</h1>
      <canvas 
        style={{ border: '1px solid black' }} 
        ref={gridCanvasRef} 
        width={GRID_WIDTH * CELL_SIZE} 
        height={GRID_HEIGHT * CELL_SIZE} 
        onClick={handleCanvasClick}
      />
     
      <div className='flex'>
        <div>
          <div>Ваше золото: {playerGold}</div>
          <div>Здоровье игрока: {baseHealth.player}</div>
        </div> 
        <div>
          <div>Вражеское золото: {enemyGold}</div>
          <div>Здоровье врага: {baseHealth.enemy}</div>
        </div> 
      </div>

      {isModalOpen && modalPosition && (
        <div 
          style={{
            position: 'absolute', 
            top: modalPosition.y * CELL_SIZE, 
            left: modalPosition.x * CELL_SIZE, 
            backgroundColor: 'white', 
            border: '1px solid black', 
            padding: '10px'
          }}
        >
          <h3>Выбор постройки</h3>
          <button onClick={handleBuildBarracks}>Казарма (120 золота)</button>
          {/* Можно добавить другие кнопки для других типов зданий в будущем */}
        </div>
      )}
    </div>
  );
};

export default App;