'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { clubService } from '@/services/api';
import { Club } from '@/types/api';
import { Users, Search, PlusCircle } from 'lucide-react';
import { cn } from '@/components/layout/AppLayout';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creatingClub, setCreatingClub] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    clubService
      .getClubs()
      .then((data) => setClubs(data))
      .finally(() => setLoading(false));
  }, []);

  const filteredClubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter((club) =>
      club.name.toLowerCase().includes(q) || club.description.toLowerCase().includes(q)
    );
  }, [clubs, searchQuery]);

  const handleOpenCreate = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsCreateOpen(true);
  };

  const handleCreateClub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newName.trim()) return;

    setCreatingClub(true);
    try {
      const created = await clubService.createClub({
        name: newName.trim(),
        description: newDescription.trim(),
      });
      setClubs((prev) => [created, ...prev]);
      setNewName('');
      setNewDescription('');
      setIsCreateOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось создать клуб.';
      alert(message);
    } finally {
      setCreatingClub(false);
    }
  };

  const handleJoin = async (clubId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      const detail = await clubService.joinClub(clubId);
      setClubs((prev) => prev.map((club) => (club.id === clubId ? {
        ...club,
        isMember: true,
        membersCount: detail.membersCount,
      } : club)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось вступить в клуб.';
      alert(message);
    }
  };

  const handleLeave = async (clubId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      const detail = await clubService.leaveClub(clubId);
      setClubs((prev) => prev.map((club) => (club.id === clubId ? {
        ...club,
        isMember: false,
        membersCount: detail.membersCount,
      } : club)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выйти из клуба.';
      alert(message);
    }
  };

  const openClubPage = (clubId: string) => {
    router.push(`/clubs/club?id=${clubId}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Клубы по интересам</h1>
          <p className="text-stone-600 mt-2">Создавайте и находите клубы садоводов по интересам.</p>
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
              placeholder="Поиск клубов..."
            />
          </div>
          <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Dialog.Trigger asChild>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors whitespace-nowrap"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Создать клуб
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 focus:outline-none">
                <Dialog.Title className="text-xl font-semibold text-stone-900">
                  Создать клуб
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-stone-500">
                  Укажите название и описание клуба.
                </Dialog.Description>

                <form onSubmit={handleCreateClub} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Название</label>
                    <input
                      value={newName}
                      onChange={(event) => setNewName(event.target.value)}
                      className="block w-full px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Например: Любители ягод"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Описание</label>
                    <textarea
                      value={newDescription}
                      onChange={(event) => setNewDescription(event.target.value)}
                      rows={4}
                      className="block w-full resize-none px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="О чем ваш клуб"
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
                      disabled={creatingClub || !newName.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed rounded-xl transition-colors"
                    >
                      {creatingClub ? 'Создание...' : 'Создать'}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-6 h-48 animate-pulse">
              <div className="h-6 bg-stone-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-stone-200 rounded w-full mb-2" />
              <div className="h-4 bg-stone-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <div
              key={club.id}
              onClick={() => openClubPage(club.id)}
              className="cursor-pointer bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6" />
                </div>
                <span className="px-2.5 py-1 text-xs font-medium rounded-md shadow-sm bg-emerald-50 text-emerald-700">
                  Автор: {club.authorName}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-stone-900 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-1">
                {club.name}
              </h3>
              <p className="text-sm text-stone-600 mb-6 line-clamp-2 flex-1">
                {club.description}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-auto">
                <div className="flex items-center gap-1.5 text-sm text-stone-500">
                  <Users className="h-4 w-4" />
                  <span>{club.membersCount} участников</span>
                </div>

                {club.isMember ? (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleLeave(club.id);
                    }}
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    Выйти
                  </button>
                ) : (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleJoin(club.id);
                    }}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Вступить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
