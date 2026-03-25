'use client';

import { FormEvent, useEffect, useState } from 'react';
import { diaryService } from '@/services/api';
import { DiaryPlant } from '@/types/api';
import { PlusCircle, Sprout, Calendar, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';

export default function DiaryPage() {
  const [plants, setPlants] = useState<DiaryPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const router = useRouter();

  useEffect(() => {
    diaryService
      .getPlants()
      .then((data) => setPlants(data))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const handleCreatePlant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const created = await diaryService.createPlant({
        name: name.trim(),
        description: description.trim(),
      });
      setPlants((prev) => [created, ...prev]);
      setName('');
      setDescription('');
      setIsCreateOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось создать растение.';
      alert(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Дневник посадок</h1>
          <p className="text-stone-600 mt-2">Открывайте карточку растения и ведите его историю: даты, записи и фото.</p>
        </div>

        <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <Dialog.Trigger asChild>
            <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors whitespace-nowrap">
              <PlusCircle className="h-5 w-5 mr-2" />
              Добавить растение
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 focus:outline-none">
              <Dialog.Title className="text-xl font-semibold text-stone-900">Новое растение</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-stone-500">
                Создайте карточку растения, чтобы вести его историю.
              </Dialog.Description>

              <form onSubmit={handleCreatePlant} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Название</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="block w-full px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Например: Томат Черри"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Описание</label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    className="block w-full resize-none px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Где растет, сорт, заметки"
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
                    disabled={isCreating || !name.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed rounded-xl transition-colors"
                  >
                    {isCreating ? 'Создание...' : 'Создать'}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-4 h-64 animate-pulse">
              <div className="bg-stone-200 h-32 rounded-xl mb-4" />
              <div className="h-6 bg-stone-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-stone-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <button
              key={plant.id}
              onClick={() => router.push(`/diary/plant?id=${plant.id}`)}
              className="text-left bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4 group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sprout className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-stone-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {plant.name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">{plant.entriesCount} записей</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
              </div>

              <p className="text-sm text-stone-600 line-clamp-2 min-h-10">
                {plant.latestEntry?.text || plant.description || 'Пока без записей.'}
              </p>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-sm text-stone-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {plant.latestEntry ? formatDate(plant.latestEntry.date) : formatDate(plant.createdAt)}
                </span>
                <span className="text-emerald-700 font-medium">История растения</span>
              </div>
            </button>
          ))}

          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors flex flex-col items-center justify-center p-8 min-h-[320px] group"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <PlusCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">Добавить растение</h3>
            <p className="text-sm text-stone-500 text-center">
              Создайте карточку и ведите историю по датам
            </p>
          </button>
        </div>
      )}
    </div>
  );
}
