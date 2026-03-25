'use client';

import { Sprout, Sun, Snowflake, Leaf } from 'lucide-react';

const seasonalWorks = [
  {
    season: 'Весна',
    months: 'Март - Май',
    icon: Sprout,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
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
    icon: Sun,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
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
    icon: Leaf,
    color: 'text-orange-700 bg-orange-50 border-orange-200',
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
    icon: Snowflake,
    color: 'text-sky-700 bg-sky-50 border-sky-200',
    tasks: [
      'Планирование посадок и закупка семян.',
      'Проверка условий хранения урожая и посадочного материала.',
      'Уход за комнатными растениями и досветка.',
      'Подготовка инвентаря к новому сезону.',
    ],
  },
];

export default function CalendarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Календарь Садовода</h1>
        <p className="text-stone-600 mt-2">Календарь сезоных работ</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {seasonalWorks.map((season) => (
          <section key={season.season} className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${season.color}`}>
                <season.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-stone-900">{season.season}</h2>
                <p className="text-sm text-stone-500">{season.months}</p>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-stone-700">
              {season.tasks.map((task) => (
                <li key={task} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-stone-400" />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      </div>
  );
}
