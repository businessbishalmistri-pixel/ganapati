import React, { useState } from 'react';
import { 
  FolderTree, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Package, 
  Sparkles,
  ShoppingBag,
  Coffee,
  Home,
  Milk,
  Flame,
  Layers
} from 'lucide-react';

const ICON_OPTIONS = [
  { name: 'ShoppingBag', label: 'Bag' },
  { name: 'Package', label: 'Box' },
  { name: 'Coffee', label: 'Coffee/Snack' },
  { name: 'Milk', label: 'Dairy' },
  { name: 'Flame', label: 'Spices' },
  { name: 'Home', label: 'Household' },
  { name: 'Sparkles', label: 'Care' }
];

export function CategoryManager({ categories = [], products = [], onAddCategory, onUpdateCategory, onDeleteCategory }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('ShoppingBag');
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('ShoppingBag');

  // Compute category product counts
  const categoryCounts = categories.map((cat) => {
    const count = products.filter((p) => p.category === cat.name).length;
    return { ...cat, count };
  });

  const handleStartAdd = () => {
    setIsAdding(true);
    setNewCatName('');
    setNewCatIcon('ShoppingBag');
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({ name: newCatName.trim(), icon: newCatIcon });
    setIsAdding(false);
    setNewCatName('');
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon || 'ShoppingBag');
  };

  const handleSaveEdit = (id) => {
    if (!editName.trim()) return;
    onUpdateCategory(id, { name: editName.trim(), icon: editIcon });
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Category Management
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              {categories.length} Categories
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize products into categories displayed in the storefront sidebar and shelves.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Add New Category Card */}
      {isAdding && (
        <form onSubmit={handleSaveAdd} className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 animate-fadeIn space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              Create Category
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                required
                placeholder="e.g. Organic Pulses & Dals"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Icon Representation
              </label>
              <select
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.name} value={opt.name}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Save Category
            </button>
          </div>
        </form>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {categoryCounts.map((cat) => {
          const isEdit = editingId === cat.id;

          return (
            <div
              key={cat.id}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {isEdit ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Category Name</label>
                    <input
                      type="text"
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSaveEdit(cat.id)}
                      className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-700 flex items-center justify-center font-bold">
                        <FolderTree className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                        <p className="text-[11px] text-slate-400 font-mono">
                          /{cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full">
                      {cat.count} {cat.count === 1 ? 'product' : 'products'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit category"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete category "${cat.name}"? Products in this category will become unassigned.`)) {
                            onDeleteCategory(cat.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
