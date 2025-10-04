// API Configuration
const API_BASE_URL = "http://localhost:5000";

// Helper function để tạo full URL
const createApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

// API Functions for Events
export async function getAllEvents() {
  const response = await fetch(createApiUrl("/api/event"), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || "Không thể lấy danh sách sự kiện.";
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function getEventById(id) {
  const response = await fetch(createApiUrl(`/api/event/${id}`), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || "Không thể lấy thông tin sự kiện.";
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function createEvent(eventData) {
  const response = await fetch(createApiUrl("/api/event"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || "Không thể tạo sự kiện.";
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function updateEvent(id, eventData) {
  const response = await fetch(createApiUrl(`/api/event/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || "Không thể cập nhật sự kiện.";
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function deleteEvent(id) {
  const response = await fetch(createApiUrl(`/api/event/${id}`), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || "Không thể xóa sự kiện.";
    throw new Error(errorMessage);
  }

  return response.json();
}
