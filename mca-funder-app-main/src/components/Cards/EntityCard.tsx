import { safeRender } from "@/lib/utils/format";
import CardLayout from "./CardLayout";

interface EntityCardProps {
    data: any;
    title: string;
}

export default function EntityCard({ data, title }: EntityCardProps) {
    return (
        <CardLayout title={title}>
            <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                    <p className="text-xs font-medium text-gray-500">Name</p>
                    <h3 className="text-md font-semibold text-gray-800">{safeRender(data.name)}</h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                    <p className="text-xs font-medium text-gray-500">Email</p>
                    <h3 className="text-md font-semibold text-gray-800">
                        {data.email ? (
                            <a href={`mailto:${data.email}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                {data.email}
                            </a>
                        ) : '-'}
                    </h3>
                </div>

                <div className="flex flex-col gap-1 break-words whitespace-normal text-left">
                    <p className="text-xs font-medium text-gray-500">Phone</p>
                    <h3 className="text-md font-semibold text-gray-800">
                        {data.phone ? (
                            <a href={`tel:${data.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                {data.phone}
                            </a>
                        ) : '-'}
                    </h3>
                </div>
            </div>
        </CardLayout>
    );
}