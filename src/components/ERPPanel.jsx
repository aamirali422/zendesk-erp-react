// src/components/ERPPanel.jsx
export default function ERPPanel({ erp }) {
  if (!erp) return null;

  const {
    orderId,
    status,
    customer,
    items = [],
    totals,
    shipments = [],
    invoices = [],
  } = erp;

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold">ERP Panel (Read-only)</h3>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
            ${status === "Shipped" ? "bg-green-100 text-green-700" :
              status === "Processing" ? "bg-blue-100 text-blue-700" :
              status === "Pending" ? "bg-amber-100 text-amber-700" :
              "bg-gray-100 text-gray-700"}`}
        >
          {status}
        </span>
      </div>

      {/* Order summary */}
      <div className="mb-3 rounded-lg bg-gray-50 p-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-500">Order ID</div>
            <div className="font-medium">{orderId}</div>
          </div>
          <div>
            <div className="text-gray-500">Customer</div>
            <div className="font-medium">
              {customer?.name || "-"}
              <div className="text-gray-500 text-xs">{customer?.email || "-"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4">
        <div className="mb-2 text-sm font-semibold">Items</div>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-start justify-between rounded-lg border p-2">
              <div className="text-sm">
                <div className="font-medium">{it.name || it.sku}</div>
                <div className="text-gray-500 text-xs">SKU: {it.sku}</div>
              </div>
              <div className="text-sm">× {it.qty}</div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-gray-500">No items.</div>
          )}
        </div>
      </div>

      {/* Totals */}
      {totals && (
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border p-2 text-sm">
          <div className="text-gray-500">Subtotal</div>
          <div className="text-right font-medium">{totals.subtotal}</div>
          <div className="text-gray-500">Shipping</div>
          <div className="text-right font-medium">{totals.shipping}</div>
          <div className="col-span-2 border-t pt-2 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">{totals.total}</span>
          </div>
        </div>
      )}

      {/* Shipments */}
      <div className="mb-4">
        <div className="mb-2 text-sm font-semibold">Shipments</div>
        <div className="space-y-2">
          {shipments.map((s, i) => (
            <div key={i} className="rounded-lg border p-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{s.id}</span>
                <span className="text-gray-500">{s.carrier}</span>
              </div>
              <div className="text-gray-600">
                Tracking: <span className="font-medium">{s.tracking || "-"}</span>
              </div>
              {s.eta && <div className="text-gray-600">ETA: {s.eta}</div>}
            </div>
          ))}
          {shipments.length === 0 && (
            <div className="text-sm text-gray-500">No shipments.</div>
          )}
        </div>
      </div>

      {/* Invoices */}
      <div>
        <div className="mb-2 text-sm font-semibold">Invoices</div>
        <ul className="space-y-2">
          {invoices.map((inv, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <span className="font-medium">{inv.id}</span>
              <span className="text-gray-600">{inv.amount}</span>
            </li>
          ))}
          {(!invoices || invoices.length === 0) && (
            <li className="text-sm text-gray-500">No invoices.</li>
          )}
        </ul>
      </div>
    </aside>
  );
}
