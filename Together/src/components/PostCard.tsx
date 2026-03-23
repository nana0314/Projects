'use client';

import Link from 'next/link';
import { Post } from '@/src/types';
import Avatar from './Avatar';

function timeAgo(ts: { seconds: number } | null | undefined): string {
  if (!ts) return '';
  const diff = Date.now() / 1000 - ts.seconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostCard({ post }: { post: Post }) {
  const preview = post.body.replace(/[*_]/g, '').slice(0, 100);

  return (
    <Link href={`/post/${post.id}/`} data-testid="post-card" className="block">
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2 hover:shadow-md active:scale-[0.99] transition-all">
        {/* Header badge */}
        {post.header && (
          <span className="inline-block bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {post.header}
          </span>
        )}

        {/* Title */}
        <h2 className="text-sm font-bold text-gray-900 leading-snug">{post.title}</h2>

        {/* Body preview */}
        {preview && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{preview}</p>
        )}

        {/* Post image */}
        {post.imageURL && (
          <div className="rounded-xl overflow-hidden mt-1">
            <img src={post.imageURL} alt="post image" className="w-full max-h-64 object-cover" />
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.hashtags.slice(0, 4).map(tag => (
              <span key={tag} className="text-[10px] text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Avatar src={post.authorPhoto} name={post.authorName} size={24} />
            <span className="text-xs text-gray-400">{post.authorName}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
              {post.commentCount}
            </span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
