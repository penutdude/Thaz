import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Post } from './BlogsPage'; // Import Post interface from BlogsPage
import styles from './SinglePostPage.module.css'; // Import CSS Module

const SinglePostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError("Post ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const postDocRef = doc(db, 'blogPosts', postId);
        const docSnap = await getDoc(postDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPost({ 
            id: docSnap.id, 
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date()),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : undefined,
          } as Post);
        } else {
          setError('Blog post not found.');
        }
      } catch (err: any) {
        console.error("Error fetching post:", err);
        setError('Failed to load post.');
      }
      setIsLoading(false);
    };
    fetchPost();
  }, [postId]);
  
  // Safely format date
  const formatDate = (timestamp: any) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString();
    }
    return 'N/A';
  };

  if (isLoading) return <p className={styles.loadingText}>Loading post...</p>;
  if (error) return <p className={styles.errorText}>{error}</p>;
  if (!post) return <p className={styles.notFoundText}>Post not found. <Link to="/blogs" className={styles.backLink}>Back to Blogs</Link></p>;

  return (
    <article className={styles.singlePostPage}>
      <h2 className={styles.postTitle}>{post.title}</h2>
      {post.coverImageUrl && (
        <img 
          src={post.coverImageUrl} 
          alt={post.title} 
          className={styles.coverImage}
        />
      )}
      <p className={styles.metaInfo}>
        {post.category && <span><strong>Category:</strong> {post.category} | </span>}
        <span><strong>By:</strong> {post.authorName || 'Unknown'}</span> | 
        <span><strong>On:</strong> {formatDate(post.createdAt)}</span>
        {post.updatedAt && post.updatedAt.seconds !== post.createdAt.seconds && <span> | <strong>Updated:</strong> {formatDate(post.updatedAt)}</span>}
      </p>
      <div className={styles.postContent}>
        {post.content?.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p> // Individual paragraph margin handled by .postContent p
        ))}
      </div>
      <Link to="/blogs" className={styles.backLink}>&larr; Back to Blogs</Link>
    </article>
  );
};

export default SinglePostPage;
