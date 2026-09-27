import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  DoorOpen,
  LoaderCircle,
  RefreshCw,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api, ApiError, errorMessage } from '../lib/api';
import { addDays, dayRange, formatDate, formatTime, today } from '../lib/date';
import { bookingKey, finishBooking } from '../lib/pending';
import { Empty, ErrorBox, Loading, Modal } from '../components/ui';
import type { Resource, Slot } from '../models';

export function ExplorePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceId, setResourceId] = useState('');
  const [date, setDate] = useState(() => addDays(today(), 1));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState('');
  const [slotsError, setSlotsError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [reload, setReload] = useState(0);
  const [roomReload, setRoomReload] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const submitLock = useRef(false);
  const resource = resources.find((room) => room.id === resourceId);
  useEffect(() => {
    const controller = new AbortController();
    setRoomsLoading(true);
    setRoomsError('');
    api
      .resources(controller.signal)
      .then((data) => {
        setResources(data);
        setResourceId((id) => (data.some((r) => r.id === id) ? id : data[0]?.id || ''));
      })
      .catch((err) => {
        if (!controller.signal.aborted) setRoomsError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setRoomsLoading(false);
      });
    return () => controller.abort();
  }, [roomReload]);
  useEffect(() => {
    if (!resourceId || !date) return;
    const controller = new AbortController();
    setSlotsLoading(true);
    setSlotsError('');
    setSlots([]);
    setSelected(null);
    api
      .slots(resourceId, dayRange(date), controller.signal)
      .then(setSlots)
      .catch((err) => {
        if (!controller.signal.aborted) setSlotsError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setSlotsLoading(false);
      });
    return () => controller.abort();
  }, [resourceId, date, reload]);
  useEffect(() => {
    if (!blockedUntil) return;
    const timer = setTimeout(() => setBlockedUntil(0), Math.max(0, blockedUntil - Date.now()));
    return () => clearTimeout(timer);
  }, [blockedUntil]);
  function changeSelection(action: () => void) {
    setSelected(null);
    setBookingError('');
    setConfirm(false);
    action();
  }
  async function book() {
    if (!selected || !session || submitLock.current) return;
    submitLock.current = true;
    setBusy(true);
    setBookingError('');
    const slotId = selected.id;
    try {
      const booking = await api.create(slotId, bookingKey(session.userId, slotId), session.token);
      finishBooking(session.userId, slotId);
      navigate(`/bookings/${booking.bookingId}`, {
        state: { created: booking.status === 'Confirmed' },
      });
    } catch (err) {
      setBookingError(errorMessage(err));
      if (err instanceof ApiError && err.status === 429)
        setBlockedUntil(Date.now() + (err.retryAfter || 5) * 1000);
      if (err instanceof ApiError && [404, 409].includes(err.status)) {
        finishBooking(session.userId, slotId);
        setConfirm(false);
        setReload((value) => value + 1);
      }
      if (err instanceof ApiError && err.status === 401) setConfirm(false);
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="page explore-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR SPACE, YOUR PACE</span>
          <h1>
            Tìm không gian cho
            <br className="mobile-break" /> ý tưởng tiếp theo<span className="green-dot">.</span>
          </h1>
          <p>Chọn phòng, chọn giờ. Phần còn lại, để Roomly lo.</p>
        </div>
        <span className="timezone-pill">
          <Clock3 size={15} />
          Giờ Việt Nam · UTC+7
        </span>
      </div>
      <section className="intro-banner">
        <div>
          <span className="banner-kicker">MỘT LỊCH TRÌNH GỌN GÀNG HƠN</span>
          <h2>
            Không gian sẵn sàng.
            <br />
            Bạn chỉ cần mang ý tưởng.
          </h2>
          <p>Đặt phòng theo khung giờ có sẵn, quản lý lịch hẹn ở một nơi.</p>
          <a href="#choose-room" className="banner-link">
            Tìm phòng của bạn <ArrowRight size={17} />
          </a>
        </div>
        <div className="banner-art" aria-hidden="true">
          <span className="art-ring" />
          <div className="mini-calendar">
            <div>
              <span>YOUR NEXT MEETING</span>
              <CalendarDays size={18} />
            </div>
            <strong>Make room.</strong>
            <div className="calendar-dots">
              {Array.from({ length: 14 }, (_, i) => (
                <span key={i} className={i === 9 ? 'marked' : ''}>
                  {i === 9 ? <Check size={15} /> : i + 1}
                </span>
              ))}
            </div>
          </div>
          <span className="floating-note">
            <CheckCircle2 size={18} />
            Sẵn sàng cho cuộc hẹn mới
          </span>
        </div>
      </section>
      <div className="booking-grid">
        <div className="selection-column">
          <section id="choose-room">
            <div className="section-heading">
              <div>
                <span className="step-number">01</span>
                <h2>Chọn không gian</h2>
              </div>
              {!roomsLoading && !roomsError && (
                <span className="muted-text">{resources.length} phòng</span>
              )}
            </div>
            {roomsLoading ? (
              <Loading label="Đang tìm các phòng…" />
            ) : roomsError ? (
              <ErrorBox message={roomsError} retry={() => setRoomReload((v) => v + 1)} />
            ) : !resources.length ? (
              <Empty
                title="Chưa có phòng"
                text="Các phòng sẽ xuất hiện tại đây khi được mở đặt lịch."
              />
            ) : (
              <div className="room-grid">
                {resources.map((room, index) => (
                  <button
                    key={room.id}
                    className={`room-card ${resourceId === room.id ? 'selected' : ''}`}
                    aria-pressed={resourceId === room.id}
                    onClick={() => changeSelection(() => setResourceId(room.id))}
                    disabled={busy}
                  >
                    <div className={`room-image variant-${index % 2}`}>
                      <img src="/room.svg" alt="" />
                      <span className="room-type">PHÒNG HỌP</span>
                      <span className="selection-check">
                        {resourceId === room.id && <Check size={14} />}
                      </span>
                    </div>
                    <div className="room-info">
                      <h3>{room.name}</h3>
                      <span>
                        <DoorOpen size={15} />
                        Không gian cho buổi họp của bạn
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
          <section className="slot-section">
            <div className="section-heading">
              <div>
                <span className="step-number">02</span>
                <h2>Chọn ngày & khung giờ</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setReload((v) => v + 1)}
                disabled={!resourceId || slotsLoading || busy}
                aria-label="Làm mới khung giờ"
              >
                <RefreshCw size={17} />
              </button>
            </div>
            <label className="date-label">
              Ngày đặt phòng
              <input
                type="date"
                value={date}
                min={today()}
                max={addDays(today(), 30)}
                onChange={(e) => {
                  if (e.target.value) changeSelection(() => setDate(e.target.value));
                }}
                disabled={busy}
              />
            </label>
            <div className="date-strip">
              {Array.from({ length: 7 }, (_, i) => addDays(today(), i)).map((day) => (
                <button
                  key={day}
                  className={date === day ? 'active' : ''}
                  aria-pressed={date === day}
                  disabled={busy}
                  onClick={() => changeSelection(() => setDate(day))}
                >
                  <span>
                    {day === today()
                      ? 'Hôm nay'
                      : new Intl.DateTimeFormat('vi-VN', {
                          weekday: 'short',
                          timeZone: 'UTC',
                        }).format(new Date(`${day}T12:00:00Z`))}
                  </span>
                  <strong>{day.slice(8)}</strong>
                  <small>Tháng {Number(day.slice(5, 7))}</small>
                </button>
              ))}
            </div>
            <div className="slot-caption">
              <span>
                <span className="available-dot" />
                Khung giờ còn trống
              </span>
              <small>Ngày {formatDate(`${date}T00:00:00+07:00`)}</small>
            </div>
            {slotsLoading ? (
              <Loading label="Đang cập nhật khung giờ…" />
            ) : slotsError ? (
              <ErrorBox message={slotsError} retry={() => setReload((v) => v + 1)} />
            ) : !resourceId ? (
              <Empty
                title="Chọn một phòng để bắt đầu"
                text="Các khung giờ trống sẽ hiển thị tại đây."
              />
            ) : slots.length === 0 ? (
              <Empty
                title="Chưa có khung giờ trống"
                text="Ngày này có thể đã kín lịch hoặc chưa mở lịch. Bạn hãy chọn ngày khác."
              />
            ) : (
              <div className="slots-grid">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    disabled={busy}
                    className={`slot ${selected?.id === slot.id ? 'active' : ''}`}
                    aria-pressed={selected?.id === slot.id}
                    onClick={() => {
                      setSelected(slot);
                      setBookingError('');
                    }}
                  >
                    <Clock3 size={15} />
                    {formatTime(slot.startsAtUtc)} – {formatTime(slot.endsAtUtc)}
                    {selected?.id === slot.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="booking-summary">
          <span className="eyebrow">LỊCH HẸN TIẾP THEO</span>
          <h2>Thông tin đặt phòng</h2>
          <p className="muted-text">Kiểm tra lựa chọn trước khi xác nhận.</p>
          <div className="summary-room">
            <span>
              <DoorOpen size={24} />
            </span>
            <div>
              <small>Không gian</small>
              <strong>{resource?.name || 'Chưa chọn phòng'}</strong>
            </div>
          </div>
          <dl className="summary-lines">
            <div>
              <dt>
                <CalendarDays size={16} />
                Ngày
              </dt>
              <dd>{formatDate(`${date}T00:00:00+07:00`)}</dd>
            </div>
            <div>
              <dt>
                <Clock3 size={16} />
                Khung giờ
              </dt>
              <dd>
                {selected
                  ? `${formatTime(selected.startsAtUtc)} – ${formatTime(selected.endsAtUtc)}`
                  : 'Chưa chọn'}
              </dd>
            </div>
            <div>
              <dt>Thời lượng</dt>
              <dd>
                {selected
                  ? `${Math.round((Date.parse(selected.endsAtUtc) - Date.parse(selected.startsAtUtc)) / 60000)} phút`
                  : '—'}
              </dd>
            </div>
          </dl>
          {bookingError && !confirm && <ErrorBox message={bookingError} />}
          {session ? (
            <button
              className="button primary full"
              disabled={!selected || busy || !!blockedUntil}
              onClick={() => setConfirm(true)}
            >
              Tiếp tục đặt phòng <ArrowRight size={17} />
            </button>
          ) : (
            <Link className="button primary full" to="/login?returnTo=%2F">
              Đăng nhập để đặt phòng <ArrowRight size={17} />
            </Link>
          )}
          <p className="summary-note">
            <CheckCircle2 size={15} />
            Bạn có thể quản lý và hủy lịch trong Booking của tôi.
          </p>
          <div className="summary-bottom">Một cuộc hẹn. Một không gian riêng.</div>
        </aside>
      </div>
      {confirm && selected && (
        <Modal title="Xác nhận đặt phòng" busy={busy} close={() => setConfirm(false)}>
          <p>
            Bạn sẽ đặt <strong>{resource?.name}</strong> vào ngày{' '}
            <strong>{formatDate(selected.startsAtUtc)}</strong>, từ{' '}
            <strong>
              {formatTime(selected.startsAtUtc)} đến {formatTime(selected.endsAtUtc)}
            </strong>{' '}
            (giờ Việt Nam).
          </p>
          {bookingError && <ErrorBox message={bookingError} />}
          <div className="modal-actions">
            <button className="button subtle" disabled={busy} onClick={() => setConfirm(false)}>
              Quay lại
            </button>
            <button
              className="button primary"
              disabled={busy || !!blockedUntil || !session}
              onClick={book}
            >
              {busy && <LoaderCircle size={17} className="spin" />}
              {blockedUntil ? 'Vui lòng chờ…' : 'Xác nhận đặt phòng'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
