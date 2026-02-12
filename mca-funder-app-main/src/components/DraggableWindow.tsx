import React, { useState, useRef, useEffect } from 'react';

// Get default modal dimensions (1/3 of screen size)
const getDefaultModalDimensions = () => {
  if (typeof window === 'undefined') {
    return { width: 400, height: 300 }; // SSR fallback
  }
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  return {
    width: Math.floor(2 * viewportWidth / 3),
    height: Math.floor(3 * viewportHeight / 4)
  };
};

// Calculate smart modal position (center-biased with cascade for multiple modals)
export const calculateModalPosition = (existingPositions: { x: number; y: number }[] = []) => {
  if (typeof window === 'undefined') {
    return { x: 200, y: 100 }; // SSR fallback
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const modalDimensions = getDefaultModalDimensions();
  
  // Center position
  const centerX = Math.floor((viewportWidth - modalDimensions.width) / 2);
  const centerY = Math.floor((viewportHeight - modalDimensions.height) / 2);
  
  // If no existing modals, use center
  if (existingPositions.length === 0) {
    return { x: centerX, y: centerY };
  }
  
  // For multiple modals, create a gentle cascade around center
  const offset = 40;
  const maxSteps = Math.min(8, Math.floor(Math.min(
    (viewportWidth - modalDimensions.width) / (2 * offset),
    (viewportHeight - modalDimensions.height) / (2 * offset)
  )));
  
  const step = existingPositions.length % maxSteps;
  const cascadeX = centerX + (step * offset) - (maxSteps * offset / 2);
  const cascadeY = centerY + (step * offset) - (maxSteps * offset / 2);
  
  // Ensure within bounds
  const x = Math.max(50, Math.min(cascadeX, viewportWidth - modalDimensions.width - 50));
  const y = Math.max(50, Math.min(cascadeY, viewportHeight - modalDimensions.height - 50));
  
  return { x, y };
};

interface DraggableWindowProps {
    title: string;
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
    width?: string;
    height?: string;
    initialPosition?: { x: number; y: number };
    onDragStart?: () => void;
    resizable?: boolean; // New prop to enable/disable resizing
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const DraggableWindow: React.FC<DraggableWindowProps> = ({ 
    title, 
    children, 
    onClose, 
    className = '',
    width,
    height,
    initialPosition = { x: 200, y: 100 },
    onDragStart,
    resizable = true
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentSize, setCurrentSize] = useState(() => {
        const defaultDimensions = getDefaultModalDimensions();
        return { 
            width: width ? parseInt(width) : defaultDimensions.width, 
            height: height ? parseInt(height) : defaultDimensions.height 
        };
    });
    
    // Store position and size before fullscreen for restoration
    const [preFullscreenState, setPreFullscreenState] = useState({ 
        position: initialPosition, 
        size: { width: 0, height: 0 } 
    });
    
    // Store initial/minimum dimensions
    const [minSize] = useState(() => {
        const defaultDimensions = getDefaultModalDimensions();
        return { 
            width: width ? parseInt(width) : defaultDimensions.width, 
            height: height ? parseInt(height) : defaultDimensions.height 
        };
    });
    
    const dragging = useRef(false);
    const resizing = useRef<{ direction: ResizeDirection; startX: number; startY: number; startWidth: number; startHeight: number; startPosX: number; startPosY: number } | null>(null);
    const offset = useRef({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    // Handle window resize
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        
        const handleResize = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                // Keep window within bounds
                const maxX = window.innerWidth - currentSize.width;
                const maxY = window.innerHeight - currentSize.height;
                setPosition(pos => ({
                    x: Math.max(0, Math.min(pos.x, maxX)),
                    y: Math.max(0, Math.min(pos.y, maxY))
                }));
            }, 100);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeout);
        };
    }, [currentSize]);

    // Dragging handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        dragging.current = true;
        setIsTransitioning(false); // Disable animation during drag
        offset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        
        // Call onDragStart to bring window to front
        if (onDragStart) {
            onDragStart();
        }
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        
        const newX = e.clientX - offset.current.x;
        const newY = e.clientY - offset.current.y;
        
        // No boundary constraints - allow dragging outside viewport
        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        dragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // Fullscreen toggle handler
    const toggleFullscreen = () => {
        setIsTransitioning(true);
        
        if (isFullscreen) {
            // Restore from fullscreen
            setPosition(preFullscreenState.position);
            setCurrentSize(preFullscreenState.size);
            setIsFullscreen(false);
        } else {
            // Save current state before going fullscreen
            setPreFullscreenState({ 
                position: position, 
                size: currentSize 
            });
            // Set fullscreen dimensions and position
            setPosition({ x: 0, y: 0 });
            setCurrentSize({ 
                width: window.innerWidth, 
                height: window.innerHeight 
            });
            setIsFullscreen(true);
            // Auto-restore from minimized state when going fullscreen
            setIsMinimized(false);
        }
        
        // End transition after animation duration
        setTimeout(() => {
            setIsTransitioning(false);
        }, 300);
    };

    // Resize handlers
    const handleResizeStart = (e: React.MouseEvent, direction: ResizeDirection) => {
        e.stopPropagation(); // Prevent dragging when resizing
        
        if (!resizable) return;
        
        setIsTransitioning(false); // Disable animation during resize
        
        resizing.current = {
            direction,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: currentSize.width,
            startHeight: currentSize.height,
            startPosX: position.x,
            startPosY: position.y
        };
        
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
        
        // Prevent text selection during resize
        document.body.style.userSelect = 'none';
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (!resizing.current) return;
        
        const { direction, startX, startY, startWidth, startHeight, startPosX, startPosY } = resizing.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startPosX;
        let newY = startPosY;
        
        // Handle resize based on direction
        switch (direction) {
            case 'e': // East (right)
                newWidth = Math.max(minSize.width, startWidth + deltaX);
                break;
            case 'w': // West (left)
                newWidth = Math.max(minSize.width, startWidth - deltaX);
                newX = startPosX + (startWidth - newWidth);
                break;
            case 's': // South (bottom)
                newHeight = Math.max(minSize.height, startHeight + deltaY);
                break;
            case 'n': // North (top)
                newHeight = Math.max(minSize.height, startHeight - deltaY);
                newY = startPosY + (startHeight - newHeight);
                break;
            case 'se': // Southeast
                newWidth = Math.max(minSize.width, startWidth + deltaX);
                newHeight = Math.max(minSize.height, startHeight + deltaY);
                break;
            case 'sw': // Southwest
                newWidth = Math.max(minSize.width, startWidth - deltaX);
                newHeight = Math.max(minSize.height, startHeight + deltaY);
                newX = startPosX + (startWidth - newWidth);
                break;
            case 'ne': // Northeast
                newWidth = Math.max(minSize.width, startWidth + deltaX);
                newHeight = Math.max(minSize.height, startHeight - deltaY);
                newY = startPosY + (startHeight - newHeight);
                break;
            case 'nw': // Northwest
                newWidth = Math.max(minSize.width, startWidth - deltaX);
                newHeight = Math.max(minSize.height, startHeight - deltaY);
                newX = startPosX + (startWidth - newWidth);
                newY = startPosY + (startHeight - newHeight);
                break;
        }
        
        // Ensure window stays within viewport bounds
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust for viewport bounds
        if (newX < 0) {
            newWidth += newX;
            newX = 0;
        }
        if (newY < 0) {
            newHeight += newY;
            newY = 0;
        }
        if (newX + newWidth > viewportWidth) {
            newWidth = viewportWidth - newX;
        }
        if (newY + newHeight > viewportHeight) {
            newHeight = viewportHeight - newY;
        }
        
        // Apply minimum size constraints again after viewport adjustments
        newWidth = Math.max(minSize.width, newWidth);
        newHeight = Math.max(minSize.height, newHeight);
        
        setCurrentSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
    };

    const handleResizeEnd = () => {
        resizing.current = null;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        
        // Re-enable text selection
        document.body.style.userSelect = '';
    };

    // Resize handle component
    const ResizeHandle = ({ direction, className }: { direction: ResizeDirection; className: string }) => (
        <div
            className={`absolute ${className} hover:bg-theme-primary/20 transition-colors duration-200`}
            onMouseDown={(e) => handleResizeStart(e, direction)}
            style={{ cursor: getCursorForDirection(direction) }}
        />
    );

    // Get cursor style for resize direction
    const getCursorForDirection = (direction: ResizeDirection): string => {
        switch (direction) {
            case 'n':
            case 's':
                return 'ns-resize';
            case 'e':
            case 'w':
                return 'ew-resize';
            case 'ne':
            case 'sw':
                return 'nesw-resize';
            case 'nw':
            case 'se':
                return 'nwse-resize';
            default:
                return 'default';
        }
    };

    return (
        <div
            ref={windowRef}
            className={`fixed bg-theme-background border-theme-border border rounded-lg shadow-theme-lg z-50 flex flex-col ${
                isTransitioning ? 'transition-all duration-300 ease-in-out' : ''
            } ${className}`}
            style={{ 
                left: position.x, 
                top: position.y,
                width: `${currentSize.width}px`,
                height: isMinimized ? 'auto' : `${currentSize.height}px`
            }}
        >
            {/* Resize handles - only show when resizable and not minimized */}
            {resizable && !isMinimized && (
                <>
                    {/* Corner handles */}
                    <ResizeHandle direction="nw" className="top-0 left-0 w-3 h-3 -mt-1 -ml-1" />
                    <ResizeHandle direction="ne" className="top-0 right-0 w-3 h-3 -mt-1 -mr-1" />
                    <ResizeHandle direction="sw" className="bottom-0 left-0 w-3 h-3 -mb-1 -ml-1" />
                    <ResizeHandle direction="se" className="bottom-0 right-0 w-3 h-3 -mb-1 -mr-1" />
                    
                    {/* Edge handles */}
                    <ResizeHandle direction="n" className="top-0 left-3 right-3 h-1 -mt-0.5" />
                    <ResizeHandle direction="s" className="bottom-0 left-3 right-3 h-1 -mb-0.5" />
                    <ResizeHandle direction="w" className="left-0 top-3 bottom-3 w-1 -ml-0.5" />
                    <ResizeHandle direction="e" className="right-0 top-3 bottom-3 w-1 -mr-0.5" />
                </>
            )}

            {/* Header - Always visible and sticky */}
            <div
                className={`bg-theme-primary text-theme-primary-foreground px-4 py-3 cursor-move flex items-center justify-between select-none flex-shrink-0 sticky top-0 z-10 ${
                    isMinimized ? 'rounded-lg' : 'rounded-t-lg'
                }`}
                onMouseDown={handleMouseDown}
            >
                <h3 className="font-semibold text-sm">{title}</h3>
                
                <div className="flex items-center gap-2">
                    {/* Minimize */}
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="w-5 h-5 rounded-full bg-theme-accent hover:bg-theme-muted flex items-center justify-center transition-colors"
                        title={isMinimized ? "Restore" : "Minimize"}
                    >
                        <svg className="w-3 h-3 text-theme-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMinimized ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            )}
                        </svg>
                    </button>
                    
                    {/* Fullscreen */}
                    <button
                        onClick={toggleFullscreen}
                        className="w-5 h-5 rounded-full bg-theme-accent hover:bg-theme-muted flex items-center justify-center transition-colors"
                        title={isFullscreen ? "Restore Size" : "Maximize"}
                    >
                        <svg className="w-3 h-3 text-theme-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isFullscreen ? (
                                // Exit fullscreen icon (overlapping squares - windowed mode)
                                <>
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2} />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </>
                            ) : (
                                // Fullscreen icon (single square)
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
                            )}
                        </svg>
                    </button>
                    
                    {/* Close */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-5 h-5 rounded-full bg-error hover:bg-red-600 flex items-center justify-center transition-colors"
                            title="Close"
                        >
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            
            {/* Content - Scrollable area */}
            {!isMinimized && (
                <div className="flex-1 overflow-y-auto p-6 bg-theme-background rounded-b-lg">
                    {children}
                </div>
            )}
        </div>
    );
};

export default DraggableWindow;
