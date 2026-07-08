import { forwardRef, useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const VariableProximity = forwardRef(
  (
    {
      label,
      fromFontVariationSettings,
      toFontVariationSettings,
      containerRef,
      radius = 50,
      falloff = 'linear',
      className = '',
      ...restProps
    },
    ref
  ) => {
    const letterRefs = useRef([]);
    const [interpolatedSettings, setInterpolatedSettings] = useState([]);

    const parseSettings = (settingsStr) => {
      const settings = new Map();
      const regex = /'([^']+)'\s*([\d.]+)/g;
      let match;
      while ((match = regex.exec(settingsStr)) !== null) {
        settings.set(match[1], parseFloat(match[2]));
      }
      return settings;
    };

    const fromSettings = useMemo(() => parseSettings(fromFontVariationSettings), [fromFontVariationSettings]);
    const toSettings = useMemo(() => parseSettings(toFontVariationSettings), [toFontVariationSettings]);

    useEffect(() => {
      const targetElement = containerRef?.current || window;
      const handleMouseMove = (e) => {
        const newSettings = [];
        letterRefs.current.forEach((letterRef, index) => {
          if (!letterRef) return;
          const rect = letterRef.getBoundingClientRect();
          const letterCenterX = rect.left + rect.width / 2;
          const letterCenterY = rect.top + rect.height / 2;
          const distance = Math.sqrt(
            Math.pow(e.clientX - letterCenterX, 2) + Math.pow(e.clientY - letterCenterY, 2)
          );

          let proximity = 1;
          if (distance < radius) {
             proximity = distance / radius;
          }
          
          if (falloff === 'exponential') {
             proximity = Math.pow(proximity, 2);
          } else if (falloff === 'gaussian') {
             const g = Math.exp(-Math.pow(distance, 2) / (2 * Math.pow(radius / 2, 2)));
             proximity = 1 - g; 
          }

          const settingsStr = Array.from(fromSettings.keys())
            .map((key) => {
              const fromVal = fromSettings.get(key);
              const toVal = toSettings.get(key);
              const val = fromVal + (toVal - fromVal) * (1 - proximity);
              return `'${key}' ${val}`;
            })
            .join(', ');

          newSettings[index] = settingsStr;
        });
        setInterpolatedSettings(newSettings);
      };

      targetElement.addEventListener('mousemove', handleMouseMove);
      return () => targetElement.removeEventListener('mousemove', handleMouseMove);
    }, [containerRef, fromSettings, toSettings, radius, falloff]);

    return (
      <span ref={ref} className={`${className} inline-flex`} {...restProps}>
        {label.split('').map((letter, index) => (
          <motion.span
            key={index}
            ref={(el) => (letterRefs.current[index] = el)}
            style={{
              fontVariationSettings: interpolatedSettings[index] || fromFontVariationSettings,
              display: 'inline-block',
              transition: 'font-variation-settings 0.1s ease-out',
            }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </motion.span>
        ))}
      </span>
    );
  }
);
VariableProximity.displayName = 'VariableProximity';
export default VariableProximity;
