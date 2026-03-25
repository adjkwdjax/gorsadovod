'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { profileService } from '@/services/api';
import { TradeReview } from '@/types/api';
import { User, Star, X } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<TradeReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;

    const loadProfileAndReviews = async () => {
      try {
        setReviewsLoading(true);
        const [freshUser, reviewsData] = await Promise.all([
          profileService.getPublicProfile(user.id),
          profileService.getReviews(user.id),
        ]);
        updateUser(freshUser);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Failed to load profile or reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadProfileAndReviews();
  }, [user?.id]);

  const openModal = () => {
    if (!user) return;

    setFormValues({
      username: user.username,
      email: user.email,
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await profileService.updateMe({
        username: formValues.username.trim(),
        email: formValues.email.trim(),
      });

      updateUser(updatedUser);
      setSuccessMessage('Профиль обновлен.');
      setIsModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось обновить профиль.';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Личный кабинет</h1>
          <p className="text-stone-600 mt-2">Управление профилем и настройками.</p>
          {successMessage && (
            <p className="mt-3 text-sm text-emerald-700">{successMessage}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 text-center">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-12 w-12" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">{user.username}</h2>
              <p className="text-stone-500 text-sm mb-4">{user.email}</p>

              <div className="flex items-center justify-center gap-2 text-amber-500 mb-6">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-bold text-lg">{user.rating}</span>
                <span className="text-stone-400 text-sm">(рейтинг)</span>
              </div>

              <button
                onClick={openModal}
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-colors"
              >
                Редактировать профиль
              </button>

              <div className="mt-6 pt-5 border-t border-stone-100 text-left">
                <h3 className="text-sm font-semibold text-stone-900 mb-2">Мои клубы</h3>
                {user.clubs && user.clubs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.clubs.map((club) => (
                      <Link
                        key={club.id}
                        href={`/clubs/club?id=${club.id}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        {club.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">Вы пока не состоите в клубах.</p>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Отзывы об обменах</h3>
              {reviewsLoading ? (
                <p className="text-sm text-stone-500">Загрузка отзывов...</p>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-stone-500">Отзывов пока нет</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-stone-200 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <Link href={`/profile?id=${review.authorId}`} className="font-medium text-sm text-stone-900 hover:text-emerald-700 transition-colors">
                            {review.authorName}
                          </Link>
                          <p className="text-xs text-stone-500">
                            {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-semibold text-sm">{review.rating}</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-stone-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">Редактирование профиля</h2>
                <p className="text-sm text-stone-500 mt-1">Данные сохраняются через PUT /api/profiles/me/</p>
              </div>
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-50"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="block text-sm font-medium text-stone-700 mb-1">Имя пользователя</span>
                <input
                  type="text"
                  value={formValues.username}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, username: event.target.value }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  required
                  disabled={isSaving}
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-stone-700 mb-1">Email</span>
                <input
                  type="email"
                  value={formValues.email}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  required
                  disabled={isSaving}
                />
              </label>

              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
