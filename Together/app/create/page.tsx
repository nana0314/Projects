'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { createPost } from '@/src/services/PostService';
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
  const [error, setError] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

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

      await createPost({
        authorId: user.uid,
        authorName: user.displayName ?? 'Anonymous',
        authorPhoto: user.photoURL ?? '',
        header: resolvedHeader,
        title: title.trim(),
        body: body.trim(),
        hashtags: rawTags,
        visibility,
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
