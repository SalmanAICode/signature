'use client';

import { formatDate, formatPhone, formatAddress, getUserTypeLabel } from '@/lib/utils/format';
import { useFunderUsers } from '@/hooks/useFunderUsers';

const UserSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

interface FunderUsersTabProps {
  funderId: string;
}

export default function FunderUsersTab({ funderId }: FunderUsersTabProps) {
  const { users, loading, error } = useFunderUsers(funderId);

  if (loading) return <UserSkeleton />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-red-800 font-semibold">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-300px)] overflow-y-auto">
        {users.length === 0 ? (
          <p className="text-gray-500">No users associated with this funder.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((user) => (
              <div key={user._id} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{user.first_name} {user.last_name}</h3>
                <div className="space-y-2">
                  <p>
                    <span className="text-gray-500">Email:</span>{' '}
                    <span className="font-medium">{user.email}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">User Type:</span>{' '}
                    <span className="font-medium">{getUserTypeLabel(user.type)}</span>
                  </p>
                  {user.phone_mobile && (
                    <p>
                      <span className="text-gray-500">Mobile Phone:</span>{' '}
                      <span className="font-medium">{formatPhone(user.phone_mobile)}</span>
                    </p>
                  )}
                  {user.phone_work && (
                    <p>
                      <span className="text-gray-500">Work Phone:</span>{' '}
                      <span className="font-medium">{formatPhone(user.phone_work)}</span>
                    </p>
                  )}
                  {user.phone_home && (
                    <p>
                      <span className="text-gray-500">Home Phone:</span>{' '}
                      <span className="font-medium">{formatPhone(user.phone_home)}</span>
                    </p>
                  )}
                  {user.birthday && (
                    <p>
                      <span className="text-gray-500">Birthday:</span>{' '}
                      <span className="font-medium">{formatDate(user.birthday)}</span>
                    </p>
                  )}
                  {user.address_detail && (
                    <p>
                      <span className="text-gray-500">Address:</span>{' '}
                      <span className="font-medium">
                        {formatAddress(user.address_detail)}
                      </span>
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium">
                        {user.inactive ? (
                          <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">Inactive</span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Active</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Online</p>
                      <p className="font-medium">
                        {user.online ? (
                          <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Online</span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold">Offline</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Funders</p>
                      <p className="font-medium">{user.funder_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="font-medium text-xs">{user.last_login ? formatDate(user.last_login) : 'Never'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Created: {formatDate(user.created_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 