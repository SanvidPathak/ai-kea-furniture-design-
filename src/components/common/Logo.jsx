export function Logo({ size = 'responsive', className = '' }) {
  // Size variants matching text sizing breakpoints
  const sizeClasses = {
    responsive: 'h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const sizeClass = sizeClasses[size] || sizeClasses.responsive;

  return (
    <svg
      className={`${sizeClass} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="AI-KEA"
    >
      {/* Top modular block */}
      <rect
        x="14"
        y="8"
        width="20"
        height="8"
        className="fill-ikea-blue"
        rx="1"
      />

      {/* Middle left block */}
      <rect
        x="10"
        y="18"
        width="13"
        height="10"
        className="fill-ikea-blue"
        rx="1"
      />

      {/* Middle right block with accent */}
      <rect
        x="25"
        y="18"
        width="13"
        height="10"
        className="fill-ikea-blue"
        rx="1"
      />

      {/* Small AI accent block (yellow) */}
      <rect
        x="23"
        y="20"
        width="4"
        height="6"
        className="fill-ikea-yellow"
        rx="0.5"
      />

      {/* Bottom base block */}
      <rect
        x="8"
        y="30"
        width="32"
        height="10"
        className="fill-ikea-blue"
        rx="1"
      />

      {/* Assembly connection lines (subtle detail) */}
      <line
        x1="24"
        y1="16"
        x2="24"
        y2="18"
        className="stroke-ikea-blue"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* AI Circuit node accent */}
      <circle
        cx="24"
        cy="35"
        r="2"
        className="fill-ikea-yellow"
      />

      {/* Small connection dots (assembly instruction style) */}
      <circle
        cx="17"
        cy="23"
        r="1"
        className="fill-white opacity-40"
      />
      <circle
        cx="31"
        cy="23"
        r="1"
        className="fill-white opacity-40"
      />
    </svg>
  );
}
