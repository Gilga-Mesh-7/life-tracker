export default function TaskSection({ title, tasks, onEdit, onDelete }) {
  if (tasks.length === 0) return null;
  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">{title}</h2>
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-sm overflow-hidden">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 border-b border-stone-700 last:border-b-0 flex justify-between items-center hover:bg-stone-700/50 transition-colors">
            <div>
              <div className="font-semibold text-stone-100 flex items-center gap-2">
                <span className="text-stone-500 font-mono">{task.time_of_day || '--:--'}</span>
                <span>|</span>
                <span>{task.name}</span>
              </div>
              {task.active_days && task.active_days.length > 0 && (
                <div className="text-xs text-stone-400 mt-1 ml-12">
                  Days: {task.active_days.join(', ')}
                </div>
              )}
              {task.rollover_type === 'flag_overdue' && (
                <div className="text-xs text-red-400 mt-1 ml-12">
                  Rollover: ⚠️ Flag if overdue
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(task)} className="text-blue-400 hover:bg-blue-900/20 p-2 rounded-full transition-colors">✏️</button>
              <button onClick={() => onDelete(task.id)} className="text-red-400 hover:bg-red-900/20 p-2 rounded-full transition-colors">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}