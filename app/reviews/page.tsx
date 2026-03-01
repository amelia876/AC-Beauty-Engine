"use client"

import { useState, useEffect } from "react"
import { Footer } from "@/components/footer"
import { Star, Loader2, MessageCircle, ChevronDown, ChevronUp, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore"

interface Reply {
  id: string
  reviewId: string
  authorName: string
  authorEmail: string
  authorPhoto: string
  isAdmin: boolean
  text: string
  createdAt: string
}

interface Review {
  id: string
  authorName: string
  authorEmail: string
  authorPhoto: string
  authorUid: string
  date: string
  rating: number
  product: string
  text: string
  archived: boolean
  replies: Reply[]
}

const ADMIN_EMAILS = ["ac.swimwear876@gmail.com", "melly.cole1@gmail.com"]

function StarRating({
  rating,
  interactive = false,
  onRate,
  size = "sm",
}: {
  rating: number
  interactive?: boolean
  onRate?: (r: number) => void
  size?: "sm" | "md"
}) {
  const [hover, setHover] = useState(0)
  const px = size === "md" ? "h-5 w-5" : "h-4 w-4"

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`${px} transition-colors ${
              star <= (hover || rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-border"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function ReviewReplySection({ review, onReplyAdded }: { review: Review; onReplyAdded: () => void }) {
  const { user } = useAuth()
  const [showReplies, setShowReplies] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email)

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !replyText.trim()) return

    setSubmitting(true)
    try {
      await addDoc(collection(db, "reviewReplies"), {
        reviewId: review.id,
        authorName: user.displayName || user.email?.split("@")[0] || "User",
        authorEmail: user.email || "",
        authorPhoto: user.photoURL || "",
        isAdmin,
        text: replyText.trim(),
        createdAt: Timestamp.now(),
      })
      setReplyText("")
      setShowReplyForm(false)
      onReplyAdded()
    } catch (err) {
      console.error("Failed to post reply:", err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4">
        {review.replies.length > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {review.replies.length} {review.replies.length === 1 ? "reply" : "replies"}
            {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
        {user && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Reply
          </button>
        )}
      </div>

      {/* Replies */}
      {showReplies && review.replies.length > 0 && (
        <div className="mt-4 space-y-4 border-l-2 border-border/60 pl-4">
          {review.replies.map((reply) => (
            <div key={reply.id}>
              <div className="flex items-center gap-2">
                {reply.authorPhoto ? (
                  <img src={reply.authorPhoto} alt="" className="h-6 w-6 rounded-full" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {reply.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">
                  {reply.authorName}
                </span>
                {reply.isAdmin && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    <Shield className="h-3 w-3" />
                    Admin
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{reply.createdAt}</span>
              </div>
              <p className="mt-1 pl-8 text-sm leading-relaxed text-foreground/80">{reply.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {showReplyForm && user && (
        <form onSubmit={handleReply} className="mt-4 border-l-2 border-border/60 pl-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            required
            rows={2}
            placeholder="Write a reply..."
            className="w-full resize-none border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting || !replyText.trim()}
              className="border border-foreground bg-foreground px-4 py-1.5 text-xs uppercase tracking-widest text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post Reply"}
            </button>
            <button
              type="button"
              onClick={() => { setShowReplyForm(false); setReplyText("") }}
              className="px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function ReviewsPage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState("")
  const [rating, setRating] = useState(0)
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function fetchReviews() {
    try {
      // Fetch reviews (non-archived only for public)
      const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      // Fetch all replies
      const repliesSnap = await getDocs(query(collection(db, "reviewReplies"), orderBy("createdAt", "asc")))
      const allReplies: Reply[] = repliesSnap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          reviewId: data.reviewId,
          authorName: data.authorName,
          authorEmail: data.authorEmail || "",
          authorPhoto: data.authorPhoto || "",
          isAdmin: data.isAdmin || false,
          text: data.text,
          createdAt: data.createdAt?.toDate?.()
            ? data.createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "",
        }
      })

      const fetched: Review[] = snapshot.docs
        .map((d) => {
          const data = d.data()
          return {
            id: d.id,
            authorName: data.authorName || data.name || "Anonymous",
            authorEmail: data.authorEmail || "",
            authorPhoto: data.authorPhoto || "",
            authorUid: data.authorUid || "",
            date: data.date || "",
            rating: data.rating || 5,
            product: data.product || "",
            text: data.text || "",
            archived: data.archived || false,
            replies: allReplies.filter((r) => r.reviewId === d.id),
          }
        })
        .filter((r) => !r.archived) // Hide archived reviews from public

      setReviews(fetched)
    } catch (err: unknown) {
      const fireErr = err as { code?: string; message?: string }
      console.error("[v0] Failed to fetch reviews:", fireErr.code, fireErr.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("Please sign in to leave a review.")
      return
    }
    if (!rating || !text.trim()) {
      setError("Please provide a rating and review text.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const dateStr = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })

      await addDoc(collection(db, "reviews"), {
        authorName: user.displayName || user.email?.split("@")[0] || "User",
        authorEmail: user.email || "",
        authorPhoto: user.photoURL || "",
        authorUid: user.uid,
        date: dateStr,
        rating,
        product: product || "General",
        text: text.trim(),
        archived: false,
        createdAt: Timestamp.now(),
      })

      setProduct("")
      setRating(0)
      setText("")
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 4000)
      await fetchReviews()
    } catch (err: unknown) {
      const fireErr = err as { code?: string; message?: string }
      console.error("[v0] Review submit error:", fireErr.code, fireErr.message)
      if (fireErr.code === "permission-denied" || fireErr.message?.includes("permission")) {
        setError("Firestore permission denied. Make sure your Firestore rules allow writes to the 'reviews' collection: match /reviews/{id} { allow read, write: if true; }")
      } else {
        setError(`Failed to submit review: ${fireErr.message || "Please try again."}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border/40 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-24">
          <p className="mb-4 font-sans text-xs uppercase tracking-[0.3em] text-muted-foreground">
            What Our Customers Say
          </p>
          <h1 className="text-balance font-serif text-4xl tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Customer Reviews
          </h1>
          {reviews.length > 0 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <StarRating rating={Math.round(Number(averageRating))} size="md" />
              <p className="font-sans text-sm text-muted-foreground">
                {averageRating} out of 5 based on {reviews.length} review
                {reviews.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
          {/* Write a Review Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <h2 className="mb-2 font-serif text-2xl tracking-tight text-foreground">
                Leave a Review
              </h2>
              <p className="mb-8 font-sans text-sm leading-relaxed text-muted-foreground">
                {user
                  ? "Share your experience with AC Beauty Engine 876"
                  : "Sign in to leave a review"}
              </p>

              {submitted && (
                <div className="mb-6 border border-green-200 bg-green-50 px-4 py-3 font-sans text-sm text-green-800">
                  Thank you for your review!
                </div>
              )}

              {error && (
                <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-800">
                  {error}
                </div>
              )}

              {user ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* User info display */}
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
                        {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.displayName || user.email?.split("@")[0]}</p>
                      <p className="text-xs text-muted-foreground">Posting as this account</p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      Product Purchased
                    </label>
                    <input
                      type="text"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      className="w-full border border-border bg-background px-4 py-3 font-sans text-sm text-foreground outline-none transition-colors focus:border-primary"
                      style={{ fontSize: "16px" }}
                      placeholder="Which product did you buy?"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      Rating *
                    </label>
                    <StarRating rating={rating} interactive onRate={setRating} />
                  </div>

                  <div>
                    <label className="mb-2 block font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      Your Review *
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      required
                      rows={4}
                      className="w-full resize-none border border-border bg-background px-4 py-3 font-sans text-sm text-foreground outline-none transition-colors focus:border-primary"
                      style={{ fontSize: "16px" }}
                      placeholder="Tell us about your experience..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 border border-foreground bg-foreground px-6 py-3.5 font-sans text-sm uppercase tracking-widest text-background transition-all hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </button>
                </form>
              ) : (
                <a
                  href="/signin?redirect=/reviews"
                  className="inline-block w-full border border-foreground bg-foreground px-6 py-3.5 text-center font-sans text-sm uppercase tracking-widest text-background transition-all hover:bg-transparent hover:text-foreground"
                >
                  Sign In to Review
                </a>
              )}
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-20 text-center">
                <p className="font-sans text-lg text-muted-foreground">
                  No reviews yet. Be the first to share your experience!
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-border/40 pb-8 last:border-0">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {review.authorPhoto ? (
                          <img src={review.authorPhoto} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {review.authorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-sans text-sm font-medium text-foreground">
                            {review.authorName}
                          </p>
                          <p className="font-sans text-xs text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.product && (
                      <p className="mb-2 inline-block border border-border/60 px-2.5 py-1 font-sans text-xs uppercase tracking-wider text-muted-foreground">
                        {review.product}
                      </p>
                    )}
                    <p className="mt-2 font-sans text-sm leading-relaxed text-foreground/80">
                      {review.text}
                    </p>

                    <ReviewReplySection review={review} onReplyAdded={fetchReviews} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
