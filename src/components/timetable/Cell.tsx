import React from 'react';
import './Cell.css';

interface CellProps {
  items: string[];
  className?: string;
}

const Cell: React.FC<CellProps> = ({ items, className = '' }) => {
  return (
    <div className={`row ${className}`}>
      {items.map((item, index) => (
        <div className="col" key={index}>{item}</div>
      ))}
    </div>
  );
};

export default Cell;
