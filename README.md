# Roomly — Booking frontend

Frontend **React + TypeScript + Vite** cho backend ASP.NET Core tại `D:\DemoBooking\Demo_Booking`. FE nằm trong solution/repository riêng, không tham chiếu project .NET hoặc database.

## Chạy trên máy

Khởi động backend trong terminal riêng:

```powershell
cd D:\DemoBooking\Demo_Booking
dotnet run --project src/Booking.Api --configuration Release --launch-profile http
```

Khởi động frontend:

```powershell
cd D:\DemoBooking\FE_React
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/npm.ps1 dev
```

Mở **http://localhost:5173**. Backend mặc định **http://localhost:5080**, Swagger tại **http://localhost:5080/swagger**. Nếu backend đang chạy thì không khởi động thêm một process ở cùng cổng.

Script `scripts/npm.ps1` ưu tiên Node.js/npm đã cài trong PATH. Trên máy hiện tại, nó cũng nhận Node.js 24 portable ở `%TEMP%\booking-fe-toolchain\node-root.txt`. Nếu thư mục tạm bị dọn hoặc chạy trên máy khác, cài Node.js LTS 24 rồi mở lại terminal. Script tự chạy `npm ci` nếu chưa có `node_modules`.

Với Node.js đã cài, có thể dùng lệnh chuẩn:

```powershell
npm.cmd ci
npm.cmd run dev
```

Đổi port API: copy `.env.example` thành `.env.local`, sửa `API_PROXY_TARGET`, rồi khởi động lại Vite. Không đặt JWT signing key, mật khẩu database hoặc bí mật vào biến `VITE_*`; chúng được đóng gói vào trình duyệt.

## Mở bằng Visual Studio

Mở `FE_React.slnx`; solution chứa project JavaScript/TypeScript `FE_React.esproj`. Visual Studio cần hỗ trợ phát triển JavaScript/TypeScript (workload ASP.NET/web). Chọn project frontend làm startup project. `StartupCommand` dùng cùng script trên; `BuildCommand` chạy build TypeScript/Vite. Dependencies JavaScript được quản lý bằng npm và `package-lock.json`, không phải NuGet. SDK của `.esproj` được NuGet khôi phục khi Visual Studio nạp project. Nếu IDE thiếu workload, vẫn có thể chạy frontend từ terminal.

## Các màn hình

- `/`: chọn phòng, ngày và khung giờ trống; xác nhận đặt phòng.
- `/register`: đăng ký, tự đăng nhập khi thành công.
- `/login`: đăng nhập và quay lại trang yêu cầu xác thực.
- `/bookings`: danh sách booking cá nhân, phân trang 10 booking.
- `/bookings/:id`: chi tiết booking, trạng thái và hủy có xác nhận.
- Đăng xuất: xóa phiên frontend. Backend hiện chưa có cơ chế thu hồi JWT hoặc refresh token.

Thông tin và trạng thái phòng được lấy từ API. Ảnh phòng là **minh họa**, không phải ảnh thật hay dữ liệu tiện nghi/sức chứa. Giao diện không tự tạo phòng hoặc slot. Seed backend hiện cung cấp hai phòng và lịch trong bảy ngày; ngày ngoài lịch có thể không có slot.

## Kết nối với backend

```text
Browser :5173 → Vite proxy /api → Booking.Api :5080 → Database
```

Trình duyệt gọi `/api` cùng origin với FE. Vite chuyển tiếp sang backend, nên cấu hình mặc định không cần thay đổi CORS của BE.

| API                                             | Chức năng                       |
| ----------------------------------------------- | ------------------------------- |
| POST `/api/auth/register`, `/api/auth/login`    | Nhận JWT                        |
| GET `/api/resources`                            | Danh sách phòng                 |
| GET `/api/resources/{id}/slots?from=...&to=...` | Slot trống theo ngày            |
| POST `/api/bookings`                            | Đặt phòng với `Idempotency-Key` |
| GET `/api/bookings?skip=...&take=...`           | Booking cá nhân                 |
| GET `/api/bookings/{bookingId}`                 | Chi tiết                        |
| DELETE `/api/bookings/{bookingId}`              | Hủy, trả 204                    |

DTO booking dùng đủ chín trường: `bookingId`, `resourceId`, `resourceName`, `slotId`, `startsAtUtc`, `endsAtUtc`, `status`, `createdAtUtc`, `cancelledAtUtc`. Cần backend từ commit bổ sung DTO này trở đi.

- Giờ API là UTC; giao diện luôn hiển thị `Asia/Ho_Chi_Minh` (UTC+7), kể cả máy người dùng dùng múi giờ khác. Khoảng tìm slot tính theo ngày Việt Nam.
- JWT lưu trong `sessionStorage` theo tab để tải lại trang không mất phiên. Nếu browser chặn storage, dùng bộ nhớ. Token bị xóa khi hết hạn hoặc API trả 401; không lưu mật khẩu. Token trong browser vẫn chịu rủi ro XSS; đây là cơ chế prototype dùng JWT hiện có, không phải cookie HttpOnly/BFF.
- Khóa idempotency lưu theo user/slot trong phiên. Retry lỗi mạng/5xx/429 dùng lại khóa; không retry tự động. Xóa khóa khi thành công hoặc lỗi xác định 404/409. Sau lỗi mạng, nên thử lại ngay trên hộp thoại; nếu đã rời trang và slot không còn trống, kiểm tra Booking của tôi trước.
- 409: giải thích xung đột, xóa lựa chọn cũ và tải lại slot.
- 429: hiển thị thời gian `Retry-After`; khóa nút xác nhận đặt phòng trong thời gian chờ.
- 401: xóa phiên và yêu cầu đăng nhập lại ở trang được bảo vệ.
- Chặn bấm gửi lặp khi tạo/hủy booking. Quyền sở hữu và chống đặt trùng do backend quyết định.

## Cấu trúc source

```text
src/
  pages/        Các màn hình: tìm phòng, auth, danh sách, chi tiết
  components/   Layout, hộp thoại, trạng thái, xác nhận hủy
  lib/api.ts    HTTP client, JWT header, chuyển lỗi API thành thông báo
  lib/date.ts   UTC và ngày/giờ Việt Nam
  lib/pending.ts Mã idempotency cho thao tác đặt phòng
  auth.tsx      Phiên đăng nhập và hết hạn
  models.ts     Các kiểu dữ liệu theo hợp đồng API
  App.tsx       Routing và bảo vệ trang cần đăng nhập
  styles.css    Giao diện responsive
tests/          Playwright: backend thực và mô phỏng lỗi API
```

Không mang Domain/Infrastructure của BE sang FE. FE quản lý màn hình và thao tác; quy tắc nghiệp vụ vẫn nằm ở backend.

## Build và kiểm thử

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/npm.ps1 build
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/npm.ps1 test
```

Hoặc `npm.cmd run build` và `npm.cmd test`. Build kiểm tra TypeScript nghiêm ngặt rồi xuất `dist/`.

Test mặc định dùng Chrome đã cài trên Windows và tự khởi động Vite nếu cần. Test đầu tiên dùng **backend thực đang chạy cổng 5080**, đăng ký tài khoản `web-...@example.com`, tạo rồi hủy booking và kiểm tra đăng nhập lại. Tài khoản/booking đã hủy được giữ trong DB demo. Chạy trên dữ liệu development/test, cần còn slot ngày mai. Nếu lặp nhiều lần, chờ rate limit của backend.

Các test còn lại mô phỏng API để kiểm tra retry giữ nguyên key, 409 cập nhật slot, 429 chờ rồi retry, 401 mất phiên và bố cục mobile không tràn ngang. Để chạy riêng các test mô phỏng khi chưa bật BE:

```powershell
npm.cmd test -- --grep-invert "real .NET API"
```

CI frontend chạy build và các test mô phỏng trên Chromium; chưa tự khởi động repository backend riêng. Test liên thông backend cần chạy theo hướng dẫn trên. Có thể dùng `npm.cmd run format` để định dạng source.

## Triển khai

`npm run preview` (port 4173) chỉ để kiểm tra bản build tại máy. Production phục vụ `dist/` qua web server/static hosting và cấu hình:

1. Các route frontend chưa khớp file phải trả `index.html` (SPA fallback).
2. Chuyển `/api/*` tới backend qua reverse proxy, giữ nguyên đường dẫn và header Authorization/Idempotency-Key.
3. Nếu FE gọi API khác origin bằng `VITE_API_BASE_URL`, cấu hình CORS ở BE cho đúng origin FE, method GET/POST/DELETE, các header Authorization/Content-Type/Idempotency-Key và expose Retry-After. Sau khi đổi biến build cần build lại.

Frontend không cần server Node.js ở production nếu chỉ phục vụ file tĩnh. Chưa thực hiện triển khai hoặc push repository trong lần xây dựng này.
