import React from 'react';

const UnifiedCard = ({ 
  children, 
  className = '', 
  padding = 'p-6',
  shadow = 'shadow-sm',
  border = 'border border-gray-200',
  background = 'bg-white',
  rounded = 'rounded-lg',
  hover = 'hover:shadow-md hover:border-gray-300',
  transition = 'transition-all duration-200',
  onClick,
  ...rest
}) => {
  return (
    <div 
      onClick={onClick}
      {...rest}
      className={`${background} ${border} ${rounded} ${shadow} ${padding} ${hover} ${transition} ${className}`}
    >
      {children}
    </div>
  );
};

export default UnifiedCard;
