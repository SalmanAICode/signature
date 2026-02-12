import { ReactNode } from "react";
import { SUMMARY_MODAL_WIDTH } from "@/config/ui";

type SummaryModalLayoutProps = {
    header: ReactNode;
    content: ReactNode;
    actions: ReactNode;
    error?: string | null;
    width?: string | number;
};

export function SummaryModalLayout({ 
    header, 
    content, 
    actions,
    error,
    width = SUMMARY_MODAL_WIDTH
}: SummaryModalLayoutProps) {
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div 
                className="bg-gray-100 p-6 rounded-2xl shadow-xl w-full relative max-h-[90vh] overflow-y-auto" 
                style={{ maxWidth: width }}
            >
                {/* Header */}
                <div className="mb-6">
                    {header}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border-red-200 border rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium text-red-800">{error}</span>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto border rounded-lg p-4 border-gray-200 bg-gray-50 mb-6">
                    {content}
                </div>

                {/* Actions */}
                <div className="w-full">
                    {actions}
                </div>
            </div>
        </div>
    );
} 