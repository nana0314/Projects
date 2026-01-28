'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { updateUserProfile, uploadProfilePicture } from '@/src/utils/users';
import { signOut } from '@/src/utils/auth';

export default function Profile() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
    if (userData) {
      setDisplayName(userData.displayName);
    }
  }, [user, userData, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateUserProfile(user.uid, { displayName });
      setSuccess('Profile updated successfully!');
      setTimeout(() => router.push('/friends'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      console.log('Uploading profile picture...', file.name, file.size, file.type);
      const photoURL = await uploadProfilePicture(user.uid, file);
      console.log('Upload successful, photoURL:', photoURL);
      
      await updateUserProfile(user.uid, { photoURL });
      console.log('Profile updated in Firestore');
      
      setSuccess('Profile picture updated successfully!');
      
      // Reload the page after a short delay to ensure Firebase Auth and Firestore are in sync
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error('Profile picture upload error:', err);
      setError(err.message || 'Failed to upload picture. Please check your browser console for details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

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

          {/* Profile Picture - Centered at top */}
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
                {/* Camera icon overlay */}
                <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 border-2 border-white shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Unique ID (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unique ID</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={userData.uniqueId}
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-mono cursor-not-allowed"
                />
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

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed active:scale-95 transition-transform"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Sign Out Button */}
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
        </div>
      </main>
    </div>
  );
}