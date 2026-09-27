import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { Layout } from './components/Layout';
import { Empty } from './components/ui';
import { AuthPage } from './pages/AuthPage';
import { ExplorePage } from './pages/ExplorePage';
import { BookingsPage } from './pages/BookingsPage';
import { BookingDetailPage } from './pages/BookingDetailPage';
function RequireAuth() {
  const { session } = useAuth();
  const location = useLocation();
  return session ? (
    <Outlet />
  ) : (
    <Navigate
      replace
      to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
    />
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <a href="#main-content" className="skip-link">
          Bỏ qua đến nội dung chính
        </a>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<ExplorePage />} />
            <Route path="login" element={<AuthPage key="login" mode="login" />} />
            <Route path="register" element={<AuthPage key="register" mode="register" />} />
            <Route element={<RequireAuth />}>
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="bookings/:id" element={<BookingDetailPage />} />
            </Route>
            <Route
              path="*"
              element={
                <div className="page">
                  <Empty
                    title="Không tìm thấy trang"
                    text="Đường dẫn này không tồn tại. Hãy quay lại để chọn một không gian."
                    action
                  />
                </div>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
