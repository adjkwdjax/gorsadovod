import Link from 'next/link';
import { Leaf, Users, MapPin, CalendarDays, ArrowRight } from 'lucide-react';
import { blogService } from '@/services/api';
import { BlogPost } from '@/types/api';

async function getLatestPosts(): Promise<BlogPost[]> {
  try {
    const posts = await blogService.getPosts();
    return posts.slice(0, 2);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const latestPosts = await getLatestPosts();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-emerald-900 text-white rounded-3xl overflow-hidden p-8 md:p-16 flex flex-col items-center text-center">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: 'url("https://picsum.photos/seed/garden/1920/1080?blur=2")' }}
        />
        <div className="relative z-10 max-w-3xl space-y-6">
          <Leaf className="h-16 w-16 mx-auto text-emerald-400 mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Городской Садовод
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto">
            Платформа для обмена опытом, семенами, саженцами и организации совместных закупок среди жителей города, увлеченных садоводством на балконах и участках.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-emerald-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors"
            >
              Присоединиться к сообществу
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white border border-emerald-400/50 hover:bg-emerald-800/50 rounded-xl transition-colors"
            >
              Найти сады на карте
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold text-stone-900">Обмен и Дарение</h3>
          <p className="text-stone-600">
            Делитесь излишками семян и рассады, находите редкие сорта у соседей по району.
          </p>
          <Link href="/marketplace" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium pt-2">
            Смотреть объявления <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold text-stone-900">Календарь Работ</h3>
          <p className="text-stone-600">
            Следите за сезонными работами, лунным календарем и оптимальными сроками посадки.
          </p>
          <Link href="/calendar" className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium pt-2">
            Открыть календарь <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold text-stone-900">Карта Садов</h3>
          <p className="text-stone-600">
            Находите общественные огороды, точки обмена семенами и клубы по интересам рядом с вами.
          </p>
          <Link href="/map" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium pt-2">
            Перейти к карте <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Latest from Blog */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-stone-900">Новое в блоге</h2>
          <Link href="/blog" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Все статьи
          </Link>
        </div>
        {latestPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {latestPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/post?id=${post.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="aspect-video bg-stone-200 relative overflow-hidden">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200" />
                  )}
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {(post.tags.length > 0 ? post.tags : ['Статья']).slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-stone-600 line-clamp-2">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-stone-600">
            Пока нет опубликованных статей.
          </div>
        )}
      </section>
    </div>
  );
}
