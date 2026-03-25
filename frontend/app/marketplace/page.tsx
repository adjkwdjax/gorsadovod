'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { marketplaceService } from '@/services/api';
import { MarketplaceAd, MarketplaceCategory } from '@/types/api';
import { Search, MapPin, User, Clock, Filter, PlusCircle, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/components/layout/AppLayout';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const categories: MarketplaceCategory[] = ['Отдам даром', 'Обмен', 'Ищу'];

export default function MarketplacePage() {
  const [ads, setAds] = useState<MarketplaceAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory | 'Все'>('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creatingAd, setCreatingAd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<MarketplaceCategory>('Отдам даром');
  const [newLocation, setNewLocation] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    marketplaceService
      .getAds()
      .then((data) => {
        setAds(data);
      })
      .finally(() => {
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

  const filteredAds = useMemo(() => {
    const byCategory = activeCategory === 'Все'
      ? ads
      : ads.filter((ad) => ad.category === activeCategory);

    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return byCategory;
    }

    return byCategory.filter((ad) => {
      return (
        ad.title.toLowerCase().includes(q) ||
        ad.description.toLowerCase().includes(q) ||
        (ad.location || '').toLowerCase().includes(q)
      );
    });
  }, [ads, activeCategory, searchQuery]);

  const handleCreateAd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      router.push('/login');
      return;
    }

    const title = newTitle.trim();
    const description = newDescription.trim();
    if (!title || !description) {
      return;
    }

    setCreatingAd(true);
    try {
      const createdAd = await marketplaceService.createAd({
        title,
        description,
        category: newCategory,
        location: newLocation.trim() || undefined,
        imageUrl: newImageUrl.trim() || undefined,
      });

      setAds((prev) => [createdAd, ...prev]);
      setNewTitle('');
      setNewDescription('');
      setNewCategory('Отдам даром');
      setNewLocation('');
      setNewImageUrl('');
      setIsCreateOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось создать объявление.';
      alert(message);
    } finally {
      setCreatingAd(false);
    }
  };

  const handleOpenCreate = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsCreateOpen(true);
  };

  const handleContactAuthor = (authorId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push(`/messages?user=${authorId}`);
  };

  const handleEditAd = async (ad: MarketplaceAd) => {
    const nextTitle = window.prompt('Заголовок объявления', ad.title);
    if (nextTitle === null) return;

    const nextDescription = window.prompt('Описание объявления', ad.description);
    if (nextDescription === null) return;

    const nextCategoryRaw = window.prompt('Категория: Отдам даром | Обмен | Ищу', ad.category);
    if (nextCategoryRaw === null) return;

    const normalizedCategory = nextCategoryRaw.trim() as MarketplaceCategory;
    if (!categories.includes(normalizedCategory)) {
      alert('Неверная категория. Используйте: Отдам даром, Обмен или Ищу.');
      return;
    }

    const nextLocation = window.prompt('Локация (опционально)', ad.location || '');
    if (nextLocation === null) return;

    const nextImageUrl = window.prompt('URL изображения (опционально)', ad.imageUrl || '');
    if (nextImageUrl === null) return;

    try {
      const updated = await marketplaceService.updateAd(ad.id, {
        title: nextTitle.trim(),
        description: nextDescription.trim(),
        category: normalizedCategory,
        location: nextLocation.trim(),
        imageUrl: nextImageUrl.trim(),
      });

      setAds((prev) => prev.map((item) => (item.id === ad.id ? updated : item)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось обновить объявление.';
      alert(message);
    }
  };

  const handleDeleteAd = async (ad: MarketplaceAd) => {
    const shouldDelete = window.confirm(`Удалить объявление "${ad.title}"?`);
    if (!shouldDelete) return;

    try {
      await marketplaceService.deleteAd(ad.id);
      setAds((prev) => prev.filter((item) => item.id !== ad.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось удалить объявление.';
      alert(message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Доска объявлений</h1>
          <p className="text-stone-600 mt-2">Обмен семенами, рассадой и инвентарем.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-1 md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-xl leading-5 bg-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow"
              placeholder="Поиск объявлений..."
            />
          </div>
          <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-colors whitespace-nowrap">
            <Filter className="h-5 w-5 mr-2" />
            Фильтры
          </button>
          <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Dialog.Trigger asChild>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors whitespace-nowrap"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Добавить объявление
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 focus:outline-none">
                <Dialog.Title className="text-xl font-semibold text-stone-900">
                  Новое объявление
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-stone-500">
                  Создайте объявление для обмена, поиска или передачи растений.
                </Dialog.Description>

                <form onSubmit={handleCreateAd} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Заголовок</label>
                    <input
                      value={newTitle}
                      onChange={(event) => setNewTitle(event.target.value)}
                      className="block w-full px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Например: Отдам рассаду томатов"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Описание</label>
                    <textarea
                      value={newDescription}
                      onChange={(event) => setNewDescription(event.target.value)}
                      rows={4}
                      className="block w-full resize-none px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Подробности объявления..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Категория</label>
                    <select
                      value={newCategory}
                      onChange={(event) => setNewCategory(event.target.value as MarketplaceCategory)}
                      className="block w-full px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Локация</label>
                    <input
                      value={newLocation}
                      onChange={(event) => setNewLocation(event.target.value)}
                      className="block w-full px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Например: Центральный район"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">URL изображения (опционально)</label>
                    <input
                      value={newImageUrl}
                      onChange={(event) => setNewImageUrl(event.target.value)}
                      className="block w-full px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                      >
                        Отмена
                      </button>
                    </Dialog.Close>

                    <button
                      type="submit"
                      disabled={creatingAd || !newTitle.trim() || !newDescription.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed rounded-xl transition-colors"
                    >
                      {creatingAd ? 'Публикация...' : 'Опубликовать'}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-2 hide-scrollbar">
        <button
          onClick={() => setActiveCategory('Все')}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            activeCategory === 'Все'
              ? "bg-emerald-600 text-white"
              : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
          )}
        >
          Все объявления
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeCategory === cat
                ? "bg-emerald-600 text-white"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Ads Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-4 h-72 animate-pulse">
              <div className="bg-stone-200 h-32 rounded-xl mb-4" />
              <div className="h-6 bg-stone-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-stone-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map((ad) => (
            <div key={ad.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
              <div className="aspect-[4/3] bg-stone-100 relative">
                <img 
                  src={ad.imageUrl || `https://picsum.photos/seed/ad${ad.id}/600/400`} 
                  alt={ad.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md shadow-sm",
                    ad.category === 'Отдам даром' && "bg-emerald-100 text-emerald-800",
                    ad.category === 'Обмен' && "bg-blue-100 text-blue-800",
                    ad.category === 'Ищу' && "bg-amber-100 text-amber-800"
                  )}>
                    {ad.category}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-stone-900 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                  {ad.title}
                </h3>
                <p className="text-sm text-stone-600 mb-4 line-clamp-2 flex-1">
                  {ad.description}
                </p>
                <div className="space-y-2 text-sm text-stone-500 pt-4 border-t border-stone-100 mt-auto">
                  {ad.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-stone-400" />
                      <span className="truncate">{ad.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-stone-400" />
                      <Link href={`/profile?id=${ad.authorId}`} className="truncate hover:text-emerald-700 transition-colors">
                        {ad.authorName}
                      </Link>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      {formatDate(ad.createdAt)}
                    </div>
                  </div>

                  {user && user.id === ad.authorId && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => handleEditAd(ad)}
                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad)}
                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить
                      </button>
                    </div>
                  )}

                  {user && user.id !== ad.authorId && (
                    <button
                      onClick={() => handleContactAuthor(ad.authorId)}
                      className="mt-2 inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Написать в ЛС
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
