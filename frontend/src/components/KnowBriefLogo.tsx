import React from 'react';

interface KnowBriefLogoProps {
  compact?: boolean;
  lightSurface?: boolean;
  className?: string;
}

export const KnowBriefLogo: React.FC<KnowBriefLogoProps> = ({ compact = false, lightSurface = false, className = '' }) => (
  <img
    src={compact ? '/brand/knowbrief-mark.svg' : `/brand/knowbrief-logo${lightSurface ? '-dark' : ''}.svg`}
    alt="KnowBrief"
    className={className}
    draggable={false}
  />
);
