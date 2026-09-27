import { useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { formatDate, formatTime } from '../lib/date';
import { useAuth } from '../auth';
import { ErrorBox, Modal } from './ui';
import type { Booking } from '../models';
export function CancelBooking({
  booking,
  close,
  cancelled,
}: {
  booking: Booking;
  close: () => void;
  cancelled: () => void;
}) {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  async function cancel() {
    if (!session || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await api.cancel(booking.bookingId, session.token);
      cancelled();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal title="Hủy lịch đặt phòng?" close={close} busy={busy}>
      <p>
        Bạn đang hủy <strong>{booking.resourceName}</strong> lúc{' '}
        <strong>
          {formatTime(booking.startsAtUtc)}, ngày {formatDate(booking.startsAtUtc)}
        </strong>
        .
      </p>
      <p className="muted-text">
        Khung giờ sẽ được mở lại cho người khác. Bạn có thể đặt lại nếu vẫn còn chỗ.
      </p>
      {error && <ErrorBox message={error} />}
      <div className="modal-actions">
        <button className="button subtle" disabled={busy} onClick={close}>
          Giữ booking
        </button>
        <button className="button danger" disabled={busy} onClick={cancel}>
          {busy && <LoaderCircle size={17} className="spin" />}Xác nhận hủy
        </button>
      </div>
    </Modal>
  );
}
