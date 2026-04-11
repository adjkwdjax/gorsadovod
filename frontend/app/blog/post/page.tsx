'use client';

import { useEffect, useState } from 'react';
import { blogService } from '@/services/api';
import { BlogPost } from '@/types/api';
import { Calendar, User, ArrowLeft, Share2, Bookmark } from 'lucide-react';
import Link from 'next/link';

export default function BlogPostPage() {
  const [postId, setPostId] = useState('');

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setPostId(query.get('id') || '');
  }, []);

  useEffect(() => {
    if (!postId) {
      setPost(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    blogService
      .getPost(postId)
      .then((data) => {
        setPost(data);
      })
      .catch(() => {
        setPost(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [postId]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/4" />
        <div className="h-12 bg-stone-200 rounded w-3/4" />
        <div className="flex gap-4">
          <div className="h-6 bg-stone-200 rounded w-32" />
          <div className="h-6 bg-stone-200 rounded w-32" />
        </div>
        <div className="h-96 bg-stone-200 rounded-3xl" />
        <div className="space-y-4">
          <div className="h-4 bg-stone-200 rounded w-full" />
          <div className="h-4 bg-stone-200 rounded w-full" />
          <div className="h-4 bg-stone-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Статья не найдена</h1>
        <Link href="/blog" className="text-emerald-600 hover:text-emerald-700 font-medium">
          Вернуться в блог
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      <Link href="/blog" className="inline-flex items-center text-stone-500 hover:text-stone-900 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Назад к статьям
      </Link>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-stone-900 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center justify-between py-6 border-y border-stone-200">
          <div className="flex items-center gap-6 text-stone-600">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                {post.authorId ? (
                  <Link href={`/profile?id=${post.authorId}`} className="font-medium text-stone-900 hover:text-emerald-700 transition-colors">
                    {post.authorName}
                  </Link>
                ) : (
                  <span className="font-medium text-stone-900">{post.authorName}</span>
                )}
                <p className="text-sm">Автор</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.createdAt}>
                {formatDate(post.createdAt)}
              </time>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
              <Bookmark className="h-5 w-5" />
            </button>
            <button className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="aspect-[21/9] bg-stone-100 rounded-3xl overflow-hidden relative">
        <img
          src={post.imageUrl || `https://picsum.photos/seed/blog${post.id}/1200/600`}
          alt={post.title}
          className="object-cover w-full h-full"
        />
      </div>

      <div className="prose prose-stone prose-emerald max-w-none prose-lg">
        <p className="lead text-xl text-stone-600 font-medium mb-8">
          {post.excerpt}
        </p>
        <p>
          {post.content}
        </p>
      </div>
    </article>
  );
}
