'use client';

import React, { useRef, useEffect, useState } from 'react';

export interface CollapseTransitionProps {
  /** Whether the content is open/expanded */
  isOpen: boolean;
  /** Content to be collapsed/expanded */
  children: React.ReactNode;
  /** Maximum height when expanded. Use 'auto' for unlimited height (default: 'auto') */
  maxHeight?: string | 'auto';
  /** Duration of the transition in milliseconds (default: 500) */
  duration?: number;
  /** Easing function (default: ease-in-out). Use 'linear' for constant speed */
  easing?: string;
  /** Padding when expanded (default: p-6) */
  expandedPadding?: string;
  /** Padding when collapsed (default: p-0) */
  collapsedPadding?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate the inner content with fade-in effect */
  animateContent?: boolean;
}

// Helper function to convert Tailwind padding classes to pixel values
const getPaddingValueInPx = (paddingClass: string): number => {
  // Extract the number from Tailwind padding classes like 'p-6', 'py-4', 'pt-2 pb-3', etc.
  const paddingMap: { [key: string]: number } = {
    '0': 0,
    '0.5': 2,
    '1': 4,
    '1.5': 6,
    '2': 8,
    '2.5': 10,
    '3': 12,
    '3.5': 14,
    '4': 16,
    '5': 20,
    '6': 24,
    '7': 28,
    '8': 32,
    '9': 36,
    '10': 40,
    '11': 44,
    '12': 48,
    '14': 56,
    '16': 64,
    '20': 80,
    '24': 96,
    '28': 112,
    '32': 128,
  };

  let topPadding = 0;
  let bottomPadding = 0;

  // Split the class string by spaces to handle multiple classes
  const classes = paddingClass.split(' ');
  
  for (const cls of classes) {
    if (cls.startsWith('p-')) {
      // p-x applies to all sides
      const value = cls.substring(2);
      const px = paddingMap[value] || 0;
      topPadding = px;
      bottomPadding = px;
    } else if (cls.startsWith('py-')) {
      // py-x applies to top and bottom
      const value = cls.substring(3);
      const px = paddingMap[value] || 0;
      topPadding = px;
      bottomPadding = px;
    } else if (cls.startsWith('pt-')) {
      // pt-x applies to top only
      const value = cls.substring(3);
      topPadding = paddingMap[value] || 0;
    } else if (cls.startsWith('pb-')) {
      // pb-x applies to bottom only
      const value = cls.substring(3);
      bottomPadding = paddingMap[value] || 0;
    }
  }

  return topPadding + bottomPadding;
};

const CollapseTransition: React.FC<CollapseTransitionProps> = ({
  isOpen,
  children,
  maxHeight = 'auto',
  duration = 500,
  easing = 'ease-in-out',
  expandedPadding = 'p-6',
  collapsedPadding = 'p-0',
  className = '',
  animateContent = true,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [computedHeight, setComputedHeight] = useState<string>('0px');
  const transitionDuration = `${duration}ms`;
  
  // Helper function to calculate total height including padding
  const calculateTotalHeight = () => {
    if (!contentRef.current) return '0px';
    
    const actualHeight = contentRef.current.scrollHeight;
    const paddingHeight = getPaddingValueInPx(expandedPadding);
    const totalHeight = actualHeight + paddingHeight;
    return maxHeight === 'auto' ? `${totalHeight}px` : maxHeight;
  };
  
  // Calculate actual content height including padding
  useEffect(() => {
    const newHeight = calculateTotalHeight();
    setComputedHeight(newHeight);
  }, [children, maxHeight, isOpen, expandedPadding]);

  // Use ResizeObserver to detect content size changes
  useEffect(() => {
    if (!contentRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Add a small delay to ensure DOM has updated
      requestAnimationFrame(() => {
        const newHeight = calculateTotalHeight();
        setComputedHeight(newHeight);
      });
    });

    resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [maxHeight, expandedPadding]);
  
  const computedMaxHeight = maxHeight === 'auto' ? computedHeight : maxHeight;
  
  return (
    <div
      className={`
        overflow-hidden transition-[max-height,opacity,padding] ${easing}
        ${isOpen 
          ? `opacity-100 ${expandedPadding}` 
          : `max-h-0 opacity-0 ${collapsedPadding}`
        }
        ${className}
      `}
      style={{
        maxHeight: isOpen ? computedMaxHeight : '0px',
        transitionDuration,
      }}
    >
      <div 
        ref={contentRef}
        className={`
          ${animateContent && isOpen ? 'animate-fade-in' : ''}
        `}
      >
        {children}
      </div>
    </div>
  );
};

export default CollapseTransition; 