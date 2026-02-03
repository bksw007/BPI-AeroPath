import { 
  collection, 
  doc, 
  writeBatch, 
  getDocs,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PackagingProduct } from '@/app/projects/packaging/specs/[category]/page'; // Need to export this type or move it

// We'll define the type here locally if not exported, or better, move types to a shared location later.
// For now, I'll redefine a compatible interface to avoid circular dependency issues if the page one isn't exported well.
export interface PackagingProductDTO {
  id?: string;
  sku: string;
  name: string;
  category: string;
  width: number;
  length: number;
  height: number;
  nw: number;
  gw: number;
  cbm: number;
  productType: string;
  unit?: string; // e.g. PCS, SET
  stackingLimit: number;
  sideBoxWeight: string;
  lastUpdated: string;
  packingRules: any;
}

export const PackagingService = {
  // Bulk Import with Batch Writes (Upsert by SKU)
  importItems: async (items: PackagingProductDTO[]) => {
    const batchSize = 500; // Firestore limit
    const chunks = [];
    
    // Chunk items
    for (let i = 0; i < items.length; i += batchSize) {
      chunks.push(items.slice(i, i + batchSize));
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process chunks
    for (const chunk of chunks) {
      try {
        const batch = writeBatch(db);
        
        chunk.forEach(item => {
          // Use SKU as the Document ID for easy upsert
          const docRef = doc(db, 'packaging_specs', item.sku); // Collection: packaging_specs
          
          const payload = {
            ...item,
            updatedAt: serverTimestamp(),
            // If it's new, createdAt will be set if we used set with merge: true? 
            // merge: true preserves existing fields.
            // We might want to set createdAt only if it doesn't exist, but set() with merge doesn't support "setOnInsert" easily.
            // For now, just setting the data is fine.
          };
          
          batch.set(docRef, payload, { merge: true });
        });

        await batch.commit();
        successCount += chunk.length;
      } catch (err: any) {
        console.error("Batch commit failed:", err);
        errorCount += chunk.length;
        errors.push(err.message);
      }
    }

    return { successCount, errorCount, errors };
  },

  // Get items by category
  getByCategory: async (category: string) => {
    try {
      const q = query(collection(db, 'packaging_specs'), where('category', '==', category));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PackagingProductDTO));
    } catch (error) {
      console.error("Error fetching specs:", error);
      return [];
    }
  }
};
