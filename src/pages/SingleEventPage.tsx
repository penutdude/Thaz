import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEventComments, deleteEventComment } from '../firebase/eventComments'; // Import deleteEventComment
import { getFamilyEventById } from '../firebase/events'; // Import getFamilyEventById
import type { EventComment } from '../types';
import type { FamilyEvent } from './EventsPage'; // Import FamilyEvent type
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import styles from './SingleEventPage.module.css'; // Import CSS Module

import AddEventCommentForm from '../components/events/AddEventCommentForm';

const SingleEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { currentUser } = useAuth(); // Get current user
  const [eventDetails, setEventDetails] = useState<FamilyEvent | null>(null); // State for event details
  const [comments, setComments] = useState<EventComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setError('Event ID is missing.');
      setLoading(false);
      return;
    }

    // Fetch event details from Firestore
    getFamilyEventById(eventId).then((event) => {
      setEventDetails(event);
    });

    const unsubscribe = getEventComments(eventId, (updatedComments) => {
      setComments(updatedComments);
      setLoading(false);
    });

    return () => {
      unsubscribe(); // Cleanup listener on component unmount
    };
  }, [eventId]);

  if (loading) {
    return <p>Loading event and comments...</p>;
  }

  if (error) {
    return <p className={styles.errorText}>Error: {error}</p>; // Consider adding an errorText class
  }

  return (
    <div className={styles.singleEventPageContainer}>
      <div className={styles.eventDetailsSection}>
        {eventDetails ? (
          <>
            <h2>{eventDetails.title}</h2>
            <p><strong>Date:</strong> {eventDetails.date?.toDate().toLocaleDateString()} at {eventDetails.time}</p>
            {/* If location is a string and looks like lat/lng, show as Google Maps lat/lng link; else, show as address search */}
            {(() => {
              const loc = eventDetails.location;
              // Remove 'Approx.' and any non-numeric prefix before lat/lng
              let cleanedLoc = typeof loc === 'string' ? loc.replace(/Approx\.?/i, '').replace(/[^\d.,\s-]+/g, '').trim() : '';
              // Try to match two numbers (lat, lng) in the string
              const latLngMatch =
                typeof cleanedLoc === 'string' &&
                cleanedLoc.match(/([\d.-]+)[,\s]+([\d.-]+)/);
              if (latLngMatch) {
                const lat = latLngMatch[1];
                const lng = latLngMatch[2];
                return (
                  <p><strong>Location:</strong> <a href={`https://maps.google.com/?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer">View on Google Maps ({lat}, {lng})</a></p>
                );
              }
              if (typeof loc === 'string' && loc.trim()) {
                return (
                  <p><strong>Location:</strong> <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`} target="_blank" rel="noopener noreferrer">{loc}</a></p>
                );
              }
              return <p><strong>Location:</strong> {loc || 'N/A'}</p>;
            })()}
            {eventDetails.category && <p><strong>Category:</strong> {eventDetails.category}</p>}
            <p>{eventDetails.description}</p>
            <p style={{ fontStyle: 'italic', fontSize: '0.95em', color: 'var(--text-secondary-color)' }}>
              Posted by: {eventDetails.authorName || 'Unknown'}{eventDetails.createdAt?.toDate && ` on ${eventDetails.createdAt.toDate().toLocaleDateString()}`}
            </p>
          </>
        ) : (
          <p>Event details not found.</p>
        )}
      </div>
      
      <h4 className={styles.commentsSectionTitle}>Comments</h4>
      {comments.length === 0 ? (
        <p className={styles.noComments}>No comments yet. Be the first to comment!</p>
      ) : (
        <ul className={styles.commentList}>
          {comments.map((comment) => (
            <li key={comment.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <div className={styles.commentAuthorInfo}>
                  {comment.userPhotoURL && (
                    <img 
                      src={comment.userPhotoURL} 
                      alt={comment.userName} 
                      className={styles.userAvatar}
                    />
                  )}
                  <div>
                    <strong className={styles.userName}>{comment.userName}</strong>
                    <span className={styles.commentTimestamp}>
                      {comment.timestamp?.toDate().toLocaleString()}
                    </span>
                  </div>
                </div>
                {currentUser && currentUser.uid === comment.userId && (
                  <button 
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this comment?')) {
                        try {
                          if (eventId) {
                            await deleteEventComment(eventId, comment.id);
                          }
                        } catch (deleteError: any) {
                          console.error('Failed to delete comment:', deleteError);
                          alert('Failed to delete comment: ' + deleteError.message);
                        }
                      }
                    }}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                )}
              </div>
              {comment.text && <p className={styles.commentText}>{comment.text}</p>}
              {comment.imageUrl && (
                <img 
                  src={comment.imageUrl} 
                  alt="Comment attachment" 
                  className={styles.commentImage}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {/* Integrate AddEventCommentForm - styling for this form will be handled separately */}
      {eventId && <AddEventCommentForm eventId={eventId} />}
    </div>
  );
};

export default SingleEventPage;
