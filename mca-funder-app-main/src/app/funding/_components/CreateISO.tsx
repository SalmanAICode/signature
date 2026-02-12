import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Formula, CreateFormulaData } from '@/types/formula';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid';

// Define a subset of CreateFormulaData for the new formula form
type NewFormulaData = Omit<CreateFormulaData, 'funder'>;
interface CreateISOProps {
  open: boolean;
  initialName: string;
  onCancel: () => void;
  onCreate: (data: {
    name: string;
    email: string;
    phone: string;
    formula_id: string | null; // 'new', 'default', or an existing ID
    new_formula_data?: NewFormulaData;
  }) => Promise<void>;
  formulas?: Formula[];
}
const initialNewFormulaState: NewFormulaData = {
  name: '',
  calculate_type: 'PERCENT',
  base_item: 'FUND',
  tier_type: 'NONE',
  tier_list: [],
  shared: false,
};

const CreateISO: React.FC<CreateISOProps> = ({ open, initialName, onCancel, onCreate, formulas }) => {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formulaId, setFormulaId] = useState<string | null>('default');
  const [newFormula, setNewFormula] = useState<NewFormulaData>(initialNewFormulaState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setEmail('');
      setPhone('');
      setFormulaId('default');
      setNewFormula(initialNewFormulaState);
      setError('');
      setLoading(false);
    }
  }, [open, initialName]);

  if (!open) return null;

  const handleNewFormulaChange = (field: keyof NewFormulaData, value: any) => {
    setNewFormula(prev => ({ ...prev, [field]: value }));
  };

  const handleTierChange = (index: number, field: keyof NewFormulaData['tier_list'][0], value: any) => {
    const updatedTiers = [...newFormula.tier_list];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    handleNewFormulaChange('tier_list', updatedTiers);
  };

  const addTier = () => {
    const newTier = { min_number: null, max_number: null, amount: null, percent: null };
    handleNewFormulaChange('tier_list', [...newFormula.tier_list, newTier]);
  };

  const removeTier = (index: number) => {
    const updatedTiers = newFormula.tier_list.filter((_, i) => i !== index);
    handleNewFormulaChange('tier_list', updatedTiers);
  };

  const formulaOptions = [
    { value: 'default', label: 'Default' },
    { value: 'new', label: 'Create New Formula...' },
    ...(formulas || []).map(f => ({ value: f._id, label: f.name })),
  ];
  const calculateTypeOptions = [{ value: 'PERCENT', label: 'Percent' }, { value: 'AMOUNT', label: 'Amount' }];
  const baseItemOptions = [{ value: 'NONE', label: 'None' }, { value: 'FUND', label: 'Fund' }, { value: 'PAYBACK', label: 'Payback' }];
  const tierTypeOptions = [{ value: 'NONE', label: 'None' }, { value: 'FACTOR_RATE', label: 'Factor Rate' }, { value: 'FUND', label: 'Fund' }, { value: 'PAYBACK', label: 'Payback' }];

  const portalStyles = {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-30">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-2">Create ISO</h2>
        
        {/* ISO Details */}
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
          <input type="text" className="w-full border rounded px-2 py-1" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Email (optional)</label>
          <input type="email" className="w-full border rounded px-2 py-1" placeholder="iso@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Phone (optional)</label>
          <input type="text" className="w-full border rounded px-2 py-1" placeholder="(555) 123-4567" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        {/* Commission Formula */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Commission Formula</label>
          <Select 
            options={formulaOptions} 
            value={formulaOptions.find(opt => opt.value === formulaId)} 
            onChange={option => setFormulaId((option as { value: string } | null)?.value || null)}
            menuPortalTarget={document.body}
            styles={portalStyles}
          />
        </div>
        
        {/* New Formula Form */}
        {formulaId === 'new' && (
          <div className="p-4 border rounded-md bg-gray-50 mb-4 space-y-4">
            <h3 className="text-md font-semibold mb-2">New Commission Formula</h3>
            <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Formula Name *</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={newFormula.name} onChange={e => handleNewFormulaChange('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Calculate Type *</label>
                    <Select 
                        options={calculateTypeOptions} 
                        value={calculateTypeOptions.find(o => o.value === newFormula.calculate_type)} 
                        onChange={opt => handleNewFormulaChange('calculate_type', (opt as any)?.value)} 
                        menuPortalTarget={document.body}
                        styles={portalStyles}
                    />
                </div>
                {newFormula.calculate_type === 'PERCENT' && (
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Base Item *</label>
                        <Select 
                            options={baseItemOptions} 
                            value={baseItemOptions.find(o => o.value === newFormula.base_item)} 
                            onChange={opt => handleNewFormulaChange('base_item', (opt as any)?.value)}
                            menuPortalTarget={document.body}
                            styles={portalStyles}
                        />
                    </div>
                )}
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tier Type</label>
                <Select 
                    options={tierTypeOptions} 
                    value={tierTypeOptions.find(o => o.value === newFormula.tier_type)} 
                    onChange={opt => handleNewFormulaChange('tier_type', (opt as any)?.value)}
                    menuPortalTarget={document.body}
                    styles={portalStyles}
                />
            </div>

            {newFormula.tier_type !== 'NONE' && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Tiers</h4>
                    {newFormula.tier_list.length > 0 && (
                        <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-3"><label className="text-xs font-medium text-gray-500">Min</label></div>
                            <div className="col-span-3"><label className="text-xs font-medium text-gray-500">Max</label></div>
                            <div className="col-span-4">
                                <label className="text-xs font-medium text-gray-500">
                                    {newFormula.calculate_type === 'PERCENT' ? 'Percent' : 'Amount'}
                                </label>
                            </div>
                            <div className="col-span-2"></div>
                        </div>
                    )}
                    {newFormula.tier_list.map((tier, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-3"><input type="number" placeholder="min_number" value={tier.min_number ?? ''} onChange={e => {
                                const val = parseFloat(e.target.value);
                                handleTierChange(index, 'min_number', isNaN(val) ? null : val);
                            }} className="w-full border rounded px-2 py-1" /></div>
                            <div className="col-span-3"><input type="number" placeholder="max_number" value={tier.max_number ?? ''} onChange={e => {
                                const val = parseFloat(e.target.value);
                                handleTierChange(index, 'max_number', isNaN(val) ? null : val);
                            }} className="w-full border rounded px-2 py-1" /></div>
                            {newFormula.calculate_type === 'PERCENT' ? (
                                <div className="col-span-4"><input type="number" placeholder="percent" value={tier.percent ?? ''} onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    handleTierChange(index, 'percent', isNaN(val) ? null : val);
                                }} className="w-full border rounded px-2 py-1" /></div>
                            ) : (
                                <div className="col-span-4"><input type="number" placeholder="amount" value={tier.amount ?? ''} onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    handleTierChange(index, 'amount', isNaN(val) ? null : val);
                                }} className="w-full border rounded px-2 py-1" /></div>
                            )}
                            <div className="col-span-2">
                                <button type="button" onClick={() => removeTier(index)} className="p-1 text-red-500 hover:text-red-700"><XMarkIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addTier} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"><PlusIcon className="w-4 h-4" /> Add Tier</button>
                </div>
            )}
            <div className="flex items-center">
                <input type="checkbox" id="shared-formula" checked={newFormula.shared} onChange={e => handleNewFormulaChange('shared', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="shared-formula" className="ml-2 block text-sm text-gray-900">Shared Formula</label>
            </div>
          </div>
        )}
        
        {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
        <div className="flex gap-2 justify-end mt-4">
          <button className="px-3 py-1 rounded bg-gray-200" onClick={onCancel} disabled={loading}>Cancel</button>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white"
            disabled={loading}
            onClick={async () => {
              if (!name.trim()) {
                setError('ISO name is required.');
                return;
              }
              if (formulaId === 'new') {
                  if(!newFormula.name.trim()) {
                    setError('New formula name is required.');
                    return;
                  }
                  if(newFormula.calculate_type === 'PERCENT' && !newFormula.base_item) {
                    setError('Base item is required for percent-based formulas.');
                    return;
                  }
              }
              setError('');
              setLoading(true);
              try {
                await onCreate({
                  name: name.trim(),
                  email,
                  phone,
                  formula_id: formulaId,
                  new_formula_data: formulaId === 'new' ? newFormula : undefined,
                });
              } catch (err) {
                setError('Failed to create ISO.');
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateISO; 