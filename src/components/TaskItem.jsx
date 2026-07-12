import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getLocalDate } from '../lib/dateUtils';

export default function TaskItem({ task, isCompleted, currentValue, userId, onTaskUpdate, isOverdue }) {
  const [loading, setLoading] = useState(false);

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleToggle = async () => {
    setLoading(true);
    const today = getLocalDate();
    const { error } = await supabase.from('task_logs').upsert({
      user_id: userId,
      task_id: task.id,
      log_date: today,
      is_completed: !isCompleted,
      current_value: task.task_type === 'quantitative' ? currentValue : 0
    }, { onConflict: 'user_id,task_id,log_date' });
    if (error) console.error('Error toggling task:', error);
    onTaskUpdate();
    setLoading(false);
  };

  const handleQuickAdd = async (amount) => {
    setLoading(true);
    const today = getLocalDate();
    const newValue = Math.max(0, (currentValue || 0) + amount);
    const { error } = await supabase.from('task_logs').upsert({
      user_id: userId,
      task_id: task.id,
      log_date: today,
      is_completed: newValue >= task.target_value,
      current_value: newValue
    }, { onConflict: 'user_id,task_id,log_date' });
    if (error) console.error('Error updating value:', error);
    onTaskUpdate();
    setLoading(false);
  };

  const val = currentValue || 0;
  const isDone = val >= task.target_value;

  return (
    <div className={`p-4 border-b border-stone-700 last:border-b-0 flex flex-col gap-2 relative ${isCompleted && task.task_type === 'boolean' ? 'opacity-50' : ''}`}>
      
      {/* OVERDUE BADGE */}
      {isOverdue && !isCompleted && (
        <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          ⚠️ OVERDUE
        </span>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-stone-500 font-mono text-sm w-12">{formatTime(task.time_of_day)}</span>
          
          {task.task_type === 'boolean' ? (
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-stone-500 hover:border-blue-500'
              }`}
            >
              {isCompleted && <span className="text-xs">✓</span>}
            </button>
          ) : (
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
              isDone ? 'bg-green-500 border-green-500 text-white' : 'border-stone-500 text-stone-400'
            }`}>
              {Math.round((val / task.target_value) * 100)}%
            </span>
          )}
          
          <span className={`font-medium ${isCompleted && task.task_type === 'boolean' ? 'line-through text-stone-500' : 'text-stone-100'}`}>
            {task.name}
          </span>
        </div>
      </div>

      {task.task_type === 'quantitative' && (
        <div className="ml-20 flex flex-col gap-2">
          <div className="w-full bg-stone-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isDone ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min((val / task.target_value) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-mono">
              {val} / {task.target_value}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handleQuickAdd(-10)}
                disabled={loading || val === 0}
                className="text-xs bg-stone-700 text-stone-300 px-2 py-1 rounded hover:bg-stone-600 disabled:opacity-50 transition-colors"
              >
                -10
              </button>
              <button
                onClick={() => handleQuickAdd(10)}
                disabled={loading}
                className="text-xs bg-stone-700 text-stone-300 px-2 py-1 rounded hover:bg-stone-600 transition-colors"
              >
                +10
              </button>
              <button
                onClick={() => {
                  const amount = isDone ? -val : (task.target_value - val);
                  handleQuickAdd(amount);
                }}
                disabled={loading}
                className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                  isDone
                    ? 'bg-red-900/50 text-red-400 hover:bg-red-900'
                    : 'bg-blue-900/50 text-blue-400 hover:bg-blue-900'
                }`}
              >
                {isDone ? 'Reset' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}