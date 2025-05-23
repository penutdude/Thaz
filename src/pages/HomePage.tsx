import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Remove unused Link
import { motion } from 'framer-motion'; // Import motion
import styles from './HomePage.module.css'; // Import CSS Module
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Photo } from '../components/gallery/GalleryItem'; // Import Photo type
import type { FamilyEvent } from '../pages/EventsPage'; // Import FamilyEvent type
import type { Post } from '../pages/BlogsPage'; // Import Post type
import type { FamilyMember } from '../types'; // Import FamilyMember type
import FamilyCalendar from '../components/home/FamilyCalendar'; // Import FamilyCalendar component
import PhotoSlideshow from '../components/home/PhotoSlideshow'; // Import PhotoSlideshow component
import CreatePostForm from '../components/blogs/CreatePostForm'; // Import CreatePostForm component
import MemberPage from '../components/familyTree/MemberPage'; // Import MemberPage component
import { useTheme } from '../contexts/ThemeContext';

const HomePage: React.FC = () => {
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [welcomeOpacity, setWelcomeOpacity] = useState(1);
  const navigate = useNavigate(); // Initialize useNavigate
  const [latestPhotos, setLatestPhotos] = useState<Photo[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(''); // State for search term
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null); // State for selected member
  const [showAddPostForm, setShowAddPostForm] = useState(true); // State to control add post form visibility
  const { theme } = useTheme();
  const [galleryLoading, setGalleryLoading] = useState<boolean>(true);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Fade out between 0 and 200px scroll
      const fadeStart = 0;
      const fadeEnd = 200;
      let opacity = 1;
      if (scrollY > fadeStart) {
        opacity = Math.max(0, 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart));
      }
      setWelcomeOpacity(opacity);
      setShowWelcomeMessage(opacity > 0);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const [allEvents, setAllEvents] = useState<FamilyEvent[]>([]);
  const [allEventsLoading, setAllEventsLoading] = useState<boolean>(true);
  const [allEventsError, setAllEventsError] = useState<string | null>(null);

  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [blogsLoading, setBlogsLoading] = useState<boolean>(true);
  const [blogsError, setBlogsError] = useState<string | null>(null);

  const [allFamilyMembers, setAllFamilyMembers] = useState<FamilyMember[]>([]);
  const [allFamilyMembersLoading, setAllFamilyMembersLoading] = useState<boolean>(true);
  const [allFamilyMembersError, setAllFamilyMembersError] = useState<string | null>(null);

  const handlePostCreated = () => {
    setShowAddPostForm(false);
    fetchLatestPosts(); // Refresh the posts list
  };

  const fetchLatestPhotos = useCallback(async () => {
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const photosCollectionRef = collection(db, 'galleryPhotos');
      const q = query(photosCollectionRef, orderBy('createdAt', 'desc'), limit(5)); // Get latest 5 photos
      const querySnapshot = await getDocs(q);
      const fetchedPhotos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
      setLatestPhotos(fetchedPhotos);
    } catch (err: any) {
      console.error("Error fetching latest photos:", err);
      setGalleryError('Failed to load latest photos.');
    }
    setGalleryLoading(false);
  }, []);

  const fetchAllEvents = useCallback(async () => {
    setAllEventsLoading(true);
    setAllEventsError(null);
    try {
      const eventsCollectionRef = collection(db, 'familyEvents');
      // Get all events, ordered by date and time
      const q = query(
        eventsCollectionRef,
        orderBy('date', 'asc'),
        orderBy('time', 'asc'),
      );
      const querySnapshot = await getDocs(q);
      const fetchedEvents = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date?.seconds * 1000 || Date.now())),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date(data.createdAt?.seconds * 1000 || Date.now())),
        } as FamilyEvent;
      });
      setAllEvents(fetchedEvents);
    } catch (err: any) {
      console.error("Error fetching all events:", err);
      setAllEventsError('Failed to load events.');
    }
    setAllEventsLoading(false);
  }, []);

  const fetchLatestPosts = useCallback(async () => {
    setBlogsLoading(true);
    setBlogsError(null);
    try {
      const postsCollectionRef = collection(db, 'blogPosts');
      const q = query(postsCollectionRef, orderBy('createdAt', 'desc'), limit(5)); // Get latest 5 posts
      const querySnapshot = await getDocs(q);
      const fetchedPosts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date()),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : undefined,
        } as Post;
      });
      setLatestPosts(fetchedPosts);
    } catch (err: any) {
      console.error("Error fetching latest posts:", err);
      setBlogsError('Failed to load latest posts.');
    }
    setBlogsLoading(false);
  }, []);

  const fetchAllFamilyMembers = useCallback(async () => {
    setAllFamilyMembersLoading(true);
    setAllFamilyMembersError(null);
    try {
      console.log("Fetching all family members (like Family Tree page)...");
      const membersCollectionRef = collection(db, 'familyTreeMembers');
      const q = query(membersCollectionRef, orderBy('name')); // Fetch all members, ordered by name
      const querySnapshot = await getDocs(q);
      console.log("Query snapshot empty:", querySnapshot.empty);
      console.log("Query snapshot size:", querySnapshot.size);
      const fetchedMembers = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          birthDate: data.birthDate instanceof Timestamp ? data.birthDate : (data.birthDate?.seconds ? Timestamp.fromMillis(data.birthDate.seconds * 1000) : null),
          deathDate: data.deathDate instanceof Timestamp ? data.deathDate : (data.deathDate?.seconds ? Timestamp.fromMillis(data.deathDate.seconds * 1000) : null),
        } as FamilyMember;
      });
      console.log("Fetched members:", fetchedMembers);
      setAllFamilyMembers(fetchedMembers);
    } catch (err: any) {
      console.error("Error fetching all family members:", err);
      setAllFamilyMembersError('Failed to load family tree data.');
    }
    setAllFamilyMembersLoading(false);
  }, []);


  useEffect(() => {
    fetchLatestPhotos();
    fetchAllEvents();
    fetchLatestPosts();
    fetchAllFamilyMembers();
  }, [fetchLatestPhotos, fetchAllEvents, fetchLatestPosts, fetchAllFamilyMembers]);

  // Filter family members based on search term
  const filteredFamilyMembers = useMemo(() => {
    if (!searchTerm) {
      return allFamilyMembers;
    }
    return allFamilyMembers.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allFamilyMembers, searchTerm]);


  return (
    <div className={styles.homePage}>
      {showWelcomeMessage && (
        <div
          className={styles.welcomeMessage}
          style={{ opacity: welcomeOpacity, transition: 'opacity 1.5s cubic-bezier(0.4,0,0.2,1)' }}
        >
          <h1>തഴുതേടത്ത് കുടുംബത്തിലേക്ക് സ്വാഗതം.</h1>
        </div>
      )}
      <div className={styles.sectionsContainer}>
        <motion.div className={styles.blob} animate={{ x: [0, 100, 0], y: [0, 50, 0] }} transition={{ duration: 10, repeat: Infinity }}></motion.div>
        <motion.div className={`${styles.blob} ${styles.blob2}`} animate={{ x: [0, -100, 0], y: [0, -50, 0] }} transition={{ duration: 12, repeat: Infinity }}></motion.div>
        <motion.div className={`${styles.blob} ${styles.blob3}`} animate={{ x: [0, 50, 0], y: [0, -100, 0] }} transition={{ duration: 15, repeat: Infinity }}></motion.div>
        <motion.div className={`${styles.blob} ${styles.blob4}`} animate={{ x: [0, -50, 0], y: [0, 100, 0] }} transition={{ duration: 11, repeat: Infinity }}></motion.div>
        <motion.div className={`${styles.blob} ${styles.blob5}`} animate={{ x: [0, 150, 0], y: [0, -80, 0] }} transition={{ duration: 13, repeat: Infinity }}></motion.div>
        <motion.div className={`${styles.blob} ${styles.blob6}`} animate={{ x: [0, -120, 0], y: [0, 60, 0] }} transition={{ duration: 14, repeat: Infinity }}></motion.div>
        <div className={styles.sectionsGrid}>
        {/* Family Gallery Section */}
        <section className={styles.gallerySection}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>
              <span role="img" aria-label="Gallery">📸</span> Family Gallery
            </h2>
            <p className={styles.sectionSubtitle}>Cherished moments from our family album</p>
            {galleryLoading ? (
              <div className={styles.loader}><span>Loading photos...</span></div>
            ) : galleryError ? (
              <p style={{ color: 'red' }}>Error loading photos.</p>
            ) : latestPhotos.length > 0 ? (
              <>
                <div className={styles.gallerySlideshowWrapper}>
                  <PhotoSlideshow 
                    photos={latestPhotos} 
                    currentIndex={currentPhotoIndex}
                    onSlideChange={setCurrentPhotoIndex}
                  />
                </div>
                <div className={styles.photoDetailsSection}>
                  <h4 className={styles.photoDetailsTitle}>Photo Details</h4>
                  <div className={styles.photoDetailsContent}>
                    <p><strong>Description:</strong> {latestPhotos[currentPhotoIndex]?.description || 'No description'}</p>
                    <p><strong>Uploaded by:</strong> {latestPhotos[currentPhotoIndex]?.uploaderName || 'Unknown'}</p>
                    <p><strong>Cloudinary ID:</strong> {latestPhotos[currentPhotoIndex]?.cloudinaryPublicId || 'N/A'}</p>
                  </div>
                </div>
              </>
            ) : (
              <p>No photos yet.</p>
            )}
            <button
              onClick={() => navigate('/gallery')}
              className={styles.viewAllButton}
              style={{ background: 'linear-gradient(90deg, #1e90ff 60%, #00bfff 100%)', fontWeight: 600, letterSpacing: 1 }}
            >
              View All Photos
            </button>
          </div>
        </section>

        {/* Family Events Section */}
        <section className={styles.eventsSection}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>
              <span role="img" aria-label="Events">📅</span> Family Events
            </h2>
            <p className={styles.sectionSubtitle}>Upcoming gatherings and celebrations</p>
            {allEventsLoading ? (
              <div className={styles.loader}><span>Loading events...</span></div>
            ) : allEventsError ? (
              <p style={{ color: 'red' }}>Error loading events.</p>
            ) : allEvents.length > 0 ? (
              <ul className={styles.eventsPreview}>
                {allEvents.slice(0, 5).map((event: FamilyEvent) => (
                  <li key={event.id} className={styles.eventPreviewItem}>
                    <strong>{event.date.toDate().toLocaleDateString()}:</strong> {event.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No events yet.</p>
            )}
            <div className={styles.calendarWrapper}>
              <FamilyCalendar events={allEvents} familyMembers={allFamilyMembers} />
            </div>
            <button
              onClick={() => navigate('/events')}
              className={styles.viewAllButton}
              style={{ background: 'linear-gradient(90deg, #ffa500 60%, #ff6347 100%)', fontWeight: 600, letterSpacing: 1 }}
            >
              View All Events
            </button>
          </div>
        </section>

        {/* Family Blogs Section */}
        <section className={styles.blogsSection}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>
              <span role="img" aria-label="Blogs">✍️</span> Family Blogs
            </h2>
            <p className={styles.sectionSubtitle}>Stories, updates, and shared thoughts</p>
            {showAddPostForm && (
              <div className={styles.createPostFormContainer}>
                <CreatePostForm
                  onPostCreated={handlePostCreated}
                  onCancel={() => setShowAddPostForm(false)}
                />
              </div>
            )}
            {blogsLoading ? (
              <div className={styles.loader}><span>Loading posts...</span></div>
            ) : blogsError ? (
              <p style={{ color: 'red' }}>Error loading posts.</p>
            ) : latestPosts.length > 0 ? (
              <ul className={styles.blogsPreview}>
                {latestPosts.slice(0, 5).map((post: Post) => (
                  <li key={post.id} className={styles.blogPreviewItem}>
                    {post.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No blog posts yet.</p>
            )}
            {!showAddPostForm && (
              <>
                <p className={styles.addBlogPrompt}>Have a family story or update to share?</p>
                <button
                  onClick={() => setShowAddPostForm(true)}
                  className={styles.addBlogButton}
                >
                  Add New Blog Post
                </button>
              </>
            )}
            <button
              onClick={() => navigate('/blogs')}
              className={styles.viewAllButton}
              style={{ background: 'linear-gradient(90deg, #8a2be2 60%, #9370db 100%)', fontWeight: 600, letterSpacing: 1 }}
            >
              View All Blogs
            </button>
          </div>
        </section>

        {/* Family Tree Section */}
        <section className={styles.familyTreeSection}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>
              <span role="img" aria-label="Family Tree">🌳</span> Family Tree
            </h2>
            <p className={styles.sectionSubtitle}>Explore our roots and connections</p>
            {allFamilyMembersLoading ? (
              <div className={styles.loader}><span>Loading family tree data...</span></div>
            ) : allFamilyMembersError ? (
              <p style={{ color: 'red' }}>Error loading family tree data.</p>
            ) : filteredFamilyMembers.length > 0 ? (
              <>
                <input
                  type="text"
                  placeholder="Search family members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.familyMemberSearchInput}
                />
                <ul className={`${styles.familyMemberList} ${styles.scrollableList}`}>
                  {filteredFamilyMembers.slice(0, 10).map((member) => (
                    <li
                      key={member.id}
                      className={styles.familyMemberItem}
                      onClick={() => setSelectedMember(member)}
                      tabIndex={0}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedMember(member);
                      }}
                    >
                      <img
                        src={member.photoUrl || '/default-avatar.png'}
                        alt={member.name}
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 8, border: '2px solid #e0ffe0' }}
                      />
                      <span style={{ fontWeight: 600 }}>{member.name}</span>
                      {member.birthDate && (
                        <span style={{ color: '#888', fontSize: '0.95em', marginLeft: 4 }}>({member.birthDate.toDate().toLocaleDateString()})</span>
                      )}
                      {member.location && (
                        <span style={{ color: '#008000', fontSize: '0.95em', marginLeft: 4 }}>- {member.location}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>No recent members found.</p>
            )}
            <button
              onClick={() => navigate('/family-tree')}
              className={styles.viewAllButton}
              style={{ background: 'linear-gradient(90deg, #006400 60%, #008000 100%)', fontWeight: 600, letterSpacing: 1 }}
            >
              View Full Tree
            </button>
          </div>
        </section>
      </div>
      </div>
      {selectedMember && (
        <div className={`${styles.modal} ${theme === 'dark' ? 'dark' : ''}`}>
        <div
          className={styles.modalContent}
          style={{ backgroundColor: theme === 'dark' ? 'black' : 'white' }}
        >
            <MemberPage member={selectedMember} onClose={() => setSelectedMember(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
