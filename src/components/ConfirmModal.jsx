export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-stone-800 rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100 border border-stone-700">
        <h3 className="text-lg font-bold text-stone-100 mb-2">{title}</h3>
        <p className="text-sm text-stone-300 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-stone-300 bg-stone-700 hover:bg-stone-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}