import React from 'react';

interface TileProps {
  type: string;
}

const Tile: React.FC<TileProps> = ({ type }) => {
  return <div className={`tile ${type}`}>{type}</div>;
};

export default Tile;