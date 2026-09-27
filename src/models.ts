export interface Credentials {
  email: string;
  password: string;
}
export interface AccessToken {
  token: string;
  expiresAtUtc: string;
  userId: string;
}
export interface Session extends AccessToken {
  email: string;
}
export interface Resource {
  id: string;
  name: string;
}
export interface Slot {
  id: string;
  resourceId: string;
  startsAtUtc: string;
  endsAtUtc: string;
}
export interface Booking {
  bookingId: string;
  resourceId: string;
  resourceName: string;
  slotId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  status: 'Confirmed' | 'Cancelled';
  createdAtUtc: string;
  cancelledAtUtc: string | null;
}
