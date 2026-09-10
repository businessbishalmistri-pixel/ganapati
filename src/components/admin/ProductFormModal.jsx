import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Package, 
  DollarSign, 
  Tag, 
  Image as ImageIcon,
  Save,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Rice / Grains', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Oil / Ghee', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Atta / Flour', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
  { label: 'Spices / Masala', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80' },
  { label: 'Biscuits / Snacks', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80' },
  { label: 'Tea / Coffee', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80' },
  { label: 'Dry Fruits', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cleaning / Soap', url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80' },
];

export function ProductFormModal({ isOpen, onClose, onSave, productToEdit, categories = [] }) {
  const isEditing = Boolean(productToEdit && productToEdit.id);

  const [formData, setFormData] = useState({
    title: '',
    category: categories[0]?.name || 'Groceries & Staples',
    brand: 'Ganapati Stores',
    description: '',
    selling_price: '',
    mrp: '',
    in_stock: true,
    image_url: '',
    unit: '1 kg',
    status: 'active'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        title: productToEdit.title || productToEdit.name || '',
        category: productToEdit.category || (categories[0]?.name || 'Groceries & Staples'),
        brand: productToEdit.brand || 'Ganapati Stores',
        description: productToEdit.description || '',
        selling_price: productToEdit.selling_price ?? productToEdit.price ?? '',
        mrp: productToEdit.mrp ?? productToEdit.original_price ?? '',
        in_stock: productToEdit.in_stock !== false && (productToEdit.stock > 0 || productToEdit.stock === undefined),
        image_url: productToEdit.image_url || productToEdit.image || '',
        unit: productToEdit.unit || '1 kg',
        status: productToEdit.status || 'active'
      });
    } else {
      setFormData({
        title: '',
        category: categories[0]?.name || 'Groceries & Staples',
        brand: 'Ganapati Stores',
        description: '',
        selling_price: '',
        mrp: '',
        in_stock: true,
        image_url: PRESET_IMAGES[0].url,
        unit: '1 kg',
        status: 'active'
      });
    }
    setErrors({});
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const sellingNum = parseFloat(formData.selling_price) || 0;
  const mrpNum = parseFloat(formData.mrp) || sellingNum;

  const discountPercent = mrpNum > sellingNum && mrpNum > 0
    ? Math.round(((mrpNum - sellingNum) / mrpNum) * 100)
    : 0;

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Product name is required';
    if (!formData.category.trim()) errs.category = 'Category is required';
    if (isNaN(sellingNum) || sellingNum <= 0) errs.selling_price = 'Please enter a valid price';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        selling_price: sellingNum,
        price: sellingNum,
        mrp: mrpNum,
        original_price: mrpNum,
        in_stock: formData.in_stock,
        stock: formData.in_stock ? 999 : 0,
        stock_quantity: formData.in_stock ? 999 : 0,
        id: productToEdit?.id
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Failed to save product', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-slate-500">
                Instantly published to Ganapati Stores storefront
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fortune Sunlite Sunflower Oil 1L"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.title ? 'border-red-300 ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="Other">Other / General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pack Size / Unit
              </label>
              <input
                type="text"
                placeholder="e.g. 1 kg, 500g, 1 Litre, 1 Pack"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="150"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              {errors.selling_price && <p className="text-xs text-red-500 mt-1">{errors.selling_price}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>MRP / Original Price (₹)</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  placeholder="180"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              {discountPercent > 0 && (
                <span className="text-[10px] font-bold text-emerald-600 mt-1 inline-block">
                  {discountPercent}% OFF badge shown on storefront
                </span>
              )}
            </div>
          </div>

          {/* STOCK STATUS TOGGLE (PROMINENT) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Stock Availability</span>
                {formData.in_stock ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    In Stock
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                    Out of Stock
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {formData.in_stock 
                  ? 'Customers can add this product to their cart and place orders.' 
                  : 'Product will show "Out of Stock" badge and cannot be ordered.'}
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, in_stock: !formData.in_stock })}
              className={`relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.in_stock ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  formData.in_stock ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Image URL & Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Product Image URL
            </label>
            <div className="flex gap-3 items-start">
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=120&q=80';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>

            {/* Presets */}
            <div className="pt-1">
              <span className="text-[11px] text-slate-400 font-medium block mb-1.5">Quick sample images:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: preset.url })}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                      formData.image_url === preset.url
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Description</span>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </label>
            <textarea
              rows={2}
              placeholder="Product details, features, or brand notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Add Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
