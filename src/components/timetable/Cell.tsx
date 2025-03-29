import React from 'react';
import './Cell.css';

interface CellProps {
  items: string[];
  className?: string;
  renderContent?: (content: string, index: number) => React.ReactNode;
}

const Cell: React.FC<CellProps> = ({ items, className = '', renderContent }) => {
  return (
    <div className={`row ${className}`}>
      {items.map((item, index) => (
        <div className="col" key={index}>
          {renderContent ? renderContent(item, index) : item}
        </div>
      ))}
    </div>
  );
};

export default Cell;
