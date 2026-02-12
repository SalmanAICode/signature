import ContactDetail from "./_components/ContactDetail";
import DashboardShell from '@/components/DashboardShell';

interface PageProps {
  params: Promise<{ contact_id: string }>;
}

export default async function ContactDetailsPage({ params }: PageProps) {
  const { contact_id } = await params;
  
  return (
    <DashboardShell>
      <ContactDetail id={contact_id} />
    </DashboardShell>
  );
}
  