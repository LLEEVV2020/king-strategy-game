// Импортируем необходимые хуки из React
import { useEffect, useRef, useState } from 'react';

// Задаем константы игры: размеры сетки, размер ячеек, здоровье баз игроков
const GRID_WIDTH = 15;
const GRID_HEIGHT = 9;
const CELL_SIZE = 50;
const PLAYER_BASE_HEALTH = 2000;
const ENEMY_BASE_HEALTH = 1000;

// Задаем стоимость построек для разных типов казарм
const BASE_BUILDING_COSTS = {
  Bk: 150,
  Sk: 120,
  Be: 200,
  Se: 180,
};

// Описываем интерфейс для объекта сетки
interface GridObject {
  type: 'K' | 'E' | '@' | '#' | 'Bk' | 'Be' | 'Sk' | 'Se';
  x: number;
  y: number;
}

// Функция генерирует случайные препятствия на сетке
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

// Главный компонент приложения
const App: React.FC = () => {
  // Создаем реф для канваса
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Создаем состояния сетки, золота игроков и модального окна
  const [grid, setGrid] = useState<GridObject[]>([
    ...generateRandomObstacles(20),
    { type: 'K', x: 2, y: 2 },
    { type: 'E', x: GRID_WIDTH - 3, y: GRID_HEIGHT - 3 },
  ]);
  const [playerGold, setPlayerGold] = useState(1010);
  const [enemyGold, setEnemyGold] = useState(310);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number } | null>(null);

  // Объект для здоровья баз игроков
  const baseHealth = {
    player: PLAYER_BASE_HEALTH,
    enemy: ENEMY_BASE_HEALTH,
  };

  // Радиус контроля объектиков (замков, казарм) на сетке
  const CONTROL_RADIUS = 1;

  // Хук useEffect для отрисовки сетки при изменении состояния сети
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

  // Хук useEffect для обновления золота игроков каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      // Увеличиваем золото игроков
      setPlayerGold((prev) => prev + 12);
      setEnemyGold((prev) => prev + 9);

      setPlayerGold((prev) => prev + (grid.filter(obj => obj.type === 'Sk').length * 4));
      setEnemyGold((prev) => prev + (grid.filter(obj => obj.type === 'Se').length * 3));
    }, 1000);

    // Очистка интервала при размонтировании компонента
    return () => clearInterval(interval);
  }, [grid]);

  // Хук useEffect для автоматического строительства вражеских казарм
  useEffect(() => {
    const enemyBarracksCost = BASE_BUILDING_COSTS['Be'] + (grid.filter(obj => obj.type === 'Be').length * BASE_BUILDING_COSTS.Se);
    if (enemyGold >= enemyBarracksCost) {
      buildEnemyBarracks();
    }
  }, [enemyGold]);

  // Функция для отрисовки сетки на канвасе
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

  // Проверка, контролируется ли ячейка игроком
  const isControlledByPlayer = (x: number, y: number) => {
    const playerCastle = grid.find(obj => obj.type === 'K');
    const playerBarracks = grid.filter(obj => obj.type === 'Bk' || obj.type === 'Sk');

    const controlRadius = CONTROL_RADIUS;

    return playerCastle && (
      isControlledBy(x, y, playerCastle, controlRadius) ||
      playerBarracks.some(b => isControlledBy(x, y, b, controlRadius))
    );
  };

  // Проверка, контролируется ли ячейка врагом
  const isControlledByEnemy = (x: number, y: number) => {
    const enemyCastle = grid.find(obj => obj.type === 'E');
    const enemyBarracks = grid.filter(obj => obj.type === 'Be' || obj.type === 'Se');

    const controlRadius = CONTROL_RADIUS;

    return enemyCastle && (
      isControlledBy(x, y, enemyCastle, controlRadius) ||
      enemyBarracks.some(b => isControlledBy(x, y, b, controlRadius))
    );
  };

  // Функция для проверки контроля определенной ячейки
  const isControlledBy = (x: number, y: number, obj: GridObject, radius: number) => {
    const dx = Math.abs(x - obj.x);
    const dy = Math.abs(y - obj.y);
    return dx <= radius && dy <= radius;
  };

  // Получение цвета объектов на сетке в зависимости от их типа
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
      case 'Sk':
        return 'orange';
      case 'Se':
        return 'yellow';
      default:
        return 'white';
    }
  };

  // Обработчик клика по канвасу
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const modalPos = gridCanvasRef.current?.getBoundingClientRect();
    if (!modalPos) return;

    const x = Math.floor((e.clientX - modalPos.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - modalPos.top) / CELL_SIZE);

    const isControlled = isControlledByPlayer(x, y) && !grid.some((obj) => obj.x === x && obj.y === y);

    // Реализуем логику открытия/закрытия модального окна при клике на ту же клетку
    if (modalPosition && modalPosition.x === x && modalPosition.y === y) {
      setIsModalOpen(false);
      setModalPosition(null);
    } else if (isControlled) {
      setModalPosition({ x, y });
      setIsModalOpen(true);
    }
  };

  // Функция для постройки казарм игроком
  const handleBuildBarracks = (type: 'Bk' | 'Sk') => {
    const existingCount = grid.filter(obj => obj.type === type).length;
    const cost = BASE_BUILDING_COSTS[type] * (existingCount + 1);
    if (modalPosition && playerGold >= cost) {
      setGrid([...grid, { type, x: modalPosition.x, y: modalPosition.y }]);
      setPlayerGold((prev) => prev - cost);
      setModalPosition(null);
      setIsModalOpen(false);
    }
  };

  // Функция для постройки казарм врагом
  const buildEnemyBarracks = () => {
    const type = Math.random() < 0.5 ? 'Se' : 'Be';
    const existingCount = grid.filter(obj => obj.type === type).length;
    const cost = BASE_BUILDING_COSTS[type] * (existingCount + 1);

    const enemyCastle = grid.find((obj) => obj.type === 'E');
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

    if (availablePositions.length > 0 && enemyGold >= cost) {
      const pos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      setGrid([...grid, { type, x: pos.x, y: pos.y }]);
      setEnemyGold((prev) => prev - cost);
    }
  };

  // Получаем текущую стоимость построек казарм для игроков
  const getBarracksCosts = () => {
    const bkCost = BASE_BUILDING_COSTS.Bk * (grid.filter(obj => obj.type === 'Bk').length + 1);
    const skCost = BASE_BUILDING_COSTS.Sk * (grid.filter(obj => obj.type === 'Sk').length + 1);
    return { bkCost, skCost };
  };

  // Получаем текущую стоимость построек казарм для врага
  const getEnemyBarracksCosts = () => {
    const beCost = BASE_BUILDING_COSTS.Be * (grid.filter(obj => obj.type === 'Be').length + 1);
    const seCost = BASE_BUILDING_COSTS.Se * (grid.filter(obj => obj.type === 'Se').length + 1);
    return { beCost, seCost };
  };

  const { bkCost, skCost } = getBarracksCosts();
  const { beCost, seCost } = getEnemyBarracksCosts();

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
            <button onClick={() => handleBuildBarracks('Bk')}>
              Казарма ({bkCost} золота)
            </button>
            <button onClick={() => handleBuildBarracks('Sk')}>
              Розовая казарма ({skCost} золота)
            </button>
          </div>
        )}
      </div>
      <div className="flex">
        <div>
          <div>Ваше золото: {playerGold}</div>
          <div>Здоровье игрока: {baseHealth.player}</div>
          <div>Стоимость казармы: {bkCost}</div>
          <div>Стоимость розовой казармы: {skCost}</div>
        </div>
        <div>
          <div>Вражеское золото: {enemyGold}</div>
          <div>Здоровье врага: {baseHealth.enemy}</div>
          <div>Стоимость казармы: {beCost}</div>
          <div>Стоимость жёлтой казармы: {seCost}</div>
        </div>
      </div>
    </div>
  );
};

// Экспортируем компонент App для использования в других частях приложения
export default App;