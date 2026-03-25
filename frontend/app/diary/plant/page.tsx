'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { diaryService } from '@/services/api';
import { DiaryPlantDetail } from '@/types/api';
import { ArrowLeft, Calendar, Image as ImageIcon, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function DiaryPlantPage() {
  const router = useRouter();
  const [plantId, setPlantId] = useState('');
  const [plant, setPlant] = useState<DiaryPlantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setPlantId(query.get('id') || '');
  }, []);

  useEffect(() => {
    if (!plantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    diaryService
      .getPlant(plantId)
      .then((data) => setPlant(data))
      .catch(() => setPlant(null))
      .finally(() => setLoading(false));
  }, [plantId]);

  const sortedEntries = useMemo(() => {
    if (!plant) return [];
    return [...plant.entries].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [plant]);

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plant || !text.trim()) return;

    setSubmitting(true);
    try {
      const created = await diaryService.addEntry(plant.id, {
        date,
        text: text.trim(),
        imageUrl: imageUrl.trim(),
      });

      setPlant((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: [created, ...prev.entries],
          entriesCount: prev.entriesCount + 1,
          latestEntry: created,
        };
      });

      setText('');
      setImageUrl('');
      setDate(new Date().toISOString().slice(0, 10));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось добавить запись.';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-52 bg-stone-200 rounded" />
        <div className="h-40 bg-stone-200 rounded-3xl" />
        <div className="h-72 bg-stone-200 rounded-3xl" />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Растение не найдено</h1>
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
      <Link href="/diary" className="inline-flex items-center text-stone-500 hover:text-stone-900 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Ко всем растениям
      </Link>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
        <h1 className="text-3xl font-bold text-stone-900">{plant.name}</h1>
        <p className="text-stone-600">{plant.description || 'Описание не добавлено.'}</p>
        <div className="text-sm text-stone-500">Всего записей: {plant.entriesCount}</div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-4">Новая запись в историю</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-2">Дата</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-2">Ссылка на фото</span>
              <input
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-stone-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-stone-700 mb-2">Текст записи</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={4}
              placeholder="Что произошло с растением"
              className="w-full resize-none rounded-xl border border-stone-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              required
            />
          </label>

          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            {submitting ? 'Сохранение...' : 'Добавить запись'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-4">История растения</h2>

        {sortedEntries.length === 0 ? (
          <p className="text-stone-500">Пока нет записей. Добавьте первую запись выше.</p>
        ) : (
          <div className="space-y-4">
            {sortedEntries.map((entry) => (
              <article key={entry.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(entry.date)}</span>
                </div>

                <p className="text-stone-800 whitespace-pre-wrap">{entry.text}</p>

                {entry.imageUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-stone-200 bg-white">
                    <img src={entry.imageUrl} alt="Фото записи" className="w-full max-h-80 object-cover" />
                  </div>
                )}

                {!entry.imageUrl && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-stone-400">
                    <ImageIcon className="h-4 w-4" />
                    Фото не добавлено
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
