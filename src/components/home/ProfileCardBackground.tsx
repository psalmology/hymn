import React from 'react';
import { WidgetBgType } from '../../types/profileWidget';

interface ProfileCardBackgroundProps {
  bgType: WidgetBgType;
  customBgUrl?: string;
}

export const ProfileCardBackground: React.FC<ProfileCardBackgroundProps> = ({
  bgType,
  customBgUrl,
}) => {
  if (bgType === 'custom-image' && customBgUrl) {
    return (
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${customBgUrl})` }}
      >
        {/* Semi-transparent gray-white overlay for text legibility */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] pointer-events-none" />
      </div>
    );
  }

  if (bgType === 'pure-gray') {
    return <div className="absolute inset-0 w-full h-full bg-[#EAEAEF] pointer-events-none" />;
  }

  if (bgType === 'gradient-gray') {
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#FAFAFC] via-[#EEEEF3] to-[#DFDFE5] pointer-events-none" />
    );
  }

  if (bgType === 'grid-mesh') {
    return (
      <div
        className="absolute inset-0 w-full h-full bg-[#F3F3F7] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.045) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px',
        }}
      />
    );
  }

  if (bgType === 'stripe-texture') {
    return (
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(45deg, #F5F5F8, #F5F5F8 8px, #ECECEF 8px, #ECECEF 16px)',
        }}
      />
    );
  }

  // Default: 'dots-stars' pattern (gray-white with subtle dots and little sparkle stars)
  return (
    <div className="absolute inset-0 w-full h-full bg-[#F6F6F9] overflow-hidden pointer-events-none">
      <svg
        className="w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="dots-and-stars-pattern"
            width="56"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            {/* Soft gray micro dots */}
            <circle cx="8" cy="12" r="1.3" fill="#000000" fillOpacity="0.08" />
            <circle cx="36" cy="40" r="1.3" fill="#000000" fillOpacity="0.08" />
            <circle cx="48" cy="14" r="1" fill="#000000" fillOpacity="0.06" />
            <circle cx="18" cy="44" r="1" fill="#000000" fillOpacity="0.06" />

            {/* Delicate 4-pointed sparkle stars */}
            <path
              d="M26 8 Q26 14 32 14 Q26 14 26 20 Q26 14 20 14 Q26 14 26 8 Z"
              fill="#000000"
              fillOpacity="0.09"
            />
            <path
              d="M12 28 Q12 32 16 32 Q12 32 12 36 Q12 32 8 32 Q12 32 12 28 Z"
              fill="#000000"
              fillOpacity="0.07"
            />
            <path
              d="M44 26 Q44 29 47 29 Q44 29 44 32 Q44 29 41 29 Q44 29 44 26 Z"
              fill="#000000"
              fillOpacity="0.07"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#dots-and-stars-pattern)"
        />
      </svg>
    </div>
  );
};
