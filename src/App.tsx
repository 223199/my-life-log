import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';

// 写真は IndexedDB に日付ごと保存
const DB_NAME = 'lifeLogPhotos';
const STORE_NAME = 'photos';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB error'));
  });
}

async function savePhotoToDB(key: string, dataUrl: string) {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(dataUrl, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('tx error'));
    });
  } catch (e) {
    console.warn('savePhotoToDB failed', e);
  }
}

async function getPhotoFromDB(key: string): Promise<string> {
  try {
    const db = await openDB();
    return await new Promise<string>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as string) || '');
      req.onerror = () => reject(req.error || new Error('get error'));
    });
  } catch (e) {
    console.warn('getPhotoFromDB failed', e);
    return '';
  }
}

async function deletePhotoFromDB(key: string) {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('delete error'));
    });
  } catch (e) {
    console.warn('deletePhotoFromDB failed', e);
  }
}

const STEP_GOAL = 10000;
const STUDY_GOAL = 120; // 分
const TODO_GOAL = 5;

const AREA_LIST = [
  'veranda',
  'room',
  'closet',
  'bath',
  'toilet',
  'washbasin',
  'kitchen',
  'entrance',
];

export default function LifeLogApp() {
  const [date, setDate] = useState<Date>(() => new Date());
  const [logs, setLogs] = useState<Record<string, any>>({});
  const [todos, setTodos] = useState<Record<string, any[]>>({});

  const [wakeTime, setWakeTime] = useState('');
  const [sleepTime, setSleepTime] = useState('');
  const [steps, setSteps] = useState('');
  const [studyMinutes, setStudyMinutes] = useState('');
  const [weight, setWeight] = useState('');
  const [memo, setMemo] = useState('');
  const [photo, setPhoto] = useState('');

  const [isEditingMemo, setIsEditingMemo] = useState(true);
  const [isEditingPhoto, setIsEditingPhoto] = useState(true);

  const [todoText, setTodoText] = useState('');
  const [currentTodos, setCurrentTodos] = useState<any[]>([]);

  const [cleaningState, setCleaningState] = useState<Record<string, boolean>>({});

  const [activeTab, setActiveTab] = useState<
    'time' | 'steps' | 'study' | 'weight' | 'cleaning' | 'todo'
  >('time');

  // 初期ロード
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem('lifeLogs');
      if (savedLogs) setLogs(JSON.parse(savedLogs));
    } catch (e) {
      console.warn('load lifeLogs failed', e);
      setLogs({});
    }
    try {
      const savedTodos = localStorage.getItem('todos');
      if (savedTodos) setTodos(JSON.parse(savedTodos));
    } catch (e) {
      console.warn('load todos failed', e);
      setTodos({});
    }
  }, []);

  // 日付変更時にその日のデータを反映
  useEffect(() => {
    const key = date.toDateString();
    const dayLog = logs[key] || {};
    setWakeTime(dayLog.wakeTime || '');
    setSleepTime(dayLog.sleepTime || '');
    setSteps(dayLog.steps || '');
    setStudyMinutes(dayLog.studyMinutes || '');
    setWeight(dayLog.weight || '');
    setMemo(dayLog.memo || '');
    setIsEditingMemo(!dayLog.memo);

    const dayTodos = todos[key] || [];
    setCurrentTodos(dayTodos);

    // 掃除状態
    try {
      const savedCleaning = JSON.parse(localStorage.getItem('cleaningLogs') || '{}');
      setCleaningState(savedCleaning[key] || {});
    } catch {
      setCleaningState({});
    }

    // 写真
    (async () => {
      const p = await getPhotoFromDB(key);
      setPhoto(p || '');
      setIsEditingPhoto(!p);
    })();
  }, [date, logs, todos]);

  const updateDayLog = (partial: any) => {
    const key = date.toDateString();
    const prev = logs[key] || {};
    const updatedDay = { ...prev, ...partial };
    const newLogs = { ...logs, [key]: updatedDay };
    setLogs(newLogs);
    try {
      localStorage.setItem('lifeLogs', JSON.stringify(newLogs));
    } catch (e) {
      console.warn('save lifeLogs failed', e);
      alert('保存に失敗しました（ストレージ容量がいっぱいかもしれません）。');
    }
  };

  // 各タブの保存
  const saveTime = () => {
    updateDayLog({ wakeTime, sleepTime });
  };

  const saveSteps = () => {
    updateDayLog({ steps });
  };

  const saveStudy = () => {
    updateDayLog({ studyMinutes });
  };

  const saveWeight = () => {
    updateDayLog({ weight });
  };

  const saveMemo = () => {
    updateDayLog({ memo });
    setIsEditingMemo(false);
  };

  // 写真アップロード・削除
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setPhoto(dataUrl);
      await savePhotoToDB(date.toDateString(), dataUrl);
      setIsEditingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoDelete = async () => {
    const key = date.toDateString();
    await deletePhotoFromDB(key);
    setPhoto('');
    setIsEditingPhoto(true);
  };

  // ToDo
  const addTodo = () => {
    if (!todoText.trim()) return;
    const key = date.toDateString();
    const newTodo = {
      id: Date.now(),
      text: todoText.trim(),
      done: false,
    };
    const updatedDayTodos = [...currentTodos, newTodo];
    setCurrentTodos(updatedDayTodos);
    const newTodos = { ...todos, [key]: updatedDayTodos };
    setTodos(newTodos);
    try {
      localStorage.setItem('todos', JSON.stringify(newTodos));
    } catch (e) {
      console.warn('save todos failed', e);
      alert('ToDoの保存に失敗しました。');
    }
    setTodoText('');
  };

  const toggleTodo = (id: number) => {
    const key = date.toDateString();
    const updatedDayTodos = currentTodos.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    setCurrentTodos(updatedDayTodos);
    const newTodos = { ...todos, [key]: updatedDayTodos };
    setTodos(newTodos);
    try {
      localStorage.setItem('todos', JSON.stringify(newTodos));
    } catch (e) {
      console.warn('save todos toggle failed', e);
    }
  };

  const deleteTodo = (id: number) => {
    const key = date.toDateString();
    const updatedDayTodos = currentTodos.filter((t) => t.id !== id);
    setCurrentTodos(updatedDayTodos);
    const newTodos = { ...todos, [key]: updatedDayTodos };
    setTodos(newTodos);
    try {
      localStorage.setItem('todos', JSON.stringify(newTodos));
    } catch (e) {
      console.warn('save todos delete failed', e);
    }
  };

  // 掃除
  const loadCleaningForDate = (d: Date) => {
    const key = d.toDateString();
    try {
      const savedCleaning = JSON.parse(localStorage.getItem('cleaningLogs') || '{}');
      return savedCleaning[key] || {};
    } catch {
      return {};
    }
  };

  const toggleArea = (area: string) => {
    const current = { ...(cleaningState || {}) };
    current[area] = !current[area];
    setCleaningState(current);
    const key = date.toDateString();
    const savedCleaning = JSON.parse(localStorage.getItem('cleaningLogs') || '{}');
    savedCleaning[key] = current;
    try {
      localStorage.setItem('cleaningLogs', JSON.stringify(savedCleaning));
    } catch (e) {
      console.warn('save cleaning failed', e);
      alert('掃除状態の保存に失敗しました。');
    }
  };

  const clearCleaningForDate = () => {
    const key = date.toDateString();
    const savedCleaning = JSON.parse(localStorage.getItem('cleaningLogs') || '{}');
    delete savedCleaning[key];
    localStorage.setItem('cleaningLogs', JSON.stringify(savedCleaning));
    setCleaningState({});
  };

  // SVG 間取り図（ベランダ上、玄関下）
  // クローゼットは洋室の右下 / トイレ→浴室→洗面 を上から縦に並べる
  const MapSVG: React.FC = () => {
    const areas: Record<
      string,
      { x: number; y: number; w: number; h: number; label: string }
    > = {
      veranda: { x: 20, y: 10, w: 260, h: 40, label: 'ベランダ' },
      room: { x: 20, y: 60, w: 260, h: 130, label: '洋室' },
      // 洋室の右下あたり
      closet: { x: 210, y: 150, w: 60, h: 40, label: 'クローゼット' },
      // キッチン（縦 75）
      kitchen: { x: 20, y: 200, w: 150, h: 75, label: 'キッチン' },
      // トイレ→浴室→洗面 を上から順に。高さ 25 + 25 + 25 = 75 でキッチンと同じ
      toilet: { x: 190, y: 200, w: 90, h: 25, label: 'トイレ' },
      bath: { x: 190, y: 225, w: 90, h: 25, label: '浴室' },
      washbasin: { x: 190, y: 250, w: 90, h: 25, label: '洗面' },
      entrance: { x: 80, y: 280, w: 140, h: 40, label: '玄関' },
    };

    return (
      <svg
        width="300"
        height="380"
        viewBox="0 0 300 380"
        className="mx-auto border rounded"
      >
        <rect x={0} y={0} width={300} height={380} fill="#ffffff" stroke="none" />
        {Object.entries(areas).map(([key, a]) => (
          <g key={key}>
            <rect
              x={a.x}
              y={a.y}
              width={a.w}
              height={a.h}
              fill="#fff"
              stroke="#000"
              strokeWidth={1}
              onClick={() => toggleArea(key)}
              style={{ cursor: 'pointer' }}
            />
            <text
              x={a.x + a.w / 2}
              y={a.y + a.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
            >
              {a.label}
            </text>
            {cleaningState[key] && (
              <circle
                cx={a.x + a.w / 2}
                cy={a.y + a.h / 2}
                r={10}
                fill="#16a34a"
              />
            )}
          </g>
        ))}
      </svg>
    );
  };

  // カレンダーの日セル
  const renderDay = (day: Date) => {
    const key =
      typeof day.toDateString === 'function' ? day.toDateString() : String(day);
    const dayLog = logs[key] || {};
    const wakeLabel = dayLog.wakeTime ? String(dayLog.wakeTime).slice(0, 5) : '';

    let dayCleaning: Record<string, boolean> = {};
    try {
      dayCleaning = JSON.parse(localStorage.getItem('cleaningLogs') || '{}')[
        key
      ] || {};
    } catch {
      dayCleaning = {};
    }
    const allAreas = AREA_LIST.every((a) => dayCleaning[a]);

    return (
      <div className="flex flex-col items-center text-[10px] relative">
        <span className="text-xs">
          {typeof day.getDate === 'function' ? day.getDate() : ''}
        </span>
        {wakeLabel && <span className="text-blue-600">{wakeLabel}</span>}
        {Object.keys(dayCleaning).length > 0 && (
          <span className={allAreas ? 'text-green-600' : 'text-yellow-600'}>
            {allAreas ? '○' : '△'}
          </span>
        )}
      </div>
    );
  };

  // グラフ用データ
  const chartData = Object.entries(logs).map(([key, value]: any) => ({
    name: key.slice(4, 10),
    steps: Number(value.steps) || 0,
  }));

  const stepProgress = Math.min(
    (((Number(steps) || 0) / STEP_GOAL) * 100) || 0,
    100
  );
  const studyProgress = Math.min(
    (((Number(studyMinutes) || 0) / STUDY_GOAL) * 100) || 0,
    100
  );
  const doneTodos = currentTodos.filter((t) => t.done).length;
  const todoProgress = Math.min(((doneTodos / TODO_GOAL) * 100) || 0, 100);

  const CircleChart: React.FC<{ value: number; color: string }> = ({ value, color }) => (
    <div className="w-24 h-24 mx-auto">
      <CircularProgressbar
        value={value}
        text={`${Math.round(value)}%`}
        styles={buildStyles({
          pathColor: color,
          textColor: color,
          trailColor: '#eee',
          textSize: '16px',
        })}
      />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 bg-gradient-to-br from-blue-50 to-pink-50 min-h-screen">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-indigo-700">
        My Life Log ✨
      </h1>

      {/* カレンダー & 写真・メモ */}
      <Card className="shadow-md border border-indigo-200 bg-white/80 backdrop-blur">
        <CardContent className="p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            renderDay={renderDay}
          />

          <div className="mt-4 text-center">
            {/* 写真 */}
            {photo ? (
              <div className="relative inline-block">
                <img
                  src={photo}
                  alt="日付の写真"
                  className="mx-auto w-48 h-48 object-cover rounded-lg border shadow"
                />
                <div className="absolute top-1 right-1 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/70"
                    onClick={() => setIsEditingPhoto(true)}
                  >
                    <Pencil className="w-4 h-4 text-indigo-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/70"
                    onClick={handlePhotoDelete}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ) : (
              isEditingPhoto && (
                <label className="cursor-pointer bg-indigo-500 text-white px-3 py-1 rounded-md inline-flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" /> 写真を追加
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              )
            )}

            {isEditingPhoto && photo && (
              <div className="mt-2">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} />
              </div>
            )}

            {/* メモ */}
            {memo && !isEditingMemo && (
              <div className="flex justify-center items-center gap-2 mt-3">
                <p className="text-gray-800 text-sm whitespace-pre-line">{memo}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingMemo(true)}
                >
                  <Pencil className="w-4 h-4 text-indigo-600" />
                </Button>
              </div>
            )}

            {isEditingMemo && (
              <div className="mt-3">
                <Textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="今日のコメントを書く..."
                />
                <Button
                  onClick={saveMemo}
                  className="mt-2 bg-indigo-600 text-white"
                >
                  保存
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* タブ */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-2">
        <Button
          variant={activeTab === 'time' ? 'default' : 'outline'}
          onClick={() => setActiveTab('time')}
        >
          🕓 時間
        </Button>
        <Button
          variant={activeTab === 'steps' ? 'default' : 'outline'}
          onClick={() => setActiveTab('steps')}
        >
          🏃‍♀️ 歩数
        </Button>
        <Button
          variant={activeTab === 'study' ? 'default' : 'outline'}
          onClick={() => setActiveTab('study')}
        >
          🎓 勉強
        </Button>
        <Button
          variant={activeTab === 'weight' ? 'default' : 'outline'}
          onClick={() => setActiveTab('weight')}
        >
          ⚖️ 体重
        </Button>
        <Button
          variant={activeTab === 'cleaning' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('cleaning');
            setCleaningState(loadCleaningForDate(date));
          }}
        >
          🧹 掃除
        </Button>
        <Button
          variant={activeTab === 'todo' ? 'default' : 'outline'}
          onClick={() => setActiveTab('todo')}
        >
          ✅ ToDo
        </Button>
      </div>

      {/* 各タブの内容 */}
      {activeTab === 'time' && (
        <Card className="shadow-md border border-slate-200 bg-white/80 backdrop-blur">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-lg font-semibold text-slate-700 mb-1">
              起床・就寝時間
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">起きた時間</label>
                <Input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">寝た時間</label>
                <Input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={saveTime} className="mt-2 w-full bg-slate-600 text-white">
              保存
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'steps' && (
        <Card className="shadow-md border border-blue-200 bg-white/80 backdrop-blur">
          <CardContent className="p-4 space-y-4 text-center">
            <h2 className="text-lg font-semibold text-blue-600">歩数の記録</h2>
            <CircleChart value={stepProgress} color="#3b82f6" />
            <p className="text-sm">目標歩数: {STEP_GOAL.toLocaleString()}歩</p>
            <Input
              type="number"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="今日の歩数を入力"
            />
            <Button
              onClick={saveSteps}
              className="bg-blue-500 text-white w-full mt-1"
            >
              保存
            </Button>
            <div className="overflow-x-auto mt-4">
              <LineChart width={600} height={280} data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="steps"
                  stroke="#3b82f6"
                  name="歩数"
                />
              </LineChart>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'study' && (
        <Card className="shadow-md border border-purple-200 bg-white/80 backdrop-blur">
          <CardContent className="p-4 space-y-4 text-center">
            <h2 className="text-lg font-semibold text-purple-600">勉強時間</h2>
            <CircleChart value={studyProgress} color="#a855f7" />
            <p className="text-sm">目標勉強時間: {STUDY_GOAL}分</p>
            <Input
              type="number"
              value={studyMinutes}
              onChange={(e) => setStudyMinutes(e.target.value)}
              placeholder="今日の勉強時間 (分)"
            />
            <Button
              onClick={saveStudy}
              className="bg-purple-500 text-white w-full mt-1"
            >
              保存
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'weight' && (
        <Card className="shadow-md border border-amber-200 bg-white/80 backdrop-blur">
          <CardContent className="p-4 space-y-3 text-center">
            <h2 className="text-lg font-semibold text-amber-600">体重の記録</h2>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="今日の体重 (kg)"
            />
            <Button
              onClick={saveWeight}
              className="bg-amber-500 text-white w-full mt-1"
            >
              保存
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'cleaning' && (
        <Card className="shadow-md border border-green-200 bg-white/80 backdrop-blur">
          <CardContent className="p-4 text-center space-y-3">
            <h2 className="text-lg font-semibold mb-1 text-green-600">掃除マップ</h2>
            <p className="text-xs text-gray-600">
              マップの部屋をクリックすると、その場所に掃除済みマーク（○）がつきます。
            </p>
            <MapSVG />
            <div className="mt-3 flex justify-center gap-2">
              <Button
                onClick={() => setCleaningState(loadCleaningForDate(date))}
                className="bg-gray-100"
              >
                読み込み
              </Button>
              <Button
                onClick={clearCleaningForDate}
                className="bg-red-100 text-red-600"
              >
                リセット
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'todo' && (
        <Card className="shadow-md border border-emerald-200 bg-white/80 backdrop-blur">
          <CardContent className="p-4 space-y-4 text-center">
            <h2 className="text-lg font-semibold text-emerald-600">ToDo リスト</h2>
            <CircleChart value={todoProgress} color="#16a34a" />
            <p className="text-sm">
              目標タスク数: {TODO_GOAL}件（完了: {doneTodos}件）
            </p>
            <div className="flex gap-2">
              <Input
                value={todoText}
                onChange={(e) => setTodoText(e.target.value)}
                placeholder="タスクを入力..."
              />
              <Button onClick={addTodo} className="bg-emerald-500 text-white">
                追加
              </Button>
            </div>
            <ul className="space-y-1 mt-2 text-left max-w-md mx-auto">
              {currentTodos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center justify-between text-sm bg-emerald-50 px-2 py-1 rounded-md shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={todo.done}
                      onCheckedChange={() => toggleTodo(todo.id)}
                    />
                    <span
                      className={
                        todo.done
                          ? 'line-through text-gray-400'
                          : 'text-gray-700'
                      }
                    >
                      {todo.text}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    ❌
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
