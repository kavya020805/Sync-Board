import { useRef, useEffect } from 'react'
import { motion, useInView, useAnimation } from 'framer-motion'

export default function BlurText({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words', // 'words' or 'letters'
  direction = 'top', // 'top' or 'bottom'
}) {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const mainControls = useAnimation()

  useEffect(() => {
    if (isInView) {
      mainControls.start('visible')
    }
  }, [isInView, mainControls])

  const defaultVariants = {
    hidden: { 
      filter: 'blur(10px)', 
      opacity: 0, 
      transform: direction === 'top' ? 'translate3d(0,-20px,0)' : 'translate3d(0,20px,0)' 
    },
    visible: { 
      filter: 'blur(0px)', 
      opacity: 1, 
      transform: 'translate3d(0,0,0)',
    },
  }

  return (
    <div ref={ref} className={`flex flex-wrap ${className}`}>
      {elements.map((element, index) => (
        <motion.span
          key={index}
          variants={defaultVariants}
          initial="hidden"
          animate={mainControls}
          transition={{
            duration: 0.6,
            delay: delay / 1000 + index * (animateBy === 'words' ? 0.08 : 0.03),
            ease: [0.2, 0.65, 0.3, 0.9],
          }}
          className={animateBy === 'words' ? 'mr-1.5 inline-block' : 'inline-block'}
        >
          {element === ' ' ? '\u00A0' : element}
        </motion.span>
      ))}
    </div>
  )
}
