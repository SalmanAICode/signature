import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { User } from '@/types/user'; // Assuming you have a User type

interface CreateMerchantProps {
  open: boolean;
  initialName: string;
  onCancel: () => void;
  onCreate: (merchant: {
    name: string;
    email: string;
    phone: string;
    assigned_manager?: string;
    assigned_user?: string;
  }) => Promise<void>;
  users: User[]; // Pass the user list as a prop
}

const CreateMerchant: React.FC<CreateMerchantProps> = ({ open, initialName, onCancel, onCreate, users }) => {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedManager, setAssignedManager] = useState<string | undefined>(undefined);
  const [assignedUser, setAssignedUser] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setEmail('');
      setPhone('');
      setAssignedManager(undefined);
      setAssignedUser(undefined);
      setError('');
      setLoading(false);
    }
  }, [open, initialName]);

  if (!open) return null;

  const userOptions = users.map(user => ({
    value: user._id,
    label: `${user.first_name} ${user.last_name}`
  }));

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-2">Create Merchant</h2>
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1 mb-2"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Email (optional)</label>
          <input
            type="email"
            className="w-full border rounded px-2 py-1 mb-2"
            placeholder="merchant@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Phone (optional)</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1 mb-2"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>
        <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Manager (optional)</label>
            <Select
                options={userOptions}
                onChange={option => setAssignedManager((option as { value: string } | null)?.value)}
                isClearable
                placeholder="Select a manager"
            />
        </div>
        <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Assigned User (optional)</label>
            <Select
                options={userOptions}
                onChange={option => setAssignedUser((option as { value: string } | null)?.value)}
                isClearable
                placeholder="Select a user"
            />
        </div>
        {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button
            className="px-3 py-1 rounded bg-gray-200"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white"
            disabled={loading}
            onClick={async () => {
              if (!name.trim()) {
                setError('Merchant name is required.');
                return;
              }
              setError('');
              setLoading(true);
              try {
                await onCreate({
                  name: name.trim(),
                  email,
                  phone,
                  assigned_manager: assignedManager,
                  assigned_user: assignedUser,
                });
              } catch (err) {
                setError('Failed to create merchant');
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

export default CreateMerchant; 