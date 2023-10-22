import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
} from "azle";
import { v4 as uuidv4 } from "uuid";

type GoggleStore = Record<{
  id: string;
  name: string;
  location: string;
  owner: Principal;
  goggles: Vec<Goggle>;
  image: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type Goggle = Record<{
  id: string;
  size: string;
  power: string;
  glassType: string;
  gender: string;
  price: number;
  storeId: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type GoggleStorePayload = Record<{
  name: string;
  location: string;
  image: string;
}>;

type GogglePayload = Record<{
  size: string;
  power: string;
  glassType: string;
  gender: string;
  price: number;
  storeId: string;
}>;

const goggleStoreStorage = new StableBTreeMap<string, GoggleStore>(0, 44, 1024);
const goggleStorage = new StableBTreeMap<string, Goggle>(1, 44, 1024);

$update;
export function createGoggleStore(payload: GoggleStorePayload): Result<GoggleStore, string> {
  const goggleStore: GoggleStore = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    goggles: Vec.Empty,
    owner: ic.caller(),
    ...payload,
  };

  goggleStoreStorage.insert(goggleStore.id, goggleStore);
  return Result.Ok<GoggleStore, string>(goggleStore);
}

$query;
export function getGoggleStore(id: string): Result<GoggleStore, string> {
  return match(goggleStoreStorage.get(id), {
    Some: (store) => Result.Ok<GoggleStore, string>(store),
    None: () => Result.Err<GoggleStore, string>(`Goggle store with id=${id} not found.`),
  });
}

$update;
export function updateGoggleStore(id: string, payload: GoggleStorePayload): Result<GoggleStore, string> {
  return match(goggleStoreStorage.get(id), {
    Some: (existingStore) => {
      const updatedStore: GoggleStore = {
        ...existingStore,
        ...payload,
        updatedAt: Opt.Some(ic.time()),
      };

      goggleStoreStorage.insert(updatedStore.id, updatedStore);
      return Result.Ok<GoggleStore, string>(updatedStore);
    },
    None: () => Result.Err<GoggleStore, string>(`Goggle store with id=${id} not found.`),
  });
}

$update;
export function deleteGoggleStore(id: string): Result<GoggleStore, string> {
  return match(goggleStoreStorage.get(id), {
    Some: (existingStore) => {
      goggleStoreStorage.remove(id);
      return Result.Ok<GoggleStore, string>(existingStore);
    },
    None: () => Result.Err<GoggleStore, string>(`Goggle store with id=${id} not found.`),
  });
}

$query;
export function getAllGoggles(): Result<Vec<Goggle>, string> {
  return Result.Ok(goggleStorage.values());
}

$update;
export function createGoggle(payload: GogglePayload): Result<Goggle, string> {
  const goggle: Goggle = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    ...payload,
  };

  goggleStorage.insert(goggle.id, goggle);
  return Result.Ok<Goggle, string>(goggle);
}

$query;
export function getGoggle(id: string): Result<Goggle, string> {
  return match(goggleStorage.get(id), {
    Some: (goggle) => Result.Ok<Goggle, string>(goggle),
    None: () => Result.Err<Goggle, string>(`Goggle with id=${id} not found.`),
  });
}

$query;
export function getAllGoggleStores(): Result<Vec<GoggleStore>, string> {
  return Result.Ok(goggleStoreStorage.values());
}

$update;
export function updateGoggle(id: string, payload: GogglePayload): Result<Goggle, string> {
  return match(goggleStorage.get(id), {
    Some: (existingGoggle) => {
      const updatedGoggle: Goggle = {
        ...existingGoggle,
        ...payload,
        updatedAt: Opt.Some(ic.time()),
      };

      goggleStorage.insert(updatedGoggle.id, updatedGoggle);
      return Result.Ok<Goggle, string>(updatedGoggle);
    },
    None: () => Result.Err<Goggle, string>(`Goggle with id=${id} not found.`),
  });
}

$update;
export function deleteGoggle(id: string): Result<Goggle, string> {
  return match(goggleStorage.get(id), {
    Some: (existingGoggle) => {
      goggleStorage.remove(id);
      return Result.Ok<Goggle, string>(existingGoggle);
    },
    None: () => Result.Err<Goggle, string>(`Goggle with id=${id} not found.`),
  });
}

$query;
export function getStoreOwner(storeId: string): Result<Principal, string> {
  return match(goggleStoreStorage.get(storeId), {
    Some: (store) => Result.Ok<Principal, string>(store.owner),
    None: () => Result.Err<Principal, string>(`Goggle store with id=${storeId} not found.`),
  });
}

$query;
export function getGogglesInStore(storeId: string): Result<Vec<Goggle>, string> {
  const store = goggleStoreStorage.get(storeId);
  if (store.isSome()) {
    return Result.Ok(store.value.goggles);
  } else {
    return Result.Err(`Goggle store with id=${storeId} not found.`);
  }
}

$update;
export function addGoggleToStore(storeId: string, goggleId: string): Result<string, string> {
  const store = goggleStoreStorage.get(storeId);
  if (store.isSome()) {
    const updatedStore = { ...store.value, goggles: [...store.value.goggles, goggleId] };
    goggleStoreStorage.insert(storeId, updatedStore);
    return Result.Ok("Goggle added to store.");
  } else {
    return Result.Err(`Goggle store with id=${storeId} not found.`);
  }
}

$update;
export function removeGoggleFromStore(storeId: string, goggleId: string): Result<string, string> {
  const store = goggleStoreStorage.get(storeId);
  if (store.isSome()) {
    const updatedGoggles = store.value.goggles.filter((id) => id !== goggleId);
    const updatedStore = { ...store.value, goggles: updatedGoggles };
    goggleStoreStorage.insert(storeId, updatedStore);
    return Result.Ok("Goggle removed from store.");
  } else {
    return Result.Err(`Goggle store with id=${storeId} not found.`);
  }
}

globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
