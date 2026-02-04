// Stripe Payment Utilities for Music ConnectZ
// Handles payment processing, checkout, and transaction history

class PaymentManager {
  constructor(stripePublishableKey) {
    this.stripe = null;
    this.stripePublishableKey = stripePublishableKey;
    this.init();
  }

  /**
   * Initialize Stripe
   */
  init() {
    if (typeof Stripe === 'undefined') {
      console.error('Stripe.js not loaded');
      return;
    }

    if (!this.stripePublishableKey) {
      console.error('Stripe publishable key not provided');
      return;
    }

    this.stripe = Stripe(this.stripePublishableKey);
    console.log('Stripe initialized successfully');
  }

  /**
   * Create checkout session and redirect to Stripe
   */
  async createCheckoutSession(amount, userId) {
    try {
      // Validate amount
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Show loading state
      this.showLoading('Processing payment...');

      // Create checkout session on server
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: 'usd',
          userId: userId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const session = await response.json();

      // Redirect to Stripe Checkout
      const result = await this.stripe.redirectToCheckout({
        sessionId: session.sessionId
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      this.hideLoading();
      this.showError(error.message);
      throw error;
    }
  }

  /**
   * Handle payment form submission
   */
  setupPaymentForm(formId, userId) {
    const form = document.getElementById(formId);
    if (!form) {
      console.error(`Form #${formId} not found`);
      return;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const amountInput = form.querySelector('[name="amount"]');
      if (!amountInput) {
        this.showError('Amount field not found');
        return;
      }

      const amount = amountInput.value;

      try {
        await this.createCheckoutSession(amount, userId);
      } catch (error) {
        // Error already handled in createCheckoutSession
      }
    });
  }

  /**
   * Fetch transaction history
   */
  async getTransactionHistory(userId, limit = 10) {
    try {
      const response = await fetch(
        `/api/payments/transaction-history?userId=${userId}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }

      const data = await response.json();
      return data.transactions;
    } catch (error) {
      console.error('Transaction history error:', error);
      throw error;
    }
  }

  /**
   * Display transaction history
   */
  async displayTransactionHistory(userId, containerId, limit = 10) {
    try {
      this.showLoading('Loading transactions...');
      
      const transactions = await this.getTransactionHistory(userId, limit);
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.error(`Container #${containerId} not found`);
        return;
      }

      if (transactions.length === 0) {
        container.innerHTML = '<p class="no-transactions">No transactions found</p>';
        this.hideLoading();
        return;
      }

      const html = transactions.map(txn => this.renderTransaction(txn)).join('');
      container.innerHTML = `
        <div class="transaction-list">
          ${html}
        </div>
      `;

      this.hideLoading();
    } catch (error) {
      this.showError('Failed to load transaction history');
      this.hideLoading();
    }
  }

  /**
   * Render single transaction
   */
  renderTransaction(txn) {
    const date = new Date(txn.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusClass = txn.status === 'succeeded' ? 'success' : 
                       txn.status === 'pending' ? 'pending' : 'failed';

    return `
      <div class="transaction-item" data-txn-id="${txn.id}">
        <div class="transaction-header">
          <div class="transaction-date">${date}</div>
          <div class="transaction-status ${statusClass}">${txn.status}</div>
        </div>
        <div class="transaction-body">
          <div class="transaction-description">${txn.description}</div>
          <div class="transaction-amount">$${txn.amount.toFixed(2)}</div>
        </div>
        <div class="transaction-footer">
          <div class="transaction-method">
            ${txn.paymentMethod === 'card' ? '💳' : '💰'} 
            ${txn.paymentMethod} ${txn.last4 ? `•••• ${txn.last4}` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Calculate net income with tax deductions
   */
  calculateNetIncome(grossIncome, taxRate = 0.25) {
    const tax = grossIncome * taxRate;
    const netIncome = grossIncome - tax;
    
    return {
      gross: grossIncome,
      tax: tax,
      net: netIncome,
      taxRate: taxRate * 100
    };
  }

  /**
   * Display income breakdown
   */
  displayIncomeBreakdown(grossIncome, containerId, taxRate = 0.25) {
    const income = this.calculateNetIncome(grossIncome, taxRate);
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    container.innerHTML = `
      <div class="income-breakdown">
        <div class="income-item">
          <span class="income-label">Gross Income:</span>
          <span class="income-value">$${income.gross.toFixed(2)}</span>
        </div>
        <div class="income-item tax">
          <span class="income-label">Tax (${income.taxRate}%):</span>
          <span class="income-value">-$${income.tax.toFixed(2)}</span>
        </div>
        <div class="income-item total">
          <span class="income-label">Net Income:</span>
          <span class="income-value">$${income.net.toFixed(2)}</span>
        </div>
      </div>
    `;
  }

  /**
   * Handle successful payment callback
   */
  handlePaymentSuccess(sessionId) {
    this.showSuccess('Payment successful! Your wallet has been updated.');
    
    // Trigger custom event
    const event = new CustomEvent('paymentSuccess', {
      detail: { sessionId: sessionId }
    });
    window.dispatchEvent(event);
  }

  /**
   * Handle cancelled payment
   */
  handlePaymentCancelled() {
    this.showWarning('Payment was cancelled. You can try again anytime.');
  }

  /**
   * Check URL for payment status
   */
  checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (payment === 'success' && sessionId) {
      this.handlePaymentSuccess(sessionId);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === 'cancelled') {
      this.handlePaymentCancelled();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  /**
   * Show loading indicator
   */
  showLoading(message = 'Loading...') {
    let loader = document.getElementById('payment-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'payment-loader';
      loader.className = 'payment-loader';
      document.body.appendChild(loader);
    }
    loader.innerHTML = `
      <div class="loader-content">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
    loader.style.display = 'flex';
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    const loader = document.getElementById('payment-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showToast(message, 'error');
  }

  /**
   * Show warning message
   */
  showWarning(message) {
    this.showToast(message, 'warning');
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  /**
   * Format currency
   */
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Validate amount
   */
  validateAmount(amount, min = 1, max = 10000) {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      return { valid: false, error: 'Please enter a valid amount' };
    }
    
    if (numAmount < min) {
      return { valid: false, error: `Amount must be at least $${min}` };
    }
    
    if (numAmount > max) {
      return { valid: false, error: `Amount cannot exceed $${max}` };
    }
    
    return { valid: true };
  }
}

// Export for use in main app
if (typeof window !== 'undefined') {
  window.PaymentManager = PaymentManager;
}
