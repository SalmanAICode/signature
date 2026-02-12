'use client';

import { Funder } from '@/types/funder';
import { formatDate, formatPhone } from '@/lib/utils/format';

interface FunderDetailsTabProps {
  funder: Funder;
}

const formatFunderAddress = (address?: Funder['address']) => {
  if (!address) return 'No address provided';
  
  const parts = [
    address.address_1,
    address.address_2,
    `${address.city}, ${address.state} ${address.zip}`
  ].filter(Boolean);
  
  return parts.join(', ');
};

export default function FunderDetailsTab({ funder }: FunderDetailsTabProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-300px)] overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2">
            Basic Information
          </h3>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Funder ID</p>
            <p className="text-gray-800 font-mono text-sm">{funder._id}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Name</p>
            <h4 className="text-lg font-semibold text-gray-800">{funder.name}</h4>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-gray-800">{funder.email}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Phone</p>
            <p className="text-gray-800">{formatPhone(funder.phone)}</p>
          </div>
          
          {funder.website && (
            <div>
              <p className="text-sm font-medium text-gray-500">Website</p>
              <a 
                href={funder.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline"
              >
                {funder.website}
              </a>
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              funder.inactive 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {funder.inactive ? 'Inactive' : 'Active'}
            </span>
          </div>
        </div>

        {/* Business Details */}
        {funder.business_detail && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2">
              Business Details
            </h3>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Entity Type</p>
              <p className="text-gray-800">{funder.business_detail.entity_type}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">EIN</p>
              <p className="text-gray-800">{funder.business_detail.ein}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">State of Incorporation</p>
              <p className="text-gray-800">{funder.business_detail.state_of_incorporation}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Incorporation Date</p>
              <p className="text-gray-800">
                {formatDate(funder.business_detail.incorporation_date)}
              </p>
            </div>
          </div>
        )}

        {/* Address */}
        {funder.address && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2">
              Address
            </h3>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Street Address</p>
              <p className="text-gray-800">{funder.address.address_1}</p>
            </div>
            
            {funder.address.address_2 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Address Line 2</p>
                <p className="text-gray-800">{funder.address.address_2}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">City</p>
                <p className="text-gray-800">{funder.address.city}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">State</p>
                <p className="text-gray-800">{funder.address.state}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">ZIP Code</p>
              <p className="text-gray-800">{funder.address.zip}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Full Address</p>
              <p className="text-gray-800 text-sm">{formatFunderAddress(funder.address)}</p>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2">
            Statistics
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Users</p>
              <p className="text-2xl font-bold text-gray-800">{funder.user_count || 0}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">ISOs</p>
              <p className="text-2xl font-bold text-gray-800">{funder.iso_count || 0}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Merchants</p>
              <p className="text-2xl font-bold text-gray-800">{funder.merchant_count || 0}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Syndicators</p>
              <p className="text-2xl font-bold text-gray-800">{funder.syndicator_count || 0}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Applications</p>
              <p className="text-2xl font-bold text-gray-800">{funder.application_count || 0}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Apps</p>
              <p className="text-2xl font-bold text-gray-800">{funder.pending_application_count || 0}</p>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2">
            Financial Information
          </h3>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Available Balance</p>
            <p className="text-2xl font-bold text-green-600">
              ${(funder.available_balance || 0).toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Total Accounts</p>
            <p className="text-2xl font-bold text-gray-800">{funder.account_count || 0}</p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2">
            Record Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Created Date</p>
              <p className="text-gray-800">{formatDate(funder.created_date)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-gray-800">{formatDate(funder.updated_date)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 