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

        const createParticle = () => {
            const colors = isDark
                ? ['#D6001C', '#005F4B', '#0057AD', '#FFD700', '#FFFFFF'] // Red, Green, Blue, Gold, White
                : ['#D6001C', '#005F4B', '#0057AD', '#EAB308', '#94A3B8']; // Similar for light mode (Gold -> Yellow-500)

            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 2, // 2-5px radius (larger)
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 1.5 + 0.8, // Faster
                speedX: Math.random() * 1 - 0.5,
                opacity: Math.random() * 0.4 + 0.6, // 0.6-1.0 opacity (brighter)
            };
        };

        const initParticles = () => {
            const particleCount = Math.floor((canvas.width * canvas.height) / 8000); // More dense
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(createParticle());
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color; // Use particle's specific color
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                // Update position
                p.y += p.speedY;
                p.x += Math.sin(p.y * 0.01) * 0.5 + p.speedX; // Sway effect

                // Reset loops
                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
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
        resizeCanvas();
        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
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
