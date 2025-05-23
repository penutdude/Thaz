import React, { useEffect } from 'react';
import type { Photo } from '../../components/gallery/GalleryItem'; // Adjust path if GalleryItem is elsewhere or Photo type is defined differently
import styles from './PhotoSlideshow.module.css';

interface PhotoSlideshowProps {
  photos: Photo[];
  currentIndex: number;
  onSlideChange: (index: number) => void;
}

const PhotoSlideshow: React.FC<PhotoSlideshowProps> = ({ photos, currentIndex, onSlideChange }) => {
  useEffect(() => {
    if (photos.length > 1) {
      const timer = setTimeout(() => {
        onSlideChange((currentIndex + 1) % photos.length);
      }, 5000); // Change slide every 5 seconds
      return () => clearTimeout(timer);
    }
  }, [currentIndex, photos, photos.length, onSlideChange]);

  const goToPrevious = () => {
    onSlideChange((currentIndex - 1 + photos.length) % photos.length);
  };

  const goToNext = () => {
    onSlideChange((currentIndex + 1) % photos.length);
  };

  if (!photos || photos.length === 0) {
    return <p className={styles.noPhotosText}>No photos to display in slideshow.</p>;
  }

  return (
    <div className={styles.slideshowContainer}>
      <img
        src={photos[currentIndex].imageUrl}
        alt={photos[currentIndex].description || `Slide ${currentIndex + 1}`}
        className={styles.slideImage}
      />
      {photos.length > 1 && (
        <>
          <button onClick={goToPrevious} className={`${styles.navButton} ${styles.prevButton}`}>&#8249;</button>
          <button onClick={goToNext} className={`${styles.navButton} ${styles.nextButton}`}>&#8250;</button>
        </>
      )}
      {photos.length > 1 && (
        <div className={styles.dotsContainer}>
          {photos.map((_, index) => (
            <span
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
              onClick={() => onSlideChange(index)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && onSlideChange(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoSlideshow;
