'use client';

import { FormEvent, useEffect, useState } from 'react';
import { forumService } from '@/services/api';
import { ForumTopic, ForumReply } from '@/types/api';
import { User, Clock, ArrowLeft, MessageSquare, ThumbsUp, Reply, Mail, Bell, BellOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForumTopicPage() {
  const [topicId, setTopicId] = useState('');
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setTopicId(query.get('id') || '');
  }, []);

  useEffect(() => {
    if (!topicId) {
      setTopic(null);
      setReplies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      forumService.getTopic(topicId),
      forumService.getPosts(topicId),
    ])
      .then(([topicData, postsData]) => {
        setTopic(topicData);
        setReplies(postsData);
      })
      .catch(() => {
        setTopic(null);
        setReplies([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [topicId]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const handleReplySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = newReply.trim();
    if (!content || !topicId) {
      return;
    }

    setSendingReply(true);
    try {
      const createdReply = await forumService.createPost(topicId, { content });
      setReplies((prev) => [...prev, createdReply]);
      setTopic((prev) => (prev ? { ...prev, repliesCount: prev.repliesCount + 1 } : prev));
      setNewReply('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось отправить ответ.';
      alert(message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendMessage = (userId: string) => {
    router.push(`/messages?user=${userId}`);
  };

  const handleToggleSubscription = async () => {
    if (!topic || !topicId || subscriptionLoading) {
      return;
    }

    setSubscriptionLoading(true);
    try {
      if (topic.isSubscribed) {
        await forumService.unsubscribeTopic(topicId);
        setTopic((prev) => (prev ? { ...prev, isSubscribed: false } : prev));
      } else {
        await forumService.subscribeTopic(topicId);
        setTopic((prev) => (prev ? { ...prev, isSubscribed: true } : prev));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось обновить подписку.';
      alert(message);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-stone-200 rounded w-32" />
        <div className="h-12 bg-stone-200 rounded w-3/4" />
        <div className="h-32 bg-stone-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-24 bg-stone-200 rounded-2xl" />
          <div className="h-24 bg-stone-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Тема не найдена</h1>
        <Link href="/forum" className="text-emerald-600 hover:text-emerald-700 font-medium">
          Вернуться на форум
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/forum" className="inline-flex items-center text-stone-500 hover:text-stone-900 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Назад к списку тем
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-6">
            {topic.title}
          </h1>

          <div className="flex gap-4 md:gap-6">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                <User className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-stone-900 text-center w-20 truncate">
                <Link href={`/profile?id=${topic.authorId}`} className="hover:text-emerald-700 transition-colors">
                  {topic.authorName}
                </Link>
              </span>
              <span className="text-xs text-stone-500">Автор</span>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-xs text-stone-400 mb-4">
                <Clock className="h-3.5 w-3.5" />
                <time dateTime={topic.createdAt}>
                  {formatDate(topic.createdAt)}
                </time>
              </div>

              <div className="prose prose-stone max-w-none">
                <p className="text-stone-800 leading-relaxed text-lg">
                  {topic.description}
                </p>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-stone-100">
                <button
                  onClick={handleToggleSubscription}
                  disabled={subscriptionLoading}
                  className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-emerald-600 transition-colors disabled:opacity-60"
                >
                  {topic.isSubscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  {subscriptionLoading
                    ? 'Обновление...'
                    : topic.isSubscribed
                    ? 'Отписаться от уведомлений'
                    : 'Подписаться на уведомления'}
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-emerald-600 transition-colors">
                  <Reply className="h-4 w-4" />
                  Ответить
                </button>
                <button
                  onClick={() => handleSendMessage(topic.authorId)}
                  className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-emerald-600 transition-colors ml-auto"
                >
                  <Mail className="h-4 w-4" />
                  Написать в ЛС
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-stone-50 px-6 py-4 border-y border-stone-200 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-stone-500" />
          <h2 className="font-bold text-stone-900">
            Ответы ({topic.repliesCount})
          </h2>
        </div>

        <div className="divide-y divide-stone-100">
          {replies.map((reply) => (
            <div key={reply.id} className="p-6 md:p-8 flex gap-4 md:gap-6">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 bg-stone-100 text-stone-600 rounded-full flex items-center justify-center mb-2">
                  <User className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-stone-900 text-center w-20 truncate">
                  <Link href={`/profile?id=${reply.authorId}`} className="hover:text-emerald-700 transition-colors">
                    {reply.authorName}
                  </Link>
                </span>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-xs text-stone-400 mb-2">
                  <Clock className="h-3.5 w-3.5" />
                  <time dateTime={reply.createdAt}>
                    {formatDate(reply.createdAt)}
                  </time>
                </div>

                <div className="prose prose-stone max-w-none">
                  <p className="text-stone-800 leading-relaxed">
                    {reply.content}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 md:p-8 bg-stone-50 border-t border-stone-200">
          <h3 className="font-bold text-stone-900 mb-4">Ваш ответ</h3>
          <form className="space-y-4" onSubmit={handleReplySubmit}>
            <textarea
              value={newReply}
              onChange={(event) => setNewReply(event.target.value)}
              className="w-full p-4 border border-stone-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow resize-none"
              rows={4}
              placeholder="Напишите свой ответ здесь..."
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sendingReply || !newReply.trim()}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
              >
                {sendingReply ? 'Отправка...' : 'Отправить ответ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
