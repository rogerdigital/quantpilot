import { useEffect, useState } from 'react';

type SearchParamsSetter = (nextInit: URLSearchParams, navigateOptions?: { replace?: boolean }) => void;

export function useSyncedQuerySelection(options: {
  itemIds: string[];
  queryKey: string;
  requestedId: string;
  searchParams: URLSearchParams;
  setSearchParams: SearchParamsSetter;
}) {
  const {
    itemIds,
    queryKey,
    requestedId,
    searchParams,
    setSearchParams,
  } = options;
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!itemIds.length) {
      setSelectedId('');
      return;
    }
    if (requestedId && itemIds.includes(requestedId) && selectedId !== requestedId) {
      setSelectedId(requestedId);
      return;
    }
    if (!selectedId || !itemIds.includes(selectedId)) {
      setSelectedId(requestedId && itemIds.includes(requestedId) ? requestedId : itemIds[0]);
    }
  }, [itemIds, requestedId, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    if (searchParams.get(queryKey) === selectedId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(queryKey, selectedId);
    setSearchParams(nextParams, { replace: true });
  }, [queryKey, searchParams, selectedId, setSearchParams]);

  return {
    selectedId,
    setSelectedId,
  };
}
