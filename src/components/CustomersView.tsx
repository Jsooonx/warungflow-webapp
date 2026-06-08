import React, { useState } from 'react';
import type { Customer, Order } from '../types';
import { Search, ChevronRight } from 'lucide-react';
import { CustomerDrawer } from './CustomerDrawer';

interface CustomersViewProps {
  customers: Customer[];
  orders: Order[];
  lang?: 'id' | 'en';
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  lang = 'id'
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Filter customers by name or whatsappNumber
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.whatsappNumber.includes(search)
  );

  const formatOrderDate = (dateString: string) => {
    return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-y-visible lg:overflow-y-auto space-y-6 select-none relative page-transition-enter">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{lang === 'id' ? 'Direktori Pelanggan' : 'Customer Directory'}</h2>
        <p className="text-xs text-slate-400 mt-1">{lang === 'id' ? 'Riwayat klien teragregasi secara otomatis dari data pesanan.' : 'Aggregated clients history compile automatically from orders.'}</p>
      </div>

      {/* Toolbar Search */}
      <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={lang === 'id' ? 'Cari nama pelanggan atau telepon...' : 'Search by customer name or phone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200/80 rounded-lg text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Customers Data Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-6">{lang === 'id' ? 'Nama Pelanggan' : 'Customer Name'}</th>
                <th className="py-3 px-6">{lang === 'id' ? 'Telepon WhatsApp' : 'WhatsApp Phone'}</th>
                <th className="py-3 px-6 w-36">{lang === 'id' ? 'Total Order' : 'Total Orders'}</th>
                <th className="py-3 px-6 w-44">{lang === 'id' ? 'Total Belanja' : 'Total Spent'}</th>
                <th className="py-3 px-6 w-56">{lang === 'id' ? 'Tanggal Order Terakhir' : 'Last Order Date'}</th>
                <th className="py-3 px-6 w-16 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {lang === 'id' ? 'Belum ada pelanggan terdaftar.' : 'No customers registered yet.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="hover:bg-slate-50/75 transition-colors cursor-pointer group"
                  >
                    {/* Name avatar */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {customer.name}
                        </span>
                      </div>
                    </td>

                    {/* WhatsApp */}
                    <td className="py-3.5 px-6 text-slate-500 font-mono">
                      {customer.whatsappNumber}
                    </td>

                    {/* Total orders */}
                    <td className="py-3.5 px-6 font-bold text-slate-800">
                      {customer.totalOrders} {lang === 'id' ? 'order' : (customer.totalOrders > 1 ? 'orders' : 'order')}
                    </td>

                    {/* Spent */}
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                      Rp{customer.totalSpending.toLocaleString('id-ID')}
                    </td>

                    {/* Last order date */}
                    <td className="py-3.5 px-6 text-slate-400">
                      {formatOrderDate(customer.lastOrderDate)}
                    </td>

                    {/* Right Chevron arrow indicator */}
                    <td className="py-3.5 px-6 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all inline" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Drawer Component */}
      <CustomerDrawer
        customer={selectedCustomer}
        orders={orders}
        onClose={() => setSelectedCustomer(null)}
        lang={lang}
      />
    </div>
  );
};
