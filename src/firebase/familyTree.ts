import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp // Ensure Timestamp is imported if used for type hints
} from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Import the initialized Firestore instance
import type { FamilyMember } from '../types'; // Import the FamilyMember interface

const familyTreeCollection = collection(db, 'familyTreeMembers');

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dnj4irkpn';
const CLOUDINARY_UPLOAD_PRESET = 'gallery'; // Using 'gallery' preset as confirmed
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Interface for data when adding a new family member with a potential photo file
export interface NewFamilyMemberData extends Omit<FamilyMember, 'id' | 'photoUrl' | 'cloudinaryPublicId' | 'createdAt' | 'timestamp'> {
  photoFile?: File | null;
  // Other fields like name, birthDate (as Date or string to be converted), generation, etc.
  // Ensure birthDate and deathDate are handled correctly (e.g., converted to Timestamps if passed as Date)
}

// Interface for data when updating a family member
export interface UpdateFamilyMemberData extends Partial<Omit<FamilyMember, 'id' | 'photoUrl' | 'cloudinaryPublicId'>> {
  photoFile?: File | null;
  removePhoto?: boolean; // Flag to indicate if existing photo should be removed
}


// Function to fetch all family members
export const fetchFamilyMembers = async (): Promise<FamilyMember[]> => {
  try {
    const q = query(familyTreeCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    const members: FamilyMember[] = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        // Ensure date fields are Timestamps
        birthDate: data.birthDate instanceof Timestamp ? data.birthDate : (data.birthDate?.seconds ? Timestamp.fromMillis(data.birthDate.seconds * 1000) : null),
        deathDate: data.deathDate instanceof Timestamp ? data.deathDate : (data.deathDate?.seconds ? Timestamp.fromMillis(data.deathDate.seconds * 1000) : null),
      } as FamilyMember;
    });
    return members;
  } catch (error) {
    console.error("Error fetching family members:", error);
    throw error;
  }
};

// Function to add a new family member with Cloudinary photo upload
export const addFamilyMember = async (memberInput: NewFamilyMemberData): Promise<string> => {
  let photoUrl: string | null = null;
  let cloudinaryPublicId: string | null = null;

  if (memberInput.photoFile) {
    const formData = new FormData();
    formData.append('file', memberInput.photoFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Cloudinary upload failed');
      }
      const cloudinaryData = await response.json();
      photoUrl = cloudinaryData.secure_url;
      cloudinaryPublicId = cloudinaryData.public_id;
    } catch (uploadError: any) {
      console.error('Cloudinary upload error:', uploadError);
      throw new Error('Image upload failed: ' + uploadError.message);
    }
  }
  
  // Prepare data for Firestore, removing photoFile if it exists
  const { photoFile, ...otherData } = memberInput;
  
  const memberDataToSave: Omit<FamilyMember, 'id'> = {
    ...otherData,
    name: otherData.name || '', // Ensure name is not undefined
    birthDate: otherData.birthDate ? Timestamp.fromDate(new Date(otherData.birthDate as any)) : null, // Convert if string/Date
    deathDate: otherData.deathDate ? Timestamp.fromDate(new Date(otherData.deathDate as any)) : null, // Convert if string/Date
    photoUrl,
    cloudinaryPublicId,
    position: otherData.position || null,
    generation: otherData.generation !== undefined ? otherData.generation : null,
    parents: otherData.parents || [],
    children: otherData.children || [],
    spouses: otherData.spouses || [],
    // Add any other default fields if necessary
  };

  try {
    const docRef = await addDoc(familyTreeCollection, memberDataToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error adding family member:", error);
    throw error;
  }
};

// Function to update a family member with Cloudinary photo upload/removal
export const updateFamilyMember = async (id: string, updateInput: UpdateFamilyMemberData): Promise<void> => {
  const dataToUpdate: Partial<Omit<FamilyMember, 'id'>> = { ...updateInput };

  // Handle photo file upload
  if (updateInput.photoFile) {
    const formData = new FormData();
    formData.append('file', updateInput.photoFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    try {
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Cloudinary upload failed');
      }
      const cloudinaryData = await response.json();
      dataToUpdate.photoUrl = cloudinaryData.secure_url;
      dataToUpdate.cloudinaryPublicId = cloudinaryData.public_id;
      // Note: Deleting the old Cloudinary image (if one existed) would typically be done here via a backend call.
    } catch (uploadError: any) {
      console.error('Cloudinary upload error:', uploadError);
      throw new Error('Image upload failed: ' + uploadError.message);
    }
  } else if (updateInput.removePhoto) {
    dataToUpdate.photoUrl = null;
    dataToUpdate.cloudinaryPublicId = null;
    // Note: Deleting the old Cloudinary image (if one existed) would typically be done here via a backend call.
  }

  // Remove helper fields not part of FamilyMember schema before updating Firestore
  delete (dataToUpdate as any).photoFile;
  delete (dataToUpdate as any).removePhoto;

  // Ensure date fields are Timestamps if they are being updated
  if (dataToUpdate.birthDate && !(dataToUpdate.birthDate instanceof Timestamp)) {
    dataToUpdate.birthDate = Timestamp.fromDate(new Date(dataToUpdate.birthDate as any));
  }
  if (dataToUpdate.deathDate && !(dataToUpdate.deathDate instanceof Timestamp)) {
    dataToUpdate.deathDate = Timestamp.fromDate(new Date(dataToUpdate.deathDate as any));
  }
  if (dataToUpdate.generation === undefined && updateInput.hasOwnProperty('generation')) { // if explicitly set to undefined by form
    dataToUpdate.generation = null;
  }


  try {
    const memberDocRef = doc(db, 'familyTreeMembers', id);
    await updateDoc(memberDocRef, dataToUpdate);
  } catch (error) {
    console.error(`Error updating family member ${id}:`, error);
    throw error;
  }
};

// Function to delete a family member
export const deleteFamilyMember = async (id: string): Promise<void> => {
  try {
    // Note: Before deleting from Firestore, if there's a cloudinaryPublicId,
    // a backend call should be made to delete the image from Cloudinary.
    const memberDocRef = doc(db, 'familyTreeMembers', id);
    await deleteDoc(memberDocRef);
  } catch (error) {
    console.error(`Error deleting family member ${id}:`, error);
    throw error;
  }
};
