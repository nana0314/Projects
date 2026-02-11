'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { updateUserProfile, uploadProfilePicture } from '@/src/utils/users';
import { signOut } from '@/src/utils/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '@/src/config/firebase';

export default function Profile() {
  const { user, userData, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
    if (userData) {
      setDisplayName(userData.displayName);
    }
  }, [user, userData, loading, router]);

  const handleNameUpdate = async () => {
    if (!user || !userData) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateUserProfile(user.uid, { displayName });
      await refreshUser();
      setSuccess('Display name updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;

    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const photoURL = await uploadProfilePicture(user.uid, file);
      await updateUserProfile(user.uid, { photoURL });
      await refreshUser();
      setSuccess('Profile picture updated successfully!');
    } catch (err: any) {
      console.error('Profile picture upload error:', err);
      setError(err.message || 'Failed to upload picture. Please check your browser console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE' || !user) return;

    setDeleting(true);
    setError('');

    try {
      const functions = getFunctions(app);
      const deleteAccountFn = httpsCallable(functions, 'deleteAccount');
      await deleteAccountFn();

      try {
        await signOut();
      } catch {
        // Auth record already deleted server-side, sign-out may fail
      }
      router.push('/');
    } catch (err: any) {
      console.error('Account deletion error:', err);
      setError(err.message || 'Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  if (loading || !user || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const isNameChanged = displayName !== userData.displayName;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {/* Profile Picture */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                disabled={saving}
              >
                {(userData?.photoURL || user?.photoURL) ? (
                  <img
                    src={userData?.photoURL || user?.photoURL || ''}
                    alt={displayName}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl text-gray-400">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 border-2 border-white shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
          </div>

          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your display name"
                />
                <button
                  type="button"
                  onClick={handleNameUpdate}
                  disabled={!isNameChanged || saving || !displayName.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${isNameChanged && displayName.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {saving ? 'Saving...' : 'Apply'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Click Apply to save your new display name.</p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" value={user.email || ''} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
            </div>

            {/* Unique ID (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unique ID</label>
              <div className="flex items-center gap-2">
                <input type="text" value={userData.uniqueId} disabled className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-mono cursor-not-allowed" />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(userData.uniqueId);
                    setSuccess('Unique ID copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 active:scale-95 transition-transform"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Share this ID with friends to add you</p>
            </div>
          </div>

          {/* Sign Out */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={async () => {
                try {
                  await signOut();
                  router.push('/');
                } catch (error) {
                  console.error('Error signing out:', error);
                }
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all active:scale-95"
            >
              Sign Out
            </button>
          </div>

          {/* Danger Zone - Delete Account */}
          <div className="mt-8 pt-8 border-t-2 border-red-200">
            <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">Danger Zone</h3>
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <p className="text-sm text-gray-700 mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-600 hover:text-white transition-all active:scale-95 font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Your Account?</h2>
            <p className="text-sm text-gray-600 mb-4">This will permanently delete:</p>
            <ul className="text-sm text-gray-600 mb-4 space-y-1 list-disc list-inside">
              <li>Your profile and personal data</li>
              <li>All expenses you created</li>
              <li>Your friend connections</li>
              <li>Your group memberships</li>
              <li>Your profile pictures</li>
            </ul>
            <p className="text-sm font-medium text-gray-800 mb-2">
              Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-red-600">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4 font-mono"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${deleteConfirmText === 'DELETE' && !deleting
                    ? 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  'Delete Forever'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}