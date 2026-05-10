import { useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CursorGlow() {
  const mouseX = useMotionValue(-400)
  const mouseY = useMotionValue(-400)
  const springX = useSpring(mouseX, { stiffness: 120, damping: 28, mass: 0.5 })
  const springY = useSpring(mouseY, { stiffness: 120, damping: 28, mass: 0.5 })

  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [mouseX, mouseY])

  return (
    <motion.div
      className="fixed pointer-events-none"
      style={{
        zIndex: 9999,
        width: 480,
        height: 480,
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(124,58,237,0.1) 0%, rgba(59,130,246,0.05) 40%, transparent 70%)',
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
      }}
    />
  )
}
