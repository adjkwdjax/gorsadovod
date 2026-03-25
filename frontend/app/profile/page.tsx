'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { profileService } from '@/services/api';
import { TradeReview, User } from '@/types/api';
import { ArrowLeft, Star, User as UserIcon } from 'lucide-react';

export default function PublicProfilePage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState('');
  const [profile, setProfile] = useState<User | null>(null);
  const [reviews, setReviews] = useState<TradeReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setProfileId(query.get('id') || '');
  }, []);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      profileService.getPublicProfile(profileId),
      profileService.getReviews(profileId),
    ])
      .then(([profileData, reviewsData]) => {
        setProfile(profileData);
        setReviews(reviewsData);
      })
      .catch(() => {
        setProfile(null);
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, [profileId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-40 bg-stone-200 rounded" />
        <div className="h-32 bg-stone-200 rounded-3xl" />
        <div className="h-64 bg-stone-200 rounded-3xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Профиль не найден</h1>
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
      <Link href="/" className="inline-flex items-center text-stone-500 hover:text-stone-900 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        На главную
      </Link>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">{profile.username}</h1>
            <div className="mt-1 inline-flex items-center gap-1 text-amber-600">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-semibold">{profile.rating}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900 mb-3">Клубы пользователя</h2>
          {profile.clubs && profile.clubs.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.clubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/club?id=${club.id}`}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  {club.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-stone-500">Пользователь пока не состоит в клубах.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-4">Отзывы</h2>
        {reviews.length === 0 ? (
          <p className="text-stone-500">Отзывов пока нет.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-stone-200 p-4 bg-stone-50">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href={`/profile?id=${review.authorId}`}
                    className="text-sm font-medium text-stone-900 hover:text-emerald-700 transition-colors"
                  >
                    {review.authorName}
                  </Link>
                  <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium">
                    <Star className="h-4 w-4 fill-current" />
                    {review.rating}
                  </span>
                </div>
                {review.comment && <p className="text-sm text-stone-700 mt-2">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}