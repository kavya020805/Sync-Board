import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

const chars = '!<>-_\\\\/[]{}—=+*^?#________';

export default function DecryptedText({ text, speed = 50, className = '' }) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isHovering) {
      let iteration = 0;
      interval = setInterval(() => {
        setDisplayText((prev) =>
          text
            .split('')
            .map((letter, index) => {
              if (index < iteration) {
                return text[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );
        if (iteration >= text.length) {
          clearInterval(interval);
        }
        iteration += 1 / 2;
      }, speed);
    } else {
      setDisplayText(text);
    }
    return () => clearInterval(interval);
  }, [isHovering, text, speed]);

  return (
    <span
      className={className}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{ display: 'inline-block', minWidth: `${text.length}ch` }}
    >
      {displayText}
    </span>
  );
}
