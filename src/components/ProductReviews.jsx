import React, { useState, useEffect, useCallback } from 'react';
import { Star, Send, Loader2, CheckCircle2, User, ThumbsUp, PenLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchProductReviews, submitProductReview } from '../services/supabase';

const StarInput = ({ value, onChange, size = 'md' }) => {
  const [hovered, setHovered] = useState(0);
  const sz = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
          className="cursor-pointer transition-transform hover:scale-110">
          <Star className={`${sz} transition-colors ${star <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
};

const StarDisplay = ({ rating, size = 'sm' }) => {
  const sz = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`${sz} ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'}`} />
      ))}
    </div>
  );
};

const ratingLabel = (r) => ['','Poor','Fair','Good','Very Good','Excellent!'][r] || 'Select a rating';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

export const ProductReviews = ({ product }) => {
  const { customer, currentCustomer, setIsAuthOpen } = useAuth();
  const activeCustomer = currentCustomer || customer;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const data = await fetchProductReviews(product.id);
    setReviews(data);
    setLoading(false);
  }, [product.id]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const myReview = activeCustomer ? reviews.find((r) => r.customer_phone === activeCustomer.phone) : null;
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : null;
  const breakdown = [5,4,3,2,1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, pct: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0 };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeCustomer) { setIsAuthOpen(true); return; }
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (reviewText.trim().length < 10) { setError('Please write at least 10 characters.'); return; }
    setError('');
    setSubmitting(true);
    const result = await submitProductReview({
      productId: product.id,
      productName: product.title || product.name,
      customerPhone: activeCustomer.phone,
      customerName: activeCustomer.fullName || activeCustomer.name || 'Verified Customer',
      rating,
      reviewText: reviewText.trim()
    });
    setSubmitting(false);
    if (result.success) {
      setSubmitted(true); setShowForm(false); setRating(0); setReviewText('');
      await loadReviews();
      setTimeout(() => setSubmitted(false), 5000);
    } else {
      setError(result.error || 'Failed to submit. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-3 space-y-2">
          {avgRating ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black text-slate-900">{avgRating}</span>
                <span className="text-sm text-slate-400 font-medium">/ 5</span>
              </div>
              <StarDisplay rating={parseFloat(avgRating)} size="lg" />
              <p className="text-xs text-slate-400 font-medium">Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
            </>
          ) : (
            <div className="space-y-1">
              <p className="text-2xl font-black text-slate-300">No ratings yet</p>
              <p className="text-xs text-slate-400">Be the first to review!</p>
            </div>
          )}
        </div>
        <div className="md:col-span-5 space-y-2">
          {breakdown.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-3 text-xs">
              <span className="w-10 text-slate-600 font-semibold shrink-0">{star} ★</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 text-slate-400 text-right shrink-0">{count}</span>
            </div>
          ))}
        </div>
        <div className="md:col-span-4 text-center md:text-right space-y-3 md:pl-6 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{myReview ? 'Update Your Review' : 'Review this product'}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Share your honest experience</p>
          </div>
          {!activeCustomer ? (
            <button type="button" onClick={() => setIsAuthOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm">
              <User className="w-3.5 h-3.5" /> Login to Review
            </button>
          ) : (
            <button type="button" onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-800 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-semibold transition-all cursor-pointer">
              <PenLine className="w-3.5 h-3.5" /> {myReview ? 'Edit My Review' : 'Write a Review'}
            </button>
          )}
          {submitted && (
            <div className="flex items-center justify-center md:justify-end gap-1.5 text-xs text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Review submitted!
            </div>
          )}
        </div>
      </div>

      {/* Write Review Form */}
      {showForm && activeCustomer && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <PenLine className="w-4 h-4 text-emerald-600" />
            {myReview ? 'Update Your Review' : 'Your Review'}
          </h4>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Your Rating *</label>
            <StarInput value={rating || myReview?.rating || 0} onChange={setRating} size="lg" />
            {rating > 0 && <p className="text-xs text-amber-600 font-semibold">{ratingLabel(rating)}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Your Review *</label>
            <textarea
              placeholder="Share your experience — quality, freshness, packaging, value for money..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white focus:border-emerald-500 outline-none resize-none text-slate-700 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400">{reviewText.length} / 500 characters</p>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
              {(activeCustomer.fullName || activeCustomer.name || 'C')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{activeCustomer.fullName || activeCustomer.name || 'Verified Customer'}</p>
              <p className="text-[10px] text-slate-400">Verified WhatsApp Account</p>
            </div>
          </div>
          {error && <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer shadow-sm">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">Cancel</button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <ThumbsUp className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">No reviews yet</p>
            <p className="text-xs text-slate-300">Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => {
            const isMyReview = activeCustomer && review.customer_phone === activeCustomer.phone;
            const initial = (review.customer_name || 'C')[0].toUpperCase();
            const maskedPhone = review.customer_phone ? `+91 ••••••${String(review.customer_phone).slice(-4)}` : '';
            return (
              <div key={review.id} className={`p-4 rounded-2xl border space-y-3 ${isMyReview ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-100 bg-white'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center text-sm font-black shrink-0">{initial}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{review.customer_name || 'Verified Customer'}</span>
                        {isMyReview && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Your Review</span>}
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Verified Purchase
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{maskedPhone}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(review.created_at)}</span>
                </div>
                <StarDisplay rating={review.rating} />
                {review.review_text && <p className="text-sm text-slate-700 leading-relaxed">{review.review_text}</p>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
