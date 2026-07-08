import { useState } from 'react';
import { motion } from 'framer-motion';

export default function TrueFocus({
  items = [],
  blurAmount = 4,
  className = '',
  itemClassName = '',
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className}`} onMouseLeave={() => setHoveredIndex(null)}>
      {items.map((item, index) => {
        const isHovered = hoveredIndex === index;
        const isOthersHovered = hoveredIndex !== null && hoveredIndex !== index;

        return (
          <motion.span
            key={item}
            onMouseEnter={() => setHoveredIndex(index)}
            animate={{
              filter: isOthersHovered ? `blur(${blurAmount}px)` : 'blur(0px)',
              opacity: isOthersHovered ? 0.4 : 1,
              scale: isHovered ? 1.05 : 1,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
            }}
            className={`${itemClassName} cursor-default`}
          >
            {item}
          </motion.span>
        );
      })}
    </div>
  );
}
