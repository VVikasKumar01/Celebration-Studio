import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'motion/react';

interface FadeInOnScrollProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  duration?: number;
  distance?: number;
  scale?: boolean;
  blur?: boolean;
  threshold?: number;
  once?: boolean;
}

export const FadeInOnScroll: React.FC<FadeInOnScrollProps> = ({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  duration = 0.7,
  distance = 32,
  scale = true,
  blur = true,
  once = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once,
    margin: '-40px',
  });

  const getInitialOffset = () => {
    switch (direction) {
      case 'up':
        return { y: distance, x: 0 };
      case 'down':
        return { y: -distance, x: 0 };
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
      case 'none':
      default:
        return { x: 0, y: 0 };
    }
  };

  const offset = getInitialOffset();

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        x: offset.x,
        y: offset.y,
        scale: scale ? 0.985 : 1,
        filter: blur ? 'blur(4px)' : 'none',
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              filter: 'blur(0px)',
            }
          : {
              opacity: 0,
              x: offset.x,
              y: offset.y,
              scale: scale ? 0.985 : 1,
              filter: blur ? 'blur(4px)' : 'none',
            }
      }
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // Smooth human UX deceleration curve
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface FadeInStaggerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const FadeInStagger: React.FC<FadeInStaggerProps> = ({
  children,
  staggerDelay = 0.08,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const FadeInStaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};
