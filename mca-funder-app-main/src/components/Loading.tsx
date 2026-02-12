import React from 'react';

/**
 * Loading Component Props Interface
 * Provides flexible loading states for different UI scenarios
 */
interface LoadingProps {
  /** Main loading text displayed to user */
  title?: string;
  /** Descriptive text explaining what's happening */
  description?: string;
  /** Size variant affecting icon size and padding */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes for customization */
  className?: string;
  /** 
   * Overlay mode: covers parent container with backdrop
   * Requires parent to have 'relative' positioning
   * Usage: <div className="relative">{content}{loading && <Loading overlay />}</div>
   */
  overlay?: boolean;
  /** 
   * Full screen mode: covers entire viewport with backdrop
   * Appears above all content with highest z-index
   * Usage: {globalLoading && <Loading fullScreen />}
   */
  fullScreen?: boolean;
}

/**
 * Loading Component
 * A reusable loading indicator with multiple display modes and sizes
 * 
 * @example Basic usage:
 * <Loading title="Loading data..." description="Please wait..." />
 * 
 * @example Overlay usage:
 * <div className="relative">
 *   <YourContent />
 *   {isLoading && <Loading overlay title="Updating..." />}
 * </div>
 * 
 * @example Full screen usage:
 * {isAppLoading && <Loading fullScreen title="Initializing..." />}
 */
const Loading: React.FC<LoadingProps> = ({ 
  title = 'Loading...', 
  description = 'Please wait...',
  size = 'md',
  className = '',
  overlay = false,
  fullScreen = false
}) => {
  /**
   * Size configuration object
   * Defines styling for different component sizes
   * - sm: Compact size for small spaces
   * - md: Default size for most use cases  
   * - lg: Large size for prominent loading states
   */
  const sizeConfig = {
    sm: {
      container: 'py-4',        // Smaller vertical padding
      card: 'p-4 max-w-xs',     // Compact card with extra small width
      icon: 'h-6 w-6',          // Small icon size
      title: 'text-base',       // Standard title text
      description: 'text-xs'    // Small description text
    },
    md: {
      container: 'py-8',        // Medium vertical padding
      card: 'p-6 max-w-md',     // Standard card with medium width
      icon: 'h-8 w-8',          // Medium icon size
      title: 'text-lg',         // Large title text
      description: 'text-sm'    // Small description text
    },
    lg: {
      container: 'py-12',       // Large vertical padding
      card: 'p-8 max-w-lg',     // Spacious card with large width
      icon: 'h-12 w-12',        // Large icon size
      title: 'text-xl',         // Extra large title text
      description: 'text-base'  // Standard description text
    }
  };

  const config = sizeConfig[size];

  /**
   * Determines container CSS classes based on display mode
   * Handles three different rendering modes:
   * 1. Default: inline block element
   * 2. Overlay: covers parent container 
   * 3. Full screen: covers entire viewport
   */
  const getContainerClasses = () => {
    if (fullScreen) {
      // Full screen overlay - covers entire viewport
      // fixed: positioned relative to viewport
      // inset-0: top: 0, right: 0, bottom: 0, left: 0
      // bg-black bg-opacity-50: dark semi-transparent backdrop
      // z-50: high z-index to appear above other content
      return `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`;
    } else if (overlay) {
      // Container overlay - covers parent element
      // absolute: positioned relative to nearest positioned parent
      // inset-0: covers entire parent container
      // bg-theme-background bg-opacity-80: themed semi-transparent backdrop
      // z-10: moderate z-index to appear above sibling content
      return `absolute inset-0 bg-theme-background bg-opacity-80 flex items-center justify-center z-10 ${className}`;
    } else {
      // Default inline display - normal document flow
      // flex items-center justify-center: centers content
      // config.container: size-specific padding
      return `flex items-center justify-center ${config.container} ${className}`;
    }
  };

  /**
   * Loading content component
   * Renders the actual loading card with icon, title, and description
   * Separated for reusability across different container modes
   */
  const LoadingContent = () => (
    <div className={`text-center ${config.card} bg-theme-secondary border border-theme-border rounded-lg shadow-theme-sm`}>
      {/* Loading icon container */}
      <div className="mb-4 flex justify-center">
        <div className="flex items-center space-x-2 text-theme-primary">
          {/* 
            SVG spinning icon using CSS animation
            - animate-spin: Tailwind's rotation animation
            - circle: Background ring with low opacity
            - path: Active indicator with higher opacity
            Creates a smooth circular loading animation
          */}
          <svg className={`animate-spin ${config.icon} text-theme-primary`} fill="none" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        </div>
      </div>
      
      {/* Loading title */}
      <h3 className={`${config.title} font-medium text-theme-foreground mb-2`}>
        {title}
      </h3>
      
      {/* Loading description */}
      <p className={`text-theme-muted-foreground ${config.description}`}>
        {description}
      </p>
    </div>
  );

  return (
    <div className={getContainerClasses()}>
      <LoadingContent />
    </div>
  );
};

export default Loading;

/**
 * Usage Examples:
 * 
 * 1. Default inline loading:
 *    <Loading title="Loading..." description="Please wait..." />
 * 
 * 2. Overlay loading (covers parent container):
 *    <div className="relative">
 *      <YourContent />
 *      {isLoading && <Loading overlay title="Loading..." description="Fetching data..." />}
 *    </div>
 * 
 * 3. Full screen loading (covers entire viewport):
 *    {isLoading && <Loading fullScreen title="Loading..." description="Processing..." />}
 * 
 * 4. Different sizes:
 *    <Loading size="sm" title="Loading..." />
 *    <Loading size="lg" title="Loading..." />
 * 
 * Note: When using overlay=true, ensure the parent container has 'relative' positioning.
 * When using fullScreen=true, the loading will appear above all other content.
 */ 