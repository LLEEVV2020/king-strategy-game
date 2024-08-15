import React from 'react';
import { BOARD_SIZE } from '../constants';

interface BoardProps {
  board: string[][];
  handleCellClick: (x: number, y: number) => void;
}

const Board: React.FC<BoardProps> = ({ board, handleCellClick }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 40px)`}}>
      {board.map((row, rowIndex) =>
        row.map((cell, cellIndex) => (
          <div
            key={`${rowIndex}-${cellIndex}`}
            style={{ width: 40, height: 40, border: '1px solid black',
                backgroundColor: cell === 'K' ? '#0000ff75' :
                    cell === '@' || cell === '#' ? 'white' :
                    cell === 'E' ? '#ff00007a' :
                     cell === 'S' ? 'yellow' : '#999'
             }}
            onClick={() => handleCellClick(rowIndex, cellIndex)}
            className='tile'
          >
            {cell}
          </div>
        ))
      )}
    </div>
  );
}

export default Board;