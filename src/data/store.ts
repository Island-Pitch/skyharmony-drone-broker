import type { Asset, AssetType } from './models/asset';
import type { Booking } from './models/booking';
import type { CustodyEvent } from './models/custody';

export interface Store {
  assets: Map<string, Asset>;
  assetTypes: Map<string, AssetType>;
  bookings: Map<string, Booking>;
  custodyEvents: Map<string, CustodyEvent>;
  reset(): void;
}

function createStore(): Store {
  const s: Store = {
    assets: new Map(),
    assetTypes: new Map(),
    bookings: new Map(),
    custodyEvents: new Map(),
    reset() {
      s.assets.clear();
      s.assetTypes.clear();
      s.bookings.clear();
      s.custodyEvents.clear();
    },
  };
  return s;
}

export const store = createStore();
