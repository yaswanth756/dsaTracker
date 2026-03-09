export async function apiFetch(url: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dsa-vault-token') : null;
    const headers = {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const res = await fetch(url, { ...options, headers });

    // Auto redirect locally if unauthorized
    if (res.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('dsa-vault-token');
            // Check if already on login page to avoid redirect loops
            if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
                window.location.href = '/login';
            }
        }
    }
    return res;
}
