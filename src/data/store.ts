import type { Asset, AssetType } from './models/asset';

export interface Store {
  assets: Map<string, Asset>;
  assetTypes: Map<string, AssetType>;
  reset(): void;
}

function createStore(): Store {
  const s: Store = {
    assets: new Map(),
    assetTypes: new Map(),
    reset() {
      s.assets.clear();
      s.assetTypes.clear();
    },
  };
  return s;
}

export const store = createStore();
