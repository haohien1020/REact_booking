import { ArrowUpRight, CalendarDays, DoorOpen, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
export function Layout() {
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="Roomly trang chủ">
          <span className="brand-mark">
            <DoorOpen size={25} />
          </span>
          roomly<span className="brand-dot">.</span>
        </Link>
        <div className="workspace">
          <span className="workspace-avatar">B</span>
          <div>
            Booking workspace<small>Không gian cho mọi ý tưởng</small>
          </div>
        </div>
        <div className="nav-label">KHÔNG GIAN CỦA BẠN</div>
        <nav aria-label="Điều hướng chính">
          <NavLink to="/" end>
            <DoorOpen size={19} />
            Tìm phòng
            <ArrowUpRight className="nav-arrow" size={16} />
          </NavLink>
          <NavLink to="/bookings">
            <CalendarDays size={19} />
            Booking của tôi
          </NavLink>
        </nav>
        <div className="sidebar-note">
          <Sparkles size={23} />
          <h3>
            Một không gian tốt.
            <br />
            Nhiều ý tưởng mới.
          </h3>
          <p>Chọn phòng phù hợp và dành thời gian cho điều quan trọng.</p>
        </div>
        <div className="sidebar-footer">
          <ShieldCheck size={16} />
          Lịch đặt phòng, luôn trong tầm tay.
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="topbar-label">
            Không gian làm việc <span>/</span> Booking
          </span>
          <div className="account">
            {session ? (
              <>
                <span className="user-avatar">{session.email[0].toUpperCase()}</span>
                <span className="account-email">{session.email}</span>
                <button
                  className="icon-button"
                  aria-label="Đăng xuất"
                  title="Đăng xuất"
                  onClick={() => {
                    setSession(null);
                    navigate('/');
                  }}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link className="button subtle small" to="/login">
                Đăng nhập <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
        </header>
        <main id="main-content">
          <Outlet />
        </main>
        <footer className="page-footer">
          <span>roomly · Không gian cho ngày làm việc tốt hơn.</span>
          <span>Giờ Việt Nam · UTC+7</span>
        </footer>
      </div>
    </div>
  );
}
