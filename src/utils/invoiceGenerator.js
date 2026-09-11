import { jsPDF } from 'jspdf';

/**
 * Generates a clean, professional PDF Tax Invoice
 */
export function generateTaxInvoicePDF(order, storeSettings = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const storeName = storeSettings.storeName || 'My Organization Store';
  const phone = storeSettings.whatsappNumber || '+91 9147364980';
  const gstin = storeSettings.gstin || '27AABCU9603R1ZM';
  const invoiceNumber = order.invoice_number || order.orderId || `INV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Colors
  const primaryColor = [16, 185, 129]; // Emerald 500
  const darkColor = [15, 23, 42];      // Slate 900
  const grayColor = [100, 116, 139];   // Slate 500

  // 1. Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(storeName.toUpperCase(), 15, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text('OFFICIAL TAX INVOICE • CASH ON DELIVERY (COD)', 15, 23);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`INVOICE #: ${invoiceNumber}`, 195, 15, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${dateStr}`, 195, 22, { align: 'right' });

  // 2. Store & Customer Metadata
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('STORE DETAILS', 15, 42);
  doc.text('BILLED & DELIVERED TO', 115, 42);

  doc.setDrawColor(226, 232, 240);
  doc.line(15, 44, 95, 44);
  doc.line(115, 44, 195, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);

  // Store Left Column
  doc.text(`Business: ${storeName}`, 15, 50);
  doc.text(`GSTIN: ${gstin}`, 15, 55);
  doc.text(`Support WhatsApp: ${phone}`, 15, 60);
  doc.text('Fulfillment: Direct WhatsApp Quick Dispatch', 15, 65);

  // Customer Right Column
  const cust = order.customer || {};
  const addr = order.shippingAddress || {};
  doc.text(`Customer: ${cust.name || 'Guest User'}`, 115, 50);
  doc.text(`Mobile: ${cust.phone || 'N/A'}`, 115, 55);
  if (cust.email) doc.text(`Email: ${cust.email}`, 115, 60);

  let addressLine = addr.street ? `${addr.street}, ${addr.city || ''} ${addr.postalCode || ''}` : 'Store Pickup';
  doc.text(`Address: ${addressLine}`, 115, cust.email ? 65 : 60);

  if (addr.coordinates && addr.coordinates.lat) {
    doc.text(`GPS Pin: ${addr.coordinates.lat.toFixed(4)}, ${addr.coordinates.lng.toFixed(4)}`, 115, cust.email ? 70 : 65);
  }

  // 3. Items Table Header
  const startY = 82;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, startY, 180, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text('ITEM DESCRIPTION', 18, startY + 5.5);
  doc.text('QTY', 120, startY + 5.5, { align: 'center' });
  doc.text('PRICE', 150, startY + 5.5, { align: 'right' });
  doc.text('TOTAL', 190, startY + 5.5, { align: 'right' });

  // 4. Line Items
  let currentY = startY + 14;
  const items = order.items || [];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  items.forEach((item) => {
    doc.setTextColor(...darkColor);
    const vLabel = item.selectedVariant ? ` (${item.selectedVariant.name || item.selectedVariant.size})` : (item.variant_name ? ` (${item.variant_name})` : '');
    const fullTitle = (item.title || item.product_name || 'Product Item') + vLabel;
    doc.text(fullTitle, 18, currentY);
    doc.text(String(item.quantity || 1), 120, currentY, { align: 'center' });
    doc.text(`₹${Number(item.price || item.unit_price || 0).toFixed(2)}`, 150, currentY, { align: 'right' });
    
    const lineTotal = Number(item.price || 0) * Number(item.quantity || 1);
    doc.text(`₹${lineTotal.toFixed(2)}`, 190, currentY, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(15, currentY + 3, 195, currentY + 3);
    currentY += 8;
  });

  // 5. Total Calculations & Summary Box
  currentY += 4;
  const summaryX = 130;

  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);
  doc.text('Subtotal:', summaryX, currentY);
  doc.setTextColor(...darkColor);
  doc.text(`₹${Number(order.subtotal || order.total || 0).toFixed(2)}`, 190, currentY, { align: 'right' });

  currentY += 6;
  doc.setTextColor(...grayColor);
  doc.text('GST (Estimated 18% incl.):', summaryX, currentY);
  const gstAmount = ((Number(order.subtotal || order.total || 0) * 0.18) / 1.18);
  doc.setTextColor(...darkColor);
  doc.text(`₹${gstAmount.toFixed(2)}`, 190, currentY, { align: 'right' });

  currentY += 6;
  doc.setTextColor(...grayColor);
  doc.text('Delivery Fee (COD):', summaryX, currentY);
  doc.setTextColor(16, 185, 129);
  doc.text(order.deliveryFee === 0 ? 'FREE' : `₹${Number(order.deliveryFee).toFixed(2)}`, 190, currentY, { align: 'right' });

  currentY += 6;
  doc.setDrawColor(15, 23, 42);
  doc.line(summaryX, currentY, 195, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text('Grand Total:', summaryX, currentY);
  doc.setTextColor(16, 185, 129);
  doc.text(`₹${Number(order.total || 0).toFixed(2)}`, 190, currentY, { align: 'right' });

  // 6. Payment Badge & Terms
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(15, currentY - 14, 85, 26, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('PAYMENT STATUS: CASH ON DELIVERY', 19, currentY - 7);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(4, 120, 87);
  doc.text('Pay upon receiving your package at your GPS address.', 19, currentY - 2);
  doc.text('Instant WhatsApp dispatch updates will be sent.', 19, currentY + 3);

  // 7. Footer Notice
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text('This is a computer-generated invoice and requires no physical signature.', 105, 280, { align: 'center' });
  doc.text(`For support or order inquiries, WhatsApp us at ${phone}`, 105, 285, { align: 'center' });

  // Save the PDF
  doc.save(`${invoiceNumber}.pdf`);
}
