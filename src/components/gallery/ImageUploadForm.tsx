import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig'; // storage import removed
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import styles from './ImageUploadForm.module.css'; // Import CSS Module

const CLOUDINARY_CLOUD_NAME = 'dnj4irkpn';
const CLOUDINARY_UPLOAD_PRESET = 'gallery';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface ImageUploadFormProps {
  onUploadSuccess?: () => void;
}

const ImageUploadForm: React.FC<ImageUploadFormProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  // Progress for Cloudinary direct upload is not as granular as Firebase SDK's.
  // We'll just use the 'uploading' boolean.
  // const [progress, setProgress] = useState<number>(0); 
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    if (!currentUser) {
      setError('You must be logged in to upload photos.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Cloudinary upload failed');
      }

      const data = await response.json();
      const imageUrl = data.secure_url; // Or data.url

      // Save metadata to Firestore
      await addDoc(collection(db, 'galleryPhotos'), {
        imageUrl: imageUrl,
        description: description,
        uploaderId: currentUser.uid,
        uploaderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        createdAt: serverTimestamp(),
        cloudinaryPublicId: data.public_id // Store public_id if you want to manage/delete via Cloudinary API later
      });

      setUploading(false);
      setFile(null);
      const fileInput = document.getElementById('photo-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setDescription('');
      if (onUploadSuccess) onUploadSuccess();
      alert('Photo uploaded successfully!');

    } catch (err: any) {
      console.error("Upload or Firestore error:", err);
      setError(err.message || 'An error occurred during upload.');
      setUploading(false);
    }
  };

  if (!currentUser) {
    return <p className={styles.loginMessage}>Please log in to upload photos.</p>;
  }

  return (
    <div className={styles.uploadFormContainer}>
      <h3>Upload New Photo</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="photo-file" className={styles.formLabel}>Choose Photo:</label>
          <input 
            type="file" 
            id="photo-file" 
            accept="image/*" 
            onChange={handleFileChange} 
            required 
            className={styles.formInputFile} // Uses global styles by default, can add specific overrides
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="photo-description" className={styles.formLabel}>Description (Optional):</label>
          <textarea 
            id="photo-description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows={3}
            placeholder="Enter a short description..."
            className={styles.formTextarea} // Uses global styles by default, specific min-height in module
          />
        </div>
        <button type="submit" disabled={uploading || !file} className={styles.submitButton}>
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
        {error && <p className={styles.errorMessage}>{error}</p>}
      </form>
    </div>
  );
};

export default ImageUploadForm;
