import { useState } from 'react';
import { isAIModeAvailable, getExamplePrompts } from '../../services/hybridDesignGenerator.js';
import { Button } from '../common/Button.jsx';
import { ErrorMessage } from '../common/ErrorMessage.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';

export function AIDesignInput({ onDesignGenerated }) {
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showExamples, setShowExamples] = useState(true);
  const { isFestive } = useTheme();

  const isAvailable = isAIModeAvailable();
  const examplePrompts = getExamplePrompts();

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
      // Import the hybrid generator
      const { generateFromNaturalLanguage } = await import('../../services/hybridDesignGenerator.js');

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

  const handleExampleClick = (prompt) => {
    setUserInput(prompt);
    setShowExamples(false);
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
          placeholder="Example: I need a modern office desk in black metal, about 150cm wide, with drawers..."
          rows={4}
          className="w-full px-4 py-3 border-2 border-neutral-300 rounded focus:border-primary-500 focus:outline-none transition-colors duration-200 resize-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Be specific about type, material, size, style, and any special features
        </p>
      </div>

      {/* Example Prompts */}
      {showExamples && (
        <div>
          <button
            type="button"
            onClick={() => setShowExamples(!showExamples)}
            className="text-sm font-medium text-ikea-blue hover:text-primary-700 transition-colors mb-2"
          >
            {showExamples ? '▼' : '▶'} Example Prompts
          </button>

          {showExamples && (
            <div className="space-y-2">
              {examplePrompts.slice(0, 4).map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="w-full text-left p-3 bg-earth-beige dark:bg-neutral-800 hover:bg-earth-sand dark:hover:bg-neutral-700 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 transition-colors"
                >
                  <span className="text-ikea-blue mr-2">💡</span>
                  {example}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rate Limit Info */}
      <div className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 p-3 rounded">
        <strong>Free Tier Limits:</strong> 10 requests/minute, 250 requests/day
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        loading={loading}
        disabled={!userInput.trim()}
        className="w-full"
      >
        {loading ? 'Generating with AI...' : 'Generate Design with AI'}
      </Button>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <span className="text-blue-600">ℹ️</span>
        <p className="text-xs text-blue-800 dark:text-blue-200">
          AI will analyze your description and create a complete furniture design with parts, materials, dimensions, and assembly instructions.
          This typically takes 2-4 seconds.
        </p>
      </div>
    </form>
  );
}
