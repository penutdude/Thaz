import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CreatePostForm from '../components/blogs/CreatePostForm';
import BlogPostPreview from '../components/blogs/BlogPostPreview';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy, Timestamp, doc, deleteDoc } from 'firebase/firestore'; // Added doc, deleteDoc
import styles from './BlogsPage.module.css'; // For CSS Modules

// Define Post interface here or in a shared types file
// Exporting for use in SinglePostPage and BlogPostPreview if they don't define their own
export interface Post { 
  id: string;
  title: string;
  category?: string;
  content?: string; 
  coverImageUrl?: string;
  cloudinaryPublicId?: string; // Add this field
  authorId: string;
  authorName?: string;
  createdAt: Timestamp; // Ensure this is Firestore Timestamp
  updatedAt?: Timestamp;
}

const NAV_TABS = [
  { label: 'Blogs', icon: '📝', route: '/blogs' },
  { label: 'Gallery', icon: '📷', route: '/gallery' },
  { label: 'Events', icon: '📅', route: '/events' },
  { label: 'Family Tree', icon: '🌳', route: '/family-tree' },
  { label: 'History', icon: '📖', route: '/about' },
];

const BlogsPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Blogs');

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const postsCollectionRef = collection(db, 'blogPosts');
      const q = query(postsCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedPosts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // Ensure createdAt is a Timestamp object, or handle conversion if it's not
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date()), // Fallback if not a Timestamp
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : undefined,
        } as Post;
      });
      setPosts(fetchedPosts);
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      setError('Failed to load posts.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDeletePost = async (postId: string, cloudinaryPublicId?: string) => {
    // For now, only deletes from Firestore. Cover image on Cloudinary remains.
    // A backend function would be needed for secure Cloudinary deletion using cloudinaryPublicId.
    console.log(`Attempting to delete blog post ${postId}. Cloudinary Public ID for cover: ${cloudinaryPublicId}`);
    try {
      await deleteDoc(doc(db, 'blogPosts', postId));
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId)); // Optimistically update UI
      alert('Blog post record deleted from database.');
    } catch (err: any) {
      console.error("Error deleting blog post record:", err);
      setError('Failed to delete blog post record: ' + err.message);
    }
  };
  // Navigation handler using React Router
  const navigate = useNavigate();
  
  const handleTabClick = (tab: typeof NAV_TABS[0]) => {
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
                  navigate('/login'); // Redirect to login page after logout
                }
              }}
              type="button"
            >
              Log Out
            </button>
          ) : null}
        </nav>
      </aside>
      <main className={styles.bookPage}>
        <header className={styles.bookHeader}>Family Blog Album</header>
        <div className={styles.marginNote}>"Write your story!"</div>
        <div className={styles.bookContent}>
          <div className={styles.blogsHeader}>
            <input
              type="text"
              className={styles.blogSearchInput}
              placeholder="Search blogs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {currentUser && (
              <button
                onClick={() => setShowCreateForm(true)}
                className={styles.addPostButton}
              >
                Create New Post
              </button>
            )}
          </div>
          {/* Modal popout for CreatePostForm */}
          {showCreateForm && currentUser && (
            <div className={styles.modalOverlay} onClick={() => setShowCreateForm(false)}>
              <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <CreatePostForm
                  onPostCreated={() => {
                    setShowCreateForm(false);
                    fetchPosts();
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            </div>
          )}
          {isLoading && <p className={styles.loadingText}>Loading posts...</p>}
          {error && <p className={styles.errorMessage}>{error}</p>}
          {!isLoading && !error && posts.length === 0 && !showCreateForm && (
            <p className={styles.noPostsText}>No blog posts yet. {currentUser ? 'Be the first to create one!' : ''}</p>
          )}
          {!isLoading && !error && posts.length > 0 && (
            <div className={styles.blogPostsList}>
              {posts.filter(post =>
                post.title.toLowerCase().includes(search.toLowerCase()) ||
                post.content?.toLowerCase().includes(search.toLowerCase())
              ).map(post => (
                <BlogPostPreview key={post.id} post={post} onDelete={handleDeletePost} />
              ))}
            </div>
          )}
        </div>
        <footer className={styles.bookFooter}>Page 1 &mdash; Thazhuthedath Family</footer>
      </main>
    </div>
  );
};

export default BlogsPage;
