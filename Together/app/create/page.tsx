'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { createPost } from '@/src/services/PostService';
import { uploadImage } from '@/src/services/StorageService';
import SignInPrompt from '@/src/components/SignInPrompt';

const HEADERS = ['Ride Share', 'Bundle Split', 'Lost & Found', 'Study Group', 'General', 'Other'];

function insertMarkdown(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  setter: (v: string) => void,
  value: string
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end) || 'text';
  const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
  setter(newValue);
  setTimeout(() => {
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length + selected.length;
    textarea.focus();
  }, 0);
}

export default function CreatePostPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [header, setHeader] = useState('');
  const [customHeader, setCustomHeader] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  if (!user) return <SignInPrompt message="Sign in to create a post" />;

  const resolvedHeader = header === 'Other' ? customHeader : header;

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setError('');
    setSubmitting(true);
    try {
      const rawTags = hashtags
        .split(/[\s,#]+/)
        .map(t => t.toLowerCase().trim())
        .filter(Boolean);

      let imageURL: string | undefined;
      if (imageFile) {
        imageURL = await uploadImage(
          `posts/${user.uid}/${Date.now()}_${imageFile.name}`,
          imageFile,
          setUploadProgress
        );
        setUploadProgress(null);
      }

      await createPost({
        authorId: user.uid,
        authorName: user.displayName ?? 'Anonymous',
        authorPhoto: user.photoURL ?? '',
        header: resolvedHeader,
        title: title.trim(),
        body: body.trim(),
        hashtags: rawTags,
        visibility,
        imageURL,
      });
      router.push('/');
    } catch (e) {
      setError('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ff]" data-testid="create-post-page">
      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900">New Post</h1>
        <button
          onClick={handleSubmit}
          disabled={submitting || !title.trim()}
          data-testid="submit-post"
          className="px-4 py-1.5 bg-brand-500 text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-all"
        >
          {submitting ? 'Posting…' : 'Post'}
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        {/* Header topic */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Topic</label>
          <div className="flex flex-wrap gap-2">
            {HEADERS.map(h => (
              <button
                key={h}
                onClick={() => setHeader(h)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  header === h
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
          {header === 'Other' && (
            <input
              type="text"
              value={customHeader}
              onChange={e => setCustomHeader(e.target.value)}
              placeholder="Custom topic…"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          )}
        </div>

        {/* Title */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Anyone heading to Cambridge station?"
            maxLength={120}
            data-testid="post-title"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        {/* Body with markdown toolbar */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</label>
          {/* Markdown toolbar */}
          <div className="flex gap-2 border-b border-gray-100 pb-2">
            {[
              { label: 'B', before: '**', after: '**', title: 'Bold' },
              { label: 'I', before: '*', after: '*', title: 'Italic' },
            ].map(btn => (
              <button
                key={btn.label}
                title={btn.title}
                onMouseDown={e => {
                  e.preventDefault();
                  if (bodyRef.current) insertMarkdown(bodyRef.current, btn.before, btn.after, setBody, body);
                }}
                className={`w-8 h-8 text-xs font-bold text-gray-600 rounded-lg hover:bg-gray-100 transition-colors ${
                  btn.label === 'B' ? 'font-extrabold' : 'italic'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <textarea
            ref={bodyRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Add details… Bold **departure** and *destination* for clarity"
            rows={5}
            data-testid="post-body"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
          />
        </div>

        {/* Image upload */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Photo (optional)</label>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            className="hidden"
          />
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={imagePreview} alt="preview" className="w-full max-h-64 object-cover" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {uploadProgress !== null && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                  <div className="h-full bg-brand-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-brand-300 hover:text-brand-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="text-xs font-medium">Add a photo</span>
            </button>
          )}
        </div>

        {/* Hashtags */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hashtags</label>
          <input
            type="text"
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
            placeholder="#cambridge #rideshare 剑桥"
            data-testid="post-hashtags"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <p className="text-[11px] text-gray-400">Separate by spaces or commas. Supports English & Chinese.</p>
        </div>

        {/* Visibility */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Public post</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {visibility === 'public' ? 'Anyone can see this' : 'Only you can see this'}
            </p>
          </div>
          <button
            data-testid="visibility-toggle"
            onClick={() => setVisibility(v => v === 'public' ? 'private' : 'public')}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              visibility === 'public' ? 'bg-brand-500' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              visibility === 'public' ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </main>
    </div>
  );
}
