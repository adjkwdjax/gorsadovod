'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth'; // импорт авторизации из файлов
import { authService } from '@/services/api'; // импорт авторизации из файлов но с api
import { Leaf, Mail, Lock, ArrowRight } from 'lucide-react'; // импорт иконок
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState(''); // State = состояние, email - наш емейл, setEmail 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Роутинг = роутер = маршрутизатор = распределитель маршрутов
  const { login, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.login({ email, password }); // Успех, Ошибка
      login(response.user, response.token);
      alert('Успешный вход');
      router.push('/dashboard');
    } catch (error) {
      alert('Ошибка входа. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  };
  
  if (token) {
    return null; // не рендерим форму, пока выполняется редирект
  }

  return (
    <div className="min-h-[100vh] overflow-y-hidden flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 overflow-y-hidden bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <Leaf className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-stone-900">
            С возвращением!
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Войдите в свой аккаунт Городского Садовода
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Email адрес
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl leading-5 bg-stone-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow"
                  placeholder="ivan@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl leading-5 bg-stone-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-stone-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-stone-900">
                Запомнить меня
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                Забыли пароль?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-70"
            >
              {loading ? 'Вход...' : 'Войти'}
              {!loading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </form>
        <div className="text-center text-sm text-stone-600">
          Нет аккаунта?{' '}
          <Link href="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}
