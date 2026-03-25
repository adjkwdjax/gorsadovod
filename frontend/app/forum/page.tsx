'use client';

import { FormEvent, useEffect, useState } from 'react';
import { forumService } from '@/services/api';
import { ForumNotification, ForumTopic } from '@/types/api';
import { MessageSquare, Users, Clock, Search, PlusCircle, Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';

export default function ForumPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [notifications, setNotifications] = useState<ForumNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingTopic, setCreatingTopic] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    Promise.allSettled([forumService.getTopics(), forumService.getNotifications()])
      .then((results) => {
        const topicsResult = results[0];
        const notificationsResult = results[1];

        if (topicsResult.status === 'fulfilled') {
          setTopics(topicsResult.value);
        }

        if (notificationsResult.status === 'fulfilled') {
          setNotifications(notificationsResult.value);
        } else {
          setNotifications([]);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const handleCreateTopic = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = newTitle.trim();
    const description = newDescription.trim();

    if (!title || !description) {
      return;
    }

    setCreatingTopic(true);
    try {
      const topic = await forumService.createTopic({ title, description });
      setTopics((prev) => [topic, ...prev]);
      setNewTitle('');
      setNewDescription('');
      setIsCreateOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось создать тему.';
      alert(message);
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleNotificationClick = async (notification: ForumNotification) => {
    try {
      if (!notification.isRead) {
        const updated = await forumService.markNotificationRead(notification.id);
        setNotifications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      }
    } finally {
      router.push(`/forum/topic?id=${notification.topicId}`);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Форум</h1>
          <p className="text-stone-600 mt-2">Обсуждения, вопросы и советы от сообщества.</p>
        </div>

        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-1 md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-xl leading-5 bg-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow"
              placeholder="Поиск по форуму..."
            />
          </div>

          <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors whitespace-nowrap">
                <PlusCircle className="h-5 w-5 mr-2" />
                Новая тема
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 focus:outline-none">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-stone-900">
                      Новая тема
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-stone-500">
                      Создайте тему для обсуждения на форуме.
                    </Dialog.Description>
                  </div>

              
                </div>

                <form onSubmit={handleCreateTopic} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Заголовок
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(event) => setNewTitle(event.target.value)}
                      className="block w-full px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Например: Как бороться с тлей без химии?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Описание
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(event) => setNewDescription(event.target.value)}
                      rows={5}
                      className="block w-full resize-none px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Опишите вопрос или тему подробнее..."
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
                      disabled={creatingTopic || !newTitle.trim() || !newDescription.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed rounded-xl transition-colors"
                    >
                      {creatingTopic ? 'Создание...' : 'Создать тему'}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {!loading && notifications.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-900 font-semibold">
              <Bell className="h-4 w-4 text-emerald-600" />
              Уведомления по подпискам
            </div>
            <div className="text-xs text-stone-500">Непрочитано: {unreadCount}</div>
          </div>

          <div className="divide-y divide-stone-100">
            {notifications.slice(0, 5).map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={[
                  'w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors',
                  notification.isRead ? 'bg-white' : 'bg-emerald-50/40',
                ].join(' ')}
              >
                <div className="text-sm font-medium text-stone-900">{notification.topicTitle}</div>
                <div className="text-sm text-stone-600 mt-1 line-clamp-1">{notification.postContentPreview}</div>
                <div className="text-xs text-stone-400 mt-1">{formatDate(notification.createdAt)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-stone-200 bg-stone-50 text-sm font-medium text-stone-500 uppercase tracking-wider">
          <div className="col-span-12 md:col-span-7">Тема</div>
          <div className="hidden md:block col-span-2 text-center">Ответов</div>
          <div className="hidden md:block col-span-3 text-right">Последнее сообщение</div>
        </div>

        {loading ? (
          <div className="divide-y divide-stone-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 grid grid-cols-12 gap-4 animate-pulse">
                <div className="col-span-12 md:col-span-7 space-y-2">
                  <div className="h-5 bg-stone-200 rounded w-3/4" />
                  <div className="h-4 bg-stone-200 rounded w-1/2" />
                </div>
                <div className="hidden md:flex col-span-2 justify-center items-center">
                  <div className="h-6 w-12 bg-stone-200 rounded-full" />
                </div>
                <div className="hidden md:flex col-span-3 justify-end items-center">
                  <div className="h-4 bg-stone-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/forum/topic?id=${topic.id}`}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-stone-50 transition-colors items-center group"
              >
                <div className="col-span-12 md:col-span-7">
                  <h3 className="text-lg font-semibold text-stone-900 group-hover:text-emerald-700 transition-colors mb-1">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-stone-500 line-clamp-1 mb-2">
                    {topic.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-stone-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span
                        className="hover:text-emerald-700 transition-colors"
                        onClick={(event) => {
                          event.preventDefault();
                          router.push(`/profile?id=${topic.authorId}`);
                        }}
                      >
                        {topic.authorName}
                      </span>
                    </span>
                    <span className="md:hidden flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {topic.repliesCount}
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex col-span-2 justify-center items-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
                    {topic.repliesCount}
                  </span>
                </div>

                <div className="hidden md:flex col-span-3 justify-end items-center text-sm text-stone-500">
                  <div className="flex items-center gap-1.5 text-right">
                    <Clock className="h-4 w-4 text-stone-400" />
                    {formatDate(topic.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}