import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import TaskItem from '../components/TaskItem';
import { getLocalDate, getDayOfWeek, getDayOfMonth } from '../lib/dateUtils';

export default function Today() {
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState({});
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        await fetchDashboardData(session.user.id);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const isRelativeDayMatch = (task, dayOfMonth, dayOfWeek, dateObj) => {
    if (task.monthly_day_of_week !== dayOfWeek) return false;
    const dayNum = parseInt(dayOfMonth);
    const weekNum = task.monthly_week;

    if (weekNum === '1') return dayNum >= 1 && dayNum <= 7;
    if (weekNum === '2') return dayNum >= 8 && dayNum <= 14;
    if (weekNum === '3') return dayNum >= 15 && dayNum <= 21;
    if (weekNum === '4') return dayNum >= 22 && dayNum <= 28;
    if (weekNum === 'last') {
      const lastDayOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
      return dayNum > (lastDayOfMonth - 7);
    }
    return false;
  };

  const fetchDashboardData = async (uid) => {
    const today = getLocalDate();
    const dayOfWeek = getDayOfWeek();
    const dayOfMonth = getDayOfMonth();
    const dateObj = new Date();

    const { data: allTasks } = await supabase.from('tasks').select('*');

    const { data: todayLogs } = await supabase
      .from('task_logs')
      .select('task_id, is_completed, current_value')
      .eq('user_id', uid)
      .eq('log_date', today);

    const todaysTasks = allTasks.filter(t => {
      if (t.frequency === 'daily') return true;
      if (t.frequency === 'weekly') return t.active_days?.includes(dayOfWeek);

      if (t.frequency === 'monthly') {
        if (t.is_last_day_of_month) {
          const lastDay = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
          return parseInt(dayOfMonth) === lastDay;
        }
        if (t.monthly_week && t.monthly_day_of_week) {
          return isRelativeDayMatch(t, dayOfMonth, dayOfWeek, dateObj);
        }
        return t.active_days?.includes(dayOfMonth);
      }
      return false;
    });

    const logMap = {};
    todayLogs?.forEach(log => {
      logMap[log.task_id] = log;
    });

    setTasks(todaysTasks);
    setLogs(logMap);
    setLoading(false);
  };

  const getTimeBlock = (timeStr) => {
    if (!timeStr) return 'Other';
    const hour = parseInt(timeStr.split(':')[0]);
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const getCurrentTimeMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const getTimeStringMinutes = (timeStr) => {
    if (!timeStr) return -1;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const currentTimeMinutes = getCurrentTimeMinutes();

  const catchUpTasks = tasks.filter(t => {
    const taskMinutes = getTimeStringMinutes(t.time_of_day);
    return taskMinutes !== -1 && taskMinutes < currentTimeMinutes && !logs[t.id]?.is_completed;
  });

  const activeTasks = tasks.filter(t => {
    const taskMinutes = getTimeStringMinutes(t.time_of_day);
    return !logs[t.id]?.is_completed && (taskMinutes === -1 || taskMinutes >= currentTimeMinutes);
  });

  const completedTasks = tasks.filter(t => logs[t.id]?.is_completed);

  const morningTasks = activeTasks.filter(t => getTimeBlock(t.time_of_day) === 'Morning');
  const afternoonTasks = activeTasks.filter(t => getTimeBlock(t.time_of_day) === 'Afternoon');
  const eveningTasks = activeTasks.filter(t => getTimeBlock(t.time_of_day) === 'Evening');
  const otherTasks = activeTasks.filter(t => getTimeBlock(t.time_of_day) === 'Other');

  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  if (loading) return <div className="p-4 text-center text-stone-500">Loading Dashboard...</div>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-100">Today</h1>
        <p className="text-stone-400 text-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>

        <div className="mt-4 bg-stone-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <p className="text-xs text-stone-400 mt-1 text-right">{progressPercent}% Done</p>
      </div>

      {/* CATCH-UP ZONE */}
      {catchUpTasks.length > 0 && (
        <div className="mb-6 bg-red-900/20 border border-red-800/50 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-red-900/30 border-b border-red-800/50 p-3 font-semibold text-sm text-red-300 flex items-center gap-2">
            🚨 CATCH-UP ({catchUpTasks.length} overdue)
          </div>
          {catchUpTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              userId={userId}
              isCompleted={logs[task.id]?.is_completed}
              currentValue={logs[task.id]?.current_value}
              onTaskUpdate={() => fetchDashboardData(userId)}
              isOverdue={task.rollover_type === 'flag_overdue'}
            />
          ))}
        </div>
      )}

      {/* Morning */}
      {morningTasks.length > 0 && (
        <div className="mb-6 bg-stone-800 border border-stone-700 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-stone-800/50 border-b border-stone-700 p-3 font-semibold text-sm text-stone-300">☀️ MORNING</div>
          {morningTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              userId={userId}
              isCompleted={logs[task.id]?.is_completed}
              currentValue={logs[task.id]?.current_value}
              onTaskUpdate={() => fetchDashboardData(userId)}
            />
          ))}
        </div>
      )}

      {/* Afternoon */}
      {afternoonTasks.length > 0 && (
        <div className="mb-6 bg-stone-800 border border-stone-700 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-stone-800/50 border-b border-stone-700 p-3 font-semibold text-sm text-stone-300">⛅ AFTERNOON</div>
          {afternoonTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              userId={userId}
              isCompleted={logs[task.id]?.is_completed}
              currentValue={logs[task.id]?.current_value}
              onTaskUpdate={() => fetchDashboardData(userId)}
            />
          ))}
        </div>
      )}

      {/* Evening */}
      {eveningTasks.length > 0 && (
        <div className="mb-6 bg-stone-800 border border-stone-700 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-stone-800/50 border-b border-stone-700 p-3 font-semibold text-sm text-stone-300">🌙 EVENING</div>
          {eveningTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              userId={userId}
              isCompleted={logs[task.id]?.is_completed}
              currentValue={logs[task.id]?.current_value}
              onTaskUpdate={() => fetchDashboardData(userId)}
            />
          ))}
        </div>
      )}

      {/* Other */}
      {otherTasks.length > 0 && (
        <div className="mb-6 bg-stone-800 border border-stone-700 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-stone-800/50 border-b border-stone-700 p-3 font-semibold text-sm text-stone-300">📋 OTHER</div>
          {otherTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              userId={userId}
              isCompleted={logs[task.id]?.is_completed}
              currentValue={logs[task.id]?.current_value}
              onTaskUpdate={() => fetchDashboardData(userId)}
            />
          ))}
        </div>
      )}

      {/* COMPLETED ACCORDION */}
      {completedTasks.length > 0 && (
        <div className="mb-6 bg-stone-800/50 border border-stone-700 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full p-3 flex justify-between items-center font-semibold text-sm text-stone-400 hover:bg-stone-700/50 transition-colors"
          >
            <span>✅ COMPLETED TODAY ({completedTasks.length})</span>
            <span className="text-xs">{showCompleted ? 'Hide' : 'Show'}</span>
          </button>

          {showCompleted && (
            <div className="border-t border-stone-700">
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  userId={userId}
                  isCompleted={logs[task.id]?.is_completed}
                  currentValue={logs[task.id]?.current_value}
                  onTaskUpdate={() => fetchDashboardData(userId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-12 text-stone-500">
          <p className="text-xl">🎉 All clear for today!</p>
          <p className="text-sm mt-2">No tasks scheduled. Enjoy your day.</p>
        </div>
      )}
    </div>
  );
}