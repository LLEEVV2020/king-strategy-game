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

  useEffect(() => {
    setGameState(initializeGameState());
  }, []);

  useEffect(() => {
    if (gameState) {
      const interval = setInterval(() => {
        setGameState(prevState => {
          if (!prevState) return prevState;

          // Подсчитываем количество шахт на поле
          let playerMines = 0;
          let enemyMines = 0;
          prevState.board.forEach(row => {
            row.forEach(cell => {
              if (cell === MINE) {
                playerMines++;
              }
            });
          });
          
          return {
            ...prevState,
            playerGold: prevState.playerGold + 2 + (playerMines * 2),
            enemyGold: prevState.enemyGold + 2,
            board: prevState.board
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
        if (!prevState) return prevState;
        return {
          ...prevState,
          board: newBoard
        };
      });
      setIsOpen(false);
    }
  };

  if (!gameState) {
    return <div>Loading...</div>;
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