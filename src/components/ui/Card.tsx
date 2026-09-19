import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<"div"> {
  hoverable?: boolean;
  colorClass?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  colorClass = 'bg-white',
  hoverable = false,
  onClick,
  ...props
}) => {
  const hoverStyles = hoverable
    ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-card shadow-card p-6 transition-all duration-200 ${colorClass} ${hoverStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;

