import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { DesignCreator } from '../components/design/DesignCreator.jsx';
import { DesignPreview } from '../components/design/DesignPreview.jsx';
import { Button } from '../components/common/Button.jsx';

export function CreateDesignPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);

  const handleDesignGenerated = (generatedDesign) => {
    setDesign(generatedDesign);
    // Scroll to preview
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateNew = () => {
    setDesign(null);
  };

  return (
    <div className="min-h-screen bg-earth-beige">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="section-container py-4 flex items-center justify-between">
          <Link to="/">
            <h1 className="text-3xl font-bold text-ikea-blue">AI-KEA</h1>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <span className="text-sm text-neutral-600">
                Welcome, <span className="font-semibold">{user?.displayName}</span>
              </span>
            ) : (
              <Link to="/login">
                <Button variant="secondary">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="section-container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-neutral-900 mb-2">
            Create Your Design
          </h2>
          <p className="text-lg text-neutral-600">
            Use AI to describe your furniture in plain English, or design manually with precise controls
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div>
            <div className="card sticky top-4">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                Design Parameters
              </h3>
              <DesignCreator onDesignGenerated={handleDesignGenerated} />

              {design && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="secondary"
                    onClick={handleCreateNew}
                    className="w-full"
                  >
                    Create New Design
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Preview */}
          <div>
            <DesignPreview design={design} />
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-16">
        <div className="section-container py-6 text-center text-sm text-neutral-600">
          <p>AI-KEA © 2025 - Manual Design Tool</p>
        </div>
      </footer>
    </div>
  );
}
