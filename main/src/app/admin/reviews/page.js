'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchReviews();
  }, [selectedStatus]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reviews?status=${selectedStatus}`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        setMessage('Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setMessage('Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (reviewId, action, adminNotes = '') => {
    try {
      const response = await fetch('/api/admin/reviews/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          action,
          adminNotes
        }),
      });

      if (response.ok) {
        setMessage(`Review ${action}ed successfully`);
        fetchReviews(); // Refresh the list
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || `Failed to ${action} review`);
      }
    } catch (error) {
      console.error('Error updating review:', error);
      setMessage(`Error ${action}ing review`);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Review Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage customer reviews and testimonials
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex space-x-4">
            {['pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} Reviews
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-200">
            {message}
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No {selectedStatus} reviews found
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {selectedStatus === 'pending' 
                  ? 'There are no pending reviews to review.' 
                  : `There are no ${selectedStatus} reviews.`}
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {review.years_of_experience ? `${review.years_of_experience} experience` : 'Experience not specified'}
                      </h3>
                      {getStatusBadge(review.status)}
                    </div>
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        by {review.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {review.email}
                      </span>
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">
                          ({review.rating}/5)
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Submitted: {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {review.review}
                  </p>
                </div>

                {review.admin_notes && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Admin Notes:</strong> {review.admin_notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {review.status === 'pending' && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleReviewAction(review.id, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Enter rejection reason (optional):');
                        handleReviewAction(review.id, 'reject', notes || '');
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}

                {(review.status === 'approved' || review.status === 'rejected') && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleReviewAction(review.id, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Enter rejection reason (optional):');
                        handleReviewAction(review.id, 'reject', notes || '');
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      ✗ Reject
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this review?')) {
                          handleReviewAction(review.id, 'delete');
                        }
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;