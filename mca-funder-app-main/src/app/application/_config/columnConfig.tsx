// Define the columns for the Application table
import { ColumnConfig } from "@/components/GenericList/types";
import { formatTime, formatCurrency } from "@/lib/utils/format";
import { renderPriority, renderStatusBadge } from '@/components/StatusBadge';
import { Application, UpdateApplicationData } from "@/types/application";
import { renderEntity } from "@/components/EntityPreview";
import { renderUser } from "@/components/UserPreview";
import { renderFollowerControl } from "@/components/FollowerControl";
import { updateApplication } from "@/lib/api/applications";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { StaticSelector } from '@/components/StatusSelector/StaticSelector';
import UpdateModal from '@/components/UpdateModal';

const createFollowerListRenderer = (onUpdateData: (id: string, newData: Application) => void) => {
  return (value: any, row?: Application) => {
    if (!row) return null;
    const followers = row?.follower_list || [];
    const assignedUser = row?.assigned_user?.id;
    const assignedManager = row?.assigned_manager?.id;
    return renderFollowerControl({ 
      followers, 
      assignedUser, 
      assignedManager, 
      onClick: async (newFollowers) => {
        if (row?._id) {
          try {
            const updatedData = await updateApplication(row._id, { follower_list: newFollowers } as UpdateApplicationData);
            onUpdateData(row._id, updatedData);
            if (newFollowers.length > 0) {
              toast.success('Followed successfully');
            } else {
              toast.success('Unfollowed successfully');
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update followers');
          }
        }
      } 
    });
  }
};

// Wrapper component to handle application status updates
const StatusSelectorWrapper = ({ item, onUpdateData, statusOptions }: { 
  item: Application; 
  onUpdateData: (id: string, newData: Application) => void;
  statusOptions: any[];
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<any>(null);

    // Find the current status object from options
    let statusValue = statusOptions.find(opt => {
        if (!item.status) return false;
        if (opt._id && item.status.id) return String(opt._id) === String(item.status.id);
        return opt === item.status;
    }) || null;

    // If not found, but item.status exists, create a fallback option
    let selectOptions = statusOptions;
    if (!statusValue && item.status) {
        statusValue = item.status;
        selectOptions = [item.status, ...statusOptions];
    }

    const handleStatusUpdate = (newStatus: any) => {
        setPendingStatus(newStatus);
        if (newStatus && newStatus.closed === true) {
            setShowModal(true);
        } else {
            doUpdate(newStatus);
        }
    };

    const doUpdate = async (newStatus: any) => {
        setIsLoading(true);
        try {
            const updatedApplication = await updateApplication(item._id, {
                status: newStatus._id,
            } as UpdateApplicationData);
            onUpdateData(item._id, updatedApplication);
            toast.success('Status updated successfully');
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (pendingStatus) {
            await doUpdate(pendingStatus);
        }
        setShowModal(false);
        setPendingStatus(null);
    };

    const handleCancel = () => {
        setShowModal(false);
        setPendingStatus(null);
    };

    const getOptionLabel = (status: any) => status.name;
    const getOptionColor = (status: any) => status.bgcolor;
    const getOptionClosed = (status: any) => status.closed === true;

    return (
        <>
            <div onClick={(e) => e.stopPropagation()}>
                <StaticSelector<any>
                    value={statusValue}
                    options={selectOptions}
                    onUpdate={handleStatusUpdate}
                    width="150px"
                    isLoading={isLoading}
                    getOptionLabel={getOptionLabel}
                    getOptionColor={getOptionColor}
                    getOptionClosed={getOptionClosed}
                />
            </div>
            <UpdateModal
                isOpen={showModal}
                title="Confirm Status Change"
                message={`Are you sure you want to change status to "${pendingStatus ? getOptionLabel(pendingStatus) : ''}"?`}
                confirmButtonText="Confirm"
                cancelButtonText="Cancel"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                isLoading={isLoading}
            />
        </>
    );
};

export const columns = (onUpdateData: (id: string, newData: Application) => void, statusOptions: any[] = []): ColumnConfig<Application>[] => [
  { key: "priority", label: "Prio", render: renderPriority },
  { key: "name", label: "Application Name" },
  { key: "_id", label: "Application ID", visible: false },
  { key: "request_amount", label: "Request Amount", render: formatCurrency },
  {
    key: "merchant",
    label: "Merchant",
    render: renderEntity,
    // columns: [
    //   { key: "id", label: "Merchant ID", visible: false },
    //   { key: "name", label: "Merchant Name" },
    //   { key: "email", label: "Merchant Email", visible: false },
    //   { key: "phone", label: "Merchant Phone", visible: false, render: formatPhone },
    // ],

  },

// Contact
{
  key: "contact",
  label: "Contact",
  render: renderUser,
  visible: false,
  // columns: [
  //   { key: "id", label: "Manager ID", visible: false },
  //   { key: "first_name", label: "First Name", visible: false },
  //   { key: "last_name", label: "Last Name", visible: false },
  //   { key: "email", visible: false, label: "Email" },
  //   { key: "phone", visible: false, label: "Phone", render: formatPhone },
  // ],

},

  {
    key: "funder",
    label: "Funder",
    render: renderEntity,
    // columns: [
    //   { key: "id", label: "Funder ID", visible: false },
    //   { key: "name", label: "Funder Name" },
    //   { key: "email", label: "FunderEmail", visible: false },
    //   { key: "phone", label: "Funder Phone", visible: false, render: formatPhone },
    // ],
  },
  {
    key: "iso",
    label: "ISO",
    render: renderEntity,
    // columns: [
    //   { key: "id", label: "ISO ID", visible: false },
    //   { key: "name", label: "ISO Name" },
    //   { key: "email", label: "ISO Email", visible: false },
    //   { key: "phone", label: "ISO Phone", visible: false, render: formatPhone },
    // ],
  },

  // Representative
  {
    key: "representative",
    label: "Representative",
    render: renderUser,
    visible: false,
  },

  { key: "type", label: "Type", render: renderStatusBadge },

  {
    key: "assigned_manager",
    label: "Assigned Manager",
    render: renderUser,
    // columns: [
    //   { key: "id", label: "Manager ID", visible: false },
    //   { key: "first_name", label: "First Name", visible: false },
    //   { key: "last_name", label: "Last Name", visible: false },
    //   { key: "email", visible: false, label: "Email" },
    //   { key: "phone", visible: false, label: "Phone", render: formatPhone },
    // ],
  },

  {
    key: "assigned_user",
    label: "Assigned User",
    render: renderUser,
    // columns: [
    //   { key: "_id", visible: false, label: "User ID", },
    //   { key: "first_name", label: "First Name", visible: false },
    //   { key: "last_name", label: "Last Name", visible: false },
    //   { key: "email", visible: false, label: "Email" },
    // ],
  },
  { key: "follower_list", label: "Follow", render: createFollowerListRenderer(onUpdateData) },
  { key: "request_date", label: "Request Date", render: formatTime },

  {
    key: "status",
    label: "Status",
    columns: [
      { key: "id", label: "Status ID", visible: false },
      { key: "name", label: "Status", render: (value: any, row?: Application) => {
        if (!row) return null;
        return <StatusSelectorWrapper item={row} onUpdateData={onUpdateData} statusOptions={statusOptions} />;
      } },
      // { key: "bgColor", label: "Status Background Color", visible: false },
    ],
  },
  { key: "status_date", label: "Status Date", render: formatTime, visible: false },
  { key: "declined_reason", label: "Declined Reason", visible: false },

  { key: "internal", label: "Internal", render: renderStatusBadge, visible: false },
  { key: "closed", label: "Closed", render: renderStatusBadge, visible: false },
  { key: "inactive", label: "Inactive", render: renderStatusBadge, visible: false },

  // Stipulations
  { key: "stipulation_count", label: "Total Stipulations" , visible: false},
  { key: "reqeusted_stipulation_count", label: "Requested Stipulations" , visible: false},
  { key: "received_stipulation_count", label: "Received Stipulations" , visible: false},
  { key: "checked_stipulation_count", label: "Checked Stipulations" , visible: false},

  // Documents
  { key: "document_count", label: "Total Documents", visible: false},
  { key: "generated_document_count", label: "Generated Documents", visible: false},
  { key: "uploaded_document_count", label: "Uploaded Documents", visible: false},

  // Other 
  { key: "offer_count", label: "Offer Count" , visible: false},
  { key: "history_count", label: "History Count" , visible: false},

  // System Timestamps
  { key: "createdAt", label: "Created At", render: formatTime, visible: false },
  { key: "updatedAt", label: "Updated At", render: formatTime, visible: false },

];