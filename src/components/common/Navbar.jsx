import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { signOut } from '../../services/authService.js';
import { Button } from './Button.jsx';
import { Logo } from './Logo.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';

export function Navbar() {
    const { user, isAuthenticated } = useAuth();
    const { isFestive } = useTheme();

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-50 bg-white/50 backdrop-blur-md border-b border-white/20 dark:bg-neutral-900/50 dark:border-white/10"
        >
            <div className="section-container py-3 sm:py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center">
                    <Logo />
                </Link>
                <div className="flex items-center gap-2 sm:gap-4">
                    <ThemeToggle />
                    {isAuthenticated ? (
                        <>
                            <Link to="/account" className="flex items-center gap-2 text-sm text-neutral-800 hover:text-ikea-blue transition-colors font-medium dark:text-neutral-200 dark:hover:text-ikea-blue">
                                <span className="w-8 h-8 rounded-full bg-ikea-blue/10 flex items-center justify-center text-ikea-blue dark:bg-ikea-blue/20 dark:text-ikea-blue">
                                    {isFestive ? (
                                        <span className="text-lg">🦌</span>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )}
                                </span>
                                <span className="hidden sm:block">{user?.displayName || 'User'}</span>
                            </Link>
                            <Button variant="secondary" onClick={handleSignOut} className="text-xs sm:text-sm">
                                Sign Out
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">
                                <Button variant="secondary" className="text-xs sm:text-sm">Sign In</Button>
                            </Link>
                            <Link to="/signup" className="hidden sm:inline">
                                <Button className="text-xs sm:text-sm">Get Started</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </motion.header>
    );
}
