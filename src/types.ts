import { Timestamp } from 'firebase/firestore';

// Interface for a family member, used for data storage and React Flow nodes
export interface FamilyMember {
  id: string; // Unique ID for the member (will also be the React Flow node ID)
  name: string;
  birthDate?: Timestamp | null; // Optional birth date, using Firebase Timestamp, allow null
  deathDate?: Timestamp | null; // Optional death date, using Firebase Timestamp, allow null
  photoUrl?: string | null; // Optional URL for a profile picture, allow null
  cloudinaryPublicId?: string | null; // Public ID from Cloudinary for the photo
  position?: { x: number; y: number } | null; // Optional position for React Flow node, allow null
  generation?: number | null; // Generation number, allow null
  instagramUsername?: string;
  facebookUsername?: string;
  twitterUsername?: string;

  // Relationships - using arrays of member IDs
  parents?: string[] | null; // IDs of parents, allow null
  children?: string[] | null; // IDs of children, allow null
  spouses?: string[] | null; // IDs of spouses, allow null
  gender?: string | null; // Optional gender field, allow null
  location?: string | null; // Optional location field, allow null
  phoneNumber?: string | null; // Optional phone number field, allow null
  // Add other relationship types if needed (e.g., siblings - though siblings can be inferred from parents)
}

// Interface for React Flow edges representing relationships
export interface FamilyRelationshipEdge {
    id: string; // Unique ID for the edge
    source: string; // ID of the source node (family member)
    target: string; // ID of the target node (family member)
    type: 'parent-child' | 'spouse'; // Type of relationship
    // Add other edge properties if needed (e.g., label)
}

// Interface for Event Comments
export interface EventComment {
  id: string; // Unique ID for the comment
  eventId: string; // ID of the event this comment belongs to
  userId: string; // ID of the user who posted the comment
  userName: string; // Display name of the user who posted
  userPhotoURL?: string | null; // Optional photo URL of the user
  timestamp: Timestamp; // Firebase Timestamp of when the comment was posted
  text?: string | null; // Text content of the comment (optional if image is present)
  imageUrl?: string | null; // URL of an image attached to the comment (optional if text is present)
  cloudinaryPublicId?: string | null; // Public ID from Cloudinary for the image
}
