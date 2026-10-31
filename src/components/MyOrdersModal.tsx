import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  PackageCheck, 
  XCircle, 
  MessageCircle, 
  ExternalLink,
  ChevronRight,
  MapPin,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';
import { SHOP_PHONE } from '../constants';
import { db, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onBrowseProducts: () => void;
}

export default function MyOrdersModal({ isOpen, onClose, orders, onBrowseProducts }: MyOrdersModalProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered'>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} className="animate-pulse" /> Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 size={12} /> Confirmed
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            <Truck size={12} /> Shipped
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PackageCheck size={12} /> Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-100 text-stone-500 border border-stone-200">
            <XCircle size={12} /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'cancelled' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    } finally {
      setCancellingId(null);
    }
  };

  const formatOrderDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 240 }}
          className="relative bg-stone-50 w-full max-w-xl rounded-t-[2.5rem] sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl z-10"
        >
          {/* Header */}
          <div className="p-6 bg-white border-b border-black/5 flex items-center justify-between sticky top-0 z-20">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black uppercase tracking-tight">My Orders</h2>
                <span className="px-2.5 py-0.5 bg-black text-white text-[10px] font-black rounded-full">
                  {orders.length}
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-0.5">
                Swami Footwear Order History
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-stone-100 hover:bg-stone-200 active:scale-95 rounded-full flex items-center justify-center text-black/60 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Filter Pills */}
          {orders.length > 0 && (
            <div className="px-6 py-3 bg-white/70 border-b border-black/5 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
              {(['all', 'pending', 'confirmed', 'shipped', 'delivered'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                    filter === tab
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-stone-100 text-black/50 hover:text-black'
                  }`}
                >
                  {tab === 'all' ? `All (${orders.length})` : tab}
                </button>
              ))}
            </div>
          )}

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {orders.length === 0 ? (
              <div className="text-center py-16 px-4 flex flex-col items-center">
                <div className="w-20 h-20 bg-stone-200/60 rounded-3xl flex items-center justify-center text-black/30 mb-5">
                  <ShoppingBag size={36} />
                </div>
                <h3 className="text-base font-black uppercase tracking-tight mb-2">No Orders Placed Yet</h3>
                <p className="text-xs text-black/50 max-w-xs mb-8 leading-relaxed">
                  You haven't ordered any pairs yet. Explore our handcrafted footwear collection and place your first order!
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onBrowseProducts();
                  }}
                  className="bg-black text-white px-8 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  <ShoppingBag size={14} /> Browse Catalog
                </button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-black/40">
                <p className="text-xs font-bold uppercase tracking-widest">No orders in this category</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-black/5 p-5 shadow-sm space-y-4 hover:border-black/20 transition-colors"
                >
                  {/* Order Card Header */}
                  <div className="flex items-start justify-between border-b border-black/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-wider text-black">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-black/40 font-medium mt-1">
                        <Calendar size={11} />
                        <span>{formatOrderDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 block">Total</span>
                      <span className="text-base font-black text-black">
                        ₹{order.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-black/5">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-black/20">
                              <ShoppingBag size={18} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-black truncate">{item.productName}</h4>
                          <p className="text-[10px] text-black/40 font-medium mt-0.5">
                            Qty: {item.quantity || 1} {item.size ? `• Size: ${item.size}` : ''}
                          </p>
                        </div>
                        <span className="text-xs font-black text-black">
                          ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <div className="bg-stone-50 rounded-2xl p-3 flex items-start gap-2 text-[11px] text-black/60">
                      <MapPin size={14} className="shrink-0 text-black/40 mt-0.5" />
                      <p className="leading-snug">
                        <span className="font-bold text-black">Delivery: </span>
                        {order.shippingAddress}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-black/5">
                    <a
                      href={`https://wa.me/${SHOP_PHONE.replace('+', '')}?text=${encodeURIComponent(
                        `Hi Swami Footwear, I have an inquiry about my Order #${order.id.slice(-6).toUpperCase()}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
                    >
                      <MessageCircle size={14} /> WhatsApp Support (+91 9904648282)
                    </a>

                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-red-500 px-3 py-2 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
