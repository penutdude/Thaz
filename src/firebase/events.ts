import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import type { FamilyEvent } from '../pages/EventsPage';

export const getFamilyEventById = async (eventId: string): Promise<FamilyEvent | null> => {
  try {
    const eventDocRef = doc(db, 'familyEvents', eventId);
    const eventSnap = await getDoc(eventDocRef);
    if (!eventSnap.exists()) return null;
    const data = eventSnap.data();
    return {
      id: eventSnap.id,
      ...data,
    } as FamilyEvent;
  } catch (err) {
    console.error('Error fetching event by ID:', err);
    return null;
  }
};
