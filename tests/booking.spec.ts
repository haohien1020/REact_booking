import { test, expect, type Page } from '@playwright/test';

test('booking lifecycle against the real .NET API', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const email = `web-${Date.now()}@example.com`;
  const password = 'Booking-Web-Test-2026';
  await page.goto('/register');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Tìm không gian/ })).toBeVisible();
  await expect(page.locator('.room-card').first()).toBeVisible();
  await page.locator('.slot').first().click();
  await page.getByRole('button', { name: 'Tiếp tục đặt phòng' }).click();
  await page.getByRole('button', { name: 'Xác nhận đặt phòng', exact: true }).click();
  await expect(page).toHaveURL(/\/bookings\/[a-f0-9-]+$/);
  await expect(page.getByRole('status')).toContainText('Đặt phòng thành công');
  const detailUrl = page.url();
  await page.reload();
  await expect(page.locator('.badge')).toContainText('Đã xác nhận');
  await page.getByRole('button', { name: 'Hủy booking', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click();
  await expect(page.locator('.badge')).toContainText('Đã hủy');
  await expect(page.getByText('Đã hủy lúc', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Booking của tôi', exact: true }).first().click();
  await expect(page.locator('.booking-row')).toHaveCount(1);
  await expect(page.locator('.booking-row .badge')).toContainText('Đã hủy');
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await page.goto(detailUrl);
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(detailUrl);
  await expect(page.locator('.badge')).toContainText('Đã hủy');
  expect(errors).toEqual([]);
});

const resourceId = '11111111-1111-1111-1111-111111111111';
const slotId = '22222222-2222-2222-2222-222222222222';
const bookingId = '33333333-3333-3333-3333-333333333333';
const future = new Date(Date.now() + 86400000).toISOString();
const slot = {
  id: slotId,
  resourceId,
  startsAtUtc: future,
  endsAtUtc: new Date(Date.parse(future) + 3600000).toISOString(),
};
const booking = {
  bookingId,
  resourceId,
  resourceName: 'Test Room',
  slotId,
  startsAtUtc: slot.startsAtUtc,
  endsAtUtc: slot.endsAtUtc,
  status: 'Confirmed',
  createdAtUtc: new Date().toISOString(),
  cancelledAtUtc: null,
};
async function mockSession(page: Page) {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'roomly.session',
      JSON.stringify({
        token: 'test-token',
        userId: 'test-user',
        email: 'tester@example.com',
        expiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
      }),
    ),
  );
  await page.route('**/api/resources', (route) =>
    route.fulfill({ json: [{ id: resourceId, name: 'Test Room' }] }),
  );
  await page.route('**/api/resources/*/slots?*', (route) => route.fulfill({ json: [slot] }));
  await page.route(`**/api/bookings/${bookingId}`, (route) => route.fulfill({ json: booking }));
}
async function selectAndConfirm(page: Page) {
  await page.goto('/');
  await page.locator('.slot').first().click();
  await page.getByRole('button', { name: 'Tiếp tục đặt phòng' }).click();
  await page.getByRole('button', { name: 'Xác nhận đặt phòng', exact: true }).click();
}
test('network retry keeps idempotency key and does not duplicate submissions', async ({ page }) => {
  await mockSession(page);
  const keys: string[] = [];
  await page.route('**/api/bookings', async (route) => {
    keys.push(route.request().headers()['idempotency-key']);
    if (keys.length === 1) await route.abort('failed');
    else await route.fulfill({ status: 200, json: booking });
  });
  await selectAndConfirm(page);
  await expect(page.getByRole('alert')).toContainText('Không thể kết nối');
  await page.getByRole('button', { name: 'Xác nhận đặt phòng', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/bookings/${bookingId}$`));
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBeTruthy();
  expect(keys[0]).toEqual(keys[1]);
});
test('409 conflict refreshes available slots and clears stale selection', async ({ page }) => {
  await mockSession(page);
  await page.route('**/api/bookings', async (route) => {
    await page.route('**/api/resources/*/slots?*', (slotRoute) => slotRoute.fulfill({ json: [] }));
    await route.fulfill({ status: 409, json: { title: 'slot_unavailable' } });
  });
  await selectAndConfirm(page);
  await expect(page.getByRole('alert')).toContainText('vừa được người khác đặt');
  await expect(page.getByText('Chưa có khung giờ trống', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tiếp tục đặt phòng' })).toBeDisabled();
});
test('429 honors retry delay, then lets user retry with same key', async ({ page }) => {
  await mockSession(page);
  const keys: string[] = [];
  await page.route('**/api/bookings', async (route) => {
    keys.push(route.request().headers()['idempotency-key']);
    if (keys.length === 1)
      await route.fulfill({ status: 429, headers: { 'Retry-After': '2' }, json: {} });
    else await route.fulfill({ status: 201, json: booking });
  });
  await selectAndConfirm(page);
  await expect(page.getByRole('alert')).toContainText('2 giây');
  await expect(page.getByRole('button', { name: 'Vui lòng chờ…' })).toBeDisabled();
  await page.getByRole('button', { name: 'Xác nhận đặt phòng', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/bookings/${bookingId}$`));
  expect(keys).toHaveLength(2);
  expect(keys[0]).toEqual(keys[1]);
});
test('expired token redirects protected page to login without showing private data', async ({
  page,
}) => {
  await mockSession(page);
  await page.route('**/api/bookings?*', (route) => route.fulfill({ status: 401, json: {} }));
  await page.goto('/bookings');
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await expect(page.getByRole('heading', { name: 'Rất vui gặp lại bạn.' })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('roomly.session'))).toBeNull();
});
test('mobile layout has no horizontal overflow and booking controls remain usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page);
  await page.goto('/');
  await page.locator('.slot').first().click();
  await expect(page.getByRole('button', { name: 'Tiếp tục đặt phòng' })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/mobile-explore.png', fullPage: true });
});
