/**
 * Image Optimizer
 * 
 * Funktionen zur Bildoptimierung für die PWA
 */

export const imageOptimizer = {
  // ============================================
  // BILD KOMPRESSIEREN
  // ============================================
  
  /**
   * Bild komprimieren und skalieren
   */
  async compressImage(file, options = {}) {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
      type = 'image/jpeg',
    } = options;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Seitenverhältnis beibehalten
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
        
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        
        const ctx = canvas.getContext('2d');
        
        // Weißer Hintergrund für JPEG
        if (type === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          type,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      reader.readAsDataURL(file);
    });
  },
  
  // ============================================
  // WEBP KONVERTIERUNG
  // ============================================
  
  /**
   * Bild zu WebP konvertieren
   */
  async convertToWebP(file, quality = 0.8) {
    // Überprüfen ob WebP unterstützt wird
    const canvas = document.createElement('canvas');
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') !== 0) {
      console.warn('[ImageOptimizer] WebP not supported, returning original');
      return file;
    }
    
    return this.compressImage(file, { quality, type: 'image/webp' });
  },
  
  // ============================================
  // RESPONSIVE BILDER
  // ============================================
  
  /**
   * Mehrere Größen eines Bildes erstellen
   */
  async createResponsiveImages(file) {
    const sizes = [
      { width: 400, suffix: 'sm', quality: 0.7 },
      { width: 800, suffix: 'md', quality: 0.8 },
      { width: 1200, suffix: 'lg', quality: 0.85 },
    ];
    
    const images = {};
    
    for (const size of sizes) {
      try {
        images[size.suffix] = await this.compressImage(file, {
          maxWidth: size.width,
          quality: size.quality,
        });
      } catch (error) {
        console.error(`[ImageOptimizer] Failed to create ${size.suffix}:`, error);
      }
    }
    
    return images;
  },
  
  // ============================================
  // BILD-ANALYSE
  // ============================================
  
  /**
   * Bilddimensionen abrufen
   */
  async getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
        });
      };
      
      img.onerror = reject;
      reader.onerror = reject;
      
      reader.readAsDataURL(file);
    });
  },
  
  /**
   * Dateigröße formatieren
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // ============================================
  // LAZY LOADING
  // ============================================
  
  /**
   * Lazy-Loading Bild erstellen
   */
  createLazyImage(src, alt, options = {}) {
    const {
      placeholder = '/images/placeholder.svg',
      sizes = '100vw',
      srcset = null,
      className = '',
      loading = 'lazy',
    } = options;
    
    const img = document.createElement('img');
    img.dataset.src = src;
    img.src = placeholder;
    img.alt = alt;
    img.loading = loading;
    img.decoding = 'async';
    
    if (className) {
      img.className = className;
    }
    
    if (srcset) {
      img.dataset.srcset = srcset;
    }
    
    if (sizes) {
      img.sizes = sizes;
    }
    
    // Intersection Observer für Lazy Loading
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            
            // Srcset laden wenn vorhanden
            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset;
            }
            
            // Hauptbild laden
            img.src = img.dataset.src;
            
            // Laden-Event
            img.onload = () => {
              img.classList.add('loaded');
            };
            
            // Observer entfernen
            obs.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01,
      });
      
      observer.observe(img);
    } else {
      // Fallback: Sofort laden
      img.src = src;
      if (srcset) {
        img.srcset = srcset;
      }
    }
    
    return img;
  },
  
  // ============================================
  // BILD-VORSCHAU
  // ============================================
  
  /**
   * Data URL für Vorschau erstellen
   */
  async createPreview(file, maxWidth = 200) {
    const compressed = await this.compressImage(file, {
      maxWidth,
      quality: 0.6,
      type: 'image/jpeg',
    });
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(compressed);
    });
  },
  
  // ============================================
  // BILD-VALIDIERUNG
  // ============================================
  
  /**
   * Datei validieren
   */
  validateImage(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      minWidth = 100,
      minHeight = 100,
    } = options;
    
    const errors = [];
    
    // Dateityp prüfen
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Ungültiges Dateiformat. Erlaubt: ${allowedTypes.join(', ')}`);
    }
    
    // Dateigröße prüfen
    if (file.size > maxSize) {
      errors.push(`Datei zu groß (max. ${this.formatFileSize(maxSize)})`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
  
  // ============================================
  // SERVICE WORKER CACHE
  // ============================================
  
  /**
   * Bild im Service Worker Cache speichern
   */
  async cacheImage(imageUrl, recipeId) {
    if (!('serviceWorker' in navigator)) return false;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      registration.active.postMessage({
        type: 'CACHE_RECIPE_IMAGE',
        imageUrl,
        recipeId,
      });
      
      return true;
    } catch (error) {
      console.error('[ImageOptimizer] Failed to cache image:', error);
      return false;
    }
  },
};

export default imageOptimizer;
