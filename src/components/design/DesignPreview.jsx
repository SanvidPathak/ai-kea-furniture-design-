import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { saveDesign } from '../../services/designService.js';
import { DesignPartsTable } from './DesignPartsTable.jsx';
import { Button } from '../common/Button.jsx';
import { ErrorMessage } from '../common/ErrorMessage.jsx';

export function DesignPreview({ design }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!design) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">📐</div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          No Design Yet
        </h3>
        <p className="text-neutral-600">
          Fill out the form to generate your furniture design
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      await saveDesign(user.uid, design);
      showToast('Design saved successfully! View it in My Designs.', 'success');
    } catch (error) {
      console.error('Save design error:', error);
      setErrorMessage('Failed to save design. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ErrorMessage message={errorMessage} onClose={() => setErrorMessage('')} />

      {/* Design Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 capitalize mb-2">
              {design.furnitureType}
            </h2>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <span className="flex items-center gap-1 capitalize">
                <span className="font-medium">Material:</span> {design.material}
              </span>
              <span className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded border border-neutral-300"
                  style={{ backgroundColor: design.materialColor }}
                />
                <span className="font-medium">Color:</span> {design.materialColor}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-ikea-blue">
              ${design.totalCost.toFixed(2)}
            </div>
            <div className="text-xs text-neutral-500">Total Cost</div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-earth-beige rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900">
              {design.dimensions.length} cm
            </div>
            <div className="text-xs text-neutral-600">Length</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900">
              {design.dimensions.width} cm
            </div>
            <div className="text-xs text-neutral-600">Width</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900">
              {design.dimensions.height} cm
            </div>
            <div className="text-xs text-neutral-600">Height</div>
          </div>
        </div>

        {/* Assembly Info */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            <span className="font-medium">Parts:</span> {design.parts.length} types
          </span>
          <span className="text-neutral-600">
            <span className="font-medium">Assembly time:</span> ~{design.assemblyTime} min
          </span>
        </div>
      </div>

      {/* Parts List */}
      <div className="card">
        <h3 className="text-xl font-semibold text-neutral-900 mb-4">Parts List</h3>
        <DesignPartsTable parts={design.parts} />
      </div>

      {/* Assembly Instructions */}
      <div className="card">
        <h3 className="text-xl font-semibold text-neutral-900 mb-4">
          Assembly Instructions
        </h3>
        <ol className="space-y-2">
          {(design.instructions || design.assemblyInstructions || []).map((instruction, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ikea-blue text-white text-sm font-semibold flex items-center justify-center">
                {index + 1}
              </span>
              <span className="text-neutral-700 pt-0.5">{instruction}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          loading={saving}
          className="flex-1"
        >
          {user ? 'Save Design' : 'Sign in to Save'}
        </Button>
        <Button variant="secondary" className="flex-1">
          Create Order
        </Button>
      </div>

      {/* AI Badge if applicable */}
      {design.aiEnhanced && (
        <div className="card bg-gradient-to-r from-ikea-blue to-ikea-electric text-white">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🤖</div>
            <div>
              <h4 className="font-semibold mb-1">AI-Enhanced Design</h4>
              <p className="text-sm opacity-90">
                Generated from: "{design.userQuery}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
