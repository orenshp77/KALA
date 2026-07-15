export interface User {
  id: string;
  email: string;
  password: string;
  role: 'couple' | 'admin';
  eventId: string;
}

export interface Event {
  id: string;
  userId: string;
  coupleName1: string;
  coupleName2: string;
  date: string;
  venueName: string;
  venueAddress: string;
  venueLat?: number;
  venueLng?: number;
  selectedDesign: number;
}

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  guestsCount: number;
  status: 'pending' | 'confirmed' | 'declined';
  roundSent: 0 | 1 | 2 | 3;
  respondedAt?: string;
  tableNumber?: number;
  token: string;
}
