"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";

interface ThermalReceiptProps {
  transaction: any;
}

export function ThermalReceipt({ transaction }: ThermalReceiptProps) {
  if (!transaction) return null;

  const date = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(transaction.createdAt));

  return (
    <div className="thermal-receipt" id="thermal-receipt-content">
      <style dangerouslySetInnerHTML={{__html: `
        .thermal-receipt {
          display: none;
        }
        @media print {
          /* Hide everything in the body by default */
          body * {
            visibility: hidden;
          }
          /* Show only the thermal receipt */
          .thermal-receipt, .thermal-receipt * {
            visibility: visible;
          }
          /* Reset page margins to zero */
          @page {
            margin: 0;
          }
          /* Position the receipt at the top left */
          .thermal-receipt {
            display: block;
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm; /* standard thermal printer width */
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 10px; /* some padding so text doesn't touch edges */
          }
          .receipt-header, .receipt-footer {
            text-align: center;
            margin-bottom: 10px;
          }
          .receipt-title {
            font-size: 16px;
            font-weight: bold;
          }
          .receipt-line {
            border-bottom: 1px dashed #000;
            margin: 5px 0;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .receipt-row.bold {
            font-weight: bold;
          }
          .receipt-item-name {
            display: block;
          }
          .receipt-item-details {
            display: flex;
            justify-content: space-between;
            padding-left: 10px;
          }
        }
      `}} />

      <div className="receipt-header">
        <div className="receipt-title">{transaction.tenant?.name || "Toko"}</div>
        {transaction.tenant?.address && <div>{transaction.tenant.address}</div>}
        {transaction.tenant?.phone && <div>{transaction.tenant.phone}</div>}
        {transaction.tenant?.receiptHeader && <div>{transaction.tenant.receiptHeader}</div>}
      </div>

      <div className="receipt-line"></div>

      <div className="receipt-row">
        <span>No: {transaction.invoice}</span>
      </div>
      <div className="receipt-row">
        <span>Tgl: {date}</span>
      </div>
      <div className="receipt-row">
        <span>Ksr: {transaction.cashier?.name}</span>
      </div>
      {transaction.customer?.name && (
        <div className="receipt-row">
          <span>Plg: {transaction.customer.name}</span>
        </div>
      )}

      <div className="receipt-line"></div>

      {transaction.details?.map((item: any) => (
        <div key={item.id} style={{ marginBottom: "5px" }}>
          <span className="receipt-item-name">{item.productName}</span>
          <div className="receipt-item-details">
            <span>{item.qty} x {formatCurrency(item.sellPrice)}</span>
            <span>{formatCurrency(item.subtotal)}</span>
          </div>
        </div>
      ))}

      <div className="receipt-line"></div>

      <div className="receipt-row">
        <span>Subtotal</span>
        <span>{formatCurrency(transaction.subtotal)}</span>
      </div>
      {transaction.discountAmount > 0 && (
        <div className="receipt-row">
          <span>Diskon</span>
          <span>- {formatCurrency(transaction.discountAmount)}</span>
        </div>
      )}
      <div className="receipt-row bold">
        <span>TOTAL</span>
        <span>{formatCurrency(transaction.grandTotal)}</span>
      </div>

      <div className="receipt-line"></div>

      <div className="receipt-row">
        <span>Pembayaran ({transaction.paymentMethod})</span>
        <span>{formatCurrency(transaction.paidAmount)}</span>
      </div>
      {(transaction.paymentMethod === 'CASH' || transaction.changeAmount > 0) && (
        <div className="receipt-row">
          <span>Kembalian</span>
          <span>{formatCurrency(transaction.changeAmount)}</span>
        </div>
      )}
      {transaction.paymentStatus === 'PENDING' && (
        <div className="receipt-row">
          <span>Status</span>
          <span>BELUM LUNAS</span>
        </div>
      )}

      <div className="receipt-line"></div>

      <div className="receipt-footer">
        {transaction.tenant?.receiptFooter ? (
          <div>{transaction.tenant.receiptFooter}</div>
        ) : (
          <div>Terima Kasih Atas Kunjungan Anda!</div>
        )}
      </div>
    </div>
  );
}
