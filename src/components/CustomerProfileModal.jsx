import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Save, 
  Navigation, 
  ChevronRight, 
  FileText, 
  Globe, 
  Bell, 
  PhoneCall, 
  HelpCircle, 
  ShieldCheck, 
  FileCheck2, 
  LogOut, 
  Pencil, 
  ArrowLeft,
  Plus,
  Home,
  Briefcase,
  Trash2,
  CheckCircle2,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { LocationPicker } from './LocationPicker';
import { upsertStoreCustomerProfile } from '../services/supabase';
import { addressService } from '../services/addressService';

export const CustomerProfileModal = () => {
  const { 
    isProfileOpen, 
    setIsProfileOpen, 
    currentCustomer, 
    customer, 
    updateProfile, 
    setIsOrdersOpen, 
    logout,
    profileInitialTab,
    setProfileInitialTab,
    profileInitialSubView,
    setProfileInitialSubView,
    profileOrigin
  } = useAuth();
  const { showToast } = useToast();
  const { settings } = useSettings();

  const activeCustomer = currentCustomer || customer;

  // View state: 'hub' (iOS grouped card menu) | 'address' (Address Book) | 'privacy' | 'terms' | 'help'
  const [activeTab, setActiveTab] = useState(profileInitialTab || 'hub');

  // Address subview state: 'list' (Saved addresses cards) | 'add' (Add new address) | 'edit' (Edit address)
  const [addressSubView, setAddressSubView] = useState(profileInitialSubView || 'list');
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Address List State initialized from addressService
  const [savedAddresses, setSavedAddresses] = useState(() => {
    const list = addressService.getAddresses();
    if (list.length > 0) return list;

    if (activeCustomer && (activeCustomer.address || activeCustomer.shippingAddress?.street)) {
      const fallback = [
        {
          id: 'addr_default',
          tag: 'Home',
          label: 'Home',
          name: activeCustomer?.fullName || activeCustomer?.name || 'Customer',
          recipientName: activeCustomer?.fullName || activeCustomer?.name || 'Customer',
          phone: activeCustomer?.phone || '',
          address: activeCustomer?.address || activeCustomer?.shippingAddress?.street || '',
          street: activeCustomer?.address || activeCustomer?.shippingAddress?.street || '',
          city: activeCustomer?.city || activeCustomer?.shippingAddress?.city || 'Habra / Ashoknagar',
          state: activeCustomer?.state || activeCustomer?.shippingAddress?.state || 'West Bengal',
          postalCode: activeCustomer?.postalCode || activeCustomer?.shippingAddress?.postalCode || '743263',
          pincode: activeCustomer?.postalCode || activeCustomer?.shippingAddress?.postalCode || '743263',
          lat: activeCustomer?.gpsLat || activeCustomer?.shippingAddress?.coordinates?.lat || 22.8291,
          lng: activeCustomer?.gpsLng || activeCustomer?.shippingAddress?.coordinates?.lng || 88.6148,
          gpsCoords: {
            lat: activeCustomer?.gpsLat || activeCustomer?.shippingAddress?.coordinates?.lat || 22.8291,
            lng: activeCustomer?.gpsLng || activeCustomer?.shippingAddress?.coordinates?.lng || 88.6148
          },
          isDefault: true
        }
      ];
      localStorage.setItem('customer_saved_addresses', JSON.stringify(fallback));
      return fallback;
    }
    return [];
  });

  // Active form state for Add/Edit
  const [formTag, setFormTag] = useState('Home');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Habra / Ashoknagar');
  const [formState, setFormState] = useState('West Bengal');
  const [formPostalCode, setFormPostalCode] = useState('743263');
  const [formGpsCoords, setFormGpsCoords] = useState({ lat: 22.8291, lng: 88.6148 });
  const [formIsDefault, setFormIsDefault] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  // Listen for address_changed event across components
  useEffect(() => {
    const handleAddressChanged = (e) => {
      setSavedAddresses(e.detail || []);
    };
    window.addEventListener('address_changed', handleAddressChanged);
    return () => window.removeEventListener('address_changed', handleAddressChanged);
  }, []);

  // Synchronize when modal opens or tab props change
  useEffect(() => {
    if (isProfileOpen) {
      if (profileInitialTab) setActiveTab(profileInitialTab);
      if (profileInitialSubView) setAddressSubView(profileInitialSubView);
      const latest = addressService.getAddresses();
      setSavedAddresses(latest);
    }
  }, [isProfileOpen, profileInitialTab, profileInitialSubView]);

  // Synchronize initial default address if customer updates
  useEffect(() => {
    if (activeCustomer && savedAddresses.length > 0) {
      const hasMatchingDefault = savedAddresses.some(a => a.isDefault);
      if (!hasMatchingDefault) {
        const updated = [...savedAddresses];
        updated[0].isDefault = true;
        setSavedAddresses(updated);
        localStorage.setItem('customer_saved_addresses', JSON.stringify(updated));
      }
    }
  }, [activeCustomer]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isProfileOpen) {
        if (profileOrigin === 'checkout') {
          if (activeTab === 'address' && addressSubView !== 'list' && profileInitialSubView === 'list') {
            setAddressSubView('list');
            setEditingAddressId(null);
          } else {
            closeModal();
          }
        } else if (activeTab === 'address' && addressSubView !== 'list') {
          setAddressSubView('list');
          setEditingAddressId(null);
        } else if (activeTab !== 'hub') {
          setActiveTab('hub');
        } else {
          setIsProfileOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileOpen, setIsProfileOpen, activeTab, addressSubView, profileOrigin, profileInitialSubView]);

  if (!isProfileOpen) return null;

  const closeModal = () => {
    setIsProfileOpen(false);
    setActiveTab('hub');
    setAddressSubView('list');
    setEditingAddressId(null);
    if (setProfileInitialTab) setProfileInitialTab('hub');
    if (setProfileInitialSubView) setProfileInitialSubView('list');
  };

  // Sync default address with Profile & Supabase
  const syncDefaultAddressToProfile = async (defaultAddr) => {
    try {
      await upsertStoreCustomerProfile({
        phone: activeCustomer?.phone || defaultAddr.phone || '',
        fullName: defaultAddr.name,
        name: defaultAddr.name,
        email: formEmail || activeCustomer?.email || '',
        address: defaultAddr.address,
        city: defaultAddr.city,
        state: defaultAddr.state,
        postalCode: defaultAddr.postalCode,
        gpsLat: defaultAddr.gpsCoords?.lat || 22.8291,
        gpsLng: defaultAddr.gpsCoords?.lng || 88.6148
      });

      if (updateProfile) {
        updateProfile({
          fullName: defaultAddr.name,
          name: defaultAddr.name,
          email: formEmail || activeCustomer?.email || '',
          address: defaultAddr.address,
          city: defaultAddr.city,
          state: defaultAddr.state,
          postalCode: defaultAddr.postalCode,
          coordinates: defaultAddr.gpsCoords
        });
      }
    } catch (err) {
      console.warn('Failed to sync profile', err);
    }
  };

  // 📍 Use Current GPS Location handler
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      showToast('GPS not supported on your device', 'error');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setFormGpsCoords(coords);
        setIsLocating(false);
        showToast(`📍 GPS Captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, 'success');
      },
      (err) => {
        setIsLocating(false);
        showToast('Please allow location access in your browser', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Switch to "Add New Address" mode
  const handleOpenAddAddress = () => {
    setFormTag('Home');
    setFormName(activeCustomer?.fullName || activeCustomer?.name || '');
    setFormPhone(activeCustomer?.phone || '');
    setFormEmail(activeCustomer?.email || '');
    setFormAddress('');
    setFormCity('Habra / Ashoknagar');
    setFormState('West Bengal');
    setFormPostalCode('743263');
    setFormGpsCoords({
      lat: activeCustomer?.gpsLat || 22.8291,
      lng: activeCustomer?.gpsLng || 88.6148
    });
    setFormIsDefault(savedAddresses.length === 0);
    setEditingAddressId(null);
    setAddressSubView('add');
  };

  // Switch to "Edit Address" mode
  const handleOpenEditAddress = (addr) => {
    setFormTag(addr.tag || 'Home');
    setFormName(addr.name || '');
    setFormPhone(addr.phone || activeCustomer?.phone || '');
    setFormEmail(activeCustomer?.email || '');
    setFormAddress(addr.address || '');
    setFormCity(addr.city || 'Habra / Ashoknagar');
    setFormState(addr.state || 'West Bengal');
    setFormPostalCode(addr.postalCode || '743263');
    setFormGpsCoords(addr.gpsCoords || { lat: 22.8291, lng: 88.6148 });
    setFormIsDefault(Boolean(addr.isDefault));
    setEditingAddressId(addr.id);
    setAddressSubView('edit');
  };

  // Mark an address as Default
  const handleSetDefaultAddress = async (id) => {
    const phone = activeCustomer?.phone || '';
    const updated = await addressService.setDefaultAddress(phone, id);
    setSavedAddresses(updated);

    const newDefault = updated.find((item) => item.id === id);
    if (newDefault) {
      syncDefaultAddressToProfile(newDefault);
      showToast(`"${newDefault.tag || newDefault.label || 'Address'}" marked as default delivery address!`, 'success');
      if (profileOrigin === 'checkout') {
        closeModal();
      }
    }
  };

  // Delete an address (Default address cannot be deleted)
  const handleDeleteAddress = async (id, e) => {
    e?.stopPropagation();
    const toDelete = savedAddresses.find(a => a.id === id);
    if (toDelete?.isDefault) {
      showToast('Default address cannot be deleted. Set another address as default first.', 'warning');
      return;
    }
    if (savedAddresses.length <= 1) {
      showToast('You must keep at least one saved delivery address', 'warning');
      return;
    }
    const phone = activeCustomer?.phone || '';
    const updated = await addressService.deleteAddress(phone, id);
    setSavedAddresses(updated);
    showToast('Address removed from address book', 'info');
  };

  // Save address from form (Add or Edit)
  const handleSaveAddressForm = async (e) => {
    e?.preventDefault();
    if (!formName.trim()) {
      showToast('Please enter the recipient full name', 'warning');
      return;
    }
    if (!formAddress.trim()) {
      showToast('Please enter the delivery street address / flat', 'warning');
      return;
    }

    const phone = activeCustomer?.phone || '';
    const addressPayload = {
      id: editingAddressId || undefined,
      label: formTag || 'Home',
      tag: formTag || 'Home',
      recipientName: formName.trim(),
      name: formName.trim(),
      phone: formPhone.trim() || phone,
      street: formAddress.trim(),
      address: formAddress.trim(),
      city: formCity.trim() || 'Habra / Ashoknagar',
      state: formState.trim() || 'West Bengal',
      pincode: formPostalCode.trim() || '743263',
      postalCode: formPostalCode.trim() || '743263',
      lat: formGpsCoords.lat,
      lng: formGpsCoords.lng,
      gpsCoords: formGpsCoords,
      isDefault: savedAddresses.length === 0 ? true : formIsDefault
    };

    const updatedList = await addressService.saveAddress(phone, addressPayload);
    setSavedAddresses(updatedList);

    if (addressPayload.isDefault) {
      await syncDefaultAddressToProfile(addressPayload);
    }

    showToast(
      editingAddressId ? 'Address updated successfully!' : 'New address saved to your address book!',
      'success'
    );

    if (profileOrigin === 'checkout') {
      closeModal();
    } else {
      setAddressSubView('list');
      setEditingAddressId(null);
    }
  };

  const displayName = activeCustomer?.fullName || activeCustomer?.name || 'Customer';
  const displayPhone = activeCustomer?.phone ? `+91 ${activeCustomer.phone}` : '';
  const defaultAddressObj = savedAddresses.find(a => a.isDefault) || savedAddresses[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={closeModal}
      />

      {/* Slide-Over Side Panel (100% Full Width on Mobile, Fixed sm:max-w-md Drawer on Desktop) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white shadow-2xl flex flex-col animate-slide-left border-l border-slate-200 h-full overflow-hidden">
          
          {/* Panel Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              {activeTab !== 'hub' && (
                <button
                  type="button"
                  onClick={() => {
                    if (profileOrigin === 'checkout') {
                      if (activeTab === 'address' && addressSubView !== 'list' && profileInitialSubView === 'list') {
                        setAddressSubView('list');
                        setEditingAddressId(null);
                      } else {
                        closeModal();
                      }
                    } else if (activeTab === 'address' && addressSubView !== 'list') {
                      setAddressSubView('list');
                      setEditingAddressId(null);
                    } else {
                      setActiveTab('hub');
                    }
                  }}
                  className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'hub' && 'Profile'}
                {activeTab === 'address' && (
                  addressSubView === 'list' 
                    ? 'Address Book' 
                    : addressSubView === 'add' 
                      ? 'Add New Address' 
                      : 'Edit Address'
                )}
                {activeTab === 'help' && 'Get Help & FAQs'}
                {activeTab === 'privacy' && 'Privacy Policy'}
                {activeTab === 'terms' && 'Terms & Conditions'}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Panel Scrollable Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
            
            {/* ===================== VIEW 1: MAIN IOS GROUPED HUB ===================== */}
            {activeTab === 'hub' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* 1. Customer Info Profile Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-xl shadow-xs flex-shrink-0 border-2 border-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-slate-900 text-base">
                        {displayName}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {displayPhone}
                      </p>
                      {activeCustomer?.email && (
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {activeCustomer.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('address');
                      setAddressSubView('list');
                    }}
                    title="View Address Book"
                    className="p-2.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                {/* 2. Grouped Card: Account & Orders */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
                  
                  {/* Address Book */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('address');
                      setAddressSubView('list');
                    }}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-slate-900">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">Address Book</p>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md">
                            {savedAddresses.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                          {defaultAddressObj?.address ? `${defaultAddressObj.address.slice(0, 30)}...` : 'Manage your delivery addresses'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>

                  {/* Order History */}
                  <button
                    type="button"
                    onClick={() => {
                      closeModal();
                      setIsOrdersOpen(true);
                    }}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-slate-900">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Order History</p>
                        <p className="text-[11px] text-slate-400">View your past orders & invoices</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>

                  {/* Language */}
                  <div className="px-4 py-3.5 flex items-center justify-between text-left">
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Language</p>
                        <p className="text-[11px] text-slate-400">English (India)</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">English</span>
                  </div>

                  {/* Notifications */}
                  <div className="px-4 py-3.5 flex items-center justify-between text-left">
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Notifications</p>
                        <p className="text-[11px] text-slate-400">Instant WhatsApp receipts enabled</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </div>

                </div>

                {/* 3. Grouped Card: Support, Legal & Store Info */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
                  
                  {/* Contact Us */}
                  <a
                    href={`https://wa.me/91${settings.whatsappNumber || '9147364980'}?text=${encodeURIComponent('Hi! I need help with my order on ' + settings.storeName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-emerald-600">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Contact Us</p>
                        <p className="text-[11px] text-slate-400">Direct WhatsApp support (+91 {settings.whatsappNumber || '9147364980'})</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </a>

                  {/* Get Help */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('help')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-slate-900">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Get Help</p>
                        <p className="text-[11px] text-slate-400">Cash on Delivery, shipping & FAQ</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>

                  {/* Privacy Policy */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('privacy')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-slate-900">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Privacy Policy</p>
                        <p className="text-[11px] text-slate-400">Customer security & data protection</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>

                  {/* Terms & Conditions */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('terms')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-slate-900">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Terms & Conditions</p>
                        <p className="text-[11px] text-slate-400">Store terms, billing & returns</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>

                </div>

                {/* 4. Log Out Button */}
                {activeCustomer && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        closeModal();
                        showToast('Logged out successfully', 'info');
                      }}
                      className="w-full py-3.5 px-4 bg-white hover:bg-rose-50 border border-slate-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-98"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* ===================== VIEW 2: ADDRESS BOOK (LIST & ADD/EDIT) ===================== */}
            {activeTab === 'address' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* SUB-VIEW 2A: SAVED ADDRESSES LIST (GIST INFO) */}
                {addressSubView === 'list' && (
                  <div className="space-y-3.5">
                    
                    {/* List Header Info & Add Button */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Saved Addresses
                        </p>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                          {savedAddresses.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenAddAddress}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Address</span>
                      </button>
                    </div>

                    {/* Address Cards List */}
                    <div className="space-y-3">
                      {savedAddresses.map((addr) => {
                        const isDefault = Boolean(addr.isDefault);
                        return (
                          <div
                            key={addr.id}
                            className={`bg-white rounded-2xl p-4 border transition-all ${
                              isDefault 
                                ? 'border-emerald-500/40 ring-2 ring-emerald-500/10 shadow-xs' 
                                : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                            }`}
                          >
                            {/* Card Top Row: Tag & Default Badge / Actions */}
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200/60">
                                  {addr.tag === 'Home' && <Home className="w-3 h-3 text-slate-600" />}
                                  {addr.tag === 'Work' && <Briefcase className="w-3 h-3 text-slate-600" />}
                                  {addr.tag !== 'Home' && addr.tag !== 'Work' && <MapPin className="w-3 h-3 text-slate-600" />}
                                  <span>{addr.tag || 'Home'}</span>
                                </span>

                                {isDefault && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                    <span>Default Address</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {!isDefault && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetDefaultAddress(addr.id)}
                                    className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 underline underline-offset-2 transition-colors cursor-pointer mr-1"
                                  >
                                    Make Default
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAddress(addr)}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/60 transition-colors cursor-pointer active:scale-95"
                                  title="Edit Address"
                                >
                                  <Pencil className="w-3 h-3 text-slate-600" />
                                  <span>Edit</span>
                                </button>

                                {savedAddresses.length > 1 && !isDefault && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteAddress(addr.id, e)}
                                    className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Delete Address"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Recipient & Contact */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">
                                  {addr.name || displayName}
                                </h4>
                                {addr.phone && (
                                  <span className="text-xs text-slate-500 font-mono">
                                    +91 {addr.phone.replace(/\D/g, '').slice(-10)}
                                  </span>
                                )}
                              </div>

                              {/* Gist Info: Street, City, State, Pincode */}
                              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                {addr.address}
                              </p>
                              <p className="text-xs text-slate-500">
                                {addr.city || 'Habra / Ashoknagar'}, {addr.state || 'West Bengal'} - <span className="font-mono font-medium">{addr.postalCode || '743263'}</span>
                              </p>

                              {/* GPS Coordinates Pill */}
                              {addr.gpsCoords && (
                                <div className="pt-1.5 flex items-center gap-1 text-[10px] font-mono text-slate-400">
                                  <MapPin className="w-3 h-3 text-emerald-600" />
                                  <span>GPS: {Number(addr.gpsCoords.lat).toFixed(4)}, {Number(addr.gpsCoords.lng).toFixed(4)}</span>
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>

                    {/* Prominent Add New Address Bottom Button */}
                    <button
                      type="button"
                      onClick={handleOpenAddAddress}
                      className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl text-slate-800 text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
                    >
                      <Plus className="w-4 h-4 text-slate-700" />
                      <span>Add New Address</span>
                    </button>

                  </div>
                )}

                {/* SUB-VIEW 2B: ADD / EDIT ADDRESS FORM WITH MAP */}
                {(addressSubView === 'add' || addressSubView === 'edit') && (
                  <form onSubmit={handleSaveAddressForm} className="space-y-4 animate-fade-in pb-4">
                    {/* Address Tag Selector */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Address Type
                      </label>
                      <div className="flex items-center gap-2">
                        {['Home', 'Work', 'Other'].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setFormTag(tag)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              formTag === tag
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-[#F4F5F7] text-slate-700 border-transparent hover:bg-slate-200/80'
                            }`}
                          >
                            {tag === 'Home' && <Home className="w-3.5 h-3.5" />}
                            {tag === 'Work' && <Briefcase className="w-3.5 h-3.5" />}
                            {tag === 'Other' && <MapPin className="w-3.5 h-3.5" />}
                            <span>{tag}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recipient Details */}
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Full name"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            WhatsApp Phone
                          </label>
                          <input
                            type="tel"
                            placeholder="10-digit mobile number"
                            value={formPhone}
                            onChange={(e) => setFormPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="name@example.com"
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address & GPS Details */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Street Address / Flat / Building *
                        </label>
                        <input
                          type="text"
                          placeholder="House / Flat / Street / Landmark"
                          value={formAddress}
                          onChange={(e) => setFormAddress(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                          <input
                            type="text"
                            placeholder="Habra / Ashoknagar"
                            value={formCity}
                            onChange={(e) => setFormCity(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                          <input
                            type="text"
                            placeholder="West Bengal"
                            value={formState}
                            onChange={(e) => setFormState(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                          <input
                            type="text"
                            placeholder="743263"
                            value={formPostalCode}
                            onChange={(e) => setFormPostalCode(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Leaflet GPS Map Picker */}
                      <div className="pt-2">
                        <LocationPicker
                          coordinates={formGpsCoords}
                          onChange={(coords) => setFormGpsCoords(coords)}
                          label="Pinpoint Location on Map:"
                        />
                      </div>

                      {/* Make Default Address Checkbox */}
                      <div className="pt-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formIsDefault}
                            onChange={(e) => setFormIsDefault(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                          />
                          <span>Set as default delivery address</span>
                        </label>
                      </div>

                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setAddressSubView('list');
                          setEditingAddressId(null);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>SAVE</span>
                      </button>
                    </div>

                  </form>
                )}

              </div>
            )}

            {/* ===================== VIEW 3: GET HELP & FAQS ===================== */}
            {activeTab === 'help' && (
              <div className="space-y-4 animate-fade-in bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-xs text-slate-700 leading-relaxed">
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">How does Cash on Delivery (COD) work?</h3>
                  <p className="text-slate-600">
                    Place your order with 1 click without paying upfront. Our delivery partner will collect the cash at your doorstep upon delivering your items.
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h3 className="font-bold text-sm text-slate-900">How do I track my order?</h3>
                  <p className="text-slate-600">
                    As soon as your order is placed, an automated WhatsApp receipt with your invoice number is dispatched to your registered mobile number. You can also view live order progress under <strong>Order History</strong>.
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h3 className="font-bold text-sm text-slate-900">Need urgent support?</h3>
                  <p className="text-slate-600">
                    Our customer support team is available directly on WhatsApp at <strong>+91 {settings.whatsappNumber || '9147364980'}</strong>.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('hub')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors text-center"
                  >
                    Back to Profile
                  </button>
                </div>
              </div>
            )}

            {/* ===================== VIEW 4: PRIVACY POLICY ===================== */}
            {activeTab === 'privacy' && (
              <div className="space-y-4 animate-fade-in bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-xs text-slate-700 leading-relaxed">
                <h3 className="font-bold text-sm text-slate-900">Customer Data & Privacy</h3>
                <p className="text-slate-600">
                  We respect your privacy. Your mobile phone number is solely used for WhatsApp OTP authentication, sending automated digital receipts, and dispatching order status updates.
                </p>
                <p className="text-slate-600">
                  We never sell, rent, or share your personal information or GPS delivery coordinates with unauthorized third parties. All transactions and customer data are securely managed by the XYVOT Platform.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('hub')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors text-center"
                  >
                    Back to Profile
                  </button>
                </div>
              </div>
            )}

            {/* ===================== VIEW 5: TERMS & CONDITIONS ===================== */}
            {activeTab === 'terms' && (
              <div className="space-y-4 animate-fade-in bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-xs text-slate-700 leading-relaxed">
                <h3 className="font-bold text-sm text-slate-900">Store Terms & Conditions</h3>
                <p className="text-slate-600">
                  1. <strong>Cash on Delivery</strong>: By placing an order, you agree to accept delivery and pay the exact invoice amount to the delivery rider.
                </p>
                <p className="text-slate-600">
                  2. <strong>Tax Invoices</strong>: Digital GST tax invoices are generated automatically and can be downloaded as PDF receipts anytime from the Order History page.
                </p>
                <p className="text-slate-600">
                  3. <strong>Returns & Cancellations</strong>: Cancellations can be requested via WhatsApp before dispatch.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('hub')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors text-center"
                  >
                    Back to Profile
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
