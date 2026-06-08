import React, { useState, useEffect, useRef } from 'react';
import type { Order, OrderStatus } from '../types';
import { ArrowLeft, Check, Copy, FileText, MessageSquare, Send } from 'lucide-react';
import { RollingText } from './RollingText';
import { compileInvoiceText, formatInvoiceDate, getInvoiceId } from '../lib/whatsapp';

type ParsedField = 'customerName' | 'whatsappNumber' | 'productName' | 'quantity' | 'totalPrice' | 'notes';

interface OrderFormViewProps {
  orderToEdit?: Order | null;
  orders?: Order[];
  onSave: (orderData: {
    customerName: string;
    whatsappNumber: string;
    productName: string;
    quantity: number;
    totalPrice: number;
    notes: string;
    status: OrderStatus;
    trackingNumber?: string;
  }, options?: { invoiceAction?: 'copy' | 'send' }) => void | Promise<void>;
  onCancel: () => void;
  onFormatCopied: () => void;
  lang?: 'id' | 'en';
}

const parsePastedText = (text: string) => {
  const lines = text.split('\n');
  let parsedName = '';
  let parsedPhone = '';
  let parsedProduct = '';
  let parsedQty = 1;
  let parsedPrice = 0;
  let parsedNotes = '';
  const detectedFields: ParsedField[] = [];

  lines.forEach(line => {
    const cleanLine = line.trim();
    
    // Pattern matchers
    const nameMatch = cleanLine.match(/^(?:Nama|Name|Penerima)\s*:\s*(.+)$/i);
    const phoneMatch = cleanLine.match(/^(?:No WA|WhatsApp|WA|No HP|HP|Telepon|Phone|Telp)\s*:\s*(.+)$/i);
    const productMatch = cleanLine.match(/^(?:Produk|Product|Pesanan|Barang)\s*:\s*(.+)$/i);
    const qtyMatch = cleanLine.match(/^(?:Jumlah|Qty|Quantity|Pcs)\s*:\s*(\d+)/i);
    const priceMatch = cleanLine.match(/^(?:Total Harga|Total|Harga|Price|Bayar)\s*:\s*(?:Rp\s*)?([\d.,]+)/i);
    const notesMatch = cleanLine.match(/^(?:Catatan|Notes|Alamat|Address)\s*:\s*(.+)$/i);

    if (nameMatch) {
      parsedName = nameMatch[1].trim();
      detectedFields.push('customerName');
    }
    if (phoneMatch) {
      parsedPhone = phoneMatch[1].trim().replace(/[^0-9+() -]/g, '');
      detectedFields.push('whatsappNumber');
    }
    if (productMatch) {
      parsedProduct = productMatch[1].trim();
      detectedFields.push('productName');
    }
    if (qtyMatch) {
      parsedQty = parseInt(qtyMatch[1], 10);
      detectedFields.push('quantity');
    }
    if (priceMatch) {
      // Clean price characters (remove dots, commas, Rp currency prefixes)
      const cleanPrice = priceMatch[1].replace(/[.,]/g, '');
      parsedPrice = parseInt(cleanPrice, 10);
      detectedFields.push('totalPrice');
    }
    if (notesMatch) {
      parsedNotes = notesMatch[1].trim();
      detectedFields.push('notes');
    }
  });

  return {
    customerName: parsedName,
    whatsappNumber: parsedPhone,
    productName: parsedProduct,
    quantity: parsedQty,
    totalPrice: parsedPrice,
    notes: parsedNotes,
    detectedFields,
  };
};

export const OrderFormView: React.FC<OrderFormViewProps> = ({
  orderToEdit,
  orders = [],
  onSave,
  onCancel,
  onFormatCopied,
  lang = 'id'
}) => {
  const [customerName, setCustomerName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<OrderStatus>('pending_payment');
  const [trackingNumber, setTrackingNumber] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [invalidField, setInvalidField] = useState<string | null>(null);
  const [parsedFields, setParsedFields] = useState<ParsedField[]>([]);
  const [flashParsedFields, setFlashParsedFields] = useState<ParsedField[]>([]);
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  // Magic Parser states
  const [pasteInput, setPasteInput] = useState('');
  const [copiedFormat, setCopiedFormat] = useState(false);

  const formatTemplate = `Nama: \nWhatsApp: \nProduk: \nJumlah: 1\nTotal Harga: \nCatatan: `;

  const handleCopyFormat = () => {
    navigator.clipboard.writeText(formatTemplate).then(() => {
      setCopiedFormat(true);
      setTimeout(() => setCopiedFormat(false), 2000);
      onFormatCopied();
    });
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPasteInput(val);
    if (!val.trim()) {
      setCustomerName('');
      setWhatsappNumber('');
      setProductName('');
      setQuantity(1);
      setTotalPrice(0);
      setNotes('');
      setParsedFields([]);
      setFlashParsedFields([]);
      return;
    }

    const parsed = parsePastedText(val);
    
    if (parsed.customerName) {
      setCustomerName(parsed.customerName);
    }
    if (parsed.whatsappNumber) {
      setWhatsappNumber(parsed.whatsappNumber);
    }
    if (parsed.productName) {
      setProductName(parsed.productName);
    }
    if (parsed.detectedFields.includes('quantity')) {
      setQuantity(parsed.quantity);
    }
    if (parsed.totalPrice) {
      setTotalPrice(parsed.totalPrice);
    }
    if (parsed.notes) {
      setNotes(parsed.notes);
    }

    setParsedFields(parsed.detectedFields);
    setFlashParsedFields([]);
    window.requestAnimationFrame(() => {
      setFlashParsedFields(parsed.detectedFields);
      window.setTimeout(() => setFlashParsedFields([]), 1200);
    });
  };

  // Pre-fill form if editing an existing order
  useEffect(() => {
    if (orderToEdit) {
      setCustomerName(orderToEdit.customerName);
      setWhatsappNumber(orderToEdit.whatsappNumber);
      setProductName(orderToEdit.productName);
      setQuantity(orderToEdit.quantity);
      setTotalPrice(orderToEdit.totalPrice);
      setNotes(orderToEdit.notes);
      setStatus(orderToEdit.status);
      setTrackingNumber(orderToEdit.trackingNumber || '');
    } else {
      // Clear form for new order creation
      setCustomerName('');
      setWhatsappNumber('');
      setProductName('');
      setQuantity(1);
      setTotalPrice(0);
      setNotes('');
      setStatus('pending_payment');
      setTrackingNumber('');
      setPasteInput('');
      setParsedFields([]);
      setFlashParsedFields([]);
    }
  }, [orderToEdit]);

  const parsedLabels: Record<ParsedField, string> = {
    customerName: lang === 'id' ? 'Nama terdeteksi' : 'Name parsed',
    whatsappNumber: lang === 'id' ? 'Telepon terdeteksi' : 'Phone parsed',
    productName: lang === 'id' ? 'Produk terdeteksi' : 'Product parsed',
    quantity: lang === 'id' ? 'Qty terdeteksi' : 'Qty parsed',
    totalPrice: lang === 'id' ? 'Harga terdeteksi' : 'Price parsed',
    notes: lang === 'id' ? 'Catatan terdeteksi' : 'Notes parsed',
  };

  const getParsedDelay = (field: ParsedField) => `${Math.max(parsedFields.indexOf(field), 0) * 80}ms`;

  const getParsedStyle = (field: ParsedField) => ({
    '--parsed-delay': getParsedDelay(field),
  } as React.CSSProperties);

  const getParsedClass = (field: ParsedField) => (
    flashParsedFields.includes(field) ? 'parsed-field-flash' : ''
  );

  const invoicePreviewOrder: Order = {
    id: orderToEdit?.id || 'preview',
    orderNumber: orderToEdit?.orderNumber || 'ORD-NEW',
    customerName: customerName.trim() || 'Customer Name',
    whatsappNumber: whatsappNumber.trim() || '08xxxxxxxxxx',
    productName: productName.trim() || 'Product Name',
    quantity: Number(quantity) || 1,
    totalPrice: Number(totalPrice) || 0,
    notes: notes.trim(),
    status,
    trackingNumber: trackingNumber.trim() || undefined,
    createdAt: orderToEdit?.createdAt || new Date().toISOString(),
    updatedAt: orderToEdit?.updatedAt || new Date().toISOString(),
  };

  // Basic validation rules
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!customerName.trim()) {
      newErrors.customerName = lang === 'id' ? 'Nama pelanggan wajib diisi' : 'Customer name is required';
    }
    if (!whatsappNumber.trim()) {
      newErrors.whatsappNumber = lang === 'id' ? 'Nomor WhatsApp wajib diisi' : 'WhatsApp number is required';
    } else if (!/^[0-9+() -]{7,20}$/.test(whatsappNumber)) {
      newErrors.whatsappNumber = lang === 'id' ? 'Masukkan nomor telepon yang valid (angka/spasi/tanda hubung)' : 'Enter a valid phone number (digits/spaces/dashes)';
    }
    if (!productName.trim()) {
      newErrors.productName = lang === 'id' ? 'Nama produk wajib diisi' : 'Product name is required';
    }
    if (quantity <= 0) {
      newErrors.quantity = lang === 'id' ? 'Jumlah minimal 1' : 'Quantity must be at least 1';
    }
    if (totalPrice < 0) {
      newErrors.totalPrice = lang === 'id' ? 'Harga tidak boleh negatif' : 'Price cannot be negative';
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      firstErrorField: Object.keys(newErrors)[0] || null,
    };
  };

  const getOrderData = () => ({
    customerName: customerName.trim(),
    whatsappNumber: whatsappNumber.trim(),
    productName: productName.trim(),
    quantity: Number(quantity),
    totalPrice: Number(totalPrice),
    notes: notes.trim(),
    status,
    trackingNumber: trackingNumber.trim() || undefined
  });

  const submitOrder = (options?: { invoiceAction?: 'copy' | 'send' }) => {
    const validation = validateForm();
    if (!validation.isValid) {
      const field = validation.firstErrorField;
      setInvalidField(null);
      window.requestAnimationFrame(() => {
        if (!field) return;
        setInvalidField(field);
        inputRefs.current[field]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputRefs.current[field]?.focus({ preventScroll: true });
        window.setTimeout(() => setInvalidField(null), 700);
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate slight save latency for smooth UX transitions
    setTimeout(() => {
      void Promise.resolve(onSave(getOrderData(), options)).finally(() => setIsSubmitting(false));
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitOrder();
  };

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-y-visible lg:overflow-y-auto space-y-6 select-none bg-slate-50/50 page-transition-enter">
      {/* Back CTA Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-500 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {orderToEdit ? (lang === 'id' ? `Edit Order #${orderToEdit.orderNumber}` : `Edit Order #${orderToEdit.orderNumber}`) : (lang === 'id' ? 'Buat Order Baru' : 'Create New Order')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {orderToEdit ? (lang === 'id' ? 'Ubah status order, nomor resi kurir, atau detail pelanggan.' : 'Modify order status, shipping code, or client details.') : (lang === 'id' ? 'Masukkan data pesanan dari chat penjualan.' : 'Input order records from sales chats.')}
          </p>
        </div>
      </div>

      {/* Magic Parser Box Helper (Shown only for new orders creation) */}
      {!orderToEdit && (
        <div className="premium-card p-5 max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-5 bg-emerald-50/5/5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              {lang === 'id' ? 'Tempel Ajaib / Isi Otomatis dari Chat' : 'Magic Paste / Auto-Fill from Chat'}
            </label>
            <p className="text-[11px] text-slate-400">
              {lang === 'id' ? 'Tempel teks format order pelanggan di sini untuk mengekstrak detail dan mengisi formulir secara otomatis.' : 'Paste the customer\'s text order format here to automatically extract details and populate the form.'}
            </p>
            <textarea
              value={pasteInput}
              onChange={handlePasteChange}
              rows={4}
              placeholder={lang === 'id' ? 'Tempel pesan chat di sini...\nmisalnya:\nNama: Pelanggan Baru\nWhatsApp: 08xxxxxxxxxx\nProduk: Paket Produk\nTotal Harga: 180000' : 'Paste chat message here...\ne.g.\nNama: Pelanggan Baru\nWhatsApp: 08xxxxxxxxxx\nProduk: Paket Produk\nTotal Harga: 180000'}
              className="w-full p-3 border border-slate-200 bg-slate-50/50 rounded-lg text-xs transition-colors focus:bg-white focus:border-emerald-500 focus:outline-hidden resize-none h-28"
            />
            {parsedFields.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {parsedFields.map((field) => (
                  <span
                    key={field}
                    className="parsed-chip rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700"
                    style={getParsedStyle(field)}
                  >
                    {parsedLabels[field]}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {lang === 'id' ? 'Template Format Order Standar' : 'Standard Order Format Template'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {lang === 'id' ? 'Salin dan kirim format ini ke pelanggan Anda agar pengisian otomatis 100% akurat.' : 'Copy and send this format to your customers so they can fill it out, making parsing 100% accurate.'}
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 font-mono text-[10px] text-slate-500 mt-2 whitespace-pre-line leading-relaxed">
                {formatTemplate}
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleCopyFormat}
              className={`group h-9 w-full rounded-lg border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-500 ${
                copiedFormat
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-transparent text-slate-600 hover:bg-slate-950 hover:text-white shadow-xs'
              }`}
            >
              <RollingText compact>{lang === 'id' ? (copiedFormat ? 'Format Disalin!' : 'Salin Format Kosong') : (copiedFormat ? 'Format Copied!' : 'Copy Blank Format')}</RollingText>
            </button>
          </div>
        </div>
      )}

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 max-w-4xl space-y-8">
        
        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section 1: Customer Info */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              {lang === 'id' ? 'Informasi Pelanggan' : 'Customer Information'}
            </h3>

            {/* Customer Name */}
            <div className="space-y-1.5">
              <label htmlFor="customerName" className="text-xs font-semibold text-slate-700">
                {lang === 'id' ? 'Nama Pelanggan' : 'Customer Name'}
              </label>
              <input
                id="customerName"
                ref={(node) => {
                  inputRefs.current.customerName = node;
                }}
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Pelanggan Baru"
                className={`w-full h-10 px-3 border rounded-lg text-xs transition-colors focus:bg-white focus:outline-hidden ${
                  errors.customerName 
                    ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500' 
                    : 'border-slate-200 bg-slate-50/50 focus:border-emerald-500'
                } ${invalidField === 'customerName' ? 'form-error-shake' : ''} ${getParsedClass('customerName')}`}
                style={getParsedStyle('customerName')}
              />
              {errors.customerName && (
                <span className="text-[10px] text-rose-600 font-semibold">{errors.customerName}</span>
              )}
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-1.5">
              <label htmlFor="whatsappNumber" className="text-xs font-semibold text-slate-700">
                {lang === 'id' ? 'Nomor WhatsApp' : 'WhatsApp Phone Number'}
              </label>
              <input
                id="whatsappNumber"
                ref={(node) => {
                  inputRefs.current.whatsappNumber = node;
                }}
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 08xxxxxxxxxx"
                className={`w-full h-10 px-3 border rounded-lg text-xs font-mono transition-colors focus:bg-white focus:outline-hidden ${
                  errors.whatsappNumber 
                    ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500' 
                    : 'border-slate-200 bg-slate-50/50 focus:border-emerald-500'
                } ${invalidField === 'whatsappNumber' ? 'form-error-shake' : ''} ${getParsedClass('whatsappNumber')}`}
                style={getParsedStyle('whatsappNumber')}
              />
              <span className="text-[10px] text-slate-400 block font-normal leading-normal">
                {lang === 'id' ? 'Gunakan format lokal (08...) atau internasional (62...).' : 'Use local formatting (08...) or international (62...).'}
              </span>
              {errors.whatsappNumber && (
                <span className="text-[10px] text-rose-600 font-semibold mt-1 block">{errors.whatsappNumber}</span>
              )}
            </div>

            {/* Notes / Address */}
            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-xs font-semibold text-slate-700">
                {lang === 'id' ? 'Catatan & Alamat Pengiriman' : 'Notes & Shipping Address'}
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder={lang === 'id' ? 'Detail pengiriman, pesan kartu ucapan, permintaan khusus...' : 'Shipping details, card greeting message, custom product requests...'}
                className={`w-full p-3 border border-slate-200 bg-slate-50/50 rounded-lg text-xs transition-colors focus:bg-white focus:border-emerald-500 focus:outline-hidden resize-none ${getParsedClass('notes')}`}
                style={getParsedStyle('notes')}
              />
            </div>
          </div>

          {/* Section 2: Order Info */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              {lang === 'id' ? 'Detail Order' : 'Order Details'}
            </h3>

            {/* Product Name */}
            <div className="space-y-1.5">
              <label htmlFor="productName" className="text-xs font-semibold text-slate-700">
                {lang === 'id' ? 'Nama Produk' : 'Product Name'}
              </label>
              <input
                id="productName"
                ref={(node) => {
                  inputRefs.current.productName = node;
                }}
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Paket Produk Premium"
                className={`w-full h-10 px-3 border rounded-lg text-xs transition-colors focus:bg-white focus:outline-hidden ${
                  errors.productName 
                    ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500' 
                    : 'border-slate-200 bg-slate-50/50 focus:border-emerald-500'
                } ${invalidField === 'productName' ? 'form-error-shake' : ''} ${getParsedClass('productName')}`}
                style={getParsedStyle('productName')}
              />
              {errors.productName && (
                <span className="text-[10px] text-rose-600 font-semibold">{errors.productName}</span>
              )}
            </div>

            {/* Quantity & Price row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="quantity" className="text-xs font-semibold text-slate-700">
                  {lang === 'id' ? 'Jumlah (Qty)' : 'Quantity'}
                </label>
                <input
                  id="quantity"
                  ref={(node) => {
                    inputRefs.current.quantity = node;
                  }}
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className={`w-full h-10 px-3 border rounded-lg text-xs transition-colors focus:bg-white focus:outline-hidden ${
                    errors.quantity 
                      ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500' 
                      : 'border-slate-200 bg-slate-50/50 focus:border-emerald-500'
                  } ${invalidField === 'quantity' ? 'form-error-shake' : ''} ${getParsedClass('quantity')}`}
                  style={getParsedStyle('quantity')}
                />
                {errors.quantity && (
                  <span className="text-[10px] text-rose-600 font-semibold">{errors.quantity}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="totalPrice" className="text-xs font-semibold text-slate-700">
                  {lang === 'id' ? 'Total Harga (Rp)' : 'Total Price (Rp)'}
                </label>
                <input
                  id="totalPrice"
                  ref={(node) => {
                    inputRefs.current.totalPrice = node;
                  }}
                  type="number"
                  min={0}
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Number(e.target.value))}
                  className={`w-full h-10 px-3 border rounded-lg text-xs font-mono transition-colors focus:bg-white focus:outline-hidden ${
                    errors.totalPrice 
                      ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500' 
                      : 'border-slate-200 bg-slate-50/50 focus:border-emerald-500'
                  } ${invalidField === 'totalPrice' ? 'form-error-shake' : ''} ${getParsedClass('totalPrice')}`}
                  style={getParsedStyle('totalPrice')}
                />
                {errors.totalPrice && (
                  <span className="text-[10px] text-rose-600 font-semibold">{errors.totalPrice}</span>
                )}
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-xs font-semibold text-slate-700">
                {lang === 'id' ? 'Status Order' : 'Order Status'}
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full h-10 px-3 border border-slate-200 bg-slate-50/50 rounded-lg text-xs outline-hidden focus:bg-white focus:border-emerald-500 cursor-pointer"
              >
                <option value="pending_payment">{lang === 'id' ? 'Menunggu Pembayaran (Belum Lunas)' : 'Pending Payment (Unpaid)'}</option>
                <option value="paid">{lang === 'id' ? 'Lunas' : 'Paid'}</option>
                <option value="packing">{lang === 'id' ? 'Dikemas' : 'Packing'}</option>
                <option value="shipped">{lang === 'id' ? 'Dikirim' : 'Shipped'}</option>
                <option value="done">{lang === 'id' ? 'Selesai (Diterima)' : 'Done (Delivered)'}</option>
                <option value="cancelled">{lang === 'id' ? 'Dibatalkan' : 'Cancelled'}</option>
              </select>
            </div>

            {/* Tracking Number (Optional) */}
            <div className="space-y-1.5">
              <label htmlFor="trackingNumber" className="text-xs font-semibold text-slate-700">
                {lang === 'id' ? 'Kode Resi Kurir (Opsional)' : 'Courier Tracking Code (Optional)'}
              </label>
              <input
                id="trackingNumber"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. RESI123456789 / COURIER-82910"
                className="w-full h-10 px-3 border border-slate-200 bg-slate-50/50 rounded-lg text-xs font-mono transition-colors focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            {status === 'paid' && (
              <div className="invoice-ready-panel rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 rounded-lg bg-white p-1.5 text-blue-600 shadow-xs">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {lang === 'id' ? 'Invoice siap' : 'Invoice ready'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                        {lang === 'id' 
                          ? 'Simpan order ini dan langsung salin atau kirim invoice ke WhatsApp pembeli.' 
                          : 'Save this order and immediately copy or send the invoice to buyer WhatsApp.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-100 bg-white/70 p-3 text-[10px] text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-2">
                    <MessageSquare className="h-3 w-3 text-blue-600" />
                    {lang === 'id' ? 'Pratinjau invoice WhatsApp' : 'WhatsApp invoice preview'}
                  </div>
                  <dl className="grid grid-cols-[78px_1fr] gap-x-2 gap-y-1">
                    <dt className="text-slate-400">{lang === 'id' ? 'Order' : 'Order'}</dt>
                    <dd className="font-semibold text-slate-700">{invoicePreviewOrder.orderNumber}</dd>
                    <dt className="text-slate-400">{lang === 'id' ? 'Invoice' : 'Invoice'}</dt>
                    <dd className="font-semibold text-slate-700">{getInvoiceId(invoicePreviewOrder, orders)}</dd>
                    <dt className="text-slate-400">{lang === 'id' ? 'Pembeli' : 'Buyer'}</dt>
                    <dd className="font-semibold text-slate-700">{invoicePreviewOrder.customerName}</dd>
                    <dt className="text-slate-400">{lang === 'id' ? 'Produk' : 'Product'}</dt>
                    <dd className="font-semibold text-slate-700">{invoicePreviewOrder.productName} x{invoicePreviewOrder.quantity}</dd>
                    <dt className="text-slate-400">{lang === 'id' ? 'Total' : 'Total'}</dt>
                    <dd className="font-semibold text-slate-700">Rp {invoicePreviewOrder.totalPrice.toLocaleString('id-ID')}</dd>
                    <dt className="text-slate-400">{lang === 'id' ? 'Tanggal' : 'Date'}</dt>
                    <dd className="font-semibold text-slate-700">{formatInvoiceDate(invoicePreviewOrder.createdAt)}</dd>
                  </dl>
                  <details className="mt-2">
                    <summary className="cursor-pointer font-bold text-blue-700">
                      {lang === 'id' ? 'Lihat teks pesan' : 'View message text'}
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50 p-2 font-sans leading-relaxed text-slate-500">
                      {compileInvoiceText(invoicePreviewOrder, orders)}
                    </pre>
                  </details>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => submitOrder({ invoiceAction: 'send' })}
                    disabled={isSubmitting}
                    className="group h-9 rounded-lg bg-blue-600 text-white hover:bg-white hover:text-blue-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-500 shadow-xs cursor-pointer disabled:opacity-50 disabled:hover:bg-blue-600 disabled:hover:text-white"
                  >
                    <Send className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    <RollingText compact>{lang === 'id' ? 'Kirim via WA' : 'Send via WA'}</RollingText>
                  </button>
                  <button
                    type="button"
                    onClick={() => submitOrder({ invoiceAction: 'copy' })}
                    disabled={isSubmitting}
                    className="group h-9 rounded-lg bg-white text-slate-700 hover:bg-slate-950 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-500 shadow-xs cursor-pointer disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-700"
                  >
                    <Copy className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-0.5" />
                    <RollingText compact>{lang === 'id' ? 'Salin teks' : 'Copy text'}</RollingText>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button Row */}
        <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="group h-10 px-5 rounded-lg border border-transparent bg-white text-slate-600 hover:bg-slate-950 hover:text-white text-xs font-semibold transition-all duration-500 cursor-pointer shadow-xs"
          >
            <RollingText compact>{lang === 'id' ? 'Batal' : 'Cancel'}</RollingText>
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="group h-10 px-5 rounded-lg border border-transparent bg-slate-950 hover:bg-white active:bg-slate-50 text-white hover:text-slate-950 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-500 cursor-pointer shadow-xs disabled:opacity-50 disabled:hover:bg-slate-950 disabled:hover:text-white"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Check className="w-4 h-4 transition-transform duration-500 group-hover:scale-110" />
            )}
            <RollingText compact>{lang === 'id' ? 'Simpan Detail Order' : 'Save Order Details'}</RollingText>
          </button>
        </div>

      </form>
    </div>
  );
};
