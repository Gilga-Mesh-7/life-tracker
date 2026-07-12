import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function GoalModal({ goal, userId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '', category: 'backlog', deadline: '', target_value: null, current_value: 0, is_completed: false
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title || '', category: goal.category || 'backlog',
        deadline: goal.deadline || '', target_value: goal.target_value || null,
        current_value: goal.current_value || 0, is_completed: goal.is_completed || false
      });
    }
  }, [goal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      deadline: formData.deadline === '' ? null : formData.deadline,
      target_value: formData.target_value ? parseInt(formData.target_value) : null,
      current_value: formData.current_value ? parseInt(formData.current_value) : 0
    };
    const { error } = goal?.id 
      ? await supabase.from('goals').update(dataToSave).eq('id', goal.id)
      : await supabase.from('goals').insert([{ ...dataToSave, user_id: userId }]);
    
    if (error) alert('Error saving goal: ' + error.message);
    else { onSave(); onClose(); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-stone-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-stone-700">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-stone-100">{goal ? 'Edit Goal' : 'New Goal / Idea'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Title</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Category</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="backlog">📥 Backlog (Someday/Maybe)</option>
                <option value="attaining">🎯 Attaining (Growth/Needs)</option>
                <option value="enjoyment">🎉 Enjoyment (Wants)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Deadline (Optional)</label>
              <input type="date" value={formData.deadline || ''} onChange={(e) => setFormData({...formData, deadline: e.target.value})} className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Target Value</label>
                <input type="number" value={formData.target_value || ''} onChange={(e) => setFormData({...formData, target_value: e.target.value})} className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Current Value</label>
                <input type="number" value={formData.current_value || ''} onChange={(e) => setFormData({...formData, current_value: e.target.value})} className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 5" />
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-stone-700 mt-6">
              <button type="button" onClick={onClose} className="flex-1 bg-stone-700 text-stone-300 py-2 rounded-lg hover:bg-stone-600 font-medium transition-colors">Cancel</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}