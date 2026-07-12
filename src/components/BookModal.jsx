import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function BookModal({ book, userId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '', author: '', total_pages: 0, current_pages: 0, status: 'in_progress'
  });

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '', author: book.author || '',
        total_pages: book.total_pages || 0, current_pages: book.current_pages || 0,
        status: book.status || 'in_progress'
      });
    }
  }, [book]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      total_pages: parseInt(formData.total_pages) || 0,
      current_pages: parseInt(formData.current_pages) || 0
    };
    const { error } = book?.id 
      ? await supabase.from('books').update(dataToSave).eq('id', book.id)
      : await supabase.from('books').insert([{ ...dataToSave, user_id: userId }]);
    
    if (error) alert('Error saving book: ' + error.message);
    else { onSave(); onClose(); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-stone-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-stone-700">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-stone-100">{book ? 'Edit Book' : 'Start New Book'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Title</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Author</label>
              <input type="text" value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Total Pages</label>
                <input type="number" value={formData.total_pages} onChange={(e) => setFormData({...formData, total_pages: e.target.value})} className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Current Pages</label>
                <input type="number" value={formData.current_pages} onChange={(e) => setFormData({...formData, current_pages: e.target.value})} className="w-full border border-stone-600 rounded-lg px-3 py-2 bg-stone-700 text-stone-100 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-stone-700 mt-6">
              <button type="button" onClick={onClose} className="flex-1 bg-stone-700 text-stone-300 py-2 rounded-lg hover:bg-stone-600 font-medium transition-colors">Cancel</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">Save Book</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}