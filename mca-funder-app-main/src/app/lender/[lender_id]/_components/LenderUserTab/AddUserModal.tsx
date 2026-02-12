import React, { useEffect, useState } from 'react';
import { getUserList } from '@/lib/api/users';
import { User } from '@/types/user';
import Select from 'react-select';
import { PlusIcon } from '@heroicons/react/24/outline';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (userId: string) => void;
  currentUsers: User[];
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onCreate, currentUsers }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [error, setError] = useState('');

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersError('');
      try {
        const usersData = await getUserList({});
        // Filter out users that are already assigned to this lender
        const availableUsers = usersData.filter((user: User) => 
          !currentUsers.some(current => current._id === user._id)
        );
        setUsers(availableUsers || []);
      } catch (err) {
        setUsersError('Failed to fetch users');
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, currentUsers]);

  // Reset selected user when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUser(null);
      setError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!selectedUser) {
      setError('Please select a user to add');
      return;
    }
    onCreate(selectedUser.value);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-4 flex items-center justify-center gap-2">
          <PlusIcon className="h-5 w-5 text-green-600" />
          Add User
        </h2>
        
        <div className="mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Current Users</h3>
            <p className="text-xs text-blue-600 mb-2">This lender currently has:</p>
            {currentUsers.length > 0 ? (
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
            Select User to Add <span className="text-red-500">*</span>
          </label>
          <Select
            isClearable
            options={(users || []).map(u => ({ 
              value: u._id, 
              label: `${u.first_name} ${u.last_name} (${u.email})` 
            }))}
            value={selectedUser}
            onChange={val => setSelectedUser(val)}
            isLoading={usersLoading}
            placeholder="Select a user to add..."
            classNamePrefix="select"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
            styles={{
              input: base => ({ ...base, fontSize: '0.875rem' }),
              option: base => ({ ...base, fontSize: '0.875rem' }),
              singleValue: base => ({ ...base, fontSize: '0.875rem' }),
              menuPortal: base => ({ ...base, zIndex: 9999 }),
            }}
          />
          {usersError && <div className="text-xs text-red-500 mt-1">{usersError}</div>}
          {users.length === 0 && !usersLoading && (
            <div className="text-xs text-gray-500 mt-1">No available users to add</div>
          )}
        </div>
        
        {error && <div className="text-xs text-red-500 mb-2">{error}</div>}
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-300 hover:text-gray-800 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              !selectedUser
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            onClick={handleSave}
            disabled={!selectedUser}
          >
            Add User
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal; 