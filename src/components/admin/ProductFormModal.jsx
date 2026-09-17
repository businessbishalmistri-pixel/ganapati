import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Package, 
  Box,
  Tag, 
  Image as ImageIcon,
  Save,
  Check,
  Scale,
  Shirt,
  Sliders,
  SlidersHorizontal,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  UploadCloud,
  Loader2,
  CheckCircle2,
  ImagePlus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';
import { uploadImageToSupabase, deleteImageFromSupabase } from '../../services/imageUploadService';

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
  const fileInputRef = useRef(null);

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

  // Image Upload & Compression State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

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
      const existingVariants = Array.isArray(productToEdit.variants) && productToEdit.variants.length > 0 
        ? productToEdit.variants 
        : [{
            id: `v-${Date.now()}-0`,
            name: productToEdit.unit || 'Standard Pack',
            unit: productToEdit.unit || 'Standard Pack',
            selling_price: parseFloat(productToEdit.selling_price ?? productToEdit.price ?? 100) || 100,
            price: parseFloat(productToEdit.selling_price ?? productToEdit.price ?? 100) || 100,
            mrp: parseFloat(productToEdit.mrp ?? productToEdit.original_price ?? 120) || 120,
            original_price: parseFloat(productToEdit.mrp ?? productToEdit.original_price ?? 120) || 120,
            stock_quantity: 999,
            in_stock: true
          }];
      setVariants(existingVariants);
    } else {
      setFormData({
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
      setCompressionStats(null);
      setShowUrlFallback(false);
      setVariants([{
        id: `v-${Date.now()}-0`,
        name: '1 Pack / 1 Unit',
        unit: '1 Pack / 1 Unit',
        selling_price: 100,
        price: 100,
        mrp: 120,
        original_price: 120,
        stock_quantity: 999,
        in_stock: true
      }]);
    }
    setErrors({});
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const sellingNum = parseFloat(formData.selling_price) || 0;
  const mrpNum = parseFloat(formData.mrp) || sellingNum;

  // Handle Image File Selection, Client-Side Compression & Supabase Upload
  const handleImageFileSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setIsUploadingImage(true);
    setUploadStatusText('Processing image...');
    try {
      const previousUrl = formData.image_url;

      // 1. High-speed client-side compression with HTML5 Canvas -> WebP
      const compressed = await compressImage(file, { maxWidth: 1080, maxHeight: 1080, quality: 0.82 });
      
      const persistentUrl = compressed?.dataUrl || compressed?.previewUrl;
      
      // 2. Set optimized image URL immediately (0ms lag, persistent)
      setFormData(prev => ({ 
        ...prev, 
        image_url: persistentUrl,
        image: persistentUrl 
      }));

      // 3. Upload to Supabase Storage if available, fallback smoothly to WebP Data URI
      if (compressed?.file) {
        const publicUrl = await uploadImageToSupabase(compressed.file, formData.title || 'product', persistentUrl);
        if (publicUrl && publicUrl !== persistentUrl) {
          // Auto-clean previous image from Supabase storage
          if (previousUrl && previousUrl !== publicUrl) {
            deleteImageFromSupabase(previousUrl).catch(console.warn);
          }

          setFormData(prev => ({
            ...prev,
            image_url: publicUrl,
            image: publicUrl
          }));
        }
      }
    } catch (err) {
      console.warn('Image compression / upload notice:', err);
    } finally {
      setIsUploadingImage(false);
      setUploadStatusText('');
    }
  };

  // Add a single variant
  const handleAddVariant = (name) => {
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (variants.some(v => (v.name || v.unit || '').toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    const prevPrice = variants.length > 0 ? (parseFloat(variants[variants.length - 1].selling_price || variants[variants.length - 1].price) || 100) : 100;
    const prevMrp = variants.length > 0 ? (parseFloat(variants[variants.length - 1].mrp || variants[variants.length - 1].original_price) || Math.round(prevPrice * 1.2)) : 120;
    
    const newVariant = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      unit: trimmed,
      selling_price: prevPrice,
      price: prevPrice,
      mrp: prevMrp,
      original_price: prevMrp,
      stock_quantity: 999,
      in_stock: true
    };
    setVariants(prev => [...prev, newVariant]);
  };

  // Add multiple variants at once (1-click bundle)
  const handleAddVariantBundle = (bundleArray) => {
    const newItems = [];
    const prevPrice = variants.length > 0 ? (parseFloat(variants[variants.length - 1].selling_price || variants[variants.length - 1].price) || 100) : 100;
    const prevMrp = variants.length > 0 ? (parseFloat(variants[variants.length - 1].mrp || variants[variants.length - 1].original_price) || Math.round(prevPrice * 1.2)) : 120;

    bundleArray.forEach(name => {
      if (!variants.some(v => (v.name || v.unit || '').toLowerCase() === name.toLowerCase())) {
        newItems.push({
          id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: name,
          unit: name,
          selling_price: prevPrice,
          price: prevPrice,
          mrp: prevMrp,
          original_price: prevMrp,
          stock_quantity: 999,
          in_stock: true
        });
      }
    });
    if (newItems.length > 0) {
      setVariants(prev => [...prev, ...newItems]);
    }
  };

  // Append new blank/custom variant from the secondary button
  const handleAddNewBlankVariant = () => {
    const prevPrice = variants.length > 0 ? (parseFloat(variants[variants.length - 1].selling_price || variants[variants.length - 1].price) || 100) : 100;
    const prevMrp = variants.length > 0 ? (parseFloat(variants[variants.length - 1].mrp || variants[variants.length - 1].original_price) || Math.round(prevPrice * 1.2)) : 120;
    const newVariant = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `Option ${variants.length + 1}`,
      unit: `Option ${variants.length + 1}`,
      selling_price: prevPrice,
      price: prevPrice,
      mrp: prevMrp,
      original_price: prevMrp,
      stock_quantity: 999,
      in_stock: true
    };
    setVariants(prev => [...prev, newVariant]);
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

  // Delete a variant (Keep at least 1 default row)
  const handleDeleteVariant = (id) => {
    if (variants.length <= 1) return;
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const handleResetVariants = () => {
    if (variants.length > 1) {
      setVariants([variants[0]]);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Product name is required';
    if (!formData.category.trim()) errs.category = 'Category is required';
    if (variants.length > 0) {
      const invalidVariant = variants.find(v => isNaN(parseFloat(v.selling_price || v.price)) || parseFloat(v.selling_price || v.price) <= 0);
      if (invalidVariant) {
        errs.variants = `Please enter a valid price for "${invalidVariant.name || 'variant'}"`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const firstVariantPrice = variants.length > 0 ? (parseFloat(variants[0].selling_price || variants[0].price) || 0) : 0;
      const firstVariantMrp = variants.length > 0 ? (parseFloat(variants[0].mrp || variants[0].original_price) || firstVariantPrice) : 0;
      const anyInStock = variants.length > 0 ? variants.some(v => v.in_stock !== false) : true;
      const primaryUnit = variants.length > 0 ? (variants[0].name || variants[0].unit || '1 unit') : '1 unit';

      const payload = {
        ...formData,
        selling_price: firstVariantPrice,
        price: firstVariantPrice,
        mrp: firstVariantMrp,
        original_price: firstVariantMrp,
        unit: primaryUnit,
        in_stock: anyInStock,
        stock: anyInStock ? 999 : 0,
        stock_quantity: anyInStock ? 999 : 0,
        has_variants: variants.length > 1,
        hasVariants: variants.length > 1,
        variants: variants,
        id: productToEdit?.id
      };
      onSave(payload);
      onClose();
    } catch (err) {
      console.error('Failed to save product', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Sheet / Modal Container */}
      <div className="relative bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden z-10 animate-slide-up sm:animate-fadeIn">
        
        {/* Mobile Drag Indicator Pill */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden flex-shrink-0" />

        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-none">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-3.5 overscroll-contain">
          
          {/* Top Row: Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Product Name (7 cols on desktop) */}
            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fortune Sunlite Sunflower Oil"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.title ? 'border-red-300 ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
              />
              {errors.title && <p className="text-xs text-red-500 mt-0.5">{errors.title}</p>}
            </div>

            {/* Category (5 cols on desktop) */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="Other">Other / General</option>
              </select>
            </div>
          </div>

          {/* ⚡ PRODUCT VARIANTS / QUICK ADD BUILDER */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3">
            
            {/* 3 Category Tabs (100% Full Width Grid) */}
            <div className="w-full grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setVariantTab('weight')}
                className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  variantTab === 'weight'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-slate-600 hidden sm:inline-block" />
                <span className="truncate">Weight (KG/g)</span>
              </button>

              <button
                type="button"
                onClick={() => setVariantTab('packs')}
                className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  variantTab === 'packs'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-slate-600 hidden sm:inline-block" />
                <span className="truncate">Packs / Units</span>
              </button>

              <button
                type="button"
                onClick={() => setVariantTab('sizes')}
                className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  variantTab === 'sizes'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-600 hidden sm:inline-block" />
                <span className="truncate">Sizes (S/M/L)</span>
              </button>
            </div>

            {/* Quick Pill Chips Based on Tab */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Add:</span>
                
                {variantTab === 'weight' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddVariantBundle(['500g', '1 KG', '2 KG', '5 KG'])}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors border border-blue-200/60 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>Standard Pack (500g, 1KG, 2KG, 5KG)</span>
                    </button>
                    {['100g', '250g', '500g', '1 KG', '2 KG', '5 KG', '10 KG'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleAddVariant(val)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        + {val}
                      </button>
                    ))}
                  </>
                )}

                {variantTab === 'packs' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddVariantBundle(['1 Pc', 'Pack of 2', 'Pack of 4', 'Pack of 6'])}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors border border-blue-200/60 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>Standard Pack Bundle (1, 2, 4, 6 Pcs)</span>
                    </button>
                    {['1 Pc', 'Pack of 2', 'Pack of 3', 'Pack of 4', 'Pack of 6', 'Pack of 12', '1 Litre Pouch', '2 Litre Bottle', '5 Litre Can'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleAddVariant(val)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        + {val}
                      </button>
                    ))}
                  </>
                )}

                {variantTab === 'sizes' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddVariantBundle(['Small', 'Medium', 'Large'])}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors border border-blue-200/60 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>Standard Sizes (S, M, L)</span>
                    </button>

                    {['Small', 'Medium', 'Large', 'XL', '2XL', 'Free Size'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleAddVariant(sz)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        + {sz}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Generated Variants Table */}
            {variants.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-2.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Configured Variant Prices ({variants.length})</span>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={handleResetVariants}
                      className="text-[11px] font-semibold text-slate-500 hover:text-red-600 hover:underline cursor-pointer"
                    >
                      Reset to 1 Option
                    </button>
                  )}
                </div>

                {/* Table Column Headers */}
                <div className="px-2.5 py-1.5 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex-1 min-w-[100px]">Variant / Size</div>
                  <div className="w-20 sm:w-24 text-center">Price (₹)</div>
                  <div className="w-20 sm:w-24 text-center">MRP (₹)</div>
                  <div className="w-12 text-center flex-shrink-0">Stock</div>
                  <div className="w-6 text-center flex-shrink-0"></div>
                </div>

                <div className="overflow-x-auto max-h-52 divide-y divide-slate-100 text-xs">
                  {variants.map((v, idx) => (
                    <div key={v.id || idx} className="p-2 sm:p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/50">
                      {/* Variant Name */}
                      <div className="flex-1 min-w-[100px]">
                        <input
                          type="text"
                          value={v.name || v.unit || ''}
                          onChange={(e) => handleUpdateVariant(v.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Selling Price */}
                      <div className="w-20 sm:w-24 flex-shrink-0">
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
                      <div className="w-20 sm:w-24 flex-shrink-0">
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

                      {/* In Stock Toggle Switch with Fixed Width */}
                      <div className="w-12 flex items-center justify-center flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateVariant(v.id, 'in_stock', v.in_stock === false ? true : false)}
                          title={v.in_stock !== false ? 'In Stock (Click to toggle)' : 'Out of Stock (Click to toggle)'}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            v.in_stock !== false ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              v.in_stock !== false ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Delete Icon (Only shown if more than 1 variant) */}
                      <div className="w-6 flex items-center justify-center flex-shrink-0">
                        {variants.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(v.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="w-3.5 h-3.5 block" title="Default Option"></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtle Secondary + Add Variant Button (Blue marked area) */}
                <div className="p-2 bg-slate-50/70 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleAddNewBlankVariant}
                    className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 border-dashed rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>+ Add Variant</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* 📸 IMAGE UPLOAD: Drag & Drop + Device Select + Client Compression + Supabase Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Product Image
              </label>
              <button
                type="button"
                onClick={() => setShowUrlFallback(!showUrlFallback)}
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showUrlFallback ? 'Hide URL / Presets' : 'Use URL / Presets'}</span>
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFileSelect(file);
              }}
            />

            {/* 1. Drag & Dropzone Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer?.files?.[0];
                if (file) handleImageFileSelect(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer select-none ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20'
                  : 'border-slate-300/90 bg-slate-50/60 hover:bg-slate-100/70 hover:border-slate-400'
              }`}
            >
              {isUploadingImage ? (
                <div className="py-2 flex flex-col items-center justify-center space-y-2">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-800">{uploadStatusText}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Compressing on frontend & saving to Supabase Storage</p>
                  </div>
                </div>
              ) : formData.image_url ? (
                <div className="flex items-center gap-3 text-left">
                  {/* Image Thumbnail Preview */}
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative shadow-xs">
                    <img
                      src={formData.image_url}
                      alt="Product Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=120&q=80';
                      }}
                    />
                  </div>

                  {/* Info & Replace Action */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">Image Ready</span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate">
                      Click or drag to replace image from device
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Change Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <ImagePlus className="w-3.5 h-3.5 text-slate-500" />
                      <span>Change</span>
                    </button>

                    {/* Remove/Clear Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (formData.image_url) {
                          deleteImageFromSupabase(formData.image_url).catch(console.warn);
                        }
                        setFormData((prev) => ({ ...prev, image_url: '', image: '' }));
                        setCompressionStats(null);
                      }}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-xs font-bold text-slate-500 hover:text-red-600 shadow-xs flex items-center justify-center cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Drag & Drop image here, or <span className="text-blue-600 underline">Browse Device</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      JPG, PNG, WebP • Auto-compressed on frontend & saved directly to Supabase Storage
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Fallback: Manual Image URL & Quick Sample Presets */}
            {showUrlFallback && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-fadeIn">
                <label className="block text-[11px] font-bold text-slate-600">
                  Or Paste External Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />

                {/* Quick Sample Presets */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: preset.url })}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          formData.image_url === preset.url
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
            disabled={isSaving || isUploadingImage}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSaving || isUploadingImage ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{isUploadingImage ? 'Uploading Image...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Add Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
