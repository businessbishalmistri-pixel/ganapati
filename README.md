# WhatsApp & Firebase Frictionless E-Commerce Storefront

A modern, responsive e-commerce web application with frictionless guest ordering directly to WhatsApp, automated Firebase Firestore storage, live inventory sync, and OpenStreetMap / Leaflet GPS pinpointing.

## 🚀 Key Highlights

- **Direct WhatsApp Order Verification**: Customers place orders without creating accounts or passwords; formatted itemized summaries and Google Maps location links are sent straight to WhatsApp (`+91 9147364980`).
- **Real-Time Inventory & Dynamic Categories**: Syncs real-time stock and dynamically generates category filter pills based on active catalog products.
- **Interactive Quantity Steppers**: Product cards feature direct `[-] [ Qty ] [+]` steppers for quick adding and updating directly from the catalog.
- **Full-Page Product Detail Views**: Dedicated showcase with high-res photo gallery, specifications checklist, and similar category product recommendations.
- **Interactive Delivery Map Picker**: Leaflet-powered pinpoint picker with GPS auto-detection + Store Pickup option.
- **Universal 6px Radius Design Language**: Crisp modern aesthetics styled with Tailwind CSS.
- **Firebase Firestore & Backend Sync**: Saves orders to Firestore and synchronizes with your central database.

## 🛠️ Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Maps**: Leaflet & OpenStreetMap
- **Database & Backend**: Firebase Firestore & Supabase Client

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser.

### 3. Build for Production
```bash
npm run build
```
The optimized production bundle will be created in the `dist/` directory, ready to host on GitHub Pages, Vercel, or Netlify.
