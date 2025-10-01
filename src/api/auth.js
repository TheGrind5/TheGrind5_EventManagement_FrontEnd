const BASE_URL = "http://localhost:5000"; // đổi sang URL API thật (ASP.NET)

export async function login(identifier, password) {
  // Nếu backend của bạn dùng `email`/`username` tách riêng, sửa body cho phù hợp
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // nhận cookie httpOnly nếu backend set
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) {
    let message = "Thông tin đăng nhập không đúng. Vui lòng thử lại.";
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {}
    throw new Error(message);
  }

  // Chuẩn kỳ vọng: { token, user: {...} }
  return res.json();
}
