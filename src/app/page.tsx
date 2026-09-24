'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import {
  Search,
  ShoppingCart,
  Banknote,
  QrCode,
  IndianRupee,
  RefreshCw,
  Plus,
  Trash2,
  Layers,
  Activity,
  CheckCircle2,
  Lock,
  LogOut,
  Mail,
  ChevronDown,
  Calendar,
  MessageCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  PackageCheck
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Authentic Premium Medical Plus Logo
function MedicalLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-14 h-14 rounded-2xl' : size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-11 h-11 rounded-xl';
  const iconDim = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className={`${dim} bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/25 ring-2 ring-rose-100/80 shrink-0 transition-transform hover:scale-105 duration-200`}>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={iconDim}
      >
        <path d="M19 10.5h-5.5V5a1.5 1.5 0 0 0-3 0v5.5H5a1.5 1.5 0 0 0 0 3h5.5V19a1.5 1.5 0 0 0 3 0v-5.5H19a1.5 1.5 0 0 0 0-3z" />
      </svg>
    </div>
  );
}

interface Medicine {
  id: string;
  name: string;
  batch_no: string;
  expiry_date: string;
  mrp: number;
  selling_price: number;
  stock_qty: number;
}

interface CartItem extends Medicine {
  qty: number;
}

interface Invoice {
  id: string;
  bill_no: string;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  payment_mode: string;
  cash_paid: number;
  upi_paid: number;
  created_at: string;
}

interface SalesSummary {
  totalSales: number;
  totalCash: number;
  totalUpi: number;
  billCount: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PrasadMedicalApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const desktopProfileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);

  // Time Filter States
  const now = new Date();
  const [filterMode, setFilterMode] = useState<'today' | 'monthly'>('today');
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Auth Inputs
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard Tabs & States
  const [activeTab, setActiveTab] = useState<'pos' | 'stock'>('pos');
  const [summary, setSummary] = useState<SalesSummary>({
    totalSales: 0,
    totalCash: 0,
    totalUpi: 0,
    billCount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  // Inventory & Cart
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer & Payment
  const [directAmount, setDirectAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH' | 'SPLIT'>('UPI');
  const [cashAmount, setCashAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Simplified Add Medicine Form
  const [newMed, setNewMed] = useState({
    name: '',
    selling_price: '',
    stock_qty: '',
    batch_no: '',
    expiry_date: '',
    purchase_price: '',
    mrp: '',
  });

  // Session check
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
      setCheckingAuth(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close profile on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideDesktop = desktopProfileRef.current && desktopProfileRef.current.contains(target);
      const clickedInsideMobile = mobileProfileRef.current && mobileProfileRef.current.contains(target);

      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch summary & history based on filter
  const loadData = async () => {
    setLoading(true);

    let startDate: Date;
    let endDate: Date;

    if (filterMode === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
      endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    }

    const { data: salesData } = await supabase
      .from('sales')
      .select('id, bill_no, customer_name, customer_phone, total_amount, payment_mode, cash_paid, upi_paid, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (salesData) {
      let salesSum = 0;
      let cashSum = 0;
      let upiSum = 0;
      salesData.forEach((s) => {
        salesSum += Number(s.total_amount) || 0;
        cashSum += Number(s.cash_paid) || 0;
        upiSum += Number(s.upi_paid) || 0;
      });

      setSummary({
        totalSales: salesSum,
        totalCash: cashSum,
        totalUpi: upiSum,
        billCount: salesData.length,
      });

      setRecentInvoices(salesData.slice(0, 25));
    }

    // Load inventory
    const { data: medData } = await supabase
      .from('medicines')
      .select('*')
      .order('name', { ascending: true });

    if (medData) {
      setInventory(medData);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, filterMode, selectedMonth, selectedYear]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });

    setAuthLoading(false);
    if (error) {
      setAuthError('Invalid credentials. Please verify your email and password.');
    } else {
      setCurrentUser(data.user);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setIsProfileOpen(false);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    }
    setCurrentUser(null);
    setCart([]);
  };

  // Cart operations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.selling_price * item.qty, 0);
  const finalPayable = cart.length > 0 ? cartSubtotal : (parseFloat(directAmount) || 0);

  const addToCart = (med: Medicine) => {
    const existing = cart.find((i) => i.id === med.id);
    if (existing) {
      if (existing.qty >= med.stock_qty) {
        alert('Stock limit reached for this medicine.');
        return;
      }
      setCart(cart.map((i) => (i.id === med.id ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setCart([...cart, { ...med, qty: 1 }]);
    }
    setSearchQuery('');
  };

  const updateCartQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((i) => i.id !== id));
      return;
    }
    setCart(cart.map((i) => (i.id === id ? { ...i, qty } : i)));
  };

  const removeCartItem = (id: string) => {
    setCart(cart.filter((i) => i.id !== id));
  };

  // Checkout Bill
  const handleFinalCheckout = async () => {
    if (finalPayable <= 0) {
      return alert('Please enter a valid bill amount or add medicines to cart.');
    }

    setSubmitting(true);

    let finalCash = 0;
    let finalUpi = 0;

    if (paymentMode === 'CASH') finalCash = finalPayable;
    else if (paymentMode === 'UPI') finalUpi = finalPayable;
    else {
      finalCash = parseFloat(cashAmount) || 0;
      finalUpi = parseFloat(upiAmount) || 0;
      if (Math.round((finalCash + finalUpi) * 100) / 100 !== Math.round(finalPayable * 100) / 100) {
        setSubmitting(false);
        return alert(`Split payment error: Cash (₹${finalCash}) + UPI (₹${finalUpi}) must equal total (₹${finalPayable}).`);
      }
    }

    const billNo = `PM-${Date.now().toString().slice(-6)}`;

    const { data: saleData, error: saleErr } = await supabase
      .from('sales')
      .insert([
        {
          bill_no: billNo,
          customer_name: customerName.trim() || 'Walk-in Customer',
          customer_phone: customerPhone.trim() || null,
          subtotal: finalPayable,
          total_amount: finalPayable,
          payment_mode: paymentMode,
          cash_paid: finalCash,
          upi_paid: finalUpi,
        },
      ])
      .select()
      .single();

    if (saleErr || !saleData) {
      alert('Error creating invoice: ' + saleErr?.message);
      setSubmitting(false);
      return;
    }

    if (cart.length > 0) {
      const lineItems = cart.map((item) => ({
        sale_id: saleData.id,
        medicine_id: item.id,
        medicine_name: item.name,
        quantity: item.qty,
        unit_price: item.selling_price,
        total_price: item.selling_price * item.qty,
      }));

      await supabase.from('sale_items').insert(lineItems);
    }

    setCart([]);
    setDirectAmount('');
    setCustomerName('');
    setCustomerPhone('');
    setCashAmount('');
    setUpiAmount('');
    setSubmitting(false);
    loadData();

    alert(`✅ Invoice ${billNo} generated successfully.`);
  };

  // WhatsApp Slip Generator
  const sendWhatsAppSlip = (inv: Invoice) => {
    const phone = inv.customer_phone ? inv.customer_phone.replace(/\D/g, '') : '';
    const textMsg = encodeURIComponent(
      `*PRASAD MEDICAL - INVOICE*\n` +
      `Bill No: ${inv.bill_no}\n` +
      `Date: ${new Date(inv.created_at).toLocaleDateString('en-IN')}\n` +
      `Customer: ${inv.customer_name}\n` +
      `-----------------------------\n` +
      `Total Amount: ₹${Number(inv.total_amount).toFixed(2)}\n` +
      `Payment Mode: ${inv.payment_mode}\n` +
      `-----------------------------\n` +
      `Thank you for your visit! Get well soon.\n*Prasad Medical Store*\nJaiswal Market, Main Road Kathara`
    );

    const url = phone.length >= 10
      ? `https://api.whatsapp.com/send?phone=91${phone.slice(-10)}&text=${textMsg}`
      : `https://api.whatsapp.com/send?text=${textMsg}`;

    window.open(url, '_blank');
  };

  // Add Medicine
  const handleAddNewMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const price = parseFloat(newMed.selling_price);
    const qty = parseInt(newMed.stock_qty, 10);

    const { error } = await supabase.from('medicines').insert([
      {
        name: newMed.name.trim(),
        selling_price: price,
        stock_qty: qty,
        batch_no: newMed.batch_no.trim() || 'BATCH-' + Math.floor(1000 + Math.random() * 9000),
        expiry_date: newMed.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        purchase_price: newMed.purchase_price ? parseFloat(newMed.purchase_price) : price * 0.8,
        mrp: newMed.mrp ? parseFloat(newMed.mrp) : price,
      },
    ]);

    setSubmitting(false);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      setNewMed({
        name: '',
        selling_price: '',
        stock_qty: '',
        batch_no: '',
        expiry_date: '',
        purchase_price: '',
        mrp: '',
      });
      loadData();
      alert('✅ Item added to inventory successfully.');
    }
  };

  const filteredMedicines = inventory.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.batch_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
        <MedicalLogo size="md" />
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 tracking-wide uppercase">
          <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
          <span>Securing Terminal...</span>
        </div>
      </div>
    );
  }

  // 1. ULTRA PREMIUM LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50/70 via-slate-50 to-slate-100 flex flex-col justify-center items-center p-4 selection:bg-rose-500 selection:text-white">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/60 p-7 sm:p-9 space-y-7 relative overflow-hidden">
          {/* Subtle Ambient Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500"></div>

          <div className="text-center space-y-3">
            <div className="flex justify-center pt-1">
              <MedicalLogo size="lg" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">PRASAD MEDICAL</h1>
              <p className="text-xs font-semibold text-rose-600/90 tracking-wide uppercase mt-0.5">Clinical Terminal Gateway</p>
            </div>
            <p className="text-2xs text-slate-400 font-medium">Jaiswal Market, Main Road Kathara</p>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2 shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></div>
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4.5">
            <div>
              <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Authorized Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-200 pl-10 pr-3.5 py-3 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-200 pl-10 pr-3.5 py-3 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 touch-manipulation active:scale-[0.99] border-t border-rose-400/30 cursor-pointer"
            >
              {authLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                'Secure Counter Sign In'
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-3xs text-slate-400 font-semibold tracking-wider uppercase">
            <span>Enterprise Pharmacy Suite</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Encrypted POS
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. ULTRA PREMIUM POS DASHBOARD
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans antialiased selection:bg-rose-500 selection:text-white">
      {/* Top Clinical Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MedicalLogo size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">PRASAD MEDICAL</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs sm:text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                    Terminal Live
                  </span>
                </div>
                <p className="text-2xs text-slate-400 font-medium truncate max-w-[210px] sm:max-w-none flex items-center gap-1.5">
                  <span>Jaiswal Market, Main Road Kathara</span>
                </p>
              </div>
            </div>

            {/* Mobile Header Icons: Direct Logout + Avatar */}
            <div className="md:hidden flex items-center gap-1.5" ref={mobileProfileRef}>
              <button
                onClick={handleLogout}
                title="Direct Logout"
                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all border border-rose-200 active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center font-black text-xs uppercase shadow-xs">
                  {currentUser.email ? currentUser.email.charAt(0) : 'P'}
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-3 top-14 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                      {currentUser.email ? currentUser.email.charAt(0) : 'P'}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.email}</p>
                      <span className="text-3xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">Store Admin</span>
                    </div>
                  </div>

                  <div className="pt-2.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out Portal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 justify-between md:justify-end overflow-x-auto pb-0.5 md:pb-0">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setActiveTab('pos')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 touch-manipulation cursor-pointer ${
                  activeTab === 'pos'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5 text-rose-600" /> POS Counter
              </button>
              <button
                onClick={() => setActiveTab('stock')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 touch-manipulation cursor-pointer ${
                  activeTab === 'stock'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-rose-600" /> Inventory ({inventory.length})
              </button>
            </div>

            <button
              onClick={loadData}
              title="Refresh Analytics"
              className="p-2 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs shrink-0 active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : ''}`} />
            </button>

            {/* Desktop User Avatar & Direct Logout */}
            <div className="hidden md:flex items-center gap-2 ml-1" ref={desktopProfileRef}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition-all border border-slate-200 shadow-2xs cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {currentUser.email ? currentUser.email.charAt(0) : 'P'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                        {currentUser.email ? currentUser.email.charAt(0) : 'P'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.email}</p>
                        <span className="text-3xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">Store Admin</span>
                      </div>
                    </div>

                    <div className="pt-2.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out Portal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out Portal"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50/80 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 py-5 sm:py-7 space-y-5 sm:space-y-6">
        
        {/* Dynamic Period Selector - Premium Frosted Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 tracking-tight">
              <Calendar className="w-4 h-4 text-rose-600" /> Financial Settlement Engine
            </h2>
            <p className="text-2xs sm:text-xs text-slate-400 font-medium">
              {filterMode === 'today'
                ? "Live real-time counter sales and settlement ledger"
                : `Audited records for ${MONTHS[selectedMonth]} ${selectedYear}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-slate-100/80 border border-slate-200/80 rounded-xl p-1 w-full sm:w-auto shadow-2xs">
              <button
                onClick={() => setFilterMode('today')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  filterMode === 'today'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilterMode('monthly')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  filterMode === 'monthly'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Select Month
              </button>
            </div>

            {filterMode === 'monthly' && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto animate-in fade-in duration-200">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="flex-1 sm:flex-initial bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-600 shadow-2xs cursor-pointer"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-600 shadow-2xs cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Metric Cards - Modern Financial Studio Layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4.5">
          {/* Card 1: Revenue */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-3xs sm:text-2xs font-bold uppercase tracking-wider text-slate-400">
                {filterMode === 'today' ? 'Revenue (Today)' : `Revenue (${MONTHS[selectedMonth].slice(0, 3)})`}
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 shadow-2xs">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2.5xl font-black text-slate-900 tracking-tight truncate">₹{summary.totalSales.toLocaleString('en-IN')}</div>
            <div className="flex items-center gap-1.5 mt-1.5 text-3xs sm:text-2xs text-slate-500 font-semibold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              <span className="truncate">{summary.billCount} Invoices generated</span>
            </div>
          </div>

          {/* Card 2: Physical Cash */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-3xs sm:text-2xs font-bold uppercase tracking-wider text-slate-400">Cash Drawer</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2.5xl font-black text-emerald-600 tracking-tight truncate">₹{summary.totalCash.toLocaleString('en-IN')}</div>
            <div className="flex items-center gap-1.5 mt-1.5 text-3xs sm:text-2xs text-slate-500 font-semibold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="truncate">Drawer balance</span>
            </div>
          </div>

          {/* Card 3: Online QR / UPI */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-3xs sm:text-2xs font-bold uppercase tracking-wider text-slate-400">QR / UPI</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-2xs">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2.5xl font-black text-indigo-600 tracking-tight truncate">₹{summary.totalUpi.toLocaleString('en-IN')}</div>
            <div className="flex items-center gap-1.5 mt-1.5 text-3xs sm:text-2xs text-slate-500 font-semibold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span className="truncate">Direct bank settlement</span>
            </div>
          </div>

          {/* Card 4: Digital Share */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-3xs sm:text-2xs font-bold uppercase tracking-wider text-slate-400">Digital Share</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-2xs">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2.5xl font-black text-slate-900 tracking-tight">
              {summary.totalSales > 0 ? Math.round((summary.totalUpi / summary.totalSales) * 100) : 0}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-amber-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${summary.totalSales > 0 ? (summary.totalUpi / summary.totalSales) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tab 1: Billing Counter (POS) */}
        {activeTab === 'pos' && (
          <div className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              
              {/* Left Column: Search & Current Cart */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Medicine Search Box */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-rose-600" /> Search Catalog
                    </span>
                    <span className="text-3xs sm:text-2xs font-medium text-slate-400">Search medicine or enter manual bill on right</span>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Type medicine name or batch code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 pl-10 pr-4 py-2.5 sm:py-3 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600 transition-all font-medium"
                    />
                  </div>

                  {searchQuery.trim().length > 0 && (
                    <div className="border border-slate-200 rounded-xl max-h-60 overflow-y-auto divide-y divide-slate-100 bg-white shadow-xl shadow-slate-200/50">
                      {filteredMedicines.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 font-medium">No matching medicines found in inventory</div>
                      ) : (
                        filteredMedicines.map((med) => (
                          <div
                            key={med.id}
                            onClick={() => addToCart(med)}
                            className="p-3 sm:p-3.5 flex justify-between items-center hover:bg-rose-50/60 cursor-pointer transition-colors active:bg-rose-100/80"
                          >
                            <div className="pr-2">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">{med.name}</p>
                              <p className="text-3xs sm:text-2xs text-slate-400 mt-0.5">
                                Batch: <span className="font-mono text-slate-600">{med.batch_no}</span> • Stock: <span className="font-bold text-slate-700">{med.stock_qty} pcs</span>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs sm:text-sm font-extrabold text-rose-600">₹{med.selling_price}</span>
                              <span className="block text-3xs text-slate-400 line-through">MRP: ₹{med.mrp}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Cart Box */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                  <div className="px-4.5 py-3.5 border-b border-slate-200/80 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-rose-600" /> Current Invoice Cart
                    </h3>
                    <span className="text-2xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">{cart.length} Items Added</span>
                  </div>

                  {cart.length === 0 ? (
                    <div className="p-8 sm:p-10 text-center bg-slate-50/30">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-2 font-bold shadow-2xs">
                        ₹
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-700">Cart is empty</p>
                      <p className="text-3xs sm:text-2xs text-slate-400 mt-0.5 max-w-xs mx-auto">
                        Search and pick medicines above, or directly enter total amount on right panel.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-50/80 text-3xs sm:text-2xs font-bold uppercase text-slate-400 tracking-wider">
                        <div className="col-span-5">Item</div>
                        <div className="col-span-2 text-center">Rate</div>
                        <div className="col-span-3 text-center">Qty</div>
                        <div className="col-span-2 text-right">Subtotal</div>
                      </div>
                      {cart.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 px-4 py-3 items-center text-xs sm:text-sm hover:bg-slate-50/50 transition-colors">
                          <div className="col-span-5 pr-2">
                            <p className="font-bold text-slate-900 leading-tight truncate">{item.name}</p>
                            <span className="text-3xs text-slate-400 font-mono">B: {item.batch_no}</span>
                          </div>
                          <div className="col-span-2 text-center font-medium text-slate-700">₹{item.selling_price}</div>
                          <div className="col-span-3 flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateCartQty(item.id, item.qty - 1)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs touch-manipulation active:bg-slate-300 transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-slate-900 text-xs sm:text-sm">{item.qty}</span>
                            <button
                              onClick={() => updateCartQty(item.id, item.qty + 1)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs touch-manipulation active:bg-slate-300 transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <div className="col-span-2 text-right flex items-center justify-end gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">₹{(item.selling_price * item.qty).toFixed(0)}</span>
                            <button
                              onClick={() => removeCartItem(item.id)}
                              className="text-slate-300 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Checkout & Payment Terminal */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-rose-600" /> Payment & Billing
                    </h3>
                    <span className="text-3xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200/60">POS Terminal</span>
                  </div>

                  {/* Manual Bill Amount Input (Active when cart is empty) */}
                  {cart.length === 0 && (
                    <div className="p-3.5 bg-rose-50/50 border border-rose-200/70 rounded-xl space-y-1">
                      <label className="text-2xs font-bold text-rose-800 uppercase tracking-wider block">
                        Direct Bill Amount (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={directAmount}
                        onChange={(e) => setDirectAmount(e.target.value)}
                        className="w-full bg-white border border-rose-200 rounded-xl px-3.5 py-2.5 text-xl font-black text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600"
                      />
                      <span className="text-3xs text-slate-400 font-medium block">Medicines select nahi ki hain toh yaha seedhe bill amount dalein</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Customer Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-600 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Mobile No (WhatsApp Slip)</label>
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-600 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="text-2xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['UPI', 'CASH', 'SPLIT'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMode(m)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all touch-manipulation cursor-pointer ${
                            paymentMode === m
                              ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {m === 'UPI' ? 'QR / UPI' : m === 'CASH' ? 'Cash' : 'Split'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMode === 'SPLIT' && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/80 border border-slate-200 rounded-xl">
                      <div>
                        <span className="text-3xs font-bold uppercase text-slate-500 block mb-1">Cash Paid</span>
                        <input
                          type="number"
                          placeholder="₹ Cash"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <span className="text-3xs font-bold uppercase text-slate-500 block mb-1">UPI Paid</span>
                        <input
                          type="number"
                          placeholder="₹ UPI"
                          value={upiAmount}
                          onChange={(e) => setUpiAmount(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Summary Box */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>Subtotal</span>
                      <span>₹{finalPayable.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>Discount</span>
                      <span className="text-emerald-600 font-bold">₹0.00</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-200">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">Net Payable</span>
                      <span className="text-2xl sm:text-2.5xl font-black text-rose-600">₹{finalPayable.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={submitting || finalPayable <= 0}
                    onClick={handleFinalCheckout}
                    className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation active:scale-[0.99] border-t border-rose-400/30 cursor-pointer text-sm"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {submitting ? 'Generating Invoice...' : `Complete Invoice (₹${finalPayable.toFixed(2)})`}
                  </button>
                </div>
              </div>

            </div>

            {/* Invoices Ledger with WhatsApp slips */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-4.5 sm:px-6 py-4 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/40">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 tracking-tight">
                    <Clock className="w-4 h-4 text-rose-600" /> Recent Invoices Ledger
                  </h3>
                  <p className="text-3xs sm:text-2xs text-slate-400 font-medium">
                    {filterMode === 'today' ? "Showing today's counter transactions" : `Invoices for ${MONTHS[selectedMonth]} ${selectedYear}`}
                  </p>
                </div>
                <span className="text-2xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                  {recentInvoices.length} Bills
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-50/80 text-3xs sm:text-2xs uppercase text-slate-400 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Invoice No</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {recentInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 text-xs font-medium">
                          No invoices recorded for this selected time period.
                        </td>
                      </tr>
                    ) : (
                      recentInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-2xs sm:text-xs text-slate-700">{inv.bill_no}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900 leading-tight truncate max-w-[140px] sm:max-w-none">{inv.customer_name}</p>
                            <span className="text-3xs text-slate-400">{inv.customer_phone || 'Walk-in'}</span>
                          </td>
                          <td className="py-3 px-4 text-3xs sm:text-xs text-slate-500 font-medium">
                            {new Date(inv.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-3xs sm:text-2xs font-extrabold ${
                                inv.payment_mode === 'UPI'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : inv.payment_mode === 'CASH'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {inv.payment_mode}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900">₹{Number(inv.total_amount).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => sendWhatsAppSlip(inv)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-2xs sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs touch-manipulation active:scale-95 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WhatsApp
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Stock Management */}
        {activeTab === 'stock' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            
            <div className="lg:col-span-4">
              <form onSubmit={handleAddNewMedicine} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 lg:sticky lg:top-24">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5 tracking-tight">
                    <Plus className="w-4 h-4 text-rose-600" /> New Inventory Entry
                  </h3>
                  <p className="text-3xs sm:text-2xs text-slate-400 mt-0.5">Only Name, Selling Rate & Stock are required</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-2xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Medicine Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paracetamol 650mg"
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-600 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-2xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Selling Rate (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="28"
                        value={newMed.selling_price}
                        onChange={(e) => setNewMed({ ...newMed, selling_price: e.target.value })}
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-rose-600 focus:outline-none focus:border-rose-600"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Stock Units <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="100"
                        value={newMed.stock_qty}
                        onChange={(e) => setNewMed({ ...newMed, stock_qty: e.target.value })}
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-rose-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block">
                    Optional Details (Auto-generated if empty)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-3xs font-bold uppercase text-slate-500 block mb-1">Batch No</label>
                      <input
                        type="text"
                        placeholder="Auto"
                        value={newMed.batch_no}
                        onChange={(e) => setNewMed({ ...newMed, batch_no: e.target.value })}
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-3xs font-bold uppercase text-slate-500 block mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={newMed.expiry_date}
                        onChange={(e) => setNewMed({ ...newMed, expiry_date: e.target.value })}
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-3xs font-bold uppercase text-slate-500 block mb-1">Purchase (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Auto"
                        value={newMed.purchase_price}
                        onChange={(e) => setNewMed({ ...newMed, purchase_price: e.target.value })}
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-3xs font-bold uppercase text-slate-500 block mb-1">MRP (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Auto"
                        value={newMed.mrp}
                        onChange={(e) => setNewMed({ ...newMed, mrp: e.target.value })}
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-rose-600/25 touch-manipulation active:scale-[0.99] cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Add Item to Inventory'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/40">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">Pharmacy Stock Directory</h3>
                <span className="text-2xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">Total Items: {inventory.length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-50/80 text-3xs sm:text-2xs uppercase text-slate-400 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4">Expiry</th>
                      <th className="py-3 px-4">Selling Rate</th>
                      <th className="py-3 px-4 text-right">Available Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {inventory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400 text-xs font-medium">
                          No inventory items registered. Use the form to add items.
                        </td>
                      </tr>
                    ) : (
                      inventory.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                          <td className="py-3 px-4 text-3xs sm:text-xs font-mono text-slate-500">{m.batch_no}</td>
                          <td className="py-3 px-4 text-3xs sm:text-xs text-slate-600 font-medium">{m.expiry_date}</td>
                          <td className="py-3 px-4 font-black text-rose-600">₹{m.selling_price}</td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-3xs sm:text-xs font-bold ${
                                m.stock_qty <= 10
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {m.stock_qty} pcs
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}