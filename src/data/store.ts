import type { Asset, AssetType } from './models/asset';
import type { Booking } from './models/booking';
import type { CustodyEvent } from './models/custody';
import type { Incident } from './models/incident';

export interface Store {
  assets: Map<string, Asset>;
  assetTypes: Map<string, AssetType>;
  bookings: Map<string, Booking>;
  custodyEvents: Map<string, CustodyEvent>;
  incidents: Map<string, Incident>;
  reset(): void;
}

function createStore(): Store {
  const s: Store = {
    assets: new Map(),
    assetTypes: new Map(),
    bookings: new Map(),
    custodyEvents: new Map(),
    incidents: new Map(),
    reset() {
      s.assets.clear();
      s.assetTypes.clear();
      s.bookings.clear();
      s.custodyEvents.clear();
      s.incidents.clear();
    },
  };
  return s;
}

export const store = createStore();
