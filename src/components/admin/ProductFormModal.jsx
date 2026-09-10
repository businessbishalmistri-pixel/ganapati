import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Package, 
  Calendar, 
  DollarSign, 
  Tag, 
  Layers,
  Image as ImageIcon,
  Save,
  HelpCircle
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
    sub_category: '',
    brand: 'Ganapati Stores',
    description: '',
    selling_price: '',
    mrp: '',
    cost_price: '',
    stock_quantity: '25',
    low_stock_threshold: '5',
    expiry_date: '',
    status: 'active',
    image_url: '',
    unit: '1 kg',
    sku: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        title: productToEdit.title || productToEdit.name || '',
        category: productToEdit.category || (categories[0]?.name || 'Groceries & Staples'),
        sub_category: productToEdit.sub_category || '',
        brand: productToEdit.brand || 'Ganapati Stores',
        description: productToEdit.description || '',
        selling_price: productToEdit.selling_price ?? productToEdit.price ?? '',
        mrp: productToEdit.mrp ?? productToEdit.original_price ?? '',
        cost_price: productToEdit.cost_price ?? '',
        stock_quantity: String(productToEdit.stock_quantity ?? productToEdit.stock ?? 0),
        low_stock_threshold: String(productToEdit.low_stock_threshold ?? 5),
        expiry_date: productToEdit.expiry_date || '',
        status: productToEdit.status || 'active',
        image_url: productToEdit.image_url || productToEdit.image || '',
        unit: productToEdit.unit || '1 unit',
        sku: productToEdit.sku || `GP-${Math.floor(100000 + Math.random() * 900000)}`
      });
    } else {
      setFormData({
        title: '',
        category: categories[0]?.name || 'Groceries & Staples',
        sub_category: '',
        brand: 'Ganapati Stores',
        description: '',
        selling_price: '',
        mrp: '',
        cost_price: '',
        stock_quantity: '25',
        low_stock_threshold: '5',
        expiry_date: '',
        status: 'active',
        image_url: PRESET_IMAGES[0].url,
        unit: '1 kg',
        sku: `GP-${Math.floor(100000 + Math.random() * 900000)}`
      });
    }
    setErrors({});
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  // Realtime margin & discount calculations
  const sellingNum = parseFloat(formData.selling_price) || 0;
  const mrpNum = parseFloat(formData.mrp) || sellingNum;
  const costNum = parseFloat(formData.cost_price) || 0;

  const discountPercent = mrpNum > sellingNum && mrpNum > 0
    ? Math.round(((mrpNum - sellingNum) / mrpNum) * 100)
    : 0;

  const profitMarginPercent = sellingNum > costNum && costNum > 0
    ? Math.round(((sellingNum - costNum) / sellingNum) * 100)
    : 0;

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Product title is required';
    if (!formData.category.trim()) errs.category = 'Category is required';
    if (isNaN(sellingNum) || sellingNum <= 0) errs.selling_price = 'Valid selling price is required';
    if (isNaN(parseInt(formData.stock_quantity, 10)) || parseInt(formData.stock_quantity, 10) < 0) {
      errs.stock_quantity = 'Stock cannot be negative';
    }
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
        cost_price: costNum || parseFloat((sellingNum * 0.75).toFixed(2)),
        stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
        stock: parseInt(formData.stock_quantity, 10) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold, 10) || 5,
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

  const handleSetExpiry = (monthsAhead) => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsAhead);
    setFormData(prev => ({ ...prev, expiry_date: date.toISOString().split('T')[0] }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Product Details' : 'Add New Inventory Product'}
              </h2>
              <p className="text-xs text-slate-500">
                Synchronized instantly with Ganapati Stores website
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
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Section 1: Basic Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              Basic Product Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fortune Sunlite Sunflower Oil 1L"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.title ? 'border-red-300 ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SKU / Item Code
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="Other">Other / General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand / Manufacturer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fortune / Ganapati"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pack Size / Unit
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 kg, 500g, 1L"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Highlights
              </label>
              <textarea
                rows={2}
                placeholder="Product details, ingredients, quality guarantee..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Section 2: Pricing & Profit Margin */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              Pricing & Profit Structure
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selling Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="180"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  MRP / Original Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="200"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                {discountPercent > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 mt-1 inline-block">
                    {discountPercent}% Discount shown on storefront
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cost / Buying Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="140"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                {profitMarginPercent > 0 && (
                  <span className="text-[10px] font-bold text-blue-600 mt-1 inline-block">
                    {profitMarginPercent}% Est. Gross Profit Margin
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Inventory & Expiry */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Stock & Expiry Management
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 inline-block">
                  Triggers alert when stock ≤ this number
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Expiry Date</span>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
                {/* Quick Expiry Presets */}
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetExpiry(3)}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                  >
                    +3 Mo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetExpiry(6)}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                  >
                    +6 Mo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetExpiry(12)}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                  >
                    +1 Yr
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Image & Status */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
              Product Image & Publishing Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />

                {/* Preset image suggestions */}
                <div className="pt-1">
                  <span className="text-[11px] text-slate-500 font-medium block mb-1.5">Or choose sample image preset:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: preset.url })}
                        className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
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

              {/* Image Preview Box */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-2">Live Preview</span>
                <div className="w-full h-28 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px]">No image URL</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Publishing Status Toggle */}
            <div className="pt-2 flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-sm font-bold text-slate-900 block">Product Visibility</span>
                <span className="text-xs text-slate-500">
                  {formData.status === 'active' 
                    ? 'Active — Published and visible to customers on ganapatistores.com' 
                    : 'Draft — Saved privately in admin dashboard only (hidden from store)'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'active' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    formData.status === 'active'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Published (Active)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'draft' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    formData.status === 'draft'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Draft
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Add to Inventory'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
