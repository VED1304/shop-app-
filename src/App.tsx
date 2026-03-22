import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  MessageCircle, 
  Users, 
  ChevronRight, 
  LogOut, 
  ShoppingBag, 
  Bell, 
  Info,
  ArrowRight,
  Search,
  Filter,
  X
} from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit,
  doc,
  setDoc,
  getDoc,
  handleFirestoreError,
  OperationType
} from './firebase';
import { User, Product, StockUpdate, Notification } from './types';
import { SHOP_NAME, SHOP_STORY, WHATSAPP_GROUP_LINK, SHOP_PHONE, CATEGORIES } from './constants';
import BottomNav from './components/BottomNav';
import ProductCard from './components/ProductCard';
import ChatBot from './components/ChatBot';
import AdminDashboard from './components/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const isAdminEmail = firebaseUser.email === 'jigneshmochi77@gmail.com';
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            if (isAdminEmail && userData.role !== 'admin') {
              const updatedUser = { ...userData, role: 'admin' as const };
              await setDoc(doc(db, 'users', firebaseUser.uid), updatedUser);
              setUser(updatedUser);
            } else {
              setUser(userData);
            }
          } else {
            const newUser: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: isAdminEmail ? 'admin' : 'customer'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const qStock = query(collection(db, 'stock_updates'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeStock = onSnapshot(qStock, (snapshot) => {
      setStockUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockUpdate)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stock_updates'));

    const qNotifications = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeNotifications = onSnapshot(qNotifications, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    return () => {
      unsubscribeProducts();
      unsubscribeStock();
      unsubscribeNotifications();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('home');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Swami Footwear</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-50 p-8">
        <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
          <span className="text-white text-5xl font-black">S</span>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-center mb-2">{SHOP_NAME}</h1>
        <p className="text-black/40 text-sm font-bold uppercase tracking-widest text-center mb-12">Premium Footwear Experience</p>
        
        <button
          onClick={handleLogin}
          className="w-full bg-black text-white p-5 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5 invert" alt="Google" />
          Continue with Google
        </button>
        
        <p className="mt-8 text-[10px] text-black/30 font-bold uppercase tracking-widest text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    );
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    // Default 'newest'
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-black pb-20">
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 space-y-8"
          >
            <header className="flex justify-between items-center pt-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Welcome back,</p>
                <h1 className="text-2xl font-black uppercase tracking-tighter">{user.name.split(' ')[0]}</h1>
              </div>
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-black">S</span>
              </div>
            </header>

            {/* Banner */}
            <section className="relative h-48 rounded-3xl overflow-hidden shadow-2xl group">
              <img 
                src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1000" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                alt="Banner"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">New Arrival</span>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">The Urban Collection</h2>
                <p className="text-white/60 text-xs mt-2 font-medium">Step into the future of comfort.</p>
              </div>
            </section>

            {/* Stock Updates */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black uppercase tracking-widest">Daily Stock Updates</h2>
                <Bell size={16} className="text-black/20" />
              </div>
              <div className="space-y-3">
                {stockUpdates.length > 0 ? stockUpdates.map((update) => (
                  <div key={update.id} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
                    <p className="text-xs font-medium leading-relaxed">{update.message}</p>
                    <p className="text-[10px] text-black/30 mt-2 font-bold uppercase tracking-widest">
                      {new Date(update.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )) : (
                  <div className="bg-white p-4 rounded-2xl border border-black/5 text-center py-8">
                    <p className="text-xs text-black/30 font-bold uppercase tracking-widest">No updates today</p>
                  </div>
                )}
              </div>
            </section>

            {/* About Us */}
            <section className="bg-black text-white rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Info size={20} className="text-white/40" />
                <h2 className="text-sm font-black uppercase tracking-widest">Our Story</h2>
              </div>
              <p className="text-sm text-white/60 leading-relaxed italic">"{SHOP_STORY}"</p>
              <button className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest group">
                Learn More <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </section>

            {/* Quick Contact */}
            <section className="grid grid-cols-2 gap-4">
              <a 
                href={`tel:${SHOP_PHONE}`}
                className="bg-white border border-black/10 p-5 rounded-2xl flex flex-col items-center gap-3 shadow-sm active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                  <Phone size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Call Shop</span>
              </a>
              <a 
                href={WHATSAPP_GROUP_LINK}
                target="_blank"
                rel="noreferrer"
                className="bg-white border border-black/10 p-5 rounded-2xl flex flex-col items-center gap-3 shadow-sm active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                  <Users size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Join Group</span>
              </a>
            </section>
          </motion.div>
        )}

        {activeTab === 'products' && (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 space-y-6"
          >
            <header className="pt-4">
              <h1 className="text-3xl font-black uppercase tracking-tighter">The Catalog</h1>
              <p className="text-black/40 text-[10px] font-bold uppercase tracking-widest">Premium Selection</p>
            </header>

            {/* Search & Filter */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                <input 
                  type="text" 
                  placeholder="Search footwear..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-black/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black transition-all"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
                  <button 
                    onClick={() => setSelectedCategory('All')}
                    className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                      selectedCategory === 'All' ? 'bg-black text-white shadow-lg' : 'bg-white border border-black/10 text-black/40'
                    }`}
                  >
                    All
                  </button>
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                        selectedCategory === cat ? 'bg-black text-white shadow-lg' : 'bg-white border border-black/10 text-black/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="shrink-0 pb-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border border-black/10 text-black rounded-full py-2 px-4 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-black outline-none cursor-pointer"
                  >
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Alphabetical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id}>
                  <ProductCard 
                    product={product} 
                    onClick={setSelectedProduct} 
                  />
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <ShoppingBag size={48} className="mx-auto text-black/10 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest text-black/30">No products found</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[calc(100vh-80px)]"
          >
            <header className="p-4 bg-white border-b border-black/5">
              <h1 className="text-xl font-black uppercase tracking-widest">AI Assistant</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Powered by Gemini</p>
            </header>
            <ChatBot products={products} />
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="p-4 space-y-8"
          >
            <header className="pt-8 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white text-4xl font-black mb-4 shadow-2xl border-4 border-white">
                {user.name.charAt(0)}
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">{user.name}</h1>
              <p className="text-black/40 text-[10px] font-bold uppercase tracking-widest">{user.email}</p>
              <div className="mt-4 px-4 py-1 bg-black text-white rounded-full text-[8px] font-black uppercase tracking-[0.2em]">
                {user.role} Account
              </div>
            </header>

            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-6">
                <div className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-stone-100 rounded-2xl flex items-center justify-center">
                      <ShoppingBag size={18} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">My Orders</span>
                  </div>
                  <ChevronRight size={16} className="text-black/20 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-stone-100 rounded-2xl flex items-center justify-center">
                      <Bell size={18} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Notifications</span>
                  </div>
                  <ChevronRight size={16} className="text-black/20 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-stone-100 rounded-2xl flex items-center justify-center">
                      <MessageCircle size={18} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Support Chat</span>
                  </div>
                  <ChevronRight size={16} className="text-black/20 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full bg-stone-100 text-red-500 p-5 rounded-3xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'admin' && user.role === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdminDashboard 
              products={products} 
              stockUpdates={stockUpdates} 
              notifications={notifications} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg rounded-t-[3rem] overflow-hidden max-h-[95vh] flex flex-col"
            >
              <div className="relative h-96 shrink-0">
                <img 
                  src={selectedProduct.imageUrl} 
                  className="w-full h-full object-cover" 
                  alt={selectedProduct.name}
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 flex-1 overflow-y-auto space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 mb-2">{selectedProduct.category}</p>
                  <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{selectedProduct.name}</h2>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-3xl font-black">₹{selectedProduct.price.toLocaleString()}</p>
                    <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      selectedProduct.stockCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedProduct.stockCount > 0 ? `${selectedProduct.stockCount} In Stock` : 'Out of Stock'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-black/40">Description</h3>
                  <p className="text-sm text-black/60 leading-relaxed">
                    {selectedProduct.description || "No description available for this premium footwear."}
                  </p>
                </div>

                <div className="pt-4 space-y-4">
                  <a 
                    href={`https://wa.me/${SHOP_PHONE.replace('+', '')}?text=Hi, I'm interested in ${selectedProduct.name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-black text-white p-5 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform"
                  >
                    <MessageCircle size={20} />
                    Inquire via WhatsApp
                  </a>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="w-full bg-stone-100 text-black p-5 rounded-2xl font-bold uppercase tracking-widest active:scale-95 transition-transform"
                  >
                    Back to Shop
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isAdmin={user.role === 'admin'} 
      />
    </div>
  );
}
