import { Application } from "@/types/application";
import { formatCurrency, formatTime } from "@/components/GenericList/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { UserPreviewSummary } from "@/components/UserPreview";
import { EntityPreviewSummary } from "@/components/EntityPreview";

interface ApplicationSummaryContentProps {
  data: Application;
}

export function ApplicationSummaryContent({ data }: ApplicationSummaryContentProps) {
  return (
    <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {/* Application Basic Information */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Application Name</p>
        <h3 className="text-md font-semibold text-gray-800">{data?.name}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Type</p>
        <h3 className="text-md font-semibold text-gray-800"><StatusBadge status={data.type} size="sm" /></h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Status</p>
        <h3 className="text-md font-semibold text-gray-800"><StatusBadge status={data.status.name} color={data.status.bgcolor} size="sm" /></h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Request Amount</p>
        <h3 className="text-md font-semibold text-gray-800">{formatCurrency(data?.request_amount)}</h3>
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-300" />

      {/* Merchant Information */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Merchant</p>
        <EntityPreviewSummary entity={data?.merchant} />
      </div>

      {data?.contact && (
        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Contact</p>
          <UserPreviewSummary user={data?.contact} />
        </div>
      )}

      {/* Funder Information */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Funder</p>
        <EntityPreviewSummary entity={data?.funder} />
      </div>

      {/* ISO Information */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">ISO </p>
        <EntityPreviewSummary entity={data?.iso} />
      </div>

      {data?.representative && (
        <div className="flex flex-col gap-1 break-words whitespace-normal">
          <p className="text-xs font-medium text-gray-500">Representative</p>
          <UserPreviewSummary user={data?.representative} />
        </div>
      )}

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      {/* Assigned User */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Assigned Manager</p>
        <UserPreviewSummary user={data?.assigned_manager} />
      </div>

      {/* Assigned User */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Assigned User</p>
        <UserPreviewSummary user={data?.assigned_user} />
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      {/* Application Details */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Priority</p>
        <h3 className="text-md font-semibold">
          <StatusBadge status={data?.priority ? "High" : "Normal"} size="sm" />
        </h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Internal</p>
        <h3 className="text-md font-semibold">
          <StatusBadge status={data.internal} size="sm" />
        </h3>
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      {/* Counts */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Documents</p>
        <h3 className="text-md font-semibold text-gray-800">{data?.document_count || 0}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Offers</p>
        <h3 className="text-md font-semibold text-gray-800">{data?.offer_count || 0}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Stipulations</p>
        <h3 className="text-md font-semibold text-gray-800">{data?.stipulation_count || 0}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Followers</p>
        <h3 className="text-md font-semibold text-gray-800">{data?.follower_list?.length || 0}</h3>
      </div>

      {/* Divider */}
      <div className="col-span-2 border-b border-gray-200" />

      {/* Dates */}
      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Request Date</p>
        <h3 className="text-md font-semibold text-gray-800">{formatTime(data.request_date)}</h3>
      </div>

      <div className="flex flex-col gap-1 break-words whitespace-normal">
        <p className="text-xs font-medium text-gray-500">Status Date</p>
        <h3 className="text-md font-semibold text-gray-800">{formatTime(data.status_date)}</h3>
      </div>
    </div>
  );
} 