import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  Search,
  RefreshCw,
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Droplets,
  Wind,
  Thermometer,
  Trash2,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { IOSAlert } from '../common/IOSAlert';

export interface WeatherCity {
  id: string;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherDataCache {
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
  };
  todayMax: number;
  todayMin: number;
  hourly: Array<{
    time: string;
    temperature: number;
    weatherCode: number;
  }>;
  daily: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
  }>;
  updatedAt: number;
}

const WEATHER_CITIES_STORAGE_KEY = 'ios_weather_cities_v1';
const WEATHER_CACHE_STORAGE_KEY = 'ios_weather_cache_v1';

const DEFAULT_INITIAL_CITY: WeatherCity = {
  id: 'beijing_default',
  name: '北京',
  admin1: '北京市',
  country: '中国',
  latitude: 39.9042,
  longitude: 116.4074,
};

// Map WMO weather codes to Chinese text and appropriate Lucide icon
export function getWeatherMeta(code: number) {
  switch (code) {
    case 0:
      return { text: '晴', icon: 'Sun' };
    case 1:
      return { text: '大部分晴', icon: 'CloudSun' };
    case 2:
      return { text: '多云', icon: 'CloudSun' };
    case 3:
      return { text: '阴', icon: 'Cloud' };
    case 45:
    case 48:
      return { text: '雾', icon: 'CloudFog' };
    case 51:
    case 53:
    case 55:
      return { text: '毛毛雨', icon: 'CloudDrizzle' };
    case 56:
    case 57:
      return { text: '冻毛毛雨', icon: 'CloudDrizzle' };
    case 61:
      return { text: '小雨', icon: 'CloudRain' };
    case 63:
      return { text: '中雨', icon: 'CloudRain' };
    case 65:
      return { text: '大雨', icon: 'CloudRain' };
    case 66:
    case 67:
      return { text: '冻雨', icon: 'CloudRain' };
    case 71:
      return { text: '小雪', icon: 'CloudSnow' };
    case 73:
      return { text: '中雪', icon: 'CloudSnow' };
    case 75:
      return { text: '大雪', icon: 'CloudSnow' };
    case 77:
      return { text: '雪粒', icon: 'CloudSnow' };
    case 80:
    case 81:
      return { text: '阵雨', icon: 'CloudRain' };
    case 82:
      return { text: '暴雨', icon: 'CloudRain' };
    case 85:
    case 86:
      return { text: '阵雪', icon: 'CloudSnow' };
    case 95:
      return { text: '雷阵雨', icon: 'CloudLightning' };
    case 96:
    case 99:
      return { text: '雷阵雨伴冰雹', icon: 'CloudLightning' };
    default:
      return { text: '晴', icon: 'Sun' };
  }
}

export function renderWeatherIcon(iconName: string, size = 20, className = 'text-neutral-300') {
  switch (iconName) {
    case 'Sun':
      return <Sun size={size} className={className} />;
    case 'CloudSun':
      return <CloudSun size={size} className={className} />;
    case 'Cloud':
      return <Cloud size={size} className={className} />;
    case 'CloudFog':
      return <CloudFog size={size} className={className} />;
    case 'CloudDrizzle':
      return <CloudDrizzle size={size} className={className} />;
    case 'CloudRain':
      return <CloudRain size={size} className={className} />;
    case 'CloudSnow':
      return <CloudSnow size={size} className={className} />;
    case 'CloudLightning':
      return <CloudLightning size={size} className={className} />;
    default:
      return <Sun size={size} className={className} />;
  }
}

export const WeatherApp: React.FC = () => {
  const { goHome } = useChat();

  // 1. Saved cities list with persistence
  const [cities, setCities] = useState<WeatherCity[]>(() => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const raw = localStorage.getItem(WEATHER_CITIES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load weather cities', e);
    }
    return [DEFAULT_INITIAL_CITY];
  });

  const saveCities = (newCities: WeatherCity[]) => {
    setCities(newCities);
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.setItem(WEATHER_CITIES_STORAGE_KEY, JSON.stringify(newCities));
      }
    } catch (e) {
      console.error('Failed to save weather cities', e);
    }
  };

  // 2. Weather data cache by city ID
  const [weatherCache, setWeatherCache] = useState<Record<string, WeatherDataCache>>(() => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const raw = localStorage.getItem(WEATHER_CACHE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load weather cache', e);
    }
    return {};
  });

  const saveWeatherCache = (newCache: Record<string, WeatherDataCache>) => {
    setWeatherCache(newCache);
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.setItem(WEATHER_CACHE_STORAGE_KEY, JSON.stringify(newCache));
      }
    } catch (e) {
      console.warn('Failed to save weather cache', e);
    }
  };

  // 3. UI states
  const [activeCityId, setActiveCityId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WeatherCity[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Context menu for deletion
  const [contextMenuCity, setContextMenuCity] = useState<WeatherCity | null>(null);
  const [deleteConfirmCity, setDeleteConfirmCity] = useState<WeatherCity | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch weather data for a single city from Open-Meteo
  const fetchCityWeather = useCallback(async (city: WeatherCity): Promise<WeatherDataCache | null> => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      const current = {
        temperature: Math.round(data.current?.temperature_2m ?? 0),
        apparentTemperature: Math.round(data.current?.apparent_temperature ?? 0),
        humidity: Math.round(data.current?.relative_humidity_2m ?? 0),
        windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
        weatherCode: data.current?.weather_code ?? 0,
      };

      const todayMax = Math.round(data.daily?.temperature_2m_max?.[0] ?? current.temperature);
      const todayMin = Math.round(data.daily?.temperature_2m_min?.[0] ?? current.temperature);

      // Hourly data (next 24 hours from current time)
      const hourlyTimes: string[] = data.hourly?.time || [];
      const hourlyTemps: number[] = data.hourly?.temperature_2m || [];
      const hourlyCodes: number[] = data.hourly?.weather_code || [];

      // Find current hour index
      const nowISO = new Date().toISOString().slice(0, 13); // e.g. "2026-10-04T07"
      let startIndex = hourlyTimes.findIndex((t) => t.startsWith(nowISO));
      if (startIndex < 0) startIndex = 0;

      const hourly = hourlyTimes.slice(startIndex, startIndex + 24).map((time, idx) => ({
        time,
        temperature: Math.round(hourlyTemps[startIndex + idx] ?? 0),
        weatherCode: hourlyCodes[startIndex + idx] ?? 0,
      }));

      // Daily data (next 7 days)
      const dailyDates: string[] = data.daily?.time || [];
      const dailyMaxs: number[] = data.daily?.temperature_2m_max || [];
      const dailyMins: number[] = data.daily?.temperature_2m_min || [];
      const dailyCodes: number[] = data.daily?.weather_code || [];

      const daily = dailyDates.slice(0, 7).map((date, idx) => ({
        date,
        maxTemp: Math.round(dailyMaxs[idx] ?? 0),
        minTemp: Math.round(dailyMins[idx] ?? 0),
        weatherCode: dailyCodes[idx] ?? 0,
      }));

      const cacheItem: WeatherDataCache = {
        current,
        todayMax,
        todayMin,
        hourly,
        daily,
        updatedAt: Date.now(),
      };

      return cacheItem;
    } catch (err) {
      console.warn(`Weather fetch failed for ${city.name}`, err);
      return null;
    }
  }, []);

  // Refresh all cities
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    setFetchError(null);
    let successCount = 0;
    const newCache = { ...weatherCache };

    for (const city of cities) {
      const data = await fetchCityWeather(city);
      if (data) {
        newCache[city.id] = data;
        successCount++;
      }
    }

    if (successCount > 0) {
      saveWeatherCache(newCache);
    } else if (cities.length > 0) {
      setFetchError('获取失败，请稍后重试');
    }
    setIsRefreshing(false);
  }, [cities, fetchCityWeather, weatherCache]);

  // Initial fetch on mount if cities have no cache
  useEffect(() => {
    const missing = cities.some((c) => !weatherCache[c.id]);
    if (missing) {
      handleRefreshAll();
    }
  }, [cities, handleRefreshAll, weatherCache]);

  // Search cities via Open-Meteo Geocoding API
  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const trimmed = text.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          trimmed
        )}&count=5&language=zh`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();

        if (Array.isArray(data.results)) {
          const mapped: WeatherCity[] = data.results.map((r: { id: number; name: string; admin1?: string; country?: string; latitude: number; longitude: number }) => ({
            id: `city_${r.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: r.name,
            admin1: r.admin1,
            country: r.country,
            latitude: r.latitude,
            longitude: r.longitude,
          }));
          setSearchResults(mapped);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.warn('City search failed', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  // Add city from search results
  const handleSelectCityToAdd = async (city: WeatherCity) => {
    const exists = cities.some(
      (c) =>
        Math.abs(c.latitude - city.latitude) < 0.05 &&
        Math.abs(c.longitude - city.longitude) < 0.05
    );

    if (!exists) {
      const nextCities = [...cities, city];
      saveCities(nextCities);
      // Fetch its weather
      const data = await fetchCityWeather(city);
      if (data) {
        saveWeatherCache({ ...weatherCache, [city.id]: data });
      }
    }

    setSearchQuery('');
    setSearchResults([]);
    setActiveCityId(city.id);
  };

  // Delete city
  const handleDeleteCity = (cityId: string) => {
    const nextCities = cities.filter((c) => c.id !== cityId);
    saveCities(nextCities);
    if (activeCityId === cityId) {
      setActiveCityId(null);
    }
    setDeleteConfirmCity(null);
    setContextMenuCity(null);
  };

  // Pointer events for long press on city card
  const handleCityPointerDown = (city: WeatherCity) => {
    longPressTimerRef.current = setTimeout(() => {
      setContextMenuCity(city);
      longPressTimerRef.current = null;
    }, 450);
  };

  const handleCityPointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Currently viewed city
  const currentCity = useMemo(() => {
    return cities.find((c) => c.id === activeCityId) || null;
  }, [cities, activeCityId]);

  const currentWeatherData = activeCityId ? weatherCache[activeCityId] : null;

  // Format date helper for 7-day forecast
  const formatDayLabel = (dateStr: string, idx: number) => {
    if (idx === 0) return '今天';
    try {
      const d = new Date(dateStr);
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return days[d.getDay()];
    } catch {
      return dateStr;
    }
  };

  // Format hour label for 24h forecast
  const formatHourLabel = (timeStr: string, idx: number) => {
    if (idx === 0) return '现在';
    try {
      const parts = timeStr.split('T');
      if (parts[1]) {
        return parts[1].slice(0, 5);
      }
    } catch {}
    return timeStr;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#1C1C1E] select-none text-white relative overflow-hidden">
      {/* ================= VIEW 1: 城市列表 (CITY LIST) ================= */}
      {!activeCityId && (
        <div className="w-full h-full flex flex-col">
          {/* Top Header */}
          <div className="ios-safe-header pb-2 px-4 bg-[#1C1C1E]/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20 shrink-0">
            <div className="flex items-center justify-between h-9 mb-1">
              <button
                type="button"
                onClick={goHome}
                className="ios-back-btn text-[15px] font-normal text-neutral-300 hover:text-white active:opacity-60 transition-opacity pr-2 cursor-pointer"
                title="返回桌面 (Esc)"
              >
                <ChevronLeft size={22} className="-mr-0.5 text-neutral-300" />
                <span>返回</span>
              </button>

              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                className="min-w-[44px] min-h-[44px] flex items-center justify-end text-neutral-300 hover:text-white active:scale-95 transition-all cursor-pointer"
                title="刷新天气"
              >
                <RefreshCw size={19} className={isRefreshing ? 'animate-spin text-white' : ''} />
              </button>
            </div>

            <div className="flex items-baseline justify-between">
              <h1 className="text-[26px] font-bold tracking-tight text-white">
                天气
              </h1>
              <span className="text-[12px] text-neutral-400 font-normal">
                {cities.length} 个城市
              </span>
            </div>

            {/* City Search Bar */}
            <div className="mt-2 relative">
              <Search size={15} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                placeholder="搜索城市名称（如：上海、广州、深圳）..."
                className="w-full h-9 pl-9 pr-8 text-[14px] bg-white/10 rounded-xl text-white placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-white/30 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 top-2.5 text-xs text-neutral-400 hover:text-white bg-neutral-700 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
                >
                  <X size={10} />
                </button>
              )}

              {/* Search Results Dropdown */}
              {(searchResults.length > 0 || isSearching) && (
                <div className="absolute top-11 left-0 right-0 z-30 bg-[#2C2C2E] border border-white/15 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/10 animate-in fade-in zoom-in-95 duration-150">
                  {isSearching ? (
                    <div className="p-4 text-center text-[13px] text-neutral-400">正在搜索城市...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-[13px] text-neutral-400">未找到相关城市</div>
                  ) : (
                    searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => handleSelectCityToAdd(result)}
                        className="p-3 hover:bg-white/5 active:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div>
                          <h4 className="text-[14px] font-semibold text-white">{result.name}</h4>
                          <p className="text-[11px] text-neutral-400">
                            {[result.admin1, result.country].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <span className="text-[12px] text-neutral-300">添加</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Network/Fetch Error Notice */}
          {fetchError && (
            <div className="mx-4 mt-2 px-3 py-2 bg-red-500/15 border border-red-500/30 rounded-xl text-[12px] text-red-300 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                type="button"
                onClick={handleRefreshAll}
                className="underline font-semibold cursor-pointer text-white"
              >
                重试
              </button>
            </div>
          )}

          {/* City Cards List */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
            }}
          >
            {cities.length === 0 ? (
              <div className="py-24 text-center text-neutral-400 flex flex-col items-center justify-center">
                <Sun size={40} className="text-neutral-600 mb-2" />
                <p className="text-[15px] font-medium text-neutral-300">暂无添加的天气城市</p>
                <p className="text-[12px] text-neutral-500 mt-1">在上方搜索框搜索并添加城市</p>
              </div>
            ) : (
              cities.map((city) => {
                const data = weatherCache[city.id];
                const weatherMeta = data ? getWeatherMeta(data.current.weatherCode) : null;
                const isOffline = data && Date.now() - data.updatedAt > 1000 * 60 * 60; // >1h considered cached

                return (
                  <div
                    key={city.id}
                    onPointerDown={() => handleCityPointerDown(city)}
                    onPointerUp={handleCityPointerUp}
                    onClick={() => setActiveCityId(city.id)}
                    className="p-4 bg-gradient-to-r from-[#2C2C2E] to-[#343438] rounded-2xl shadow-sm border border-white/5 active:scale-[0.99] transition-all cursor-pointer select-none flex items-center justify-between relative overflow-hidden"
                  >
                    {/* Left: City Name, Weather Description, High/Low */}
                    <div className="min-w-0 pr-3 z-10">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[20px] font-bold text-white tracking-tight truncate">
                          {city.name}
                        </h3>
                        {isOffline && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-neutral-400 font-mono">
                            离线数据
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-neutral-300 mt-0.5">
                        {weatherMeta ? weatherMeta.text : '加载中...'}
                      </p>
                      {data ? (
                        <p className="text-[12px] text-neutral-400 mt-2 font-mono">
                          最高 {data.todayMax}° · 最低 {data.todayMin}°
                        </p>
                      ) : (
                        <p className="text-[12px] text-neutral-500 mt-2">正在获取实时数据...</p>
                      )}
                    </div>

                    {/* Right: Current Temp & Weather Icon */}
                    <div className="flex flex-col items-end shrink-0 z-10">
                      {weatherMeta && (
                        <div className="mb-1">
                          {renderWeatherIcon(weatherMeta.icon, 28, 'text-neutral-200')}
                        </div>
                      )}
                      <div className="text-[34px] font-light font-mono text-white tracking-tight leading-none">
                        {data ? `${data.current.temperature}°` : '--°'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <p className="text-[11px] text-neutral-500 text-center pt-2">
              点击查看 24 小时及 7 天预报 · 长按城市可删除
            </p>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: 城市详情 (CITY DETAIL VIEW) ================= */}
      {activeCityId && currentCity && (
        <div className="w-full h-full flex flex-col animate-in slide-in-from-right duration-200">
          {/* Detail Header */}
          <div className="ios-safe-header px-4 bg-[#1C1C1E]/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20 shrink-0">
            <div className="h-11 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveCityId(null)}
                className="ios-back-btn text-[15px] font-normal text-neutral-300 hover:text-white active:opacity-60 transition-opacity pr-2 cursor-pointer"
              >
                <ChevronLeft size={22} className="-mr-0.5 text-neutral-300" />
                <span>城市列表</span>
              </button>

              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                className="min-w-[44px] min-h-[44px] flex items-center justify-end text-neutral-300 hover:text-white active:scale-95 transition-all cursor-pointer"
                title="刷新"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-white' : ''} />
              </button>
            </div>
          </div>

          {/* Detail Body */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            }}
          >
            {/* Hero Weather Section */}
            <div className="text-center py-4">
              <h2 className="text-[26px] font-bold text-white tracking-tight">
                {currentCity.name}
              </h2>
              {currentWeatherData ? (
                <>
                  <div className="text-[68px] font-extralight font-mono text-white tracking-tighter mt-1 leading-none">
                    {currentWeatherData.current.temperature}°
                  </div>
                  <div className="text-[17px] font-medium text-neutral-300 mt-2 flex items-center justify-center gap-2">
                    {renderWeatherIcon(getWeatherMeta(currentWeatherData.current.weatherCode).icon, 20)}
                    <span>{getWeatherMeta(currentWeatherData.current.weatherCode).text}</span>
                  </div>
                  <div className="text-[13px] text-neutral-400 mt-1 font-mono">
                    最高 {currentWeatherData.todayMax}° · 最低 {currentWeatherData.todayMin}°
                  </div>

                  {/* Weather Indicators: Apparent Temp, Humidity, Wind */}
                  <div className="grid grid-cols-3 gap-2 mt-5 max-w-[340px] mx-auto">
                    <div className="bg-[#2C2C2E] rounded-2xl p-2.5 text-center border border-white/5 shadow-xs">
                      <div className="flex items-center justify-center text-neutral-400 mb-1">
                        <Thermometer size={16} />
                      </div>
                      <div className="text-[10px] text-neutral-400">体感温度</div>
                      <div className="text-[15px] font-semibold text-white font-mono mt-0.5">
                        {currentWeatherData.current.apparentTemperature}°
                      </div>
                    </div>

                    <div className="bg-[#2C2C2E] rounded-2xl p-2.5 text-center border border-white/5 shadow-xs">
                      <div className="flex items-center justify-center text-neutral-400 mb-1">
                        <Droplets size={16} />
                      </div>
                      <div className="text-[10px] text-neutral-400">湿度</div>
                      <div className="text-[15px] font-semibold text-white font-mono mt-0.5">
                        {currentWeatherData.current.humidity}%
                      </div>
                    </div>

                    <div className="bg-[#2C2C2E] rounded-2xl p-2.5 text-center border border-white/5 shadow-xs">
                      <div className="flex items-center justify-center text-neutral-400 mb-1">
                        <Wind size={16} />
                      </div>
                      <div className="text-[10px] text-neutral-400">风速</div>
                      <div className="text-[15px] font-semibold text-white font-mono mt-0.5">
                        {currentWeatherData.current.windSpeed} km/h
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-neutral-400">
                  <p className="text-[14px]">正在获取实时天气...</p>
                </div>
              )}
            </div>

            {/* 24-Hour Forecast (Horizontal Scroll) */}
            {currentWeatherData && currentWeatherData.hourly?.length > 0 && (
              <div className="bg-[#2C2C2E] rounded-3xl p-4 border border-white/5 shadow-sm">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                  <Clock size={14} />
                  <span>未来 24 小时预报</span>
                </div>

                <div className="overflow-x-auto flex gap-4 pb-2 scrollbar-none">
                  {currentWeatherData.hourly.map((h, idx) => {
                    const meta = getWeatherMeta(h.weatherCode);
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-2 min-w-[50px] shrink-0"
                      >
                        <span className="text-[12px] text-neutral-400 font-mono">
                          {formatHourLabel(h.time, idx)}
                        </span>
                        <div>{renderWeatherIcon(meta.icon, 22, 'text-neutral-200')}</div>
                        <span className="text-[15px] font-semibold text-white font-mono">
                          {h.temperature}°
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7-Day Forecast (Vertical List) */}
            {currentWeatherData && currentWeatherData.daily?.length > 0 && (
              <div className="bg-[#2C2C2E] rounded-3xl p-4 border border-white/5 shadow-sm">
                <div className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                  未来 7 天天气预报
                </div>

                <div className="divide-y divide-white/5">
                  {currentWeatherData.daily.map((day, idx) => {
                    const meta = getWeatherMeta(day.weatherCode);
                    return (
                      <div
                        key={idx}
                        className="py-2.5 flex items-center justify-between text-[14px]"
                      >
                        {/* Day Name */}
                        <div className="w-16 font-medium text-white">
                          {formatDayLabel(day.date, idx)}
                        </div>

                        {/* Weather Icon & Label */}
                        <div className="flex items-center gap-2 w-28">
                          {renderWeatherIcon(meta.icon, 18, 'text-neutral-300')}
                          <span className="text-[13px] text-neutral-300 truncate">{meta.text}</span>
                        </div>

                        {/* Temp Range Bar */}
                        <div className="flex items-center gap-2 font-mono text-[13px] text-right">
                          <span className="text-neutral-400">{day.minTemp}°</span>
                          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-neutral-500 to-white rounded-full opacity-60" />
                          </div>
                          <span className="text-white font-semibold">{day.maxTemp}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= LONG-PRESS CONTEXT MENU ================= */}
      {contextMenuCity && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setContextMenuCity(null)}
        >
          <div
            className="w-full bg-[#2C2C2E] rounded-t-[26px] p-4 space-y-2 animate-in slide-in-from-bottom duration-200 border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            }}
          >
            <div className="bg-[#3A3A3C] rounded-2xl overflow-hidden divide-y divide-white/10 text-[16px]">
              <div className="px-4 py-3 text-[13px] text-neutral-400 text-center border-b border-white/10">
                {contextMenuCity.name}
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmCity(contextMenuCity);
                  setContextMenuCity(null);
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between text-[#FF453A] active:bg-white/5 cursor-pointer font-medium"
              >
                <span>删除此城市</span>
                <Trash2 size={17} className="text-[#FF453A]" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setContextMenuCity(null)}
              className="w-full py-3.5 bg-[#3A3A3C] rounded-2xl text-[16px] font-semibold text-white active:bg-white/10 cursor-pointer text-center"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION ALERT ================= */}
      <IOSAlert
        isOpen={Boolean(deleteConfirmCity)}
        title="删除城市"
        message={`确定要从天气列表中删除“${deleteConfirmCity?.name}”吗？`}
        confirmText="删除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          if (deleteConfirmCity) {
            handleDeleteCity(deleteConfirmCity.id);
          }
        }}
        onCancel={() => setDeleteConfirmCity(null)}
      />
    </div>
  );
};
