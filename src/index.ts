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

// Authentication and Authorization Middleware
function authenticateUser(): Principal | null {
  const user = ic.caller();
  // Implement your authentication logic here
  // Return null for unauthenticated users
  // Check if user has necessary permissions
  return user; // Return authenticated user
}

export function createGoggleStore(payload: GoggleStorePayload): Result<GoggleStore, string> {
  const user = authenticateUser();
  if (!user) {
    return Result.Err<GoggleStore, string>("Unauthorized. Please log in.");
  }

  const goggleStore: GoggleStore = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    goggles: [],
    owner: user,
    ...payload,
  };

  goggleStoreStorage.insert(goggleStore.id, goggleStore);
  return Result.Ok<GoggleStore, string>(goggleStore);
}

$query;
export function getGoggleStore(id: string): Result<GoggleStore, string> {
  const user = authenticateUser();
  if (!user) {
    return Result.Err<GoggleStore, string>("Unauthorized. Please log in.");
  }

  return match(goggleStoreStorage.get(id), {
    Some: (store) => Result.Ok<GoggleStore, string>(store),
    None: () => Result.Err<GoggleStore, string>(`Goggle store with id=${id} not found.`),
  });
}

// Implement updateGoggleStore, deleteGoggleStore and other functions with similar authorization checks.

$update;

export function createGoggle(payload: GogglePayload): Result<Goggle, string> {
  const user = authenticateUser();
  if (!user) {
    return Result.Err<Goggle, string>("Unauthorized. Please log in.");
  }

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
  const user = authenticateUser();
  if (!user) {
    return Result.Err<Goggle, string>("Unauthorized. Please log in.");
  }

  return match(goggleStorage.get(id), {
    Some: (goggle) => Result.Ok<Goggle, string>(goggle),
    None: () => Result.Err<Goggle, string>(`Goggle with id=${id} not found.`),
  });
}

// Implement updateGoggle, deleteGoggle, and other functions with similar authorization checks.

$query;
export function getAllGoggles(): Result<Vec<Goggle>, string> {
  const user = authenticateUser();
  if (!user) {
    return Result.Err<Vec<Goggle>, string>("Unauthorized. Please log in.");
  }

  return Result.Ok(goggleStorage.values());
}
