'use client';

import { useEffect, useState } from 'react';
import { blogService } from '@/services/api';
import { BlogPost } from '@/types/api';
import { Search, Calendar, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const router = useRouter();

  useEffect(() => {
    blogService.getPosts().then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

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
                  src={post.imageUrl} 
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
                      className="hover:text-emerald-700 transition-colors"
                      onClick={(event) => {
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
