import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import styles from './CreatePostForm.module.css';

const CLOUDINARY_CLOUD_NAME = 'dnj4irkpn';
const CLOUDINARY_UPLOAD_PRESET = 'gallery';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface CreatePostFormProps {
  onPostCreated: () => void;
  onCancel: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated, onCancel }) => {
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImageFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("You must be logged in to create a post.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    let coverImageUrl = '';
    let cloudinaryPublicId = '';

    if (coverImageFile) {
      const formData = new FormData();
      formData.append('file', coverImageFile);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      try {
        const response = await fetch(CLOUDINARY_UPLOAD_URL, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        coverImageUrl = data.secure_url;
        cloudinaryPublicId = data.public_id;
      } catch (err) {
        setError('Failed to upload cover image.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await addDoc(collection(db, 'blogPosts'), {
        title,
        category,
        content,
        coverImageUrl,
        cloudinaryPublicId,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setCategory('');
      setContent('');
      setCoverImageFile(null);
      onPostCreated();
    } catch (err) {
      setError('Failed to create post.');
    }
    setIsSubmitting(false);
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <div className={styles.formTitle}>Create New Blog Post</div>
      <div className={styles.formDivider}></div>
      {error && <div style={{ color: '#b71c1c', marginBottom: 10 }}>{error}</div>}
      <label className={styles.formLabel} htmlFor="title">Title:</label>
      <input
        className={styles.formInput}
        id="title"
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <label className={styles.formLabel} htmlFor="category">Category:</label>
      <input
        className={styles.formInput}
        id="category"
        type="text"
        value={category}
        onChange={e => setCategory(e.target.value)}
      />
      <label className={styles.formLabel} htmlFor="coverImage">Cover Image (Optional):</label>
      <input
        className={styles.formInput}
        id="coverImage"
        type="file"
        accept="image/*"
        onChange={handleCoverImageChange}
      />
      <label className={styles.formLabel} htmlFor="content">Content:</label>
      <textarea
        className={styles.formTextarea}
        id="content"
        value={content}
        onChange={e => setContent(e.target.value)}
        required
      />
      <button className={styles.formButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Posting...' : 'Create Post'}
      </button>
      <button type="button" className={styles.cancelButton} onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
};

export default CreatePostForm;
