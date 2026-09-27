import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { api, errorMessage } from '../lib/api';
import { formatDate, formatTime } from '../lib/date';
import { Empty, ErrorBox, Loading, StatusBadge } from '../components/ui';
import { CancelBooking } from '../components/CancelBooking';
import type { Booking } from '../models';
const pageSize = 10;
export function BookingsPage() {
  const { session } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancel, setCancel] = useState<Booking | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setBookings([]);
    // One extra row tells us whether another page exists, without inventing a total.
    api
      .bookings(page * pageSize, pageSize + 1, session.token, controller.signal)
      .then(setBookings)
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [session, page, reload]);
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR PLANS, ALL TOGETHER</span>
          <h1>
            Booking của tôi<span className="green-dot">.</span>
          </h1>
          <p>Mỗi cuộc hẹn, một không gian. Theo dõi lịch đặt phòng của bạn.</p>
        </div>
        <Link className="button primary" to="/">
          <Plus size={18} />
          Đặt phòng mới
        </Link>
      </div>
      {notice && (
        <div className="success-box" role="status">
          {notice}
        </div>
      )}
      <section className="panel">
        <div className="section-heading">
          <h2>Lịch đặt phòng</h2>
          <button
            className="button subtle small"
            disabled={loading}
            onClick={() => setReload((v) => v + 1)}
          >
            <RefreshCw size={15} />
            Làm mới
          </button>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} retry={() => setReload((v) => v + 1)} />
        ) : bookings.length === 0 ? (
          <Empty
            title={page ? 'Không còn booking ở trang này' : 'Lịch trình đang chờ bạn'}
            text="Chọn một không gian và tạo lịch đặt phòng đầu tiên của bạn."
            action
          />
        ) : (
          <div className="booking-list">
            {bookings.slice(0, pageSize).map((booking) => (
              <article className="booking-row" key={booking.bookingId}>
                <div className="booking-date">
                  <strong>
                    {new Intl.DateTimeFormat('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                      day: '2-digit',
                    }).format(new Date(booking.startsAtUtc))}
                  </strong>
                  <span>
                    {new Intl.DateTimeFormat('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                      month: 'short',
                    }).format(new Date(booking.startsAtUtc))}
                  </span>
                </div>
                <div className="booking-row-info">
                  <h3>
                    <Link to={`/bookings/${booking.bookingId}`}>{booking.resourceName}</Link>
                  </h3>
                  <div>
                    <span>
                      <CalendarDays size={14} />
                      {formatDate(booking.startsAtUtc)}
                    </span>
                    <span>
                      <Clock3 size={14} />
                      {formatTime(booking.startsAtUtc)} – {formatTime(booking.endsAtUtc)}
                    </span>
                  </div>
                </div>
                <StatusBadge status={booking.status} />
                <div className="booking-actions">
                  <Link className="text-button" to={`/bookings/${booking.bookingId}`}>
                    Chi tiết <ArrowRight size={14} />
                  </Link>
                  {booking.status === 'Confirmed' && (
                    <button className="text-button destructive" onClick={() => setCancel(booking)}>
                      Hủy booking
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="pagination">
          <span>Trang {page + 1} · Mới đặt gần đây nhất</span>
          <div>
            <button
              className="icon-button"
              aria-label="Trang trước"
              disabled={!page || loading}
              onClick={() => setPage((v) => v - 1)}
            >
              <ChevronLeft size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="Trang sau"
              disabled={bookings.length <= pageSize || loading || !!error}
              onClick={() => setPage((v) => v + 1)}
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>
      </section>
      {cancel && (
        <CancelBooking
          booking={cancel}
          close={() => setCancel(null)}
          cancelled={() => {
            setCancel(null);
            setNotice('Đã hủy booking. Khung giờ đã được mở lại.');
            setReload((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}
