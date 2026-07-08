import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function Magnet({
  children,
  padding = 50,
  disabled = false,
  magnetStrength = 2,
  className = '',
}) {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const magnetRef = useRef(null);

  useEffect(() => {
    if (disabled) {
      setIsActive(false);
      setPosition({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e) => {
      if (!magnetRef.current) return;
      
      const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;

      if (Math.abs(distX) < width / 2 + padding && Math.abs(distY) < height / 2 + padding) {
        setIsActive(true);
        setPosition({
          x: distX / magnetStrength,
          y: distY / magnetStrength,
        });
      } else {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [padding, disabled, magnetStrength]);

  return (
    <motion.div
      ref={magnetRef}
      className={className}
      animate={isActive ? { x: position.x, y: position.y } : { x: 0, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
