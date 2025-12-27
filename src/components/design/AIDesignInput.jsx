import { useState } from 'react';
import { isAIModeAvailable, generateFromNaturalLanguage } from '../../services/hybridDesignGenerator.js';
import { Button } from '../common/Button.jsx';
import { ErrorMessage } from '../common/ErrorMessage.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';

export function AIDesignInput({ onDesignGenerated }) {
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Expanded state for accordion (null = all closed)
  const [expandedItem, setExpandedItem] = useState(null);
  const { isFestive } = useTheme();

  const isAvailable = isAIModeAvailable();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!userInput.trim()) {
      setErrorMessage('Please describe the furniture you want to create');
      return;
    }

    if (!isAvailable) {
      setErrorMessage('AI mode is not available. Please check your Gemini API key.');
      return;
    }

    setLoading(true);

    try {
      // Generate design from natural language
      const design = await generateFromNaturalLanguage(userInput.trim());

      // Pass design to parent component
      onDesignGenerated(design);

      // Clear input on success
      setUserInput('');
    } catch (error) {
      console.error('AI design generation error:', error);

      // Handle specific error types
      let message = 'Failed to generate design with AI. Please try again.';

      if (error.message?.includes('QUOTA_EXCEEDED')) {
        message = error.message.replace('QUOTA_EXCEEDED: ', '');
      } else if (error.message?.includes('rate limit')) {
        message = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message?.includes('quota')) {
        message = 'Daily quota exceeded. Please try again tomorrow or use manual mode.';
      } else if (error.message?.includes('API key')) {
        message = 'Invalid API key. Please check your configuration.';
      } else if (error.message) {
        message = error.message;
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (item) => {
    setExpandedItem(expandedItem === item ? null : item);
  };

  if (!isAvailable) {
    return (
      <div className="card bg-yellow-50 border-2 border-yellow-400">
        <div className="flex items-start gap-3">
          <div className="text-3xl">⚠️</div>
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">AI Mode Unavailable</h3>
            <p className="text-sm text-yellow-800 mb-3">
              The AI design feature requires a Gemini API key. Please configure your API key to use natural language design.
            </p>
            <p className="text-xs text-yellow-700">
              You can still use the manual design mode with the form below.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Supported Furniture Data
  const FURNITURE_GUIDE = [
    {
      id: 'table',
      icon: '🍽️',
      title: 'Dining & Coffee Tables',
      desc: 'Rectangular tables with custom dimensions.',
      details: [
        'Custom Length, Width, Height',
        'Material Selection (Wood/Metal/Plastic)',
        'Limit: Rectangular shapes only (No round tables yet)'
      ],
      prompt: "Prompt: 'A 180x90cm wooden dining table'"
    },
    {
      id: 'desk',
      icon: '🖥️',
      title: 'Office Desks',
      desc: 'Workspaces with shelves and compartments.',
      details: [
        'Side Storage (Left/Right/Both)',
        'Feature: Asymmetric shelf counts (e.g. "3 left, 2 right")',
        'Limit: No Drawers or Keyboard Trays',
        'Pro Tip: Side storage automatically disables under-desk partitions'
      ],
      prompt: "Prompt: 'A 140x60cm desk with 2 side shelves'"
    },
    {
      id: 'bookshelf',
      icon: '📚',
      title: 'Bookshelves',
      desc: 'Advanced storage with smart partitioning.',
      details: [
        'Custom Shelf Count',
        'Feature: Partition Ratios (e.g. 1:2, 30:70)',
        'Pro Tip: System removes partitions if <20cm wide'
      ],
      prompt: "Prompt: 'Bookshelf with 1:2 partition ratio'"
    },
    {
      id: 'chair',
      icon: '🪑',
      title: 'Chairs',
      desc: 'Standard dining and office chairs.',
      details: [
        'Basic ergonomics (Seat, Backrest, Legs)',
        'Optional Armrests',
        'Limit: No wheels or height adjustment mechanics'
      ],
      prompt: "Prompt: 'A simple wooden dining chair'"
    },
    {
      id: 'bed',
      icon: '🛏️',
      title: 'Bed Frames',
      desc: 'Platform beds in standard or custom sizes.',
      details: [
        'Standard Sizes (Twin to Cali King)',
        'Heavy Duty Logic (>600kg adds extra support)',
        'Limit: Headboard styles are generic'
      ],
      prompt: "Prompt: 'A Queen size bed frame in wood'"
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorMessage message={errorMessage} onClose={() => setErrorMessage('')} />

      {/* AI Status Badge */}
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-ikea-blue to-ikea-electric rounded-lg text-white">
        <span className="text-2xl">{isFestive ? '🎅' : '🤖'}</span>
        <div className="flex-1">
          <h3 className="font-semibold">AI-Powered Design</h3>
          <p className="text-xs opacity-90">Describe your furniture in plain English</p>
        </div>
        <div className="text-xs bg-white/20 px-2 py-1 rounded">
          ✓ Ready
        </div>
      </div>

      {/* Text Input */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Describe Your Furniture
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Example: I need a modern office desk in black metal, about 150cm wide..."
          rows={3}
          className="w-full px-4 py-3 border-2 border-neutral-300 rounded focus:border-primary-500 focus:outline-none transition-colors duration-200 resize-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Be specific about type, material, size, and special features.
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        loading={loading}
        disabled={!userInput.trim()}
        className="w-full mb-4"
      >
        {loading ? 'Generating with AI...' : 'Generate Design with AI'}
      </Button>

      {/* Supported Furniture Guide (Accordion) */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-800">
        <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <span>ℹ️</span> Supported Furniture Guide
          </h4>
        </div>

        {/* Pro Tips Header */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 text-xs text-blue-800 dark:text-blue-200 border-b border-neutral-200 dark:border-neutral-700">
          <strong>Pro Tips:</strong>
          <ul className="list-disc list-inside mt-1 space-y-0.5 opacity-90">
            <li><strong>Cost:</strong> Wood ($) &lt; Plastic ($$) &lt; Metal ($$$)</li>
            <li><strong>Load:</strong> Mention weight (e.g. "600kg") for heavy-duty walls.</li>
          </ul>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
          {FURNITURE_GUIDE.map((item) => (
            <div key={item.id} className="text-sm">
              <button
                type="button"
                onClick={() => toggleAccordion(item.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors text-left"
              >
                <span className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <span>{item.icon}</span> {item.title}
                </span>
                <span className="text-neutral-400 text-xs">{expandedItem === item.id ? '▼' : '▶'}</span>
              </button>

              {expandedItem === item.id && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
                  <p>{item.desc}</p>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    {item.details.map((detail, idx) => (
                      <li key={idx} className={detail.includes('Limit') ? 'text-red-500 dark:text-red-400' : ''}>
                        {detail}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 p-2 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 font-mono text-ikea-blue dark:text-blue-300">
                    {item.prompt}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>



      {/* Rate Limit Info */}
      <div className="text-xs text-center text-neutral-400 dark:text-neutral-500">
        Free Tier Limits: 10 requests/minute, 250 requests/day
      </div>
    </form>
  );
}
