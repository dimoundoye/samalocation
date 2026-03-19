export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";



interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
}

export const baseClient = async (endpoint: string, options: RequestOptions = {}) => {
    const { params, ...init } = options;

    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
        const query = Object.entries(params)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join("&");
        if (query) {
            url += `?${query}`;
        }
    }

    const token = localStorage.getItem("auth_token");
    const activeContext = localStorage.getItem("active_context");
    const headers = new Headers(init.headers);
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    if (activeContext) {
        headers.set("X-Active-Context", activeContext);
    }
    if (!(init.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        ...init,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 503 && !window.location.pathname.startsWith('/maintenance') && !window.location.pathname.startsWith('/auth')) {
            window.location.href = '/maintenance';
            return;
        }
        const error = new Error(data.message || "API request failed");
        (error as any).status = response.status;
        (error as any).data = data;
        throw error;
    }

    // Adapt to new standardized response format
    // If the backend returns { status: 'success', data: ... }, we return data
    if (data.status === 'success') {
        return data.data;
    }

    return data;
};
