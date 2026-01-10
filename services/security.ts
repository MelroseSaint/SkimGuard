
// Web Crypto API Wrapper for AES-GCM
// Provides encryption at rest for the local database

export const SecurityService = {
  
  async getKey(): Promise<CryptoKey> {
    const rawKey = localStorage.getItem('sg_sek');
    if (rawKey) {
       return window.crypto.subtle.importKey(
          'jwk',
          JSON.parse(rawKey),
          { name: 'AES-GCM' },
          true,
          ['encrypt', 'decrypt']
       );
    }
    
    // Generate a new 256-bit key if none exists
    const key = await window.crypto.subtle.generateKey(
       { name: 'AES-GCM', length: 256 },
       true,
       ['encrypt', 'decrypt']
    );
    
    const exported = await window.crypto.subtle.exportKey('jwk', key);
    localStorage.setItem('sg_sek', JSON.stringify(exported));
    return key;
  },

  async encrypt(data: string): Promise<{iv: number[], content: string}> {
     const key = await this.getKey();
     const iv = window.crypto.getRandomValues(new Uint8Array(12));
     const encoded = new TextEncoder().encode(data);
     
     const cipher = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
     );
     
     // Convert to base64 for storage
     return {
        iv: Array.from(iv),
        content: btoa(String.fromCharCode(...new Uint8Array(cipher)))
     };
  },

  async decrypt(iv: number[], content: string): Promise<string> {
      try {
        const key = await this.getKey();
        const data = Uint8Array.from(atob(content), c => c.charCodeAt(0));
        
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv) },
            key,
            data
        );
        
        return new TextDecoder().decode(decrypted);
      } catch (e) {
          console.error("Decryption failed", e);
          throw new Error("Decryption Failed: Data integrity compromised or key mismatch.");
      }
  },

  async computeIntegrityHash(recordId: string, timestamp: number, status: string): Promise<string> {
      const input = `${recordId}:${timestamp}:${status}`;
      const encoded = new TextEncoder().encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
};
    