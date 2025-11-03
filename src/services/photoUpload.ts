import { storage, auth } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Upload a photo to Firebase Storage and return the download URL
 * @param inspectionId - The inspection ID (used for organizing photos)
 * @param photoBlob - The compressed image blob to upload
 * @returns Download URL for the uploaded photo
 */
export async function uploadPhoto(inspectionId: string, photoBlob: Blob): Promise<string> {
  // Ensure user is authenticated
  if (!auth.currentUser) {
    throw new Error("Authentication required to upload photos");
  }

  // Generate unique photo ID
  const photoId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const fileName = `${photoId}.jpg`;

  // Upload to Storage: /inspections/{inspectionId}/photos/{fileName}
  const storageRef = ref(storage, `inspections/${inspectionId}/photos/${fileName}`);

  await uploadBytes(storageRef, photoBlob, {
    contentType: 'image/jpeg',
    cacheControl: 'public,max-age=31536000', // Cache for 1 year
  });

  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
}
