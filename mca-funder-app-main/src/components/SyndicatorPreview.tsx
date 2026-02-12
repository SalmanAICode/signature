import { formatPhone } from "@/lib/utils/format";
import { EnvelopeIcon, DevicePhoneMobileIcon, PhoneIcon, HomeIcon } from "@heroicons/react/24/outline";
import { DevicePhoneMobileIcon as SolidPhoneIcon, EnvelopeIcon as SolidEnvelopeIcon, PhoneIcon as SolidWorkPhoneIcon, HomeIcon as SolidHomeIcon } from "@heroicons/react/24/solid";
import { Syndicator } from "@/types/syndicator";

// SyndicatorPreview Props
export type SyndicatorPreviewProps = {
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_mobile?: string;
  phone_work?: string;
  phone_home?: string;
  summary?: boolean;
};

export default function SyndicatorPreview({ name, first_name, last_name, email, phone_mobile, phone_work, phone_home, summary = false }: SyndicatorPreviewProps) {
  if (!summary) {
    return (
      <div className="flex flex-col text-sm leading-snug">
        <span>
          {`${name} (${first_name} ${last_name})`}
        </span>
        {email && (
          <span className="text-gray-500 text-xs flex items-center gap-1"> <EnvelopeIcon className="w-4 h-4" /> {email}</span>
        )}
        {phone_mobile && <span className="text-gray-500 text-xs flex items-center gap-1"><DevicePhoneMobileIcon className="w-4 h-4" /> {formatPhone(phone_mobile)}</span>}
        {phone_work && <span className="text-gray-500 text-xs flex items-center gap-1"><PhoneIcon className="w-4 h-4" /> {formatPhone(phone_work)}</span>}
        {phone_home && <span className="text-gray-500 text-xs flex items-center gap-1"><HomeIcon className="w-4 h-4" /> {formatPhone(phone_home)}</span>}
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
      {phone_work && <span className="text-gray-500 font-medium text-sm flex items-center gap-1"><SolidWorkPhoneIcon className="w-4 h-4" /> {formatPhone(phone_work)}</span>}
      {phone_home && <span className="text-gray-500 font-medium text-sm flex items-center gap-1"><SolidHomeIcon className="w-4 h-4" /> {formatPhone(phone_home)}</span>}
    </div>
  );
}

type SyndicatorPreviewSummaryProps = {
  syndicator: Syndicator;
  summary?: boolean;
};

export function SyndicatorPreviewSummary({ syndicator }: SyndicatorPreviewSummaryProps) {
  if (!syndicator) {
    return '-';
  }
  return <SyndicatorPreview name={syndicator.name} first_name={syndicator.first_name} last_name={syndicator.last_name} email={syndicator.email} phone_mobile={syndicator.phone_mobile} phone_work={syndicator.phone_work} phone_home={syndicator.phone_home} summary={true} />;
}

export const renderSyndicator = (value: string, row?: any, summary?: boolean) => {
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

  const { name, first_name, last_name, email, phone_mobile, phone_work, phone_home } = entity as Syndicator;
  return <SyndicatorPreview name={name} first_name={first_name} last_name={last_name} email={email} phone_mobile={phone_mobile} phone_work={phone_work} phone_home={phone_home} />;
};
