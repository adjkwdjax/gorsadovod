'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { exchangeService, messageService } from '@/services/api';
import { TradeExchange, TradeReview, User } from '@/types/api';
import { ArrowRightLeft, CheckCircle2, Clock3, PlusCircle, Star } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/components/layout/AppLayout';
import Link from 'next/link';

export default function ExchangesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [exchanges, setExchanges] = useState<TradeExchange[]>([]);
  const [reviewsByExchange, setReviewsByExchange] = useState<Record<string, TradeReview[]>>({});
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [counterpartyId, setCounterpartyId] = useState('');
  const [itemsFromInitiator, setItemsFromInitiator] = useState('');
  const [itemsFromCounterparty, setItemsFromCounterparty] = useState('');

  const [reviewForms, setReviewForms] = useState<Record<string, { rating: number; comment: string }>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    Promise.all([messageService.getUsers(), exchangeService.getExchanges()])
      .then(async ([usersData, exchangesData]) => {
        setUsers(usersData);
        setExchanges(exchangesData);

        const reviewEntries = await Promise.all(
          exchangesData.map(async (exchange) => {
            const reviews = await exchangeService.getReviews(exchange.id);
            return [exchange.id, reviews] as const;
          })
        );
        setReviewsByExchange(Object.fromEntries(reviewEntries));
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const visibleUsers = useMemo(() => {
    if (!user) return users;
    return users.filter((u) => u.id !== user.id);
  }, [users, user]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const reloadExchanges = async () => {
    const exchangesData = await exchangeService.getExchanges();
    setExchanges(exchangesData);

    const reviewEntries = await Promise.all(
      exchangesData.map(async (exchange) => {
        const reviews = await exchangeService.getReviews(exchange.id);
        return [exchange.id, reviews] as const;
      })
    );
    setReviewsByExchange(Object.fromEntries(reviewEntries));
  };

  const handleCreateExchange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!counterpartyId || !itemsFromInitiator.trim() || !itemsFromCounterparty.trim()) {
      return;
    }

    setCreating(true);
    try {
      await exchangeService.createExchange({
        counterpartyId,
        itemsFromInitiator: itemsFromInitiator.trim(),
        itemsFromCounterparty: itemsFromCounterparty.trim(),
      });
      setCounterpartyId('');
      setItemsFromInitiator('');
      setItemsFromCounterparty('');
      await reloadExchanges();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось создать обмен.';
      alert(message);
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmExchange = async (exchangeId: string) => {
    try {
      await exchangeService.confirmExchange(exchangeId);
      await reloadExchanges();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось подтвердить обмен.';
      alert(message);
    }
  };

  const handleSubmitReview = async (exchange: TradeExchange) => {
    if (!user) return;

    const form = reviewForms[exchange.id] || { rating: 5, comment: '' };
    const targetId = user.id === exchange.initiatorId ? exchange.counterpartyId : exchange.initiatorId;

    try {
      await exchangeService.createReview(exchange.id, {
        targetId,
        rating: form.rating,
        comment: form.comment.trim() || undefined,
      });
      setReviewForms((prev) => ({ ...prev, [exchange.id]: { rating: 5, comment: '' } }));
      await reloadExchanges();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось отправить отзыв.';
      alert(message);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Обмены</h1>
        <p className="text-stone-600 mt-2">Создавайте обмены, подтверждайте завершение и оставляйте отзывы.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-emerald-600" />
          Новый обмен
        </h2>

        <form className="space-y-4" onSubmit={handleCreateExchange}>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">С кем обмен</label>
            <select
              value={counterpartyId}
              onChange={(event) => setCounterpartyId(event.target.value)}
              className="block w-full px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Выберите пользователя</option>
              {visibleUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Что отдаю я (текст)</label>
            <textarea
              value={itemsFromInitiator}
              onChange={(event) => setItemsFromInitiator(event.target.value)}
              rows={3}
              className="block w-full resize-none px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Например: 10 саженцев клубники"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Что отдаёт второй участник (текст)</label>
            <textarea
              value={itemsFromCounterparty}
              onChange={(event) => setItemsFromCounterparty(event.target.value)}
              rows={3}
              className="block w-full resize-none px-4 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Например: 3 мешка компоста"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !counterpartyId || !itemsFromInitiator.trim() || !itemsFromCounterparty.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              {creating ? 'Создание...' : 'Создать обмен'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 text-stone-500">Загрузка...</div>
        ) : exchanges.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 text-stone-500">
            Пока нет обменов.
          </div>
        ) : (
          exchanges.map((exchange) => {
            const isInitiator = user.id === exchange.initiatorId;
            const partnerId = isInitiator ? exchange.counterpartyId : exchange.initiatorId;
            const partnerName = isInitiator ? exchange.counterpartyName : exchange.initiatorName;
            const myConfirmed = isInitiator ? exchange.confirmedByInitiator : exchange.confirmedByCounterparty;
            const reviews = reviewsByExchange[exchange.id] || [];
            const myReview = reviews.find((review) => review.authorId === user.id);

            return (
              <div key={exchange.id} className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                      <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
                      Обмен с{' '}
                      <Link href={`/profile?id=${partnerId}`} className="hover:text-emerald-700 transition-colors">
                        {partnerName}
                      </Link>
                    </h3>
                    <p className="text-sm text-stone-500 mt-1">Создан: {formatDate(exchange.createdAt)}</p>
                  </div>

                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                      exchange.status === 'open' && 'bg-amber-100 text-amber-700',
                      exchange.status === 'completed' && 'bg-emerald-100 text-emerald-700',
                      exchange.status === 'cancelled' && 'bg-stone-200 text-stone-700'
                    )}
                  >
                    {exchange.status === 'open' && <Clock3 className="h-4 w-4" />}
                    {exchange.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                    {exchange.status === 'open' ? 'Открыт' : exchange.status === 'completed' ? 'Завершён' : 'Отменён'}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-stone-200 p-4 bg-stone-50">
                    <p className="text-xs uppercase tracking-wider text-stone-500 mb-2">
                      Отдаёт{' '}
                      <Link href={`/profile?id=${exchange.initiatorId}`} className="hover:text-emerald-700 transition-colors">
                        {exchange.initiatorName}
                      </Link>
                    </p>
                    <p className="text-sm text-stone-800 whitespace-pre-wrap">{exchange.itemsFromInitiator}</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 p-4 bg-stone-50">
                    <p className="text-xs uppercase tracking-wider text-stone-500 mb-2">
                      Отдаёт{' '}
                      <Link href={`/profile?id=${exchange.counterpartyId}`} className="hover:text-emerald-700 transition-colors">
                        {exchange.counterpartyName}
                      </Link>
                    </p>
                    <p className="text-sm text-stone-800 whitespace-pre-wrap">{exchange.itemsFromCounterparty}</p>
                  </div>
                </div>

                {exchange.status === 'open' && (
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-stone-600">
                      Подтверждения: {exchange.confirmedByInitiator ? 'инициатор подтвердил' : 'инициатор не подтвердил'};{' '}
                      {exchange.confirmedByCounterparty ? 'вторая сторона подтвердила' : 'вторая сторона не подтвердила'}
                    </p>
                    {!myConfirmed && (
                      <button
                        onClick={() => handleConfirmExchange(exchange.id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
                      >
                        Подтвердить обмен
                      </button>
                    )}
                  </div>
                )}

                {exchange.status === 'completed' && (
                  <div className="pt-2 border-t border-stone-100 space-y-3">
                    <p className="text-sm font-medium text-stone-900">Отзывы по обмену</p>

                    {reviews.length === 0 ? (
                      <p className="text-sm text-stone-500">Пока нет отзывов.</p>
                    ) : (
                      <div className="space-y-2">
                        {reviews.map((review) => (
                          <div key={review.id} className="rounded-xl border border-stone-200 p-3 bg-stone-50">
                            <div className="flex items-center justify-between">
                              <Link href={`/profile?id=${review.authorId}`} className="text-sm font-medium text-stone-900 hover:text-emerald-700 transition-colors">
                                {review.authorName}
                              </Link>
                              <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-sm">
                                <Star className="h-4 w-4 fill-current" />
                                {review.rating}
                              </span>
                            </div>
                            {review.comment && <p className="text-sm text-stone-700 mt-1">{review.comment}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {!myReview && (
                      <div className="rounded-2xl border border-stone-200 p-4 bg-white space-y-3">
                        <p className="text-sm font-medium text-stone-900">Оставить отзыв</p>
                        <div>
                          <label className="block text-sm text-stone-600 mb-1">Оценка</label>
                          <select
                            value={(reviewForms[exchange.id]?.rating ?? 5).toString()}
                            onChange={(event) => {
                              const rating = Number(event.target.value);
                              setReviewForms((prev) => ({
                                ...prev,
                                [exchange.id]: { rating, comment: prev[exchange.id]?.comment || '' },
                              }));
                            }}
                            className="block w-full px-3 py-2 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {[5, 4, 3, 2, 1].map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-stone-600 mb-1">Комментарий</label>
                          <textarea
                            rows={2}
                            value={reviewForms[exchange.id]?.comment || ''}
                            onChange={(event) => {
                              const comment = event.target.value;
                              setReviewForms((prev) => ({
                                ...prev,
                                [exchange.id]: { rating: prev[exchange.id]?.rating ?? 5, comment },
                              }));
                            }}
                            className="block w-full px-3 py-2 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Как прошёл обмен?"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSubmitReview(exchange)}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
                          >
                            Отправить отзыв
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
