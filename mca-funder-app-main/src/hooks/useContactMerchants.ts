import { useState, useEffect } from "react";
import { getContactMerchants, addContactMerchant, removeContactMerchant } from "@/lib/api/contacts";
import { Merchant } from "@/types/merchant";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export function useContactMerchants(contactId: string) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const response = await getContactMerchants(contactId);
      if (response.success) {
        setMerchants(response.data.docs || []);
        setError(null);
      } else {
        setError(new Error(response.message || "Failed to fetch merchants"));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch merchants"));
    } finally {
      setLoading(false);
    }
  };

  const addMerchant = async (merchantId: string) => {
    try {
      const response = await addContactMerchant(contactId, merchantId);
      if (response.success) {
        await fetchMerchants();
      } else {
        throw new Error(response.message || "Failed to add merchant");
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to add merchant"));
      throw err;
    }
  };

  const removeMerchant = async (merchantId: string) => {
    try {
      const response = await removeContactMerchant(contactId, merchantId);
      if (response.success) {
        await fetchMerchants();
      } else {
        throw new Error(response.message || "Failed to remove merchant");
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to remove merchant"));
      throw err;
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, [contactId]);

  return {
    merchants,
    loading,
    error,
    refreshMerchants: fetchMerchants,
    addMerchant,
    removeMerchant,
  };
} 