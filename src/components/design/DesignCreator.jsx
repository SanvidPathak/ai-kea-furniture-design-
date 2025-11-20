import { useState } from 'react';
import { ManualDesignForm } from './ManualDesignForm.jsx';
import { AIDesignInput } from './AIDesignInput.jsx';

export function DesignCreator({ onDesignGenerated }) {
  const [mode, setMode] = useState('manual'); // 'manual' or 'ai'

  return (
    <div className="space-y-4">
      {/* Mode Switcher Tabs */}
      <div className="flex gap-2 p-1 bg-neutral-100 rounded-lg">
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
            mode === 'manual'
              ? 'bg-white text-ikea-blue shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <span className="mr-2">📐</span>
          Manual Mode
        </button>
        <button
          onClick={() => setMode('ai')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
            mode === 'ai'
              ? 'bg-gradient-to-r from-ikea-blue to-ikea-electric text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <span className="mr-2">🤖</span>
          AI Mode
        </button>
      </div>

      {/* Mode Description */}
      <div className="text-sm text-neutral-600 bg-earth-beige p-3 rounded-lg">
        {mode === 'manual' ? (
          <p>
            <strong>Manual Mode:</strong> Use the form to select furniture type, material, and dimensions.
            Perfect for precise specifications.
          </p>
        ) : (
          <p>
            <strong>AI Mode:</strong> Describe your furniture in plain English and AI will create the design for you.
            Great for exploring ideas!
          </p>
        )}
      </div>

      {/* Conditional Mode Rendering */}
      <div className="animate-fade-in">
        {mode === 'manual' ? (
          <ManualDesignForm onDesignGenerated={onDesignGenerated} />
        ) : (
          <AIDesignInput onDesignGenerated={onDesignGenerated} />
        )}
      </div>
    </div>
  );
}
