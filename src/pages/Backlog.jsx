import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import GoalModal from '../components/GoalModal';
import ConfirmModal from '../components/ConfirmModal'; // Added

export default function Backlog() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [userId, setUserId] = useState(null);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
      fetchGoals();
    };
    init();
  }, []);

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('category', 'backlog') 
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching goals:', error);
    else setGoals(data || []);
    setLoading(false);
  };

  // --- DELETE FUNCTIONS ---
  const handleDeleteRequest = (id) => {
    setGoalToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (goalToDelete) {
      await supabase.from('goals').delete().eq('id', goalToDelete);
      fetchGoals();
    }
    setShowDeleteModal(false);
    setGoalToDelete(null);
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingGoal(null);
    setShowModal(true);
  };

  if (loading) return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Backlog</h1>
        <button 
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-sm transition-colors"
        >
          + NEW
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-3 mb-6 rounded text-sm text-blue-800 dark:text-blue-200">
         Dump your ideas here. Tap to edit and promote them to Horizons when ready!
      </div>

      {/* Shopping / Ideas List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        {goals.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500">
            <p className="text-lg">📥 Your backlog is empty</p>
            <p className="text-sm mt-1">Add ideas, shopping items, or future goals here.</p>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex-1">
                <div className="font-semibold text-gray-800 dark:text-white">{goal.title}</div>
                {goal.deadline && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Due: {new Date(goal.deadline).toLocaleDateString()}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(goal)} className="text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-full transition-colors">✏️</button>
                <button onClick={() => handleDeleteRequest(goal.id)} className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <GoalModal 
          goal={editingGoal} 
          userId={userId}
          onClose={() => setShowModal(false)} 
          onSave={fetchGoals}
        />
      )}
      
      {/* Custom Delete Modal */}
      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Item?"
        message="This item will be permanently removed from your backlog."
      />
    </div>
  );
}