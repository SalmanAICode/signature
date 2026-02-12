'use client';

import React, { useEffect, useState, memo } from 'react';
import { User } from '@/types/user';
import Avatar from './avatar';
import { getMe, updateDetails } from '@/lib/api/users';
import useAuthStore from '@/lib/store/auth';
import { formatPhone, formatDate, formatBirthday } from '@/lib/utils/format';

import Home from '@/svg/Home';
import Mobile from '@/svg/Mobile';
import Work from '@/svg/Work';
import Email from '@/svg/Email';
import Edit from '@/svg/Edit';
import Save from '@/svg/Save';

type UpdateUserType = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_mobile?: string;
  phone_work?: string;
  phone_home?: string;
  birthday?: string;
  address_detail?: {
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
};

function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function setValueByPath(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  if (keys.length === 1) {
    return { ...obj, [keys[0]]: value };
  }

  const [firstKey, ...restKeys] = keys;
  return {
    ...obj,
    [firstKey]: setValueByPath(obj?.[firstKey] ?? {}, restKeys.join('.'), value),
  };
}

function diffObjects(obj1: any, obj2: any): any {
  if (typeof obj1 !== 'object' || obj1 === null) {
    return obj1 !== obj2 ? obj1 : undefined;
  }
  if (typeof obj2 !== 'object' || obj2 === null) {
    return obj1;
  }
  const diff: any = {};
  let hasDiff = false;
  for (const key of Object.keys(obj1)) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (typeof val1 === 'object' && val1 !== null) {
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        diff[key] = val1;
        hasDiff = true;
      }
    } else {
      if (val1 !== val2) {
        diff[key] = val1;
        hasDiff = true;
      }
    }
  }

  return hasDiff ? diff : undefined;
}

const UserDetailRow = memo(
  ({
    label,
    value,
    type = 'text',
    editable = false,
    field,
    inUpdate,
    updateUser,
    setUpdateUser,
    setInUpdate,
  }: {
    label: string;
    value: React.ReactNode;
    type?: string;
    editable?: boolean;
    field: keyof UpdateUserType | string;
    inUpdate: boolean;
    updateUser: UpdateUserType;
    setUpdateUser: React.Dispatch<React.SetStateAction<UpdateUserType>>;
    setInUpdate: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    const [localValue, setLocalValue] = useState(() => (getValueByPath(updateUser, field) ?? '') as string);
    useEffect(() => {
      setLocalValue((getValueByPath(updateUser, field) ?? '') as string);
    }, [updateUser, field]);
    useEffect(() => {
      if (!editable || !inUpdate) return;

      // prevent update too often
      const handler = setTimeout(() => {
        setUpdateUser((prev) => setValueByPath(prev, field, localValue));
      }, 100);

      return () => clearTimeout(handler);
    }, [localValue, setUpdateUser, field, editable, inUpdate]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        setInUpdate(false);
      }
    };

    if (editable && inUpdate) {
      return (
        <div className="border-b border-gray-200 py-2 flex flex-col justify-between min-h-[60px]">
          <dt className="font-semibold">{label}</dt>
          <input
            className="bg-inherit border-blue-500 border-2 rounded-s"
            type={type}
            value={localValue}
            onChange={(e) => {
              setLocalValue(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
      );
    }

    return (
      <div className="border-b border-gray-200 py-2 flex flex-col justify-between min-h-[60px]">
        <dt className="font-semibold">{label}</dt>
        <dd className="border-2 border-transparent rounded-s"
          onDoubleClick={() => {
            if (editable) setInUpdate(true);
          }}
        >{value ?? 'N/A'}</dd>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.inUpdate === nextProps.inUpdate &&
      prevProps.value === nextProps.value &&
      prevProps.updateUser === nextProps.updateUser &&
      prevProps.field === nextProps.field
    );
  }
);


const Permissions = ({ permissions }: { permissions?: string[] }) => (
  permissions && permissions.length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {permissions.map((p, i) => (
        <span
          key={i}
          className="inline-block px-2 py-1 rounded bg-theme-accent text-theme-accent-foreground text-xs font-medium"
        >
          {p}
        </span>
      ))}
    </div>
  ) : (
    'N/A'
  )
);

export function SkeletonProfile() {
  return (
    <div className="w-full rounded-2xl mx-auto p-8 min-h-screen bg-theme-secondary text-theme-foreground flex flex-col md:flex-row md:space-x-12 animate-pulse">
      {/* Left: Skeleton Avatar and Info */}
      <div className="md:w-1/3 flex flex-col items-center space-y-6 mb-12 md:mb-0">
        <div className="w-40 h-40 rounded-full bg-theme-muted" />
        <div className="w-2/3 h-6 bg-theme-muted rounded" />
        <div className="w-1/2 h-4 bg-theme-accent rounded" />
        <div className="flex flex-col space-y-2 w-full items-center">
          <div className="w-2/3 h-4 bg-theme-muted rounded" />
          <div className="w-2/3 h-4 bg-theme-muted rounded" />
          <div className="w-2/3 h-4 bg-theme-muted rounded" />
        </div>
      </div>

      {/* Right: Skeleton Detail Blocks */}
      <div className="md:w-2/3 flex flex-col space-y-8">
        <div className="bg-theme-background rounded-lg shadow-theme-md p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="w-32 h-6 bg-theme-muted rounded" />
            <div className="w-20 h-6 bg-theme-muted rounded" />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {Array.from({ length: 18 }).map((_, idx) => (
              <div key={idx} className="w-full h-4 bg-theme-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { accessToken } = useAuthStore();

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [inUpdate, setInUpdate] = useState(false);
  const [inSaved, setInSaved] = useState(false);

  const [updateUser, setUpdateUser] = useState<UpdateUserType>({
    first_name: undefined,
    last_name: undefined,
    email: undefined,
    phone_mobile: undefined,
    phone_work: undefined,
    phone_home: undefined,
    birthday: undefined,
    address_detail: undefined,
  });

  useEffect(() => {
    setLoading(true);
    const fetchUser = async () => {
      try {
        const response = await getMe();
        setUser(response.data as User);
      } catch (error) {
        setError('Failed to load user details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchUser();
    }
  }, [accessToken]);

  useEffect(() => {
    if (inUpdate && user && !inSaved) {
      setUpdateUser({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_mobile: user.phone_mobile,
        phone_work: user.phone_work,
        phone_home: user.phone_home,
        birthday: user.birthday,
        address_detail: user.address_detail
          ? {
            address_1: user.address_detail.address_1,
            address_2: user.address_detail.address_2,
            city: user.address_detail.city,
            state: user.address_detail.state,
            zip: user.address_detail.zip,
          }
          : undefined,
      });
    } else if (!inUpdate && user && !inSaved) {
      const diff = diffObjects(updateUser, user);
      if (diff) {
        setInSaved(true);
        updateDetails(diff)
          .then((response) => {
            setUser(response.data as User);
            setInSaved(false);
          })
          .catch((error) => {
            console.error(error);
            setInSaved(false);
          });
      }
    }
  }, [inUpdate]);

  if (loading) {
    return (
      <SkeletonProfile />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl mx-auto p-8 min-h-screen bg-theme-secondary text-theme-foreground flex flex-col md:flex-row md:space-x-12">
      {/* Left: Basic Info */}
      <div className="md:w-1/3 flex flex-col items-center space-y-6 mb-12 md:mb-0">
        <Avatar
          firstName={user.first_name || ''}
          lastName={user.last_name || ''}
          size={160}
        />
        <h1 className="text-3xl font-bold text-center">
          {user.first_name} {user.last_name}
        </h1>
        <p className="text-theme-primary font-medium text-center flex items-center gap-2">
          <Email />
          {user.email}
        </p>
        <div className="flex flex-col space-y-2 text-theme-muted text-sm md:text-base text-center">
          {user.phone_mobile && (
            <p className="flex items-center gap-2">
              <Mobile />
              Mobile: {formatPhone(user.phone_mobile)}
            </p>
          )}
          {user.phone_work && (
            <p className="flex items-center gap-2">
              <Work />
              Work: {formatPhone(user.phone_work)}
            </p>
          )}
          {user.phone_home && (
            <p className="flex items-center gap-2">
              <Home />
              Home: {formatPhone(user.phone_home)}
            </p>
          )}
        </div>
      </div>

      {/* Right: Detailed Info */}
      <div className="md:w-2/3 flex flex-col space-y-8">
        <div className="bg-theme-background border-4 border-theme-primary rounded-lg p-6 h-full shadow-theme-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold mb-1 border-b border-theme-border pb-1">
              Details
            </h2>

            {!inUpdate && !inSaved && (
              <div className="cursor-pointer flex items-center gap-2" onClick={() => setInUpdate(true)}>
                <Edit className="w-5 h-5" />
                <button className="text-lg font-medium">Edit</button>
              </div>
            )}
            {inUpdate && !inSaved && (
              <div className="cursor-pointer flex items-center gap-2" onClick={() => setInUpdate(false)}>
                <Save className="w-5 h-5" />
                <button className="text-lg font-medium">Save</button>
              </div>
            )}
            {inSaved && (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span className="text-lg font-medium">Saving...</span>
              </div>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:text-base">
            <UserDetailRow
              label="First Name"
              value={user.first_name}
              editable={true}
              field="first_name"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Last Name"
              value={user.last_name}
              editable={true}
              field="last_name"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Email"
              value={user.email}
              editable={true}
              field="email"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Phone Mobile"
              value={user.phone_mobile}
              editable={true}
              field="phone_mobile"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Phone Work"
              value={user.phone_work}
              editable={true}
              field="phone_work"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Phone Home"
              value={user.phone_home}
              editable={true}
              field="phone_home"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Birthday"
              value={user.birthday && formatBirthday(user.birthday)}
              type="date"
              editable={true}
              field="birthday"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="User Type"
              value={
                { funder_manager: 'Manager', funder_user: 'User' }[user.type] || user.type || 'Manager'
              }
              editable={false}
              field="type"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Permissions"
              value={<Permissions permissions={user.permission_list} />}
              editable={false}
              field="permission_list"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Created At"
              value={formatDate(user.createdAt || user.created_date)}
              editable={false}
              field="created_date"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Updated At"
              value={formatDate(user.updatedAt || user.updated_date)}
              editable={false}
              field="updated_date"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Last Login"
              value={user.last_login ? formatDate(user.last_login) : 'Never Logged In'}
              editable={false}
              field="last_login"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Status"
              value={
                user.online ? (
                  <span className="text-green-600 font-semibold">Online</span>
                ) : user.inactive ? (
                  <span className="text-red-600 font-semibold">Inactive</span>
                ) : (
                  'Offline'
                )
              }
              editable={false}
              field="online"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Address 1"
              value={user.address_detail?.address_1}
              editable={true}
              field="address_detail.address_1"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Address 2"
              value={user.address_detail?.address_2}
              editable={true}
              field="address_detail.address_2"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="City"
              value={user.address_detail?.city}
              editable={true}
              field="address_detail.city"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="State"
              value={user.address_detail?.state}
              editable={true}
              field="address_detail.state"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Zip"
              value={user.address_detail?.zip}
              editable={true}
              field="address_detail.zip"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
            <UserDetailRow
              label="Funder Count"
              value={user.funder_count}
              editable={false}
              field="funder_count"
              inUpdate={inUpdate}
              updateUser={updateUser}
              setUpdateUser={setUpdateUser}
              setInUpdate={setInUpdate}
            />
          </dl>
        </div>
      </div>
    </div>
  );
}
