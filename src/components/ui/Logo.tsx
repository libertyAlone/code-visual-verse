export const Logo = ({ size = 32, className = "" }: { size?: number, className?: string }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Galactic Ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="40" 
        stroke="url(#logo_gradient_1)" 
        strokeWidth="2" 
        strokeDasharray="10 5"
        className="animate-[spin_20s_linear_infinite]"
      />
      
      {/* Code Brackets + Planet Core */}
      <path 
        d="M35 30L25 50L35 70" 
        stroke="#22d3ee" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M65 30L75 50L65 70" 
        stroke="#22d3ee" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Central Planet / Core */}
      <rect 
        x="42" 
        y="42" 
        width="16" 
        height="16" 
        rx="2" 
        fill="url(#logo_gradient_2)" 
        className="animate-pulse"
      />
      
      {/* Orbiting Electrons / Data Points */}
      <circle cx="50" cy="10" r="4" fill="#6366f1">
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          from="0 50 50" 
          to="360 50 50" 
          dur="4s" 
          repeatCount="indefinite" 
        />
      </circle>
      
      <circle cx="10" cy="50" r="3" fill="#ec4899">
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          from="360 50 50" 
          to="0 50 50" 
          dur="7s" 
          repeatCount="indefinite" 
        />
      </circle>

      <defs>
        <linearGradient id="logo_gradient_1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06b6d4" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="logo_gradient_2" x1="42" y1="42" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
};
