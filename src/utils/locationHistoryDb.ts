export interface LocationSample {
  id?: number;
  timestamp: number;
  lat: number;
  lng: number;
  accuracy: number | null;
}

const DB_NAME = 'north-bengal-travel-tracker';
const STORE_NAME = 'location-history';
const DB_VERSION = 1;

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async <T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | undefined> => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);
    let result: T | undefined;

    if (request) {
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => reject(request.error);
    }

    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

export const addLocationSample = (sample: LocationSample) =>
  withStore<IDBValidKey>('readwrite', (store) => store.add(sample));

export const getLocationHistory = async (): Promise<LocationSample[]> => {
  const result = await withStore<LocationSample[]>('readonly', (store) => store.getAll());
  return (result || []).sort((a, b) => a.timestamp - b.timestamp);
};

export const clearLocationHistory = () =>
  withStore<undefined>('readwrite', (store) => {
    store.clear();
  });
