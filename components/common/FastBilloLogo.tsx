import React from 'react';

interface FastBilloLogoProps {
  /** Size of the logo square badge in pixels (default: 44) */
  size?: number;
  /** Whether to show the brand name & tagline next to the logo box */
  showBrandText?: boolean;
  /** Text size variant */
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional extra className for outer container */
  className?: string;
  /** Dark mode invert or custom override */
  variant?: 'light' | 'dark' | 'auto';
}

export const FastBilloLogo: React.FC<FastBilloLogoProps> = ({
  size = 44,
  showBrandText = false,
  textSize = 'md',
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Square Green Logo Box with Bill Design and white FASTBILLO */}
      <div
        style={{ width: size, height: size }}
        className="relative flex-shrink-0 rounded-2xl shadow-md overflow-hidden transition-transform duration-200 hover:scale-105"
        title="FASTBILLO — Bill Fast. Grow Faster."
      >
        <img
          src="/fastbillo-logo.svg"
          alt="FASTBILLO Logo"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to PNG if SVG encounters any issues
            (e.target as HTMLImageElement).src = '/fastbillo-logo.png';
          }}
        />
      </div>

      {showBrandText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center">
            <span
              className={`font-black tracking-tight text-gray-900 dark:text-white ${
                textSize === 'sm'
                  ? 'text-lg'
                  : textSize === 'lg'
                  ? 'text-2xl sm:text-3xl'
                  : textSize === 'xl'
                  ? 'text-3xl sm:text-4xl'
                  : 'text-xl sm:text-2xl'
              }`}
            >
              FAST<span className="text-emerald-600 dark:text-emerald-400">BILLO</span>
            </span>
          </div>
          <span
            className={`font-bold tracking-wider uppercase text-emerald-600/90 dark:text-emerald-400/90 mt-1 ${
              textSize === 'sm'
                ? 'text-[9px]'
                : textSize === 'xl'
                ? 'text-xs tracking-widest'
                : 'text-[10px]'
            }`}
          >
            Bill Fast. Grow Faster.
          </span>
        </div>
      )}
    </div>
  );
};

export default FastBilloLogo;
