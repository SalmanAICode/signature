import React, { useEffect, useState } from 'react';
import { getUserList } from '@/lib/api/users';
import { getLenderUserList, addLenderUser, removeLenderUser } from '@/lib/api/lenderUsers';
import { User } from '@/types/user';
import Select from 'react-select';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface EditLenderUsersModalProps {
  lenderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedUsers: User[]) => void;
  onUserChange?: () => void;
  currentUsers: User[];
}

const EditLenderUsersModal: React.FC<EditLenderUsersModalProps> = ({ lenderId, isOpen, onClose, onSuccess, onUserChange, currentUsers }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersError('');
      try {
        const usersData = await getUserList({ include_inactive: false });
        setUsers(usersData || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setUsersError('Failed to fetch users');
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Initialize selectedUsers when modal opens or currentUsers changes
  useEffect(() => {
    if (isOpen && currentUsers) {
      setSelectedUsers(currentUsers.map((u: User) => ({ value: u._id, label: `${u.first_name} ${u.last_name}` })));
    }
  }, [isOpen, currentUsers]);

  const handleSave = async () => {
    // Validate that at least one user is selected
    if (selectedUsers.length === 0) {
      setError('At least one user must be selected');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Find users to add and remove
      const originalIds = currentUsers.map(u => u._id);
      const newIds = selectedUsers.map(u => u.value);
      const toAdd = newIds.filter(id => !originalIds.includes(id));
      const toRemove = originalIds.filter(id => !newIds.includes(id));
      
      // Add new users
      for (const userId of toAdd) {
        await addLenderUser(lenderId, userId);
      }
      
      // Remove unselected users
      for (const userId of toRemove) {
        await removeLenderUser(lenderId, userId);
      }
      
      // Get the updated users list based on selections
      const updatedUsers = users.filter(u => selectedUsers.some(su => su.value === u._id));
      
      if (onSuccess) onSuccess(updatedUsers);
      if (onUserChange) onUserChange();
      onClose();
    } catch (err: any) {
      setError('Failed to update users');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-4 flex items-center justify-center gap-2">
          <PencilSquareIcon className="h-5 w-5 text-blue-600" />
          Edit Assigned Users
        </h2>
        <div className="mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Current Users</h3>
            <p className="text-xs text-blue-600 mb-2">This lender is already assigned to:</p>
            {loading ? (
              <p className="text-xs text-blue-600">Loading...</p>
            ) : currentUsers.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-blue-700">
                {currentUsers.map(u => (
                  <li key={u._id}>{u.first_name} {u.last_name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-blue-600">No users assigned</p>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Manage Users <span className="text-red-500">*</span>
          </label>
          <Select
            isMulti
            options={(users || []).map(u => ({ value: u._id, label: `${u.first_name} ${u.last_name}` }))}
            value={selectedUsers}
            onChange={val => setSelectedUsers(Array.isArray(val) ? [...val] : [])}
            isLoading={usersLoading}
            placeholder="Select users..."
            classNamePrefix="select"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
            styles={{
              input: base => ({ ...base, fontSize: '0.875rem' }),
              option: base => ({ ...base, fontSize: '0.875rem' }),
              singleValue: base => ({ ...base, fontSize: '0.875rem' }),
              multiValueLabel: base => ({ ...base, fontSize: '0.875rem' }),
              menuPortal: base => ({ ...base, zIndex: 9999 }),
            }}
          />
          {usersError && <div className="text-xs text-red-500 mt-1">{usersError}</div>}
          {selectedUsers.length === 0 && (
            <div className="text-xs text-gray-500 mt-1">At least one user is required</div>
          )}
        </div>
        {error && <div className="text-xs text-red-500 mb-2">{error}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedUsers.length === 0 || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={handleSave}
            disabled={selectedUsers.length === 0 || loading}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLenderUsersModal; 