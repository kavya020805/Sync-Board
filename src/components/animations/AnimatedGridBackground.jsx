import React, { useRef, useEffect } from 'react'

export default function AnimatedGridBackground({
  gridSize = 40,
  lineColor = 'rgba(255, 255, 255, 0.05)',
  speed = 0.5,
  className = ''
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let offset = 0

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 1

      const width = canvas.width
      const height = canvas.height
      
      ctx.beginPath()
      // Draw vertical lines
      for (let x = (offset % gridSize) - gridSize; x < width; x += gridSize) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      
      // Draw horizontal lines
      for (let y = (offset % gridSize) - gridSize; y < height; y += gridSize) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      ctx.stroke()

      offset += speed
      animationFrameId = requestAnimationFrame(drawGrid)
    }

    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()
    drawGrid()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [gridSize, lineColor, speed])

  return (
    <div className={`absolute inset-0 pointer-events-none z-0 ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Radial gradient overlay to fade out edges */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,1) 80%)'
        }}
      />
    </div>
  )
}
