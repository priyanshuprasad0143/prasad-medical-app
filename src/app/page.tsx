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
  BarChart3,
  Award,
  BookOpen,
  UserCheck,
  AlertCircle,
  X,
  RotateCcw
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
      <svg viewBox="0 0 24 24" fill="currentColor" className={iconDim}>
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
  due_amount?: number;
  notes?: string;
  is_settled?: boolean;
  created_at: string;
}

interface SalesSummary {
  totalSales: number;
  totalCash: number;
  totalUpi: number;
  totalDue: number;
  billCount: number;
}

interface DailyChartItem {
  day: number;
  dateStr: string;
  total: number;
  cash: number;
  upi: number;
  count: number;
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

  // Tabs: 'pos' | 'stock' | 'credit'
  const [activeTab, setActiveTab] = useState<'pos' | 'stock' | 'credit'>('pos');

  // Time Filter States: 'today' | 'date' | 'monthly'
  const now = new Date();
  const [filterMode, setFilterMode] = useState<'today' | 'date' | 'monthly'>('today');
  const [selectedSingleDate, setSelectedSingleDate] = useState<string>(now.toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Chart states
  const [monthlyChartData, setMonthlyChartData] = useState<DailyChartItem[]>([]);
  const [activeHoverBar, setActiveHoverBar] = useState<DailyChartItem | null>(null);

  // Ledger Search State
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Auth Inputs
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard Data
  const [summary, setSummary] = useState<SalesSummary>({
    totalSales: 0,
    totalCash: 0,
    totalUpi: 0,
    totalDue: 0,
    billCount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [creditInvoices, setCreditInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  // Inventory & Cart
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer & Payment Form
  const [directAmount, setDirectAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH' | 'SPLIT' | 'CREDIT'>('UPI');
  const [cashAmount, setCashAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [paidNowAmount, setPaidNowAmount] = useState('');
  const [creditNotes, setCreditNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Settle Modal States
  const [settleInvoice, setSettleInvoice] = useState<Invoice | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settlePaymentMode, setSettlePaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [settleLoading, setSettleLoading] = useState(false);

  // Return / Refund Modal States
  const [returnInvoice, setReturnInvoice] = useState<Invoice | null>(null);
  const [returnAmount, setReturnAmount] = useState('');
  const [returnMode, setReturnMode] = useState<'DEDUCT_DUE' | 'REFUND_CASH' | 'REFUND_UPI'>('REFUND_CASH');
  const [returnReason, setReturnReason] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  // Add Medicine Form
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

  // Fetch summary, history & chart data
  const loadData = async () => {
    setLoading(true);

    let startDate: Date;
    let endDate: Date;

    if (filterMode === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (filterMode === 'date') {
      const [y, m, d] = selectedSingleDate.split('-').map(Number);
      startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
      endDate = new Date(y, m - 1, d, 23, 59, 59, 999);
    } else {
      startDate = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
      endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    }

    const { data: salesData } = await supabase
      .from('sales')
      .select('id, bill_no, customer_name, customer_phone, total_amount, payment_mode, cash_paid, upi_paid, due_amount, notes, is_settled, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    // Fetch All Pending Credits for Credit Ledger
    const { data: allCredits } = await supabase
      .from('sales')
      .select('*')
      .gt('due_amount', 0)
      .eq('is_settled', false)
      .order('created_at', { ascending: false });

    if (allCredits) {
      setCreditInvoices(allCredits);
    }

    if (salesData) {
      let salesSum = 0;
      let cashSum = 0;
      let upiSum = 0;
      let dueSum = 0;

      salesData.forEach((s) => {
        salesSum += Number(s.total_amount) || 0;
        cashSum += Number(s.cash_paid) || 0;
        upiSum += Number(s.upi_paid) || 0;
        dueSum += Number(s.due_amount) || 0;
      });

      setSummary({
        totalSales: salesSum,
        totalCash: cashSum,
        totalUpi: upiSum,
        totalDue: dueSum,
        billCount: salesData.length,
      });

      setRecentInvoices(salesData);

      // Calculate Daily Chart (Always calculates for the target month)
      const chartYear = filterMode === 'monthly' ? selectedYear : startDate.getFullYear();
      const chartMonth = filterMode === 'monthly' ? selectedMonth : startDate.getMonth();
      const daysInCurrentMonth = new Date(chartYear, chartMonth + 1, 0).getDate();
      
      const dailyMap: { [key: number]: { total: number; cash: number; upi: number; count: number } } = {};
      for (let d = 1; d <= daysInCurrentMonth; d++) {
        dailyMap[d] = { total: 0, cash: 0, upi: 0, count: 0 };
      }

      salesData.forEach((s) => {
        const itemDate = new Date(s.created_at);
        const day = itemDate.getDate();
        if (dailyMap[day]) {
          dailyMap[day].total += Number(s.total_amount) || 0;
          dailyMap[day].cash += Number(s.cash_paid) || 0;
          dailyMap[day].upi += Number(s.upi_paid) || 0;
          dailyMap[day].count += 1;
        }
      });

      const chartList: DailyChartItem[] = [];
      for (let d = 1; d <= daysInCurrentMonth; d++) {
        chartList.push({
          day: d,
          dateStr: `${d} ${MONTHS[chartMonth].slice(0, 3)}`,
          total: dailyMap[d].total,
          cash: dailyMap[d].cash,
          upi: dailyMap[d].upi,
          count: dailyMap[d].count,
        });
      }

      setMonthlyChartData(chartList);
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
  }, [currentUser, filterMode, selectedSingleDate, selectedMonth, selectedYear]);

  // Auth Handlers
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

  // Credit / Due Calculation
  const upfrontPaid = paymentMode === 'CREDIT' ? (parseFloat(paidNowAmount) || 0) : finalPayable;
  const calculatedDue = paymentMode === 'CREDIT' ? Math.max(0, finalPayable - upfrontPaid) : 0;

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

  // Delete / Cancel Invoice Function
  const handleDeleteInvoice = async (invoiceId: string, billNo: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to cancel and delete invoice ${billNo}?`);
    if (!confirmDelete) return;

    await supabase.from('sale_items').delete().eq('sale_id', invoiceId);
    const { error } = await supabase.from('sales').delete().eq('id', invoiceId);

    if (error) {
      alert('Error deleting invoice: ' + error.message);
    } else {
      alert(`Invoice ${billNo} has been deleted successfully.`);
      loadData();
    }
  };

  // Open Settle Modal
  const openSettleModal = (invoice: Invoice) => {
    setSettleInvoice(invoice);
    setSettleAmount(String(invoice.due_amount || ''));
    setSettlePaymentMode('CASH');
  };

  // Execute Partial or Full Settle
  const handleExecuteSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleInvoice) return;

    const amountToPay = parseFloat(settleAmount);
    const currentDue = Number(settleInvoice.due_amount || 0);

    if (isNaN(amountToPay) || amountToPay <= 0) {
      return alert('Please enter a valid payment amount.');
    }
    if (amountToPay > currentDue) {
      return alert(`Payment amount (₹${amountToPay}) cannot be greater than balance due (₹${currentDue}).`);
    }

    setSettleLoading(true);

    const updatedDue = Math.max(0, currentDue - amountToPay);
    const isNowSettled = updatedDue === 0;

    let updatedCash = Number(settleInvoice.cash_paid || 0);
    let updatedUpi = Number(settleInvoice.upi_paid || 0);

    if (settlePaymentMode === 'CASH') {
      updatedCash += amountToPay;
    } else {
      updatedUpi += amountToPay;
    }

    const { error } = await supabase
      .from('sales')
      .update({
        cash_paid: updatedCash,
        upi_paid: updatedUpi,
        due_amount: updatedDue,
        is_settled: isNowSettled,
      })
      .eq('id', settleInvoice.id);

    setSettleLoading(false);

    if (error) {
      alert('Error updating payment: ' + error.message);
    } else {
      alert(
        isNowSettled
          ? `Payment of ₹${amountToPay} recorded. Due balance for ${settleInvoice.customer_name} is now fully cleared.`
          : `Partial payment of ₹${amountToPay} recorded. Remaining balance due: ₹${updatedDue.toFixed(2)}.`
      );
      setSettleInvoice(null);
      loadData();
    }
  };

  // Open Return / Refund Modal
  const openReturnModal = (invoice: Invoice) => {
    setReturnInvoice(invoice);
    setReturnAmount('');
    setReturnReason('');
    const hasDue = Number(invoice.due_amount || 0) > 0;
    setReturnMode(hasDue ? 'DEDUCT_DUE' : 'REFUND_CASH');
  };

  // Execute Medicine Return / Refund
  const handleExecuteReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnInvoice) return;

    const retAmount = parseFloat(returnAmount);
    const currentTotal = Number(returnInvoice.total_amount || 0);
    const currentDue = Number(returnInvoice.due_amount || 0);
    const currentCash = Number(returnInvoice.cash_paid || 0);
    const currentUpi = Number(returnInvoice.upi_paid || 0);

    if (isNaN(retAmount) || retAmount <= 0) {
      return alert('Please enter a valid return / refund amount.');
    }
    if (retAmount > currentTotal) {
      return alert(`Return amount (₹${retAmount}) cannot exceed total invoice amount (₹${currentTotal}).`);
    }

    setReturnLoading(true);

    const newTotal = Math.max(0, currentTotal - retAmount);
    let newDue = currentDue;
    let newCash = currentCash;
    let newUpi = currentUpi;

    if (returnMode === 'DEDUCT_DUE') {
      if (retAmount > currentDue) {
        setReturnLoading(false);
        return alert(`Cannot deduct ₹${retAmount} from due balance of only ₹${currentDue}. Choose Cash/UPI refund for remaining.`);
      }
      newDue = Math.max(0, currentDue - retAmount);
    } else if (returnMode === 'REFUND_CASH') {
      newCash = Math.max(0, currentCash - retAmount);
    } else if (returnMode === 'REFUND_UPI') {
      newUpi = Math.max(0, currentUpi - retAmount);
    }

    const noteAdd = ` [Returned ₹${retAmount}${returnReason ? `: ${returnReason}` : ''}]`;
    const updatedNotes = (returnInvoice.notes || '') + noteAdd;

    const { error } = await supabase
      .from('sales')
      .update({
        total_amount: newTotal,
        subtotal: newTotal,
        cash_paid: newCash,
        upi_paid: newUpi,
        due_amount: newDue,
        is_settled: newDue === 0,
        notes: updatedNotes.trim(),
      })
      .eq('id', returnInvoice.id);

    setReturnLoading(false);

    if (error) {
      alert('Error recording return: ' + error.message);
    } else {
      alert(`✅ Medicine return of ₹${retAmount} successfully processed! Invoice updated.`);
      setReturnInvoice(null);
      loadData();
    }
  };

  // Checkout Bill
  const handleFinalCheckout = async () => {
    if (finalPayable <= 0) {
      return alert('Please enter a valid bill amount or add medicines to cart.');
    }

    if (paymentMode === 'CREDIT') {
      if (!customerName.trim()) {
        return alert('Customer Name is mandatory for credit entries.');
      }
      const cleanPhone = customerPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return alert('A valid 10-digit mobile number is mandatory for credit customer accounts.');
      }
    }

    setSubmitting(true);

    let finalCash = 0;
    let finalUpi = 0;
    let finalDue = 0;

    if (paymentMode === 'CASH') {
      finalCash = finalPayable;
    } else if (paymentMode === 'UPI') {
      finalUpi = finalPayable;
    } else if (paymentMode === 'SPLIT') {
      finalCash = parseFloat(cashAmount) || 0;
      finalUpi = parseFloat(upiAmount) || 0;
      if (Math.round((finalCash + finalUpi) * 100) / 100 !== Math.round(finalPayable * 100) / 100) {
        setSubmitting(false);
        return alert(`Split payment error: Cash (₹${finalCash}) + UPI (₹${finalUpi}) must equal total (₹${finalPayable}).`);
      }
    } else if (paymentMode === 'CREDIT') {
      finalCash = parseFloat(paidNowAmount) || 0;
      finalDue = calculatedDue;
    }

    const billNo = `PM-${Date.now().toString().slice(-6)}`;

    let autoNotes = creditNotes.trim();
    if (cart.length > 0 && !autoNotes) {
      autoNotes = cart.map((i) => `${i.name} (${i.qty}x)`).join(', ');
    }

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
          due_amount: finalDue,
          notes: autoNotes || null,
          is_settled: finalDue === 0,
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
    setPaidNowAmount('');
    setCreditNotes('');
    setSubmitting(false);
    loadData();

    alert(
      paymentMode === 'CREDIT'
        ? `Invoice ${billNo} recorded with credit due of ₹${finalDue.toFixed(2)}.`
        : `Invoice ${billNo} generated successfully.`
    );
  };

  // WhatsApp Slip & Reminder Generator
  const sendWhatsAppSlip = (inv: Invoice, isReminder = false) => {
    const phone = inv.customer_phone ? inv.customer_phone.replace(/\D/g, '') : '';
    
    let textMsg = '';
    if (isReminder || (inv.due_amount && inv.due_amount > 0)) {
      textMsg = encodeURIComponent(
        `*PRASAD MEDICAL - PAYMENT REMINDER*\n` +
        `Bill No: ${inv.bill_no}\n` +
        `Date: ${new Date(inv.created_at).toLocaleDateString('en-IN')}\n` +
        `Customer: ${inv.customer_name}\n` +
        `-----------------------------\n` +
        `Total Bill: ₹${Number(inv.total_amount).toFixed(2)}\n` +
        `Paid Amount: ₹${(Number(inv.cash_paid) + Number(inv.upi_paid)).toFixed(2)}\n` +
        `*Remaining Balance Due: ₹${Number(inv.due_amount).toFixed(2)}*\n` +
        (inv.notes ? `Prescription/Items: ${inv.notes}\n` : '') +
        `-----------------------------\n` +
        `Please clear your pending balance at your earliest convenience.\n*Prasad Medical Store*\nJaiswal Market, Main Road Kathara`
      );
    } else {
      textMsg = encodeURIComponent(
        `*PRASAD MEDICAL - INVOICE*\n` +
        `Bill No: ${inv.bill_no}\n` +
        `Date: ${new Date(inv.created_at).toLocaleDateString('en-IN')}\n` +
        `Customer: ${inv.customer_name}\n` +
        `-----------------------------\n` +
        `Total Amount: ₹${Number(inv.total_amount).toFixed(2)}\n` +
        `Payment Mode: ${inv.payment_mode}\n` +
        (inv.notes ? `Items: ${inv.notes}\n` : '') +
        `-----------------------------\n` +
        `Thank you for your visit! Get well soon.\n*Prasad Medical Store*\nJaiswal Market, Main Road Kathara`
      );
    }

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
      alert('Item added to inventory successfully.');
    }
  };

  const filteredMedicines = inventory.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.batch_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ledger Filter by Search (Bill No, Customer Name, Phone)
  const filteredRecentInvoices = recentInvoices.filter((inv) => {
    const q = ledgerSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      inv.bill_no.toLowerCase().includes(q) ||
      inv.customer_name.toLowerCase().includes(q) ||
      (inv.customer_phone && inv.customer_phone.includes(q))
    );
  });

  // Highest earning day calculation
  const maxDaySales = Math.max(...monthlyChartData.map((d) => d.total), 1);
  const peakDayObj = monthlyChartData.reduce((prev, curr) => (curr.total > prev.total ? curr : prev), {
    day: 0,
    dateStr: '-',
    total: 0,
    cash: 0,
    upi: 0,
    count: 0,
  });

  const daysWithSales = monthlyChartData.filter((d) => d.total > 0).length || 1;
  const averageDailySales = Math.round(summary.totalSales / daysWithSales);
  const totalMarketCredit = creditInvoices.reduce((acc, curr) => acc + (Number(curr.due_amount) || 0), 0);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
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
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl p-7 sm:p-9 space-y-7 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500"></div>

          <div className="text-center space-y-3">
            <div className="flex justify-center pt-1">
              <MedicalLogo size="lg" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">PRASAD MEDICAL</h1>
              <p className="text-xs font-semibold text-rose-600 tracking-wide uppercase mt-0.5">Clinical Terminal Gateway</p>
            </div>
            <p className="text-xs text-slate-400 font-medium">Jaiswal Market, Main Road Kathara</p>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2 shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></div>
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Authorized Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-3.5 py-3 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-3.5 py-3 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600 transition-all font-medium"
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

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold tracking-wider uppercase">
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
    <div className="min-h-screen bg-slate-50/80 text-slate-800 font-sans antialiased selection:bg-rose-500 selection:text-white">
      {/* Top Clinical Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MedicalLogo size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">PRASAD MEDICAL</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                    Terminal Live
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium truncate max-w-[210px] sm:max-w-none flex items-center gap-1.5">
                  <span>Jaiswal Market, Main Road Kathara</span>
                </p>
              </div>
            </div>

            {/* Mobile Header Icons */}
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
                <div className="absolute right-3 top-14 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                      {currentUser.email ? currentUser.email.charAt(0) : 'P'}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.email}</p>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Store Admin</span>
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
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-200">
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
                onClick={() => setActiveTab('credit')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 touch-manipulation cursor-pointer ${
                  activeTab === 'credit'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-600" /> Credit Ledger ({creditInvoices.length})
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
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                        {currentUser.email ? currentUser.email.charAt(0) : 'P'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.email}</p>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Store Admin</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 py-5 sm:py-7 space-y-5 sm:space-y-6">
        
        {/* Dynamic Period Selector: Today, Specific Date, or Month */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 tracking-tight">
              <Calendar className="w-4 h-4 text-rose-600" /> Financial Settlement Engine
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {filterMode === 'today'
                ? "Live real-time counter sales and settlement ledger for today"
                : filterMode === 'date'
                ? `Historical audit records for single date: ${new Date(selectedSingleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                : `Audited records for full month: ${MONTHS[selectedMonth]} ${selectedYear}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 w-full sm:w-auto shadow-2xs">
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
                onClick={() => setFilterMode('date')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  filterMode === 'date'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Specific Date
              </button>
              <button
                onClick={() => setFilterMode('monthly')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  filterMode === 'monthly'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Month
              </button>
            </div>

            {/* Date Picker Input for 'date' mode */}
            {filterMode === 'date' && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto animate-in fade-in duration-200">
                <input
                  type="date"
                  value={selectedSingleDate}
                  onChange={(e) => setSelectedSingleDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-600 shadow-2xs cursor-pointer"
                />
              </div>
            )}

            {/* Month & Year Selectors for 'monthly' mode */}
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
                  className="flex-1 sm:flex-initial bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-600 shadow-2xs cursor-pointer"
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

        {/* 5 Financial Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">₹{summary.totalSales.toLocaleString('en-IN')}</div>
            <p className="text-xs text-slate-500 mt-1 font-semibold">{summary.billCount} Invoices</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cash In Hand</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Banknote className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-600 tracking-tight truncate">₹{summary.totalCash.toLocaleString('en-IN')}</div>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Counter balance</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bank / UPI</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <QrCode className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-indigo-600 tracking-tight truncate">₹{summary.totalUpi.toLocaleString('en-IN')}</div>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Bank credit</p>
          </div>

          <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Market Credit</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-600 tracking-tight truncate">₹{totalMarketCredit.toLocaleString('en-IN')}</div>
            <p className="text-xs text-amber-700 mt-1 font-bold">{creditInvoices.length} Pending accounts</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Digital Share</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
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

        {/* UBER RIDE STYLE MONTHLY INCOME GRAPH CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-2xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    Earnings Analytics <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{MONTHS[selectedMonth]} {selectedYear}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Daily income distribution and high-revenue trends</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-left">
                <span className="text-xs uppercase font-bold text-slate-400 block">Daily Average</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900">₹{averageDailySales.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-left">
                <span className="text-xs uppercase font-bold text-emerald-600 block">Peak Day ({peakDayObj.dateStr})</span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-700">₹{peakDayObj.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Active Hover / Touch Insight Strip */}
          <div className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            {activeHoverBar ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                  <span className="font-bold text-slate-800">{activeHoverBar.dateStr}:</span>
                  <span className="font-black text-rose-600 text-sm">₹{activeHoverBar.total.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-medium">({activeHoverBar.count} orders)</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Cash: ₹{activeHoverBar.cash.toFixed(0)}</span>
                  <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">UPI: ₹{activeHoverBar.upi.toFixed(0)}</span>
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Hover or tap on any bar to inspect daily revenue, cash, and digital breakdown
              </span>
            )}
          </div>

          {/* Uber Bar Chart */}
          <div className="w-full overflow-x-auto pb-2 pt-2">
            <div className="h-44 sm:h-52 flex items-end gap-1.5 sm:gap-2 min-w-[580px] sm:min-w-full px-1">
              {monthlyChartData.map((d) => {
                const heightPercent = maxDaySales > 0 && d.total > 0 ? Math.max(Math.round((d.total / maxDaySales) * 100), 8) : 4;
                const isSelected = activeHoverBar?.day === d.day;
                const isPeak = peakDayObj.day === d.day && d.total > 0;

                return (
                  <div
                    key={d.day}
                    onMouseEnter={() => setActiveHoverBar(d)}
                    onClick={() => setActiveHoverBar(d)}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                  >
                    {isPeak && (
                      <div className="absolute -top-6 bg-emerald-600 text-white text-xs font-black px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5 animate-bounce">
                        <Award className="w-2.5 h-2.5" /> Max
                      </div>
                    )}

                    <div className="w-full flex flex-col items-center justify-end h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[18px] sm:max-w-[24px] rounded-t-lg transition-all duration-300 relative ${
                          d.total === 0
                            ? 'bg-slate-100 group-hover:bg-slate-200'
                            : isSelected
                            ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-md shadow-rose-500/30'
                            : isPeak
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                            : 'bg-gradient-to-t from-slate-700 to-slate-500 group-hover:from-rose-600 group-hover:to-rose-400'
                        }`}
                      ></div>
                    </div>

                    <span
                      className={`text-xs mt-2 font-mono font-bold transition-colors ${
                        isSelected ? 'text-rose-600 font-black' : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    >
                      {d.day}
                    </span>
                  </div>
                );
              })}
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
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-rose-600" /> Search Catalog
                    </span>
                    <span className="text-xs font-medium text-slate-400">Search medicine or enter direct bill on the right panel</span>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Type medicine name or batch code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 sm:py-3 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600 transition-all font-medium"
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
                              <p className="text-xs text-slate-400 mt-0.5">
                                Batch: <span className="font-mono text-slate-600">{med.batch_no}</span> • Stock: <span className="font-bold text-slate-700">{med.stock_qty} pcs</span>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs sm:text-sm font-extrabold text-rose-600">₹{med.selling_price}</span>
                              <span className="block text-xs text-slate-400 line-through">MRP: ₹{med.mrp}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Cart Box */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="px-4.5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-rose-600" /> Current Invoice Cart
                    </h3>
                    <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">{cart.length} Items Added</span>
                  </div>

                  {cart.length === 0 ? (
                    <div className="p-8 sm:p-10 text-center bg-slate-50/30">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-2 font-bold shadow-2xs">
                        ₹
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-700">Cart is empty</p>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto">
                        Search and pick medicines above, or directly enter total amount on right panel.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-50 text-xs font-bold uppercase text-slate-400 tracking-wider">
                        <div className="col-span-5">Item</div>
                        <div className="col-span-2 text-center">Rate</div>
                        <div className="col-span-3 text-center">Qty</div>
                        <div className="col-span-2 text-right">Subtotal</div>
                      </div>
                      {cart.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 px-4 py-3 items-center text-xs sm:text-sm hover:bg-slate-50 transition-colors">
                          <div className="col-span-5 pr-2">
                            <p className="font-bold text-slate-900 leading-tight truncate">{item.name}</p>
                            <span className="text-xs text-slate-400 font-mono">B: {item.batch_no}</span>
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

              {/* Right Column: Checkout & Payment Terminal with Credit Mode */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-rose-600" /> Payment & Billing
                    </h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">POS Terminal</span>
                  </div>

                  {/* Manual Bill Amount Input */}
                  {cart.length === 0 && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                      <label className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
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
                      <span className="text-xs text-slate-400 font-medium block">Enter manual invoice amount if no catalog items are selected</span>
                    </div>
                  )}

                  {/* Customer Information (MANDATORY FOR CREDIT) */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Customer Name {paymentMode === 'CREDIT' ? <span className="text-rose-500">* (Mandatory for Credit)</span> : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        required={paymentMode === 'CREDIT'}
                        placeholder="e.g. Ramesh Kumar"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium ${
                          paymentMode === 'CREDIT' && !customerName.trim() ? 'border-amber-400 focus:border-amber-500' : 'border-slate-200 focus:border-rose-600'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Mobile Number {paymentMode === 'CREDIT' ? <span className="text-rose-500">* (10-Digit Mandatory)</span> : '(WhatsApp Slip)'}
                      </label>
                      <input
                        type="tel"
                        required={paymentMode === 'CREDIT'}
                        placeholder="10-digit mobile number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium ${
                          paymentMode === 'CREDIT' && customerPhone.replace(/\D/g, '').length < 10 ? 'border-amber-400 focus:border-amber-500' : 'border-slate-200 focus:border-rose-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Payment Method</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['UPI', 'CASH', 'SPLIT', 'CREDIT'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMode(m)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all touch-manipulation cursor-pointer text-center ${
                            paymentMode === m
                              ? m === 'CREDIT'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                                : 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {m === 'UPI' ? 'QR / UPI' : m === 'CASH' ? 'Cash' : m === 'SPLIT' ? 'Split' : 'Credit'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split Box */}
                  {paymentMode === 'SPLIT' && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Cash Paid</span>
                        <input
                          type="number"
                          placeholder="₹ Cash"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase text-slate-500 block mb-1">UPI Paid</span>
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

                  {/* Credit Form Box */}
                  {paymentMode === 'CREDIT' && (
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs font-bold uppercase text-amber-800 block mb-1">Amount Paid Now (₹)</span>
                          <input
                            type="number"
                            placeholder="0 (Fully Due)"
                            value={paidNowAmount}
                            onChange={(e) => setPaidNowAmount(e.target.value)}
                            className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                          />
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase text-amber-800 block mb-1">Balance Due (Credit)</span>
                          <div className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-black text-rose-600">
                            ₹{calculatedDue.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase text-amber-800 block mb-1">
                          Prescription / Medicine Notes (Optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="List medicines taken on credit (e.g. Paracetamol 2 strips, cough syrup)..."
                          value={creditNotes}
                          onChange={(e) => setCreditNotes(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none placeholder-slate-400 font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* Summary Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>Total Invoice</span>
                      <span>₹{finalPayable.toFixed(2)}</span>
                    </div>
                    {paymentMode === 'CREDIT' ? (
                      <>
                        <div className="flex justify-between text-xs text-emerald-600 font-medium">
                          <span>Received Now</span>
                          <span>₹{(parseFloat(paidNowAmount) || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-200">
                          <span className="text-xs sm:text-sm font-bold text-amber-700 uppercase tracking-wide">Credit Due</span>
                          <span className="text-2xl sm:text-3xl font-black text-amber-600">₹{calculatedDue.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-200">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">Net Payable</span>
                        <span className="text-2xl sm:text-3xl font-black text-rose-600">₹{finalPayable.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={submitting || finalPayable <= 0}
                    onClick={handleFinalCheckout}
                    className={`w-full text-white font-extrabold py-3.5 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation active:scale-[0.99] border-t border-white/20 cursor-pointer text-sm ${
                      paymentMode === 'CREDIT'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-600/30'
                        : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-rose-600/30'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {submitting
                      ? 'Saving...'
                      : paymentMode === 'CREDIT'
                      ? `Save Credit Bill (Due: ₹${calculatedDue.toFixed(2)})`
                      : `Complete Invoice (₹${finalPayable.toFixed(2)})`}
                  </button>
                </div>
              </div>

            </div>

            {/* Invoices Ledger with WhatsApp slips, Return, Search & Delete Option */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-4.5 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 tracking-tight">
                    <Clock className="w-4 h-4 text-rose-600" /> Recent Invoices Ledger
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {filterMode === 'today'
                      ? "Showing transactions recorded today"
                      : filterMode === 'date'
                      ? `Showing transactions for date ${selectedSingleDate}`
                      : `Showing all transactions for ${MONTHS[selectedMonth]} ${selectedYear}`}
                  </p>
                </div>

                {/* Instant Search Bar inside Ledger */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search bill no, name or phone..."
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-600 shadow-2xs"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs whitespace-nowrap">
                    {filteredRecentInvoices.length} Bills
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[620px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-50 text-xs uppercase text-slate-400 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Invoice No</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredRecentInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 text-xs font-medium">
                          No invoices found for the selected period or search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRecentInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-xs text-slate-700">{inv.bill_no}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900 leading-tight truncate max-w-[140px] sm:max-w-none">{inv.customer_name}</p>
                            <span className="text-xs text-slate-400">{inv.customer_phone || 'Walk-in'}</span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                            <div>{new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                            <div className="text-2xs text-slate-400">{new Date(inv.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-xs font-extrabold ${
                                inv.payment_mode === 'UPI'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : inv.payment_mode === 'CASH'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : inv.payment_mode === 'CREDIT'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {inv.payment_mode === 'CREDIT' ? `Credit (Due: ₹${inv.due_amount || 0})` : inv.payment_mode}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900">₹{Number(inv.total_amount).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => sendWhatsAppSlip(inv)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs touch-manipulation active:scale-95 cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                WhatsApp
                              </button>
                              
                              {/* Return / Refund Button */}
                              <button
                                onClick={() => openReturnModal(inv)}
                                title="Return Medicine / Refund Amount"
                                className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 transition-all touch-manipulation active:scale-95 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteInvoice(inv.id, inv.bill_no)}
                                title="Delete / Cancel Invoice"
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all touch-manipulation active:scale-95 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

        {/* Tab 2: Credit Ledger (Customer Credit Register) */}
        {activeTab === 'credit' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4">
            <div className="px-5 py-4 border-b border-slate-200 bg-amber-50/40 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 tracking-tight">
                  <BookOpen className="w-4 h-4 text-amber-600" /> Credit Ledger (Customer Credit Register)
                </h3>
                <p className="text-xs text-slate-500 font-medium">Record partial or full payments, process medicine returns, and send WhatsApp reminders</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300">
                  Total Market Credit: ₹{totalMarketCredit.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase text-slate-400 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Medicines / Notes</th>
                    <th className="py-3 px-4">Total Bill</th>
                    <th className="py-3 px-4">Paid So Far</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {creditInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        All customer accounts are clear. No pending credit records.
                      </td>
                    </tr>
                  ) : (
                    creditInvoices.map((cred) => {
                      const totalPaidSoFar = (Number(cred.cash_paid) || 0) + (Number(cred.upi_paid) || 0);

                      return (
                        <tr key={cred.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                            {new Date(cred.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900 leading-tight">{cred.customer_name}</p>
                            <a href={`tel:${cred.customer_phone}`} className="text-xs text-teal-600 font-medium hover:underline">
                              {cred.customer_phone}
                            </a>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 max-w-[200px] truncate" title={cred.notes || ''}>
                            {cred.notes || 'Direct Bill (No medicine note)'}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">₹{Number(cred.total_amount).toFixed(2)}</td>
                          <td className="py-3.5 px-4 font-semibold text-emerald-600">₹{totalPaidSoFar.toFixed(2)}</td>
                          <td className="py-3.5 px-4 font-black text-rose-600 text-base">₹{Number(cred.due_amount).toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => sendWhatsAppSlip(cred, true)}
                                title="Send WhatsApp Payment Reminder"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> Reminder
                              </button>

                              {/* Return / Refund Button on Credit Book */}
                              <button
                                onClick={() => openReturnModal(cred)}
                                title="Return Medicine / Deduct from Due"
                                className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 transition-all cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => openSettleModal(cred)}
                                title="Record Partial or Full Payment"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-sm cursor-pointer active:scale-95"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Pay / Clear
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Stock Management */}
        {activeTab === 'stock' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            
            <div className="lg:col-span-4">
              <form onSubmit={handleAddNewMedicine} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 lg:sticky lg:top-24">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5 tracking-tight">
                    <Plus className="w-4 h-4 text-rose-600" /> New Inventory Entry
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Only Name, Selling Rate & Stock are required</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Medicine Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paracetamol 650mg"
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-600 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Selling Rate (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="28"
                        value={newMed.selling_price}
                        onChange={(e) => setNewMed({ ...newMed, selling_price: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-rose-600 focus:outline-none focus:border-rose-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Stock Units <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="100"
                        value={newMed.stock_qty}
                        onChange={(e) => setNewMed({ ...newMed, stock_qty: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-rose-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Optional Details (Auto-generated if empty)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Batch No</label>
                      <input
                        type="text"
                        placeholder="Auto"
                        value={newMed.batch_no}
                        onChange={(e) => setNewMed({ ...newMed, batch_no: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={newMed.expiry_date}
                        onChange={(e) => setNewMed({ ...newMed, expiry_date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Purchase (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Auto"
                        value={newMed.purchase_price}
                        onChange={(e) => setNewMed({ ...newMed, purchase_price: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1">MRP (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Auto"
                        value={newMed.mrp}
                        onChange={(e) => setNewMed({ ...newMed, mrp: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
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

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">Pharmacy Stock Directory</h3>
                <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">Total Items: {inventory.length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-50 text-xs uppercase text-slate-400 font-bold border-b border-slate-200">
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
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-500">{m.batch_no}</td>
                          <td className="py-3 px-4 text-xs text-slate-600 font-medium">{m.expiry_date}</td>
                          <td className="py-3 px-4 font-black text-rose-600">₹{m.selling_price}</td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
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

      {/* POPUP MODAL: RECORD PAYMENT & CLEAR / SETTLE CREDIT */}
      {settleInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Record Payment & Settle</h3>
                  <p className="text-xs text-slate-500">Bill: {settleInvoice.bill_no}</p>
                </div>
              </div>
              <button
                onClick={() => setSettleInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteSettle} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">{settleInvoice.customer_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Original Total Bill:</span>
                  <span className="font-semibold text-slate-800">₹{Number(settleInvoice.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Paid So Far:</span>
                  <span className="font-semibold text-emerald-600">
                    ₹{((Number(settleInvoice.cash_paid) || 0) + (Number(settleInvoice.upi_paid) || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="font-bold text-amber-800">Current Balance Due:</span>
                  <span className="font-black text-rose-600 text-sm">₹{Number(settleInvoice.due_amount).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Payment Amount Receiving Now (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter payment amount"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-lg font-black text-slate-900 focus:outline-none focus:border-amber-600"
                />
                <span className="text-xs text-slate-400 mt-1 block">
                  Enter full amount to clear account, or partial installment amount.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Receiving Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettlePaymentMode('CASH')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      settlePaymentMode === 'CASH'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Cash Received
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettlePaymentMode('UPI')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      settlePaymentMode === 'UPI'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Online QR / UPI
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettleInvoice(null)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settleLoading}
                  className="w-2/3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold transition-all shadow-md shadow-amber-600/25 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {settleLoading ? 'Updating Balance...' : 'Confirm & Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: PROCESS MEDICINE RETURN / REFUND */}
      {returnInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-sky-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Process Medicine Return</h3>
                  <p className="text-xs text-slate-500">Bill: {returnInvoice.bill_no}</p>
                </div>
              </div>
              <button
                onClick={() => setReturnInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteReturn} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">{returnInvoice.customer_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Invoice Amount:</span>
                  <span className="font-semibold text-slate-800">₹{Number(returnInvoice.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Paid Amount:</span>
                  <span className="font-semibold text-emerald-600">
                    ₹{((Number(returnInvoice.cash_paid) || 0) + (Number(returnInvoice.upi_paid) || 0)).toFixed(2)}
                  </span>
                </div>
                {Number(returnInvoice.due_amount || 0) > 0 && (
                  <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="font-bold text-amber-800">Pending Credit Due:</span>
                    <span className="font-black text-rose-600">₹{Number(returnInvoice.due_amount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Return Value / Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter return amount (e.g. 50)"
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-lg font-black text-slate-900 focus:outline-none focus:border-sky-600"
                />
                <span className="text-xs text-slate-400 mt-1 block">
                  Value of medicines customer is returning.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  How To Adjust This Return?
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {Number(returnInvoice.due_amount || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => setReturnMode('DEDUCT_DUE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left flex items-center justify-between ${
                        returnMode === 'DEDUCT_DUE'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Deduct From Pending Credit Due</span>
                      <span className="text-2xs opacity-80">(Reduce customer balance)</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setReturnMode('REFUND_CASH')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left flex items-center justify-between ${
                      returnMode === 'REFUND_CASH'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Refund Cash To Customer</span>
                    <span className="text-2xs opacity-80">(Cash drawer refund)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnMode('REFUND_UPI')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left flex items-center justify-between ${
                      returnMode === 'REFUND_UPI'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Refund Online via UPI</span>
                    <span className="text-2xs opacity-80">(Bank settlement refund)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Medicine Name / Return Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 1 strip returned"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReturnInvoice(null)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnLoading}
                  className="w-2/3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold transition-all shadow-md shadow-sky-600/25 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {returnLoading ? 'Processing Return...' : 'Confirm Return & Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}