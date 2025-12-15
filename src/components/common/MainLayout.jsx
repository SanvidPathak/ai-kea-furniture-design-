import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { SnowfallBackground } from './SnowfallBackground.jsx';

export function MainLayout() {
    const { isFestive } = useTheme();

    return (
        <div className="flex flex-col min-h-screen relative">
            {isFestive && <SnowfallBackground />}
            <Navbar />
            <main className="flex-grow z-10">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
