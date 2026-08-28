import React, { useState } from 'react';
import {
  Utensils,
  Plus,
  Minus,
  CheckCircle2,
  X,
  MapPin,
  Sparkles,
  ShoppingBag,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { StationStop } from '../../data/trainStoppages';

interface FoodItem {
  id: string;
  name: string;
  category: 'VEG' | 'NON_VEG' | 'BEVERAGE';
  price: number;
  description: string;
  image: string;
  rating: number;
}

const MENU_ITEMS: FoodItem[] = [
  {
    id: 'f1',
    name: 'Executive Deluxe Thali',
    category: 'VEG',
    price: 180,
    description: 'Paneer Butter Masala, Dal Makhani, Jeera Rice, 2 Butter Parathas, Gulab Jamun & Curd',
    image: '🍛',
    rating: 4.8,
  },
  {
    id: 'f2',
    name: 'Hyderabadi Chicken Biryani',
    category: 'NON_VEG',
    price: 210,
    description: 'Fragrant Basmati Rice, Tender Spiced Chicken, Mirchi ka Salan & Onion Raita',
    image: '🍗',
    rating: 4.9,
  },
  {
    id: 'f3',
    name: 'South Indian Breakfast Combo',
    category: 'VEG',
    price: 110,
    description: '2 Ghee Podi Idlis, 1 Crispy Medu Vada, Masala Upma, Sambar & 2 Chutneys',
    image: '🥞',
    rating: 4.7,
  },
  {
    id: 'f4',
    name: 'Classic Veg Hakka Noodles & Manchurian',
    category: 'VEG',
    price: 140,
    description: 'Wok-tossed Hakka Noodles with Vegetable Dumplings in Savory Garlic Gravy',
    image: '🍜',
    rating: 4.6,
  },
  {
    id: 'f5',
    name: 'Masala Chai Flask (Serves 2) & Samosa',
    category: 'BEVERAGE',
    price: 65,
    description: 'Fresh Elaichi-Ginger Infused Hot Tea in Thermal Flask with 2 Crispy Samosas',
    image: '☕',
    rating: 4.9,
  },
];

interface OrderFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName: string;
  stoppages: StationStop[];
  currentStationIndex: number;
  coach: string;
  seatNumber?: number | string;
}

export const OrderFoodModal: React.FC<OrderFoodModalProps> = ({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  stoppages,
  currentStationIndex,
  coach,
  seatNumber,
}) => {
  const upcomingStops = stoppages.slice(currentStationIndex + 1);
  const defaultDeliveryStop = upcomingStops[0] || stoppages[1] || stoppages[0] || { name: 'Next Scheduled Halt', code: 'HALT', platform: 'Platform 1' };

  const [deliveryStation, setDeliveryStation] = useState<string>(defaultDeliveryStop.name);
  const [quantities, setQuantities] = useState<Record<string, number>>({ f1: 1 });
  const [orderConfirmed, setOrderConfirmed] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>('');

  if (!isOpen) return null;

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => {
      const cur = prev[id] || 0;
      const next = Math.max(0, cur + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const totalAmount = Object.entries(quantities).reduce((sum, [id, qty]) => {
    const item = MENU_ITEMS.find((m) => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const totalItemsCount = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  const handlePlaceOrder = () => {
    const genId = `IRCTC-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(genId);
    setOrderConfirmed(true);
    setTimeout(() => {
      setOrderConfirmed(false);
      onClose();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in select-none">
      <div className="bg-white rounded-[28px] max-w-lg w-full border border-purple-200 shadow-2xl overflow-hidden font-sans my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/30 border border-purple-400/30 flex items-center justify-center font-bold">
              <Utensils className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">IRCTC e-Catering</h3>
                <span className="text-[9px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-1.5 py-0.2 rounded-full font-bold">
                  Direct to Berth
                </span>
              </div>
              <p className="text-[11px] text-purple-200 font-medium">
                #{trainNumber} • {trainName} • Coach {coach || 'B4'} (Berth {seatNumber || '36'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          {orderConfirmed ? (
            <div className="py-10 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-black text-slate-900">Food Order Confirmed!</h4>
              <p className="text-slate-600 text-xs max-w-sm mx-auto">
                Order <strong className="font-mono text-purple-900">#{orderId}</strong> will be prepared hot and delivered to <strong>Coach {coach || 'B4'}, Berth {seatNumber || '36'}</strong> at <strong>{deliveryStation}</strong>.
              </p>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-[11px] font-semibold max-w-xs mx-auto">
                💳 Total Paid: <strong>₹{totalAmount}</strong> • Cash on Delivery / UPI at Berth
              </div>
            </div>
          ) : (
            <>
              {/* Delivery Station Selector */}
              <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-100 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-700" />
                  <span>Delivery Station (Next Scheduled Halt):</span>
                </label>
                <select
                  value={deliveryStation}
                  onChange={(e) => setDeliveryStation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  {upcomingStops.length > 0 ? (
                    upcomingStops.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code}) • Arr: {s.scheduledArr} • {s.platform}
                      </option>
                    ))
                  ) : (
                    stoppages.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code}) • Arr: {s.scheduledArr}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Menu List */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Pantry & Authorized Partner Menu:
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {MENU_ITEMS.map((item) => {
                    const qty = quantities[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-purple-200 flex items-center justify-between gap-3 shadow-2xs transition-all"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-2xl">{item.image}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900">{item.name}</span>
                              <span
                                className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
                                  item.category === 'VEG'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.category === 'NON_VEG'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                            <span className="font-mono font-bold text-purple-900 text-xs mt-0.5 block">
                              ₹{item.price}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-2 bg-purple-50 p-1 rounded-xl border border-purple-100 shrink-0">
                          {qty > 0 ? (
                            <>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-6 h-6 rounded-lg bg-white hover:bg-purple-100 text-purple-900 flex items-center justify-center font-bold shadow-2xs transition-all cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-4 text-center font-bold font-mono text-xs">{qty}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-6 h-6 rounded-lg bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center font-bold shadow-2xs transition-all cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Order Bar */}
              <div className="pt-2 border-t border-purple-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Total ({totalItemsCount} items):</span>
                  <span className="text-base font-black text-slate-900 font-mono">₹{totalAmount}</span>
                </div>
                <button
                  type="button"
                  disabled={totalItemsCount === 0}
                  onClick={handlePlaceOrder}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Order to Berth →</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
