'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/src/context/AuthContext';
import { useComments } from '@/src/hooks/useComments';
import { getPostById, deletePost } from '@/src/services/PostService';
import { Post, Comment } from '@/src/types';
import Avatar from '@/src/components/Avatar';

function timeAgo(ts: { seconds: number } | null | undefined): string {
  if (!ts) return '';
  const diff = Date.now() / 1000 - ts.seconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentBubble({
  comment,
  currentUserId,
  onDelete,
  onReply,
  depth = 0,
  replies,
}: {
  comment: Comment;
  currentUserId: string | null;
  onDelete: (id: string) => void;
  onReply: (id: string, name: string) => void;
  depth?: number;
  replies: Comment[];
}) {
  return (
    <div className={depth > 0 ? 'ml-8 mt-2' : ''}>
      <div className="flex gap-2.5" data-testid="comment">
        <Link href={`/user/${comment.authorId}/`}>
          <Avatar src={comment.authorPhoto} name={comment.authorName} size={32} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/user/${comment.authorId}/`} className="text-xs font-semibold text-gray-800 hover:text-brand-600">
                {comment.authorName}
              </Link>
              <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{comment.body}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 px-1">
            <button
              onClick={() => onReply(comment.id, comment.authorName)}
              className="text-[11px] text-gray-400 hover:text-brand-500 font-medium"
            >
              Reply
            </button>
            {currentUserId === comment.authorId && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-[11px] text-red-400 hover:text-red-600 font-medium"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
      {replies.map(r => (
        <CommentBubble
          key={r.id}
          comment={r}
          currentUserId={currentUserId}
          onDelete={onDelete}
          onReply={onReply}
          depth={depth + 1}
          replies={[]}
        />
      ))}
    </div>
  );
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { comments, loading: commentsLoading, add, remove } = useComments(id);

  useEffect(() => {
    getPostById(id).then(p => { setPost(p); setPostLoading(false); });
  }, [id]);

  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  const handleSubmitComment = async () => {
    if (!user || !commentText.trim()) return;
    setSubmitting(true);
    await add({
      authorId: user.uid,
      authorName: user.displayName ?? 'User',
      authorPhoto: user.photoURL ?? '',
      body: commentText.trim(),
      parentId: replyTo?.id ?? null,
    });
    setCommentText('');
    setReplyTo(null);
    setSubmitting(false);
  };

  const handleDeletePost = async () => {
    if (!post) return;
    await deletePost(post.id);
    router.push('/');
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-[#f5f3ff]">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full skeleton-shimmer" />
          <div className="h-4 w-32 rounded skeleton-shimmer" />
        </div>
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 animate-pulse">
            <div className="h-4 w-20 rounded-full skeleton-shimmer" />
            <div className="h-6 w-3/4 rounded skeleton-shimmer" />
            <div className="h-3 w-full rounded skeleton-shimmer" />
            <div className="h-3 w-4/5 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Post not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ff]" data-testid="post-detail-page">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-gray-500 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900 truncate max-w-[200px]">{post.title}</h1>
        {user?.uid === post.authorId && (
          <button onClick={() => setShowDelete(s => !s)} className="text-gray-400 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </button>
        )}
      </header>

      {/* Delete confirmation */}
      {showDelete && (
        <div className="max-w-lg mx-auto px-4 pt-3">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
            <p className="text-sm text-red-700 font-medium">Delete this post?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-xl">Cancel</button>
              <button onClick={handleDeletePost} className="px-3 py-1.5 text-xs text-white bg-red-500 rounded-xl font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 pt-4 pb-32 space-y-3">
        {/* Post body */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            {post.header && (
              <span className="inline-block bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {post.header}
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">{timeAgo(post.createdAt)}</span>
          </div>
          <h1 className="text-base font-bold text-gray-900 leading-snug">{post.title}</h1>

          {post.body && (
            <div className="together-prose text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown>{post.body}</ReactMarkdown>
            </div>
          )}

          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {post.hashtags.map(tag => (
                <Link key={tag} href={`/search/?q=%23${tag}`} className="text-[11px] text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full hover:bg-brand-100">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
            <Link href={`/user/${post.authorId}/`} className="flex items-center gap-2">
              <Avatar src={post.authorPhoto} name={post.authorName} size={28} />
              <span className="text-xs text-gray-500 hover:text-brand-600">{post.authorName}</span>
            </Link>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-600 px-1">
            {comments.length} {comments.length === 1 ? 'Reply' : 'Replies'}
          </h2>
          {commentsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-2.5 animate-pulse">
                  <div className="w-8 h-8 rounded-full skeleton-shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                    <div className="h-3 w-1/2 rounded skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : rootComments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No replies yet. Start the conversation!</p>
          ) : (
            rootComments.map(c => (
              <CommentBubble
                key={c.id}
                comment={c}
                currentUserId={user?.uid ?? null}
                onDelete={remove}
                onReply={(cid, name) => setReplyTo({ id: cid, name })}
                replies={getReplies(c.id)}
              />
            ))
          )}
        </div>
      </main>

      {/* Comment input bar */}
      {user ? (
        <div className="fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 max-w-lg mx-auto" style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}>
          {replyTo && (
            <div className="flex items-center justify-between mb-2 bg-brand-50 rounded-xl px-3 py-1.5">
              <span className="text-xs text-brand-600">Replying to @{replyTo.name}</span>
              <button onClick={() => setReplyTo(null)} className="text-brand-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <Avatar src={user.photoURL} name={user.displayName} size={32} />
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a reply…"
              rows={1}
              data-testid="comment-input"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
              style={{ maxHeight: 100, overflowY: 'auto' }}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
              data-testid="submit-comment"
              className="w-9 h-9 flex items-center justify-center bg-brand-500 rounded-xl text-white disabled:opacity-40 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 text-center">
          <p className="text-xs text-gray-500">
            <Link href="#" onClick={e => { e.preventDefault(); }} className="text-brand-500 font-semibold">Sign in</Link> to reply
          </p>
        </div>
      )}
    </div>
  );
}
