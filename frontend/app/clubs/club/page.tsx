'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clubService } from '@/services/api';
import { ClubChatMessage, ClubDetail } from '@/types/api';
import { ArrowLeft, Send, Star, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

export default function ClubDetailPage() {
  const router = useRouter();
  const [clubId, setClubId] = useState('');
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [chatMessages, setChatMessages] = useState<ClubChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatContent, setChatContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setClubId(query.get('id') || '');
  }, []);

  useEffect(() => {
    if (!clubId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    clubService
      .getClub(clubId)
      .then((data) => setClub(data))
      .catch(() => setClub(null))
      .finally(() => setLoading(false));
  }, [clubId]);

  useEffect(() => {
    if (!club || !club.isMember) {
      setChatMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setChatLoading(true);
        const data = await clubService.getMessages(club.id);
        setChatMessages(data);
      } catch (error) {
        console.error('Failed to load club messages:', error);
      } finally {
        setChatLoading(false);
      }
    };

    loadMessages();
  }, [club]);

  const handleSendMessage = async () => {
    if (!club || !club.isMember) return;
    const content = chatContent.trim();
    if (!content) return;

    try {
      setSendingMessage(true);
      const created = await clubService.sendMessage(club.id, { content });
      setChatMessages((prev) => [...prev, created]);
      setChatContent('');
    } catch (error) {
      console.error('Failed to send club message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (message: ClubChatMessage) => {
    if (!club || !user || message.authorId !== user.id) {
      return;
    }

    const shouldDelete = window.confirm('Удалить это сообщение для всех участников клуба?');
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingMessageId(message.id);
      await clubService.deleteMessage(club.id, message.id, 'all');
      setChatMessages((prev) => prev.filter((item) => item.id !== message.id));
    } catch (error) {
      console.error('Failed to delete club message:', error);
    } finally {
      setDeletingMessageId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-52 bg-stone-200 rounded" />
        <div className="h-40 bg-stone-200 rounded-3xl" />
        <div className="h-64 bg-stone-200 rounded-3xl" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Клуб не найден</h1>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/clubs" className="inline-flex items-center text-stone-500 hover:text-stone-900 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Ко всем клубам
      </Link>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">{club.name}</h1>
            <p className="mt-2 text-stone-600">{club.description || 'Описание не добавлено.'}</p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium">
            Автор: {club.authorName}
          </div>
        </div>

        <div className="flex items-center gap-2 text-stone-600">
          <Users className="h-4 w-4" />
          <span>{club.membersCount} участников</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-4">Участники</h2>
        {club.members.length === 0 ? (
          <p className="text-stone-500">Пока нет участников.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {club.members.map((member) => (
              <Link
                key={member.id}
                href={`/profile?id=${member.id}`}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors"
              >
                <div className="font-medium text-stone-900">{member.username}</div>
                <div className="mt-1 inline-flex items-center gap-1 text-amber-600 text-sm">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{member.rating}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-4">Общий чат клуба</h2>
        {!club.isMember ? (
          <p className="text-stone-500">Чат доступен только участникам клуба.</p>
        ) : (
          <div className="space-y-4">
            <div className="max-h-80 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50 p-3 space-y-3">
              {chatLoading ? (
                <p className="text-sm text-stone-500">Загрузка сообщений...</p>
              ) : chatMessages.length === 0 ? (
                <p className="text-sm text-stone-500">Пока нет сообщений. Начните разговор.</p>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className="rounded-xl border border-stone-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-stone-900">{message.authorName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500">
                          {new Date(message.createdAt).toLocaleString('ru-RU')}
                        </span>
                        {user?.id === message.authorId && (
                          <button
                            onClick={() => handleDeleteMessage(message)}
                            disabled={deletingMessageId === message.id}
                            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 disabled:text-stone-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingMessageId === message.id ? 'Удаление...' : 'У всех'}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-stone-700 whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <textarea
                value={chatContent}
                onChange={(event) => setChatContent(event.target.value)}
                rows={2}
                placeholder="Написать сообщение в общий чат..."
                className="flex-1 resize-none rounded-2xl border border-stone-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatContent.trim() || sendingMessage || !user}
                className="self-end inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
