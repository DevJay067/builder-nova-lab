// Permanent Storage Service for Health Data

export interface StorageItem {
  id: string;
  data: any;
  timestamp: number;
  userId: string;
  type: 'health-record' | 'tracking-data' | 'user-settings' | 'notifications';
  encrypted: boolean;
  checksum: string;
}

class PermanentStorageService {
  private storageKey = 'healthchain_permanent_data';
  private encryptionKey: string;
  private userId: string | null = null;

  constructor() {
    this.encryptionKey = this.getOrCreateEncryptionKey();
    this.initializeUserId();
  }

  private getOrCreateEncryptionKey(): string {
    let key = localStorage.getItem('healthchain_encryption_key');
    if (!key) {
      key = crypto.lib.WordArray.random(256/8).toString();
      localStorage.setItem('healthchain_encryption_key', key);
    }
    return key;
  }

  private initializeUserId(): void {
    // Get user ID from session or create persistent one
    this.userId = this.getCurrentUserId() || this.createPersistentUserId();
  }

  private getCurrentUserId(): string | null {
    // Try to get from session storage first
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
      try {
        // Extract user info from session
        const user = localStorage.getItem('healthchain_user');
        if (user) {
          const userData = JSON.parse(user);
          return userData.username || userData.id || userData.userHash;
        }
      } catch (error) {
        console.warn('Could not parse user data from session');
      }
    }

    // Try to get from permanent storage
    return localStorage.getItem('healthchain_permanent_user_id');
  }

  private createPersistentUserId(): string {
    // Create a unique, persistent user ID based on browser fingerprint
    const fingerprint = this.createBrowserFingerprint();
    const userId = crypto.SHA256(fingerprint).toString();
    
    localStorage.setItem('healthchain_permanent_user_id', userId);
    this.userId = userId;
    
    return userId;
  }

  private createBrowserFingerprint(): string {
    // Create a unique fingerprint for this browser/device
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      navigator.platform,
      localStorage.getItem('healthchain_device_id') || this.generateDeviceId()
    ];
    
    return components.join('|');
  }

  private generateDeviceId(): string {
    const deviceId = crypto.lib.WordArray.random(128/8).toString();
    localStorage.setItem('healthchain_device_id', deviceId);
    return deviceId;
  }

  private encrypt(data: any): string {
    return crypto.AES.encrypt(JSON.stringify(data), this.encryptionKey).toString();
  }

  private decrypt(encryptedData: string): any {
    const bytes = crypto.AES.decrypt(encryptedData, this.encryptionKey);
    return JSON.parse(bytes.toString(crypto.enc.Utf8));
  }

  private generateChecksum(data: any): string {
    return crypto.SHA256(JSON.stringify(data)).toString();
  }

  private getAllStoredData(): StorageItem[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading permanent storage:', error);
    }
    return [];
  }

  private saveAllData(items: StorageItem[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
      
      // Also backup to IndexedDB for extra reliability
      this.backupToIndexedDB(items);
    } catch (error) {
      console.error('Error saving to permanent storage:', error);
    }
  }

  store(data: any, type: StorageItem['type'], encrypt: boolean = true): string {
    if (!this.userId) {
      throw new Error('User ID not initialized');
    }

    const id = crypto.lib.WordArray.random(128/8).toString();
    const timestamp = Date.now();
    const checksum = this.generateChecksum(data);

    const item: StorageItem = {
      id,
      data: encrypt ? this.encrypt(data) : data,
      timestamp,
      userId: this.userId,
      type,
      encrypted: encrypt,
      checksum
    };

    const allData = this.getAllStoredData();
    allData.push(item);
    
    this.saveAllData(allData);
    this.cleanupOldData(); // Remove old data to prevent storage bloat

    console.log(`✅ Stored ${type} data permanently (ID: ${id})`);
    return id;
  }

  retrieve(id: string): any {
    const allData = this.getAllStoredData();
    const item = allData.find(item => item.id === id && item.userId === this.userId);
    
    if (!item) {
      return null;
    }

    try {
      const data = item.encrypted ? this.decrypt(item.data) : item.data;
      
      // Verify checksum
      if (this.generateChecksum(data) !== item.checksum) {
        console.warn('Data integrity check failed for item:', id);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  retrieveByType(type: StorageItem['type']): any[] {
    if (!this.userId) return [];

    const allData = this.getAllStoredData();
    const userItems = allData.filter(item => 
      item.userId === this.userId && item.type === type
    );

    return userItems.map(item => {
      try {
        const data = item.encrypted ? this.decrypt(item.data) : item.data;
        return { ...data, _id: item.id, _timestamp: item.timestamp };
      } catch (error) {
        console.error('Error decrypting item:', item.id);
        return null;
      }
    }).filter(Boolean);
  }

  update(id: string, newData: any): boolean {
    const allData = this.getAllStoredData();
    const index = allData.findIndex(item => 
      item.id === id && item.userId === this.userId
    );

    if (index === -1) {
      return false;
    }

    const item = allData[index];
    const checksum = this.generateChecksum(newData);

    allData[index] = {
      ...item,
      data: item.encrypted ? this.encrypt(newData) : newData,
      timestamp: Date.now(),
      checksum
    };

    this.saveAllData(allData);
    return true;
  }

  delete(id: string): boolean {
    const allData = this.getAllStoredData();
    const filteredData = allData.filter(item => 
      !(item.id === id && item.userId === this.userId)
    );

    if (filteredData.length === allData.length) {
      return false; // Nothing was deleted
    }

    this.saveAllData(filteredData);
    return true;
  }

  // Store health records permanently
  storeHealthRecord(record: any): string {
    return this.store(record, 'health-record', true);
  }

  // Store tracking data permanently
  storeTrackingData(data: any): string {
    // First, remove any existing tracking data for this user
    this.deleteByType('tracking-data');
    return this.store(data, 'tracking-data', true);
  }

  // Get all health records for current user
  getHealthRecords(): any[] {
    return this.retrieveByType('health-record');
  }

  // Get tracking data for current user
  getTrackingData(): any {
    const trackingData = this.retrieveByType('tracking-data');
    return trackingData.length > 0 ? trackingData[0] : null;
  }

  private deleteByType(type: StorageItem['type']): void {
    if (!this.userId) return;

    const allData = this.getAllStoredData();
    const filteredData = allData.filter(item => 
      !(item.userId === this.userId && item.type === type)
    );

    this.saveAllData(filteredData);
  }

  private cleanupOldData(): void {
    const allData = this.getAllStoredData();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Keep all health records and recent data only
    const cleanedData = allData.filter(item => {
      if (item.type === 'health-record') return true; // Keep all health records
      return item.timestamp > thirtyDaysAgo; // Keep recent data only
    });

    if (cleanedData.length !== allData.length) {
      this.saveAllData(cleanedData);
      console.log(`🧹 Cleaned up ${allData.length - cleanedData.length} old items`);
    }
  }

  // Backup to IndexedDB for extra reliability
  private async backupToIndexedDB(items: StorageItem[]): Promise<void> {
    try {
      const dbName = 'HealthChainBackup';
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['storage'], 'readwrite');
        const store = transaction.objectStore('storage');
        
        // Clear existing data
        store.clear();
        
        // Add all current data
        items.forEach(item => store.add(item));
      };
    } catch (error) {
      console.warn('IndexedDB backup failed:', error);
    }
  }

  // Restore from IndexedDB if localStorage fails
  async restoreFromIndexedDB(): Promise<void> {
    try {
      const dbName = 'HealthChainBackup';
      const request = indexedDB.open(dbName, 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['storage'], 'readonly');
        const store = transaction.objectStore('storage');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const items = getAllRequest.result;
          if (items.length > 0) {
            localStorage.setItem(this.storageKey, JSON.stringify(items));
            console.log('✅ Restored data from IndexedDB backup');
          }
        };
      };
    } catch (error) {
      console.warn('IndexedDB restore failed:', error);
    }
  }

  // Export data for backup
  exportData(): string {
    if (!this.userId) return '';

    const userData = this.getAllStoredData().filter(item => item.userId === this.userId);
    return JSON.stringify({
      userId: this.userId,
      exportDate: new Date().toISOString(),
      data: userData
    }, null, 2);
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const backup = JSON.parse(jsonData);
      if (!backup.userId || !backup.data) {
        throw new Error('Invalid backup format');
      }

      const allData = this.getAllStoredData();
      const existingUserData = allData.filter(item => item.userId !== backup.userId);
      const newData = [...existingUserData, ...backup.data];

      this.saveAllData(newData);
      console.log(`✅ Imported ${backup.data.length} items from backup`);
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }

  // Get storage statistics
  getStorageStats() {
    const allData = this.getAllStoredData();
    const userData = allData.filter(item => item.userId === this.userId);

    return {
      totalItems: userData.length,
      healthRecords: userData.filter(item => item.type === 'health-record').length,
      trackingData: userData.filter(item => item.type === 'tracking-data').length,
      userSettings: userData.filter(item => item.type === 'user-settings').length,
      notifications: userData.filter(item => item.type === 'notifications').length,
      oldestItem: userData.length > 0 ? new Date(Math.min(...userData.map(item => item.timestamp))) : null,
      newestItem: userData.length > 0 ? new Date(Math.max(...userData.map(item => item.timestamp))) : null,
      storageSize: JSON.stringify(userData).length
    };
  }
}

// Create singleton instance
export const permanentStorage = new PermanentStorageService();
export default permanentStorage;
