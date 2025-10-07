export interface Ride {
  id: string;
  driverEmail: string;
  school: string;
  from: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  seatsAvailable: number;
  pricePerPerson?: number;
  notes?: string;
  passengers: string[];
  createdAt: Date;
}