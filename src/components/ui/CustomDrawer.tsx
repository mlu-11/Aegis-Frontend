import React, { useRef } from 'react';
import { createPortal } from 'react-dom';

interface CustomDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  className?: string;
}

const CustomDrawer: React.FC<CustomDrawerProps> = ({
  open,
  onClose: _onClose,
  children,
  width = 400,
  className = '',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);


  if (!open) return null;

  const drawerContent = (
    <div className="fixed top-0 right-0 z-50 h-full pointer-events-none">
      <div
        ref={drawerRef}
        className={`
          bg-white shadow-2xl transform transition-all duration-300 ease-in-out
          border-l border-gray-200 h-full overflow-hidden pointer-events-auto
          ${open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          ${className}
        `}
        style={{ 
          width: `${width}px`,
          boxShadow: '-4px 0 15px -3px rgba(0, 0, 0, 0.1), -2px 0 6px -2px rgba(0, 0, 0, 0.05)'
        }}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};

export default CustomDrawer;
