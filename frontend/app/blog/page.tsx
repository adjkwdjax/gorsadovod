'use client';

import { useEffect, useState } from 'react';
import { blogService } from '@/services/api';
import { BlogPost } from '@/types/api';
import { Search, Calendar, User, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newPost, setNewPost] = useState({
    title: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    tags: '',
    authorName: '',
  });

  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    blogService.getPosts().then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.username) {
      setNewPost((prev) => ({ ...prev, authorName: user.username }));
    }
  }, [isAuthenticated, user]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredPosts = posts.filter((post) => {
    if (!normalizedQuery) return true;

    const titleMatch = post.title.toLowerCase().includes(normalizedQuery);
    const tagsMatch = post.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

    return titleMatch || tagsMatch;
  });

  const handleCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError('');

    if (!newPost.title.trim() || !newPost.content.trim()) {
      setCreateError('Заполните заголовок и текст статьи.');
      return;
    }

    if (!isAuthenticated && !newPost.authorName.trim()) {
      setCreateError('Укажите ваше имя автора.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await blogService.createPost({
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        excerpt: newPost.excerpt.trim(),
        imageUrl: newPost.imageUrl.trim(),
        authorName: isAuthenticated ? undefined : newPost.authorName.trim(),
        tags: newPost.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      setPosts((prev) => [created, ...prev]);
      setNewPost((prev) => ({
        ...prev,
        title: '',
        excerpt: '',
        content: '',
        imageUrl: '',
        tags: '',
      }));
      setIsCreateOpen(false);
    } catch {
      setCreateError('Не удалось создать статью. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Блог Садовода</h1>
          <p className="text-stone-600 mt-2">Статьи, советы и опыт выращивания растений в городе.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-stone-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-xl leading-5 bg-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow"
            placeholder="Поиск по названию или тегам..."
          />
        </div>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">Предложить статью</h2>
            <p className="text-sm text-stone-600">
              Публикация доступна всем. Для гостей достаточно указать имя автора.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen((prev) => !prev)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {isCreateOpen ? 'Свернуть форму' : 'Создать статью'}
          </button>
        </div>

        {isCreateOpen && (
          <form onSubmit={handleCreatePost} className="grid gap-4">
            {!isAuthenticated && (
              <label className="grid gap-2 text-sm text-stone-700">
                Имя автора
                <input
                  value={newPost.authorName}
                  onChange={(event) => setNewPost((prev) => ({ ...prev, authorName: event.target.value }))}
                  className="rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Например: Мария"
                />
              </label>
            )}

            <label className="grid gap-2 text-sm text-stone-700">
              Заголовок
              <input
                value={newPost.title}
                onChange={(event) => setNewPost((prev) => ({ ...prev, title: event.target.value }))}
                className="rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="О чем статья"
              />
            </label>

            <label className="grid gap-2 text-sm text-stone-700">
              Краткое описание
              <textarea
                value={newPost.excerpt}
                onChange={(event) => setNewPost((prev) => ({ ...prev, excerpt: event.target.value }))}
                className="min-h-20 rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Короткий анонс статьи"
              />
            </label>

            <label className="grid gap-2 text-sm text-stone-700">
              Текст статьи
              <textarea
                value={newPost.content}
                onChange={(event) => setNewPost((prev) => ({ ...prev, content: event.target.value }))}
                className="min-h-32 rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Полный текст"
              />
            </label>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="grid gap-2 text-sm text-stone-700">
                Теги (через запятую)
                <input
                  value={newPost.tags}
                  onChange={(event) => setNewPost((prev) => ({ ...prev, tags: event.target.value }))}
                  className="rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="город, урожай, рассада"
                />
              </label>

              <label className="grid gap-2 text-sm text-stone-700">
                URL изображения
                <input
                  value={newPost.imageUrl}
                  onChange={(event) => setNewPost((prev) => ({ ...prev, imageUrl: event.target.value }))}
                  className="rounded-xl border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://..."
                />
              </label>
            </div>

            {createError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{createError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-white hover:bg-stone-800 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Опубликовать
            </button>
          </form>
        )}
      </section>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-4 h-80 animate-pulse">
              <div className="bg-stone-200 h-40 rounded-xl mb-4" />
              <div className="h-6 bg-stone-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-stone-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <article key={post.id} onClick={() => {
              router.push(`/blog/post?id=${post.id}`);
            }} className="cursor-pointer border-transparent hover:border-gray-300 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className="aspect-video bg-stone-100 relative">
                <img 
                  src={post.imageUrl || `https://picsum.photos/seed/blog${post.id}/1200/600`} 
                  alt={post.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-bold text-stone-900 mb-2 line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-stone-600 mb-4 line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-stone-500 pt-4 border-t border-stone-100 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span
                      className={post.authorId ? 'hover:text-emerald-700 transition-colors' : ''}
                      onClick={(event) => {
                        if (!post.authorId) return;
                        event.stopPropagation();
                        router.push(`/profile?id=${post.authorId}`);
                      }}
                    >
                      {post.authorName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={post.createdAt}>
                      {formatDate(post.createdAt)}
                    </time>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-600">
          По запросу ничего не найдено.
        </div>
      )}
    </div>
  );
}
