import React, { ReactNode, ReactElement, isValidElement } from 'react';
import './Cell.css';

// Define a type for phantom cell
interface PhantomCell {
  type: 'PHANTOM_CELL';
  courseCode: string;
}

interface CellProps {
  items: string[];
  className?: string;
  rowIndex: number;
  renderContent?: (content: string, index: number) => ReactNode | PhantomCell;
}

// Type guard to check if an element is a phantom cell
function isPhantomCell(content: any): content is PhantomCell {
  return content && 
         typeof content === 'object' && 
         'type' in content && 
         content.type === 'PHANTOM_CELL';
}

// Type guard to check if an element is a multi-hour cell
function isMultiHourCell(content: any): content is ReactElement {
  return isValidElement(content) && 
         typeof content.props === 'object' && 
         content.props !== null &&
         'className' in content.props && 
         content.props.className === 'multi-hour-cell' &&
         'data-span' in content.props;
}

const Cell: React.FC<CellProps> = ({ items, className = '', rowIndex, renderContent }) => {
  const renderItems = () => {
    const processedItems: ReactNode[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const content = renderContent ? renderContent(item, i) : item;
      
      // Header row and day column are always rendered normally
      if (rowIndex === 0 || i === 0) {
        processedItems.push(
          <div className={`col ${i === 0 ? "day-col" : ""}`} key={i}>
            {isPhantomCell(content) ? null : content}
          </div>
        );
        continue;
      }
      
      // Check if this is a phantom cell
      if (isPhantomCell(content)) {
        // Skip rendering it as it's covered by the expanded first cell
        continue;
      }
      
      // Check if this is a multi-hour cell that needs to span multiple columns
      if (isMultiHourCell(content)) {
        const span = (content.props as { 'data-span'?: number })['data-span'] || 1;
        
        // Add a cell that spans multiple columns
        processedItems.push(
          <div 
            className="col multi-col"
            key={i}
            style={{ gridColumn: `span ${span}` }}
          >
            {content}
          </div>
        );
        
        // Skip the next (span-1) columns as they're covered by this cell
        i += span - 1;
      } else {
        // Regular cell
        processedItems.push(
          <div className="col" key={i}>
            {content}
          </div>
        );
      }
    }
    
    return processedItems;
  };
  
  return (
    <div className={`timetable-row ${className}`}>
      {renderItems()}
    </div>
  );
};

export default Cell;
