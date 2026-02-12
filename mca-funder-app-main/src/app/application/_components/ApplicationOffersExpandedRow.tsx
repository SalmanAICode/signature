import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate, formatNumberFourDecimals } from '@/lib/utils/format';
import { StatusBadge } from '@/components/StatusBadge';
import { ApplicationOffer } from '@/types/applicationOffer';
import { Application } from '@/types/application';
import { getApplicationOfferList } from '@/lib/api/applicationOffers';
import ApplicationOfferSummaryContent from '@/components/ApplicationOffer/ApplicationOfferSummaryContent';
import { SummaryModalLayout } from '@/components/SummaryModalLayout';

interface ApplicationOffersExpandedRowProps {
  application: Application;
}

export default function ApplicationOffersExpandedRow({ application }: ApplicationOffersExpandedRowProps) {
  const [offers, setOffers] = useState<ApplicationOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<ApplicationOffer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const response = await getApplicationOfferList({
          application: application._id,
          include_inactive: true
        });
        setOffers(response);
      } catch (err) {
        console.error('Error fetching offers:', err);
        setError('Failed to load offers');
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [application._id]);

  const handleRowClick = (offer: ApplicationOffer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOffer(null);
  };

  const handleView = () => {
    if (selectedOffer) {
      router.push(`/application-offer/${selectedOffer._id}`);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-gray-500">Loading offers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
        <h2 className="text-md font-bold text-gray-800 mb-4">Offer Summary for {application.name}</h2>
        <div className="text-gray-500">No offers found for this application</div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
        <h2 className="text-md font-bold text-gray-800 mb-4">Offer Summary for {application.name}</h2>
        <table className="w-auto divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Status</th>
              <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Offered Amount</th>
              <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Payback Amount</th>
              <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Payment</th>
              <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Frequency</th>
              <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Term</th>
              <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Factor Rate</th>
              <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Buy Rate</th>
              <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Commission</th>
              <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Total Fees</th>
              <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Offered Date</th>
              <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-fit">Offered By</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {offers.map((offer) => {
              return (
                <tr 
                  key={offer._id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  onClick={() => handleRowClick(offer)}
                >
                  <td className="px-1 py-1 whitespace-nowrap"> <StatusBadge status={offer.status} /> </td>
                  <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">{formatCurrency(offer.offered_amount)}</td>
                  <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">{formatCurrency(offer.payback_amount)}</td>
                  <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">{formatCurrency(offer.payment_amount)}</td>
                  <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">{offer.frequency}</td>
                  <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">{formatNumberFourDecimals(offer.term_length)}</td>
                  <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">{formatNumberFourDecimals(offer.factor_rate)}</td>
                  <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">{formatNumberFourDecimals(offer.buy_rate)}</td>
                  <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">{formatCurrency(offer.commission_amount || 0)}</td>
                  <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">{formatCurrency(offer.fee_amount || 0)}</td>
                  <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">{formatDate(offer.offered_date)}</td>
                  <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-900">
                    {offer.offered_by_user.first_name} {offer.offered_by_user.last_name}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal for showing offer details */}
      {isModalOpen && selectedOffer && (
        <SummaryModalLayout
          header={<h2 className="text-2xl font-bold text-center text-gray-800">Application Offer Details</h2>}
          content={<ApplicationOfferSummaryContent data={selectedOffer} />}
          actions={
            <div className="flex w-full gap-2 justify-center">
              <button
                onClick={handleView}
                className="flex-1 px-2 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition"
              >
                View
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 px-2 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-300 hover:text-gray-800 transition"
              >
                Close
              </button>
            </div>
          }
        />
      )}
    </>
  );
} 