// Import necessary modules
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

// Define the GoggleStore record structure
type GoggleStore = Record<{
  id: string;
  name: string;
  location: string;
  owner: Principal;
  goggleIds: Vec<string>;
  image: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Define the Goggle record structure
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

// Define the payload for creating a new GoggleStore record
type GoggleStorePayload = Record<{
  name: string;
  location: string;
  image: string;
}>;

// Define the payload for creating a new Goggle record
type GogglePayload = Record<{
  size: string;
  power: string;
  glassType: string;
  gender: string;
  price: number;
  storeId: string;
}>;

// Create a storage container for GoggleStores
const goggleStoreStorage = new StableBTreeMap<string, GoggleStore>(0, 44, 1024);

// Create a storage container for Goggles
const goggleStorage = new StableBTreeMap<string, Goggle>(1, 44, 1024);

$update;
// Function to create a new GoggleStore record
export function createGoggleStore(payload: GoggleStorePayload): Result<GoggleStore, string> {
  // Validate payload: Check if required fields in the payload are missing
  if (!payload.name || !payload.location || !payload.image) {
    return Result.Err<GoggleStore, string>("Missing required fields in payload");
  }

  // Create a new GoggleStore object
  const goggleStore: GoggleStore = {
    id: uuidv4(),
    name: payload.name,
    location: payload.location,
    image: payload.image,
    createdAt: ic.time(),
    updatedAt: Opt.None,
    goggleIds: [],
    owner: ic.caller(),
  };

  try {
    // Insert the new GoggleStore record into storage
    goggleStoreStorage.insert(goggleStore.id, goggleStore);
    return Result.Ok<GoggleStore, string>(goggleStore);
  } catch (error) {
    return Result.Err<GoggleStore, string>("Error occurred during GoggleStore insertion");
  }
}

$query;
// Function to retrieve a GoggleStore by its ID
export function getGoggleStoreById(id: string): Result<GoggleStore, string> {
  // Parameter validation: Check if ID is invalid or missing
  if (!id) {
    return Result.Err<GoggleStore, string>(`Invalid id=${id}.`);
  }
  try {
    return match(goggleStoreStorage.get(id), {
      Some: (store) => Result.Ok<GoggleStore, string>(store),
      None: () => Result.Err<GoggleStore, string>(`Goggle store with id=${id} not found.`),
    });
  } catch (error) {
    return Result.Err<GoggleStore, string>(`Error while retrieving GoggleStore with id ${id}`);
  }
}

$update;
// Function to update a GoggleStore record
export function updateGoggleStore(id: string, payload: GoggleStorePayload): Result<GoggleStore, string> {
  // Parameter validation: Check if ID is invalid or missing
  if (!id) {
    return Result.Err<GoggleStore, string>(`Invalid id=${id}.`);
  }

  // Validate payload: Check if required fields in the payload are missing
  if (!payload.name || !payload.location || !payload.image) {
    return Result.Err<GoggleStore, string>("Missing required fields in payload.");
  }

  return match(goggleStoreStorage.get(id), {
    Some: (existingStore) => {
      // Create an updated GoggleStore object
      const updatedStore: GoggleStore = {
        ...existingStore,
        name: payload.name,
        location: payload.location,
        image: payload.image,
        updatedAt: Opt.Some(ic.time()),
      };

      try {
        // Update the GoggleStore record in storage
        goggleStoreStorage.insert(updatedStore.id, updatedStore);
        return Result.Ok<GoggleStore, string>(updatedStore);
      } catch (error) {
        return Result.Err<GoggleStore, string>(`Error updating GoggleStore: ${error}`);
      }
    },

    None: () => Result.Err<GoggleStore, string>(`Goggle store with id=${id} not found.`),
  });
}

$update;
// Function to delete a GoggleStore by its ID
export function deleteGoggleStore(id: string): Result<GoggleStore, string> {
  // Parameter validation: Check if ID is invalid or missing
  if (!id) {
    return Result.Err<GoggleStore, string>(`Invalid id=${id}.`);
  }
  try {
    return match(goggleStoreStorage.get(id), {
      Some: (existingStore) => {
        // Check if the caller is the owner of the GoggleStore
        if (existingStore.owner.toString() !== ic.caller.toString()) {
          return Result.Err<GoggleStore, string>("User does not have the right to delete GoggleStore");
        }

        // Remove the GoggleStore from storage
        goggleStoreStorage.remove(id);
        return Result.Ok<GoggleStore, string>(existingStore);
      },
      None: () => Result.Err<GoggleStore, string>(`Goggle store with id=${id} not found.`),
    });
  } catch (error) {
    return Result.Err<GoggleStore, string>(`Error deleting GoggleStore with id=${id}: ${error}`);
  }
}

$update;
// Function to create a new Goggle
export function createGoggle(storeId: string, payload: GogglePayload): Result<Goggle, string> {
  // Parameter validation: Check if storeId is invalid or missing
  if (!storeId) {
    return Result.Err<Goggle, string>('Invalid storeId.');
  }

  return match(goggleStoreStorage.get(storeId), {
    Some: (goggleStore) => {
      // Validate payload: Check if required fields in the payload are missing
      if (
        !payload.size ||
        !payload.power ||
        !payload.glassType ||
        !payload.gender ||
        payload.price <= 0
      ) {
        return Result.Err<Goggle, string>('Missing or invalid fields in payload.');
      }

      // Create a new Goggle object
      const goggle: Goggle = {
        id: uuidv4(),
        size: payload.size,
        power: payload.power,
        glassType: payload.glassType,
        gender: payload.gender,
        price: payload.price,
        storeId: goggleStore.id,
        createdAt: ic.time(),
        updatedAt: Opt.None,
      };

      try {
        // Insert the new Goggle record into storage
        goggleStorage.insert(goggle.id, goggle);

        // Add the created Goggle to the GoggleStore
        goggleStore.goggleIds.push(goggle.id);
        goggleStoreStorage.insert(goggleStore.id, goggleStore);

        return Result.Ok<Goggle, string>(goggle);
      } catch (error) {
        return Result.Err<Goggle, string>(`Error creating Goggle: ${error}`);
      }
    },
    None: () => Result.Err<Goggle, string>(`Goggle store with id=${storeId} not found.`),
  });
}

$query;
// Function to retrieve a Goggle by its ID
export function getGoggleById(id: string): Result<Goggle, string> {
  // Parameter validation: Check if ID is invalid or missing
  if (!id) {
    return Result.Err<Goggle, string>(`Invalid id=${id}.`);
  }
  try {
    return match(goggleStorage.get(id), {
      Some: (goggle) => Result.Ok<Goggle, string>(goggle),
      None: () => Result.Err<Goggle, string>(`Goggle with id=${id} not found.`),
    });
  } catch (error) {
    return Result.Err<Goggle, string>(`Error while retrieving Goggle with id ${id}`);
  }
}

$query;
// Function to retrieve all Goggles
export function getAllGoggles(): Result<Vec<Goggle>, string> {
  try {
    return Result.Ok(goggleStorage.values());
  } catch (error) {
    return Result.Err(`Failed to get all Goggles: ${error}`);
  }
}

$update;
// Function to update a Goggle record
export function updateGoggle(id: string, payload: GogglePayload): Result<Goggle, string> {
  // Parameter validation: Check if ID is invalid or missing
  if (!id) {
    return Result.Err<Goggle, string>('Invalid id.');
  }

  // Validate payload: Check if required fields in the payload are missing
  if (
    !payload.size ||
    !payload.power ||
    !payload.glassType ||
    !payload.gender ||
    payload.price <= 0
  ) {
    return Result.Err<Goggle, string>('Missing or invalid fields in payload.');
  }

  return match(goggleStorage.get(id), {
    Some: (existingGoggle) => {
      // Create an updated Goggle object
      const updatedGoggle: Goggle = {
        ...existingGoggle,
        size: payload.size,
        power: payload.power,
        glassType: payload.glassType,
        gender: payload.gender,
        price: payload.price,
        updatedAt: Opt.Some(ic.time()),
      };

      try {
        // Update the Goggle record in storage
        goggleStorage.insert(updatedGoggle.id, updatedGoggle);
        return Result.Ok<Goggle, string>(updatedGoggle);
      } catch (error) {
        return Result.Err<Goggle, string>(`Error updating Goggle: ${error}`);
      }
    },

    None: () => Result.Err<Goggle, string>(`Goggle with id=${id} not found.`),
  });
}

$update;
// Function to delete a Goggle by its ID
export function deleteGoggle(id: string): Result<Goggle, string> {
  // Parameter validation: Check if ID is invalid or missing
  if (!id) {
    return Result.Err<Goggle, string>(`Invalid id=${id}.`);
  }
  try {
    return match(goggleStorage.get(id), {
      Some: (existingGoggle) => {
        // Remove the Goggle from storage
        goggleStorage.remove(id);
        return Result.Ok<Goggle, string>(existingGoggle);
      },
      None: () => Result.Err<Goggle, string>(`Goggle with id=${id} not found.`),
    });
  } catch (error) {
    return Result.Err<Goggle, string>(`Error deleting Goggle with id=${id}: ${error}`);
  }
}

// Mock crypto object for testing purposes
globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
