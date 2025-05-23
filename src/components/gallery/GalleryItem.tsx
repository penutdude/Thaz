import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // To check current user
import styles from './GalleryItem.module.css'; // Import CSS Module

export interface Photo { // Exporting Photo interface to be used in GalleryPage
  id: string;
  imageUrl: string;
  description?: string;
  uploaderName?: string;
  uploaderId?: string; // Needed to check ownership for delete
  cloudinaryPublicId?: string; // Needed if we implement actual Cloudinary deletion later
  // Add other fields like createdAt if needed for display
}

interface GalleryItemProps {
  photo: Photo;
  onDelete: (photoId: string, cloudinaryPublicId?: string) => void; // Callback to handle delete
}

const GalleryItem: React.FC<GalleryItemProps> = ({ photo, onDelete }) => {
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      onDelete(photo.id, photo.cloudinaryPublicId);
    }
  };

  const handleImageClick = () => setShowModal(true);
  const handleCloseModal = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setShowModal(false);
  };

  return (
    <>
      <div className={styles.galleryItem}>
        <div className={styles.imageContainer}>
          <img
            className={styles.galleryImage}
            src={photo.imageUrl}
            alt={photo.description || 'Family photo'}
            onClick={handleImageClick}
            style={{ cursor: 'pointer' }}
          />
        </div>
        {photo.description && <p className={styles.description}>{photo.description}</p>}
        {photo.uploaderName && <small className={styles.uploader}>Uploaded by: {photo.uploaderName}</small>}
        {currentUser && currentUser.uid === photo.uploaderId && (
          <button
            onClick={handleDeleteClick}
            className={styles.deleteButton}
          >
            Delete
          </button>
        )}
      </div>
      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent}>
            <button className={styles.closeButton} onClick={() => setShowModal(false)}>&times;</button>
            <img
              src={photo.imageUrl}
              alt={photo.description || 'Family photo'}
              className={styles.modalImage}
            />
            {photo.description && <p className={styles.modalDescription}>{photo.description}</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default GalleryItem;
