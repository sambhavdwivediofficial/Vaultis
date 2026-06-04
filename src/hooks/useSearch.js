import { useState, useEffect, useCallback } from "react";
import { debounce } from "../utils/helpers.js";

export function useSearch(searchFn, delay = 300) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (q) => {
      if (!q.trim()) { setResults([]); setLoading(false); return; }
      setLoading(true);
      try {
        const res = await searchFn(q);
        setResults(res || []);
      } catch { setResults([]); }
      setLoading(false);
    }, delay),
    [searchFn, delay]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return { query, setQuery, results, loading };
}