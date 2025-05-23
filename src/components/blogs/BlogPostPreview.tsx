import React from 'react';
import styles from './BlogPostPreview.module.css';
import type { Post } from '../../pages/BlogsPage';

interface BlogPostPreviewProps {
  post: Post;
  onDelete: (postId: string, cloudinaryPublicId?: string) => void;
}

const BlogPostPreview: React.FC<BlogPostPreviewProps> = ({ post, onDelete }) => {
  return (
    <div className={styles.scrapbookCard}>
      <div className={styles.tape}></div>
      {post.coverImageUrl && (
        <img src={post.coverImageUrl} alt={post.title} className={styles.coverImage} />
      )}
      <div className={styles.title}>{post.title}</div>
      {post.category && <span className={styles.categoryTag}>{post.category}</span>}
      <div className={styles.meta}>
        By: {post.authorName || 'Unknown'} &nbsp;|&nbsp; {post.createdAt.toDate().toLocaleDateString()}
      </div>
      <div className={styles.contentPreview}>
        {post.content?.slice(0, 80)}{post.content && post.content.length > 80 ? '...' : ''}
      </div>
      <span className={styles.doodle}>✏️</span>
      <a className={styles.readMore} href={`/blogs/${post.id}`}>Read More →</a>
      <button className={styles.deleteButton} onClick={() => onDelete(post.id, post.cloudinaryPublicId)}>
        Delete
      </button>
    </div>
  );
};

export default BlogPostPreview;
