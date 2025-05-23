import React from 'react';
import { Link } from 'react-router-dom'; // Import Link
import type { FamilyEvent } from '../../pages/EventsPage'; // Import FamilyEvent interface as type
import { useAuth } from '../../contexts/AuthContext';
import styles from './EventItem.module.css'; // For CSS Modules

interface EventItemProps {
  event: FamilyEvent;
  onDelete: (eventId: string) => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, onDelete }) => {
  const { currentUser } = useAuth();

  const formattedDate = event.date?.toDate ? event.date.toDate().toLocaleDateString() : 'N/A';
  const formattedTime = event.time || 'N/A'; // Assuming time is stored as a string like "HH:MM"

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
    }
  };

  return (
    <article className={styles.eventItem}>
      <Link to={`/events/${event.id}`} className={styles.eventLink}>
        <h3 className={styles.eventTitle}>{event.title}</h3>
        <p className={styles.eventDetails}>
          <strong>Date:</strong> {formattedDate} at {formattedTime}
        </p>
        <p style={{ margin: '0.25rem 0', fontSize: '0.95em', color: 'var(--paragraph-color)' }}>
          <strong>Location:</strong> {event.location}
        </p>
        {event.category && (
          <p style={{ margin: '0.25rem 0', fontSize: '0.9em', fontStyle: 'italic', color: 'var(--text-color)' }}>
            Category: {event.category}
          </p>
        )}
        <p className={styles.eventDescription}>
          {event.description}
        </p>
        <small className={styles.eventMeta}>
          Posted by: {event.authorName || 'Unknown'}
          {event.createdAt?.toDate && ` on ${event.createdAt.toDate().toLocaleDateString()}`}
        </small>
      </Link>
      {currentUser && currentUser.uid === event.authorId && (
        <button
          onClick={handleDelete}
          className={styles.deleteButton}
        >
          Delete Event
        </button>
      )}
    </article>
  );
};

export default EventItem;
