import React, { useState } from 'react';
import { addEventComment } from '../../firebase/eventComments'; // Adjust path as needed
import { auth } from '../../firebaseConfig'; // To check if user is logged in
import styles from './AddEventCommentForm.module.css'; // Import CSS Module

interface AddEventCommentFormProps {
  eventId: string;
  onCommentAdded?: () => void; // Optional callback after comment is added
}

const AddEventCommentForm: React.FC<AddEventCommentFormProps> = ({ eventId, onCommentAdded }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user) {
      setError('You must be logged in to comment.');
      return;
    }

    if (!text.trim() && !imageFile) {
      setError('Please enter text or select an image for your comment.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await addEventComment(eventId, {
        text: text.trim() || null,
        imageFile,
        // userId, userName, userPhotoURL are handled by addEventComment using auth.currentUser
      });
      setText('');
      setImageFile(null);
      // Clear the file input visually (this is a bit tricky with controlled file inputs)
      const fileInput = e.target as HTMLFormElement;
      if (fileInput.image) { // Assuming input has name="image"
        fileInput.image.value = '';
      }
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err: any) {
      console.error('Failed to add comment:', err);
      setError(err.message || 'Failed to post comment.');
    }
    setIsLoading(false);
  };

  if (!auth.currentUser) {
    return <p className={styles.loginMessage}>Please log in to add a comment.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.commentForm}>
      <h4 className={styles.formTitle}>Add Your Comment</h4>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <div className={styles.formGroup}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your comment..."
          rows={3}
          className={styles.formTextarea}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="commentImage" className={styles.formFileInputLabel}>Attach Image (optional):</label>
        <input
          type="file"
          id="commentImage"
          name="image" // For resetting the input
          accept="image/*"
          onChange={handleImageChange}
          className={styles.formFileInput}
        />
      </div>
      <button type="submit" disabled={isLoading} className={styles.submitButton}>
        {isLoading ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
};

export default AddEventCommentForm;
