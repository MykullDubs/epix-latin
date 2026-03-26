// src/utils/localCache.ts

const DB_NAME = 'MagisterOS_Cache';
const STORE_NAME = 'decks';
const DB_VERSION = 1;

// Initialize the local database
function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // We use the deck's ID as the primary key
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

// Save a downloaded deck to the device
export async function saveDeckToCache(deckId: string, cards: any[], updatedAt: number) {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        store.put({ id: deckId, cards, updatedAt });
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn("Magister OS: Failed to cache deck locally.", err);
    }
}

// Retrieve a deck from the device
export async function getDeckFromCache(deckId: string): Promise<{ cards: any[], updatedAt: number } | null> {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(deckId);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn("Magister OS: Failed to retrieve from local cache.", err);
        return null;
    }
}
