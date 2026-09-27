import { useEffect, useRef, type ReactNode } from 'react';
import { AlertCircle, ArrowRight, LoaderCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="error-box" role="alert">
      <AlertCircle size={19} />
      <div>
        {message}
        {retry && (
          <button className="text-button" onClick={retry}>
            Thử lại <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
export function Loading({ label = 'Đang tải thông tin…' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={22} />
      {label}
    </div>
  );
}
export function StatusBadge({ status }: { status: 'Confirmed' | 'Cancelled' }) {
  return (
    <span className={`badge ${status === 'Cancelled' ? 'muted' : ''}`}>
      <span />
      {status === 'Confirmed' ? 'Đã xác nhận' : 'Đã hủy'}
    </span>
  );
}
export function Empty({ title, text, action }: { title: string; text: string; action?: boolean }) {
  return (
    <div className="empty">
      <div className="empty-icon">◷</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <Link className="button primary" to="/">
          Khám phá phòng <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function Modal({
  title,
  children,
  close,
  busy,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) close();
      }}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" aria-label="Đóng" disabled={busy} onClick={close}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
