import type { Order } from '../types';

type InvoiceDraft = Pick<
  Order,
  'id' | 'orderNumber' | 'customerName' | 'whatsappNumber' | 'productName' | 'quantity' | 'totalPrice' | 'notes' | 'createdAt'
>;

export const formatWhatsAppLink = (phone: string) => {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = `62${clean.slice(1)}`;
  }
  return `https://wa.me/${clean}`;
};

export const formatInvoiceDate = (dateString: string) => (
  new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
);

const isSameLocalDay = (a: Date, b: Date) => (
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()
);

export const getInvoiceId = (order: InvoiceDraft, allOrders: InvoiceDraft[] = []) => {
  const orderDate = new Date(order.createdAt);
  const sourceOrders = allOrders.some((item) => item.id === order.id)
    ? allOrders
    : [...allOrders, order];
  const dayOrders = sourceOrders
    .filter((item) => isSameLocalDay(new Date(item.createdAt), orderDate))
    .sort((a, b) => (
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
      a.orderNumber.localeCompare(b.orderNumber)
    ));
  const sequence = Math.max(1, dayOrders.findIndex((item) => item.id === order.id) + 1 || dayOrders.length);
  const day = String(orderDate.getDate()).padStart(2, '0');
  const month = String(orderDate.getMonth() + 1).padStart(2, '0');

  return `${day}-${month}-${sequence}`;
};

export const compileInvoiceText = (order: InvoiceDraft, allOrders: InvoiceDraft[] = []) => {
  const lines = [
    'WarungFlow / Invoice Order',
    '',
    `Invoice ID: ${getInvoiceId(order, allOrders)}`,
    `Order: ${order.orderNumber}`,
    `Tanggal: ${formatInvoiceDate(order.createdAt)}`,
    `Nama: ${order.customerName}`,
    `Produk: ${order.productName} x${order.quantity}`,
    `Total paid: Rp ${order.totalPrice.toLocaleString('id-ID')}`,
  ];

  if (order.notes.trim()) {
    lines.push(`Catatan: ${order.notes.trim()}`);
  }

  lines.push('', 'Terima kasih, pembayaran Anda sudah kami terima.');
  return lines.join('\n');
};

export const copyInvoiceText = async (order: InvoiceDraft, allOrders: InvoiceDraft[] = []) => {
  await navigator.clipboard.writeText(compileInvoiceText(order, allOrders));
};

export const copyInvoiceAndOpenWhatsApp = async (order: InvoiceDraft, allOrders: InvoiceDraft[] = []) => {
  const text = compileInvoiceText(order, allOrders);
  const link = formatWhatsAppLink(order.whatsappNumber);

  try {
    await navigator.clipboard.writeText(text);
    window.open(link, '_blank', 'noopener,noreferrer');
    return { copied: true };
  } catch {
    window.open(link, '_blank', 'noopener,noreferrer');
    return { copied: false };
  }
};
