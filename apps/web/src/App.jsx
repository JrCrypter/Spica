import { useEffect, useMemo, useState } from 'react';
import { api, API_URL } from './api';

function formatCurrency(amountCents, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format((amountCents || 0) / 100);
}

function SectionTabs({ value, onChange }) {
  const tabs = [
    ['dashboard', 'Dashboard'],
    ['invoices', 'Invoices'],
    ['bills', 'Bill payments'],
    ['recharges', 'Recharges'],
  ];

  return (
    <div className="tabs">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={value === key ? 'tab active' : 'tab'}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [billers, setBillers] = useState([]);
  const [utilityTransactions, setUtilityTransactions] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: 'INV-5001',
    customerId: '',
    amountCents: 250000,
    currency: 'usd',
    dueDate: ''
  });

  const [billFetchForm, setBillFetchForm] = useState({
    billerCode: '',
    accountNumber: ''
  });

  const [billPayForm, setBillPayForm] = useState({
    customerId: '',
    billerCode: '',
    accountNumber: '',
    amountCents: 0
  });

  const [billPreview, setBillPreview] = useState(null);

  const [rechargeForm, setRechargeForm] = useState({
    customerId: '',
    operatorCode: 'JIO',
    mobileNumber: '',
    amountCents: 19900
  });

  async function loadData() {
    setLoading(true);
    try {
      const [customerData, invoiceData, billerData, utilityData] = await Promise.all([
        api('/api/customers'),
        api('/api/invoices'),
        api('/api/utilities/billers'),
        api('/api/utilities/transactions')
      ]);

      setCustomers(customerData);
      setInvoices(invoiceData);
      setBillers(billerData);
      setUtilityTransactions(utilityData);

      if (invoiceData[0]) setSelectedInvoiceId(String(invoiceData[0].id));
      if (customerData[0]) {
        setInvoiceForm((prev) => ({ ...prev, customerId: String(customerData[0].id) }));
        setBillPayForm((prev) => ({ ...prev, customerId: String(customerData[0].id) }));
        setRechargeForm((prev) => ({ ...prev, customerId: String(customerData[0].id) }));
      }
      if (billerData[0]) {
        setBillFetchForm((prev) => ({ ...prev, billerCode: billerData[0].code }));
        setBillPayForm((prev) => ({ ...prev, billerCode: billerData[0].code }));
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedInvoice = useMemo(
    () => invoices.find((item) => String(item.id) === String(selectedInvoiceId)),
    [invoices, selectedInvoiceId]
  );

  async function createInvoice(e) {
    e.preventDefault();
    try {
      await api('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          ...invoiceForm,
          customerId: Number(invoiceForm.customerId),
          amountCents: Number(invoiceForm.amountCents)
        })
      });
      setNotice('Invoice created');
      await loadData();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function createCheckout() {
    if (!selectedInvoiceId) return;
    try {
      const data = await api('/api/payments/checkout-session', {
        method: 'POST',
        body: JSON.stringify({ invoiceId: Number(selectedInvoiceId) })
      });
      setNotice('Stripe checkout created');
      window.open(data.checkoutUrl, '_blank');
      await loadData();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function sendWhatsApp(type) {
    if (!selectedInvoiceId) return;
    const routes = {
      link: '/api/whatsapp/send-link',
      reminder: '/api/whatsapp/send-reminder',
      receipt: '/api/whatsapp/send-receipt'
    };
    try {
      await api(routes[type], {
        method: 'POST',
        body: JSON.stringify({ invoiceId: Number(selectedInvoiceId) })
      });
      setNotice(`WhatsApp ${type} sent`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function fetchRecommendation() {
    if (!selectedInvoiceId) return;
    try {
      const data = await api(`/api/invoices/${selectedInvoiceId}/recommendation`);
      setNotice(data.message);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function fetchBillPreview(e) {
    e.preventDefault();
    try {
      const data = await api('/api/utilities/bill/fetch', {
        method: 'POST',
        body: JSON.stringify(billFetchForm)
      });
      setBillPreview(data);
      setBillPayForm((prev) => ({
        ...prev,
        billerCode: data.billerCode,
        accountNumber: data.accountNumber,
        amountCents: data.amountCents
      }));
      setNotice('Bill fetched');
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function payBill() {
    try {
      await api('/api/utilities/bill/pay', {
        method: 'POST',
        body: JSON.stringify({
          ...billPayForm,
          customerId: Number(billPayForm.customerId),
          amountCents: Number(billPayForm.amountCents)
        })
      });
      setNotice('Bill paid successfully');
      await loadData();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function payRecharge(e) {
    e.preventDefault();
    try {
      await api('/api/utilities/recharge/pay', {
        method: 'POST',
        body: JSON.stringify({
          ...rechargeForm,
          customerId: Number(rechargeForm.customerId),
          amountCents: Number(rechargeForm.amountCents)
        })
      });
      setNotice('Recharge successful');
      await loadData();
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="logo-block">
          <div className="logo-mark">S</div>
          <div>
            <strong>SpicaPay</strong>
            <small>Collections + Payments + Utilities</small>
          </div>
        </div>

        <div className="side-section">
          <div className="side-label">Modules</div>
          <button className="side-pill active">Unified dashboard</button>
          <button className="side-pill">Invoices</button>
          <button className="side-pill">WhatsApp</button>
          <button className="side-pill">Bill pay</button>
          <button className="side-pill">Recharge</button>
        </div>

        <div className="side-card">
          <div className="side-label">API</div>
          <code>{API_URL}</code>
        </div>
      </aside>

      <main className="content">
        <header className="hero">
          <div>
            <div className="eyebrow">SpicaPay platform v2</div>
            <h1>Collections, WhatsApp conversion, bill payments, and recharges in one SaaS.</h1>
            <p>
              Run invoice recovery, payment orchestration, utility bill pay, and prepaid recharge
              from a single platform designed for businesses and distribution partners.
            </p>
          </div>
          <div className="hero-metrics">
            <div className="metric"><strong>{invoices.length}</strong><span>Invoices</span></div>
            <div className="metric"><strong>{utilityTransactions.length}</strong><span>Utility txns</span></div>
            <div className="metric"><strong>{customers.length}</strong><span>Customers</span></div>
          </div>
        </header>

        <SectionTabs value={view} onChange={setView} />

        {notice && <div className="notice">{notice}</div>}

        {view === 'dashboard' && (
          <>
            <section className="stats-grid">
              {[
                ['Pending invoices', String(invoices.filter(i => i.status !== 'paid').length)],
                ['Paid invoices', String(invoices.filter(i => i.status === 'paid').length)],
                ['Billers', String(billers.length)],
                ['Recharge / bill txns', String(utilityTransactions.length)],
              ].map(([label, value]) => (
                <div className="stat-card" key={label}>
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Recent utility transactions</h2>
                <span className="tag">Growth layer</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Type</th>
                      <th>Target</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilityTransactions.slice(0, 8).map((txn) => (
                      <tr key={txn.id}>
                        <td>{txn.transaction_ref}</td>
                        <td>{txn.type}</td>
                        <td>{txn.account_number || txn.mobile_number || txn.biller_code || txn.operator_code}</td>
                        <td>{formatCurrency(txn.amount_cents, txn.currency)}</td>
                        <td>{txn.status}</td>
                      </tr>
                    ))}
                    {!utilityTransactions.length && (
                      <tr><td colSpan="5">No utility transactions yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {view === 'invoices' && (
          <>
            <section className="grid two">
              <div className="panel">
                <div className="panel-head">
                  <h2>Create invoice</h2>
                  <span className="tag">Revenue</span>
                </div>
                <form onSubmit={createInvoice} className="form-grid">
                  <label>
                    Invoice number
                    <input value={invoiceForm.invoiceNumber} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })} />
                  </label>
                  <label>
                    Customer
                    <select value={invoiceForm.customerId} onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}>
                      <option value="">Select customer</option>
                      {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                    </select>
                  </label>
                  <label>
                    Amount (cents)
                    <input type="number" value={invoiceForm.amountCents} onChange={(e) => setInvoiceForm({ ...invoiceForm, amountCents: e.target.value })} />
                  </label>
                  <label>
                    Currency
                    <select value={invoiceForm.currency} onChange={(e) => setInvoiceForm({ ...invoiceForm, currency: e.target.value })}>
                      <option value="usd">USD</option>
                      <option value="inr">INR</option>
                    </select>
                  </label>
                  <label className="full">
                    Due date
                    <input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} />
                  </label>
                  <button className="primary full" type="submit">Create invoice</button>
                </form>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h2>Invoice actions</h2>
                  <span className="tag whatsapp">WhatsApp</span>
                </div>

                <label>
                  Choose invoice
                  <select value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)}>
                    <option value="">Select invoice</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} · {invoice.customer_name}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedInvoice ? (
                  <div className="invoice-summary">
                    <div><span>Invoice</span><strong>{selectedInvoice.invoice_number}</strong></div>
                    <div><span>Customer</span><strong>{selectedInvoice.customer_name}</strong></div>
                    <div><span>Amount</span><strong>{formatCurrency(selectedInvoice.amount_cents, selectedInvoice.currency)}</strong></div>
                    <div><span>Status</span><strong>{selectedInvoice.status}</strong></div>
                  </div>
                ) : (
                  <p className="muted">Select an invoice to generate payment and follow-up actions.</p>
                )}

                <div className="actions-grid">
                  <button className="primary" type="button" onClick={createCheckout}>Create Stripe checkout</button>
                  <button className="secondary" type="button" onClick={() => sendWhatsApp('link')}>Send payment link</button>
                  <button className="secondary" type="button" onClick={() => sendWhatsApp('reminder')}>Send reminder</button>
                  <button className="secondary" type="button" onClick={() => sendWhatsApp('receipt')}>Send receipt</button>
                  <button className="ghost full" type="button" onClick={fetchRecommendation}>AI recommendation</button>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Invoices dashboard</h2>
                <span className="tag">Collections</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Due date</th>
                      <th>Payment link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.invoice_number}</td>
                        <td>{invoice.customer_name}</td>
                        <td>{formatCurrency(invoice.amount_cents, invoice.currency)}</td>
                        <td>{invoice.status}</td>
                        <td>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</td>
                        <td>{invoice.payment_link ? <a href={invoice.payment_link} target="_blank" rel="noreferrer">Open</a> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {view === 'bills' && (
          <section className="grid two">
            <div className="panel">
              <div className="panel-head">
                <h2>Fetch bill</h2>
                <span className="tag">BBPS-ready</span>
              </div>
              <form onSubmit={fetchBillPreview} className="form-grid">
                <label className="full">
                  Biller
                  <select value={billFetchForm.billerCode} onChange={(e) => setBillFetchForm({ ...billFetchForm, billerCode: e.target.value })}>
                    <option value="">Select biller</option>
                    {billers.map((biller) => <option key={biller.id} value={biller.code}>{biller.name}</option>)}
                  </select>
                </label>
                <label className="full">
                  Account / consumer number
                  <input value={billFetchForm.accountNumber} onChange={(e) => setBillFetchForm({ ...billFetchForm, accountNumber: e.target.value })} placeholder="Enter consumer number" />
                </label>
                <button className="primary full" type="submit">Fetch bill</button>
              </form>

              {billPreview && (
                <div className="bill-preview">
                  <div><span>Biller</span><strong>{billPreview.billerCode}</strong></div>
                  <div><span>Account</span><strong>{billPreview.accountNumber}</strong></div>
                  <div><span>Amount</span><strong>{formatCurrency(billPreview.amountCents, billPreview.currency)}</strong></div>
                  <div><span>Due</span><strong>{billPreview.dueDate}</strong></div>
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>Pay bill</h2>
                <span className="tag whatsapp">Utility payment</span>
              </div>
              <div className="form-grid">
                <label>
                  Customer
                  <select value={billPayForm.customerId} onChange={(e) => setBillPayForm({ ...billPayForm, customerId: e.target.value })}>
                    <option value="">Select customer</option>
                    {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </label>
                <label>
                  Biller code
                  <input value={billPayForm.billerCode} onChange={(e) => setBillPayForm({ ...billPayForm, billerCode: e.target.value })} />
                </label>
                <label>
                  Account number
                  <input value={billPayForm.accountNumber} onChange={(e) => setBillPayForm({ ...billPayForm, accountNumber: e.target.value })} />
                </label>
                <label>
                  Amount (cents)
                  <input type="number" value={billPayForm.amountCents} onChange={(e) => setBillPayForm({ ...billPayForm, amountCents: e.target.value })} />
                </label>
                <button className="primary full" type="button" onClick={payBill}>Pay bill</button>
              </div>
            </div>
          </section>
        )}

        {view === 'recharges' && (
          <>
            <section className="panel">
              <div className="panel-head">
                <h2>Mobile recharge</h2>
                <span className="tag">Distribution</span>
              </div>
              <form onSubmit={payRecharge} className="form-grid">
                <label>
                  Customer
                  <select value={rechargeForm.customerId} onChange={(e) => setRechargeForm({ ...rechargeForm, customerId: e.target.value })}>
                    <option value="">Select customer</option>
                    {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </label>
                <label>
                  Operator
                  <select value={rechargeForm.operatorCode} onChange={(e) => setRechargeForm({ ...rechargeForm, operatorCode: e.target.value })}>
                    <option value="JIO">Jio</option>
                    <option value="AIRTEL">Airtel</option>
                    <option value="VI">VI</option>
                    <option value="BSNL">BSNL</option>
                  </select>
                </label>
                <label>
                  Mobile number
                  <input value={rechargeForm.mobileNumber} onChange={(e) => setRechargeForm({ ...rechargeForm, mobileNumber: e.target.value })} placeholder="Enter mobile number" />
                </label>
                <label>
                  Amount (cents)
                  <input type="number" value={rechargeForm.amountCents} onChange={(e) => setRechargeForm({ ...rechargeForm, amountCents: e.target.value })} />
                </label>
                <button className="primary full" type="submit">Recharge now</button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Utility transaction ledger</h2>
                <span className="tag">All channels</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Type</th>
                      <th>Customer</th>
                      <th>Target</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilityTransactions.map((txn) => (
                      <tr key={txn.id}>
                        <td>{txn.transaction_ref}</td>
                        <td>{txn.type}</td>
                        <td>{txn.customer_name || '—'}</td>
                        <td>{txn.mobile_number || txn.account_number || txn.operator_code || txn.biller_code}</td>
                        <td>{formatCurrency(txn.amount_cents, txn.currency)}</td>
                        <td>{txn.status}</td>
                      </tr>
                    ))}
                    {!utilityTransactions.length && <tr><td colSpan="6">No transactions yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {loading && <div className="loading">Loading data…</div>}
      </main>
    </div>
  );
}
