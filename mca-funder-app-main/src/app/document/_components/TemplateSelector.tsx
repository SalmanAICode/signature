'use client';

import { useState } from 'react';
import Select from 'react-select';
import { TemplatePreviewModal } from './TemplatePreviewModal';

export interface Template {
  id: string;
  name: string;
  file: string;
}

const PREDEFINED_TEMPLATES: Template[] = [
  {
    id: 'sale-of-future-receipts',
    name: 'Sale of Future Receipts (Classic)',
    file: 'sale-of-future-receipts.hbs'
  },
  {
    id: 'sale-of-future-receipts-modern',
    name: 'Sale of Future Receipts (Modern)',
    file: 'sale-of-future-receipts-modern.hbs'
  },
  {
    id: 'sale-of-future-receipts-compact',
    name: 'Sale of Future Receipts (Compact)',
    file: 'sale-of-future-receipts-compact.hbs'
  },
  {
    id: 'sale-of-future-receipts-formal',
    name: 'Sale of Future Receipts (Formal)',
    file: 'sale-of-future-receipts-formal.hbs'
  }
];

interface TemplateSelectorProps {
  onTemplateSelect?: (template: Template) => void;
  onDocumentCreated?: () => void;
}

export function TemplateSelector({ onTemplateSelect, onDocumentCreated }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const templateOptions = PREDEFINED_TEMPLATES.map(template => ({
    value: template.id,
    label: template.name,
    template: template
  }));

  const handleTemplateChange = (option: any) => {
    if (option) {
      setSelectedTemplate(option.template);
      setShowPreviewModal(true);
      if (onTemplateSelect) {
        onTemplateSelect(option.template);
      }
    } else {
      setSelectedTemplate(null);
    }
  };

  const handleCloseModal = () => {
    setShowPreviewModal(false);
    // Don't reset selectedTemplate here - let user keep selection
  };

  return (
    <>
      <div className="min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Template
        </label>
        <Select
          options={templateOptions}
          value={selectedTemplate ? {
            value: selectedTemplate.id,
            label: selectedTemplate.name,
            template: selectedTemplate
          } : null}
          onChange={handleTemplateChange}
          placeholder="Choose a template..."
          className="text-sm"
          classNamePrefix="select"
          isClearable
          isSearchable={false}
          menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
          menuPosition="fixed"
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
        />
      </div>

      {selectedTemplate && (
        <TemplatePreviewModal
          isOpen={showPreviewModal}
          onClose={handleCloseModal}
          template={selectedTemplate}
          onDocumentCreated={onDocumentCreated}
        />
      )}
    </>
  );
}
