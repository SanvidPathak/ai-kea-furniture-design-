import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button.jsx';
import { Logo } from '../components/common/Logo.jsx';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-earth-beige flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="section-container py-4">
          <Link to="/" className="inline-flex items-center">
            <Logo />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="text-9xl font-bold text-ikea-blue opacity-20 select-none">
              404
            </div>
            <div className="text-6xl mb-6 -mt-12">🪑</div>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">
            Oops! The furniture piece you're looking for seems to have been misplaced.
            Let's get you back to designing!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button className="w-full sm:w-auto">
                Go to Home
              </Button>
            </Link>
            <Link to="/create">
              <Button variant="secondary" className="w-full sm:w-auto">
                Create Design
              </Button>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-neutral-200">
            <p className="text-sm text-neutral-600 mb-4">Looking for something specific?</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/designs" className="text-ikea-blue hover:underline">
                My Designs
              </Link>
              <Link to="/orders" className="text-ikea-blue hover:underline">
                My Orders
              </Link>
              <Link to="/account" className="text-ikea-blue hover:underline">
                Account Settings
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-6">
        <div className="section-container text-center text-sm text-neutral-600">
          <p>AI-KEA © 2025 - Build Your Perfect Furniture</p>
        </div>
      </footer>
    </div>
  );
}
