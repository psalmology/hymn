import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  Plus,
  Search,
  Globe,
  Timer as StopwatchIcon,
  Hourglass,
  Trash2,
  X,
  Play,
  Pause,
  RotateCcw,
  Bell,
  Clock as ClockIcon,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { IOSAlert } from '../common/IOSAlert';

// Built-in list of at least 25 common global cities with timezones
export interface CityOption {
  id: string;
  name: string;
  country: string;
  timezone: string;
}

export const GLOBAL_CITIES: CityOption[] = [
  { id: 'beijing', name: '北京', country: '中国', timezone: 'Asia/Shanghai' },
  { id: 'london', name: '伦敦', country: '英国', timezone: 'Europe/London' },
  { id: 'new_york', name: '纽约', country: '美国', timezone: 'America/New_York' },
  { id: 'tokyo', name: '东京', country: '日本', timezone: 'Asia/Tokyo' },
  { id: 'paris', name: '巴黎', country: '法国', timezone: 'Europe/Paris' },
  { id: 'sydney', name: '悉尼', country: '澳大利亚', timezone: 'Australia/Sydney' },
  { id: 'los_angeles', name: '洛杉矶', country: '美国', timezone: 'America/Los_Angeles' },
  { id: 'singapore', name: '新加坡', country: '新加坡', timezone: 'Asia/Singapore' },
  { id: 'seoul', name: '首尔', country: '韩国', timezone: 'Asia/Seoul' },
  { id: 'berlin', name: '柏林', country: '德国', timezone: 'Europe/Berlin' },
  { id: 'rome', name: '罗马', country: '意大利', timezone: 'Europe/Rome' },
  { id: 'moscow', name: '莫斯科', country: '俄罗斯', timezone: 'Europe/Moscow' },
  { id: 'dubai', name: '迪拜', country: '阿联酋', timezone: 'Asia/Dubai' },
  { id: 'bangkok', name: '曼谷', country: '泰国', timezone: 'Asia/Bangkok' },
  { id: 'hong_kong', name: '香港', country: '中国', timezone: 'Asia/Hong_Kong' },
  { id: 'taipei', name: '台北', country: '中国台湾', timezone: 'Asia/Taipei' },
  { id: 'san_francisco', name: '旧金山', country: '美国', timezone: 'America/Los_Angeles' },
  { id: 'chicago', name: '芝加哥', country: '美国', timezone: 'America/Chicago' },
  { id: 'toronto', name: '多伦多', country: '加拿大', timezone: 'America/Toronto' },
  { id: 'vancouver', name: '温哥华', country: '加拿大', timezone: 'America/Vancouver' },
  { id: 'cairo', name: '开罗', country: '埃及', timezone: 'Africa/Cairo' },
  { id: 'auckland', name: '奥克兰', country: '新西兰', timezone: 'Pacific/Auckland' },
  { id: 'sao_paulo', name: '圣保罗', country: '巴西', timezone: 'America/Sao_Paulo' },
  { id: 'amsterdam', name: '阿姆斯特丹', country: '荷兰', timezone: 'Europe/Amsterdam' },
  { id: 'zurich', name: '苏黎世', country: '瑞士', timezone: 'Europe/Zurich' },
  { id: 'johannesburg', name: '约翰内斯堡', country: '南非', timezone: 'Africa/Johannesburg' },
  { id: 'madrid', name: '马德里', country: '西班牙', timezone: 'Europe/Madrid' },
];

export interface WorldClockCity {
  id: string;
  name: string;
  timezone: string;
}

export interface LapRecord {
  lapNumber: number;
  lapTime: number; // ms for this lap
  overallTime: number; // total elapsed ms
}

const CLOCK_CITIES_STORAGE_KEY = 'ios_world_clock_cities_v1';
const TIMER_STORAGE_KEY = 'ios_clock_timer_state_v1';

const DEFAULT_CITIES: WorldClockCity[] = [
  { id: 'beijing', name: '北京', timezone: 'Asia/Shanghai' },
  { id: 'london', name: '伦敦', timezone: 'Europe/London' },
  { id: 'new_york', name: '纽约', timezone: 'America/New_York' },
  { id: 'tokyo', name: '东京', timezone: 'Asia/Tokyo' },
];

// Helper to synthesize a pleasant iOS chime bell using Web Audio API
function playTimerChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [659.25, 783.99, 1046.5]; // E5, G5, C6 melodic bell chord
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0, now + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.15 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 1.3);
    });
  } catch (e) {
    console.warn('Web Audio chime playback failed', e);
  }
}

export const ClockApp: React.FC = () => {
  const { goHome } = useChat();

  // Active Bottom Tab: 'world' | 'stopwatch' | 'timer'
  const [activeTab, setActiveTab] = useState<'world' | 'stopwatch' | 'timer'>('world');

  // Live timer tick (updates every second for world clock & background timer)
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // TAB 1: 世界时钟 (World Clock)
  // ==========================================
  const [cities, setCities] = useState<WorldClockCity[]>(() => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const raw = localStorage.getItem(CLOCK_CITIES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load world clock cities', e);
    }
    return DEFAULT_CITIES;
  });

  const saveCities = (newCities: WorldClockCity[]) => {
    setCities(newCities);
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.setItem(CLOCK_CITIES_STORAGE_KEY, JSON.stringify(newCities));
      }
    } catch (e) {
      console.error('Failed to save world clock cities', e);
    }
  };

  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [deleteConfirmCity, setDeleteConfirmCity] = useState<WorldClockCity | null>(null);
  const [contextMenuCity, setContextMenuCity] = useState<WorldClockCity | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const filteredAvailableCities = useMemo(() => {
    const q = citySearchQuery.trim().toLowerCase();
    const existingIds = new Set(cities.map((c) => c.id));
    return GLOBAL_CITIES.filter((c) => {
      if (existingIds.has(c.id)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.timezone.toLowerCase().includes(q)
      );
    });
  }, [citySearchQuery, cities]);

  const handleAddCity = (city: CityOption) => {
    const newCity: WorldClockCity = {
      id: city.id,
      name: city.name,
      timezone: city.timezone,
    };
    saveCities([...cities, newCity]);
    setShowAddCityModal(false);
    setCitySearchQuery('');
  };

  const handleDeleteCity = (cityId: string) => {
    const updated = cities.filter((c) => c.id !== cityId);
    saveCities(updated);
    setDeleteConfirmCity(null);
    setContextMenuCity(null);
  };

  // Compute timezone info for each city
  const getCityTimeData = useCallback((timezone: string) => {
    try {
      const now = new Date();
      // Formatter for time
      const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const timeStr = timeFormatter.format(now);

      // Date comparison (Today, Tomorrow, Yesterday)
      const cityDateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const localDateFormatter = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const cityDate = cityDateFormatter.format(now);
      const localDate = localDateFormatter.format(now);

      let dayDiffText = '今天';
      if (cityDate > localDate) {
        dayDiffText = '明天';
      } else if (cityDate < localDate) {
        dayDiffText = '昨天';
      }

      // Calculate approximate hour difference
      // Get offset in hours
      const localOffsetMinutes = -now.getTimezoneOffset();
      // To find target timezone offset: format string to parts
      const targetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const diffHours = Math.round((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60));

      const sign = diffHours >= 0 ? '+' : '';
      const offsetDesc = `${dayDiffText}，${sign}${diffHours}小时`;

      return { timeStr, offsetDesc };
    } catch {
      return { timeStr: '--:--', offsetDesc: '未知时区' };
    }
  }, []);

  // Long press for city deletion
  const handleCityPointerDown = (city: WorldClockCity) => {
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

  // ==========================================
  // TAB 2: 秒表 (Stopwatch)
  // ==========================================
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchElapsedMs, setStopwatchElapsedMs] = useState(0);
  const [laps, setLaps] = useState<LapRecord[]>([]);

  const stopwatchStartRef = useRef<number>(0);
  const stopwatchBaseRef = useRef<number>(0);
  const stopwatchRafRef = useRef<number | null>(null);

  const updateStopwatch = useCallback(() => {
    const now = performance.now();
    setStopwatchElapsedMs(stopwatchBaseRef.current + (now - stopwatchStartRef.current));
    stopwatchRafRef.current = requestAnimationFrame(updateStopwatch);
  }, []);

  const handleStartStopwatch = () => {
    if (!stopwatchRunning) {
      stopwatchStartRef.current = performance.now();
      setStopwatchRunning(true);
      stopwatchRafRef.current = requestAnimationFrame(updateStopwatch);
    } else {
      if (stopwatchRafRef.current) cancelAnimationFrame(stopwatchRafRef.current);
      stopwatchBaseRef.current = stopwatchElapsedMs;
      setStopwatchRunning(false);
    }
  };

  const handleLapOrReset = () => {
    if (stopwatchRunning) {
      // Add Lap
      const previousTotal = laps.length > 0 ? laps[0].overallTime : 0;
      const currentLapTime = stopwatchElapsedMs - previousTotal;
      const newLap: LapRecord = {
        lapNumber: laps.length + 1,
        lapTime: currentLapTime,
        overallTime: stopwatchElapsedMs,
      };
      setLaps([newLap, ...laps]);
    } else {
      // Reset
      setStopwatchElapsedMs(0);
      stopwatchBaseRef.current = 0;
      setLaps([]);
    }
  };

  // Cleanup stopwatch animation frame on unmount
  useEffect(() => {
    return () => {
      if (stopwatchRafRef.current) cancelAnimationFrame(stopwatchRafRef.current);
    };
  }, []);

  const formatStopwatchTime = (ms: number) => {
    const totalCentis = Math.floor(ms / 10);
    const centis = totalCentis % 100;
    const totalSeconds = Math.floor(totalCentis / 100);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);

    const mStr = minutes.toString().padStart(2, '0');
    const sStr = seconds.toString().padStart(2, '0');
    const cStr = centis.toString().padStart(2, '0');
    return `${mStr}:${sStr}.${cStr}`;
  };

  // Find fastest and slowest laps (only if 2 or more laps)
  const { fastestLapIdx, slowestLapIdx } = useMemo(() => {
    if (laps.length < 2) return { fastestLapIdx: -1, slowestLapIdx: -1 };
    let minTime = Infinity;
    let maxTime = -Infinity;
    let minIdx = -1;
    let maxIdx = -1;

    laps.forEach((l, idx) => {
      if (l.lapTime < minTime) {
        minTime = l.lapTime;
        minIdx = idx;
      }
      if (l.lapTime > maxTime) {
        maxTime = l.lapTime;
        maxIdx = idx;
      }
    });

    return { fastestLapIdx: minIdx, slowestLapIdx: maxIdx };
  }, [laps]);

  // ==========================================
  // TAB 3: 计时器 (Timer)
  // Background persistent countdown with Web Audio chime
  // ==========================================
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Timer run states: 'idle' | 'running' | 'paused'
  const [timerStatus, setTimerStatus] = useState<'idle' | 'running' | 'paused'>(() => {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.status === 'running' || parsed.status === 'paused') {
          return parsed.status;
        }
      }
    } catch {}
    return 'idle';
  });

  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.status === 'running') {
          const diff = Math.max(0, Math.ceil((parsed.targetEndTime - Date.now()) / 1000));
          return diff;
        }
        if (parsed.status === 'paused') {
          return parsed.remainingSeconds || 0;
        }
      }
    } catch {}
    return 300;
  });

  const [timerTotalSeconds, setTimerTotalSeconds] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.totalSeconds) return parsed.totalSeconds;
      }
    } catch {}
    return 300;
  });

  const [timerFinishedAlert, setTimerFinishedAlert] = useState(false);

  // Sync Timer countdown every tick accurately using targetEndTime
  useEffect(() => {
    if (timerStatus !== 'running') return;

    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const target = parsed.targetEndTime;
        if (target) {
          const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
          setTimerRemainingSeconds(remaining);

          if (remaining <= 0) {
            // Timer expired!
            setTimerStatus('idle');
            setTimerFinishedAlert(true);
            playTimerChime();
            localStorage.removeItem(TIMER_STORAGE_KEY);
          }
        }
      }
    } catch {}
  }, [nowTimestamp, timerStatus]);

  const handleStartTimer = () => {
    const totalSec = timerHours * 3600 + timerMinutes * 60 + timerSeconds;
    if (totalSec <= 0) return;

    const targetEndTime = Date.now() + totalSec * 1000;
    setTimerTotalSeconds(totalSec);
    setTimerRemainingSeconds(totalSec);
    setTimerStatus('running');

    try {
      localStorage.setItem(
        TIMER_STORAGE_KEY,
        JSON.stringify({
          status: 'running',
          totalSeconds: totalSec,
          targetEndTime,
        })
      );
    } catch {}
  };

  const handlePauseTimer = () => {
    setTimerStatus('paused');
    try {
      localStorage.setItem(
        TIMER_STORAGE_KEY,
        JSON.stringify({
          status: 'paused',
          totalSeconds: timerTotalSeconds,
          remainingSeconds: timerRemainingSeconds,
        })
      );
    } catch {}
  };

  const handleResumeTimer = () => {
    const targetEndTime = Date.now() + timerRemainingSeconds * 1000;
    setTimerStatus('running');
    try {
      localStorage.setItem(
        TIMER_STORAGE_KEY,
        JSON.stringify({
          status: 'running',
          totalSeconds: timerTotalSeconds,
          targetEndTime,
        })
      );
    } catch {}
  };

  const handleCancelTimer = () => {
    setTimerStatus('idle');
    setTimerRemainingSeconds(timerHours * 3600 + timerMinutes * 60 + timerSeconds);
    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch {}
  };

  const formatTimerHMS = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#1C1C1E] select-none text-white relative overflow-hidden">
      {/* ================= TIMER FINISHED IN-APP BANNER ================= */}
      {timerFinishedAlert && (
        <div className="absolute top-12 left-3 right-3 z-50 animate-in slide-in-from-top-6 duration-300">
          <div className="bg-[#2C2C2E]/95 backdrop-blur-xl text-white rounded-2xl p-4 shadow-2xl border border-white/20 flex items-center justify-between gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF9F0A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bell size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[15px] font-bold text-white">计时器</h4>
              <p className="text-[13px] text-neutral-300 mt-0.5">计时完成！</p>
            </div>
            <button
              type="button"
              onClick={() => setTimerFinishedAlert(false)}
              className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[13px] font-semibold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              好
            </button>
          </div>
        </div>
      )}

      {/* ================= TOP NAVIGATION HEADER ================= */}
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

          {activeTab === 'world' && (
            <button
              type="button"
              onClick={() => setShowAddCityModal(true)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-end text-[#FF9F0A] hover:text-[#FFAE2B] cursor-pointer"
              title="添加城市"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="flex items-baseline justify-between">
          <h1 className="text-[26px] font-bold tracking-tight text-white">
            {activeTab === 'world' && '世界时钟'}
            {activeTab === 'stopwatch' && '秒表'}
            {activeTab === 'timer' && '计时器'}
          </h1>
          {activeTab === 'world' && (
            <span className="text-[12px] text-neutral-400 font-normal">
              {cities.length} 个城市
            </span>
          )}
        </div>
      </div>

      {/* ================= MAIN CONTENT VIEW ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {/* VIEW 1: 世界时钟 (World Clock) */}
        {activeTab === 'world' && (
          <div className="space-y-2">
            {cities.length === 0 ? (
              <div className="py-24 text-center text-neutral-400 flex flex-col items-center justify-center">
                <Globe size={40} className="text-neutral-600 mb-3" />
                <p className="text-[15px] font-medium text-neutral-300">暂无世界时钟城市</p>
                <p className="text-[12px] text-neutral-500 mt-1">点击右上角「＋」添加常驻城市</p>
              </div>
            ) : (
              <div className="bg-[#2C2C2E] rounded-2xl shadow-xs overflow-hidden divide-y divide-white/5">
                {cities.map((city) => {
                  const { timeStr, offsetDesc } = getCityTimeData(city.timezone);
                  return (
                    <div
                      key={city.id}
                      onPointerDown={() => handleCityPointerDown(city)}
                      onPointerUp={handleCityPointerUp}
                      className="px-4 py-3.5 flex items-center justify-between active:bg-white/5 transition-colors select-none cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="text-[12px] text-neutral-400 font-normal truncate">
                          {offsetDesc}
                        </div>
                        <div className="text-[20px] font-semibold text-white tracking-tight truncate mt-0.5">
                          {city.name}
                        </div>
                      </div>
                      <div className="text-[34px] font-light font-mono text-white tracking-tight shrink-0">
                        {timeStr}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-neutral-500 text-center pt-2">
              长按城市可进行删除
            </p>
          </div>
        )}

        {/* VIEW 2: 秒表 (Stopwatch) */}
        {activeTab === 'stopwatch' && (
          <div className="h-full flex flex-col justify-between py-4">
            {/* Big Stopwatch Display */}
            <div className="py-12 flex items-center justify-center">
              <div className="text-[64px] font-extralight font-mono text-white tracking-tighter select-text">
                {formatStopwatchTime(stopwatchElapsedMs)}
              </div>
            </div>

            {/* Circular Buttons */}
            <div className="flex items-center justify-between px-6 py-4">
              {/* Left Button: Lap / Reset */}
              <button
                type="button"
                onClick={handleLapOrReset}
                disabled={!stopwatchRunning && stopwatchElapsedMs === 0}
                className={`w-[76px] h-[76px] rounded-full flex items-center justify-center font-medium text-[15px] border-2 transition-all active:scale-92 cursor-pointer ${
                  !stopwatchRunning && stopwatchElapsedMs === 0
                    ? 'border-neutral-700 text-neutral-600 bg-neutral-800/40 cursor-not-allowed'
                    : 'border-neutral-500 text-white bg-neutral-700/60 hover:bg-neutral-700'
                }`}
              >
                {stopwatchRunning ? '计次' : '重置'}
              </button>

              {/* Right Button: Start / Stop */}
              <button
                type="button"
                onClick={handleStartStopwatch}
                className={`w-[76px] h-[76px] rounded-full flex items-center justify-center font-medium text-[15px] border-2 transition-all active:scale-92 cursor-pointer ${
                  stopwatchRunning
                    ? 'border-[#FF453A]/80 text-[#FF453A] bg-[#FF453A]/20 hover:bg-[#FF453A]/30'
                    : 'border-[#30D158]/80 text-[#30D158] bg-[#30D158]/20 hover:bg-[#30D158]/30'
                }`}
              >
                {stopwatchRunning ? '停止' : '开始'}
              </button>
            </div>

            {/* Laps List */}
            <div className="flex-1 overflow-y-auto mt-4 px-2 divide-y divide-white/5 max-h-[220px]">
              {laps.map((lap, index) => {
                const isFastest = index === fastestLapIdx;
                const isSlowest = index === slowestLapIdx;

                let colorClass = 'text-white';
                let tag = null;
                if (isFastest) {
                  colorClass = 'text-[#30D158] font-semibold';
                  tag = <span className="text-[10px] text-[#30D158] ml-1.5">(最快)</span>;
                } else if (isSlowest) {
                  colorClass = 'text-[#FF453A] font-semibold';
                  tag = <span className="text-[10px] text-[#FF453A] ml-1.5">(最慢)</span>;
                }

                return (
                  <div
                    key={lap.lapNumber}
                    className="py-2.5 flex items-center justify-between text-[14px] font-mono px-2"
                  >
                    <div className="flex items-center text-neutral-400">
                      <span>计次 {lap.lapNumber.toString().padStart(2, '0')}</span>
                      {tag}
                    </div>
                    <div className={colorClass}>
                      {formatStopwatchTime(lap.lapTime)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: 计时器 (Timer) */}
        {activeTab === 'timer' && (
          <div className="h-full flex flex-col justify-between py-2">
            {timerStatus === 'idle' ? (
              /* Time Picker (Hours, Minutes, Seconds) */
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                <div className="bg-[#2C2C2E] rounded-3xl p-6 w-full max-w-[320px] shadow-lg border border-white/5 space-y-5">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {/* Hours */}
                    <div className="flex flex-col items-center">
                      <label className="text-[12px] text-neutral-400 mb-1">小时</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={timerHours}
                        onChange={(e) => setTimerHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                        className="w-18 h-14 bg-black/40 text-center font-mono text-[26px] font-light text-white rounded-2xl border border-white/10 outline-none focus:border-[#FF9F0A]"
                      />
                    </div>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                      <label className="text-[12px] text-neutral-400 mb-1">分钟</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={timerMinutes}
                        onChange={(e) => setTimerMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-18 h-14 bg-black/40 text-center font-mono text-[26px] font-light text-white rounded-2xl border border-white/10 outline-none focus:border-[#FF9F0A]"
                      />
                    </div>

                    {/* Seconds */}
                    <div className="flex flex-col items-center">
                      <label className="text-[12px] text-neutral-400 mb-1">秒</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={timerSeconds}
                        onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-18 h-14 bg-black/40 text-center font-mono text-[26px] font-light text-white rounded-2xl border border-white/10 outline-none focus:border-[#FF9F0A]"
                      />
                    </div>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex items-center justify-between gap-1.5 pt-2">
                    {[1, 5, 10, 15, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          setTimerHours(0);
                          setTimerMinutes(mins);
                          setTimerSeconds(0);
                        }}
                        className={`flex-1 py-1.5 text-[11px] rounded-lg font-medium transition-colors cursor-pointer ${
                          timerHours === 0 && timerMinutes === mins && timerSeconds === 0
                            ? 'bg-[#FF9F0A] text-black font-semibold'
                            : 'bg-white/10 hover:bg-white/20 text-neutral-300'
                        }`}
                      >
                        {mins}分
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Active Timer Display */
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                <div className="relative w-56 h-56 flex items-center justify-center">
                  {/* Subtle Circular Progress indicator */}
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="112"
                      cy="112"
                      r="96"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-white/10"
                      fill="transparent"
                    />
                    <circle
                      cx="112"
                      cy="112"
                      r="96"
                      stroke="#FF9F0A"
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 96}
                      strokeDashoffset={
                        2 * Math.PI * 96 * (1 - (timerTotalSeconds > 0 ? timerRemainingSeconds / timerTotalSeconds : 0))
                      }
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-linear"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[44px] font-light font-mono text-white tracking-tight">
                      {formatTimerHMS(timerRemainingSeconds)}
                    </span>
                    <span className="text-[12px] text-neutral-400 mt-1 flex items-center gap-1">
                      <ClockIcon size={12} className="text-[#FF9F0A]" />
                      {timerStatus === 'running' ? '计时中' : '已暂停'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Timer Control Buttons */}
            <div className="flex items-center justify-between px-6 py-4">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={handleCancelTimer}
                disabled={timerStatus === 'idle'}
                className={`w-[76px] h-[76px] rounded-full flex items-center justify-center font-medium text-[15px] border-2 transition-all active:scale-92 cursor-pointer ${
                  timerStatus === 'idle'
                    ? 'border-neutral-700 text-neutral-600 bg-neutral-800/40 cursor-not-allowed'
                    : 'border-neutral-500 text-white bg-neutral-700/60 hover:bg-neutral-700'
                }`}
              >
                取消
              </button>

              {/* Start / Pause / Resume Button */}
              {timerStatus === 'idle' && (
                <button
                  type="button"
                  onClick={handleStartTimer}
                  disabled={timerHours === 0 && timerMinutes === 0 && timerSeconds === 0}
                  className={`w-[76px] h-[76px] rounded-full flex items-center justify-center font-medium text-[15px] border-2 transition-all active:scale-92 cursor-pointer ${
                    timerHours === 0 && timerMinutes === 0 && timerSeconds === 0
                      ? 'border-neutral-700 text-neutral-600 bg-neutral-800/40 cursor-not-allowed'
                      : 'border-[#30D158]/80 text-[#30D158] bg-[#30D158]/20 hover:bg-[#30D158]/30'
                  }`}
                >
                  开始
                </button>
              )}

              {timerStatus === 'running' && (
                <button
                  type="button"
                  onClick={handlePauseTimer}
                  className="w-[76px] h-[76px] rounded-full flex items-center justify-center font-medium text-[15px] border-2 border-[#FF9F0A]/80 text-[#FF9F0A] bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 active:scale-92 transition-all cursor-pointer"
                >
                  暂停
                </button>
              )}

              {timerStatus === 'paused' && (
                <button
                  type="button"
                  onClick={handleResumeTimer}
                  className="w-[76px] h-[76px] rounded-full flex items-center justify-center font-medium text-[15px] border-2 border-[#30D158]/80 text-[#30D158] bg-[#30D158]/20 hover:bg-[#30D158]/30 active:scale-92 transition-all cursor-pointer"
                >
                  继续
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= BOTTOM TAB BAR ================= */}
      <div
        className="px-6 pt-2 bg-[#161618]/95 backdrop-blur-xl border-t border-white/10 shrink-0"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        }}
      >
        <div className="flex items-center justify-around">
          <button
            type="button"
            onClick={() => setActiveTab('world')}
            className={`flex flex-col items-center gap-1 py-1 px-4 cursor-pointer transition-colors ${
              activeTab === 'world' ? 'text-[#FF9F0A]' : 'text-neutral-500 hover:text-neutral-400'
            }`}
          >
            <Globe size={22} strokeWidth={2.2} />
            <span className="text-[10px] font-medium tracking-tight">世界时钟</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stopwatch')}
            className={`flex flex-col items-center gap-1 py-1 px-4 cursor-pointer transition-colors ${
              activeTab === 'stopwatch' ? 'text-[#FF9F0A]' : 'text-neutral-500 hover:text-neutral-400'
            }`}
          >
            <StopwatchIcon size={22} strokeWidth={2.2} />
            <span className="text-[10px] font-medium tracking-tight">秒表</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center gap-1 py-1 px-4 cursor-pointer transition-colors ${
              activeTab === 'timer' ? 'text-[#FF9F0A]' : 'text-neutral-500 hover:text-neutral-400'
            }`}
          >
            <Hourglass size={22} strokeWidth={2.2} />
            <span className="text-[10px] font-medium tracking-tight">计时器</span>
          </button>
        </div>
      </div>

      {/* ================= ADD CITY MODAL SHEET ================= */}
      {showAddCityModal && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowAddCityModal(false)}
        >
          <div
            className="w-full max-h-[82vh] bg-[#2C2C2E] rounded-t-[30px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
            }}
          >
            {/* Handle */}
            <div className="w-full pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-neutral-600" />
            </div>

            {/* Header */}
            <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/10 shrink-0">
              <h3 className="text-[17px] font-bold text-white">选择城市</h3>
              <button
                type="button"
                onClick={() => setShowAddCityModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-4 py-2.5 shrink-0">
              <div className="relative flex items-center">
                <Search size={15} className="absolute left-3 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  placeholder="搜索城市或国家..."
                  className="w-full h-9 pl-9 pr-3 text-[14px] bg-white/10 rounded-xl text-white placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-[#FF9F0A] transition-all"
                />
              </div>
            </div>

            {/* Cities List */}
            <div className="flex-1 overflow-y-auto px-4 divide-y divide-white/5">
              {filteredAvailableCities.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <p className="text-[14px]">无匹配城市</p>
                </div>
              ) : (
                filteredAvailableCities.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleAddCity(item)}
                    className="py-3 px-3 rounded-xl hover:bg-white/5 active:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <h4 className="text-[15px] font-semibold text-white">{item.name}</h4>
                      <p className="text-[12px] text-neutral-400">{item.country} · {item.timezone}</p>
                    </div>
                    <span className="text-[12px] text-[#FF9F0A] font-medium">添加</span>
                  </div>
                ))
              )}
            </div>
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
        title="删除世界时钟"
        message={`确定要删除“${deleteConfirmCity?.name}”吗？`}
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
