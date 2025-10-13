'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useTimezone } from '@/app/context/TimezoneContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileManager from '@/app/components/ProfileManager';
import DashboardSidebar from '@/app/components/DashboardSidebar';
import ReviewForm from '@/app/components/ReviewForm';
import { Calendar, CreditCard, Settings, LogOut, User, Clock, CheckCircle, AlertCircle, Star, X } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading, signOut, getProfile } = useAuth();
  const { userTimezone, formatTimeInTimezone, formatDateInTimezone } = useTimezone();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [profile, setProfile] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadRecentBookings();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data, error } = await getProfile();
    if (!error && data) {
      setProfile(data);
    }
  };

  const loadRecentBookings = async () => {
    setLoadingBookings(true);
    try {
      if (!user) {
        console.log('No user found, skipping bookings load');
        setRecentBookings([]);
        return;
      }

      console.log('Loading bookings for user:', { id: user.id, email: user.email });
      
      // Fetch user's bookings with both UUID and email for maximum compatibility
      const params = new URLSearchParams({
        user_id: user.id,
        email: user.email
      });

      const response = await fetch(`/api/user-bookings?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const data = await response.json();
      console.log('Loaded bookings:', data);
      
      setRecentBookings(data.bookings || []);
      
    } catch (error) {
      console.error('Error loading bookings:', error);
      setRecentBookings([]);
    }
    setLoadingBookings(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        // Still redirect even if there's an error
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
    } finally {
      setSigningOut(false);
      // Always redirect after signout attempt
      router.push('/');
    }
  };

  const formatDate = (dateString) => {
    return formatDateInTimezone(dateString, userTimezone, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return formatTimeInTimezone(`2000-01-01T${timeString}`, userTimezone, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'completed':
        return <CheckCircle size={16} className="text-blue-500" />;
      default:
        return <AlertCircle size={16} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-lg text-gray-600 dark:text-gray-300">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        user={user}
        onSignOut={handleSignOut}
        signingOut={signingOut}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex-1 min-w-0 ml-12 lg:ml-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  Welcome back, {profile?.first_name || user.email}!
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage your account and bookings
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Theme switcher removed per request */}
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Row - Account Summary and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Account Summary */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Summary</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {recentBookings.filter(b => b.status === 'confirmed').length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Upcoming Sessions</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {recentBookings.filter(b => b.status === 'completed').length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Completed Sessions</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <a
                      href="/"
                      className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Calendar className="mr-3 text-blue-600 dark:text-blue-400" size={20} />
                      <span className="text-gray-900 dark:text-white">Book New Session</span>
                    </a>
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="w-full flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Star className="mr-3 text-yellow-500" size={20} />
                      <span className="text-gray-900 dark:text-white">Add Review</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="w-full flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Settings className="mr-3 text-gray-600 dark:text-gray-400" size={20} />
                      <span className="text-gray-900 dark:text-white">Update Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Bookings</h3>
              {loadingBookings ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="rounded-full bg-gray-200 dark:bg-gray-600 h-10 w-10"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentBookings.length > 0 ? (
                <div className="space-y-3">
                  {recentBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900">
                          <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {booking.duration_minutes || 60} minutes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(booking.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No bookings yet. <a href="/" className="text-blue-600 hover:underline">Book your first session</a>
                </p>
              )}
              
              {recentBookings.length > 3 && (
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="w-full mt-4 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  View All Bookings
                </button>
              )}
            </div>

            {/* Detailed Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {recentBookings.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Total Sessions</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {recentBookings.filter(b => b.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Success rate</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {recentBookings.reduce((total, booking) => total + (booking.duration_minutes || 60), 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Minutes</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total time</div>
                </div>
              </div>
            </div>

            {/* Helpful Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tips for Success</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 dark:text-yellow-400 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Prepare for your session</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Come with specific questions or topics you'd like to discuss to make the most of your time.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Be punctual</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Join your session a few minutes early to ensure everything is working properly.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Follow up on action items</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Review and implement the recommendations from your previous sessions.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Resources */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="/download"
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Download PDFs</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Access your purchased materials</p>
                  </div>
                </a>
                <a
                  href="/"
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Calendar size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Browse Products</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Explore our services</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Bookings</h2>
            </div>
            <div className="p-6">
              {loadingBookings ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
                        </div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            Duration: {booking.duration_minutes || 60} minutes
                          </p>
                          {booking.notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Notes: {booking.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(booking.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No bookings yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Ready to get started? Book your first coaching session.
                  </p>
                  <a
                    href="/"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Calendar className="mr-2" size={16} />
                    Book Session
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && <ProfileManager />}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Share Your Experience
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <ReviewForm 
                onSuccess={() => setShowReviewModal(false)} 
                defaultEmail={user?.email || ''}
                hideEmailInput={!!user?.email}
                hideYears={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
