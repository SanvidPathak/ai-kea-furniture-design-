import { motion } from 'framer-motion';

export function AuroraBackground({ children }) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 selection:bg-ikea-yellow selection:text-neutral-900 transition-colors duration-300">
            <div className="absolute inset-0 z-0 opacity-40 dark:opacity-30">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-ikea-blue rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 dark:opacity-10 animate-aurora" />
                <div className="absolute top-0 -right-4 w-96 h-96 bg-ikea-yellow rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 dark:opacity-10 animate-aurora animation-delay-2000" />
                <div className="absolute -bottom-32 left-20 w-96 h-96 bg-ikea-electric rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 dark:opacity-10 animate-aurora animation-delay-4000" />
            </div>

            <div className="relative z-10 w-full min-h-screen">
                {children}
            </div>
        </div>
    );
}
