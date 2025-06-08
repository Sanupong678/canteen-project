<template>
  <div class="payment-container">
    <div class="payment-card">
      <h2 class="payment-title">Monthly Payment</h2>

      <div class="payment-tabs">
        <v-tabs v-model="selectedTab">
          <v-tab>Upload Slip</v-tab>
          <v-tab>Payment History</v-tab>
        </v-tabs>
      </div>

      <v-alert
        v-if="error"
        type="error"
        class="payment-alert"
      >
        {{ error }}
      </v-alert>

      <v-alert
        v-if="success"
        type="success"
        class="payment-alert"
      >
        {{ success }}
      </v-alert>

      <!-- Upload Slip Tab -->
      <div v-if="selectedTab === 0" class="payment-form">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Payment Month</label>
            <v-select
              v-model="selectedMonth"
              :items="months"
              label="Select Month"
              required
            ></v-select>
          </div>

          <div class="form-group">
            <label>Amount</label>
            <v-text-field
              v-model="amount"
              type="number"
              label="Enter Amount"
              required
            ></v-text-field>
          </div>

          <div class="form-group">
            <label>Payment Date</label>
            <v-text-field
              v-model="selectedDate"
              type="date"
              label="Select Date"
              required
            ></v-text-field>
          </div>

          <div class="form-group">
            <label>Upload Slip</label>
            <v-file-input
              v-model="slipFile"
              accept="image/*"
              label="Choose File"
              prepend-icon="mdi-camera"
              @change="handleFileChange"
              required
            ></v-file-input>
          </div>

          <div class="form-actions">
            <v-btn
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="loading"
            >
              Submit Payment
            </v-btn>
          </div>
        </form>
      </div>

      <!-- Payment History Tab -->
      <div v-else class="payment-history">
        <table class="payment-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Amount</th>
              <th>Payment Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in paymentHistory" :key="payment._id">
              <td>{{ payment.month }}</td>
              <td>{{ payment.amount }}</td>
              <td>{{ formatDate(payment.payment_date) }}</td>
              <td>
                <span
                  class="payment-status"
                  :class="{
                    'payment-status-pending': payment.status === 'pending',
                    'payment-status-confirmed': payment.status === 'confirmed',
                    'payment-status-rejected': payment.status === 'rejected'
                  }"
                >
                  {{ payment.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { format } from 'date-fns';

export default {
  name: 'PaymentUser',
  data() {
    return {
      selectedTab: 0,
      selectedMonth: '',
      amount: '',
      selectedDate: '',
      slipFile: null,
      loading: false,
      error: '',
      success: '',
      paymentHistory: [],
      months: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
    };
  },
  methods: {
    formatDate(date) {
      return format(new Date(date), 'dd/MM/yyyy');
    },
    handleFileChange(event) {
      this.slipFile = event.target.files[0];
    },
    async handleSubmit() {
      this.loading = true;
      this.error = '';
      this.success = '';

      const formData = new FormData();
      formData.append('month', this.selectedMonth);
      formData.append('amount', this.amount);
      formData.append('payment_date', this.selectedDate);
      formData.append('slip', this.slipFile);

      try {
        await axios.post('/api/payments/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        this.success = 'Payment slip uploaded successfully';
        this.resetForm();
        await this.fetchPaymentHistory();
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to upload payment slip';
      } finally {
        this.loading = false;
      }
    },
    resetForm() {
      this.selectedMonth = '';
      this.amount = '';
      this.selectedDate = '';
      this.slipFile = null;
    },
    async fetchPaymentHistory() {
      try {
        const response = await axios.get('/api/payments/history');
        this.paymentHistory = response.data.data;
      } catch (err) {
        this.error = 'Failed to fetch payment history';
      }
    }
  },
  mounted() {
    this.fetchPaymentHistory();
  }
};
</script>

<style scoped>
.payment-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.payment-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.payment-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
}

.payment-tabs {
  margin-bottom: 24px;
}

.payment-alert {
  margin-bottom: 24px;
}

.payment-form {
  max-width: 600px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #666;
}

.form-actions {
  margin-top: 24px;
}

.payment-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.payment-table th,
.payment-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.payment-table th {
  font-weight: 600;
  color: #666;
}

.payment-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.payment-status-pending {
  background: #fff3cd;
  color: #856404;
}

.payment-status-confirmed {
  background: #d4edda;
  color: #155724;
}

.payment-status-rejected {
  background: #f8d7da;
  color: #721c24;
}

@media (max-width: 600px) {
  .payment-container {
    padding: 10px;
  }

  .payment-card {
    padding: 16px;
  }

  .payment-table {
    display: block;
    overflow-x: auto;
  }
}
</style> 