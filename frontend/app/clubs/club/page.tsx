'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clubService } from '@/services/api';
import { ClubDetail } from '@/types/api';
import { ArrowLeft, Star, Users } from 'lucide-react';
import Link from 'next/link';

export default function ClubDetailPage() {
  const router = useRouter();
  const [clubId, setClubId] = useState('');
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);

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
    </div>
  );
}
