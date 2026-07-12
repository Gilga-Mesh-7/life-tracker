import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import GoalModal from '../components/GoalModal';
import BookModal from '../components/BookModal';
import ConfirmModal from '../components/ConfirmModal';

export default function Horizons() {
  const [activeTab, setActiveTab] = useState('attaining');
  const [goals, setGoals] = useState([]);
  const [achievedGoals, setAchievedGoals] = useState([]);
  const [books, setBooks] = useState([]);
  const [archivedBooks, setArchivedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  
  const [pageUpdates, setPageUpdates] = useState({});
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUserId(session.user.id);
      fetchData();
    };
    init();
  }, [activeTab]);

  const fetchData = async () => {
    // Fetch Active Goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('category', activeTab)
      .eq('is_completed', false)
      .order('deadline', { ascending: true });
    setGoals(goalsData || []);

    // Fetch Achieved Goals (Ordered by created_at desc so newest is at the top)
    const { data: achievedData } = await supabase
      .from('goals')
      .select('*')
      .eq('category', activeTab)
      .eq('is_completed', true)
      .order('created_at', { ascending: false });
    setAchievedGoals(achievedData || []);

    // Fetch Active Books
    const { data: booksData } = await supabase
      .from('books')
      .select('*')
      .eq('status', 'in_progress')
      .order('created_at', { ascending: true });
    setBooks(booksData || []);
    
    // Fetch Archived Books (Ordered by created_at desc so newest is at the top)
    const { data: archivedData } = await supabase
      .from('books')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    setArchivedBooks(archivedData || []);
    
    const updates = {};
    booksData?.forEach(book => {
      updates[book.id] = book.current_pages;
    });
    setPageUpdates(updates);
    
    setLoading(false);
  };

  const handleUpdatePages = async (bookId, pages) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    const pageNum = parseInt(pages);
    
    if (isNaN(pageNum) || pageNum < 0) {
      alert("Please enter a valid number of pages.");
      return;
    }
    if (pageNum > book.total_pages) {
      alert("You can't read more pages than the book has!");
      return;
    }

    const { error } = await supabase.from('books').update({ current_pages: pageNum }).eq('id', bookId);
    if (!error) {
      setBooks(books.map(b => b.id === bookId ? { ...b, current_pages: pageNum } : b));
    } else {
      alert("Error updating pages: " + error.message);
    }
  };

  const handlePageInputChange = (bookId, value) => {
    setPageUpdates(prev => ({ ...prev, [bookId]: value }));
  };

  const handleFinishBook = async (bookId) => {
    const { error } = await supabase.from('books').update({ status: 'completed' }).eq('id', bookId);
    if (!error) fetchData();
    else alert("Error finishing book: " + error.message);
  };

  const handleRestoreBook = async (bookId) => {
    const { error } = await supabase.from('books').update({ status: 'in_progress' }).eq('id', bookId);
    if (!error) fetchData();
    else alert("Error restoring book: " + error.message);
  };

  const handleCompleteGoal = async (goalId) => {
    const { error } = await supabase.from('goals').update({ is_completed: true }).eq('id', goalId);
    if (!error) fetchData();
    else alert("Error completing goal: " + error.message);
  };

  const handleRestoreGoal = async (goalId) => {
    const { error } = await supabase.from('goals').update({ is_completed: false }).eq('id', goalId);
    if (!error) fetchData();
    else alert("Error restoring goal: " + error.message);
  };

  const handleDeleteRequest = (id) => {
    setGoalToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (goalToDelete) {
      await supabase.from('goals').delete().eq('id', goalToDelete);
      fetchData();
    }
    setShowDeleteModal(false);
    setGoalToDelete(null);
  };

  const getUrgency = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: `Overdue by ${Math.abs(days)} days`, color: 'text-red-400 bg-red-900/20' };
    if (days === 0) return { text: 'Due today!', color: 'text-red-400 bg-red-900/20' };
    if (days <= 3) return { text: `🚨 ${days} DAYS LEFT!`, color: 'text-red-400 bg-red-900/20' };
    if (days <= 7) return { text: `⏳ ${days} DAYS LEFT`, color: 'text-yellow-400 bg-yellow-900/20' };
    return { text: `⏳ ${days} DAYS LEFT`, color: 'text-stone-400 bg-stone-700' };
  };

  const handleAddBook = () => {
    if (books.length >= 3) {
      alert("You can only track up to 3 books concurrently. Finish one first!");
      return;
    }
    setEditingBook(null);
    setShowBookModal(true);
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setShowBookModal(true);
  };

  if (loading) return <div className="p-4 text-center text-stone-500">Loading Horizons...</div>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-stone-100">Horizons</h1>
        <button 
          onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-sm"
        >
          + NEW
        </button>
      </div>

      <div className="flex bg-stone-700 rounded-lg p-1 mb-6">
        <button 
          onClick={() => setActiveTab('attaining')}
          className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
            activeTab === 'attaining' ? 'bg-stone-800 text-blue-400 shadow-sm' : 'text-stone-400'
          }`}
        >
          🎯 Attaining (Growth)
        </button>
        <button 
          onClick={() => setActiveTab('enjoyment')}
          className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
            activeTab === 'enjoyment' ? 'bg-stone-800 text-purple-400 shadow-sm' : 'text-stone-400'
          }`}
        >
          🎉 Enjoyment (Wants)
        </button>
      </div>

      {/* BOOKS SECTION - Only in Attaining tab */}
      {activeTab === 'attaining' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide">📚 CURRENTLY READING ({books.length}/3)</h3>
            {books.length < 3 && (
              <button 
                onClick={handleAddBook}
                className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1 rounded hover:bg-blue-900/50 font-semibold"
              >
                + Add Book
              </button>
            )}
          </div>
          
          {books.length === 0 ? (
            <div className="bg-stone-800 border border-stone-700 border-dashed rounded-xl p-6 text-center mb-6">
              <p className="text-stone-400 text-sm mb-2">No books in progress</p>
              <button 
                onClick={handleAddBook}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                + Start Your First Book
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {books.map((book) => (
                <div key={book.id} className="bg-stone-800 border border-stone-700 rounded-xl shadow-sm p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-stone-100">"{book.title}"</p>
                      {book.author && <p className="text-sm text-stone-400">by {book.author}</p>}
                    </div>
                    <button onClick={() => handleEditBook(book)} className="text-blue-400 text-xs hover:underline ml-2">Edit</button>
                  </div>
                  
                  <div className="w-full bg-stone-700 rounded-full h-2.5 mt-2 mb-3">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full transition-all" 
                      style={{ width: `${(book.current_pages / book.total_pages) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex gap-2 items-center bg-stone-700/50 p-2 rounded-lg mb-3">
                    <span className="text-xs text-stone-400">Pages:</span>
                    <input 
                      type="number" 
                      value={pageUpdates[book.id] || 0} 
                      onChange={(e) => handlePageInputChange(book.id, e.target.value)}
                      className="w-20 border border-stone-600 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-stone-700 text-stone-100"
                    />
                    <span className="text-xs text-stone-400">/ {book.total_pages}</span>
                    <button 
                      onClick={() => handleUpdatePages(book.id, pageUpdates[book.id])}
                      className="ml-auto bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleFinishBook(book.id)}
                    className="w-full bg-green-900/30 text-green-400 border border-green-800/50 py-2 rounded-lg text-sm font-semibold hover:bg-green-900/50 transition-colors"
                  >
                    ✅ Mark as Finished
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* BOOK ARCHIVE - ALWAYS VISIBLE */}
          <div className="bg-stone-800/50 border border-stone-700 rounded-xl shadow-sm overflow-hidden mt-6">
            <div className="bg-stone-700/50 border-b border-stone-700 p-3 font-semibold text-sm text-stone-300">
              📚 BOOK ARCHIVE ({archivedBooks.length})
            </div>
            
            {archivedBooks.length === 0 ? (
              <div className="p-4 text-center text-stone-500 text-sm">
                No finished books yet. Mark a book as finished to see it here!
              </div>
            ) : (
              <div className="divide-y divide-stone-700">
                {archivedBooks.map((book) => (
                  <div key={book.id} className="p-3 flex justify-between items-center hover:bg-stone-700/30 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-stone-300">"{book.title}"</p>
                      <p className="text-xs text-stone-500">{book.author && `by ${book.author}`} • {book.total_pages} pages</p>
                    </div>
                    <button 
                      onClick={() => handleRestoreBook(book.id)}
                      className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1.5 rounded hover:bg-blue-900/50 transition-colors ml-2"
                    >
                      ↩️ Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE GOALS */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3">🎯 ACTIVE GOALS</h3>
        {goals.length === 0 ? (
          <div className="text-center py-8 text-stone-500 bg-stone-800/50 rounded-xl border border-stone-700">
            <p>No active goals in this category yet.</p>
            <p className="text-sm mt-1">Promote items from your Backlog or add a new one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const urgency = getUrgency(goal.deadline);
              const progress = goal.target_value ? Math.round((goal.current_value / goal.target_value) * 100) : 0;
              
              return (
                <div key={goal.id} className="bg-stone-800 border border-stone-700 rounded-xl shadow-sm p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-stone-100">{goal.title}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }} className="text-blue-400 hover:bg-blue-900/20 p-1 rounded">✏️</button>
                      <button onClick={() => handleDeleteRequest(goal.id)} className="text-red-400 hover:bg-red-900/20 p-1 rounded">🗑️</button>
                    </div>
                  </div>
                  
                  {urgency && (
                    <div className={`text-xs font-bold px-2 py-1 rounded inline-block mb-2 ${urgency.color}`}>
                      {urgency.text}
                    </div>
                  )}

                  {goal.target_value > 0 && (
                    <div className="mt-2 mb-3">
                      <div className="w-full bg-stone-700 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-stone-400 mt-1">
                        <span>{goal.current_value} / {goal.target_value}</span>
                        <span>{progress}%</span>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => handleCompleteGoal(goal.id)}
                    className="w-full bg-green-900/30 text-green-400 border border-green-800/50 py-2 rounded-lg text-sm font-semibold hover:bg-green-900/50 transition-colors"
                  >
                    🎉 Mark as Complete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ACHIEVED GOALS - ALWAYS VISIBLE */}
      <div className="bg-stone-800/50 border border-stone-700 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="bg-stone-700/50 border-b border-stone-700 p-3 font-semibold text-sm text-stone-300">
          🏆 ACHIEVED GOALS ({achievedGoals.length})
        </div>
        
        {achievedGoals.length === 0 ? (
          <div className="p-4 text-center text-stone-500 text-sm">
            No achieved goals yet. Complete a goal to see it here!
          </div>
        ) : (
          <div className="divide-y divide-stone-700">
            {achievedGoals.map((goal) => (
              <div key={goal.id} className="p-3 flex justify-between items-center hover:bg-stone-700/30 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-stone-300">{goal.title}</p>
                  <p className="text-xs text-green-400 mt-1">✅ Completed</p>
                </div>
                <button 
                  onClick={() => handleRestoreGoal(goal.id)}
                  className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1.5 rounded hover:bg-blue-900/50 transition-colors ml-2"
                >
                  ↩️ Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showGoalModal && (
        <GoalModal goal={editingGoal} userId={userId} onClose={() => setShowGoalModal(false)} onSave={fetchData} />
      )}
      {showBookModal && (
        <BookModal book={editingBook} userId={userId} onClose={() => setShowBookModal(false)} onSave={() => { setShowBookModal(false); fetchData(); }} />
      )}
      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Goal?"
        message="This goal will be permanently removed."
      />
    </div>
  );
}