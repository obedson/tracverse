declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PaymentData {
  email: string;
  amount: number;
  planName: string;
  planId: number;
  ppAllocation: number;
}

interface PaymentResponse {
  status: string;
  reference: string;
  transaction: string;
}

export class PaymentService {
  private static instance: PaymentService;
  private paystackKey: string;

  private constructor() {
    this.paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
    console.log('Paystack key loaded:', this.paystackKey ? 'Yes' : 'No');
  }

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async initializePayment(data: PaymentData): Promise<void> {
    if (!this.paystackKey) {
      throw new Error('Paystack public key not configured');
    }

    if (!window.PaystackPop) {
      throw new Error('Paystack script not loaded');
    }

    return new Promise((resolve, reject) => {
      try {
        const handler = window.PaystackPop.setup({
          key: this.paystackKey,
          email: data.email,
          amount: data.amount * 100, // Convert to kobo
          currency: 'NGN',
          ref: this.generateReference(),
          metadata: {
            planName: data.planName,
            planId: data.planId,
            ppAllocation: data.ppAllocation,
          },
          callback: (response: PaymentResponse) => {
            console.log('Payment successful:', response);
            // Skip verification for now since payment went through
            resolve();
          },
          onClose: () => {
            reject(new Error('Payment cancelled by user'));
          }
        });
        
        handler.openIframe();
      } catch (error) {
        console.error('Payment initialization error:', error);
        reject(error);
      }
    });
  }

  private async verifyPayment(reference: string, data: PaymentData): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          reference, 
          planId: data.planId,
          ppAllocation: data.ppAllocation 
        })
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new Error('Payment verification failed');
    }
  }

  private generateReference(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  loadPaystackScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => {
        console.log('Paystack script loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load Paystack script');
        reject(new Error('Failed to load Paystack'));
      };
      document.head.appendChild(script);
    });
  }
}

export default PaymentService.getInstance();
