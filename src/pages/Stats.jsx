import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getLocalDate } from '../lib/dateUtils';

export default function Stats() {
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [heatmapData, setHeatmapData] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: tasks } = await supabase.from('tasks').select('*');
    const { data: logs } = await supabase.from('task_logs').select('*');

    if (!tasks || !logs) {
      setLoading(false);
      return;
    }

    const logsByDate = {};
    logs.forEach(log => {
      if (!logsByDate[log.log_date]) logsByDate[log.log_date] = [];
      logsByDate[log.log_date].push(log);
    });

    // --- HELPER FUNCTION (Updated for Advanced Monthly Rules) ---
    const getScheduledTasksForDate = (dateObj) => {
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayOfMonth = String(dateObj.getDate());
      
      return tasks.filter(t => {
        if (t.frequency === 'daily') return true;
        if (t.frequency === 'weekly') return t.active_days?.includes(dayOfWeek);
        
        if (t.frequency === 'monthly') {
          if (t.is_last_day_of_month) {
            const lastDay = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
            return dateObj.getDate() === lastDay;
          }
          if (t.monthly_week && t.monthly_day_of_week) {
            if (t.monthly_day_of_week !== dayOfWeek) return false;
            const dayNum = dateObj.getDate();
            const weekNum = t.monthly_week;
            if (weekNum === '1') return dayNum >= 1 && dayNum <= 7;
            if (weekNum === '2') return dayNum >= 8 && dayNum <= 14;
            if (weekNum === '3') return dayNum >= 15 && dayNum <= 21;
            if (weekNum === '4') return dayNum >= 22 && dayNum <= 28;
            if (weekNum === 'last') {
              const lastDayOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
              return dayNum > (lastDayOfMonth - 7);
            }
          }
          return t.active_days?.includes(dayOfMonth);
        }
        return false;
      });
    };

    const today = new Date();

    // --- STREAK CALCULATION ---
    let currentStreakCount = 0;
    let longestStreakCount = 0;
    let tempStreak = 0;

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDate(d); 
      
      const scheduledTasks = getScheduledTasksForDate(d);
      const target = scheduledTasks.filter(t => t.task_type === 'boolean').length;

      if (target === 0) continue; // Rest day

      const dayLogs = logsByDate[dateStr] || [];
      const completedCount = dayLogs.filter(l => l.is_completed).length;
      const isPerfectDay = completedCount >= target;

      if (isPerfectDay) {
        tempStreak++;
        if (tempStreak > longestStreakCount) longestStreakCount = tempStreak;
        if (i === 0 || i === tempStreak - 1) {
          currentStreakCount = tempStreak;
        }
      } else {
        if (i === 0) continue; 
        tempStreak = 0; 
      }
    }

    setCurrentStreak(currentStreakCount);
    setLongestStreak(longestStreakCount);

    // --- HEATMAP CALCULATION ---
    const year = today.getFullYear();
    const month = today.getMonth(); 
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const monthData = [];
    let startDayIndex = firstDay.getDay() - 1; 
    if (startDayIndex < 0) startDayIndex = 6; 

    for (let i = 0; i < startDayIndex; i++) {
      monthData.push({ date: null, percent: 0 }); 
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = getLocalDate(dateObj); 
      
      const dayLogs = logsByDate[dateStr] || [];
      const completed = dayLogs.filter(l => l.is_completed).length;
      
      const scheduledTasks = getScheduledTasksForDate(dateObj);
      const total = scheduledTasks.length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      monthData.push({ date: d, percent });
    }
    
    setHeatmapData(monthData);

    // --- CATEGORY CALCULATION ---
    const currDay = today.getDay();
    const diffToMonday = currDay === 0 ? 6 : currDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mondayStr = getLocalDate(monday);
    const sundayStr = getLocalDate(sunday);

    const weekLogs = logs.filter(l => l.log_date >= mondayStr && l.log_date <= sundayStr);
    
    const catMap = {};
    tasks.forEach(task => {
      if (!catMap[task.category]) {
        catMap[task.category] = { total: 0, completed: 0 };
      }
      
      const taskLogs = weekLogs.filter(l => l.task_id === task.id);
      const completedLogs = taskLogs.filter(l => l.is_completed).length;
      
      let expected = 0;
      if (task.frequency === 'daily') expected = 7;
      else if (task.frequency === 'weekly') expected = 1;
      else if (task.frequency === 'monthly') expected = 0; 
      
      catMap[task.category].total += expected;
      catMap[task.category].completed += completedLogs;
    });

    const catArray = Object.keys(catMap).map(cat => ({
      name: cat,
      percent: catMap[cat].total > 0 ? Math.round((catMap[cat].completed / catMap[cat].total) * 100) : 0
    })).sort((a, b) => b.percent - a.percent);

    setCategoryStats(catArray);
    setLoading(false);
  };

  const getHeatmapColor = (percent) => {
    if (percent === 0) return 'bg-gray-100';
    if (percent < 50) return 'bg-green-200';
    if (percent < 100) return 'bg-green-400';
    return 'bg-green-600';
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Calculating your stats...</div>;

  const monthName = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Stats & Insights</h1>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6 text-center">
        <div className="text-5xl mb-2">🔥</div>
        <div className="text-3xl font-bold text-gray-800">{currentStreak} Days</div>
        <div className="text-sm text-gray-500 mb-4">Current Streak</div>
        <div className="border-t border-gray-100 pt-4 mt-2">
          <div className="text-lg font-semibold text-gray-700">{longestStreak} Days</div>
          <div className="text-xs text-gray-500">Longest Streak</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">🟩 {monthName} HABIT HEATMAP</h2>
        <div className="grid grid-cols-7 gap-1 mb-1 text-center text-xs text-gray-400 font-medium">
          <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {heatmapData.map((day, index) => (
            <div 
              key={index} 
              className={`aspect-square rounded-sm ${day.date ? getHeatmapColor(day.percent) : 'bg-transparent'} flex items-center justify-center relative`}
              title={day.date ? `Day ${day.date}: ${day.percent}% completed` : ''}
            >
              {day.date && (
                <span className="text-[10px] text-gray-500 font-medium">
                  {day.date}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1 mt-4 text-xs text-gray-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
          <div className="w-3 h-3 rounded-sm bg-green-200"></div>
          <div className="w-3 h-3 rounded-sm bg-green-400"></div>
          <div className="w-3 h-3 rounded-sm bg-green-600"></div>
          <span>More</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">📊 CATEGORY COMPLETION (This Week)</h2>
        {categoryStats.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">No category data for this week yet.</p>
        ) : (
          <div className="space-y-4">
            {categoryStats.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                  <span>{cat.name}</span>
                  <span>{cat.percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all duration-500 ${cat.percent >= 80 ? 'bg-green-500' : cat.percent >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`} style={{ width: `${cat.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}