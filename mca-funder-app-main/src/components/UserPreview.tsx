// components/EntityPreview.tsx
import { formatPhone } from "@/lib/utils/format";
import { EnvelopeIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { DevicePhoneMobileIcon as SolidPhoneIcon, EnvelopeIcon as SolidEnvelopeIcon } from "@heroicons/react/24/solid";
import { User } from "@/types/user";

type UserPreviewProps = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_mobile?: string;
  summary?: boolean;
};

export default function UserPreview({ first_name, last_name, email, phone_mobile, summary = false }: UserPreviewProps) {
  if (!summary) {
    return (
      <div className="flex flex-col text-sm leading-snug">
        <span>
          {first_name} {last_name}
        </span>
        {email && (
          <span className="text-gray-500 text-xs flex items-center gap-1"> <EnvelopeIcon className="w-4 h-4" /> {email}</span>
        )}
        {phone_mobile && <span className="text-gray-500 text-xs flex items-center gap-1"><DevicePhoneMobileIcon className="w-4 h-4" /> {formatPhone(phone_mobile)}</span>}
      </div>
    );
  }
  return (
    <div className="flex flex-col text-md leading-snug">
      <span>
        {first_name} {last_name}
      </span>
      {email && (
        <span className="text-gray-500 font-medium text-sm flex items-center gap-1"> <SolidEnvelopeIcon className="w-4 h-4" /> {email}</span>
      )}
      {phone_mobile && <span className="text-gray-500 font-medium text-sm flex items-center gap-1"><SolidPhoneIcon className="w-4 h-4" /> {formatPhone(phone_mobile)}</span>}
    </div>
  );
}

type UserPreviewSummaryProps = {
  user: User;
  summary?: boolean;
};

export function UserPreviewSummary({ user }: UserPreviewSummaryProps) { 
  if (!user) {
    return '-';
  }
  return <UserPreview first_name={user.first_name} last_name={user.last_name} email={user.email} phone_mobile={user.phone_mobile} summary={true} />;
}


export const renderUser = (value: string, row?: any, summary?: boolean) => {
  let entity: any = value;

  if (typeof value === "string") {
    try {
      entity = JSON.parse(value);
    } catch {
      return '-';
    }
  }

  if (!entity || typeof entity !== "object" || Array.isArray(entity)) {
    return '-';
  }

  const { first_name, last_name, email, phone_mobile } = entity;
  return <UserPreview first_name={first_name} last_name={last_name} email={email} phone_mobile={phone_mobile} />;
}