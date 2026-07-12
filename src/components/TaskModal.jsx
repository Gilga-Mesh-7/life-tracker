import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function TaskModal({ task, userId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Health',
    task_type: 'boolean',
    frequency: 'daily',
    active_days: [],
    time_of_day: null,
    target_value: null,
    rollover_type: 'reset',
    is_last_day_of_month: false,
    monthly_week: null,
    monthly_day_of_week: null
  });

  const [monthlyMode, setMonthlyMode] = useState('specific');

  useEffect(() => {
    if (task) {
      let mode = 'specific';
      if (task.is_last_day_of_month) mode = 'last_day';
      else if (task.monthly_week) mode = 'relative';

      setMonthlyMode(mode);
      setFormData({
        name: task.name || '',
        category: task.category || 'Health',
        task_type: task.task_type || 'boolean',
        frequency: task.frequency || 'daily',
        active_days: task.active_days || [],
        time_of_day: task.time_of_day || null,
        target_value: task.target_value || null,
        rollover_type: task.rollover_type || 'reset',
        is_last_day_of_month: task.is_last_day_of_month || false,
        monthly_week: task.monthly_week || null,
        monthly_day_of_week: task.monthly_day_of_week || null
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let dataToSave = { ...formData };

    if (formData.frequency === 'monthly') {
      if (monthlyMode === 'specific') {
        dataToSave.is_last_day_of_month = false;
        dataToSave.monthly_week = null;
        dataToSave.monthly_day_of_week = null;
      } else if (monthlyMode === 'last_day') {
        dataToSave.is_last_day_of_month = true;
        dataToSave.active_days = [];
        dataToSave.monthly_week = null;
        dataToSave.monthly_day_of_week = null;
      } else if (monthlyMode === 'relative') {
        dataToSave.is_last_day_of_month = false;
        dataToSave.active_days = [];
      }
    } else {
      dataToSave.is_last_day_of_month = false;
      dataToSave.monthly_week = null;
      dataToSave.monthly_day_of_week = null;
    }

    if (formData.time_of_day === '') dataToSave.time_of_day = null;
    if (formData.task_type !== 'quantitative') dataToSave.target_value = null;
    
    const { error } = task?.id 
      ? await supabase.from('tasks').update(dataToSave).eq('id', task.id)
      : await supabase.from('tasks').insert([{ ...dataToSave, user_id: userId }]);
    
    if (error) {
      alert('Error saving task: ' + error.message);
    } else {
      onSave(); 
      onClose(); 
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      active_days: prev.active_days.includes(day)
        ? prev.active_days.filter(d => d !== day)
        : [...prev.active_days, day]
    }));
  };

  const handleTimeChange = (e) => {
    setFormData({...formData, time_of_day: e.target.value});
    e.target.blur();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-stone-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-stone-700">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-stone-100">{task ? 'Edit Task' : 'New Task'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Task Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none"
                >
                  <option value="Health">Health</option>
                  <option value="Finance">Finance</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Type</label>
                <select
                  value={formData.task_type}
                  onChange={(e) => setFormData({...formData, task_type: e.target.value})}
                  className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none"
                >
                  <option value="boolean">Checkbox</option>
                  <option value="quantitative">Counter</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {formData.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Active Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                        formData.active_days.includes(day)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-stone-700 text-stone-300 border-stone-600 hover:bg-stone-600'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.frequency === 'monthly' && (
              <div className="space-y-3 p-3 bg-stone-700/50 rounded-lg border border-stone-600">
                <label className="block text-sm font-medium text-stone-300 mb-2">Monthly Rule</label>
                
                <div className="flex items-center gap-2">
                  <input type="radio" id="mode_specific" name="monthly_mode" value="specific" checked={monthlyMode === 'specific'} onChange={() => setMonthlyMode('specific')} className="h-4 w-4 text-blue-600 border-stone-600 bg-stone-700 focus:ring-blue-500" />
                  <label htmlFor="mode_specific" className="text-sm text-stone-300 cursor-pointer">Specific Date(s)</label>
                </div>
                {monthlyMode === 'specific' && (
                  <div className="ml-6 grid grid-cols-7 gap-2">
                    {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(day => (
                      <button key={day} type="button" onClick={() => {
                          const currentDays = formData.active_days || [];
                          const newDays = currentDays.includes(day) ? currentDays.filter(d => d !== day) : [...currentDays, day];
                          setFormData({ ...formData, active_days: newDays });
                        }}
                        className={`py-1 text-xs rounded border transition-colors ${formData.active_days?.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-stone-700 text-stone-300 border-stone-600 hover:bg-stone-600'}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <input type="radio" id="mode_last_day" name="monthly_mode" value="last_day" checked={monthlyMode === 'last_day'} onChange={() => setMonthlyMode('last_day')} className="h-4 w-4 text-blue-600 border-stone-600 bg-stone-700 focus:ring-blue-500" />
                  <label htmlFor="mode_last_day" className="text-sm text-stone-300 cursor-pointer">Last Day of the Month</label>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input type="radio" id="mode_relative" name="monthly_mode" value="relative" checked={monthlyMode === 'relative'} onChange={() => setMonthlyMode('relative')} className="h-4 w-4 text-blue-600 border-stone-600 bg-stone-700 focus:ring-blue-500" />
                  <label htmlFor="mode_relative" className="text-sm text-stone-300 cursor-pointer">Relative Day (e.g., First Sunday)</label>
                </div>
                {monthlyMode === 'relative' && (
                  <div className="ml-6 flex gap-2">
                    <select value={formData.monthly_week || ''} onChange={(e) => setFormData({ ...formData, monthly_week: e.target.value })} className="border border-stone-600 rounded-lg px-3 py-1 text-sm outline-none bg-stone-700 text-stone-100">
                      <option value="" disabled>Select Week</option>
                      <option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option><option value="4">4th</option><option value="last">Last</option>
                    </select>
                    <select value={formData.monthly_day_of_week || ''} onChange={(e) => setFormData({ ...formData, monthly_day_of_week: e.target.value })} className="border border-stone-600 rounded-lg px-3 py-1 text-sm outline-none bg-stone-700 text-stone-100">
                      <option value="" disabled>Select Day</option>
                      <option value="Mon">Monday</option><option value="Tue">Tuesday</option><option value="Wed">Wednesday</option><option value="Thu">Thursday</option><option value="Fri">Friday</option><option value="Sat">Saturday</option><option value="Sun">Sunday</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Time of Day (Optional)</label>
              <input type="time" value={formData.time_of_day || ''} onChange={handleTimeChange} className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none" />
            </div>

            {/* NEW: Rollover Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Rollover Type</label>
              <select
                value={formData.rollover_type}
                onChange={(e) => setFormData({...formData, rollover_type: e.target.value})}
                className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none"
              >
                <option value="reset">Reset (Start fresh next cycle)</option>
                <option value="flag_overdue">⚠️ Flag if overdue</option>
              </select>
              <p className="text-xs text-stone-500 mt-1">Choose how missed tasks are handled.</p>
            </div>

            {formData.task_type === 'quantitative' && (
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Target Value (e.g., 150 mins)</label>
                <input type="number" value={formData.target_value || ''} onChange={(e) => setFormData({...formData, target_value: parseInt(e.target.value) || 0})} className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none" placeholder="0" />
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-stone-700 mt-6">
              <button type="button" onClick={onClose} className="flex-1 bg-stone-700 text-stone-300 py-2 rounded-lg hover:bg-stone-600 font-medium transition-colors">Cancel</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">Save Task</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}