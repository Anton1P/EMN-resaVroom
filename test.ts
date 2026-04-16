
import 'dotenv/config';
import { createTrip } from './src/lib/services/trip-service.ts';

createTrip({
  vehicleId: 'cmo01vmcj0003tkfipbsjcw9q',
  driverEntraId: 'dev-user-entra-001',
  driverEmail: 'dev1@e.com',
  driverDisplayName: 'User 1',
  type: 'ONE_WAY',
  originCampusId: 'cmo01vl5j0000tkfi0w7av8j2',
  destinationCampusId: 'cmo01vl5j0000tkfi0w7av8j2',
  departureTime: new Date(Date.now() + 100000000),
  estimatedArrivalTime: new Date(Date.now() + 200000000),
  returnCampusId: null,
  passengers: [{ userEntraId: 'dev-user-entra-002', userEmail: 'dev2@e.com', userDisplayName: 'User 2' }]
}).then(r => console.log('success')).catch(e => console.log('FAIL:', e));
