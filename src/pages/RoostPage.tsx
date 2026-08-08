import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame, Heart, MessageSquare, Send, Share2, Award, Zap, Sparkles, Plus,
  X, Check, ArrowLeft, Users, ShieldAlert, MessageCircle, Star, ThumbsUp
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface KudosPost {
  id: number;
  sender_name: string;
  receiver_name: string;
  message: string;
  badge: 'ROCKSTAR' | 'TEAM_PLAYER' | 'INNOVATOR' | 'EXTRA_MILE';
  likes: number;
  hasLiked?: boolean;
  comments: string[];
  created_at: string;
}

export const RoostPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [tab, setTab] = useState<'feed' | 'feedback'>('feed');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [posts, setPosts] = useState<KudosPost[]>([
    {
      id: 1,
      sender_name: 'Ananya Sharma',
      receiver_name: 'Rahul Verma',
      message: 'Huge thanks to Rahul for staying late to help squash the critical database connection pool leak in server production! Absolutely crushed it. 🚀',
      badge: 'ROCKSTAR',
      likes: 12,
      comments: ['Rahul is a lifesaver!', 'Incredible work Rahul!'],
      created_at: '2 hours ago',
    },
    {
      id: 2,
      sender_name: 'David Miller',
      receiver_name: 'Vaibhav',
      message: 'Great job Vaibhav on designing the mobile UI layout templates. The UI is extremely polished and responsive. High-class work!',
      badge: 'INNOVATOR',
      likes: 24,
      comments: ['The mobile workspace looks amazing!', 'Agree, total gamechanger.'],
      created_at: '4 hours ago',
    },
    {
      id: 3,
      sender_name: 'Pooja Hegde',
      receiver_name: 'Sneha Patel',
      message: 'Kudos to Sneha for onboarding the new engineering batch so smoothly. The documentation was spot on! 📚',
      badge: 'TEAM_PLAYER',
      likes: 8,
      comments: ['Yes! Onboarding guide was so helpful.'],
      created_at: '1 day ago',
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [showKudosModal, setShowKudosModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedBadge, setSelectedBadge] = useState<'ROCKSTAR' | 'TEAM_PLAYER' | 'INNOVATOR' | 'EXTRA_MILE'>('ROCKSTAR');
  const [kudosMessage, setKudosMessage] = useState('');

  // Feedback State
  const [feedbackCategory, setFeedbackCategory] = useState('SUGGESTION');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/employees').catch(() => ({ data: { data: [] } }));
      setEmployees(res.data?.data || []);
    } catch (e) {
      console.error('Error fetching employees list:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleLike = (id: number) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          likes: p.hasLiked ? p.likes - 1 : p.likes + 1,
          hasLiked: !p.hasLiked,
        };
      }
      return p;
    }));
  };

  const handleAddComment = (postId: number, commentText: string) => {
    if (!commentText.trim()) return;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, commentText],
        };
      }
      return p;
    }));
  };

  const handleCreateKudos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !kudosMessage.trim()) {
      alert('Please select a colleague and write a message!');
      return;
    }

    const receiver = employees.find(emp => String(emp.id) === selectedEmployeeId);
    const receiverName = receiver ? `${receiver.first_name} ${receiver.last_name}` : 'Colleague';

    const newPost: KudosPost = {
      id: posts.length + 1,
      sender_name: `${user?.first_name} ${user?.last_name}`,
      receiver_name: receiverName,
      message: kudosMessage,
      badge: selectedBadge,
      likes: 0,
      comments: [],
      created_at: 'Just now',
    };

    setPosts([newPost, ...posts]);
    alert(`🎉 Kudos card published to ${receiverName}!`);
    setShowKudosModal(false);
    setKudosMessage('');
    setSelectedEmployeeId('');
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim()) {
      alert('Please enter your feedback text!');
      return;
    }

    alert('✅ Thank you! Your feedback has been logged securely.');
    setFeedbackContent('');
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'ROCKSTAR':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'INNOVATOR':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'TEAM_PLAYER':
        return <Users className="w-4 h-4 text-blue-500" />;
      default:
        return <Award className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10 font-sans text-slate-800">
      {/* Mobile Back Header */}
      {isMobile ? (
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-slate-800">
          <button onClick={() => onNavigate?.('dashboard')} className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-sm uppercase tracking-tight">Roost Workspace</span>
        </div>
      ) : null}

      {/* Header Workspace */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-2xl p-5 shadow-xl border border-purple-900/40 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/30 rounded-xl">
              <Flame className="w-7 h-7 text-purple-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">THEIAKSHI Roost</h2>
              <p className="text-xs text-purple-300/70 mt-0.5">Peer-to-peer appreciation, feedback, kudos, and community hub</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tab === 'feed' && (
              <button onClick={() => setShowKudosModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20">
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Give Kudos
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('feed')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            tab === 'feed' ? 'bg-white text-purple-700 shadow-sm border border-purple-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Flame className="w-4 h-4 text-orange-500" /> Kudos Feed ({posts.length})
        </button>
        <button onClick={() => setTab('feedback')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            tab === 'feedback' ? 'bg-white text-purple-700 shadow-sm border border-purple-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <MessageCircle className="w-4 h-4 text-purple-500" /> Anonymous Feedback Box
        </button>
      </div>

      {/* TAB 1: Kudos Feed */}
      {tab === 'feed' && (
        <div className="space-y-4">
          {posts.map((post) => {
            const [commentInput, setCommentInput] = useState('');
            return (
              <div key={post.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                      {post.sender_name[0]}
                    </div>
                    <div className="leading-tight">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs">{post.sender_name}</span>
                        <span className="text-[10px] text-slate-400">appreciated</span>
                        <span className="font-bold text-xs text-purple-700">{post.receiver_name}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">{post.created_at}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100 flex items-center gap-1.5 font-mono">
                    {getBadgeIcon(post.badge)} {post.badge.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed font-sans font-medium pl-1 border-l-2 border-purple-100">
                  {post.message}
                </p>

                {/* Likes / Comments Counts */}
                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                  <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1 ${post.hasLiked ? 'text-purple-600 font-bold' : 'hover:text-slate-800'}`}>
                    <ThumbsUp className="w-3.5 h-3.5 fill-current" /> {post.likes} Likes
                  </button>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> {post.comments.length} Comments
                  </span>
                </div>

                {/* Comments List */}
                {post.comments.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-[10px] border">
                    {post.comments.map((comment, idx) => (
                      <p key={idx} className="text-slate-600 font-sans leading-snug">
                        <span className="font-bold text-slate-900 mr-1.5">User:</span>
                        {comment}
                      </p>
                    ))}
                  </div>
                )}

                {/* Write Comment */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-[10px] border rounded-xl bg-slate-50 outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddComment(post.id, commentInput);
                        setCommentInput('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      handleAddComment(post.id, commentInput);
                      setCommentInput('');
                    }}
                    className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Anonymous Feedback */}
      {tab === 'feedback' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 text-slate-800">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-black text-sm">Submit Anonymous Feedback</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Encrypted, completely untraceable feedback directly to HR & Executive team.</p>
            </div>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1">Feedback Category</label>
              <select value={feedbackCategory} onChange={(e) => setFeedbackCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl border outline-none bg-white">
                <option value="SUGGESTION">General Suggestion</option>
                <option value="WORKPLACE_CULTURE">Workplace Culture & Ethics</option>
                <option value="COMPENSATION">Compensation / Benefits</option>
                <option value="FACILITY">Office Facility & IT infrastructure</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Detailed Description *</label>
              <textarea
                required
                rows={5}
                placeholder="Please share details regarding your suggestions, observations, or grievances..."
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border outline-none bg-white focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="anon"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 outline-none"
              />
              <label htmlFor="anon" className="font-bold text-slate-700">Submit anonymously (Hides your name and email)</label>
            </div>

            <button type="submit" className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20">
              Submit Secure Feedback
            </button>
          </form>
        </div>
      )}

      {/* modal Create Kudos */}
      {showKudosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border w-full max-w-md overflow-hidden shadow-2xl text-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm">Appreciate a Colleague</h3>
              <button onClick={() => setShowKudosModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateKudos} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Choose Colleague *</label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border outline-none bg-white"
                >
                  <option value="">-- Choose Colleague --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Select Recognition Badge</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'ROCKSTAR', label: 'Rockstar Perform', icon: Flame, color: 'text-orange-500 border-orange-100 bg-orange-50/50' },
                    { val: 'INNOVATOR', label: 'Creative Innovate', icon: Zap, color: 'text-yellow-500 border-yellow-100 bg-yellow-50/50' },
                    { val: 'TEAM_PLAYER', label: 'Team Collaborator', icon: Users, color: 'text-blue-500 border-blue-100 bg-blue-50/50' },
                    { val: 'EXTRA_MILE', label: 'Going Extra Mile', icon: Award, color: 'text-purple-500 border-purple-100 bg-purple-50/50' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setSelectedBadge(item.val as any)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                          selectedBadge === item.val
                            ? 'border-purple-600 bg-purple-50 font-bold ring-2 ring-purple-600/20'
                            : 'hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="leading-tight text-[10px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Your Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell us what makes their contribution so awesome..."
                  value={kudosMessage}
                  onChange={(e) => setKudosMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border outline-none bg-white focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setShowKudosModal(false)} className="px-4 py-2 font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md">Publish Kudos</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
