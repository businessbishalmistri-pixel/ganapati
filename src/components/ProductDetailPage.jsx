import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Check, 
  Package, 
  Minus, 
  Plus, 
  Layers
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { ProductCard } from './ProductCard';

export const ProductDetailPage = ({ product, allProducts, onBack, onSelectProduct }) => {
  const { addToCart, cartItems } = useCart();
  const { settings } = useSettings();
  const [selectedImage, setSelectedImage] = useState(product?.image || '');
  const [quantity, setQuantity] = useState(1);

  // Real XYVOT variants
  const variants = product?.variants || [];
  const hasRealVariants = Boolean((product?.has_variants || product?.hasVariants) && Array.isArray(variants) && variants.length > 0);
  
  const [selectedVariant, setSelectedVariant] = useState(() => {
    if ((product?.has_variants || product?.hasVariants) && Array.isArray(product?.variants) && product.variants.length > 0) {
      return product.variants.find((v) => (v.stock_quantity || 0) > 0) || product.variants[0];
    }
    return null;
  });

  // Scroll to top when product changes & sync active variant
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (product) {
      setSelectedImage(product.image_url || product.image || '');
      setQuantity(1);
      const vList = product.variants || [];
      const hasV = Boolean((product.has_variants || product.hasVariants) && Array.isArray(vList) && vList.length > 0);
      setSelectedVariant(hasV ? (vList.find((v) => (v.stock_quantity || 0) > 0) || vList[0]) : null);
    }
  }, [product]);

  if (!product) return null;

  const validImages = (product.images || [product.image_url || product.image]).filter(Boolean);
  if (validImages.length === 0 && (product.image_url || product.image)) {
    validImages.push(product.image_url || product.image);
  }

  // Active pricing & stock calculation
  const currentPrice = selectedVariant 
    ? parseFloat(selectedVariant.selling_price) 
    : parseFloat(product.selling_price ?? product.price ?? 0);
  const currentStock = selectedVariant 
    ? (selectedVariant.stock_quantity || 0) 
    : (product.stock_quantity ?? product.stock ?? 0);
  const currentSku = selectedVariant 
    ? (selectedVariant.sku || product.sku) 
    : (product.sku || '');
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= (selectedVariant?.low_stock_threshold || 3);

  // Similar products from same category
  const similarProducts = allProducts
    ? allProducts
        .filter((p) => p.id !== product.id && p.category && product.category && p.category.toLowerCase() === product.category.toLowerCase())
        .slice(0, 5)
    : [];

  const fallbackProducts = similarProducts.length === 0 && allProducts
    ? allProducts.filter((p) => p.id !== product.id).slice(0, 5)
    : similarProducts;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
  };

  return (
    <div className="min-h-screen bg-white animate-fade-in pb-20">
      
      {/* Top Breadcrumb Navigation */}
      <div className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs text-slate-500 font-medium">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Shop</span>
          </button>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="hover:text-slate-700 cursor-pointer" onClick={onBack}>Home</span>
            <span>/</span>
            <span className="hover:text-slate-700 cursor-pointer" onClick={onBack}>Shop</span>
            {product.category && (
              <>
                <span>/</span>
                <span className="text-slate-800 font-semibold">{product.category}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
        
        {/* Main Product Showcase (2-Column Minimalist Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* Left Column: Gallery */}
          <div className="lg:col-span-6 space-y-4">
            {/* Hero Main Image Frame */}
            <div className="relative h-[250px] sm:h-[350px] lg:h-auto lg:aspect-square w-full rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-center p-4 sm:p-8 lg:p-10 overflow-hidden">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80';
                  }}
                  className="w-full h-full object-contain object-center transition-all duration-300 transform hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  <Package className="w-24 h-24 stroke-[1.2]" />
                </div>
              )}
            </div>

            {/* Thumbnails Row */}
            {validImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-1">
                {validImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white p-1.5 transition-all cursor-pointer ${
                      selectedImage === img
                        ? 'border-2 border-emerald-600 shadow-xs'
                        : 'border border-slate-200/80 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=120&q=80';
                      }}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Buy Box */}
          <div className="lg:col-span-6 space-y-6 pt-2">
            
            {/* Category */}
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
              {product.category || 'Fresh Grocery'}
            </span>

            {/* Title & In Stock Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {product.title}
              </h1>
              {isOutOfStock ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Out of Stock
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  In Stock
                </span>
              )}
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {settings.currency}{currentPrice.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-base text-slate-400 line-through font-normal">
                  {settings.currency}{product.originalPrice.toFixed(2)}
                </span>
              )}
              {currentSku && (
                <span className="text-xs text-slate-400 font-mono ml-auto">
                  SKU: {currentSku}
                </span>
              )}
            </div>

            {/* Description Paragraph */}
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-lg">
              {product.description || 'Premium quality freshly sourced produce, packed with care and delivered directly to your doorstep with Cash on Delivery.'}
            </p>

            {/* Real XYVOT Variant Selector (Rendered ONLY if product has variants) */}
            {hasRealVariants && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-900">
                    Select Option / Size
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {variants.length} options available
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v) => {
                    const isVSelected = selectedVariant?.id === v.id;
                    const isVOutOfStock = (v.stock_quantity || 0) <= 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                          isVSelected
                            ? 'bg-[#15803d] text-white shadow-xs'
                            : isVOutOfStock
                            ? 'border border-slate-200 text-slate-400 bg-slate-50 line-through'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold">{v.name || v.size}</span>
                        <span className={`text-[11px] ${isVSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                          &bull; {settings.currency}{v.selling_price.toFixed(0)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Single Product Unit / Pack Size if available and no variants */}
            {!hasRealVariants && product.unit && (
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                  Pack Size: <strong className="text-slate-900">{product.unit}</strong>
                </span>
              </div>
            )}

            {/* Quantity Stepper & Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-3 sm:gap-4">
              
              {/* Stepper */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-white px-2 py-1.5 h-12">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-slate-900 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  disabled={quantity >= currentStock || isOutOfStock}
                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="inline-flex items-center justify-center gap-2 bg-[#15803d] hover:bg-[#166534] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-medium px-8 py-3.5 rounded-full text-xs sm:text-sm transition-all shadow-xs active:scale-98 cursor-pointer h-12"
              >
                <span>{isOutOfStock ? 'Out of stock' : 'Add to cart'}</span>
                <ShoppingCart className="w-4 h-4" />
              </button>

            </div>

          </div>

        </div>

        {/* ==================== PRODUCT DESCRIPTION SECTION ==================== */}
        <div className="pt-6 border-t border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-600" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
              Product Description
            </h3>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            <p>
              {product.description || 'Our produce is handpicked directly from certified local farms and organic growers to ensure peak freshness, rich flavor, and maximum nutritional value.'}
            </p>
          </div>
        </div>

        {/* Similar Category Products Section (Identical Home Page Density) */}
        {fallbackProducts.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Similar Products in {product.category || 'Store'}
                </h2>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {fallbackProducts.length} items
                </span>
              </div>

              <button
                onClick={onBack}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded transition-all flex items-center gap-1 group cursor-pointer"
              >
                <span>View Full Catalog</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            {/* Products Grid (Identical High Density Sizing to Home Page) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
              {fallbackProducts.map((simProd) => (
                <ProductCard
                  key={simProd.id}
                  product={simProd}
                  onSelectProduct={(p) => {
                    onSelectProduct(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
