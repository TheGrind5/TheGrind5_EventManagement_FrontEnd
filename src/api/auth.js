// API Configuration
const API_BASE_URL = "http://localhost:5000";

// Helper function để tạo full URL
const createApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

// API Functions
export async function login(email, password) {
  const response = await fetch(createApiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || "Đăng nhập thất bại. Vui lòng thử lại.";
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function register(userData) {
  const response = await fetch(createApiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || "Đăng ký thất bại. Vui lòng thử lại.";
    throw new Error(errorMessage);
  }

  return response.json();
}