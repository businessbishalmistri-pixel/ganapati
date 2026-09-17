import React, { useState, useRef } from 'react';
import { 
  FolderTree, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle,
  UploadCloud,
  Loader2,
  ImagePlus,
  CheckCircle2,
  Package
} from 'lucide-react';
import { compressProductImage } from '../../utils/imageCompressor';
import { uploadImageToSupabase } from '../../services/imageUploadService';
import { QUICK_COMMERCE_CATEGORIES } from '../../data/categoryCatalog';

export function CategoryManager({ 
  categories = [], 
  products = [], 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [isUploadingNew, setIsUploadingNew] = useState(false);
  const [newUploadStatus, setNewUploadStatus] = useState('');
  const [showNewUrlInput, setShowNewUrlInput] = useState(false);
  const addFileInputRef = useRef(null);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);
  const [editUploadStatus, setEditUploadStatus] = useState('');
  const [showEditUrlInput, setShowEditUrlInput] = useState(false);
  const editFileInputRef = useRef(null);

  // Reassign Modal State for non-empty categories
  const [reassignModalCat, setReassignModalCat] = useState(null);
  const [targetCategoryName, setTargetCategoryName] = useState('');

  // Compute category product counts & resolve fallback preset images
  const categoryCounts = categories.map((cat) => {
    const count = products.filter((p) => p.category === cat.name).length;
    const lower = (cat.name || '').toLowerCase();
    const preset = QUICK_COMMERCE_CATEGORIES.find(
      (c) => c.name.toLowerCase() === lower || (c.keywords && c.keywords.some((k) => lower.includes(k)))
    );
    const resolvedImage = cat.image_url || cat.image || (preset ? preset.image : '');
    return { ...cat, count, resolvedImage };
  });

  const handleStartAdd = () => {
    setIsAdding(true);
    setNewCatName('');
    setNewCatImage('');
    setShowNewUrlInput(false);
  };

  const handleNewImageFileSelect = async (file) => {
    if (!file) return;
    try {
      setIsUploadingNew(true);
      setNewUploadStatus('Compressing category image...');
      
      const compressed = await compressProductImage(file);
      setNewUploadStatus('Saving to Supabase Storage...');
      
      const cleanName = (newCatName || file.name.split('.')[0] || 'category').trim();
      const uploadedUrl = await uploadImageToSupabase(compressed.blob, `categories/${cleanName}`, compressed.dataUrl);
      
      setNewCatImage(uploadedUrl || compressed.dataUrl);
    } catch (err) {
      console.warn('Category image upload notice:', err);
    } finally {
      setIsUploadingNew(false);
      setNewUploadStatus('');
    }
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({ 
      name: newCatName.trim(),
      image_url: newCatImage.trim(),
      image: newCatImage.trim()
    });
    setIsAdding(false);
    setNewCatName('');
    setNewCatImage('');
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditImage(cat.image_url || cat.image || '');
    setShowEditUrlInput(false);
  };

  const handleEditImageFileSelect = async (file) => {
    if (!file) return;
    try {
      setIsUploadingEdit(true);
      setEditUploadStatus('Compressing image...');
      
      const compressed = await compressProductImage(file);
      setEditUploadStatus('Saving to Supabase...');
      
      const cleanName = (editName || file.name.split('.')[0] || 'category').trim();
      const uploadedUrl = await uploadImageToSupabase(compressed.blob, `categories/${cleanName}`, compressed.dataUrl);
      
      setEditImage(uploadedUrl || compressed.dataUrl);
    } catch (err) {
      console.warn('Edit category image upload notice:', err);
    } finally {
      setIsUploadingEdit(false);
      setEditUploadStatus('');
    }
  };

  const handleSaveEdit = (id) => {
    if (!editName.trim()) return;
    onUpdateCategory(id, { 
      name: editName.trim(),
      image_url: editImage.trim(),
      image: editImage.trim()
    });
    setEditingId(null);
  };

  // Smart Delete Handler: 0 items = instant delete with no confirmation; >0 items = modal popup
  const handleDeleteClick = (cat) => {
    if (cat.count === 0) {
      onDeleteCategory(cat.id);
    } else {
      setReassignModalCat(cat);
      setTargetCategoryName('');
    }
  };

  const handleConfirmReassignAndDelete = () => {
    if (!reassignModalCat || !targetCategoryName.trim()) return;
    onDeleteCategory(reassignModalCat.id, targetCategoryName.trim());
    setReassignModalCat(null);
    setTargetCategoryName('');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Category Management
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              {categories.length} Categories
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create categories with custom cover collages & artwork displayed on your storefront.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Add New Category Form (Mobile-Friendly) */}
      {isAdding && (
        <form onSubmit={handleSaveAdd} className="bg-blue-50/70 p-4 sm:p-5 rounded-2xl border border-blue-200 animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              Create New Category
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-blue-100/50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                required
                placeholder="e.g. Snacks & Biscuits, Beverages, Puja Items..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
              />
            </div>

            {/* Category Image Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Category Collage / Cover Image
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewUrlInput(!showNewUrlInput)}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  {showNewUrlInput ? 'Hide URL' : 'Use Image URL'}
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={addFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleNewImageFileSelect(file);
                }}
              />

              {/* Image Dropzone / Preview */}
              {isUploadingNew ? (
                <div className="p-3 bg-white border border-blue-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-blue-700">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>{newUploadStatus || 'Uploading...'}</span>
                </div>
              ) : newCatImage ? (
                <div className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <img
                    src={newCatImage}
                    alt="Category Preview"
                    className="w-12 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=120&q=80';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Image Attached
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">Saved in Supabase Storage</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatImage('')}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => addFileInputRef.current?.click()}
                  className="p-3 bg-white border border-dashed border-slate-300 hover:border-blue-400 rounded-xl text-center cursor-pointer hover:bg-blue-50/40 transition-colors shadow-2xs flex items-center justify-center gap-2"
                >
                  <UploadCloud className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">
                    Upload Custom Image / Collage
                  </span>
                </div>
              )}

              {/* URL input fallback */}
              {showNewUrlInput && (
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newCatImage}
                  onChange={(e) => setNewCatImage(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200/60">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Category
            </button>
          </div>
        </form>
      )}

      {/* Categories Grid (Mobile-Friendly Responsive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {categoryCounts.map((cat) => {
          const isEdit = editingId === cat.id;

          return (
            <div
              key={cat.id}
              className={`bg-white p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isEdit 
                  ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-md' 
                  : 'border-slate-200/80 shadow-xs hover:shadow-md'
              }`}
            >
              {isEdit ? (
                /* Edit Mode Inside Card */
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-xs font-bold text-blue-900 uppercase">Edit Category</span>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Edit Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Category Name</label>
                    <input
                      type="text"
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Edit Image */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-slate-500">Custom Image</label>
                      <button
                        type="button"
                        onClick={() => setShowEditUrlInput(!showEditUrlInput)}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        {showEditUrlInput ? 'Hide URL' : 'Use URL'}
                      </button>
                    </div>

                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleEditImageFileSelect(file);
                      }}
                    />

                    {isUploadingEdit ? (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-1.5 text-xs text-blue-600 font-bold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{editUploadStatus || 'Uploading...'}</span>
                      </div>
                    ) : editImage ? (
                      <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <img
                          src={editImage}
                          alt={editName}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-200 flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=120&q=80';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate">Custom Artwork</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="px-2 py-1 text-[10px] font-bold bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditImage('')}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="w-full py-1.5 px-2 bg-slate-50 border border-dashed border-slate-300 hover:border-blue-400 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ImagePlus className="w-3.5 h-3.5 text-blue-600" />
                        <span>Upload Custom Image</span>
                      </button>
                    )}

                    {showEditUrlInput && (
                      <input
                        type="url"
                        placeholder="https://..."
                        value={editImage}
                        onChange={(e) => setEditImage(e.target.value)}
                        className="w-full mt-1.5 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(cat.id)}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal Card View */
                <>
                  <div className="flex items-start gap-3">
                    {/* Category Thumbnail */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xs">
                      {cat.resolvedImage ? (
                        <img
                          src={cat.resolvedImage}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <FolderTree className="w-5 h-5 text-blue-600" />
                      )}
                    </div>

                    {/* Category Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        /{cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}
                      </p>
                      {cat.image_url ? (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5">
                          ✓ Custom image
                        </span>
                      ) : (
                        <span className="text-[9.5px] text-slate-400 font-medium mt-0.5 block">
                          Preset default
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Product Count & Action Buttons */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      cat.count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cat.count} {cat.count === 1 ? 'product' : 'products'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit category name & image"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteClick(cat)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title={cat.count === 0 ? "Delete empty category immediately" : `Delete category (Reassign ${cat.count} products)`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 🔄 POPUP MODAL: Reassign Products & Delete Category */}
      {reassignModalCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reassign Products & Delete</h3>
                  <p className="text-xs text-slate-500">Category contains active products</p>
                </div>
              </div>
              <button
                onClick={() => setReassignModalCat(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Information Notice */}
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">
                Category <span className="underline font-bold text-amber-950 font-mono">"{reassignModalCat.name}"</span> currently has <span className="font-extrabold text-amber-950">{reassignModalCat.count}</span> products.
              </p>
              <p className="text-[11px] text-amber-800">
                Please select a new category to shift all these products into before deleting.
              </p>
            </div>

            {/* Category Selector Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Shift Products to Category <span className="text-red-500">*</span>
              </label>
              <select
                value={targetCategoryName}
                onChange={(e) => setTargetCategoryName(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="">-- Select Destination Category --</option>
                {categories
                  .filter((c) => c.id !== reassignModalCat.id && c.name !== reassignModalCat.name)
                  .map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setReassignModalCat(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {targetCategoryName && (
                <button
                  type="button"
                  onClick={handleConfirmReassignAndDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer animate-fadeIn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Shift {reassignModalCat.count} Products & Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
