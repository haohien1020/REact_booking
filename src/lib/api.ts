import type { AccessToken, Booking, Credentials, Resource, Slot } from '../models';

const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const messages: Record<string, string> = {
  invalid_credentials: 'Email hoặc mật khẩu chưa đúng.',
  email_taken: 'Email này đã được đăng ký.',
  email_exists: 'Email này đã được đăng ký.',
  invalid_email: 'Vui lòng nhập email hợp lệ.',
  invalid_password: 'Mật khẩu cần có từ 10 đến 128 ký tự.',
  slot_unavailable: 'Khung giờ này vừa được người khác đặt. Vui lòng chọn giờ khác.',
  slot_started: 'Khung giờ này đã bắt đầu. Vui lòng chọn giờ khác.',
  booking_not_found: 'Không tìm thấy booking hoặc bạn không có quyền xem.',
  slot_not_found: 'Khung giờ không còn tồn tại.',
  idempotency_conflict: 'Yêu cầu này đã được dùng cho một khung giờ khác.',
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = '',
    public retryAfter = 0,
  ) {
    super(message);
  }
}
async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...options, headers });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(
      0,
      'Không thể kết nối. Kiểm tra mạng rồi thử lại; yêu cầu đặt phòng sẽ giữ nguyên mã để tránh tạo trùng.',
    );
  }
  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as { title?: string };
    const retry = response.headers.get('Retry-After');
    const seconds = retry
      ? /^\d+$/.test(retry)
        ? Number(retry)
        : Math.max(0, Math.ceil((Date.parse(retry) - Date.now()) / 1000))
      : 0;
    const retryAfter = Number.isFinite(seconds) ? seconds : 0;
    if (response.status === 401 && token)
      window.dispatchEvent(new CustomEvent('booking:unauthorized', { detail: token }));
    const message =
      response.status === 429
        ? `Bạn thao tác hơi nhanh. ${retryAfter ? `Thử lại sau khoảng ${retryAfter} giây.` : 'Vui lòng đợi một lát rồi thử lại.'}`
        : messages[problem.title || ''] ||
          (response.status === 401
            ? token
              ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
              : 'Email hoặc mật khẩu chưa đúng.'
            : response.status === 404
              ? 'Không tìm thấy thông tin yêu cầu.'
              : response.status >= 500
                ? 'Dịch vụ đang gián đoạn. Vui lòng thử lại sau.'
                : 'Không thể thực hiện yêu cầu. Vui lòng kiểm tra thông tin.');
    throw new ApiError(response.status, message, problem.title, retryAfter);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const api = {
  auth: (mode: 'login' | 'register', credentials: Credentials) =>
    request<AccessToken>(`/api/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  resources: (signal?: AbortSignal) => request<Resource[]>('/api/resources', { signal }),
  slots: (resourceId: string, range: { from: string; to: string }, signal?: AbortSignal) =>
    request<Slot[]>(`/api/resources/${resourceId}/slots?${new URLSearchParams(range)}`, { signal }),
  create: (slotId: string, key: string, token: string) =>
    request<Booking>(
      '/api/bookings',
      { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify({ slotId }) },
      token,
    ),
  bookings: (skip: number, take: number, token: string, signal?: AbortSignal) =>
    request<Booking[]>(`/api/bookings?skip=${skip}&take=${take}`, { signal }, token),
  booking: (id: string, token: string, signal?: AbortSignal) =>
    request<Booking>(`/api/bookings/${encodeURIComponent(id)}`, { signal }, token),
  cancel: (id: string, token: string) =>
    request<void>(`/api/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }, token),
};
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.';
