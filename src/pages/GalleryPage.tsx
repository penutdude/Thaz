import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ImageUploadForm from '../components/gallery/ImageUploadForm';
import GalleryItem from '../components/gallery/GalleryItem';
import type { Photo } from '../components/gallery/GalleryItem'; // Correctly import Photo as type
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore'; // Removed unused Timestamp
import styles from './GalleryPage.module.css'; // For CSS Modules - create this file later

const NAV_TABS = [
  { label: 'Blogs', icon: '📝', route: '/blogs' },
  { label: 'Gallery', icon: '📷', route: '/gallery' },
  { label: 'Events', icon: '📅', route: '/events' },
  { label: 'Family Tree', icon: '🌳', route: '/family-tree' },
  { label: 'History', icon: '📖', route: '/about' },
];

const GalleryPage: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser, logout } = useAuth();
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false); // State to control form visibility
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState('Gallery');

  const toggleUploadForm = () => {
    setShowUploadForm(prevState => !prevState);
  };

  const fetchPhotos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const photosCollectionRef = collection(db, 'galleryPhotos');
      const q = query(photosCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedPhotos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
      setPhotos(fetchedPhotos);
    } catch (err: any) {
      console.error("Error fetching photos:", err);
      setError('Failed to load photos.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleDeletePhoto = async (photoId: string, cloudinaryPublicId?: string) => {
    console.log(`Attempting to delete photo ${photoId}. Cloudinary Public ID: ${cloudinaryPublicId}`);
    try {
      await deleteDoc(doc(db, 'galleryPhotos', photoId));
      setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId)); // Optimistically update UI
      alert('Photo record deleted from database.');
    } catch (err: any) {
      console.error("Error deleting photo record:", err);
      setError('Failed to delete photo record: ' + err.message);
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
        <header className={styles.bookHeader}>Family Photo Album</header>
        <div className={styles.marginNote}>"Memories in frames..."</div>
        <div className={styles.bookContent}>
          <input
            type="text"
            className={styles.gallerySearchInput}
            placeholder="Search photos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {currentUser && (
            <div className={styles.uploadFormContainer}>
              <button onClick={toggleUploadForm} className={`${styles.uploadButton} btn`}>
                {showUploadForm ? 'Hide Upload Form' : 'Add New Photo'}
              </button>
              {showUploadForm && <ImageUploadForm onUploadSuccess={fetchPhotos} />}
            </div>
          )}

          {isLoading && <p>Loading photos...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          {!isLoading && !error && photos.length === 0 && (
            <p>No photos in the gallery yet. {currentUser ? 'Be the first to upload one!' : 'Login to upload photos.'}</p>
          )}

          {!isLoading && !error && photos.length > 0 && (
            <div className={styles.photoGrid}>
              {photos.filter(photo => {
                if (!search.trim()) return true; // Show all if search is empty
                const searchLower = search.toLowerCase();
                return (
                  (photo.description && photo.description.toLowerCase().includes(searchLower)) ||
                  !photo.description
                );
              }).map(photo => (
                <GalleryItem key={photo.id} photo={photo} onDelete={handleDeletePhoto} />
              ))}
            </div>
          )}
        </div>
        <footer className={styles.bookFooter}>Page 2 &mdash; Thazhuthedath Family</footer>
      </main>
    </div>
  );
};

export default GalleryPage;
