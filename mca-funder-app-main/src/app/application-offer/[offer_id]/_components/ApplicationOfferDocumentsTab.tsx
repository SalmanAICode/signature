import { useState, useEffect, useRef, useCallback } from "react";
import { SimpleList } from "@/components/SimpleList";
import { Pagination } from "@/types/pagination";
import { ApplicationDocument } from "@/types/applicationDocument";
import { deleteApplicationDocument } from "@/lib/api/applicationDocuments";
import { downloadDocument } from "@/components/Document/utils";
import DeleteModal from "@/components/DeleteModal";
import { toast } from "react-hot-toast";
import type { SortOrder } from "@/components/SimpleList";
import { ApplicationOffer } from "@/types/applicationOffer";
import { columns } from "./documentTab/columnConfig";
import DocumentDetailModal from "./documentTab/DocumentDetailModal";
import UploadDocumentModal from "./documentTab/uploadDocumentModal";
import AddDocumentModal from "./documentTab/addDocumentModal";
import { getApplicationOfferDocuments } from "@/lib/api/applicationOfferDocuments";
import useAuthStore from "@/lib/store/auth";

interface ApplicationDocumentsTabProps {
  data: ApplicationOffer;
}

interface QueryParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: SortOrder;
  search?: string;
}

export default function ApplicationOfferDocumentsTab({
  data,
}: ApplicationDocumentsTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<ApplicationDocument | null>(null);
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 0,
  });
  const getAccessToken = useAuthStore((state) => state.getAccessToken);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiParams = {
        ...queryParams,
        sortOrder: queryParams.sortOrder || undefined,
      };
      const result = await getApplicationOfferDocuments(data._id, apiParams);
      setDocuments(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch documents",
      );
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [data._id, queryParams]);

  // Store fetchDocuments in ref to avoid WebSocket reconnections
  const fetchDocumentsRef = useRef(fetchDocuments);
  useEffect(() => {
    fetchDocumentsRef.current = fetchDocuments;
  }, [fetchDocuments]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // WebSocket connection for real-time signature status updates
  useEffect(() => {
    if (!data?._id) return;

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
          console.log("Application Offer Documents WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const message = Array.isArray(data.dataList) ? data.dataList[0] : data.dataList || data;

            // Check if this is a signature update for any document
            if (message?.type === "document_signature_update" && message?.documentId) {
              // Update the document status in local state without API call
              const docIdStr = String(message.documentId);
              setDocuments((prevDocuments) => {
                if (!prevDocuments) return prevDocuments;
                return prevDocuments.map((doc) => {
                  const docId = doc.document?._id ?? doc.document?.id;
                  if (docId != null && String(docId) === docIdStr) {
                    return {
                      ...doc,
                      document: {
                        ...doc.document,
                        signature_data: {
                          ...doc.document?.signature_data,
                          signature_status: message.signatureStatus || doc.document?.signature_data?.signature_status,
                          signers: message.signers || doc.document?.signature_data?.signers,
                        },
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
  }, [data?._id, getAccessToken]);

  const handleDownload = async (document: ApplicationDocument) => {
    try {
      await downloadDocument(document?.document);
      toast.success("Document downloaded successfully");
    } catch (error) {
      toast.error((error as Error)?.message || "Failed to download document");
    }
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;

    setIsDeleting(selectedDocument._id);
    try {
      await deleteApplicationDocument(data._id, selectedDocument._id);

      setDocuments((prev) =>
        prev.filter((doc) => doc._id !== selectedDocument._id),
      );
      toast.success("Application Document deleted successfully");
      setPagination((prev) => ({
        ...prev,
        totalResults: prev.totalResults - 1,
        totalPages: Math.ceil((prev.totalResults - 1) / prev.limit),
      }));

      setShowDeleteModal(false);
      setSelectedDocument(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete document",
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCreate = async (newDocument: ApplicationDocument) => {
    setDocuments((prev) => [newDocument, ...prev]);
    setPagination((prev) => ({
      ...prev,
      totalResults: prev.totalResults + 1,
      totalPages: Math.ceil((prev.totalResults + 1) / prev.limit),
    }));
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setQueryParams((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (sortBy: string, sortOrder: SortOrder) => {
    setQueryParams((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  const handleSearch = async (search: string): Promise<void> => {
    setQueryParams((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleDocumentUpdate = (updatedDocument: ApplicationDocument) => {
    setDocuments((prevDocuments) =>
      prevDocuments.map((doc) =>
        doc._id === updatedDocument._id ? updatedDocument : doc,
      ),
    );
  };

  const handleRowClick = (item: ApplicationDocument) => {
    setSelectedDocument(item);
    setShowDetailModal(true);
  };

  const renderHeaderButtons = () => (
    <div className="flex space-x-2">
      <button
        onClick={() => setShowUploadModal(true)}
        className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <span className="flex items-center">
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Upload
        </span>
      </button>
      <button
        onClick={() => setShowAddModal(true)}
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span className="flex items-center">
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Add Existing
        </span>
      </button>
    </div>
  );

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <SimpleList
          title="Application Documents"
          data={documents}
          columns={columns}
          loading={loading}
          error={error}
          emptyMessage="No documents found"
          renderHeaderButtons={renderHeaderButtons}
          onSearch={handleSearch}
          onSort={handleSort}
          searchQuery={queryParams.search}
          initialSortBy={queryParams.sortBy}
          initialSortOrder={queryParams.sortOrder}
          pagination={{
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            totalResults: pagination.totalResults,
            limit: pagination.limit,
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange,
          }}
          onUpdate={handleDocumentUpdate}
          onRowClick={handleRowClick}
        />
      </div>

      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDocument(null);
          }}
          onRefresh={fetchDocuments}
          onDownload={handleDownload}
          applicationOffer={data}
        />
      )}

      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Document"
        message={`Are you sure you want to delete "${selectedDocument?.document && typeof selectedDocument.document !== "string" ? selectedDocument.document.file_name : "this document"}"?`}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedDocument(null);
        }}
        isLoading={isDeleting === selectedDocument?._id}
      />

      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={fetchDocuments}
        application={data}
      />

      <AddDocumentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={handleCreate}
        application={data}
      />
    </div>
  );
}
