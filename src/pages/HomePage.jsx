import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { signOut } from '../services/authService.js';
import { Button } from '../components/common/Button.jsx';
import { Logo } from '../components/common/Logo.jsx';

export function HomePage() {
  const { user, isAuthenticated } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-earth-beige">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="section-container py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated ? (
              <>
                <span className="hidden sm:inline text-sm text-neutral-600">
                  Welcome, <span className="font-semibold">{user?.displayName || 'User'}</span>
                </span>
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
      </header>

      {/* Hero Section */}
      <section className="section-container px-4">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-4">
            Design Your Perfect Furniture
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-neutral-600 mb-6 sm:mb-8">
            AI-powered modular furniture design platform
          </p>
          <p className="text-sm sm:text-base md:text-lg text-neutral-500 mb-8 sm:mb-12 max-w-2xl mx-auto">
            Simply describe what you need in plain English, or use our guided design tool.
            Get instant cost estimates, assembly instructions, and 3D previews.
          </p>

          {/* CTA Buttons */}
          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16">
              <Link to="/create" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                  Start Designing →
                </Button>
              </Link>
              <Link to="/designs" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                  My Designs
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="text-lg px-8 py-4">
                  Sign In
                </Button>
              </Link>
            </div>
          )}

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="card hover:shadow-soft">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">AI-Powered</h3>
              <p className="text-neutral-600">
                Describe your furniture in plain English and let AI do the rest
              </p>
            </div>
            <div className="card hover:shadow-soft">
              <div className="text-5xl mb-4">🛠️</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Modular Design</h3>
              <p className="text-neutral-600">
                Every piece breaks down into parts with clear assembly instructions
              </p>
            </div>
            <div className="card hover:shadow-soft">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Cost Transparent</h3>
              <p className="text-neutral-600">
                See detailed cost breakdown before you commit
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-8 text-center">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-ikea-blue flex items-center justify-center mb-4">
                  <span className="text-2xl sm:text-3xl font-bold text-white">1</span>
                </div>
                <div className="w-12 h-12 mb-3 flex items-center justify-center">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Describe Your Idea</h3>
                <p className="text-sm text-neutral-600">
                  Tell us what furniture you need in plain English or select from our options
                </p>
              </div>

              {/* Arrow 1 */}
              <div className="hidden md:block absolute top-10 left-1/3 w-1/6">
                <svg className="w-full h-8" viewBox="0 0 100 40" fill="none">
                  <path d="M0 20 L80 20 L70 15 M80 20 L70 25" stroke="#FBDA0C" strokeWidth="3" fill="none"/>
                </svg>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-ikea-blue flex items-center justify-center mb-4">
                  <span className="text-2xl sm:text-3xl font-bold text-white">2</span>
                </div>
                <div className="w-12 h-12 mb-3 flex items-center justify-center">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">AI Generates Design</h3>
                <p className="text-sm text-neutral-600">
                  Our AI creates a detailed design with parts, dimensions, and cost estimate
                </p>
              </div>

              {/* Arrow 2 */}
              <div className="hidden md:block absolute top-10 right-1/3 w-1/6">
                <svg className="w-full h-8" viewBox="0 0 100 40" fill="none">
                  <path d="M0 20 L80 20 L70 15 M80 20 L70 25" stroke="#FBDA0C" strokeWidth="3" fill="none"/>
                </svg>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-ikea-blue flex items-center justify-center mb-4">
                  <span className="text-2xl sm:text-3xl font-bold text-white">3</span>
                </div>
                <div className="w-12 h-12 mb-3 flex items-center justify-center">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Save & Review</h3>
                <p className="text-sm text-neutral-600">
                  View assembly instructions, materials list, and total cost before building
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-16">
        <div className="section-container py-6 text-center text-sm text-neutral-600">
          <p>AI-KEA © 2025 - Phase 2 Complete: Authentication UI ✓</p>
          <p className="mt-2">Next: Design Creation Interface</p>
        </div>
      </footer>
    </div>
  );
}
