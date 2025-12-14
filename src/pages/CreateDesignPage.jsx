import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { DesignCreator } from '../components/design/DesignCreator.jsx';
import { DesignPreview } from '../components/design/DesignPreview.jsx';
import { Button } from '../components/common/Button.jsx';

export function CreateDesignPage() {
  const { user } = useAuth();
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
    <div className="section-container py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
          Create Your Design
        </h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-300">
          Use AI to describe your furniture in plain English, or design manually with precise controls
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div>
          <div className="card">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              Design Parameters
            </h3>
            <DesignCreator onDesignGenerated={handleDesignGenerated} />

            {design && (
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
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
    </div>
  );
}
