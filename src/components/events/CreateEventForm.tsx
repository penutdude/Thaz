import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import styles from './CreateEventForm.module.css'; // Import CSS Modules

interface CreateEventFormProps {
  onEventCreated: () => void;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({ onEventCreated }) => {
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>(''); // Store as YYYY-MM-DD string from input type="date"
  const [time, setTime] = useState<string>(''); // Store as HH:MM string from input type="time"
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For a user-friendly address, a geocoding API (like Google Geocoding API) would be needed here.
          // This is a simplified version showing coordinates.
          const lat = position.coords.latitude.toFixed(5);
          const lon = position.coords.longitude.toFixed(5);
          setLocation(`Approx. Lat: ${lat}, Lon: ${lon}`);
          setError(null); // Clear any previous location error
        },
        (geoError) => {
          console.error("Geolocation error:", geoError);
          setError("Could not get location: " + geoError.message);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("You must be logged in to create an event.");
      return;
    }
    if (!title.trim() || !date || !time || !location.trim() || !description.trim()) {
      setError("Title, date, time, location, and description are required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      // Combine date and time strings and convert to Firestore Timestamp for the event's main date
      const dateTimeString = `${date}T${time}`; // e.g., "2024-12-25T14:00"
      const eventDateTimestamp = Timestamp.fromDate(new Date(dateTimeString));

      await addDoc(collection(db, 'familyEvents'), {
        title: title.trim(),
        date: eventDateTimestamp, // Store as Firestore Timestamp
        time: time, // Store original time string for easy display
        location: location.trim(),
        description: description.trim(),
        category: category.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        createdAt: serverTimestamp(), // Firestore server timestamp for creation
      });
      alert('Event created successfully!');
      onEventCreated();
      // Reset form
      setTitle(''); setDate(''); setTime(''); setLocation(''); setDescription(''); setCategory('');
    } catch (err: any) {
      console.error("Error creating event:", err);
      setError("Failed to create event: " + err.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.createEventForm}> {/* Container class applied by parent in EventsPage.module.css */}
      <h3>Add New Event</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="event-title" className={styles.formLabel}>Title:</label>
          <input type="text" id="event-title" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className={styles.formRow}>
          <div> {/* Flex item for date */}
            <label htmlFor="event-date" className={styles.formLabel}>Date:</label>
            <input type="date" id="event-date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div> {/* Flex item for time */}
            <label htmlFor="event-time" className={styles.formLabel}>Time:</label>
            <input type="time" id="event-time" value={time} onChange={e => setTime(e.target.value)} required />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="event-location" className={styles.formLabel}>Location:</label>
          <input type="text" id="event-location" value={location} onChange={e => setLocation(e.target.value)} required />
          <button type="button" onClick={handleGetLocation} className={styles.getLocationButton}>
            Get Current Location (Approx.)
          </button>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="event-description" className={styles.formLabel}>Description:</label>
          <textarea id="event-description" value={description} onChange={e => setDescription(e.target.value)} rows={4} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="event-category" className={styles.formLabel}>Category (Optional):</label>
          <input type="text" id="event-category" value={category} onChange={e => setCategory(e.target.value)} />
        </div>
        <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
          {isSubmitting ? 'Submitting...' : 'Add Event'}
        </button>
        {error && <p className={styles.errorMessage}>{error}</p>}
      </form>
    </div>
  );
};

export default CreateEventForm;
