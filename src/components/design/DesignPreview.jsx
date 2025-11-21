import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { saveDesign } from '../../services/designService.js';
import { saveOrder } from '../../services/orderService.js';
import { DesignPartsTable } from './DesignPartsTable.jsx';
import { CostBreakdown } from './CostBreakdown.jsx';
import { OrderForm } from '../order/OrderForm.jsx';
import { Button } from '../common/Button.jsx';
import { ErrorMessage } from '../common/ErrorMessage.jsx';

export function DesignPreview({ design }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [savedDesignId, setSavedDesignId] = useState(design?.id || null);
  const [errorMessage, setErrorMessage] = useState('');

  // Update savedDesignId when design prop changes (e.g., when viewing saved design)
  useEffect(() => {
    if (design?.id) {
      setSavedDesignId(design.id);
    }
  }, [design?.id]);

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
      const savedDesign = await saveDesign(user.uid, design);
      setSavedDesignId(savedDesign.id);
      showToast('Design saved successfully! View it in My Designs.', 'success');
      return savedDesign.id;
    } catch (error) {
      console.error('Save design error:', error);
      setErrorMessage('Failed to save design. Please try again.');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Save design first if not already saved
      let designId = savedDesignId;
      if (!designId) {
        designId = await handleSave();
        if (!designId) {
          setErrorMessage('Failed to save design. Please try again.');
          return;
        }
      }

      setShowOrderForm(true);
    } catch (error) {
      console.error('Error preparing order:', error);
      setErrorMessage('Failed to prepare order. Please try again.');
    }
  };

  const handleOrderSubmit = async (customerInfo) => {
    try {
      const orderData = {
        designId: savedDesignId || 'temp',
        designSnapshot: design,
        customerInfo,
      };

      await saveOrder(user.uid, orderData);
      showToast('Order placed successfully! Check My Orders for details.', 'success');
      setShowOrderForm(false);
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <ErrorMessage message={errorMessage} onClose={() => setErrorMessage('')} />

      {/* Design Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 capitalize mb-2">
              {design.furnitureType}
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-600">
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
          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-bold text-ikea-blue">
              ₹{design.totalCost.toFixed(2)}
            </div>
            <div className="text-xs text-neutral-500">Total Cost</div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-earth-beige rounded-lg">
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-neutral-900">
              {design.dimensions.length}
            </div>
            <div className="text-[10px] sm:text-xs text-neutral-600">Length (cm)</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-neutral-900">
              {design.dimensions.width}
            </div>
            <div className="text-[10px] sm:text-xs text-neutral-600">Width (cm)</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-neutral-900">
              {design.dimensions.height}
            </div>
            <div className="text-[10px] sm:text-xs text-neutral-600">Height (cm)</div>
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

      {/* Cost Breakdown */}
      <CostBreakdown
        parts={design.parts}
        material={design.material}
        totalCost={design.totalCost}
      />

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

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-4">Place Your Order</h2>
              <OrderForm
                design={design}
                onSubmit={handleOrderSubmit}
                onCancel={() => setShowOrderForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button
          onClick={handleSave}
          loading={saving}
          className="flex-1"
        >
          {user ? 'Save Design' : 'Sign in to Save'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleCreateOrder}
          className="flex-1"
        >
          {user ? 'Create Order' : 'Sign in to Order'}
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
