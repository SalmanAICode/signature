// components/EntityPreview.tsx
import { formatPhone } from "@/lib/utils/format";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { EnvelopeIcon as SolidEnvelopeIcon, PhoneIcon as SolidPhoneIcon } from "@heroicons/react/24/solid";
import { Entity } from "@/types/entity";

type EntityPreviewProps = {
  name?: string;
  email?: string;
  phone?: string;
  summary?: boolean;
};

export default function EntityPreview({ name, email, phone, summary = false }: EntityPreviewProps) {
  if (!summary) {
    return (
      <div className="flex flex-col text-sm leading-snug">
        <span>
          {name}
        </span>
        {email && (
          <span className="text-gray-500 text-xs flex items-center gap-1"> <EnvelopeIcon className="w-4 h-4" /> {email}</span>
        )}
       {phone && <span className="text-xs flex items-center gap-1"><PhoneIcon className="w-4 h-4 stroke-red-600" /> {formatPhone(phone)}</span>}
      </div>
    );
  }
  return (
    <div className="flex flex-col text-md leading-snug">
      <span>{name}</span>
      {email && (
        <span className="text-gray-500 font-medium text-sm flex items-center gap-1"> <SolidEnvelopeIcon className="w-4 h-4" /> {email}</span>
      )}
      {phone && <span className="text-gray-500 font-medium text-sm flex items-center gap-1"><SolidPhoneIcon className="w-4 h-4" /> {formatPhone(phone)}</span>}
    </div>
  );
}

type EntityPreviewSummaryProps = {
  entity: Entity | null | undefined;
  summary?: boolean;
};

export function EntityPreviewSummary({ entity }: EntityPreviewSummaryProps) {
  if (!entity) {
    return '-';
  }
  return <EntityPreview name={entity.name} email={entity.email} phone={entity.phone} summary={true} />;
}

export const renderEntity = (value: string, row?: any) => {
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

  const { name, email, phone } = entity;
  return <EntityPreview name={name} email={email} phone={phone} />;
}