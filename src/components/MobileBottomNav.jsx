import React from 'react';
import { Home, Search, ShoppingBag, User, UserCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav = ({ 
  isHomeView, 
  onHomeClick, 
  onSearchClick, 
  searchQuery 
}) => {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { customer, setIsProfileOpen } = useAuth();

  const isHomeActive = isHomeView && !searchQuery?.trim();
  const isSearchActive = Boolean(searchQuery?.trim());

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),4px)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 h-14 items-center px-1">
        
        {/* 1. Home Tab */}
        <button
          type="button"
          onClick={onHomeClick}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full py-1 text-center transition-all select-none active:scale-95 cursor-pointer ${
            isHomeActive
              ? 'text-emerald-700 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${isHomeActive ? 'stroke-[2.4] scale-105' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] font-medium leading-none">Home</span>
        </button>

        {/* 2. Search Tab */}
        <button
          type="button"
          onClick={onSearchClick}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full py-1 text-center transition-all select-none active:scale-95 cursor-pointer ${
            isSearchActive
              ? 'text-emerald-700 font-bold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className={`w-5 h-5 transition-transform ${isSearchActive ? 'stroke-[2.4] scale-105' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] font-medium leading-none">Search</span>
        </button>

        {/* 3. Cart Tab */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center justify-center gap-1 w-full h-full py-1 text-center text-slate-500 hover:text-slate-800 transition-all select-none active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-emerald-600 text-white text-[9.5px] font-black px-1 min-w-[17px] h-[17px] rounded-full flex items-center justify-center leading-none shadow-xs animate-scale-in">
                {totalItemsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium leading-none">Cart</span>
        </button>

        {/* 4. User Account Tab */}
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-full h-full py-1 text-center text-slate-500 hover:text-slate-800 transition-all select-none active:scale-95 cursor-pointer"
        >
          <div className="relative">
            {customer?.name ? (
              <>
                <UserCheck className="w-5 h-5 stroke-[2] text-emerald-700" />
                <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-white" />
              </>
            ) : (
              <User className="w-5 h-5 stroke-[1.8]" />
            )}
          </div>
          <span className="text-[10px] font-medium leading-none truncate max-w-[65px]">
            {customer?.name ? customer.name.split(' ')[0] : 'Account'}
          </span>
        </button>

      </div>
    </nav>
  );
};
