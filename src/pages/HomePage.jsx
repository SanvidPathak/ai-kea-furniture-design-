import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { signOut } from '../services/authService.js';
import { Button } from '../components/common/Button.jsx';

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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-ikea-blue whitespace-nowrap">AI-KEA</h1>
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

          {/* Status Card */}
          <div className="card border-2 border-ikea-blue">
            <div className="flex items-center justify-center mb-4">
              <span className="text-4xl mr-3">✅</span>
              <h2 className="text-3xl font-bold text-neutral-900">Platform Status</h2>
            </div>
            <div className="text-left space-y-3 max-w-2xl mx-auto">
              <div className="flex items-center">
                <span className="text-ikea-blue mr-3 font-bold">✓</span>
                <span className="text-neutral-700">Firebase Authentication Service</span>
              </div>
              <div className="flex items-center">
                <span className="text-ikea-blue mr-3 font-bold">✓</span>
                <span className="text-neutral-700">Firestore Database (mydb collection)</span>
              </div>
              <div className="flex items-center">
                <span className="text-ikea-blue mr-3 font-bold">✓</span>
                <span className="text-neutral-700">Design Generator (5 furniture types, 3 materials)</span>
              </div>
              <div className="flex items-center">
                <span className="text-ikea-blue mr-3 font-bold">✓</span>
                <span className="text-neutral-700">Gemini AI Integration (Natural Language → Design)</span>
              </div>
              <div className="flex items-center">
                <span className="text-ikea-blue mr-3 font-bold">✓</span>
                <span className="text-neutral-700">Design & Order CRUD Services</span>
              </div>
              <div className="flex items-center">
                <span className="text-ikea-blue mr-3 font-bold">✓</span>
                <span className="text-neutral-700">Authentication UI Complete</span>
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
