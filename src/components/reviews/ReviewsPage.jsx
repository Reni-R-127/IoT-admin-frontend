import { useCallback, useEffect, useState } from "react";
import {
  Star,
  RefreshCw,
  Trash2,
  CheckCircle,
  Clock,
  Search,
  MessageSquare,
  Plus,
  X,
  Save,
  UserRound,
} from "lucide-react";

import { adminRequest } from "../../services/adminApi";
import "./ReviewsPage.css";

const initialForm = {
  name: "",
  role: "Student",
  rating: "5",
  message: "",
  approved: false,
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminRequest("/reviews");

      const data = Array.isArray(response)
        ? response
        : response?.reviews ??
          response?.data ??
          response?.items ??
          [];

      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  function updateForm(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function openForm() {
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setForm(initialForm);
  }

  async function createReview(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const role = form.role.trim();
    const message = form.message.trim();
    const rating = Number(form.rating);

    if (!name || !role || !message) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError("Rating must be between 1 and 5.");
      return;
    }

    setSaving(true);

    try {
      await adminRequest("/reviews", {
        method: "POST",
        body: JSON.stringify({
          name,
          role,
          rating,
          message,
          approved: form.approved,
        }),
      });

      setForm(initialForm);
      setShowForm(false);
      setSuccess("Review created successfully.");

      await loadReviews();
    } catch (err) {
      setError(err.message || "Unable to create review.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleApproval(review) {
    const reviewId = review._id || review.id;

    if (!reviewId) {
      setError("Review ID is missing.");
      return;
    }

    setUpdatingId(reviewId);
    setError("");
    setSuccess("");

    try {
      await adminRequest(`/reviews/${reviewId}`, {
        method: "PATCH",
        body: JSON.stringify({
          approved: !review.approved,
        }),
      });

      setReviews((current) =>
        current.map((item) =>
          (item._id || item.id) === reviewId
            ? { ...item, approved: !review.approved }
            : item
        )
      );

      setSuccess(
        review.approved
          ? "Review moved to pending."
          : "Review approved successfully."
      );
    } catch (err) {
      setError(err.message || "Unable to update review status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteReview(review) {
    const reviewId = review._id || review.id;

    if (!reviewId) {
      setError("Review ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Delete the review from ${review.name || "this user"}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setUpdatingId(reviewId);
    setError("");
    setSuccess("");

    try {
      await adminRequest(`/reviews/${reviewId}`, {
        method: "DELETE",
      });

      setReviews((current) =>
        current.filter(
          (item) => (item._id || item.id) !== reviewId
        )
      );

      setSuccess("Review deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete review.");
    } finally {
      setUpdatingId(null);
    }
  }

  const approvedCount = reviews.filter(
    (review) => review.approved
  ).length;

  const pendingCount = reviews.length - approvedCount;

  const filteredReviews = reviews.filter((review) => {
    const searchText = [
      review.name,
      review.role,
      review.message,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchText.includes(
      search.toLowerCase()
    );

    const matchesFilter =
      filter === "all" ||
      (filter === "approved" && review.approved) ||
      (filter === "pending" && !review.approved);

    return matchesSearch && matchesFilter;
  });

  return (
    <section className="page reviews-page">
      {/* HEADER */}
      <div className="reviews-header">
        <div>
          <span className="reviews-eyebrow">
            REPUTATION / REVIEWS
          </span>

          <h1>Student Reviews</h1>

          <p>
            Create and manage student reviews displayed on the
            ProJenius website.
          </p>
        </div>

        <div className="reviews-header-actions">
          <button
            type="button"
            className="reviews-refresh"
            onClick={loadReviews}
            disabled={loading || saving}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            className="reviews-add-button"
            onClick={openForm}
          >
            <Plus size={17} />
            Add Review
          </button>
        </div>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="reviews-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="reviews-success" role="status">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* ADD REVIEW FORM */}
      {showForm && (
        <div className="reviews-form-panel">
          <div className="reviews-form-header">
            <div className="reviews-form-title">
              <div className="reviews-form-icon">
                <MessageSquare size={19} />
              </div>

              <div>
                <h2>Add Student Review</h2>
                <p>
                  Enter the student's details and review below.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="reviews-close-button"
              onClick={closeForm}
              disabled={saving}
              aria-label="Close review form"
            >
              <X size={19} />
            </button>
          </div>

          <form
            className="reviews-form"
            onSubmit={createReview}
          >
            <div className="reviews-form-grid">
              <div className="reviews-field">
                <label htmlFor="review-name">
                  Student Name <span>*</span>
                </label>

                <input
                  id="review-name"
                  name="name"
                  type="text"
                  placeholder="Enter student name"
                  value={form.name}
                  onChange={updateForm}
                  maxLength={100}
                  required
                />
              </div>

              <div className="reviews-field">
                <label htmlFor="review-role">
                  Role / Course <span>*</span>
                </label>

                <input
                  id="review-role"
                  name="role"
                  type="text"
                  placeholder="e.g. IoT Student"
                  value={form.role}
                  onChange={updateForm}
                  maxLength={100}
                  required
                />
              </div>

              <div className="reviews-field">
                <label htmlFor="review-rating">
                  Rating <span>*</span>
                </label>

                <select
                  id="review-rating"
                  name="rating"
                  value={form.rating}
                  onChange={updateForm}
                  required
                >
                  <option value="5">★★★★★ — 5 Stars</option>
                  <option value="4">★★★★☆ — 4 Stars</option>
                  <option value="3">★★★☆☆ — 3 Stars</option>
                  <option value="2">★★☆☆☆ — 2 Stars</option>
                  <option value="1">★☆☆☆☆ — 1 Star</option>
                </select>
              </div>

              <div className="reviews-field">
                <label>Publication Status</label>

                <label className="reviews-checkbox-field">
                  <input
                    type="checkbox"
                    name="approved"
                    checked={form.approved}
                    onChange={updateForm}
                  />

                  <span>
                    Publish this review after saving
                  </span>
                </label>
              </div>

              <div className="reviews-field reviews-field-full">
                <label htmlFor="review-message">
                  Review Message <span>*</span>
                </label>

                <textarea
                  id="review-message"
                  name="message"
                  placeholder="Enter the student's review..."
                  value={form.message}
                  onChange={updateForm}
                  rows={5}
                  maxLength={2000}
                  required
                />

                <span className="reviews-character-count">
                  {form.message.length}/2000 characters
                </span>
              </div>
            </div>

            <div className="reviews-form-footer">
              <p>
                <span>*</span> Required fields
              </p>

              <div className="reviews-form-buttons">
                <button
                  type="button"
                  className="reviews-cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="reviews-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="reviews-loading-icon"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Save Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SUMMARY */}
      <div className="reviews-summary">
        <div className="reviews-summary-card">
          <div className="reviews-summary-icon total-icon">
            <MessageSquare size={20} />
          </div>

          <div>
            <span>Total Reviews</span>
            <strong>{loading ? "…" : reviews.length}</strong>
          </div>
        </div>

        <div className="reviews-summary-card">
          <div className="reviews-summary-icon approved-icon">
            <CheckCircle size={20} />
          </div>

          <div>
            <span>Approved</span>
            <strong>{loading ? "…" : approvedCount}</strong>
          </div>
        </div>

        <div className="reviews-summary-card">
          <div className="reviews-summary-icon pending-icon">
            <Clock size={20} />
          </div>

          <div>
            <span>Pending Approval</span>
            <strong>{loading ? "…" : pendingCount}</strong>
          </div>
        </div>
      </div>

      {/* REVIEW LIST */}
      <div className="reviews-panel">
        <div className="reviews-panel-header">
          <div>
            <h2>All Reviews</h2>
            <p>
              Manage reviews, ratings and publication status.
            </p>
          </div>

          <span className="reviews-total-badge">
            {filteredReviews.length} records
          </span>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="reviews-toolbar">
          <div className="reviews-search">
            <Search size={17} />

            <input
              type="search"
              placeholder="Search by name, role or review..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="reviews-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter reviews"
          >
            <option value="all">All Reviews</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="reviews-state">
            <RefreshCw
              size={22}
              className="reviews-loading-icon"
            />
            <p>Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="reviews-state">
            <UserRound size={30} />

            <h3>No reviews found</h3>

            <p>
              {reviews.length === 0
                ? "Click Add Review to create your first student review."
                : "Try changing your search or filter."}
            </p>
          </div>
        ) : (
          <div className="reviews-table-wrapper">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Review</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredReviews.map((review) => {
                  const reviewId = review._id || review.id;
                  const isUpdating = updatingId === reviewId;

                  return (
                    <tr key={reviewId}>
                      <td>
                        <div className="review-student">
                          <div className="review-avatar">
                            {(review.name || "U")
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {review.name || "Unknown"}
                            </strong>

                            <span>
                              {review.role || "Student"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <p className="review-message">
                          {review.message || "No review message"}
                        </p>
                      </td>

                      <td>
                        <div className="review-rating">
                          <Star size={15} fill="currentColor" />
                          <strong>{review.rating ?? "—"}</strong>
                          <span>/ 5</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`review-status ${
                            review.approved
                              ? "status-approved"
                              : "status-pending"
                          }`}
                        >
                          {review.approved
                            ? "Approved"
                            : "Pending"}
                        </span>
                      </td>

                      <td>
                        <div className="review-actions">
                          <button
                            type="button"
                            className={`review-approval-button ${
                              review.approved
                                ? "revoke-approval"
                                : "approve-review"
                            }`}
                            onClick={() => toggleApproval(review)}
                            disabled={isUpdating}
                          >
                            {review.approved
                              ? "Unapprove"
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            className="review-delete-button"
                            onClick={() => deleteReview(review)}
                            disabled={isUpdating}
                            aria-label={`Delete review from ${review.name || "user"}`}
                            title="Delete review"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}