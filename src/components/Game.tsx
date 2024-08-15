import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Board from './Board';
import { initializeGameState } from '../helpers';
import { GameState, Position } from '../types';
import { MINE } from '../constants';

Modal.setAppElement('#__next');
const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '300px',  // Устанавливаем ширину
      height: '200px', // Устанавливаем высоту
    },
  };

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null); // Изначально null
  const [modalIsOpen, setIsOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  // Инициализируем состояние на клиенте
  useEffect(() => {
    setGameState(initializeGameState());
  }, []);

  useEffect(() => {
    if (gameState) {
      const interval = setInterval(() => {
        setGameState(prevState => {
          if (!prevState) return prevState; // Предохранитель для null
          return {
            ...prevState,
            playerGold: prevState.playerGold + 2,
            enemyGold: prevState.enemyGold + 2,
            board: prevState.board // сохраняем доску в неизменном виде
          };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameState]);

  const handleCellClick = (x: number, y: number) => {
    if (gameState?.board[x][y] === '') {
      setSelectedPosition({ x, y });
      setIsOpen(true);
    }
  };

  const buildMine = () => {
    if (selectedPosition && gameState) {
      const newBoard = gameState.board.map(row => row.slice());
      newBoard[selectedPosition.x][selectedPosition.y] = MINE;
      setGameState(prevState => {
        if (!prevState) return prevState; // Предохранитель для null
        return {
          ...prevState,
          board: newBoard // обновленный борт
        };
      });
      setIsOpen(false);
    }
  };

  if (!gameState) {
    return <div>Loading...</div>; // Может рендерить прелоадер пока состояние не инициализировано
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Вражеское золото: {gameState.enemyGold}</span>
        <span>Моё золото: {gameState.playerGold}</span>
      </div>
      <Board board={gameState.board} handleCellClick={handleCellClick} />
      <Modal style={customStyles} isOpen={modalIsOpen} onRequestClose={() => setIsOpen(false)}>
        <h2>Постройка</h2>
        <button onClick={buildMine}>Шахта</button>
        <button onClick={() => setIsOpen(false)}>Закрыть</button>
      </Modal>
    </div>
  );
};

export default Game;