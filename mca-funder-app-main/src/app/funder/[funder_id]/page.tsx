import FunderDetail from "./_components/FunderDetail";
import DashboardShell from '@/components/DashboardShell';

interface PageProps {
  params: Promise<{ funder_id: string }>;
}

export default async function FunderDetailsPage({ params }: PageProps) {
  const { funder_id } = await params;
  
  return (
    <DashboardShell>
      <FunderDetail id={funder_id} />
    </DashboardShell>
  );
}
  