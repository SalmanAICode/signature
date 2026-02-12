"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import { getDocumentById, downloadDocument as downloadDocumentApi, initiateSignature, getSignatureStatus, Signer } from "@/lib/api/documents";
import { getApplicationOfferById } from "@/lib/api/applicationOffers";
import { getApplicationOfferDocumentList } from "@/lib/api/applicationOfferDocuments";
import { Document } from "@/types/document";
import { ApplicationOffer } from "@/types/applicationOffer";
import { toast } from "react-hot-toast";
import useAuthStore from "@/lib/store/auth";

const PAGE_WIDTH_POINTS = 595;
const PAGE_HEIGHT_POINTS = 842;

function isPdfDocument(doc: Document | null): boolean {
  if (!doc) return false;
  const t = (doc.file_type || "").toLowerCase();
  return t === "application/pdf" || t.includes("pdf");
}

interface OfferSignerOption {
  key: string;
  email: string;
  name: string;
  role: "seller" | "guarantor" | "buyer" | "signer";
  order: number;
  label: string;
}

function buildOfferSigners(offer: ApplicationOffer | null): OfferSignerOption[] {
  if (!offer) return [];
  const list: OfferSignerOption[] = [];
  let order = 1;
  const m = offer.merchant as Record<string, unknown>;
  if (m?.primary_contact?.email || m?.email) {
    const name = m.primary_contact
      ? `${(m.primary_contact as Record<string, string>)?.first_name || ""} ${(m.primary_contact as Record<string, string>)?.last_name || ""}`.trim() || (m.name as string)
      : (m.name as string);
    const email = ((m.primary_contact as Record<string, string>)?.email || m.email) as string;
    const displayName = (name as string) || "Merchant";
    list.push({
      key: "seller",
      email,
      name: displayName,
      role: "seller",
      order: order++,
      label: displayName ? `${displayName} (${email})` : email,
    });
  }
  const f = offer.funder as Record<string, unknown>;
  if (f?.email) {
    const name = (f.name as string) || "Funder";
    list.push({
      key: "buyer",
      email: f.email as string,
      name,
      role: "buyer",
      order: order++,
      label: name ? `${name} (${String(f.email)})` : String(f.email),
    });
  }
  const iso = offer.iso as Record<string, unknown>;
  if ((iso?.primary_representative as Record<string, string>)?.email || iso?.email) {
    const email = ((iso.primary_representative as Record<string, string>)?.email || iso.email) as string;
    const name =
      (iso.primary_representative
        ? `${(iso.primary_representative as Record<string, string>)?.first_name || ""} ${(iso.primary_representative as Record<string, string>)?.last_name || ""}`.trim()
        : null) || (iso.name as string) || "ISO";
    list.push({
      key: "signer_iso",
      email,
      name: name as string,
      role: "signer",
      order: order++,
      label: name ? `${name} (${email})` : email,
    });
  }
  const offeredBy = offer.offered_by_user as Record<string, unknown>;
  if (offeredBy?.email) {
    const name = `${(offeredBy.first_name as string) || ""} ${(offeredBy.last_name as string) || ""}`.trim() || "Offered by";
    list.push({
      key: "signer_offered",
      email: offeredBy.email as string,
      name,
      role: "signer",
      order: order++,
      label: name ? `${name} (${String(offeredBy.email)})` : String(offeredBy.email),
    });
  }
  const decidedBy = offer.decided_by_contact as Record<string, unknown>;
  if (decidedBy?.email) {
    const name = `${(decidedBy.first_name as string) || ""} ${(decidedBy.last_name as string) || ""}`.trim() || "Decided by";
    list.push({
      key: "signer_decided",
      email: decidedBy.email as string,
      name,
      role: "signer",
      order: order++,
      label: name ? `${name} (${String(decidedBy.email)})` : String(decidedBy.email),
    });
  }
  return list;
}

export default function DocumentSignPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params?.offer_id as string;
  const documentId = params?.documentId as string;

  const [offer, setOffer] = useState<ApplicationOffer | null>(null);
  const [fullDoc, setFullDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [signLoading, setSignLoading] = useState(false);
  const [signatureBoxPositions, setSignatureBoxPositions] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [additionalSigners, setAdditionalSigners] = useState<OfferSignerOption[]>([]);
  const [addSignerName, setAddSignerName] = useState("");
  const [addSignerEmail, setAddSignerEmail] = useState("");
  const [addSignerType, setAddSignerType] = useState<"Merchant" | "ISO">("Merchant");
  /** Document type selected at upload – used as title shown to signer (from application offer document) */
  const [documentTitleForSigner, setDocumentTitleForSigner] = useState<string>("Document");
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const pdfPreviewUrlRef = useRef<string | null>(null);
  const getAccessToken = useAuthStore((state) => state.getAccessToken);
  const wsRef = useRef<WebSocket | null>(null);
  const lastCheckedDocIdRef = useRef<string | null>(null);

  const offerSigners = useMemo(() => buildOfferSigners(offer), [offer]);
  const allSigners = useMemo(() => {
    const base = offerSigners.length;
    return [
      ...offerSigners,
      ...additionalSigners.map((s, i) => ({ ...s, order: base + i + 1 })),
    ];
  }, [offerSigners, additionalSigners]);

  const addSigner = () => {
    const email = addSignerEmail.trim();
    const name = addSignerName.trim();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    const key = `extra_${Date.now()}_${additionalSigners.length}`;
    const label = name ? `${name} (${email})` : email;
    const newSigner: OfferSignerOption = {
      key,
      email,
      name: name || email,
      role: "signer",
      order: offerSigners.length + additionalSigners.length + 1,
      label,
    };
    const i = additionalSigners.length;
    setAdditionalSigners((prev) => [...prev, newSigner]);
    setSignatureBoxPositions((prev) => ({
      ...prev,
      [key]: {
        x: 50 + (i % 2) * 280,
        y: 700 + Math.floor((offerSigners.length + i) / 2) * 60,
        width: 200,
        height: 50,
      },
    }));
    setAddSignerName("");
    setAddSignerEmail("");
    toast.success(`${addSignerType} signer added`);
  };

  const removeAdditionalSigner = (key: string) => {
    setAdditionalSigners((prev) => prev.filter((s) => s.key !== key));
    setSignatureBoxPositions((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    if (!offerId || !documentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [offerData, docData, appDocList] = await Promise.all([
          getApplicationOfferById(offerId),
          getDocumentById(documentId),
          getApplicationOfferDocumentList(offerId).catch(() => []),
        ]);
        if (cancelled) return;
        setOffer(offerData);
        setFullDoc(docData);
        // Match by document.id (embedded) or document._id (populated)
        const appDoc = Array.isArray(appDocList)
          ? appDocList.find((d: { document?: { _id?: string; id?: string } }) => {
              const docId = (d.document as any)?.id ?? (d.document as any)?._id;
              return docId != null && String(docId) === documentId;
            })
          : null;
        const title =
          appDoc?.document_type ||
          (appDoc?.application_stipulation as { stipulation_type?: { name?: string } } | undefined)?.stipulation_type?.name ||
          "";
        setDocumentTitleForSigner(title);
        const defaults: Record<string, { x: number; y: number; width: number; height: number }> = {};
        const signers = buildOfferSigners(offerData);
        signers.forEach((s, i) => {
          defaults[s.key] = {
            x: 50 + (i % 2) * 280,
            y: 700 + Math.floor(i / 2) * 60,
            width: 200,
            height: 50,
          };
        });
        setSignatureBoxPositions(defaults);
      } catch (e) {
        toast.error("Failed to load document for signing");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [offerId, documentId]);

  useEffect(() => {
    if (!fullDoc || fullDoc.fileHtml?.value || !isPdfDocument(fullDoc) || !documentId) {
      if (pdfPreviewUrlRef.current) {
        window.URL.revokeObjectURL(pdfPreviewUrlRef.current);
        pdfPreviewUrlRef.current = null;
        setPdfPreviewUrl(null);
      }
      return;
    }
    let cancelled = false;
    downloadDocumentApi(documentId)
      .then((blob) => {
        if (cancelled) return;
        const url = window.URL.createObjectURL(blob);
        pdfPreviewUrlRef.current = url;
        setPdfPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPdfPreviewUrl(null);
      });
    return () => {
      cancelled = true;
      if (pdfPreviewUrlRef.current) {
        window.URL.revokeObjectURL(pdfPreviewUrlRef.current);
        pdfPreviewUrlRef.current = null;
        setPdfPreviewUrl(null);
      }
    };
  }, [fullDoc, documentId]);

  useEffect(() => {
    if (!draggingKey || !documentContainerRef.current) return;
    const container = documentContainerRef.current;
    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      setSignatureBoxPositions((prev) => {
        const cur = prev[draggingKey];
        if (!cur) return prev;
        return {
          ...prev,
          [draggingKey]: {
            ...cur,
            x: e.clientX - rect.left - dragOffsetRef.current.x,
            y: e.clientY - rect.top - dragOffsetRef.current.y,
          },
        };
      });
    };
    const onUp = () => setDraggingKey(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [draggingKey]);

  // WebSocket connection for real-time signature updates
  useEffect(() => {
    if (!documentId) return;

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
          console.log("Application Offer Document WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const message = Array.isArray(data.dataList) ? data.dataList[0] : data.dataList || data;

            if (message?.type === "document_signature_update" && message?.documentId === documentId) {
              const signers = message.signers || [];

              setFullDoc((prevDoc) => {
                if (!prevDoc) return prevDoc;
                return {
                  ...prevDoc,
                  signature_data: {
                    ...prevDoc.signature_data,
                    signature_status: message.signatureStatus ?? prevDoc.signature_data?.signature_status,
                    signers,
                    last_event: message.event,
                    last_event_at: message.timestamp,
                  },
                };
              });

              // Toast for newly completed signers
              signers.forEach((signer: { role?: string; status?: string }) => {
                if (signer.status === "completed") {
                  const roleLabel = (signer.role || "Signer").charAt(0).toUpperCase() + (signer.role || "signer").slice(1);
                  toast.success(`${roleLabel} has signed the document!`);
                }
              });

              // Check if all signers completed
              const allCompleted = signers.every((s: { status?: string }) => s.status === "completed");
              if (allCompleted && signers.length > 0) {
                toast.success("All signers have completed signing!");
              }
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
  }, [documentId, getAccessToken]);

  // Polling fallback: poll signature-status every 10s when document has pending signatures
  useEffect(() => {
    if (!documentId || !fullDoc?.signature_data?.signature_request_id) return;
    const status = fullDoc.signature_data?.signature_status;
    if (status === "completed" || status === "declined") return;

    const pollStatus = async () => {
      try {
        const result = await getSignatureStatus(documentId);
        const signers = (result.signers || []).map((s) => ({
          email: s.email,
          name: s.name,
          role: (s.role || "signer") as "seller" | "guarantor" | "buyer" | "signer",
          status: s.status,
          signed_at: s.signed_at || undefined,
        }));
        setFullDoc((prev) => {
          if (!prev || prev._id !== documentId) return prev;
          return {
            ...prev,
            signature_data: {
              ...prev.signature_data,
              signature_status: result.status === "cancelled" ? "declined" : result.status,
              signers: signers.length ? signers : prev.signature_data?.signers || [],
            },
          } as Document;
        });
      } catch {
        // Silently ignore poll errors
      }
    };

    const interval = setInterval(pollStatus, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [documentId, fullDoc?._id, fullDoc?.signature_data?.signature_request_id, fullDoc?.signature_data?.signature_status]);

  // Initial signature status check (once per document)
  useEffect(() => {
    if (!fullDoc || !documentId || fullDoc._id !== documentId) return;
    if (!fullDoc.signature_data?.signature_request_id) return;
    if (lastCheckedDocIdRef.current === fullDoc._id) return;
    lastCheckedDocIdRef.current = fullDoc._id;

    const checkSignatureStatus = async () => {
      try {
        const status = await getSignatureStatus(documentId);
        setFullDoc((prev) => {
          if (!prev) return prev;
          const signers = (status.signers || prev.signature_data?.signers || []).map((s) => ({
            email: s.email,
            name: s.name,
            role: (s.role || "signer") as "seller" | "guarantor" | "buyer" | "signer",
            status: s.status,
            signed_at: s.signed_at || undefined,
          }));
          return {
            ...prev,
            signature_data: {
              ...prev.signature_data,
              signature_status: status.status === "cancelled" ? "declined" : status.status,
              signers,
            },
          } as Document;
        });
      } catch (err) {
        console.log("Error checking signature status:", err);
      }
    };

    checkSignatureStatus();
  }, [fullDoc?._id, fullDoc?.signature_data?.signature_request_id, documentId]);

  // Reset check ref when document id changes
  useEffect(() => {
    lastCheckedDocIdRef.current = null;
  }, [documentId]);

  const canSendForSign =
    fullDoc && (fullDoc.fileHtml?.value || isPdfDocument(fullDoc)) && allSigners.length > 0;

  const handleSendForSign = useCallback(async () => {
    if (!canSendForSign || !documentId) {
      toast.error("Document content or signers missing");
      return;
    }
    setSignLoading(true);
    try {
      const containerRect = documentContainerRef.current?.getBoundingClientRect();
      const pageHeightPx = containerRect
        ? containerRect.width * (PAGE_HEIGHT_POINTS / PAGE_WIDTH_POINTS)
        : PAGE_HEIGHT_POINTS;
      const pxToPointsX = containerRect ? PAGE_WIDTH_POINTS / containerRect.width : 1;
      const pxToPointsY = containerRect ? PAGE_HEIGHT_POINTS / pageHeightPx : 1;

      const signers: Signer[] = allSigners.map((s, idx) => {
        const pos = signatureBoxPositions[s.key] ?? {
          x: 50,
          y: 700 + idx * 60,
          width: 200,
          height: 50,
        };
        let pageIndex = 0;
        let yOnPage = pos.y;
        if (containerRect) {
          pageIndex = Math.floor(pos.y / pageHeightPx);
          yOnPage = (pos.y % pageHeightPx) * pxToPointsY;
        }
        const x = Math.round(pos.x * pxToPointsX);
        const w = Math.round(Math.max(pos.width * pxToPointsX, 200));
        const h = Math.round(Math.max(pos.height * pxToPointsY, 50));
        return {
          email: s.email,
          name: s.name,
          role: s.role,
          order: s.order,
          fields: [
            {
              id: idx + 1,
              type: "SIGNATURE" as const,
              currentValue: "",
              position: {
                docNumber: 0,
                pageIndex,
                x,
                y: Math.round(yOnPage),
                width: w,
                height: h,
              },
            },
          ],
        };
      });
      const fileContent = fullDoc?.fileHtml?.value;
      await initiateSignature(
        documentId,
        signers,
        fileContent,
        "Please review and sign this document.",
        documentTitleForSigner?.trim() || "Document"
      );
      toast.success("Signature request sent. Status will update automatically.");
      // Navigate back to document list page
      router.push(`/application-offer/${offerId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send for signature");
    } finally {
      setSignLoading(false);
    }
  }, [
    canSendForSign,
    fullDoc,
    documentId,
    allSigners,
    signatureBoxPositions,
    offerId,
    router,
    documentTitleForSigner,
  ]);

  if (!offerId || !documentId) {
    return (
      <DashboardShell>
        <div className="p-6 text-gray-500">Missing offer or document.</div>
      </DashboardShell>
    );
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  const fileFileName = fullDoc?.file_name ?? "Document";
  const signatureStatus = fullDoc?.signature_data?.signature_status || "not_initiated";
  const signatureRequestId = fullDoc?.signature_data?.signature_request_id;
  const signers = fullDoc?.signature_data?.signers || [];
  const showStatus = signatureRequestId && signatureStatus !== "not_initiated";
  const allCompleted = signers.length > 0 && signers.every((s) => s.status === "completed");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "declined":
        return "Declined";
      case "not_initiated":
        return "Not Initiated";
      default:
        return status;
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate pr-4">{fileFileName}</h1>
              {showStatus && (
                <div className="mt-2 flex items-center gap-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(signatureStatus)}`}>
                    Status: {getStatusLabel(signatureStatus)}
                  </span>
                  {signers.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {signers.filter((s) => s.status === "completed").length} of {signers.length} signed
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/application-offer/${offerId}`)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back
              </button>
            </div>
          </div>
          <div className="px-4 py-2 text-sm text-gray-500 border-b">
            Drag each signer box to the desired position on the document, then click Send for
            signature.
          </div>

          {/* Stipulation type selected at upload – this is the name shown to the signer */}
          {documentTitleForSigner ? (
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <span className="text-sm font-medium text-gray-900">{documentTitleForSigner}</span>
            </div>
          ) : null}

          {/* Add signers form: multiple merchants / ISOs */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add signers (Merchant / ISO)</h3>
            <div className="flex flex-wrap items-end gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  value={addSignerName}
                  onChange={(e) => setAddSignerName(e.target.value)}
                  placeholder="Signer name"
                  className="block w-40 rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email *</label>
                <input
                  type="email"
                  value={addSignerEmail}
                  onChange={(e) => setAddSignerEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="block w-48 rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select
                  value={addSignerType}
                  onChange={(e) => setAddSignerType(e.target.value as "Merchant" | "ISO")}
                  className="block w-28 rounded border border-gray-300 px-2 py-1.5 text-sm"
                >
                  <option value="Merchant">Merchant</option>
                  <option value="ISO">ISO</option>
                </select>
              </div>
              <button
                type="button"
                onClick={addSigner}
                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
              >
                Add signer
              </button>
            </div>
            {additionalSigners.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {additionalSigners.map((s) => (
                  <span
                    key={s.key}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800"
                  >
                    {s.label}
                    <button
                      type="button"
                      onClick={() => removeAdditionalSigner(s.key)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-200"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto min-h-0 p-4">
            {fullDoc && isPdfDocument(fullDoc) && !fullDoc.fileHtml?.value && !pdfPreviewUrl ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                <p className="text-sm text-gray-500">Loading PDF...</p>
              </div>
            ) : fullDoc?.fileHtml?.value ? (
              <div className="relative inline-block w-full" style={{ maxWidth: "210mm" }}>
                <div
                  ref={documentContainerRef}
                  className="a4 bg-white shadow-lg mx-auto"
                  style={{ width: "210mm" }}
                  dangerouslySetInnerHTML={{ __html: fullDoc.fileHtml.value }}
                />
                {allSigners.map((s) => {
                  const pos = signatureBoxPositions[s.key];
                  if (!pos) return null;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      aria-label={`Drag to position ${s.label} signature`}
                      className="absolute border-2 border-dashed border-blue-500 bg-blue-50/90 cursor-grab active:cursor-grabbing rounded flex items-center justify-center text-xs font-medium text-blue-700 pointer-events-auto px-1 truncate"
                      style={{
                        left: pos.x,
                        top: pos.y,
                        width: pos.width,
                        height: pos.height,
                      }}
                      title={s.label}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        dragOffsetRef.current = {
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        };
                        setDraggingKey(s.key);
                      }}
                    >
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : pdfPreviewUrl ? (
              <div className="relative inline-block w-full" style={{ maxWidth: "210mm" }}>
                <div
                  ref={documentContainerRef}
                  className="bg-white shadow-lg mx-auto overflow-hidden flex flex-col"
                  style={{ width: "210mm", minHeight: "297mm" }}
                >
                  <iframe
                    title="PDF preview"
                    src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                    className="w-full border-0 flex-1 min-h-[80vh]"
                  />
                </div>
                {allSigners.map((s) => {
                  const pos = signatureBoxPositions[s.key];
                  if (!pos) return null;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      aria-label={`Drag to position ${s.label} signature`}
                      className="absolute border-2 border-dashed border-blue-500 bg-blue-50/90 cursor-grab active:cursor-grabbing rounded flex items-center justify-center text-xs font-medium text-blue-700 pointer-events-auto px-1 truncate"
                      style={{
                        left: pos.x,
                        top: pos.y,
                        width: pos.width,
                        height: pos.height,
                      }}
                      title={s.label}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        dragOffsetRef.current = {
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        };
                        setDraggingKey(s.key);
                      }}
                    >
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                This document cannot be sent for signature (no HTML content and not a PDF).
              </div>
            )}
          </div>
          {showStatus && signers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Signer Status</h3>
              <div className="space-y-2">
                {signers.map((signer, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {signer.name} ({signer.email}) - {signer.role}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      signer.status === "completed" 
                        ? "bg-green-100 text-green-800" 
                        : signer.status === "declined"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {signer.status === "completed" ? "✓ Signed" : signer.status === "declined" ? "✗ Declined" : "⏳ Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {canSendForSign && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => router.push(`/application-offer/${offerId}`)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendForSign}
                disabled={signLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {signLoading ? "Sending..." : "Send for signature"}
              </button>
            </div>
          )}
          {allCompleted && (
            <div className="px-6 py-4 border-t border-gray-200 bg-green-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">
                  ✓ All signers have completed signing this document.
                </span>
                <button
                  type="button"
                  onClick={() => router.push(`/application-offer/${offerId}`)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Return to Offer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
