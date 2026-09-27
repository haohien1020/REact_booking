import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api, errorMessage } from '../lib/api';
import { ErrorBox } from '../components/ui';
export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const register = mode === 'register';
  const { session, setSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const candidate = new URLSearchParams(location.search).get('returnTo') || '/';
  const returnTo =
    candidate.startsWith('/') &&
    !candidate.startsWith('//') &&
    !candidate.startsWith('/login') &&
    !candidate.startsWith('/register')
      ? candidate
      : '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (session) return <Navigate to={returnTo} replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const token = await api.auth(mode, { email: email.trim(), password });
      setSession({ ...token, email: email.trim() });
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <span className="eyebrow light">MAKE ROOM FOR IDEAS</span>
        <h1>
          Cuộc hẹn tốt.
          <br />
          Bắt đầu từ một
          <br />
          <em>không gian tốt.</em>
        </h1>
        <p>
          Mọi lịch đặt phòng ở một nơi.
          <br />
          Đơn giản hơn để tập trung vào công việc.
        </p>
        <img src="/room.svg" alt="Minh họa không gian phòng họp" />
        <span className="story-foot">
          <ShieldCheck size={17} />
          Chỉ bạn mới có thể xem và quản lý booking của mình.
        </span>
      </section>
      <section className="auth-form">
        <span className="eyebrow">CHÀO MỪNG ĐẾN ROOMLY</span>
        <h2>{register ? 'Tạo tài khoản mới' : 'Rất vui gặp lại bạn.'}</h2>
        <p className="muted-text">
          {register
            ? 'Bắt đầu đặt không gian cho buổi họp tiếp theo.'
            : 'Đăng nhập để tiếp tục lịch trình của bạn.'}
        </p>
        <form onSubmit={submit} aria-label={register ? 'Đăng ký' : 'Đăng nhập'}>
          {error && <ErrorBox message={error} />}
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@congty.com"
              disabled={busy}
            />
          </label>
          <label>
            Mật khẩu
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={register ? 'new-password' : 'current-password'}
                minLength={register ? 10 : undefined}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={register ? 'Từ 10 đến 128 ký tự' : 'Nhập mật khẩu của bạn'}
                disabled={busy}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {register && <small className="muted-text">Sử dụng mật khẩu có ít nhất 10 ký tự.</small>}
          <button className="button primary full" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={18} /> : null}
            {register ? 'Tạo tài khoản' : 'Đăng nhập'}
            <ArrowRight size={18} />
          </button>
        </form>
        <p className="auth-switch">
          {register ? 'Bạn đã có tài khoản?' : 'Bạn chưa có tài khoản?'}{' '}
          <Link to={`/${register ? 'login' : 'register'}?returnTo=${encodeURIComponent(returnTo)}`}>
            {register ? 'Đăng nhập' : 'Đăng ký ngay'}
          </Link>
        </p>
        <Link className="back-link" to="/">
          ← Xem các phòng trước
        </Link>
      </section>
    </div>
  );
}
