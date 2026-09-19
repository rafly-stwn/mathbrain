import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'rounded-button font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 flex items-center justify-center';
  
  const variants = {
    primary: 'bg-lavender text-white hover:bg-lavender/80 shadow-sm border border-transparent',
    secondary: 'bg-white border-2 border-lavender/30 text-charcoal hover:bg-lavender/10 shadow-sm',
    ghost: 'bg-transparent text-warmgray hover:bg-cream border border-transparent',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;

