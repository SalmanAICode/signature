import FundingInformation from '@/app/funding/[funding_id]/_components/FundingInformation';
import { Funding } from '@/types/funding';

interface FundingTabProps {
    data: Funding | null;
}

export default function FundingTab({ data }: FundingTabProps) { 
    if (!data) {
        return <div>No funding data available</div>;
    }
    return <FundingInformation data={data} />;
}