import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatCurrency } from '../constants/currencies';

/**
 * Generates thermal 80mm/58mm standard receipt HTML
 */
export const generateReceiptHtml = (order, profile) => {
  const restaurantName = profile?.restaurantName || 'FASTBILLO Restaurant';
  const address = profile?.address || '';
  const phone = profile?.phone || '';
  const currency = order.currency || { symbol: '₹' };
  const items = order.items || [];
  const dateFormatted = order.date
    ? new Date(order.date).toLocaleString()
    : new Date().toLocaleString();
  const orderId = order.id ? order.id.slice(-6).toUpperCase() : 'NEW';

  const rows = items
    .map((item) => {
      const name = item.item?.name || 'Item';
      const variant = item.selectedVariant?.name ? ` (${item.selectedVariant.name})` : '';
      const unitPrice = item.selectedVariant?.price || 0;
      const totalItemPrice = unitPrice * (item.quantity || 1);

      return `
        <tr>
          <td style="padding: 4px 0; text-align: left; font-size: 13px;">
            ${name}${variant}
            <div style="font-size: 11px; color: #555;">${item.quantity} x ${formatCurrency(unitPrice, currency)}</div>
          </td>
          <td style="padding: 4px 0; text-align: right; font-size: 13px; font-weight: bold; vertical-align: top;">
            ${formatCurrency(totalItemPrice, currency)}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: 'Courier New', Courier, monospace, monospace;
            padding: 16px;
            color: #111;
            width: 320px;
            margin: 0 auto;
            background: #fff;
          }
          .center { text-align: center; }
          .header { border-bottom: 1px dashed #444; padding-bottom: 8px; margin-bottom: 8px; }
          .title { font-size: 18px; font-weight: 900; margin: 0; text-transform: uppercase; }
          .sub { font-size: 12px; margin: 2px 0; }
          .divider { border-top: 1px dashed #444; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; font-size: 12px; margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          .total-row { font-size: 16px; font-weight: bold; border-top: 1px dashed #111; border-bottom: 1px dashed #111; padding: 6px 0; }
          .footer { font-size: 11px; margin-top: 16px; text-align: center; color: #444; }
        </style>
      </head>
      <body>
        <div class="header center">
          <h1 class="title">${restaurantName}</h1>
          ${address ? `<p class="sub">${address}</p>` : ''}
          ${phone ? `<p class="sub">Tel: ${phone}</p>` : ''}
        </div>

        <div class="row">
          <span>Order #: <strong>#${orderId}</strong></span>
          <span>${dateFormatted}</span>
        </div>
        ${
          order.customer?.name
            ? `<div class="row"><span>Customer:</span><span>${order.customer.name}</span></div>`
            : ''
        }
        ${
          order.customer?.mobile
            ? `<div class="row"><span>Mobile:</span><span>${order.customer.mobile}</span></div>`
            : ''
        }
        <div class="row">
          <span>Payment:</span>
          <span style="text-transform: uppercase; font-weight: bold;">${order.paymentMethod || 'CASH'}</span>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #777; font-size: 11px; text-transform: uppercase;">
              <th style="text-align: left; padding-bottom: 4px;">Item</th>
              <th style="text-align: right; padding-bottom: 4px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="row">
          <span>Subtotal:</span>
          <span>${formatCurrency(order.subtotal || 0, currency)}</span>
        </div>
        ${
          order.tax > 0
            ? `<div class="row"><span>Tax (${((profile?.taxRate ?? 0.05) * 100).toFixed(0)}%):</span><span>${formatCurrency(order.tax, currency)}</span></div>`
            : ''
        }
        <div class="divider"></div>
        <div class="row total-row">
          <span>NET TOTAL:</span>
          <span>${formatCurrency(order.total || 0, currency)}</span>
        </div>

        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p style="font-size: 9px; color: #888;">Powered by FASTBILLO — Bill Fast. Grow Faster.</p>
        </div>
      </body>
    </html>
  `;
};

export const printService = {
  /**
   * Direct Thermal / AirPrint
   */
  async printOrder(order, profile) {
    const html = generateReceiptHtml(order, profile);
    return await Print.printAsync({
      html,
    });
  },

  /**
   * Generate PDF and trigger native Share Sheet (WhatsApp, Mail, Messages)
   */
  async shareOrderPdf(order, profile) {
    const html = generateReceiptHtml(order, profile);
    const { uri } = await Print.printToFileAsync({ html });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Order #${order.id ? order.id.slice(-6) : ''} Receipt`,
      });
      return true;
    } else {
      throw new Error('Native file sharing is not available on this device');
    }
  },
};
