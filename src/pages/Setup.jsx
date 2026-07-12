import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import TaskSection from '../components/TaskSection';
import TaskModal from '../components/TaskModal';
import BookModal from '../components/BookModal';
import ConfirmModal from '../components/ConfirmModal';

export default function Setup() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [userId, setUserId] = useState(null);
  
  const [showBookModal, setShowBookModal] = useState(false);
  const [book, setBook] = useState(null);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUserId(session.user.id);
      fetchTasks();
      fetchBook();
    };
    init();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (!error) setTasks(data || []);
    setLoading(false);
  };

  const fetchBook = async () => {
    const { data, error } = await supabase.from('books').select('*').eq('status', 'in_progress').limit(1).maybeSingle(); 
    if (!error) setBook(data || null);
  };

  // --- DELETE LOGIC ---
  const handleDeleteRequest = (taskId) => {
    setTaskToDelete(taskId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (taskToDelete) {
      await supabase.from('tasks').delete().eq('id', taskToDelete);
      setTasks(tasks.filter(t => t.id !== taskToDelete));
    }
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const handleLogout = async () => await supabase.auth.signOut();

  const dailyTasks = tasks.filter(t => t.frequency === 'daily' && t.task_type !== 'quantitative');
  const weeklyTasks = tasks.filter(t => t.frequency === 'weekly' && t.task_type !== 'quantitative');
  const monthlyTasks = tasks.filter(t => t.frequency === 'monthly');
  const volumeTasks = tasks.filter(t => t.task_type === 'quantitative');

  if (loading) return <div className="p-4 text-center text-stone-500">Loading...</div>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-stone-100">Setup / Rules</h1>
        <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-sm">+ NEW</button>
      </div>
      
      <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-3 mb-6 rounded text-sm text-yellow-200">⚠️ Changes here update your Dashboard automatically.</div>

      <TaskSection title=" RECURRING — DAILY" tasks={dailyTasks} onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }} onDelete={handleDeleteRequest} />
      <TaskSection title="🔄 RECURRING — WEEKLY" tasks={weeklyTasks} onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }} onDelete={handleDeleteRequest} />
      <TaskSection title=" RECURRING — MONTHLY" tasks={monthlyTasks} onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }} onDelete={handleDeleteRequest} />
      <TaskSection title="📊 VOLUME / COUNTER TRACKERS" tasks={volumeTasks} onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }} onDelete={handleDeleteRequest} />

      <div className="mb-6">
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">📖 BOOK OF THE MONTH</h2>
        <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-sm p-4">
          {book ? (
            <>
              <div className="text-stone-400 text-sm mb-1">Currently Reading:</div>
              <div className="font-semibold text-stone-100">"{book.title}" {book.author && `by ${book.author}`}</div>
              <div className="text-sm text-stone-300 mt-1">Total Pages: {book.total_pages} | Status: 🟢 In Progress</div>
              <button onClick={() => setShowBookModal(true)} className="mt-4 text-sm bg-blue-900/30 text-blue-400 px-3 py-1 rounded hover:bg-blue-900/50 transition-colors">✏️ Edit Book Details</button>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-stone-400 mb-3">No active book tracked.</p>
              <button onClick={() => setShowBookModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">+ Start New Book</button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">⚙️ ACCOUNT</h2>
        <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-sm p-4">
          <div className="text-sm text-stone-300 mb-4">Logged in as: {userId ? 'User Active' : 'No User'}</div>
          <button 
            onClick={handleLogout} 
            className="w-full bg-red-900/20 text-red-400 p-3 rounded-lg font-semibold hover:bg-red-900/40 transition-colors border border-red-900/30"
          >
            Log Out
          </button>
        </div>
      </div>

      {showTaskModal && <TaskModal task={editingTask} userId={userId} onClose={() => setShowTaskModal(false)} onSave={fetchTasks} />}
      {showBookModal && <BookModal book={book} userId={userId} onClose={() => setShowBookModal(false)} onSave={() => { setShowBookModal(false); fetchBook(); }} />}
      
      {/* CUSTOM DELETE MODAL */}
      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task?"
        message="This action cannot be undone. This task will be permanently removed from your rules."
      />
    </div>
  );
}