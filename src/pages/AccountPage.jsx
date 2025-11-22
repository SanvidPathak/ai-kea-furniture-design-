import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import {
  updateDisplayName,
  updatePassword,
  deleteUserAccount,
  getUserProfile,
  signOut
} from '../services/authService.js';
import { getUserDesigns } from '../services/designService.js';
import { getUserOrders } from '../services/orderService.js';
import { Button } from '../components/common/Button.jsx';
import { SkeletonProfile } from '../components/common/SkeletonCard.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { Logo } from '../components/common/Logo.jsx';

export function AccountPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState({ designs: 0, orders: 0 });
  const [errorMessage, setErrorMessage] = useState('');

  // Name update
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [updatingName, setUpdatingName] = useState(false);

  // Password update
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Account deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load user profile
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      setNewName(profile.name || user.displayName || '');

      // Load statistics
      const [designs, orders] = await Promise.all([
        getUserDesigns(user.uid),
        getUserOrders(user.uid),
      ]);

      setStats({
        designs: designs.length,
        orders: orders.length,
      });
    } catch (error) {
      console.error('Load user data error:', error);
      setErrorMessage('Failed to load account data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    setUpdatingName(true);
    try {
      await updateDisplayName(newName.trim());
      setUserProfile({ ...userProfile, name: newName.trim() });
      setEditingName(false);
      showToast('Name updated successfully!', 'success');
    } catch (error) {
      console.error('Update name error:', error);
      showToast('Failed to update name. Please try again.', 'error');
    } finally {
      setUpdatingName(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setUpdatingPassword(true);
    try {
      await updatePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      showToast('Password updated successfully!', 'success');
    } catch (error) {
      console.error('Update password error:', error);
      showToast(error.message || 'Failed to update password', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast('Please enter your password to confirm', 'error');
      return;
    }

    setDeleting(true);
    try {
      await deleteUserAccount(deletePassword);
      showToast('Account deleted successfully', 'success');
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      showToast(error.message || 'Failed to delete account', 'error');
      setDeleting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'N/A';
    }
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysSinceCreation = () => {
    if (!userProfile?.createdAt) return 0;
    let created;
    if (userProfile.createdAt.toDate) {
      created = userProfile.createdAt.toDate();
    } else if (userProfile.createdAt instanceof Date) {
      created = userProfile.createdAt;
    } else {
      created = new Date(userProfile.createdAt);
    }
    const now = new Date();
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-earth-beige">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="section-container py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/create">
              <Button>Create Design</Button>
            </Link>
            {user && (
              <>
                <Link to="/account" className="hidden sm:flex items-center gap-2 text-sm text-neutral-600 hover:text-ikea-blue transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{user.displayName}</span>
                </Link>
                <Button variant="secondary" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="section-container py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
              Account Settings
            </h1>
            <p className="text-neutral-600">
              Manage your profile and account preferences
            </p>
          </div>


          <ErrorMessage message={errorMessage} onClose={() => setErrorMessage('')} />

          {loading ? (
            <SkeletonProfile />
          ) : (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="card">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Edgy Avatar */}
                  <div className="w-24 h-24 bg-gradient-to-br from-ikea-blue to-ikea-electric rounded-lg flex items-center justify-center shadow-lg transform rotate-45">
                    <div className="transform -rotate-45">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                      </svg>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-center sm:text-left">
                    {editingName ? (
                      <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ikea-blue"
                          placeholder="Your name"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleUpdateName}
                            loading={updatingName}
                            className="px-4 py-2"
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingName(false);
                              setNewName(userProfile?.name || user.displayName || '');
                            }}
                            disabled={updatingName}
                            className="px-4 py-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                        <h2 className="text-2xl font-bold text-neutral-900">
                          {userProfile?.name || user.displayName || 'User'}
                        </h2>
                        <button
                          onClick={() => setEditingName(true)}
                          className="text-ikea-blue hover:text-ikea-electric text-sm font-medium"
                        >
                          Edit Name
                        </button>
                      </div>
                    )}
                    <p className="text-neutral-600 mt-1">{user.email}</p>
                    <p className="text-sm text-neutral-500 mt-2">
                      Member since {formatDate(userProfile?.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="card text-center">
                  <div className="text-3xl font-bold text-ikea-blue mb-1">
                    {stats.designs}
                  </div>
                  <div className="text-sm text-neutral-600">Designs Created</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-ikea-blue mb-1">
                    {stats.orders}
                  </div>
                  <div className="text-sm text-neutral-600">Orders Placed</div>
                </div>
                <div className="card text-center col-span-2 sm:col-span-1">
                  <div className="text-3xl font-bold text-ikea-blue mb-1">
                    {getDaysSinceCreation()}
                  </div>
                  <div className="text-sm text-neutral-600">Days Active</div>
                </div>
              </div>

              {/* Password Section */}
              <div className="card">
                <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                  Security
                </h3>

                {!showPasswordForm ? (
                  <Button
                    variant="secondary"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Change Password
                  </Button>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ikea-blue ${
                          passwordErrors.currentPassword ? 'border-red-500' : 'border-neutral-300'
                        }`}
                      />
                      {passwordErrors.currentPassword && (
                        <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ikea-blue ${
                          passwordErrors.newPassword ? 'border-red-500' : 'border-neutral-300'
                        }`}
                      />
                      {passwordErrors.newPassword && (
                        <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ikea-blue ${
                          passwordErrors.confirmPassword ? 'border-red-500' : 'border-neutral-300'
                        }`}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" loading={updatingPassword}>
                        Update Password
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setPasswordErrors({});
                        }}
                        disabled={updatingPassword}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* Danger Zone */}
              <div className="card border-2 border-red-200 bg-red-50/30">
                <h3 className="text-xl font-semibold text-red-700 mb-2">
                  Danger Zone
                </h3>
                <p className="text-sm text-neutral-700 mb-4">
                  Once you delete your account, there is no going back. This will permanently delete all your designs, orders, and data.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 text-white hover:bg-red-700 border-red-600"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full my-4 sm:my-8">
            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-red-700 mb-4">
                Delete Account
              </h2>
              <p className="text-neutral-700 mb-4">
                Are you absolutely sure? This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </p>
              <div className="mb-4">
                <label htmlFor="deletePassword" className="block text-sm font-medium text-neutral-700 mb-1">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  id="deletePassword"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Your password"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleDeleteAccount}
                  loading={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Yes, Delete My Account
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                  disabled={deleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-16">
        <div className="section-container py-6 text-center text-sm text-neutral-600">
          <p>AI-KEA © 2025 - Account Settings</p>
        </div>
      </footer>
    </div>
  );
}
