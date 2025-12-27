import { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext.jsx';

export function SnowfallBackground() {
    const canvasRef = useRef(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const isDark = theme === 'dark';
        let animationFrameId;
        let particles = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const mouseRef = { x: -1000, y: -1000 };

        const handleMouseMove = (e) => {
            mouseRef.x = e.clientX;
            mouseRef.y = e.clientY;
        };

        const handleTouchMove = (e) => {
            if (e.touches.length > 0) {
                mouseRef.x = e.touches[0].clientX;
                mouseRef.y = e.touches[0].clientY;
            }
        };

        const createParticle = () => {
            // Refined Palette (Dec 2025): 90% Snow, 10% Confetti
            const confettiColors = isDark
                ? ['#D6001C', '#005F4B', '#0057AD', '#FFD700']  // Vibrant Dark
                : ['#D6001C', '#005F4B', '#0057AD', '#EAB308']; // Vibrant Light

            const snowColor = isDark ? '#F1F5F9' : '#94A3B8'; // Soft White vs Cool Silver

            const isConfetti = Math.random() > 0.90; // 10% chance
            const color = isConfetti
                ? confettiColors[Math.floor(Math.random() * confettiColors.length)]
                : snowColor;

            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 2,
                color: color,
                baseSpeedY: Math.random() * 1.2 + 0.6, // Reduced speed by 20%
                baseSpeedX: Math.random() * 1 - 0.5,
                opacity: Math.random() * 0.3 + 0.4, // Reduced contrast/opacity by 30%
                vx: 0,
                vy: 0
            };
        };

        const initParticles = () => {
            // Reduced particle count by ~70% (increased divisor from 8000 to 25000)
            const particleCount = Math.floor((canvas.width * canvas.height) / 25000);
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(createParticle());
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                // Interaction Physics
                const dx = p.x - mouseRef.x;
                const dy = p.y - mouseRef.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const interactionRadius = 60;

                if (distance < interactionRadius) {
                    const force = (interactionRadius - distance) / interactionRadius;
                    const angle = Math.atan2(dy, dx);
                    const pushStrength = 2; // Power of the push

                    p.vx += Math.cos(angle) * force * pushStrength;
                    p.vy += Math.sin(angle) * force * pushStrength;
                }

                // Apply physics
                p.vx *= 0.95; // Friction
                p.vy *= 0.95;

                // Update position
                p.y += p.baseSpeedY + p.vy;
                p.x += Math.sin(p.y * 0.01) * 0.5 + p.baseSpeedX + p.vx;

                // Reset loops
                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                    p.vx = 0;
                    p.vy = 0;
                }
                if (p.x > canvas.width) {
                    p.x = 0;
                } else if (p.x < 0) {
                    p.x = canvas.width;
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchstart', handleTouchMove);

        resizeCanvas();
        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme]); // Re-run if theme changes to update colors

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ width: '100%', height: '100%' }}
        />
    );
}
