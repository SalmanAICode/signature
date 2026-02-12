"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  getDocumentById,
  initiateSignature,
  getSignatureStatus,
  downloadDocument as downloadDocumentApi,
  Signer,
} from "@/lib/api/documents";
import { Document } from "@/types/document";
import { toast } from "react-hot-toast";
import useAuthStore from "@/lib/store/auth";

// Helper function to check if document is PDF
const isPdfDocument = (doc: Document | null): boolean => {
  return doc?.file_type === "application/pdf" || doc?.file_name?.toLowerCase().endsWith(".pdf") || false;
};

export default function Page() {
  const params = useParams();
  const id = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [signatureInitiated, setSignatureInitiated] = useState(false);
  /** Draggable sign box positions (px relative to document container). Used when sending for signature. */
  const [signatureBoxPositions, setSignatureBoxPositions] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});
  const [draggingRole, setDraggingRole] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const getAccessToken = useAuthStore((state) => state.getAccessToken);
  const wsRef = useRef<WebSocket | null>(null);
  const lastCheckedDocIdRef = useRef<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) {
        setError("Document ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const doc = await getDocumentById(id);
        setDocument(doc);
        // Check if signature has already been initiated
        if (doc.signature_data?.signature_request_id || doc.signature_data?.signature_status === 'pending' || doc.signature_data?.signature_status === 'completed') {
          setSignatureInitiated(true);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch document";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  // Fetch PDF blob for preview when document has no fileHtml but is a PDF (e.g. from application offer / Word template)
  useEffect(() => {
    if (!document || !id) return;
    const needsPdfFetch =
      !document.fileHtml?.value &&
      !document.signature_data?.download_url &&
      isPdfDocument(document);

    if (!needsPdfFetch) {
      setPdfPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    let revoked = false;
    let objectUrl: string | null = null;
    const load = async () => {
      try {
        const blob = await downloadDocumentApi(id);
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfPreviewUrl(objectUrl);
      } catch {
        if (!revoked) setPdfPreviewUrl(null);
      }
    };
    load();
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPdfPreviewUrl(null);
    };
  }, [document?._id, document?.fileHtml?.value, document?.signature_data?.download_url, document?.file_type, document?.file_name, id]);

  // Initialize default positions at top of document
  useEffect(() => {
    if (document?.signature_data?.download_url) return;
    setSignatureBoxPositions((prev) => {
      const updated = { ...prev };
      if (!updated.seller) {
        updated.seller = { x: 50, y: 50, width: 200, height: 50 };
      }
      if (!updated.buyer) {
        updated.buyer = { x: 350, y: 50, width: 200, height: 50 };
      }
      return updated;
    });
  }, [document?.signature_data?.download_url]);

  // Measure initial sign box positions from DOM (when document HTML is ready, before send)
  useEffect(() => {
    if (!document?.fileHtml?.value || document?.signature_data?.download_url || !documentContainerRef.current) return;
    const container = documentContainerRef.current;
    const timer = setTimeout(() => {
      const containerRect = container.getBoundingClientRect();
      const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};
      for (const role of ["seller", "buyer"]) {
        const block = container.querySelector(`.signature-block[data-role="${role}"]`);
        const line = block?.querySelector(".signature-line") as HTMLElement | null;
        if (line) {
          const r = line.getBoundingClientRect();
          positions[role] = {
            x: r.left - containerRect.left,
            y: r.top - containerRect.top,
            width: Math.max(r.width, 200),
            height: Math.max(r.height, 50),
          };
        } else {
          // Default to top of document if no signature block found
          positions[role] = {
            x: role === "seller" ? 50 : 350,
            y: 50,
            width: 200,
            height: 50,
          };
        }
      }
      if (Object.keys(positions).length) setSignatureBoxPositions((prev) => ({ ...prev, ...positions }));
    }, 100);
    return () => clearTimeout(timer);
  }, [document?.fileHtml?.value, document?.signature_data?.download_url]);

  // Global drag handlers when user is dragging a sign box
  useEffect(() => {
    if (!draggingRole || !documentContainerRef.current) return;
    const container = documentContainerRef.current;
    let isDragging = true;
    
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();
      const containerRect = container.getBoundingClientRect();
      setSignatureBoxPositions((prev) => {
        const cur = prev[draggingRole];
        if (!cur) return prev;
        // Calculate position relative to container (getBoundingClientRect already accounts for scroll)
        const x = Math.max(0, Math.min(
          e.clientX - containerRect.left - dragOffsetRef.current.x,
          containerRect.width - cur.width
        ));
        const y = Math.max(0, e.clientY - containerRect.top - dragOffsetRef.current.y);
        return { ...prev, [draggingRole]: { ...cur, x, y } };
      });
    };
    
    const onUp = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = false;
      setDraggingRole(null);
    };
    
    // Use capture phase to ensure we catch events even if mouse leaves element
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("mouseup", onUp, true);
    // Also listen for mouseleave on document to handle edge cases
    document.addEventListener("mouseleave", onUp, true);
    
    return () => {
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("mouseup", onUp, true);
      document.removeEventListener("mouseleave", onUp, true);
    };
  }, [draggingRole]);

  // WebSocket connection for real-time signature updates
  useEffect(() => {
    if (!id) return;

    const token = getAccessToken();
    if (!token) {
      // No token available, skip WebSocket connection
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      try {
        // Get backend URL from env config
        const backendUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!backendUrl) {
          // Silently fail if URL not configured - don't break the app
          return;
        }

        // Construct WebSocket URL with token and document path
        const wsProtocol = backendUrl.startsWith("https") ? "wss" : "ws";
        const wsUrl = backendUrl.replace(/^https?:\/\//, "");
        const fullWsUrl = `${wsProtocol}://${wsUrl}/api/v1/documents?token=${token}`;

        ws = new WebSocket(fullWsUrl);

        ws.onopen = () => {
          console.log("Document WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle WebSocket response format: { status: 200, dataList: {...} }
            const message = Array.isArray(data.dataList) ? data.dataList[0] : data.dataList || data;

            // Check if this is a signature update for this document
            if (message?.type === "document_signature_update" && message?.documentId === id) {
              const signers = message.signers || [];

              // Update document state – useEffect will handle UI update
              setDocument((prevDoc) => {
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
            }
          } catch (error) {
            console.log("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = () => {
          // Silently handle WebSocket errors - don't break the app
          // The connection will be retried on close if needed
        };

        ws.onclose = (event) => {
          // Only reconnect if not unauthorized and we still have a token
          if (event.code !== 4001 && getAccessToken()) {
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, 3000);
          }
        };

        wsRef.current = ws;
      } catch (error) {
        // Silently handle connection errors
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
  }, [id, getAccessToken]);

  // Update UI with signature status – runs after React renders when signers change
  const updateSignatureStatusUI = useCallback((signers: Array<{ role?: string; status?: string; signed_at?: string | Date }>) => {
    if (!documentContainerRef.current || !signers?.length) return;

    signers.forEach((signer) => {
      const role = signer.role || "signer";
      const statusDiv = documentContainerRef.current?.querySelector(
        `#${role}-signature-status`
      ) as HTMLElement | null;
      const button = documentContainerRef.current?.querySelector(
        `button[data-role="${role}"]`
      ) as HTMLButtonElement | null;

      if (signer.status === "completed") {
        if (statusDiv) {
          statusDiv.style.display = "block";
          statusDiv.textContent = signer.signed_at
            ? `✓ Signed on ${new Date(signer.signed_at).toLocaleDateString()}`
            : "✓ Signed";
          statusDiv.style.color = "#059669";
        }
        if (button) button.style.display = "none";
      } else if (signer.status === "pending") {
        if (statusDiv) {
          statusDiv.style.display = "block";
          statusDiv.textContent = "⏳ Pending signature";
          statusDiv.style.color = "#ea580c";
        }
      }
    });
  }, []);

  // Real-time UI update when signature_data changes (from WebSocket, polling, or initial fetch)
  useEffect(() => {
    if (!document?.signature_data?.signers?.length) return;

    // Run after paint so DOM from dangerouslySetInnerHTML is ready
    const raf = requestAnimationFrame(() => {
      if (documentContainerRef.current) {
        updateSignatureStatusUI(document.signature_data!.signers!);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [document?.signature_data?.signers, document?.signature_data?.signature_status, updateSignatureStatusUI]);

  // Polling fallback: poll signature-status every 10s when document has pending signatures
  // Ensures updates appear without refresh even if WebSocket/webhook fail
  useEffect(() => {
    if (!id || !document?.signature_data?.signature_request_id) return;
    const status = document.signature_data?.signature_status;
    if (status === "completed" || status === "declined") return; // No need to poll when done

    const pollStatus = async () => {
      try {
        const result = await getSignatureStatus(id);
        const signers = (result.signers || []).map((s) => ({
          email: s.email,
          name: s.name,
          role: (s.role || "signer") as "seller" | "guarantor" | "buyer" | "signer",
          status: s.status,
          signed_at: s.signed_at || undefined,
        }));
        setDocument((prev) => {
          if (!prev || prev._id !== id) return prev;
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
  }, [id, document?._id, document?.signature_data?.signature_request_id, document?.signature_data?.signature_status]);

  // Helper functions to get signer info - try document object first, then HTML
  const getSignerEmail = (role: string, doc: Document): string => {
    // First try document object (most reliable)
    switch (role) {
      case "seller":
        // Try multiple paths in document object
        const merchantEmail =
          (doc.merchant as any)?.primary_contact?.email ||
          doc.merchant?.primary_contact?.email ||
          (doc.merchant as any)?.email ||
          doc.merchant?.email ||
          "";
        // if (merchantEmail) return merchantEmail;
        if (merchantEmail) return 'limbo2568@gmail.com';
        break;
      case "guarantor":
        // Try multiple paths in document object
        const guarantor =
          (doc.merchant as any)?.primary_contact?.email ||
          doc.merchant?.primary_contact?.email ||
          (doc.merchant as any)?.email ||
          doc.merchant?.email ||
          "";
        if (guarantor) return guarantor;
        break;
      case "buyer":
        const funderEmail =
          (doc.funder as any)?.email || doc.funder?.email || "";
        if (funderEmail) return 'adrainalex530@gmail.com';
        break;
    }

    // If not found in document object, try extracting from HTML
    if (documentContainerRef.current) {
      try {
        const allSections = documentContainerRef.current.querySelectorAll(".section-title");
        switch (role) {
          case "seller":
          case "guarantor":
            // Templates use "I. Merchant Information" (not "Seller")
            for (const section of Array.from(allSections)) {
              const text = section.textContent ?? "";
              if (text.includes("Merchant Information") || text.includes("Seller")) {
                const container = section.nextElementSibling;
                if (container) {
                  for (const row of Array.from(container.querySelectorAll("tr"))) {
                    if (row.textContent?.includes("Primary Contact Email")) {
                      const emailCell = row.querySelector("td.value");
                      const email = emailCell?.textContent?.trim();
                      if (email && email !== "N/A" && email.includes("@")) return "limbo2568@gmail.com";
                    }
                  }
                }
              }
            }
            break;
          case "buyer":
            // Templates use "V. Funder (Funder) Information" (not "Buyer" in section title)
            const funderSection = Array.from(allSections).find((el) => {
              const t = el.textContent ?? "";
              return t.includes("Funder") || t.includes("Buyer");
            });
            if (funderSection) {
              const container = funderSection.nextElementSibling;
              if (container) {
                for (const row of Array.from(container.querySelectorAll("tr"))) {
                  if (row.textContent?.includes("Funder Email")) {
                    const emailCell = row.querySelector("td.value");
                    const email = emailCell?.textContent?.trim();
                    if (email && email !== "N/A" && email.includes("@")) return "mzml0306@gmail.com";
                  }
                }
              }
            }
            break;
        }
      } catch (err) {
        console.log("Error extracting email from HTML:", err);
      }
    }

    return "";
  };

  const getSignerName = (role: string, doc: Document): string => {
    // First try document object (most reliable)
    switch (role) {
      case "seller":
      case "guarantor":
        // Try multiple paths in document object
        if (doc.merchant?.primary_contact) {
          const fullName =
            `${doc.merchant.primary_contact.first_name || ""} ${doc.merchant.primary_contact.last_name || ""}`.trim();
          if (fullName) return fullName;
        }
        if (doc.merchant?.primary_contact) {
          const fullName =
            `${doc.merchant.primary_contact.first_name || ""} ${doc.merchant.primary_contact.last_name || ""}`.trim();
          if (fullName) return fullName;
        }
        if (doc?.merchant?.name) return doc?.merchant?.name;
        break;
      case "buyer":
        if (doc?.funder?.name) return doc?.funder?.name;
        break;
    }

    // If not found in document object, try extracting from HTML
    if (documentContainerRef.current) {
      try {
        const root = documentContainerRef.current;
        const allSections = root.querySelectorAll(".section-title");
        switch (role) {
          case "seller":
          case "guarantor": {
            // Signature block: "Seller: {{merchant.name}}" – templates have no data-role
            for (const block of Array.from(root.querySelectorAll(".signature-block"))) {
              const text = block.textContent ?? "";
              if (text.includes("Seller:")) {
                const m = /Seller:\s*([^\n]+)/i.exec(text);
                const name = m?.[1]?.trim();
                if (name && name !== "N/A") return name;
              }
            }
            // Merchant info table: "I. Merchant Information" / "Primary Contact Name"
            for (const section of Array.from(allSections)) {
              const t = section.textContent ?? "";
              if (t.includes("Merchant Information") || t.includes("Seller")) {
                const container = section.nextElementSibling;
                if (container) {
                  for (const row of Array.from(container.querySelectorAll("tr"))) {
                    if (row.textContent?.includes("Primary Contact Name")) {
                      const name = row.querySelector("td.value")?.textContent?.trim();
                      if (name && name !== "N/A") return name;
                    }
                  }
                }
              }
            }
            // Fallback: merchant legal name
            for (const section of Array.from(allSections)) {
              if ((section.textContent ?? "").includes("Merchant Information")) {
                const container = section.nextElementSibling;
                if (container) {
                  for (const row of Array.from(container.querySelectorAll("tr"))) {
                    if (row.textContent?.includes("Merchant's Legal Name")) {
                      const name = row.querySelector("td.value")?.textContent?.trim();
                      if (name && name !== "N/A") return name;
                    }
                  }
                }
                break;
              }
            }
            break;
          }
          case "buyer": {
            // Signature block: "Buyer: {{funder.name}}" – no data-role on button
            for (const block of Array.from(root.querySelectorAll(".signature-block"))) {
              const text = block.textContent ?? "";
              if (text.includes("Buyer:")) {
                const m = /Buyer:\s*([^\n]+)/i.exec(text);
                const name = m?.[1]?.trim();
                if (name && name !== "N/A") return name;
              }
            }
            // Funder info table: "V. Funder (Funder) Information" / "Funder Name"
            const funderSection = Array.from(allSections).find((el) => {
              const t = el.textContent ?? "";
              return t.includes("Funder") || t.includes("Buyer");
            });
            if (funderSection) {
              const container = funderSection.nextElementSibling;
              if (container) {
                for (const row of Array.from(container.querySelectorAll("tr"))) {
                  if (row.textContent?.includes("Funder Name")) {
                    const name = row.querySelector("td.value")?.textContent?.trim();
                    if (name && name !== "N/A") return name;
                  }
                }
              }
            }
            break;
          }
        }
      } catch (err) {
        console.log("Error extracting name from HTML:", err);
      }
    }

    return "";
  };

  const [signatureButtonDisabled, setSignatureButtonDisabled] = useState(false);
  // Handle signature button click - moved outside useEffect
  const handleBulkSignatureClick = async () => {
    if (!id || !document) return;

    try {
      setSignatureButtonDisabled(true);
      // Roles we want to process in one click
      const rolesToProcess = ["seller", "buyer"];
      const finalSignersList: Signer[] = [];

      for (const role of rolesToProcess) {
        // Extract Data
        let signerEmail = getSignerEmail(role, document);
        let signerName = getSignerName(role, document);

        // Fallback to HTML extraction if needed
        if ((!signerEmail || !signerName) && documentContainerRef.current) {
          const htmlText =
            documentContainerRef.current.innerText ||
            documentContainerRef.current.textContent ||
            "";

          if (role === "seller") {
            if (!signerEmail) {
              const emailMatch =
                /Primary Contact Email[:\s]+([^\s\n]+@[^\s\n]+)/i.exec(htmlText);
              if (emailMatch?.[1]) signerEmail = emailMatch[1].trim();
            }
            if (!signerName) {
              const nameMatch = /Primary Contact Name[:\s]+([^\n]+)/i.exec(htmlText);
              if (nameMatch?.[1]) signerName = nameMatch[1].trim();
              if (!signerName) {
                const blocks = documentContainerRef.current.querySelectorAll(".signature-block");
                for (const block of Array.from(blocks)) {
                  const txt = block.textContent || "";
                  if (txt.includes("Seller:")) {
                    const m = /Seller[:\s]+([^\n]+)/i.exec(txt);
                    if (m?.[1]) {
                      signerName = m[1].trim();
                      break;
                    }
                  }
                }
              }
            }
          } else if (role === "buyer") {
            if (!signerEmail) {
              const emailMatch =
                /Funder Email[:\s]+([^\s\n]+@[^\s\n]+)/i.exec(htmlText) ||
                /Buyer Email[:\s]+([^\s\n]+@[^\s\n]+)/i.exec(htmlText);
              if (emailMatch?.[1]) signerEmail = emailMatch[1].trim();
            }
            if (!signerName) {
              const nameMatch =
                /Funder Name[:\s]+([^\n]+)/i.exec(htmlText) ||
                /Buyer Name[:\s]+([^\n]+)/i.exec(htmlText);
              if (nameMatch?.[1]) signerName = nameMatch[1].trim();
              if (!signerName) {
                const blocks = documentContainerRef.current.querySelectorAll(".signature-block");
                for (const block of Array.from(blocks)) {
                  const txt = block.textContent || "";
                  if (txt.includes("Buyer:")) {
                    const m = /Buyer[:\s]+([^\n]+)/i.exec(txt);
                    if (m?.[1]) {
                      signerName = m[1].trim();
                      break;
                    }
                  }
                }
              }
            }
          }
        }

        if (!signerEmail || !signerName) {
          const missingFields = [];
          if (!signerEmail) missingFields.push("email");
          if (!signerName) missingFields.push("name");

          const errorMsg =
            `Unable to find signer ${missingFields.join(" and ")} for ${role}. ` +
            `The document may be missing ${role} information. ` +
            `Please check that the document template has been properly populated with ${role} details.`;

          throw new Error(errorMsg);
        }

        // Calculate Position and Page (use draggable sign box position if user set it)
        const defaultPositions: Record<
          string,
          { x: number; y: number; width: number; height: number }
        > = {
          seller: { x: 50, y: 50, width: 200, height: 50 },
          buyer: { x: 350, y: 50, width: 200, height: 50 },
          guarantor: { x: 50, y: 100, width: 200, height: 50 },
          signer: { x: 200, y: 50, width: 200, height: 50 },
        };

        let pos = defaultPositions[role] || defaultPositions.signer;
        let pageIndexFromDraggable: number | null = null;
        let yOnPageFromDraggable: number | null = null;

        // PDF A4 in points (backend Puppeteer uses format: 'A4', no margins → content = full page)
        const PAGE_WIDTH_POINTS = 595;
        const PAGE_HEIGHT_POINTS = 842;

        if (signatureBoxPositions[role] && documentContainerRef.current) {
          const containerRect = documentContainerRef.current.getBoundingClientRect();
          const p = signatureBoxPositions[role];
          // Use container aspect ratio so scale matches what user sees (same as PDF A4 ratio)
          const pageHeightPx = containerRect.width * (PAGE_HEIGHT_POINTS / PAGE_WIDTH_POINTS);
          const pageIndexFromY = Math.floor(p.y / pageHeightPx);
          const yOnPagePx = p.y % pageHeightPx;
          const yOnPagePoints = yOnPagePx * (PAGE_HEIGHT_POINTS / pageHeightPx);
          const pxToPointsX = PAGE_WIDTH_POINTS / containerRect.width;
          const pxToPointsY = PAGE_HEIGHT_POINTS / pageHeightPx;
          pos = {
            x: Math.round(p.x * pxToPointsX),
            y: Math.round(yOnPagePoints),
            width: Math.round(Math.max(p.width * pxToPointsX, 200)),
            height: Math.round(Math.max(p.height * pxToPointsY, 50)),
          };
          pageIndexFromDraggable = pageIndexFromY;
          yOnPageFromDraggable = yOnPagePoints;
        } else if (documentContainerRef.current) {
          try {
            const signatureElement = documentContainerRef.current.querySelector(
              `.signature-block[data-role="${role}"]`,
            ) as HTMLElement;

            if (signatureElement) {
              let signatureBlock: HTMLElement | null = signatureElement.closest(
                ".signature-block",
              ) as HTMLElement;

              if (!signatureBlock) {
                signatureBlock = signatureElement.parentElement;
              }

              if (signatureBlock) {
                const containerRect = documentContainerRef.current.getBoundingClientRect();
                let targetElement: HTMLElement | null = signatureBlock.querySelector(
                  "hr, .signature-line, [class*='signature-line'], [class*='signature'], [class*='line']",
                ) as HTMLElement;

                if (!targetElement) {
                  const divs = signatureBlock.querySelectorAll("div");
                  for (const div of Array.from(divs)) {
                    const style = window.getComputedStyle(div);
                    if (
                      style.borderTopWidth !== "0px" ||
                      style.borderBottomWidth !== "0px" ||
                      div.style.border ||
                      div.style.borderTop ||
                      div.style.borderBottom
                    ) {
                      targetElement = div as HTMLElement;
                      break;
                    }
                  }
                }

                if (!targetElement) {
                  targetElement = signatureBlock.querySelector(
                    "[style*='border'], [style*='underline'], u, .underline",
                  ) as HTMLElement;
                }

                if (!targetElement) {
                  targetElement = signatureBlock || signatureElement;
                }

                if (targetElement) {
                  const elementRect = targetElement.getBoundingClientRect();
                  const relativeX = elementRect.left - containerRect.left;
                  const relativeY = elementRect.top - containerRect.top;

                  const pageHeightPxDom =
                    containerRect.width * (PAGE_HEIGHT_POINTS / PAGE_WIDTH_POINTS);
                  const pxToPointsX = PAGE_WIDTH_POINTS / containerRect.width;
                  const pxToPointsY = PAGE_HEIGHT_POINTS / pageHeightPxDom;
                  const pageIndexDom = Math.floor(relativeY / pageHeightPxDom);
                  const yOnPagePxDom = relativeY % pageHeightPxDom;
                  const yOnPagePointsDom =
                    yOnPagePxDom * (PAGE_HEIGHT_POINTS / pageHeightPxDom);

                  pos = {
                    x: Math.round(relativeX * pxToPointsX),
                    y: Math.round(yOnPagePointsDom),
                    width: Math.round(Math.max(elementRect.width * pxToPointsX, 200)),
                    height: Math.round(
                      Math.max(elementRect.height * pxToPointsY, 50)
                    ),
                  };
                  pageIndexFromDraggable = pageIndexDom;
                  yOnPageFromDraggable = yOnPagePointsDom;
                }
              }
            }
          } catch (err) {
            console.log(`Error finding signature position for ${role}:`, err);
          }
        }

        // Page index and Y: RabbitSign uses top-left origin — Y = distance from top of page in points
        const pageHeightPoints = 842;
        const pageIndex =
          pageIndexFromDraggable !== null
            ? pageIndexFromDraggable
            : Math.floor(pos.y / pageHeightPoints);
        let yOnPage =
          yOnPageFromDraggable !== null
            ? yOnPageFromDraggable
            : pos.y % pageHeightPoints;
        // Y offset is applied in the backend from document HTML (compact = -6, classic/formal/modern = +195)
        const fieldPosition = {
          docNumber: 0,
          pageIndex,
          x: pos.x,
          y: yOnPage,
          width: pos.width,
          height: pos.height,
        };

        finalSignersList.push({
          email: signerEmail,
          name: signerName,
          role: role as "seller" | "guarantor" | "buyer" | "signer",
          order: role === "seller" ? 1 : 2,
          fields: [
            {
              id: finalSignersList.length + 1,
              type: "SIGNATURE",
              currentValue: "",
              position: fieldPosition,
            },
          ],
        });
      }

      // Single API Call for all signers
      await initiateSignature(
        id,
        finalSignersList,
        document?.fileHtml?.value,
        `Please review and sign the document. All parties have been notified.`,
      );

      // Hide button immediately after sending
      setSignatureInitiated(true);
      toast.success(`Signature requests sent to all parties.`);
      // Route back to document list page
      router.push("/document");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed";
      toast.error(errorMessage);
      setSignatureInitiated(false); // Allow retry on error
    } finally {
      setSignatureButtonDisabled(false);
    }
  };

  // Reset check ref when document id changes (navigation)
  useEffect(() => {
    lastCheckedDocIdRef.current = null;
  }, [id]);

  // Initial signature status check (once per document)
  useEffect(() => {
    if (!document || !id || document._id !== id) return;
    if (!document.signature_data?.signature_request_id) return;
    // Avoid re-running when setDocument triggers re-render
    if (lastCheckedDocIdRef.current === document._id) return;
    lastCheckedDocIdRef.current = document._id;

    const checkSignatureStatus = async () => {
      try {
        const status = await getSignatureStatus(id);
        setDocument((prev) => {
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
  }, [document?._id, document?.signature_data?.signature_request_id, id]);


  // Helper function to format data
  const formatValue = (
    value: string | undefined | null,
    fallback: string = "-",
  ) => {
    return value || fallback;
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Loading document...</div>
        </div>
      </DashboardShell>
    );
  }

  if (error || !document) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg text-red-600">
            {error || "Document not found"}
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Dummy data fallback when merchant data is not available
  const dummyData = {
    sellerName: "HOPE INC",
    dba: "HOPE FUNERAL HOME",
    businessType: "Corporation, GA",
    street: "165 CARNEGIE PLACE",
    cityState: "FAYETTEVILLE, GA",
    zip: "30214",
    mailingStreet: "402 WEBB DR",
    mailingCity: "FOREST PARK, GA",
    mailingZip: "30297",
    contactName: "GWENDOLYN WEBB ELLISON",
    contactTitle: "Owner",
    emails: ["hopeellison@outlook.com", "gwendolynwellison@gmail.com"],
    bankName: "SUNTRUST",
    routing: "061000104",
    account: "1000184347317",
    purchasePrice: "$40,000.00",
    initialAmount: "$3,264.44 / Weekly",
    purchasedAmount: "$58,760.00",
    percentage: "10%",
    frequency: "Weekly",
    originationFee: "$2,000.00",
    netFunded: "$38,000.00",
  };

  // Check if merchant data exists, otherwise use dummy data
  const hasMerchantData = document.merchant?.name;

  // Extract data from document or use dummy data
  const doc = hasMerchantData
    ? {
      sellerName: document.merchant.name || dummyData.sellerName,
      dba: document.merchant.dba_name || dummyData.dba,
      businessType: document.merchant.business_detail?.entity_type
        ? `${document.merchant.business_detail.entity_type}${document.merchant.business_detail.state_of_incorporation ? `, ${document.merchant.business_detail.state_of_incorporation}` : ""}`
        : dummyData.businessType,
      street:
        document.merchant.address_list?.[0]?.address_1 || dummyData.street,
      cityState: document.merchant.address_list?.[0]
        ? `${document.merchant.address_list[0].city}, ${document.merchant.address_list[0].state}`
        : dummyData.cityState,
      zip: document.merchant.address_list?.[0]?.zip || dummyData.zip,
      mailingStreet:
        document.merchant.address_list?.[1]?.address_1 ||
        document.merchant.address_list?.[0]?.address_1 ||
        dummyData.mailingStreet,
      mailingCity: document.merchant.address_list?.[1]
        ? `${document.merchant.address_list[1].city}, ${document.merchant.address_list[1].state}`
        : document.merchant.address_list?.[0]
          ? `${document.merchant.address_list[0].city}, ${document.merchant.address_list[0].state}`
          : dummyData.mailingCity,
      mailingZip:
        document.merchant.address_list?.[1]?.zip ||
        document.merchant.address_list?.[0]?.zip ||
        dummyData.mailingZip,
      contactName: document.merchant.primary_contact
        ? `${document.merchant.primary_contact.first_name} ${document.merchant.primary_contact.last_name}`
        : dummyData.contactName,
      contactTitle:
        document.merchant.primary_contact?.title || dummyData.contactTitle,
      emails: document.merchant.primary_contact?.email
        ? [document.merchant.primary_contact.email]
        : document.merchant.email
          ? [document.merchant.email]
          : dummyData.emails,
      bankName: dummyData.bankName,
      routing: dummyData.routing,
      account: dummyData.account,
      purchasePrice: dummyData.purchasePrice,
      initialAmount: dummyData.initialAmount,
      purchasedAmount: dummyData.purchasedAmount,
      percentage: dummyData.percentage,
      frequency: dummyData.frequency,
      originationFee: dummyData.originationFee,
      netFunded: dummyData.netFunded,
    }
    : dummyData;

  // Show Send button when document exists and has not been sent for signature
  const showSendButton = document && !document.signature_data?.signature_request_id && !signatureInitiated;

  return (
    <DashboardShell>
      <div className="flex flex-col items-center py-4 w-full gap-4">
        {/* Sticky Send button bar - always visible for documents not yet sent */}
        {showSendButton && (
          <div className="sticky top-0 z-10 w-full max-w-[210mm] flex justify-between items-center py-3 bg-white/95 backdrop-blur shadow-sm -mx-4 px-4 rounded-lg">
          <h2 className="text-2xl font-bold">Sale of Future Receipts Agreement</h2>
            <button
              onClick={handleBulkSignatureClick}
              disabled={signatureButtonDisabled}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {signatureButtonDisabled ? "Sending..." : "Send Document for Signature"}
            </button>
          </div>
        )}

        {/* Document display with draggable sign boxes when sending for signature */}
        <div className="w-full max-w-[210mm] flex justify-center">
          <div className="relative inline-block">
            <div
              ref={documentContainerRef}
              className="a4 bg-white shadow-lg relative"
            >
              {document?.fileHtml?.value ? (
                <div
                  dangerouslySetInnerHTML={{ __html: document.fileHtml.value }}
                />
              ) : document?.signature_data?.download_url ? (
                <iframe
                  src={`${document.signature_data.download_url}#toolbar=0&navpanes=0`}
                  className="w-full min-h-[297mm] border-0"
                  style={{ width: '210mm', minHeight: '297mm' }}
                  title="Document preview"
                />
              ) : pdfPreviewUrl && isPdfDocument(document) ? (
                <iframe
                  src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                  className="w-full min-h-[297mm] border-0"
                  style={{ width: '210mm', minHeight: '297mm' }}
                  title="Document preview"
                />
              ) : isPdfDocument(document) ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 mb-4">Loading document preview...</p>
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Document preview not available. Please download to view.
                </div>
              )}
              {showSendButton &&
                !document?.signature_data?.download_url &&
                (["seller", "buyer"] as const).map(
                  (role) =>
                    signatureBoxPositions[role] && (
                      <div
                        key={role}
                        role="button"
                        tabIndex={0}
                        aria-label={`Drag to position ${role} signature`}
                        className="absolute border-2 border-dashed border-blue-500 bg-blue-50/80 cursor-grab active:cursor-grabbing rounded flex items-center justify-center text-xs font-medium text-blue-700 pointer-events-auto z-10"
                        style={{
                          position: 'absolute',
                          left: `${signatureBoxPositions[role].x}px`,
                          top: `${signatureBoxPositions[role].y}px`,
                          width: `${signatureBoxPositions[role].width}px`,
                          height: `${signatureBoxPositions[role].height}px`,
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          dragOffsetRef.current = {
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          };
                          setDraggingRole(role);
                        }}
                        onMouseLeave={(e) => {
                          // Don't stop dragging if mouse leaves - let global handler manage it
                          if (draggingRole === role) {
                            e.preventDefault();
                          }
                        }}
                      >
                        {role === "seller" ? "Seller sign here" : "Buyer sign here"}
                      </div>
                    )
                )}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .a4 {
          width: 210mm;
          min-height: 297mm;
          background: white;
          // padding: 10mm;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          font-size: 12px;
          color: #000;
          margin: 0 auto;
          position: relative;
        }

        @media print {
          body {
            background: none;
          }
          .a4 {
            box-shadow: none;
            margin: 0 auto;
          }
        }
      `}</style>
    </DashboardShell>
  );
}
