'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { GenericList } from "@/components/GenericList/GenericList";
import Pagination from "@/components/Pagination";
import DashboardShell from '@/components/DashboardShell';

// custom components
import { DetailModal } from './_components/DetailModal';
import Filter from './_components/Filter';
import { TemplateSelector } from './_components/TemplateSelector';

import { Document } from "@/types/document";

import { getDocuments, getDocumentList } from '@/lib/api/documents';

import { columns } from './_config/columnConfig';
import { Pagination as PaginationType } from '@/types/pagination';
import useAuthStore from '@/lib/store/auth';

export type FilterState = {
  include_archived: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc' | '';
  search?: string | null;
  file_type?: string | null;
};

const ORDERING_KEY = 'document_order';
const VISIBILITY_KEY = 'document_visibility';
const COLUMN_WIDTHS_KEY = 'document_column_widths';

export default function Page() {

  const [data, setData] = useState<Document[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pagination state, Data result from the server
  const [paginatedData, setPaginatedData] = useState<PaginationType | null>(null);
  const getAccessToken = useAuthStore((state) => state.getAccessToken);
  const wsRef = useRef<WebSocket | null>(null);

  const [query, setQuery] = useState<{
    filter: FilterState;
    page: number;
    limit: number;
  }>({
    filter: {
      include_archived: false,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      search: "",
      file_type: null,
    },
    page: 1,
    limit: 10,
  });

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDocuments({
        sortBy: query.filter.sortBy,
        sortOrder: query.filter.sortOrder as 'asc' | 'desc' | null,
        page: query.page,
        limit: query.limit,
        include_archived: query.filter.include_archived,
        search: query.filter.search,
      });

      setData(response.data);
      // Transform API response to fit PaginatedData shape
      setPaginatedData(response.pagination);
    } catch (error) {
      setError(
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as Error).message)
          : 'Failed to fetch Documents'
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Store fetchDocuments in ref to avoid WebSocket reconnections
  const fetchDocumentsRef = useRef(fetchDocuments);
  useEffect(() => {
    fetchDocumentsRef.current = fetchDocuments;
  }, [fetchDocuments]);

  // fetch the data from the server when the pagination or filter changes
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // WebSocket connection for real-time signature status updates
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!backendUrl) {
          return;
        }

        const wsProtocol = backendUrl.startsWith("https") ? "wss" : "ws";
        const wsUrl = backendUrl.replace(/^https?:\/\//, "");
        const fullWsUrl = `${wsProtocol}://${wsUrl}/api/v1/documents?token=${token}`;

        ws = new WebSocket(fullWsUrl);

        ws.onopen = () => {
          console.log("Documents WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const message = Array.isArray(data.dataList) ? data.dataList[0] : data.dataList || data;

            // Check if this is a signature update for any document
            if (message?.type === "document_signature_update" && message?.documentId) {
              // Update the document status in local state without API call
              const docIdStr = String(message.documentId);
              setData((prevData) => {
                if (!prevData) return prevData;
                return prevData.map((doc) => {
                  if (String(doc._id) === docIdStr) {
                    return {
                      ...doc,
                      signature_data: {
                        ...doc.signature_data,
                        signature_status: message.signatureStatus || doc.signature_data?.signature_status,
                        signers: message.signers || doc.signature_data?.signers,
                      },
                    };
                  }
                  return doc;
                });
              });
            }
          } catch (error) {
            console.log("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = () => {
          // Silently handle WebSocket errors
        };

        ws.onclose = (event) => {
          if (event.code !== 4001 && getAccessToken()) {
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, 3000);
          }
        };

        wsRef.current = ws;
      } catch (error) {
        console.log("WebSocket connection error:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        try {
          ws.close();
        } catch (error) {
          // Ignore close errors
        }
      }
      wsRef.current = null;
    };
  }, [getAccessToken]);

  return (
    <DashboardShell>
    <div className='w-full border-gray-100 rounded-xl p-8 bg-gray-50'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <TemplateSelector onDocumentCreated={fetchDocuments} />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">Error: {error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="relative">
        {/* Loading Overlay for when we have data */}
        {loading && data && data.length > 0 && (
          <div className="absolute inset-0 bg-white bg-opacity-30 flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-gray-600">Loading...</span>
            </div>
          </div>
        )}

        {/* Always show GenericList structure */}
        <GenericList
          title="Documents"
          data={data || []}
          columns={columns}
          storage={{
            orderingKey: ORDERING_KEY,
            visibilityKey: VISIBILITY_KEY,
            columnWidthsKey: COLUMN_WIDTHS_KEY,
          }}
          currentQuery={query}
          filter={{
            enabled: true,
            render: ({ visibleColumns, flatColumns }) => <Filter value={query.filter} onChange={(nextFilter) => setQuery(prev => ({
              ...prev,
              filter: nextFilter,
              page: 1, // Optional: reset page on filter change
            }
            ))}
              visibleColumns={visibleColumns}
              flatColumns={flatColumns}
            />,
            onFilterChange: (nextFilter) => {
              setQuery((prev) => ({
                ...prev,
                page: 1,
                filter: {
                  ...prev.filter,
                  ...nextFilter,
                },
              }));
            },
          }}
          rowModal={{
            enabled: true, render: (row, onClose) => <DetailModal
              title="Document Detail"
              data={row}
              onClose={onClose}
              onSuccess={() => {
                fetchDocuments();
              }} />
          }}
          expandable={{ enabled: true, }}
          fetchAllData={() => getDocumentList()}
        />

        {/* Show loading state for initial load */}
        {loading && (!data || data.length === 0) && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-gray-600">Loading...</span>
            </div>
          </div>
        )}

        {/* Show empty state when not loading and no data */}
        {!loading && data && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No Documents available.
          </div>
        )}

        {/* Pagination - only show when we have data */}
        {data && data.length > 0 && (
          <Pagination
            currentPage={query.page}
            totalPages={paginatedData?.totalPages || 0}
            totalResults={paginatedData?.totalResults || 0}
            limit={query.limit}
            onPageChange={(newPage) => setQuery((prev) => ({ ...prev, page: newPage }))}
            onLimitChange={(newLimit) => setQuery((prev) => ({ ...prev, limit: newLimit }))}
          />
        )}
      </div>
    </div>
    </DashboardShell>
  );
} 