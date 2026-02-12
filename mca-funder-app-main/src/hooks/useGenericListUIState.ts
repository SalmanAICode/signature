import { useState } from 'react';

export function useGenericListUIState() {
  // Control panel states
  const [showControls, setShowControls] = useState(false);
  const [showUnselectedColumns, setShowUnselectedColumns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Row interaction states
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [preSelectedRow, setPreSelectedRow] = useState<number | null>(null);

  // Row interaction handlers
  const toggleExpandedRow = (index: number) => {
    setExpandedRow(prev => (prev === index ? null : index));
  };

  const toggleRowModal = (index: number) => {
    setSelectedRow(index);
    setPreSelectedRow(index);
  };

  const handleRowClick = (rowIdx: number, rowModalEnabled: boolean) => {
    if (rowModalEnabled) {
      toggleRowModal(rowIdx);
    }
  };

  // UI control handlers
  const toggleControls = () => {
    setShowControls(prev => {
      if (!prev) setShowFilters(false); // Close filters when opening controls
      return !prev;
    });
  };

  const toggleFilters = () => {
    setShowFilters(prev => {
      if (!prev) setShowControls(false); // Close controls when opening filters
      return !prev;
    });
  };

  const closeModal = () => {
    setSelectedRow(null);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
  };

  return {
    // States
    showControls,
    showUnselectedColumns,
    showFilters,
    showExportModal,
    expandedRow,
    selectedRow,
    preSelectedRow,

    // Setters
    setShowControls,
    setShowUnselectedColumns,
    setShowFilters,
    setShowExportModal,
    setExpandedRow,
    setSelectedRow,
    setPreSelectedRow,

    // Handlers
    toggleExpandedRow,
    toggleRowModal,
    handleRowClick,
    toggleControls,
    toggleFilters,
    closeModal,
    closeExportModal,
  };
} 