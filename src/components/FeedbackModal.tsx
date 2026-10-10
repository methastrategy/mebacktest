import React, { useState } from 'react';
import { X, MessageSquare, Star, Send, CheckCircle2 } from 'lucide-react';
import { AuthService } from '../core/AuthService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState<'bug' | 'feature' | 'prop_firm' | 'other'>('feature');
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const currentUser = AuthService.getInstance().getCurrentUser();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Save to local feedback store
    try {
      const feedback = {
        id: `fb_${Date.now()}`,
        user: currentUser?.email || 'guest',
        category,
        rating,
        message: message.trim(),
        date: Date.now(),
      };
      const existing = JSON.parse(localStorage.getItem('mebacktest_feedback') || '[]');
      localStorage.setItem('mebacktest_feedback', JSON.stringify([feedback, ...existing]));
    } catch {
      // Ignore
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0d111a] border border-tv-border rounded-2xl shadow-2xl overflow-hidden p-6 text-tv-text">
        <div className="flex items-center justify-between pb-4 border-b border-tv-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-tv-blue/20 border border-tv-blue/30 flex items-center justify-center text-tv-blue">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Send Feedback & Bug Reports</h2>
              <p className="text-xs text-tv-muted">Help us make MeBacktest the #1 replay tool in the world</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-tv-muted hover:text-white hover:bg-tv-border/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 flex flex-col items-center text-center">
            <CheckCircle2 size={48} className="text-emerald-400 mb-3 animate-bounce" />
            <h3 className="text-base font-bold text-white">Thank You for Your Feedback!</h3>
            <p className="text-xs text-tv-muted mt-1">Our engineering team reviews every submission carefully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-tv-text mb-1.5">Feedback Category</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'feature', label: 'Feature Request' },
                  { id: 'bug', label: 'Report a Bug' },
                  { id: 'prop_firm', label: 'Prop Firm Rules' },
                  { id: 'other', label: 'General Thoughts' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                      category === cat.id
                        ? 'bg-tv-blue/20 border-tv-blue text-white'
                        : 'bg-tv-bg border-tv-border text-tv-muted hover:text-tv-text'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-tv-text mb-1">Rating</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={20}
                      className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-tv-muted'}
                    />
                  </button>
                ))}
                <span className="text-xs text-tv-muted ml-2">{rating}/5 Stars</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-tv-text mb-1">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                placeholder="Tell us what you love or what we should improve..."
                className="w-full bg-tv-bg border border-tv-border focus:border-tv-blue rounded-xl p-3 text-xs text-white placeholder-tv-muted focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-tv-blue hover:bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Send size={14} />
              <span>Submit Feedback</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
