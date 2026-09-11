import React, { useState, useEffect } from 'react';
import { X, Settings, Phone, Store, DollarSign, Database, RotateCcw, ListOrdered, CheckCircle2, AlertCircle, Save, KeyRound, RefreshCw } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { getSavedOrders } from '../services/orderService';
import { inventoryApi } from '../services/inventoryApi';
import { STORE_API_KEY } from '../services/supabase';

export const SettingsModal = ({ onCatalogReset }) => {
  const { settings, updateSettings, isSettingsOpen, setIsSettingsOpen } = useSettings();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'firebase' | 'orders'
  const [formData, setFormData] = useState({ ...settings });
  
  // Custom firebase state
  const [firebaseConfig, setFirebaseConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('quickcart_firebase_config');
      return saved ? JSON.parse(saved) : {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
      };
    } catch {
      return {};
    }
  });

  const [savedOrdersList, setSavedOrdersList] = useState([]);

  useEffect(() => {
    if (isSettingsOpen) {
      setFormData({ ...settings });
      setSavedOrdersList(getSavedOrders());
    }
  }, [isSettingsOpen, settings]);

  if (!isSettingsOpen) return null;

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    await updateSettings(formData);
    showToast('Store settings updated in Supabase cloud!', 'success');
  };

  const handleSaveFirebase = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('quickcart_firebase_config', JSON.stringify(firebaseConfig));
      showToast('Firebase configuration saved! Orders will now sync to Firestore.', 'success');
    } catch (err) {
      showToast('Failed to save Firebase configuration', 'error');
    }
  };

  const handleResetCatalogStock = () => {
    inventoryApi.resetCatalog();
    if (onCatalogReset) onCatalogReset();
    showToast('Catalog stock restored to default levels!', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={() => setIsSettingsOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden z-10 animate-slide-up border border-slate-100 my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Store Settings & Integrations</h2>
              <p className="text-xs text-slate-500">Configure WhatsApp recipient, Firebase Firestore & Store Info</p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" /> Store & WhatsApp
          </button>

          <button
            onClick={() => setActiveTab('xyvot')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'xyvot'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4 text-emerald-600" /> XYVOT Store API
          </button>
          
          <button
            onClick={() => setActiveTab('firebase')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'firebase'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" /> Firebase
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-4 h-4" /> Orders ({savedOrdersList.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: GENERAL & WHATSAPP */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              
              {/* WhatsApp Config Card */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-emerald-950">WhatsApp Order Recipient</h3>
                </div>
                <p className="text-xs text-emerald-800">
                  Customer orders will automatically be directed to this WhatsApp phone number (with country code).
                </p>

                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">
                    WhatsApp Phone Number (with Country Code)
                  </label>
                  <input
                    type="text"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="+1 (555) 234-5678"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-emerald-300 bg-white font-mono focus:border-emerald-600 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Store Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold"
                    placeholder="$ or ₹ or € or £"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Store Pickup Location Address</label>
                <textarea
                  rows={2}
                  value={formData.storeAddress}
                  onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Store Operating Hours</label>
                <input
                  type="text"
                  value={formData.storeHours}
                  onChange={(e) => setFormData({ ...formData, storeHours: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Free Shipping Threshold ({formData.currency})</label>
                  <input
                    type="number"
                    value={formData.freeShippingThreshold}
                    onChange={(e) => setFormData({ ...formData, freeShippingThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Flat Shipping Fee ({formData.currency})</label>
                  <input
                    type="number"
                    value={formData.flatShippingFee}
                    onChange={(e) => setFormData({ ...formData, flatShippingFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetCatalogStock}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-2 rounded-xl transition-colors font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore Initial Stock Counts
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Settings
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: XYVOT STORE API */}
          {activeTab === 'xyvot' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  XYVOT Storefront API & Supabase Sync
                </div>
                <p>
                  Connected to your custom XYVOT multi-tenant platform. Real-time products and purchases are synced live.
                </p>
                <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Storefront API Key Active & Verified
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Active Store API Key</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={STORE_API_KEY || 'Direct Supabase Database Connected'}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 text-slate-700 select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (STORE_API_KEY) {
                        navigator.clipboard.writeText(STORE_API_KEY);
                        showToast('API Key copied to clipboard!', 'success');
                      } else {
                        showToast('Direct Supabase connection active', 'info');
                      }
                    }}
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs text-slate-600">
                <div className="font-semibold text-slate-800">API Scopes & Permissions:</div>
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <span>✓ <code>products:read</code> (Live catalog & stock query)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <span>✓ <code>orders:create</code> (Automatic backend sales order logging)</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    await inventoryApi.fetchCatalog();
                    showToast('Catalog refreshed from XYVOT API!', 'success');
                  }}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sync Catalog from API Now
                </button>
              </div>
            </div>
          )}
          {activeTab === 'firebase' && (
            <form onSubmit={handleSaveFirebase} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-700" />
                  Firebase Firestore Database Integration
                </div>
                <p>
                  You can paste your Firebase Web App credentials below. When configured, every order placed will automatically be written to your Firestore <code>orders</code> collection in real-time.
                </p>
                <p className="text-amber-800">
                  (If left blank, orders will be safely stored in local browser state and dispatched over WhatsApp).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={firebaseConfig.apiKey || ''}
                    onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Project ID</label>
                  <input
                    type="text"
                    placeholder="my-ecommerce-project"
                    value={firebaseConfig.projectId || ''}
                    onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Auth Domain</label>
                  <input
                    type="text"
                    placeholder="my-app.firebaseapp.com"
                    value={firebaseConfig.authDomain || ''}
                    onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">App ID</label>
                  <input
                    type="text"
                    placeholder="1:123456789:web:abcdef"
                    value={firebaseConfig.appId || ''}
                    onChange={(e) => setFirebaseConfig({ ...firebaseConfig, appId: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Firebase Credentials
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ORDERS LOG */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {savedOrdersList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No orders placed yet. Place an order in guest checkout to see it appear here!
                </div>
              ) : (
                savedOrdersList.map((ord) => (
                  <div key={ord.orderId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{ord.orderId}</span>
                      <span className="text-[10px] text-slate-400">{new Date(ord.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Customer: <strong className="text-slate-800">{ord.customer.name}</strong> ({ord.customer.phone})</span>
                      <span className="font-bold text-emerald-700">{settings.currency}{ord.total.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Fulfillment: {ord.deliveryMethod === 'shipping' ? '🚚 Delivery' : '🏪 Store Pickup'}</span>
                      <span className={ord.savedToFirestore ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>
                        {ord.savedToFirestore ? '✓ Synced to Firestore' : 'Stored Locally'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
