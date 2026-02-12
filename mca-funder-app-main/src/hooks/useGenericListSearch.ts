import { useState, useEffect, useRef } from 'react';

interface UseGenericListSearchProps<TFilter> {
  currentQuery: TFilter;
  onFilterChange: (filter: TFilter) => void;
  debounceMs?: number;
}

export function useGenericListSearch<TFilter extends Record<string, any>>({
  currentQuery,
  onFilterChange,
  debounceMs = 300,
}: UseGenericListSearchProps<TFilter>) {
  const [localSearchFilter, setLocalSearchFilter] = useState(currentQuery.filter?.search ?? "");
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync local search with external query changes
  useEffect(() => {
    setLocalSearchFilter(currentQuery.filter?.search ?? "");
  }, [currentQuery.filter?.search]);

  // Debounced search handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    
    const value = e.target.value;
    setLocalSearchFilter(value);
    setSearchLoading(true);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      onFilterChange({
        ...currentQuery.filter,
        search: value,
      });
      setSearchLoading(false);
    }, debounceMs);
  };

  // Clear search handler
  const handleClearSearch = () => {
    setLocalSearchFilter("");
    setSearchLoading(true);
    onFilterChange({
      ...currentQuery.filter,
      search: "",
    });
    setSearchLoading(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return {
    localSearchFilter,
    searchLoading,
    handleSearchChange,
    handleClearSearch,
  };
} 