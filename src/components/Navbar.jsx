import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Search, User, UserCheck, FileText, MapPin, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ searchQuery, setSearchQuery, onHomeClick }) => {
  const { totalItemsCount, setIsCartOpen, justAddedId } = useCart();
  const { settings } = useSettings();
  const { customer, setIsAuthOpen, setIsOrdersOpen, setIsProfileOpen, logout } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="relative z-40 bg-white">
      {/* Top micro banner */}
      {(settings?.announcementText === undefined || settings?.announcementText?.trim() !== '') && (
        <div className="bg-emerald-50/90 text-emerald-950 text-[10px] sm:text-xs py-1 px-3 text-center font-medium flex items-center justify-center gap-1.5">
          <span className="text-emerald-800 font-bold">
            {settings?.announcementText || `Free delivery on orders over ₹${settings?.freeShippingThreshold || 200} • Cash on Delivery`}
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-[10px]">
        <div className="flex items-center justify-between gap-2.5">

          {/* Store Brand Name */}
          <div
            onClick={onHomeClick}
            className="cursor-pointer group flex-shrink-0 py-0.5"
          >
            <h1 className="font-black text-base sm:text-xl tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
              {settings?.storeName || 'Ganapati Store'}
            </h1>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder='Search products e.g. "Sattu", "Coconut", "Rice"...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm bg-slate-50/80 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl outline-none transition-all placeholder:text-slate-400 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Actions: User Profile Icon & Shopping Cart Icon */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* 1. Customer Details Avatar (Opens delivery info modal) */}
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              title={customer?.name ? `Delivery details: ${customer.name}` : 'Enter your delivery details'}
              className="relative p-1.5 rounded-full hover:bg-slate-100/80 text-slate-900 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            >
              {customer?.name ? (
                <>
                  <UserCheck className="w-5 h-5 stroke-[1.8] text-emerald-700" />
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white"></span>
                </>
              ) : (
                <User className="w-5 h-5 stroke-[1.8] text-slate-700" />
              )}
            </button>

            {/* 2. Cart State */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              title={`Shopping Cart (${totalItemsCount} items)`}
              className={`relative p-1.5 rounded-full hover:bg-slate-100/80 text-slate-900 transition-all flex items-center justify-center active:scale-95 ${
                justAddedId ? 'scale-110' : ''
              }`}
            >
              <ShoppingCart className="w-5 h-5 stroke-[1.8] text-slate-900" />

              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold px-1.5 min-w-[17px] h-[17px] rounded-full flex items-center justify-center leading-none shadow-xs animate-scale-in">
                  {totalItemsCount}
                </span>
              )}
            </button>

          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="mt-[5px] pb-2 md:hidden">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              id="mobile-search-input"
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50/80 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl outline-none transition-all placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
