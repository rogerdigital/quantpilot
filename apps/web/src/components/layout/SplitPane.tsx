import { useCallback, useRef, useState } from 'react';
import {
  container,
  containerVertical,
  divider,
  dividerHorizontal,
  dividerVertical,
  dragOverlay,
  pane,
} from './SplitPane.css.js';

interface SplitPaneProps {
  direction?: 'horizontal' | 'vertical';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  children: [React.ReactNode, React.ReactNode];
  className?: string;
  onResize?: (size: number) => void;
}

export function SplitPane({
  direction = 'horizontal',
  defaultSize = 300,
  minSize = 100,
  maxSize = Infinity,
  children,
  className = '',
  onResize,
}: SplitPaneProps) {
  const [size, setSize] = useState(defaultSize);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ pos: 0, size: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      startRef.current = {
        pos: direction === 'horizontal' ? e.clientX : e.clientY,
        size,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = (direction === 'horizontal' ? ev.clientX : ev.clientY) - startRef.current.pos;
        const newSize = Math.max(minSize, Math.min(maxSize, startRef.current.size + delta));
        setSize(newSize);
        onResize?.(newSize);
      };

      const handleMouseUp = () => {
        setDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [direction, size, minSize, maxSize, onResize]
  );

  const isHorizontal = direction === 'horizontal';
  const sizeProp = isHorizontal ? 'width' : 'height';

  return (
    <div className={`${container} ${!isHorizontal ? containerVertical : ''} ${className}`}>
      <div className={pane} style={{ [sizeProp]: size, flexShrink: 0 }}>
        {children[0]}
      </div>
      <div
        className={`${divider} ${isHorizontal ? dividerHorizontal : dividerVertical}`}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
        aria-valuenow={50}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
      />
      <div className={pane} style={{ flex: 1 }}>
        {children[1]}
      </div>
      {dragging && (
        <div
          className={dragOverlay}
          style={{ cursor: isHorizontal ? 'col-resize' : 'row-resize' }}
        />
      )}
    </div>
  );
}
