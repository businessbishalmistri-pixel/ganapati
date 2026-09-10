import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Tag, 
  Image as ImageIcon,
  Save,
  Check,
  Scale,
  Shirt,
  Sliders,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight
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

  const [variants, setVariants] = useState([]);
  const [variantTab, setVariantTab] = useState('weight'); // 'weight' | 'packs' | 'sizes' | 'custom'
  const [customOptionText, setCustomOptionText] = useState('');
  const [customUnit, setCustomUnit] = useState('KG');

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
      setVariants(Array.isArray(productToEdit.variants) ? productToEdit.variants : []);
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
      setVariants([]);
    }
    setCustomOptionText('');
    setErrors({});
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const sellingNum = parseFloat(formData.selling_price) || 0;
  const mrpNum = parseFloat(formData.mrp) || sellingNum;

  // Add a single variant
  const handleAddVariant = (name) => {
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (variants.some(v => (v.name || v.unit || '').toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    const newVariant = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      unit: trimmed,
      selling_price: sellingNum > 0 ? sellingNum : 100,
      price: sellingNum > 0 ? sellingNum : 100,
      mrp: mrpNum > 0 ? mrpNum : 120,
      original_price: mrpNum > 0 ? mrpNum : 120,
      stock_quantity: 999,
      in_stock: true
    };
    setVariants(prev => [...prev, newVariant]);
  };

  // Add multiple variants at once (1-click bundle)
  const handleAddVariantBundle = (bundleArray) => {
    const newItems = [];
    bundleArray.forEach(name => {
      if (!variants.some(v => (v.name || v.unit || '').toLowerCase() === name.toLowerCase())) {
        newItems.push({
          id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: name,
          unit: name,
          selling_price: sellingNum > 0 ? sellingNum : 100,
          price: sellingNum > 0 ? sellingNum : 100,
          mrp: mrpNum > 0 ? mrpNum : 120,
          original_price: mrpNum > 0 ? mrpNum : 120,
          stock_quantity: 999,
          in_stock: true
        });
      }
    });
    if (newItems.length > 0) {
      setVariants(prev => [...prev, ...newItems]);
    }
  };

  // Update a single field in a variant
  const handleUpdateVariant = (id, field, value) => {
    setVariants(prev => prev.map(v => {
      if (v.id === id) {
        const updated = { ...v, [field]: value };
        if (field === 'selling_price') updated.price = parseFloat(value) || 0;
        if (field === 'mrp') updated.original_price = parseFloat(value) || 0;
        return updated;
      }
      return v;
    }));
  };

  // Delete a variant
  const handleDeleteVariant = (id) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

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
        has_variants: variants.length > 0,
        hasVariants: variants.length > 0,
        variants: variants,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Sheet / Modal Container */}
      <div className="relative bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden z-10 animate-slide-up sm:animate-fadeIn">
        
        {/* Mobile Drag Indicator Pill */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <span className="text-[11px] text-slate-400">Save & publish immediately</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-3">
          
          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fortune Sunlite Sunflower Oil 1L"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.title ? 'border-red-300 ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-0.5">{errors.title}</p>}
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="Other">Other / General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pack Size / Unit
              </label>
              <input
                type="text"
                placeholder="e.g. 1 kg, 500g, 1 Litre"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="150"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              {errors.selling_price && <p className="text-xs text-red-500 mt-0.5">{errors.selling_price}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                MRP (₹) <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="any"
                  placeholder="180"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 📱 Prominent Stock Status Toggle Pill Switch */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">Stock Availability</span>
                {formData.in_stock ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    In Stock
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    Out of Stock
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {formData.in_stock ? 'Visible and ready to order' : 'Shows Out of Stock badge'}
              </p>
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, in_stock: !formData.in_stock })}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.in_stock ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  formData.in_stock ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* ⚡ PRODUCT VARIANTS / QUICK ADD BUILDER */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3">
            
            {/* Header / Tabs Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Product Variants ({variants.length})
                </span>
                {variants.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-100 text-blue-800">
                    Multi-Variant
                  </span>
                )}
              </div>

              {/* 4 Category Tabs */}
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setVariantTab('weight')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    variantTab === 'weight'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Scale className="w-3 h-3 text-slate-600" />
                  <span>Weight (KG/g)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVariantTab('packs')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    variantTab === 'packs'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3 h-3 text-slate-600" />
                  <span>Packs / Units</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVariantTab('sizes')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    variantTab === 'sizes'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shirt className="w-3 h-3 text-slate-600" />
                  <span>Sizes (S/M/L)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVariantTab('custom')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    variantTab === 'custom'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sliders className="w-3 h-3 text-slate-600" />
                  <span>Custom</span>
                </button>
              </div>
            </div>

            {/* Quick Add Sub-Toolbar matching screenshots */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <span className="font-bold text-slate-500 mr-1 text-[11px]">Quick Add:</span>

                {/* 1. Weight Tab Options */}
                {variantTab === 'weight' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddVariantBundle(['500g', '1 KG', '2 KG', '5 KG'])}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200/80 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Add standard 500g, 1KG, 2KG, 5KG bundle"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Standard Pack (500g, 1KG, 2KG, 5KG)</span>
                    </button>

                    {['100g', '250g', '500g', '1 KG', '2 KG', '5 KG', '10 KG'].map((wt) => (
                      <button
                        key={wt}
                        type="button"
                        onClick={() => handleAddVariant(wt)}
                        className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition-colors cursor-pointer"
                      >
                        + {wt}
                      </button>
                    ))}
                  </>
                )}

                {/* 2. Packs / Units Tab Options */}
                {variantTab === 'packs' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddVariantBundle(['1 Pc', 'Pack of 3', 'Pack of 6', 'Pack of 12'])}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200/80 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Add standard bulk pack bundle"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Bulk Pack (1 Pc, 3 Pk, 6 Pk, 12 Pk)</span>
                    </button>

                    {['1 Pc', 'Pack of 2', 'Pack of 3', 'Pack of 6', 'Pack of 10', 'Pack of 12', 'Box (24 Pcs)'].map((pk) => (
                      <button
                        key={pk}
                        type="button"
                        onClick={() => handleAddVariant(pk)}
                        className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition-colors cursor-pointer"
                      >
                        + {pk}
                      </button>
                    ))}
                  </>
                )}

                {/* 3. Sizes (S/M/L) Tab Options */}
                {variantTab === 'sizes' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddVariantBundle(['S', 'M', 'L', 'XL'])}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200/80 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Add standard S, M, L, XL sizes"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>S, M, L, XL</span>
                    </button>

                    {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleAddVariant(sz)}
                        className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition-colors cursor-pointer"
                      >
                        + {sz}
                      </button>
                    ))}
                  </>
                )}

                {/* 4. Custom Tab Notice */}
                {variantTab === 'custom' && (
                  <span className="text-slate-400 italic text-[11px]">
                    Type a custom option name below:
                  </span>
                )}
              </div>

              {/* Right Custom Input & Add Button */}
              <div className="flex items-center gap-1.5 ml-auto">
                {variantTab === 'weight' ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="e.g. 750 or 1.5"
                      value={customOptionText}
                      onChange={(e) => setCustomOptionText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customOptionText.trim()) {
                            handleAddVariant(`${customOptionText.trim()} ${customUnit}`);
                            setCustomOptionText('');
                          }
                        }
                      }}
                      className="h-8 w-28 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="h-8 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="KG">KG</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="Pc">Pc</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (customOptionText.trim()) {
                          handleAddVariant(`${customOptionText.trim()} ${customUnit}`);
                          setCustomOptionText('');
                        }
                      }}
                      className="h-8 px-3 bg-[#505488] hover:bg-[#434775] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>+ Add</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Custom option name..."
                      value={customOptionText}
                      onChange={(e) => setCustomOptionText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customOptionText.trim()) {
                            handleAddVariant(customOptionText.trim());
                            setCustomOptionText('');
                          }
                        }
                      }}
                      className="h-8 w-36 sm:w-44 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customOptionText.trim()) {
                          handleAddVariant(customOptionText.trim());
                          setCustomOptionText('');
                        }
                      }}
                      className="h-8 px-3 bg-[#505488] hover:bg-[#434775] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>+ Add</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Variants Table */}
            {variants.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-2.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Configured Variant Prices</span>
                  <button
                    type="button"
                    onClick={() => setVariants([])}
                    className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="overflow-x-auto max-h-48 divide-y divide-slate-100 text-xs">
                  {variants.map((v, idx) => (
                    <div key={v.id || idx} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                      {/* Variant Name */}
                      <div className="w-1/3 min-w-0">
                        <input
                          type="text"
                          value={v.name || v.unit || ''}
                          onChange={(e) => handleUpdateVariant(v.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Selling Price */}
                      <div className="w-24">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 font-bold text-[10px]">₹</span>
                          <input
                            type="number"
                            placeholder="Price"
                            value={v.selling_price ?? v.price ?? ''}
                            onChange={(e) => handleUpdateVariant(v.id, 'selling_price', e.target.value)}
                            className="w-full pl-5 pr-1.5 py-1 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* MRP */}
                      <div className="w-24">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 font-bold text-[10px]">₹</span>
                          <input
                            type="number"
                            placeholder="MRP"
                            value={v.mrp ?? v.original_price ?? ''}
                            onChange={(e) => handleUpdateVariant(v.id, 'mrp', e.target.value)}
                            className="w-full pl-5 pr-1.5 py-1 border border-slate-200 rounded-lg font-mono text-slate-500 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* In Stock Pill */}
                      <button
                        type="button"
                        onClick={() => handleUpdateVariant(v.id, 'in_stock', !v.in_stock)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          v.in_stock !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {v.in_stock !== false ? 'In Stock' : 'Out'}
                      </button>

                      {/* Delete Icon */}
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(v.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Image URL & Quick Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Product Image URL
            </label>
            <div className="flex gap-2.5 items-center">
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="w-11 h-11 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
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

            {/* Quick Sample Presets */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, image_url: preset.url })}
                  className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                    formData.image_url === preset.url
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </label>
            <textarea
              rows={2}
              placeholder="Short description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>
        </form>

        {/* Modal Sticky Bottom Actions (Thumb Optimized) */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors text-center cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
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
