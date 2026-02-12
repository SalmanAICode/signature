interface CardLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function CardLayout({ title, children }: CardLayoutProps) {
  return (
    <div className="w-full border rounded-lg p-4 border-gray-200 bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}