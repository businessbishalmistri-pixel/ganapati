import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Bolt, Check, ExternalLink, MessageCircle, Image, Truck, Store, 
  Megaphone, MapPin, Clock, UploadCloud, Loader2, Trash2, Plus
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { compressImage } from '../../utils/imageCompressor';
import { uploadImageToSupabase, deleteImageFromSupabase } from '../../services/imageUploadService';

export function AdminSettingsModal({ isOpen, onClose }) {
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();

  const fileInputRef = useRef(null);
  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsappNumber || '+91 9147364980');
  const [storeName, setStoreName] = useState(settings?.storeName || 'Ganapati Store');
  const [storeAddress, setStoreAddress] = useState(settings?.storeAddress || 'Main Store Hub');
  const [storeHours, setStoreHours] = useState(settings?.storeHours || 'Mon - Sun: 8:00 AM - 9:00 PM');
  const [announcementText, setAnnouncementText] = useState(settings?.announcementText || 'Free delivery on orders over ₹200 • Cash on Delivery');
  const [bannerImageUrl, setBannerImageUrl] = useState(settings?.bannerImageUrl || '');
  const [flatShippingFee, setFlatShippingFee] = useState(settings?.flatShippingFee !== undefined ? settings.flatShippingFee : 30);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(settings?.freeShippingThreshold !== undefined ? settings.freeShippingThreshold : 200);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen && !isSaving) {
      setWhatsappNumber(settings?.whatsappNumber || '+91 9147364980');
      setStoreName(settings?.storeName || 'Ganapati Store');
      setStoreAddress(settings?.storeAddress || 'Main Store Hub');
      setStoreHours(settings?.storeHours || 'Mon - Sun: 8:00 AM - 9:00 PM');
      setAnnouncementText(settings?.announcementText || 'Free delivery on orders over ₹200 • Cash on Delivery');
      setBannerImageUrl(settings?.bannerImageUrl || '');
      setFlatShippingFee(settings?.flatShippingFee !== undefined ? settings.flatShippingFee : 30);
      setFreeShippingThreshold(settings?.freeShippingThreshold !== undefined ? settings.freeShippingThreshold : 200);
      setIsUploadingBanner(false);
      setIsDragging(false);
    }
  }, [isOpen, settings?.updated_at, settings?.storeName, settings?.storeAddress, settings?.whatsappNumber, settings?.bannerImageUrl]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const processBannerFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    try {
      setIsUploadingBanner(true);
      showToast('Compressing & uploading banner image...', 'info');

      const previousBanner = settings?.bannerImageUrl || bannerImageUrl;

      // 1. High quality compression for wide banner (1920x800 max)
      const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 800, quality: 0.82 });

      // 2. Upload to Supabase Storage bucket
      const uploadedUrl = await uploadImageToSupabase(
        compressed.blob || file, 
        'store_banner', 
        compressed.dataUrl
      );

      if (uploadedUrl) {
        // Auto-clean previous banner from Supabase storage
        if (previousBanner && previousBanner !== uploadedUrl) {
          deleteImageFromSupabase(previousBanner).catch(console.warn);
        }

        setBannerImageUrl(uploadedUrl);
        
        // 3. Auto-save to Supabase store_settings table
        await updateSettings({
          bannerImageUrl: uploadedUrl
        });

        showToast('New banner image uploaded & published live!', 'success');
      } else {
        showToast('Failed to upload banner image', 'error');
      }
    } catch (err) {
      console.error('Banner upload error:', err);
      showToast('Error uploading banner: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsUploadingBanner(false);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processBannerFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processBannerFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveBanner = async (e) => {
    if (e) e.stopPropagation();
    const oldBanner = bannerImageUrl || settings?.bannerImageUrl;
    if (oldBanner) {
      deleteImageFromSupabase(oldBanner).catch(console.warn);
    }
    setBannerImageUrl('');
    try {
      await updateSettings({ bannerImageUrl: '' });
      showToast('Banner image removed from storefront', 'info');
    } catch (err) {
      console.error('Failed to remove banner:', err);
    }
  };

  const handleTestWhatsApp = () => {
    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 
      ? cleanPhone 
      : cleanPhone.length === 10 
        ? `91${cleanPhone}` 
        : cleanPhone;

    if (!finalPhone || finalPhone.length < 10) {
      showToast('Please enter a valid WhatsApp number first', 'error');
      return;
    }

    const testUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent('Hello! Testing WhatsApp order receiving connection for ' + storeName)}`;
    window.open(testUrl, '_blank');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!whatsappNumber.trim()) {
      showToast('WhatsApp number cannot be empty', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const res = await updateSettings({
        whatsappNumber: whatsappNumber.trim(),
        storeName: storeName.trim(),
        storeAddress: storeAddress.trim(),
        storeHours: storeHours.trim(),
        announcementText: announcementText.trim(),
        bannerImageUrl: (bannerImageUrl || '').trim(),
        flatShippingFee: Number(flatShippingFee) || 0,
        freeShippingThreshold: Number(freeShippingThreshold) || 0
      });

      if (res && res.success === false) {
        throw new Error(res.error?.message || 'Failed to update database');
      }

      showToast('Store settings & banner saved to Supabase cloud!', 'success');
      setTimeout(() => {
        onClose();
      }, 150);
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast('Failed to save settings to cloud', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden z-10 animate-slide-up sm:animate-fadeIn">
        
        {/* Mobile Drag Pill */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden flex-shrink-0" />

        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Bolt className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-none">
              Store Settings
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
          
          {/* 1. Store Name (Top) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-slate-600" />
              <span>Store Display Name</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ganapati Store"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-2xs"
            />
          </div>

          {/* Store Pickup / Delivery Hub Address */}
          <div className="space-y-1 pt-0.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Store / Pickup Hub Address</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Main Store Hub, Station Road, West Bengal"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium shadow-2xs resize-none"
            />
          </div>

          {/* Store Operating Hours & Working Days */}
          <div className="space-y-1 pt-0.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Store Operating Hours & Days</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Mon - Sun: 8:00 AM - 9:00 PM"
              value={storeHours}
              onChange={(e) => setStoreHours(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium shadow-2xs"
            />
          </div>

          {/* Top Announcement Bar Text */}
          <div className="space-y-1 pt-1">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-emerald-600" />
              <span>Top Announcement Bar Text</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Free delivery on orders over ₹200 • Cash on Delivery"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium shadow-2xs"
            />
          </div>

          {/* 2. Full Drag & Drop / Click-to-Upload Storefront Banner Box */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-blue-600" />
                <span>Storefront Banner Image</span>
              </label>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2">
                {bannerImageUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveBanner}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg"
                      title="Remove banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleBannerUpload}
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              className="hidden"
            />

            {/* Interactive Drag & Drop / Click-to-Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer group shadow-2xs ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/70 scale-[1.01]' 
                  : bannerImageUrl 
                    ? 'border-slate-200 bg-slate-100 hover:border-blue-400' 
                    : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-400'
              }`}
            >
              <div className="w-full aspect-[21/9] sm:aspect-[3/1] max-h-40 overflow-hidden relative flex items-center justify-center">
                {bannerImageUrl ? (
                  <>
                    <img
                      src={bannerImageUrl}
                      alt="Storefront Banner"
                      className="w-full h-full object-cover"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                      <span className="text-xs font-bold bg-black/60 px-3 py-1.5 rounded-xl backdrop-blur-xs flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4" />
                        Click to change image
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 text-slate-400 text-xs flex flex-col items-center gap-2 select-none">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200/80 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block text-xs sm:text-sm">
                        Click to upload storefront banner
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        or drag and drop here (PNG, JPG, WebP)
                      </span>
                    </div>
                  </div>
                )}

                {/* Uploading Progress Overlay */}
                {isUploadingBanner && (
                  <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-10 animate-fadeIn">
                    <Loader2 className="w-7 h-7 animate-spin text-white" />
                    <span className="text-xs font-bold">Compressing & Uploading to Supabase...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Minimal WhatsApp Order Number (Icon + Input) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Order Number</span>
              </label>
              <button
                type="button"
                onClick={handleTestWhatsApp}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Test sending message to this number"
              >
                <span>Test Chat</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="+91 9147364980"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            />
          </div>

          {/* 4. Delivery Charges & Free Delivery Threshold */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 pt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Delivery Charges & Free Delivery</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="30"
                  value={flatShippingFee}
                  onChange={(e) => setFlatShippingFee(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Free Delivery Above (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="200"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Orders <strong>₹{freeShippingThreshold || 200}</strong> and above will get <strong>Free Delivery (₹0)</strong>. Orders below will be charged <strong>₹{flatShippingFee || 30}</strong>.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingBanner}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
