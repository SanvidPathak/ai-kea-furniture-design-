import { useState } from 'react';
import { generateDesign } from '../../services/designGenerator.js';
import { Button } from '../common/Button.jsx';
import { Input } from '../common/Input.jsx';
import { Select } from '../common/Select.jsx';
import { ErrorMessage } from '../common/ErrorMessage.jsx';

const FURNITURE_TYPES = [
  { value: 'table', label: 'Table' },
  { value: 'chair', label: 'Chair' },
  { value: 'bookshelf', label: 'Bookshelf' },
  { value: 'desk', label: 'Desk' },
  { value: 'bed frame', label: 'Bed Frame' },
];

const MATERIALS = [
  { value: 'wood', label: 'Wood' },
  { value: 'metal', label: 'Metal' },
  { value: 'plastic', label: 'Plastic' },
];

const MATERIAL_COLORS = {
  wood: [
    { value: '#8B4513', label: 'Brown' },
    { value: '#D2691E', label: 'Oak' },
    { value: '#5C4033', label: 'Walnut' },
  ],
  metal: [
    { value: '#C0C0C0', label: 'Silver' },
    { value: '#2C2C2C', label: 'Black' },
    { value: '#CD7F32', label: 'Bronze' },
  ],
  plastic: [
    { value: '#FFFFFF', label: 'White' },
    { value: '#CCCCCC', label: 'Gray' },
    { value: '#FF6B6B', label: 'Red' },
    { value: '#4ECDC4', label: 'Teal' },
    { value: '#FFE66D', label: 'Yellow' },
  ],
};

export function ManualDesignForm({ onDesignGenerated }) {
  const [formData, setFormData] = useState({
    furnitureType: '',
    material: '',
    materialColor: '',
    length: '',
    width: '',
    height: '',
  });
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Reset material color when material changes
      if (name === 'material') {
        updated.materialColor = '';
      }

      return updated;
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.furnitureType) {
      newErrors.furnitureType = 'Please select a furniture type';
    }

    if (!formData.material) {
      newErrors.material = 'Please select a material';
    }

    if (!formData.materialColor) {
      newErrors.materialColor = 'Please select a color';
    }

    // Validate dimensions (optional - will use defaults if not provided)
    if (formData.length && (isNaN(formData.length) || Number(formData.length) <= 0)) {
      newErrors.length = 'Length must be a positive number';
    }
    if (formData.width && (isNaN(formData.width) || Number(formData.width) <= 0)) {
      newErrors.width = 'Width must be a positive number';
    }
    if (formData.height && (isNaN(formData.height) || Number(formData.height) <= 0)) {
      newErrors.height = 'Height must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) return;

    setLoading(true);

    try {
      // Prepare params for design generator
      const params = {
        furnitureType: formData.furnitureType,
        material: formData.material,
        materialColor: formData.materialColor,
      };

      // Add dimensions if provided
      if (formData.length || formData.width || formData.height) {
        params.dimensions = {};
        if (formData.length) params.dimensions.length = Number(formData.length);
        if (formData.width) params.dimensions.width = Number(formData.width);
        if (formData.height) params.dimensions.height = Number(formData.height);
      }

      // Generate design
      const design = generateDesign(params);

      // Pass design to parent component
      onDesignGenerated(design);
    } catch (error) {
      console.error('Design generation error:', error);
      setErrorMessage(error.message || 'Failed to generate design. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableColors = formData.material ? MATERIAL_COLORS[formData.material] : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage message={errorMessage} onClose={() => setErrorMessage('')} />

      {/* Furniture Type */}
      <Select
        label="Furniture Type"
        name="furnitureType"
        value={formData.furnitureType}
        onChange={handleChange}
        options={FURNITURE_TYPES}
        error={errors.furnitureType}
        required
        placeholder="Choose furniture type"
      />

      {/* Material */}
      <Select
        label="Material"
        name="material"
        value={formData.material}
        onChange={handleChange}
        options={MATERIALS}
        error={errors.material}
        required
        placeholder="Choose material"
      />

      {/* Material Color */}
      {formData.material && (
        <Select
          label="Color"
          name="materialColor"
          value={formData.materialColor}
          onChange={handleChange}
          options={availableColors}
          error={errors.materialColor}
          required
          placeholder="Choose color"
        />
      )}

      {/* Optional Dimensions */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
          Custom Dimensions (optional)
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          Leave blank to use default dimensions for the selected furniture type
        </p>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Length (cm)"
            type="number"
            name="length"
            value={formData.length}
            onChange={handleChange}
            error={errors.length}
            placeholder="Auto"
            min="1"
            step="1"
          />
          <Input
            label="Width (cm)"
            type="number"
            name="width"
            value={formData.width}
            onChange={handleChange}
            error={errors.width}
            placeholder="Auto"
            min="1"
            step="1"
          />
          <Input
            label="Height (cm)"
            type="number"
            name="height"
            value={formData.height}
            onChange={handleChange}
            error={errors.height}
            placeholder="Auto"
            min="1"
            step="1"
          />
        </div>
      </div>

      <Button
        type="submit"
        loading={loading}
        className="w-full"
      >
        Generate Design
      </Button>
    </form>
  );
}
