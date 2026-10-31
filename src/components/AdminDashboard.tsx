import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Bell, RefreshCw, X, Save, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, StockUpdate, Notification, Order } from '../types';
import { db, collection, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { CATEGORIES } from '../constants';

interface AdminDashboardProps {
  products: Product[];
  stockUpdates: StockUpdate[];
  notifications: Notification[];
  orders?: Order[];
}

export default function AdminDashboard({ products, stockUpdates, notifications, orders = [] }: AdminDashboardProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<'inventory' | 'orders'>('inventory');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', price: 0, category: CATEGORIES[0], imageUrl: '', stockCount: 0, description: ''
  });
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [newNotification, setNewNotification] = useState({ title: '', body: '' });
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [newStockUpdate, setNewStockUpdate] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingOrderId(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.imageUrl) return;
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        createdAt: new Date().toISOString()
      });
      setIsAddingProduct(false);
      setNewProduct({ name: '', price: 0, category: CATEGORIES[0], imageUrl: '', stockCount: 0, description: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      const { id, ...productData } = editingProduct;
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, { ...productData });
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${editingProduct.id}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.body) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        ...newNotification,
        createdAt: new Date().toISOString()
      });
      setIsSendingNotification(false);
      setNewNotification({ title: '', body: '' });
      alert("Notification sent successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    }
  };

  const handleAddStockUpdate = async () => {
    if (!newStockUpdate.trim()) return;
    try {
      await addDoc(collection(db, 'stock_updates'), {
        message: newStockUpdate,
        createdAt: new Date().toISOString()
      });
      setIsUpdatingStock(false);
      setNewStockUpdate('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stock_updates');
    }
  };

  return (
    <div className="p-4 bg-stone-50 min-h-screen pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Admin Control</h1>
        <p className="text-black/40 text-xs font-bold uppercase tracking-widest">Manage Swami Footwear</p>
      </header>

      {/* Tab Switcher */}
      <div className="flex bg-stone-200/60 p-1 rounded-2xl mb-6">
        <button
          onClick={() => setActiveAdminTab('inventory')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeAdminTab === 'inventory' ? 'bg-black text-white shadow-sm' : 'text-black/50 hover:text-black'
          }`}
        >
          Inventory ({products.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('orders')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            activeAdminTab === 'orders' ? 'bg-black text-white shadow-sm' : 'text-black/50 hover:text-black'
          }`}
        >
          Orders ({orders.length})
          {orders.filter(o => o.status === 'pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>
      </div>

      {activeAdminTab === 'inventory' ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setIsAddingProduct(true)}
              className="bg-black text-white p-4 rounded-2xl flex flex-col items-center gap-2 shadow-lg"
            >
              <Plus size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Add Product</span>
            </button>
            <button
              onClick={() => setIsSendingNotification(true)}
              className="bg-white border border-black/10 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm"
            >
              <Bell size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Notify Users</span>
            </button>
            <button
              onClick={() => setIsUpdatingStock(true)}
              className="bg-white border border-black/10 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm col-span-2"
            >
              <RefreshCw size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Update Daily Stock</span>
            </button>
          </div>

          <section>
            <h2 className="text-lg font-black uppercase tracking-widest mb-4">Inventory ({products.length})</h2>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white p-4 rounded-2xl border border-black/5 flex gap-4 items-center shadow-sm">
                  <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg bg-stone-100" />
                  <div className="flex-1">
                    <h3 className="font-bold text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-black/40 font-bold uppercase tracking-widest">₹{product.price} • {product.stockCount} in stock</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingProduct(product)} className="p-2 text-black/40 hover:text-black transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-500/40 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-widest">Customer Orders</h2>
            <span className="text-xs font-bold text-black/40 uppercase tracking-widest">
              {orders.length} Total
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-black/5 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-black/30">No customer orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between border-b border-black/5 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-wide text-black">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-black/50">
                          by {order.userName}
                        </span>
                      </div>
                      <p className="text-[10px] text-black/40 font-medium mt-0.5">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-black">₹{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5">
                    {order.items?.map((it, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-black/70">
                        <span className="truncate flex-1 mr-2">
                          {it.productName} (x{it.quantity || 1}{it.size ? `, ${it.size}` : ''})
                        </span>
                        <span className="font-semibold text-black">₹{((it.price || 0) * (it.quantity || 1)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {order.shippingAddress && (
                    <p className="text-[11px] text-black/60 bg-stone-50 p-2.5 rounded-xl">
                      <span className="font-bold text-black">Address: </span> {order.shippingAddress}
                    </p>
                  )}

                  {/* Status controller */}
                  <div className="pt-2 flex items-center justify-between border-t border-black/5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">Status:</span>
                    <select
                      value={order.status}
                      disabled={updatingOrderId === order.id}
                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                      className="bg-stone-100 text-black text-xs font-bold rounded-xl px-3 py-1.5 border border-black/10 focus:ring-1 focus:ring-black outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(isAddingProduct || editingProduct) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase tracking-widest">
                  {editingProduct ? 'Edit Product' : 'New Product'}
                </h2>
                <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="p-2 bg-stone-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block ml-1">Product Name</label>
                  <input
                    type="text"
                    value={editingProduct ? editingProduct.name : newProduct.name}
                    onChange={(e) => editingProduct ? setEditingProduct({ ...editingProduct, name: e.target.value }) : setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-stone-100 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black"
                    placeholder="e.g. Classic Leather Loafers"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block ml-1">Price (₹)</label>
                    <input
                      type="number"
                      value={editingProduct ? editingProduct.price : newProduct.price}
                      onChange={(e) => editingProduct ? setEditingProduct({ ...editingProduct, price: Number(e.target.value) }) : setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      className="w-full bg-stone-100 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block ml-1">Stock Count</label>
                    <input
                      type="number"
                      value={editingProduct ? editingProduct.stockCount : newProduct.stockCount}
                      onChange={(e) => editingProduct ? setEditingProduct({ ...editingProduct, stockCount: Number(e.target.value) }) : setNewProduct({ ...newProduct, stockCount: Number(e.target.value) })}
                      className="w-full bg-stone-100 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block ml-1">Category</label>
                  <select
                    value={editingProduct ? editingProduct.category : newProduct.category}
                    onChange={(e) => editingProduct ? setEditingProduct({ ...editingProduct, category: e.target.value }) : setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-stone-100 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block ml-1">Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingProduct ? editingProduct.imageUrl : newProduct.imageUrl}
                      onChange={(e) => editingProduct ? setEditingProduct({ ...editingProduct, imageUrl: e.target.value }) : setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                      className="flex-1 bg-stone-100 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black"
                      placeholder="https://images.unsplash.com/..."
                    />
                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-black/5">
                      {(editingProduct?.imageUrl || newProduct.imageUrl) ? (
                        <img src={editingProduct?.imageUrl || newProduct.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-black/20" />
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block ml-1">Description</label>
                  <textarea
                    value={editingProduct ? editingProduct.description : newProduct.description}
                    onChange={(e) => editingProduct ? setEditingProduct({ ...editingProduct, description: e.target.value }) : setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full bg-stone-100 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black h-24"
                    placeholder="Describe the product features, material, etc."
                  />
                </div>

                <button
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                  className="w-full bg-black text-white p-4 rounded-xl font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isSendingNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase tracking-widest">Send Notification</h2>
                <button onClick={() => setIsSendingNotification(false)} className="p-2 bg-stone-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Notification Title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  className="w-full bg-stone-100 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black"
                />
                <textarea
                  placeholder="Message Body"
                  value={newNotification.body}
                  onChange={(e) => setNewNotification({ ...newNotification, body: e.target.value })}
                  className="w-full bg-stone-100 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black h-24"
                />
                <button
                  onClick={handleSendNotification}
                  className="w-full bg-black text-white p-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Bell size={20} />
                  Broadcast Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isUpdatingStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase tracking-widest">Daily Stock Update</h2>
                <button onClick={() => setIsUpdatingStock(false)} className="p-2 bg-stone-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <textarea
                  placeholder="e.g. New arrivals in Men's Formal collection! Limited stock available."
                  value={newStockUpdate}
                  onChange={(e) => setNewStockUpdate(e.target.value)}
                  className="w-full bg-stone-100 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-black h-32"
                />
                <button
                  onClick={handleAddStockUpdate}
                  className="w-full bg-black text-white p-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  Post Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
