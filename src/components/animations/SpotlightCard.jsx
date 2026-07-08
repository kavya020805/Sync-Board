import React, { useRef, useState, forwardRef } from 'react'

const SpotlightCard = forwardRef(({ 
  children, 
  className = '', 
  spotlightColor = 'rgba(255, 255, 255, 0.12)',
  onMouseMove,
  ...props
}, ref) => {
  const internalRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const node = internalRef.current
    if (!node) return

    const rect = node.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })

    if (onMouseMove) {
      onMouseMove(e)
    }
  }

  // Merge the refs
  const setRefs = (node) => {
    internalRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }

  return (
    <div
      ref={setRefs}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden rounded-xl bg-(--color-bg-secondary) border border-(--color-border-subtle) transition-colors duration-300 group ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      {children}
    </div>
  )
})

export default SpotlightCard
