import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import * as LModule from 'leaflet';

const L = LModule.default || LModule;

const getCustomIcon = () => {
  try {
    if (typeof L !== 'undefined' && L.icon) {
      return L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    }
  } catch (e) {
    console.warn('Leaflet icon creation warning', e);
  }
  return undefined;
};

export const LocationPicker = ({ coordinates, onChange, addressHint = '', label = 'GPS Map Delivery Pin' }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Default coordinate (e.g. West Bengal / India or user location)
  const defaultPos = coordinates?.lat && coordinates?.lng 
    ? [coordinates.lat, coordinates.lng] 
    : [22.8291, 88.6148];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current && typeof L !== 'undefined' && L.map) {
        const map = L.map(mapContainerRef.current, {
          center: defaultPos,
          zoom: 14,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        const icon = getCustomIcon();
        const markerOptions = { draggable: true };
        if (icon) markerOptions.icon = icon;

        const marker = L.marker(defaultPos, markerOptions).addTo(map);

        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onChange({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
        });

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onChange({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } else if (mapInstanceRef.current && coordinates?.lat && coordinates?.lng) {
        markerRef.current?.setLatLng([coordinates.lat, coordinates.lng]);
        mapInstanceRef.current?.setView([coordinates.lat, coordinates.lng], mapInstanceRef.current.getZoom());
      }
    } catch (err) {
      console.warn('Map initialization notice:', err);
    }
  }, [coordinates?.lat, coordinates?.lng]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (e) {}
    };
  }, []);

  const handleGetCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        try {
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([lat, lng], 16);
            markerRef.current.setLatLng([lat, lng]);
          }
        } catch (e) {}

        onChange({ lat, lng });
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        setGeoError('Could not obtain your GPS location. Please drag the pin on the map.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 px-4 sm:px-0">
        {label && (
          <label className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-black text-white text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shadow-xs ml-auto flex-shrink-0"
        >
          {isLocating ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <span>📍</span>
          )}
          <span>{isLocating ? 'Locating...' : 'Use Current GPS'}</span>
        </button>
      </div>

      <div className="relative rounded-none sm:rounded-xl overflow-hidden border-y sm:border border-slate-200 shadow-inner h-60 sm:h-64 bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md text-slate-900 border border-white/60 px-3 py-1.5 rounded-lg text-xs flex items-center justify-between shadow-xs">
            <span className="truncate flex items-center gap-1.5 text-slate-900 font-bold">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              {coordinates?.lat && coordinates?.lng
                ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
                : 'Click or drag pin to delivery spot'}
            </span>
            <span className="text-[10px] text-slate-700 font-medium ml-2 flex-shrink-0">
              Will link to Google Maps
            </span>
          </div>
        </div>
      </div>

      {geoError && (
        <div className="mx-4 sm:mx-0 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{geoError}</span>
        </div>
      )}
      <p className="px-4 sm:px-0 text-[11px] text-slate-500">
        Drag the pin or click the map to mark the delivery gate or door.
      </p>
    </div>
  );
};
