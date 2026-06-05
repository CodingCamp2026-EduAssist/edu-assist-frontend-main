import { useState, useEffect, useCallback, useRef } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const useSSE = (url) => {
    const [data, setData] = useState(null);

    const [error, setError] = useState(null);

    const [isConnected, setIsConnected] = useState(false);

    const eventSourceRef = useRef(null);

    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        try {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            const eventSource = new EventSource(`${BASE_URL}/${url}`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log("SSE connection opened");
                setIsConnected(true);
                setError(null);
            };

            eventSource.onmessage = (event) => {
                try {
                    const parsedData = JSON.parse(event.data);
                    setData(parsedData);
                } catch (parseError) {
                    console.error("Error parsing SSE data:", parseError);
                    setError("Data parsing error");
                }
            };

            eventSource.onerror = (event) => {
                console.error("SSE connection error:", event);
                setIsConnected(false);

                if (eventSource.readyState === EventSource.CLOSED) {
                    setError("Connection lost. Attempting to reconnect...");

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, 3000);
                }
            };
        } catch (err) {
            console.error("Error creating SSE connection:", err);
            setError("Connection creation error");
        }
    }, [url]);

    const disconnect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        setIsConnected(false);
    }, []);

    // useEffect(() => {
    //     connect();

    //     return () => {
    //         disconnect();
    //     };
    // }, [connect, disconnect]);

    return {
        data,
        error,
        isConnected,
        connect,
        disconnect,
    };
};
