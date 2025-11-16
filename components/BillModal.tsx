import React, { useRef } from "react";
import { IOrder, IProfile } from "../types";

interface BillModalProps {
  order: IOrder;
  profile: IProfile | null;
  onClose: () => void;
}

const BillModal: React.FC<BillModalProps> = ({ order, profile, onClose }) => {
  const {
    id,
    items: orderItems,
    customer,
    currency,
    subtotal,
    tax,
    total,
    date,
    paymentMethod,
  } = order;
  const billRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleShareOnWhatsApp = () => {
    if (!customer.mobile) {
      alert("Customer mobile number is not available.");
      return;
    }

    const itemsText = orderItems
      .map(
        ({ item, quantity, selectedVariant }) =>
          `${item.name} (${selectedVariant.name}) x ${quantity} - ${
            currency.symbol
          }${(selectedVariant.price * quantity * currency.rate).toFixed(2)}`
      )
      .join("\n");

    const billText = `*Invoice from ${profile?.restaurantName || "QuickBill"}*

Order ID: ${id}
Date: ${new Date(date).toLocaleString()}
Billed to: ${customer.name}

-----------------------------------
${itemsText}
-----------------------------------

Subtotal: ${currency.symbol}${(subtotal * currency.rate).toFixed(2)}
Tax: ${currency.symbol}${(tax * currency.rate).toFixed(2)}
*Total: ${currency.symbol}${(total * currency.rate).toFixed(2)}*

Payment: ${paymentMethod.toUpperCase()}

Thank you for your visit!
    `;

    const encodedText = encodeURIComponent(
      billText.trim().replace(/\n\s*\n/g, "\n\n")
    );
    // Use a URL that works on both mobile and desktop
    const whatsappUrl = `https://wa.me/${customer.mobile.replace(
      /\D/g,
      ""
    )}?text=${encodedText}`;

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-sm m-4 transition-colors duration-300">
        <div
          id="bill-modal"
          ref={billRef}
          className="bg-white dark:bg-gray-800 p-4 rounded-md"
        >
          <div className="hidden print-only-block text-center font-bold text-lg">
            ** CUSTOMER COPY **
          </div>
          <div className="text-center mb-6">
            {profile?.logoUrl && (
              <img
                src={profile.logoUrl}
                alt="Restaurant Logo"
                className="mx-auto h-20 w-auto object-contain mb-4"
              />
            )}
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {profile?.restaurantName || "QuickBill Restaurant"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profile?.address || "123 Foodie Lane, Gourmet City"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tax Invoice
            </p>
          </div>

          <div className="mb-4 text-gray-700 dark:text-gray-300">
            <p className="text-sm">
              <span className="font-semibold">Order ID:</span>{" "}
              <span className="font-mono text-xs">{id}</span>
            </p>
            <p className="text-sm">
              <span className="font-semibold">Billed to:</span> {customer.name}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Mobile:</span> {customer.mobile}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Date:</span>{" "}
              {new Date(date).toLocaleString()}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Payment:</span>{" "}
              {paymentMethod.toUpperCase()}
            </p>
          </div>

          {/* On-screen table, hidden from print */}
          <table className="w-full text-sm text-gray-800 dark:text-gray-200 no-print">
            <thead>
              <tr className="border-b-2 border-dashed border-gray-300 dark:border-gray-600">
                <th className="text-left font-semibold pb-2">Item</th>
                <th className="text-center font-semibold pb-2">Qty</th>
                <th className="text-right font-semibold pb-2">Price</th>
                <th className="text-right font-semibold pb-2">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {orderItems.map(({ item, quantity, selectedVariant }) => (
                <tr
                  key={`${item.id}-${selectedVariant.name}`}
                  className="border-b border-dashed border-gray-300 dark:border-gray-600"
                >
                  <td className="py-2">
                    {item.name}{" "}
                    <span className="text-xs">({selectedVariant.name})</span>
                  </td>
                  <td className="text-center">{quantity}</td>
                  <td className="text-right">
                    {(selectedVariant.price * currency.rate).toFixed(2)}
                  </td>
                  <td className="text-right">
                    {(selectedVariant.price * quantity * currency.rate).toFixed(
                      2
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Print-only list, hidden from screen */}
          <div className="hidden print-only-block text-xs">
            <div className="w-full border-t-2 border-dashed border-gray-300 dark:border-gray-600 my-2"></div>
            <div className="flex justify-between font-semibold">
              <span>Item</span>
              <span>Total</span>
            </div>
            <div className="w-full border-t border-dashed border-gray-300 dark:border-gray-600 my-1"></div>
            {orderItems.map(({ item, quantity, selectedVariant }) => (
              <div
                key={`${item.id}-${selectedVariant.name}-print`}
                className="my-1"
              >
                <div>
                  {item.name} ({selectedVariant.name})
                </div>
                <div className="flex justify-between">
                  <span className="pl-2">
                    {quantity} x{" "}
                    {(selectedVariant.price * currency.rate).toFixed(2)}
                  </span>
                  <span>
                    {(selectedVariant.price * quantity * currency.rate).toFixed(
                      2
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300 dark:border-gray-600 text-right text-sm text-gray-800 dark:text-gray-200">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>
                {currency.symbol}
                {(subtotal * currency.rate).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>
                {currency.symbol}
                {(tax * currency.rate).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base mt-1">
              <span>Total:</span>
              <span>
                {currency.symbol}
                {(total * currency.rate).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-gray-500 dark:text-gray-400">
            Thank you for your visit!
          </div>
        </div>

        <div className="no-print mt-8 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 font-medium w-full sm:w-auto"
          >
            Close
          </button>
          <button
            onClick={handleShareOnWhatsApp}
            disabled={!customer.mobile}
            title={
              !customer.mobile
                ? "Add a customer mobile number to share"
                : "Share on WhatsApp"
            }
            className="w-full sm:w-auto flex items-center justify-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.267.655 4.398 1.908 6.161l.217.324-1.283 4.685 4.792-1.251.34.205z" />
            </svg>
            Share
          </button>
          <button
            onClick={handlePrint}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium w-full sm:w-auto"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillModal;
