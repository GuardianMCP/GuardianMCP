import { useEffect, useState, useCallback } from 'react';
import { API_URL } from '@/lib/constants';

interface ScanEvent {
  type: string;
  data: Record<string, unknown>;
}

export function useScanSSE(scanId: string | null) {
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!scanId) return;

    const token = sessionStorage.getItem('accessToken');
    const url = `${API_URL}/scans/${scanId}/stream?token=${token}`;
    const source = new EventSource(url);

    source.onopen = () => setIsConnected(true);

    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setEvents((prev) => [...prev, parsed]);
      } catch {
        // ignore
      }
    };

    source.onerror = () => {
      setIsConnected(false);
      source.close();
    };

    return () => {
      source.close();
      setIsConnected(false);
    };
  }, [scanId]);

  useEffect(() => {
    return connect();
  }, [connect]);

  return { events, isConnected };
}
