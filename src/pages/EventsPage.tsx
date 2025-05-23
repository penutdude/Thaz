import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import CreateEventForm from '../components/events/CreateEventForm';
import EventItem from '../components/events/EventItem';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import styles from './EventsPage.module.css'; // For CSS Modules

export interface FamilyEvent {
  id: string;
  title: string;
  date: Timestamp;
  time: string;
  location: string;
  description: string;
  category?: string;
  authorId: string;
  authorName?: string;
  createdAt: Timestamp;
}

const NAV_TABS = [
  { label: 'Blogs', icon: '📝', route: '/blogs' },
  { label: 'Gallery', icon: '📷', route: '/gallery' },
  { label: 'Events', icon: '📅', route: '/events' },
  { label: 'Family Tree', icon: '🌳', route: '/family-tree' },
  { label: 'History', icon: '📖', route: '/about' },
];

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const { currentUser, logout } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('Events');

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const eventsCollectionRef = collection(db, 'familyEvents');
      const q = query(eventsCollectionRef, orderBy('date', 'desc'), orderBy('time', 'desc')); // Sort by event date, then time
      const querySnapshot = await getDocs(q);
      const fetchedEvents = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return { 
          id: docSnap.id, 
          ...data,
          // Ensure date and createdAt are Timestamps
          date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date?.seconds * 1000 || Date.now())), // Handle potential non-Timestamp from Firestore
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date(data.createdAt?.seconds * 1000 || Date.now())),
        } as FamilyEvent;
      });
      setEvents(fetchedEvents);
    } catch (err: any) {
      console.error("Error fetching events:", err);
      setError('Failed to load events.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, 'familyEvents', eventId));
      setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId)); // Optimistic update
      alert('Event deleted successfully.');
    } catch (err: any) {
      console.error("Error deleting event:", err);
      setError('Failed to delete event: ' + err.message);
    }
  };
  const navigate = useNavigate();
  
  const handleTabClick = (tab: { label: string; route: string }) => {
    setActiveTab(tab.label);
    if (window.location.pathname !== tab.route) {
      navigate(tab.route);
    }
  };

  return (
    <div className={styles.bookLayout}>
      <aside className={styles.bookSpine}>
        <div className={styles.spineLogo} title="Family Crest">F</div>
        <nav className={styles.bookmarksNav}>
          {NAV_TABS.map(tab => (
            <button
              key={tab.label}
              className={
                activeTab === tab.label
                  ? `${styles.bookmarkTab} ${styles.active}`
                  : styles.bookmarkTab
              }
              onClick={() => handleTabClick(tab)}
              aria-label={tab.label}
              type="button"
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
          {currentUser ? (
            <button
              className={styles.logoutButton}
              onClick={async () => {
                if (window.confirm('Are you sure you want to log out?')) {
                  await logout();
                  navigate('/login');
                }
              }}
              type="button"
            >
              Log Out
            </button>
          ) : (
            <button
              className={styles.logoutButton}
              onClick={() => navigate('/login')}
              type="button"
            >
              Log In
            </button>
          )}
        </nav>
      </aside>
      <main className={styles.bookPage}>
        <header className={styles.bookHeader}>Family Events</header>
        <div className={styles.marginNote}>"Celebrate together!"</div>
        <div className={styles.bookContent}>
          <div className={`${styles.eventsPage} ${theme === 'dark' ? 'dark' : ''}`}>
            <div className={styles.eventsHeader}>
              <h2 className={styles.eventsHeading}>Family Events</h2>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, margin: '0 2rem' }}>
                <input
                  type="text"
                  className={styles.eventSearchInput}
                  placeholder="Search events..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {currentUser && (
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className={styles.addEventButton}
                >
                  {showCreateForm ? 'Cancel' : 'Add New Event'}
                </button>
              )}
            </div>
            
            {showCreateForm && currentUser && (
              <div className={styles.createEventFormContainer}>
                <CreateEventForm 
                  onEventCreated={() => {
                    setShowCreateForm(false);
                    fetchEvents();
                  }} 
                />
              </div>
            )}

            {isLoading && <p className={styles.loadingText}>Loading events...</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}
            
            {!isLoading && !error && events.length === 0 && !showCreateForm && (
              <p className={styles.noEventsText}>No events scheduled yet. {currentUser ? 'Be the first to add one!' : ''}</p>
            )}
            
            {!isLoading && !error && events.length > 0 && (
              <div className={styles.eventsList}>
                {events.filter(event =>
                  event.title.toLowerCase().includes(search.toLowerCase()) ||
                  event.location.toLowerCase().includes(search.toLowerCase()) ||
                  event.description.toLowerCase().includes(search.toLowerCase())
                ).map(event => (
                  <EventItem key={event.id} event={event} onDelete={handleDeleteEvent} />
                ))}
              </div>
            )}
          </div>
        </div>
        <footer className={styles.bookFooter}>Page 3 &mdash; Thazhuthedath Family</footer>
      </main>
    </div>
  );
};

export default EventsPage;
