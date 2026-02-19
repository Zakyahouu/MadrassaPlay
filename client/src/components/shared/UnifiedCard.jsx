import React from 'react';

const UnifiedCard = ({
  children,
  className = '',
  padding = 'p-6',
  shadow = 'shadow-sm',
  border = 'border border-border-light',
  background = 'bg-surface-light',
  rounded = 'rounded-xl',
  hover = 'hover:shadow-md transition-shadow',
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
