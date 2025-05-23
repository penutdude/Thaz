import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'; // Remove unused Timestamp
import styles from './HeroSlideshow.module.css'; // Import CSS Module

interface Slide {
  id: string;
  imageUrl: string;
}

const HeroSlideshow: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // const [error, setError] = useState<string | null>(null); // For error display if needed

  const fetchSlideshowImages = useCallback(async () => {
    setIsLoading(true);
    // setError(null);
    try {
      const photosCollectionRef = collection(db, 'galleryPhotos');
      // Assuming 'createdAt' field exists and is a Timestamp for ordering
      // The old script used 'uploadedAt'. We'll use 'createdAt' as per our GalleryPage implementation.
      const q = query(photosCollectionRef, orderBy('createdAt', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      
      const fetchedSlides = querySnapshot.docs.map(doc => ({
        id: doc.id,
        imageUrl: doc.data().imageUrl as string,
      }));
      
      setSlides(fetchedSlides);
    } catch (err) {
      console.error("Error fetching slideshow images:", err);
      // setError("Failed to load slideshow images.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSlideshowImages();
  }, [fetchSlideshowImages]);

  useEffect(() => {
    if (slides.length > 1) {
      const timer = setInterval(() => {
        if (!document.hidden) { // Only advance if page is visible
          setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }
      }, 5000); // Change slide every 5 seconds
      return () => clearInterval(timer); // Cleanup interval on unmount
    }
  }, [slides]);

  if (isLoading) {
    return <div className={styles.slideshowContainer} style={{backgroundColor: 'var(--hero-bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading slideshow...</div>;
  }

  if (slides.length === 0) {
    // Fallback if no images, could be a static background or message
    return <div className={styles.slideshowContainer} style={{backgroundColor: 'var(--hero-bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>No images for slideshow.</div>;
  }

  return (
    <div className={styles.slideshowContainer}>
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`${styles.slide} ${index === currentSlideIndex ? styles.slideActive : ''}`}
          style={{ backgroundImage: `url(${slide.imageUrl})` }} // Apply background image via inline style
        />
      ))}
    </div>
  );
};

export default HeroSlideshow;
