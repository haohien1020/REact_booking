import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, DoorOpen } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { api, errorMessage } from '../lib/api';
import { formatDate, formatDateTime, formatTime } from '../lib/date';
import { ErrorBox, Loading, StatusBadge } from '../components/ui';
import { CancelBooking } from '../components/CancelBooking';
import type { Booking } from '../models';
export function BookingDetailPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const location = useLocation();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [cancel, setCancel] = useState(false);
  useEffect(() => {
    if (!session || !id) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setBooking(null);
    api
      .booking(id, session.token, controller.signal)
      .then(setBooking)
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [session, id, reload]);
  return (
    <div className="page detail-page">
      <Link className="back-link" to="/bookings">
        <ArrowLeft size={16} />
        Booking của tôi
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ALL THE DETAILS</span>
          <h1>
            Chi tiết booking<span className="green-dot">.</span>
          </h1>
          <p>Thông tin cuộc hẹn và không gian đã chọn của bạn.</p>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={() => setReload((v) => v + 1)} />
      ) : (
        booking && (
          <>
            {location.state?.created && booking.status === 'Confirmed' && (
              <div className="success-box" role="status">
                <CheckCircle2 size={19} />
                Đặt phòng thành công. Không gian đã sẵn sàng cho lịch hẹn của bạn.
              </div>
            )}
            <section className="detail-card">
              <div className="detail-cover">
                <img src="/room.svg" alt="Minh họa phòng họp" />
              </div>
              <div className="detail-body">
                <div className="section-heading">
                  <span className="eyebrow">PHÒNG HỌP</span>
                  <StatusBadge status={booking.status} />
                </div>
                <h2>{booking.resourceName}</h2>
                <div className="detail-facts">
                  <div>
                    <CalendarDays size={23} />
                    <small>Ngày đặt phòng</small>
                    <strong>{formatDate(booking.startsAtUtc)}</strong>
                  </div>
                  <div>
                    <Clock3 size={23} />
                    <small>Khung giờ · Việt Nam</small>
                    <strong>
                      {formatTime(booking.startsAtUtc)} – {formatTime(booking.endsAtUtc)}
                    </strong>
                  </div>
                  <div>
                    <DoorOpen size={23} />
                    <small>Thời lượng</small>
                    <strong>
                      {Math.round(
                        (Date.parse(booking.endsAtUtc) - Date.parse(booking.startsAtUtc)) / 60000,
                      )}{' '}
                      phút
                    </strong>
                  </div>
                </div>
                <dl className="detail-metadata">
                  <div>
                    <dt>Mã booking</dt>
                    <dd>{booking.bookingId}</dd>
                  </div>
                  <div>
                    <dt>Ngày tạo</dt>
                    <dd>{formatDateTime(booking.createdAtUtc)}</dd>
                  </div>
                  {booking.cancelledAtUtc && (
                    <div>
                      <dt>Đã hủy lúc</dt>
                      <dd>{formatDateTime(booking.cancelledAtUtc)}</dd>
                    </div>
                  )}
                </dl>
                <div className="detail-actions">
                  <Link className="button subtle" to="/">
                    Tìm phòng khác <DoorOpen size={16} />
                  </Link>
                  {booking.status === 'Confirmed' && (
                    <button className="button danger-outline" onClick={() => setCancel(true)}>
                      Hủy booking
                    </button>
                  )}
                </div>
              </div>
            </section>
            {cancel && (
              <CancelBooking
                booking={booking}
                close={() => setCancel(false)}
                cancelled={() => {
                  setCancel(false);
                  setReload((v) => v + 1);
                }}
              />
            )}
          </>
        )
      )}
    </div>
  );
}
