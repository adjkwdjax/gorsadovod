'use client';

import { useEffect, useState } from 'react';
import { messageService } from '@/services/api';
import { Dialog, Message, User } from '@/types/api';
import { Search, Send, User as UserIcon, Plus, X } from 'lucide-react';
import { cn } from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function MessagesPage() {
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.replace('/login'); // лучше replace, чтобы не плодить history
    }
  }, [user, router]);


  // Load dialogs on mount
  useEffect(() => {
    if (!user) {
      return;
    }

    loadDialogs();
    
    // Check for user in query params (from forum "Write PM" button)
    const query = new URLSearchParams(window.location.search);
    const userIdFromQuery = query.get('user');
    if (userIdFromQuery) {
      setSelectedUserId(userIdFromQuery);
    }
  }, [user]);

  // Load messages when selected user changes
  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId]);

  const loadDialogs = async () => {
    try {
      setLoading(true);
      const data = await messageService.getDialogs();
      setDialogs(data);
    } catch (error) {
      console.error('Failed to load dialogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      setMessageLoading(true);
      const data = await messageService.getMessages(userId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await messageService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleNewMessage = async () => {
    if (!showNewMessage && users.length === 0) {
      await loadUsers();
    }
    setShowNewMessage(!showNewMessage);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setShowNewMessage(false);
    setMessageContent('');
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedUserId) return;

    try {
      await messageService.sendMessage(selectedUserId, { content: messageContent });
      setMessageContent('');
      await loadMessages(selectedUserId);
      await loadDialogs();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const selectedDialog = selectedUserId 
    ? dialogs.find(d => d.userId === selectedUserId)
    : null;

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Сообщения</h1>
          <p className="text-stone-600 mt-2">Личные сообщения и договоренности об обмене.</p>
        </div>
        <button
          onClick={handleNewMessage}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="h-5 w-5" />
          Новое сообщение
        </button>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden flex flex-col md:flex-row min-h-0">
        {/* Sidebar */}
        <div className="w-full md:w-80 border-r border-stone-200 flex flex-col shrink-0 relative">
          <div className="p-4 border-b border-stone-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-stone-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl leading-5 bg-stone-50 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow"
                placeholder="Поиск диалогов..."
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-stone-200 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-stone-200 rounded w-1/2" />
                      <div className="h-3 bg-stone-200 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : dialogs.length === 0 ? (
              <div className="p-4 text-center text-stone-500">
                <p className="text-sm">Нет диалогов</p>
                <p className="text-xs mt-2">Начните новый диалог, нажав кнопку выше</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {dialogs.map((dialog) => (
                  <button
                    key={dialog.userId}
                    onClick={() => handleSelectUser(dialog.userId)}
                    className={cn(
                      "w-full text-left p-4 hover:bg-stone-50 transition-colors flex gap-3 items-start group",
                      selectedUserId === dialog.userId && "bg-emerald-50 border-l-2 border-emerald-600"
                    )}
                  >
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-stone-900 truncate group-hover:text-emerald-700 transition-colors">
                          <span
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(`/profile?id=${dialog.userId}`);
                            }}
                          >
                            {dialog.userName}
                          </span>
                        </h4>
                        <span className="text-xs text-stone-400 whitespace-nowrap ml-2">
                          {formatDate(dialog.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-1 text-stone-500">
                        {dialog.lastMessage}
                      </p>
                    </div>
                    {dialog.unreadCount > 0 && (
                      <div className="bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                        {dialog.unreadCount}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Message Modal */}
          {showNewMessage && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-3xl">
              <div className="bg-white rounded-2xl shadow-lg p-6 w-11/12 max-h-96 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-stone-900">Новое сообщение</h3>
                  <button
                    onClick={() => setShowNewMessage(false)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Поиск пользователя..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-stone-500 text-center py-4">Пользователи не найдены</p>
                  ) : (
                    filteredUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user.id)}
                        className="w-full text-left px-4 py-3 hover:bg-stone-50 rounded-xl transition-colors flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate group-hover:text-emerald-700">
                            <span
                              onClick={(event) => {
                                event.stopPropagation();
                                router.push(`/profile?id=${user.id}`);
                              }}
                            >
                              {user.username}
                            </span>
                          </p>
                          <p className="text-xs text-stone-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        {selectedUserId ? (
          <div className="flex-1 flex flex-col min-w-0 bg-stone-50/50">
            {/* Chat Header */}
            <div className="h-16 border-b border-stone-200 bg-white px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    className="font-bold text-stone-900 hover:text-emerald-700 transition-colors cursor-pointer"
                    onClick={() => selectedDialog && router.push(`/profile?id=${selectedDialog.userId}`)}
                  >
                    {selectedDialog?.userName}
                  </h3>
                  <p className="text-xs text-emerald-600 font-medium">Активен</p>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messageLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-stone-400">Загрузка сообщений...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-stone-400">Нет сообщений. Начните разговор!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex gap-4",
                    msg.senderId === selectedUserId ? "justify-start" : "justify-end"
                  )}>
                    {msg.senderId === selectedUserId && (
                      <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-auto">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[60%] space-y-1",
                      msg.senderId === selectedUserId ? "" : "items-end flex flex-col"
                    )}>
                      <div className={cn(
                        "p-4 rounded-2xl shadow-sm",
                        msg.senderId === selectedUserId
                          ? "bg-white border border-stone-200 rounded-bl-sm"
                          : "bg-emerald-600 text-white rounded-br-sm"
                      )}>
                        <p className="text-sm leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                      <span className="text-xs text-stone-400 px-1">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    {msg.senderId !== selectedUserId && (
                      <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-auto">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-stone-200 shrink-0">
              <div className="flex items-end gap-2">
                <div className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-shadow">
                  <textarea
                    className="w-full bg-transparent border-none focus:ring-0 resize-none p-2 text-sm text-stone-900 placeholder-stone-400"
                    rows={2}
                    placeholder="Написать сообщение..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim()}
                  className="p-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-2xl transition-colors shrink-0 flex items-center justify-center shadow-sm"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-stone-50/50 text-center">
            <UserIcon className="h-16 w-16 text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">Выберите диалог</h3>
            <p className="text-stone-600 max-w-sm">
              Выберите существующий диалог или создайте новое сообщение, нажав кнопку выше
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
