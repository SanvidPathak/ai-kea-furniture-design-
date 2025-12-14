import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  ariaLabel,
  ...props
}) {
  const baseStyles = 'px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold flex items-center justify-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'btn-ikea focus:ring-ikea-blue shadow-lg hover:shadow-xl',
    secondary: 'btn-secondary focus:ring-neutral-400',
    accent: 'btn-accent focus:ring-ikea-electric shadow-lg hover:shadow-xl',
  };

  const variantClass = variants[variant] || variants.primary;

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={twMerge(baseStyles, variantClass, className)}
      aria-label={ariaLabel}
      aria-busy={loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </motion.button>
  );
}
