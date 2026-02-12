'use client';

import React, { useEffect } from 'react';
import useModalStore, { Modal, BringToFrontPriority } from '@/lib/store/modal';
import DraggableWindow, { calculateModalPosition } from '@/components/DraggableWindow';

// Generic fallback content for modals
function GenericDetailContent({ modalData }: { modalData: any }) {
    return (
        <div className="space-y-4">
            <p className="text-theme-foreground">
                Generic modal content
            </p>
            <div className="text-sm text-theme-muted-foreground">
                <p>ID: {modalData.data?._id || modalData.data?.id || 'N/A'}</p>
                <p>Name: {modalData.data?.name || 'N/A'}</p>
            </div>
        </div>
    );
}

// Modal renderer for any modal type
function ModalRenderer({ modal, allModals }: { modal: Modal; allModals: Modal[] }) {
    const closeModal = useModalStore(state => state.closeModal);
    const bringToFront = useModalStore(state => state.bringToFront);
    const ContentComponent = modal.component || GenericDetailContent;
    
    // Calculate smart position using existing modal positions
    const existingPositions = allModals
        .filter(m => m.key !== modal.key)
        .map(m => m.position);
    const smartPosition = calculateModalPosition(existingPositions);
    
    return (
        <div 
            onClick={() => bringToFront(modal.key, BringToFrontPriority.CLICK)}
            style={{ zIndex: modal.zIndex }}
            className="fixed"
        >
            <DraggableWindow
                title={modal.title}
                onClose={() => closeModal(modal.key)}
                width={modal.width}
                height={modal.height}
                className={modal.className}
                initialPosition={smartPosition}
                onDragStart={() => bringToFront(modal.key, BringToFrontPriority.DRAG)}
            >
                <ContentComponent modalData={modal} />
            </DraggableWindow>
        </div>
    );
}

export default function ModalProvider({ children }: { children: React.ReactNode }) {
    const modals = useModalStore(state => state.modals);
    const updateAllModalSizes = useModalStore(state => state.updateAllModalSizes);

    // Handle window resize
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        
        const handleResize = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => updateAllModalSizes(), 100);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeout);
        };
    }, [updateAllModalSizes]);

    return (
        <>
            {children}
            {modals.map((modal) => (
                <ModalRenderer key={modal.key} modal={modal} allModals={modals} />
            ))}
        </>
    );
}

 