// Document table - only essential columns (recently sent for signature at top)
import React from "react";
// import Link from "next/link";
// import { EyeIcon } from "@heroicons/react/24/outline";
import { ColumnConfig } from "@/components/GenericList/types";
import { formatTime } from "@/components/GenericList/utils";
import { Document } from "@/types/document";

const renderSignatureStatus = (value: string | undefined, row?: Document) => {
  const status = row?.signature_data?.signature_status || value || "not_initiated";
  const labels: Record<string, { label: string; className: string }> = {
    completed: { label: "Completed", className: "bg-green-100 text-green-800" },
    pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
    declined: { label: "Declined", className: "bg-red-100 text-red-800" },
    not_initiated: { label: "—", className: "bg-gray-100 text-gray-600" },
  };
  const { label, className } = labels[status] || labels.not_initiated;
  return React.createElement(
    "span",
    { className: `inline-block px-2 py-0.5 rounded text-xs font-medium ${className}` },
    label,
  );
};

export const columns: ColumnConfig<Document>[] = [
  { key: "file_name", label: "Document" },
  {
    key: "merchant",
    label: "Merchant",
    render: (_, row) => (row?.merchant as { name?: string })?.name || "—",
  },
  {
    key: "funder",
    label: "Funder",
    render: (_, row) => (row?.funder as { name?: string })?.name || "—",
  },
  {
    key: "signature_data.signature_status",
    label: "Signature Status",
    render: renderSignatureStatus,
  },
  {
    key: "updatedAt",
    label: "Last Updated",
    render: (value, row) => {
      // Show createdAt when doc first stored; updatedAt updates when signers sign
      const date = row?.updatedAt || row?.createdAt || value;
      return formatTime(date);
    },
  }
];
