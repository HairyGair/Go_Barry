/**
 * Photo Storage and Management System
 * Phase 2 Priority 3: Camera Integration with PWA Offline Support
 * 
 * Features:
 * - IndexedDB storage for photos
 * - Offline photo management
 * - Background sync for photo uploads
 * - Photo compression and optimization
 * - Gallery management with metadata
 */

class PhotoStorageManager {
    constructor() {
        this.dbName = 'BreakdownGuidePhotos';
        this.dbVersion = 1;
        this.db = null;
        this.maxPhotoSize = 5 * 1024 * 1024; // 5MB max per photo
        this.compressionQuality = 0.8;
        
        this.init();
    }
    
    async init() {
        try {
            this.db = await this.openDatabase();
            console.log('📸 Photo storage initialized');
        } catch (error) {
            console.error('❌ Photo storage initialization failed:', error);
        }
    }
    
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Photos store
                if (!db.objectStoreNames.contains('photos')) {
                    const photosStore = db.createObjectStore('photos', { keyPath: 'id' });
                    photosStore.createIndex('assessmentId', 'assessmentId', { unique: false });
                    photosStore.createIndex('timestamp', 'timestamp', { unique: false });
                    photosStore.createIndex('synced', 'synced', { unique: false });
                }
                
                // Photo metadata store
                if (!db.objectStoreNames.contains('photoMeta')) {
                    const metaStore = db.createObjectStore('photoMeta', { keyPath: 'id' });
                    metaStore.createIndex('assessmentId', 'assessmentId', { unique: false });
                }
            };
        });
    }
    
    async savePhoto(photoData, assessmentId = null) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        
        try {
            // Compress photo if needed
            const compressedPhoto = await this.compressPhoto(photoData.blob);
            
            const photoRecord = {
                id: photoData.id || this.generatePhotoId(),
                assessmentId: assessmentId,
                blob: compressedPhoto,
                originalSize: photoData.blob.size,
                compressedSize: compressedPhoto.size,
                timestamp: photoData.timestamp || new Date().toISOString(),
                type: compressedPhoto.type,
                synced: false,
                uploadAttempts: 0,
                metadata: {
                    location: await this.getCurrentLocation(),
                    deviceInfo: this.getDeviceInfo(),
                    compressionRatio: Math.round((1 - compressedPhoto.size / photoData.blob.size) * 100)
                }
            };
            
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            
            await new Promise((resolve, reject) => {
                const request = store.add(photoRecord);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            console.log('📷 Photo saved:', photoRecord.id);
            
            // Trigger background sync if online
            if (navigator.onLine && 'serviceWorker' in navigator) {
                this.requestPhotoSync();
            }
            
            return photoRecord;
            
        } catch (error) {
            console.error('❌ Failed to save photo:', error);
            throw error;
        }
    }
    
    async compressPhoto(blob, quality = this.compressionQuality) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions (max 1920x1080)
                const maxWidth = 1920;
                const maxHeight = 1080;
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((compressedBlob) => {
                    resolve(compressedBlob || blob);
                }, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(blob);
        });
    }
    
    async getPhotosForAssessment(assessmentId) {
        if (!this.db) return [];
        
        try {
            const transaction = this.db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            const index = store.index('assessmentId');
            
            return new Promise((resolve, reject) => {
                const request = index.getAll(assessmentId);
                request.onsuccess = () => {
                    const photos = request.result.map(photo => ({
                        ...photo,
                        url: URL.createObjectURL(photo.blob)
                    }));
                    resolve(photos);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Failed to get photos:', error);
            return [];
        }
    }
    
    async getAllPhotos() {
        if (!this.db) return [];
        
        try {
            const transaction = this.db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    const photos = request.result.map(photo => ({
                        ...photo,
                        url: URL.createObjectURL(photo.blob)
                    }));
                    resolve(photos);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Failed to get all photos:', error);
            return [];
        }
    }
    
    async getUnsyncedPhotos() {
        if (!this.db) return [];
        
        try {
            const transaction = this.db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            const index = store.index('synced');
            
            return new Promise((resolve, reject) => {
                const request = index.getAll(false);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Failed to get unsynced photos:', error);
            return [];
        }
    }
    
    async deletePhoto(photoId) {
        if (!this.db) return false;
        
        try {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            
            return new Promise((resolve, reject) => {
                const request = store.delete(photoId);
                request.onsuccess = () => {
                    console.log('🗑️ Photo deleted:', photoId);
                    resolve(true);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Failed to delete photo:', error);
            return false;
        }
    }
    
    async markPhotoSynced(photoId) {
        if (!this.db) return false;
        
        try {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            
            const photo = await new Promise((resolve, reject) => {
                const request = store.get(photoId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            if (photo) {
                photo.synced = true;
                photo.syncedAt = new Date().toISOString();
                
                return new Promise((resolve, reject) => {
                    const request = store.put(photo);
                    request.onsuccess = () => {
                        console.log('✅ Photo marked as synced:', photoId);
                        resolve(true);
                    };
                    request.onerror = () => reject(request.error);
                });
            }
            
            return false;
        } catch (error) {
            console.error('❌ Failed to mark photo as synced:', error);
            return false;
        }
    }
    
    async uploadPhotos() {
        const unsyncedPhotos = await this.getUnsyncedPhotos();
        const results = [];
        
        for (const photo of unsyncedPhotos) {
            try {
                const uploaded = await this.uploadSinglePhoto(photo);
                if (uploaded) {
                    await this.markPhotoSynced(photo.id);
                    results.push({ id: photo.id, success: true });
                } else {
                    results.push({ id: photo.id, success: false, error: 'Upload failed' });
                }
            } catch (error) {
                console.error('❌ Photo upload failed:', photo.id, error);
                results.push({ id: photo.id, success: false, error: error.message });
            }
        }
        
        return results;
    }
    
    async uploadSinglePhoto(photo) {
        try {
            const formData = new FormData();
            formData.append('photo', photo.blob, `${photo.id}.jpg`);
            formData.append('assessmentId', photo.assessmentId || '');
            formData.append('timestamp', photo.timestamp);
            formData.append('metadata', JSON.stringify(photo.metadata));
            
            const response = await fetch('/api/breakdown/photos', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                console.log('📤 Photo uploaded successfully:', photo.id);
                return true;
            } else {
                console.error('❌ Photo upload failed:', response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.error('❌ Photo upload error:', error);
            return false;
        }
    }
    
    async requestPhotoSync() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
            try {
                const registration = await navigator.serviceWorker.ready;
                if (registration.sync) {
                    await registration.sync.register('photo-upload');
                    console.log('🔄 Photo sync requested');
                }
            } catch (error) {
                console.error('❌ Failed to request photo sync:', error);
            }
        }
    }
    
    generatePhotoId() {
        return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    async getCurrentLocation() {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            timestamp: position.timestamp
                        });
                    },
                    () => resolve(null),
                    { timeout: 5000, enableHighAccuracy: false }
                );
            } else {
                resolve(null);
            }
        });
    }
    
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: {
                width: screen.width,
                height: screen.height,
                pixelRatio: window.devicePixelRatio
            }
        };
    }
    
    async getStorageStats() {
        try {
            const photos = await this.getAllPhotos();
            const totalSize = photos.reduce((sum, photo) => sum + photo.compressedSize, 0);
            const syncedCount = photos.filter(photo => photo.synced).length;
            
            return {
                totalPhotos: photos.length,
                syncedPhotos: syncedCount,
                unsyncedPhotos: photos.length - syncedCount,
                totalSize: totalSize,
                averageSize: totalSize / photos.length || 0,
                compressionSavings: photos.reduce((sum, photo) => 
                    sum + (photo.originalSize - photo.compressedSize), 0
                )
            };
        } catch (error) {
            console.error('❌ Failed to get storage stats:', error);
            return null;
        }
    }
    
    async clearAllPhotos() {
        if (!this.db) return false;
        
        try {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            
            return new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => {
                    console.log('🗑️ All photos cleared');
                    resolve(true);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Failed to clear photos:', error);
            return false;
        }
    }
}

// Photo Gallery Component
const PhotoGallery = ({ photos = [], onDeletePhoto, onViewPhoto, className = '' }) => {
    if (photos.length === 0) {
        return React.createElement('div', {
            className: `text-center p-8 bg-gray-800/40 rounded-lg border border-gray-600/30 ${className}`
        }, [
            React.createElement('div', { 
                key: 'icon',
                className: 'text-4xl mb-4' 
            }, '📷'),
            React.createElement('h3', { 
                key: 'title',
                className: 'text-lg font-semibold text-gray-300 mb-2' 
            }, 'No Photos Yet'),
            React.createElement('p', { 
                key: 'message',
                className: 'text-gray-400 text-sm' 
            }, 'Photos will appear here once captured')
        ]);
    }
    
    return React.createElement('div', {
        className: `space-y-4 ${className}`
    }, [
        React.createElement('div', {
            key: 'header',
            className: 'flex items-center justify-between'
        }, [
            React.createElement('h3', {
                key: 'title',
                className: 'text-lg font-semibold text-white'
            }, `Photos (${photos.length})`),
            
            React.createElement('div', {
                key: 'stats',
                className: 'text-sm text-gray-300'
            }, `${Math.round(photos.reduce((sum, p) => sum + p.compressedSize, 0) / 1024)}KB total`)
        ]),
        
        React.createElement('div', {
            key: 'grid',
            className: 'grid grid-cols-2 sm:grid-cols-3 gap-3'
        }, photos.map((photo, index) => 
            React.createElement('div', {
                key: photo.id,
                className: 'relative bg-gray-800 rounded-lg overflow-hidden group'
            }, [
                React.createElement('img', {
                    key: 'image',
                    src: photo.url,
                    alt: `Photo ${index + 1}`,
                    className: 'w-full h-32 object-cover cursor-pointer',
                    onClick: () => onViewPhoto?.(photo)
                }),
                
                // Overlay with actions
                React.createElement('div', {
                    key: 'overlay',
                    className: 'absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2'
                }, [
                    React.createElement('button', {
                        key: 'view',
                        onClick: () => onViewPhoto?.(photo),
                        className: 'w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all'
                    }, '👁️'),
                    
                    React.createElement('button', {
                        key: 'delete',
                        onClick: () => onDeletePhoto?.(photo.id),
                        className: 'w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-all'
                    }, '🗑️')
                ]),
                
                // Photo info
                React.createElement('div', {
                    key: 'info',
                    className: 'absolute bottom-1 left-1 right-1'
                }, [
                    React.createElement('div', {
                        key: 'size',
                        className: 'text-xs text-white bg-black/60 rounded px-1 mb-1'
                    }, `${Math.round(photo.compressedSize / 1024)}KB`),
                    
                    !photo.synced && React.createElement('div', {
                        key: 'sync-status',
                        className: 'text-xs text-amber-300 bg-amber-900/60 rounded px-1'
                    }, '⏳ Pending sync')
                ])
            ])
        ))
    ]);
};

// Initialize photo storage
window.PhotoStorage = new PhotoStorageManager();
window.PhotoGallery = PhotoGallery;

console.log('📸 Photo storage and management system loaded');
