'use client';

import { useEffect, useMemo, useState } from 'react';
import { Leaf, PencilLine, Save, Snowflake, Sprout, Sun, X } from 'lucide-react';
import { calendarService } from '@/services/api';
import { CalendarSeasonWork } from '@/types/api';

const fallbackCalendar: CalendarSeasonWork[] = [
  {
    season: 'Весна',
    months: 'Март - Май',
    tasks: [
      'Посев рассады: томаты, перцы, зелень.',
      'Подготовка грунта и емкостей для посадки.',
      'Высадка холодостойких культур на балкон.',
      'Первая подкормка рассады и профилактика вредителей.',
    ],
  },
  {
    season: 'Лето',
    months: 'Июнь - Август',
    tasks: [
      'Регулярный полив утром или вечером.',
      'Подкормка растений каждые 2-3 недели.',
      'Пасынкование и подвязка томатов.',
      'Сбор урожая зелени, огурцов и томатов.',
    ],
  },
  {
    season: 'Осень',
    months: 'Сентябрь - Ноябрь',
    tasks: [
      'Уборка последних культур и подготовка к хранению.',
      'Сбор и сортировка семян на следующий сезон.',
      'Обработка почвы и дезинфекция контейнеров.',
      'Посев микрозелени и салатов для дома.',
    ],
  },
  {
    season: 'Зима',
    months: 'Декабрь - Февраль',
    tasks: [
      'Планирование посадок и закупка семян.',
      'Проверка условий хранения урожая и посадочного материала.',
      'Уход за комнатными растениями и досветка.',
      'Подготовка инвентаря к новому сезону.',
    ],
  },
];

type SeasonVisual = {
  icon: typeof Sprout;
  color: string;
};

type DraftCalendarSeasonWork = CalendarSeasonWork & {
  tasksText: string;
};

function getSeasonVisual(seasonName: string): SeasonVisual {
  const normalized = seasonName.toLowerCase();

  if (normalized.includes('вес')) {
    return {
      icon: Sprout,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    };
  }

  if (normalized.includes('лет')) {
    return {
      icon: Sun,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    };
  }

  if (normalized.includes('осен')) {
    return {
      icon: Leaf,
      color: 'text-orange-700 bg-orange-50 border-orange-200',
    };
  }

  if (normalized.includes('зим')) {
    return {
      icon: Snowflake,
      color: 'text-sky-700 bg-sky-50 border-sky-200',
    };
  }

  return {
    icon: Leaf,
    color: 'text-stone-700 bg-stone-50 border-stone-200',
  };
}

export default function CalendarPage() {
  const [seasonalWorks, setSeasonalWorks] = useState<CalendarSeasonWork[]>(fallbackCalendar);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftWorks, setDraftWorks] = useState<DraftCalendarSeasonWork[]>([]);

  useEffect(() => {
    let active = true;

    calendarService
      .getCalendar()
      .then((data) => {
        if (!active) {
          return;
        }

        const results = Array.isArray(data.results) && data.results.length > 0
          ? data.results
          : fallbackCalendar;

        setSeasonalWorks(results);
        setCanEdit(Boolean(data.canEdit));
      })
      .catch(() => {
        if (active) {
          setSeasonalWorks(fallbackCalendar);
          setCanEdit(false);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const normalizedDraft = useMemo(() => {
    return draftWorks.map((item) => {
      const tasks = item.tasksText
        .split('\n')
        .map((task) => task.trim())
        .filter(Boolean);

      return {
        season: item.season.trim(),
        months: item.months.trim(),
        tasks,
      } satisfies CalendarSeasonWork;
    });
  }, [draftWorks]);

  const openEditMode = () => {
    setDraftWorks(
      seasonalWorks.map((item) => ({
        ...item,
        tasksText: item.tasks.join('\n'),
      }))
    );
    setIsEditing(true);
  };

  const closeEditMode = () => {
    setDraftWorks([]);
    setIsEditing(false);
  };

  const updateDraftMonths = (index: number, months: string) => {
    setDraftWorks((prev) => prev.map((item, itemIndex) => (
      itemIndex === index
        ? { ...item, months }
        : item
    )));
  };

  const updateDraftTasks = (index: number, tasksText: string) => {
    setDraftWorks((prev) => prev.map((item, itemIndex) => (
      itemIndex === index
        ? { ...item, tasksText }
        : item
    )));
  };

  const saveCalendar = async () => {
    if (saving) {
      return;
    }

    if (!normalizedDraft.length) {
      alert('Календарь не может быть пустым.');
      return;
    }

    const hasInvalidRow = normalizedDraft.some((item) => !item.season || !item.months || item.tasks.length === 0);
    if (hasInvalidRow) {
      alert('Для каждого сезона укажите месяцы и минимум одну задачу.');
      return;
    }

    setSaving(true);
    try {
      const data = await calendarService.updateCalendar({ results: normalizedDraft });
      setSeasonalWorks(data.results.length > 0 ? data.results : fallbackCalendar);
      setCanEdit(Boolean(data.canEdit));
      setDraftWorks([]);
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось сохранить календарь.';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-10 bg-stone-200 rounded w-64 animate-pulse" />
          <div className="h-5 bg-stone-200 rounded w-72 animate-pulse" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 space-y-4 animate-pulse">
              <div className="h-8 bg-stone-200 rounded w-40" />
              <div className="h-4 bg-stone-200 rounded w-32" />
              <div className="h-4 bg-stone-200 rounded w-full" />
              <div className="h-4 bg-stone-200 rounded w-5/6" />
              <div className="h-4 bg-stone-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayedWorks = isEditing ? draftWorks : seasonalWorks;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Календарь Садовода</h1>
          <p className="text-stone-600 mt-2">Календарь сезонных работ</p>
        </div>

        {canEdit && !isEditing && (
          <button
            type="button"
            onClick={openEditMode}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors whitespace-nowrap"
          >
            <PencilLine className="h-4 w-4 mr-2" />
            Редактировать
          </button>
        )}

        {canEdit && isEditing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeEditMode}
              disabled={saving}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-60"
            >
              <X className="h-4 w-4 mr-2" />
              Отмена
            </button>

            <button
              type="button"
              onClick={saveCalendar}
              disabled={saving}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-60"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {displayedWorks.map((season, index) => {
          const visual = getSeasonVisual(season.season);
          const Icon = visual.icon;

          return (
          <section key={`${season.season}-${index}`} className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${visual.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-stone-900">{season.season}</h2>
                {!isEditing && <p className="text-sm text-stone-500">{season.months}</p>}
              </div>
            </div>

            {!isEditing && (
              <ul className="space-y-2 text-sm text-stone-700">
                {season.tasks.map((task) => (
                  <li key={task} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-stone-400" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            )}

            {isEditing && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Месяцы</label>
                  <input
                    type="text"
                    value={draftWorks[index]?.months || ''}
                    onChange={(event) => updateDraftMonths(index, event.target.value)}
                    className="block w-full px-4 py-2.5 border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Например: Март - Май"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Список работ (каждая задача с новой строки)
                  </label>
                  <textarea
                    value={draftWorks[index]?.tasksText || ''}
                    onChange={(event) => updateDraftTasks(index, event.target.value)}
                    rows={6}
                    className="block w-full resize-y px-4 py-2.5 border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </section>
          );
        })}
      </div>
    </div>
  );
}
