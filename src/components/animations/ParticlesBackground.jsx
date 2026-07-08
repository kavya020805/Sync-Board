import React, { useRef, useEffect } from 'react'

export default function ParticlesBackground({
  particleCount = 50,
  particleSpread = 10,
  speedMultiplier = 1,
  particleBaseColor = '#8b5cf6', // using our accent color
  moveParticlesOnHover = true,
  particleHoverFactor = 2,
  alphaParticles = false,
  particleBaseSize = 100,
  sizeRandomness = 1,
  cameraDistance = 20,
  disableRotation = false,
  className = ''
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let particles = []
    let mouse = { x: null, y: null }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      particles = []
      for (let i = 0; i < particleCount; i++) {
        const size = (Math.random() * sizeRandomness + 0.5) * (particleBaseSize / 50)
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.width, // using width for spread
          size: size,
          baseX: Math.random() * canvas.width,
          baseY: Math.random() * canvas.height,
          density: (Math.random() * 20) + 1,
          angle: Math.random() * 360,
          speed: (Math.random() * 0.5 + 0.1) * speedMultiplier,
          opacity: alphaParticles ? Math.random() * 0.5 + 0.1 : 0.4
        })
      }
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      for (let i = 0; i < particles.length; i++) {
        let p = particles[i]
        
        // Slow float
        if (!disableRotation) {
          p.angle += p.speed * 0.02
          p.y -= Math.sin(p.angle) * 0.5
          p.x += Math.cos(p.angle) * 0.5
        } else {
          p.y -= p.speed
        }
        
        // Reset if off screen
        if (p.y < -50) p.y = canvas.height + 50
        if (p.x < -50) p.x = canvas.width + 50
        if (p.x > canvas.width + 50) p.x = -50
        
        // Mouse interaction
        if (moveParticlesOnHover && mouse.x != null) {
          let dx = mouse.x - p.x
          let dy = mouse.y - p.y
          let distance = Math.sqrt(dx * dx + dy * dy)
          let forceDirectionX = dx / distance
          let forceDirectionY = dy / distance
          let maxDistance = 150
          let force = (maxDistance - distance) / maxDistance
          let directionX = forceDirectionX * force * p.density * particleHoverFactor
          let directionY = forceDirectionY * force * p.density * particleHoverFactor
          
          if (distance < maxDistance) {
            p.x -= directionX
            p.y -= directionY
          }
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = particleBaseColor + Math.floor(p.opacity * 255).toString(16).padStart(2, '0')
        ctx.fill()
      }
      animationFrameId = requestAnimationFrame(drawParticles)
    }

    const handleMouseMove = (event) => {
      mouse.x = event.x
      mouse.y = event.y
    }
    
    const handleMouseOut = () => {
      mouse.x = null
      mouse.y = null
    }

    window.addEventListener('resize', resizeCanvas)
    if (moveParticlesOnHover) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseout', handleMouseOut)
    }

    resizeCanvas()
    drawParticles()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (moveParticlesOnHover) {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseout', handleMouseOut)
      }
      cancelAnimationFrame(animationFrameId)
    }
  }, [
    particleCount, particleBaseColor, moveParticlesOnHover, 
    particleHoverFactor, alphaParticles, particleBaseSize, 
    sizeRandomness, disableRotation, speedMultiplier
  ])

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${className}`} 
      style={{ opacity: 0.8 }}
    />
  )
}
