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
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AI-KEA Glitch Chair Logo"
    >
      <defs>
        {/* Wood Gradient for the physical side */}
        <linearGradient id="woodGradient" x1="0" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4A3728" />
          <stop offset="100%" stopColor="#2D1B15" />
        </linearGradient>
        {/* Glow Filter for the digital side */}
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* --- LEFT SIDE: PHYSICAL (Solid Wood) --- */}
      <g clipPath="url(#clipperLeft)">
        {/* Chair Body: Abstract representation of a classic wooden chair */}
        <path
          d="M30 20 L30 60 L20 60 L20 90 L30 90 L30 70 L70 70 L70 90 L80 90 L80 60 L70 60 L70 20 Z"
          fill="url(#woodGradient)"
          stroke="black"
          strokeWidth="1"
        />
        {/* Backrest Slats */}
        <rect x="38" y="25" width="6" height="30" rx="1" fill="#3E2723" stroke="black" strokeWidth="1" />
        <rect x="56" y="25" width="6" height="30" rx="1" fill="#3E2723" stroke="black" strokeWidth="1" />
      </g>

      {/* --- RIGHT SIDE: DIGITAL (Wireframe Glitch) --- */}
      {/* The clip path ensures specific 'halving' effect */}
      <defs>
        <clipPath id="clipperLeft">
          <rect x="0" y="0" width="50" height="100" />
        </clipPath>
        <clipPath id="clipperRight">
          <rect x="50" y="0" width="50" height="100" />
        </clipPath>
      </defs>

      <g clipPath="url(#clipperRight)" filter="url(#neonGlow)">
        {/* Wireframe Outline - Adaptive Color */}
        {/* Dark Blue in Light Mode, Neon Cyan in Dark Mode */}
        <path
          d="M30 20 L30 60 L20 60 L20 90 L30 90 L30 70 L70 70 L70 90 L80 90 L80 60 L70 60 L70 20 Z"
          className="stroke-blue-700 dark:stroke-cyan-400"
          strokeWidth="2"
          fill="none"
        />
        {/* Wireframe Internal Mesh */}
        <path d="M30 20 L70 20" className="stroke-blue-700 dark:stroke-cyan-400" strokeWidth="1" opacity="0.5" />
        <path d="M30 60 L70 60" className="stroke-blue-700 dark:stroke-cyan-400" strokeWidth="1" opacity="0.5" />

        {/* Vertical Mesh Lines */}
        <path d="M41 20 L41 60" className="stroke-blue-700 dark:stroke-cyan-400" strokeWidth="1" opacity="0.5" />
        <path d="M59 20 L59 60" className="stroke-blue-700 dark:stroke-cyan-400" strokeWidth="1" opacity="0.5" />

        {/* Glitch Rectangles */}
        <rect x="75" y="30" width="10" height="2" className="fill-blue-500 dark:fill-cyan-300" opacity="0.8" />
        <rect x="82" y="45" width="6" height="2" className="fill-blue-500 dark:fill-cyan-300" opacity="0.6" />
        <rect x="48" y="10" width="4" height="4" className="fill-purple-500" opacity="0.9" />
      </g>

      {/* Split Line - Z-axis jagged edge */}
      <path
        d="M50 10 L48 25 L52 40 L48 55 L52 70 L50 90"
        className="stroke-white dark:stroke-black"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
