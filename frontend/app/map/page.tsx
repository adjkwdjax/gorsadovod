'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import { mapService } from '@/services/api';
import { MapLocation } from '@/types/api';
import { Search, MapPin, Filter } from 'lucide-react';

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423];
const DEFAULT_ZOOM = 12;

function escapeHtml(value: string = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default function MapPage() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Все');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [newPoint, setNewPoint] = useState({
    title: '',
    description: '',
    lat: DEFAULT_CENTER[0].toString(),
    lng: DEFAULT_CENTER[1].toString(),
    type: 'Городской сад' as 'Точка обмена' | 'Городской сад',
  });

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let active = true;

    mapService
      .getLocations()
      .then((data) => {
        if (!active) return;
        setLocations(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setLocations([]);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const types = useMemo(() => {
    return ['Все', ...new Set(locations.map((location) => location.type).filter(Boolean))];
  }, [locations]);

  const filteredLocations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return locations.filter((location) => {
      const title = location.title?.toLowerCase() ?? '';
      const description = location.description?.toLowerCase() ?? '';
      const type = location.type?.toLowerCase() ?? '';

      const matchesQuery =
        !normalizedQuery ||
        title.includes(normalizedQuery) ||
        description.includes(normalizedQuery) ||
        type.includes(normalizedQuery);

      const matchesType = selectedType === 'Все' || location.type === selectedType;

      return matchesQuery && matchesType;
    });
  }, [locations, query, selectedType]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapElementRef.current || mapRef.current) return;

      const L = await import('leaflet');
      if (cancelled || !mapElementRef.current) return;

      leafletRef.current = L;

      const map = L.map(mapElementRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 0);
    }

    initMap();

    return () => {
      cancelled = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    async function syncMarkers() {
      if (!mapRef.current) return;

      const L = leafletRef.current ?? (await import('leaflet'));
      leafletRef.current = L;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const validLocations = filteredLocations.filter(
        (location) => Number.isFinite(location.lat) && Number.isFinite(location.lng)
      );

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 9999px;
            background: #059669;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,.18);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
            transform: translate(-50%, -100%);
          ">📍</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -28],
      });

      validLocations.forEach((location) => {
        const marker = L.marker([location.lat, location.lng], { icon }).addTo(mapRef.current);

        marker.bindPopup(`
          <div style="min-width: 220px;">
            <div style="font-size: 16px; font-weight: 700; color: #1c1917;">
              ${escapeHtml(location.title)}
            </div>
            <div style="margin-top: 4px; font-size: 12px; color: #059669; font-weight: 600;">
              ${escapeHtml(location.type)}
            </div>
            <div style="margin-top: 8px; font-size: 13px; color: #57534e; line-height: 1.4;">
              ${escapeHtml(location.description)}
            </div>
          </div>
        `);

        markersRef.current.push(marker);
      });

      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(
          validLocations.map((location) => [location.lat, location.lng] as [number, number])
        );

        mapRef.current.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 15,
        });
      } else {
        mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      }
    }

    syncMarkers();
  }, [filteredLocations]);

  async function handleCreatePoint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    const lat = Number(newPoint.lat);
    const lng = Number(newPoint.lng);

    if (!newPoint.title.trim()) {
      setFormError('Укажите название точки');
      return;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setFormError('Координаты должны быть числами');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setFormError('Координаты вне допустимого диапазона');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await mapService.createLocation({
        title: newPoint.title.trim(),
        description: newPoint.description.trim(),
        lat,
        lng,
        type: newPoint.type,
      });

      setLocations((prev) => [created, ...prev]);
      setNewPoint({
        title: '',
        description: '',
        lat: DEFAULT_CENTER[0].toString(),
        lng: DEFAULT_CENTER[1].toString(),
        type: 'Городской сад',
      });
    } catch {
      setFormError('Не удалось создать точку. Проверьте авторизацию и данные.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Карта Садов</h1>
          <p className="text-stone-600 mt-2">Точки обмена, общественные огороды и клубы.</p>
        </div>

        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-1 md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-xl leading-5 bg-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow"
              placeholder="Поиск мест..."
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-colors whitespace-nowrap"
          >
            <Filter className="h-5 w-5 mr-2" />
            Фильтры
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 shrink-0">
          {types.map((type) => {
            const active = selectedType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={[
                  'px-4 py-2 rounded-full text-sm border transition-colors',
                  active
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50',
                ].join(' ')}
              >
                {type}
              </button>
            );
          })}
        </div>
      )}

      <form
        onSubmit={handleCreatePoint}
        className="grid grid-cols-1 md:grid-cols-6 gap-3 shrink-0 p-4 border border-stone-200 rounded-2xl bg-white"
      >
        <input
          type="text"
          value={newPoint.title}
          onChange={(event) => setNewPoint((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Название точки"
          className="md:col-span-2 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
          type="text"
          value={newPoint.description}
          onChange={(event) => setNewPoint((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Описание"
          className="md:col-span-2 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={newPoint.type}
          onChange={(event) =>
            setNewPoint((prev) => ({ ...prev, type: event.target.value as 'Точка обмена' | 'Городской сад' }))
          }
          className="px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="Городской сад">Городской сад</option>
          <option value="Точка обмена">Точка обмена</option>
        </select>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Сохранение...' : 'Добавить точку'}
        </button>

        <input
          type="text"
          value={newPoint.lat}
          onChange={(event) => setNewPoint((prev) => ({ ...prev, lat: event.target.value }))}
          placeholder="Широта"
          className="px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
          type="text"
          value={newPoint.lng}
          onChange={(event) => setNewPoint((prev) => ({ ...prev, lng: event.target.value }))}
          placeholder="Долгота"
          className="px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="md:col-span-4 flex items-center text-xs text-stone-500">
          Координаты можно взять из карт: сначала широта, затем долгота.
        </div>

        {formError && (
          <div className="md:col-span-6 text-sm text-red-600">{formError}</div>
        )}
      </form>

      <div className="flex-1 rounded-3xl overflow-hidden border border-stone-200 shadow-sm relative z-0 bg-stone-100">
        <div ref={mapElementRef} className="h-full w-full" />

        <div className="absolute top-4 left-4 z-[500] bg-white/95 backdrop-blur rounded-2xl shadow-sm border border-stone-200 px-4 py-3">
          <div className="flex items-center gap-2 text-stone-900 font-medium">
            <MapPin className="h-4 w-4 text-emerald-600" />
            {isLoading ? 'Загрузка...' : `Найдено: ${filteredLocations.length}`}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Клик по маркеру открывает описание точки
          </div>
        </div>

        {!isLoading && filteredLocations.length === 0 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center z-[500] pointer-events-none">
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-sm border border-stone-200 px-4 py-3 text-sm text-stone-600">
              По текущему фильтру ничего не найдено
            </div>
          </div>
        )}
      </div>
    </div>
  );
}