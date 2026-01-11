import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlitchText } from '../components/GlitchText';
import { Users, Plus, ThumbsUp, Filter, MessageSquare, X, Zap, Loader2, AlertCircle, RefreshCw, Send, Trash2 } from 'lucide-react';
import { fetchIdeas, createIdea, upvoteIdea, fetchComments, createComment, deleteComment, type Idea, type Comment } from '../services/ideasService';

// Fallback mock data khi API không khả dụng
const MOCK_IDEAS: Idea[] = [
  {
    id: 1,
    title: "AI-Powered Plant Waterer",
    description: "IoT system using Raspberry Pi and Gemini API to analyze soil moisture and plant health, then water automatically.",
    tags: ["IoT", "Python", "React", "AI"],
    difficulty: "Hard",
    upvotes: 42,
    lookingForTeam: true,
    author: "GreenThumb"
  },
  {
    id: 2,
    title: "Brutalist Todo App",
    description: "A task manager that insults you when you miss deadlines. High contrast, no animations, pure anxiety.",
    tags: ["React", "LocalStorage", "CSS"],
    difficulty: "Easy",
    upvotes: 128,
    lookingForTeam: false,
    author: "Xuni-Dizan"
  },
  {
    id: 3,
    title: "Decentralized Social Graph",
    description: "Visualizing wallet connections on Ethereum using Three.js force-directed graphs.",
    tags: ["Web3", "Three.js", "Solidity"],
    difficulty: "Expert",
    upvotes: 8,
    lookingForTeam: true,
    author: "CryptoNomad"
  },
  {
    id: 4,
    title: "Retro Terminal Portfolio",
    description: "A portfolio template that looks exactly like an Ubuntu terminal. Fully keyboard navigable.",
    tags: ["Vue", "Typescript"],
    difficulty: "Medium",
    upvotes: 24,
    lookingForTeam: false,
    author: "LinuxFan"
  }
];

export const Collaboration: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filter, setFilter] = useState<'All' | 'Team' | 'Easy' | 'Hard'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '', tags: '', difficulty: 'Medium' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<number | null>(null);

  // Comment states
  const [commentModalIdeaId, setCommentModalIdeaId] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Author name state with localStorage
  const [commentAuthor, setCommentAuthor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('collab_author_name') || '';
    }
    return '';
  });
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);

  // Save author name to localStorage when changed
  useEffect(() => {
    if (commentAuthor && typeof window !== 'undefined') {
      localStorage.setItem('collab_author_name', commentAuthor);
    }
  }, [commentAuthor]);

  // Fetch ideas on mount
  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIdeas();
      setIdeas(data);
    } catch (err) {
      console.warn('API unavailable, using mock data:', err);
      setIdeas(MOCK_IDEAS);
      setError('Đang dùng dữ liệu mẫu (API chưa kết nối)');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (id: number) => {
    if (votingId) return;
    setVotingId(id);

    // Optimistic update
    setIdeas(prev => prev.map(idea =>
      idea.id === id ? { ...idea, upvotes: idea.upvotes + 1 } : idea
    ));

    try {
      await upvoteIdea(id);
    } catch (err) {
      // Revert on error
      setIdeas(prev => prev.map(idea =>
        idea.id === id ? { ...idea, upvotes: idea.upvotes - 1 } : idea
      ));
    } finally {
      setVotingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const ideaInput = {
      title: newIdea.title,
      description: newIdea.description,
      tags: newIdea.tags.split(',').map(t => t.trim()).filter(Boolean),
      difficulty: newIdea.difficulty as Idea['difficulty'],
      author: "Guest_User",
      lookingForTeam: true,
    };

    try {
      const { id } = await createIdea(ideaInput);
      const createdIdea: Idea = { ...ideaInput, id, upvotes: 0 };
      setIdeas([createdIdea, ...ideas]);
      setIsModalOpen(false);
      setNewIdea({ title: '', description: '', tags: '', difficulty: 'Medium' });
      // Clear error if POST succeeds - this means API is working
      setError(null);
      // Optionally reload to ensure sync with DB
      loadIdeas();
    } catch (err) {
      // Fallback: add locally
      const localIdea: Idea = { ...ideaInput, id: Date.now(), upvotes: 0 };
      setIdeas([localIdea, ...ideas]);
      setIsModalOpen(false);
      setNewIdea({ title: '', description: '', tags: '', difficulty: 'Medium' });
    } finally {
      setSubmitting(false);
    }
  };

  // Comment handlers
  const openCommentModal = async (ideaId: number) => {
    setCommentModalIdeaId(ideaId);
    setLoadingComments(true);
    try {
      const data = await fetchComments(ideaId);
      setComments(data);
    } catch (err) {
      console.warn('Failed to fetch comments:', err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const closeCommentModal = () => {
    setCommentModalIdeaId(null);
    setComments([]);
    setNewComment('');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentModalIdeaId || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const authorName = commentAuthor.trim() || 'Anonymous';
      const comment = await createComment(commentModalIdeaId, newComment.trim(), authorName);
      setComments(prev => [...prev, comment]);
      setCommentCounts(prev => ({ ...prev, [commentModalIdeaId]: (prev[commentModalIdeaId] || 0) + 1 }));
      setNewComment('');
    } catch (err) {
      console.warn('Failed to create comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!commentModalIdeaId) return;
    try {
      await deleteComment(commentModalIdeaId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentCounts(prev => ({ ...prev, [commentModalIdeaId]: Math.max(0, (prev[commentModalIdeaId] || 0) - 1) }));
    } catch (err) {
      console.warn('Failed to delete comment:', err);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const filteredIdeas = ideas.filter(idea => {
    if (filter === 'All') return true;
    if (filter === 'Team') return idea.lookingForTeam;
    return idea.difficulty === filter;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-theme-bg text-theme-text pt-24 md:pt-32 pb-24"
    >
      <div className="container mx-auto px-4 md:px-32">

        {/* Header */}
        <div className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <div className="flex items-center gap-2 text-theme-accent opacity-60 mb-4">
              <Users size={14} />
              <span className="font-mono text-xs uppercase tracking-widest">Community Hive</span>
            </div>
            <GlitchText
              text="Collaboration Board."
              className="text-4xl md:text-[6vw] leading-[0.9] font-black tracking-tighter"
              highlightWord="Board."
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-theme-text text-theme-bg px-6 py-4 font-mono uppercase tracking-widest hover:bg-mantis-green hover:text-black transition-colors flex items-center gap-2 group shadow-[8px_8px_0px_0px_var(--color-accent)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            <Plus size={16} />
            Propose Idea
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
            <AlertCircle size={16} className="text-yellow-500" />
            <span className="font-mono text-xs">{error}</span>
            <button onClick={loadIdeas} className="ml-auto hover:text-theme-accent" aria-label="Làm mới danh sách" title="Làm mới danh sách">
              <RefreshCw size={14} />
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="sticky top-24 z-30 bg-theme-bg/90 backdrop-blur-sm py-4 mb-12 border-b border-theme-border flex flex-wrap gap-4 items-center">
          <Filter size={16} className="mr-2 opacity-50" />
          {['All', 'Team', 'Easy', 'Hard'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border transition-all ${filter === f
                ? 'bg-theme-text text-theme-bg border-theme-text'
                : 'bg-transparent text-theme-text border-transparent hover:border-theme-border'
                }`}
            >
              {f === 'Team' ? 'Looking for Team' : f}
            </button>
          ))}
          <div className="ml-auto font-mono text-xs opacity-50 hidden md:block">
            {filteredIdeas.length} PROJECTS FOUND
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin text-theme-accent" />
          </div>
        )}

        {/* Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredIdeas.map((idea) => (
                <motion.div
                  key={idea.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-theme-panel border border-theme-border p-8 flex flex-col shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[15px_15px_0px_0px_var(--color-border)] hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-2 flex-wrap">
                      {idea.tags.map(tag => (
                        <span key={tag} className="bg-theme-bg px-2 py-1 text-[10px] font-mono uppercase tracking-wide border border-transparent group-hover:border-theme-border/10 transition-colors">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase border border-theme-border ${idea.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : idea.difficulty === 'Hard' ? 'bg-red-100 text-red-800' : idea.difficulty === 'Expert' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {idea.difficulty}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold leading-tight mb-4 group-hover:text-theme-accent transition-colors">{idea.title}</h3>
                  <p className="font-mono text-xs opacity-60 leading-relaxed mb-8 flex-grow">
                    {idea.description}
                  </p>

                  <div className="border-t border-theme-border/10 pt-6 mt-auto flex justify-between items-center">
                    <button
                      onClick={() => handleUpvote(idea.id)}
                      disabled={votingId === idea.id}
                      className="flex items-center gap-2 text-xs font-bold hover:text-theme-accent transition-colors disabled:opacity-50"
                    >
                      <ThumbsUp size={14} className={votingId === idea.id ? 'animate-pulse' : ''} />
                      <span>{idea.upvotes}</span>
                    </button>

                    <div className="flex items-center gap-4">
                      {idea.lookingForTeam && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-theme-accent animate-pulse">
                          <Zap size={12} className="fill-current" />
                          TEAM
                        </div>
                      )}
                      <button
                        onClick={() => openCommentModal(idea.id)}
                        className="bg-theme-text text-theme-bg p-2 hover:bg-mantis-green hover:text-black transition-colors flex items-center gap-1"
                        aria-label="Xem bình luận"
                        title="Xem bình luận"
                      >
                        <MessageSquare size={14} />
                        {(commentCounts[idea.id] || 0) > 0 && (
                          <span className="text-[10px] font-bold">{commentCounts[idea.id]}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-theme-panel w-full max-w-lg border-2 border-theme-text shadow-2xl overflow-hidden"
            >
              <div className="bg-theme-text text-theme-bg p-4 flex justify-between items-center border-b border-theme-text">
                <span className="font-mono text-xs uppercase tracking-widest">New_Proposal.exe</span>
                <button onClick={() => setIsModalOpen(false)} className="hover:text-mantis-green" aria-label="Đóng modal" title="Đóng modal"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest mb-2">Project Title</label>
                  <input
                    type="text"
                    required
                    value={newIdea.title}
                    onChange={e => setNewIdea({ ...newIdea, title: e.target.value })}
                    className="w-full bg-theme-bg p-3 border border-theme-border focus:border-mantis-green outline-none transition-colors"
                    placeholder="e.g., Quantum To-Do List"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest mb-2">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newIdea.description}
                    onChange={e => setNewIdea({ ...newIdea, description: e.target.value })}
                    className="w-full bg-theme-bg p-3 border border-theme-border focus:border-mantis-green outline-none transition-colors"
                    placeholder="Briefly explain your idea..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest mb-2">Tags (comma sep)</label>
                    <input
                      type="text"
                      required
                      value={newIdea.tags}
                      onChange={e => setNewIdea({ ...newIdea, tags: e.target.value })}
                      className="w-full bg-theme-bg p-3 border border-theme-border focus:border-mantis-green outline-none transition-colors"
                      placeholder="React, IoT, Web3"
                    />
                  </div>
                  <div>
                    <label htmlFor="difficulty-select" className="block font-mono text-xs uppercase tracking-widest mb-2">Difficulty</label>
                    <select
                      id="difficulty-select"
                      value={newIdea.difficulty}
                      onChange={e => setNewIdea({ ...newIdea, difficulty: e.target.value })}
                      className="w-full bg-theme-bg p-3 border border-theme-border focus:border-mantis-green outline-none"
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                      <option>Expert</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-theme-text text-theme-bg py-4 font-mono uppercase tracking-widest hover:bg-mantis-green hover:text-black transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Submitting...' : 'Submit to Board'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      <AnimatePresence>
        {commentModalIdeaId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={closeCommentModal}
          >
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-theme-panel w-full max-w-lg max-h-[80vh] border-2 border-theme-text shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="bg-theme-text text-theme-bg p-4 flex justify-between items-center border-b border-theme-text flex-shrink-0">
                <span className="font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={14} />
                  Comments ({comments.length})
                </span>
                <button onClick={closeCommentModal} className="hover:text-mantis-green" aria-label="Đóng bình luận" title="Đóng bình luận">
                  <X size={18} />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-theme-accent" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 opacity-50">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-mono text-xs">Chưa có bình luận nào</p>
                    <p className="font-mono text-[10px] mt-1">Hãy là người đầu tiên!</p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-theme-bg p-4 border border-theme-border/30 group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-theme-accent">@{comment.author}</span>
                          <span className="text-[10px] opacity-50">{getTimeAgo(comment.createdAt)}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity p-1"
                          title="Xóa bình luận"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="p-4 border-t border-theme-border/30 flex-shrink-0 space-y-3">
                {/* Author name section */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider opacity-50">Đăng với tên:</span>
                  {isEditingAuthor ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={commentAuthor}
                        onChange={e => setCommentAuthor(e.target.value)}
                        placeholder="Nhập tên của bạn..."
                        className="flex-1 bg-theme-bg px-2 py-1 border border-mantis-green text-sm outline-none"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setIsEditingAuthor(false);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingAuthor(false)}
                        className="text-mantis-green text-xs font-mono hover:underline"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingAuthor(true)}
                      className="text-theme-accent font-bold text-sm hover:underline flex items-center gap-1"
                    >
                      @{commentAuthor || 'Anonymous'}
                      <span className="text-[10px] opacity-50">(sửa)</span>
                    </button>
                  )}
                </div>

                {/* Comment input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="flex-1 bg-theme-bg p-3 border border-theme-border focus:border-mantis-green outline-none transition-colors text-sm"
                    disabled={submittingComment}
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="bg-theme-text text-theme-bg px-4 hover:bg-mantis-green hover:text-black transition-colors disabled:opacity-50 flex items-center gap-2"
                    aria-label="Gửi bình luận"
                    title="Gửi bình luận"
                  >
                    {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
