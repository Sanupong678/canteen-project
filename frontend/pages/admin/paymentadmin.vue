<template>
  <div class="payment-management-container">
    <div class="payment-management-card">
      <h2 class="payment-management-title">Payment Management</h2>

      <div class="payment-search">
        <v-text-field
          v-model="searchTerm"
          label="Search by Shop ID or Month"
          prepend-icon="mdi-magnify"
        ></v-text-field>
      </div>

      <div class="payment-tabs">
        <v-tabs v-model="selectedTab">
          <v-tab>Pending</v-tab>
          <v-tab>Confirmed</v-tab>
          <v-tab>Rejected</v-tab>
        </v-tabs>
      </div>

      <v-alert
        v-if="error"
        type="error"
        class="payment-alert"
      >
        {{ error }}
      </v-alert>

      <table class="payment-table">
        <thead>
          <tr>
            <th v-for="header in headers" :key="header.value">
              {{ header.text }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in filteredPayments" :key="payment._id">
            <td>{{ payment.customId }}</td>
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
            <td>
              <v-btn
                v-if="payment.status === 'pending'"
                color="primary"
                small
                @click="openVerifyDialog(payment)"
              >
                Verify
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <v-dialog
      v-model="verifyDialogOpen"
      class="payment-verify-dialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>Verify Payment</v-card-title>
        <v-card-text class="payment-verify-dialog-content">
          <v-textarea
            v-model="adminComment"
            label="Admin Comment"
            rows="4"
          ></v-textarea>
        </v-card-text>
        <v-card-actions class="payment-verify-dialog-actions">
          <v-btn
            color="error"
            text
            @click="handleVerify('rejected')"
          >
            Reject
          </v-btn>
          <v-btn
            color="success"
            text
            @click="handleVerify('confirmed')"
          >
            Approve
          </v-btn>
          <v-btn
            text
            @click="verifyDialogOpen = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { format } from 'date-fns';

export default {
  name: 'PaymentAdmin',
  data() {
    return {
      payments: [],
      loading: false,
      error: '',
      searchTerm: '',
      selectedTab: 0,
      selectedPayment: null,
      verifyDialogOpen: false,
      adminComment: '',
      headers: [
        { text: 'Shop ID', value: 'customId' },
        { text: 'Month', value: 'month' },
        { text: 'Amount', value: 'amount' },
        { text: 'Payment Date', value: 'payment_date' },
        { text: 'Status', value: 'status' },
        { text: 'Actions', value: 'actions', sortable: false }
      ]
    };
  },
  computed: {
    filteredPayments() {
      let filtered = this.payments;
      
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        filtered = filtered.filter(payment => 
          payment.customId.toLowerCase().includes(searchLower) ||
          payment.month.includes(searchLower)
        );
      }

      if (this.selectedTab === 0) {
        filtered = filtered.filter(payment => payment.status === 'pending');
      } else if (this.selectedTab === 1) {
        filtered = filtered.filter(payment => payment.status === 'confirmed');
      } else if (this.selectedTab === 2) {
        filtered = filtered.filter(payment => payment.status === 'rejected');
      }

      return filtered;
    }
  },
  methods: {
    formatDate(date) {
      return format(new Date(date), 'dd/MM/yyyy');
    },
    async fetchPayments() {
      this.loading = true;
      try {
        const response = await axios.get('/api/payments/admin');
        this.payments = response.data.data;
      } catch (err) {
        this.error = 'Failed to fetch payments';
      } finally {
        this.loading = false;
      }
    },
    openVerifyDialog(payment) {
      this.selectedPayment = payment;
      this.verifyDialogOpen = true;
    },
    async handleVerify(status) {
      try {
        await axios.put(`/api/payments/admin/verify/${this.selectedPayment._id}`, {
          status,
          admin_comment: this.adminComment
        });
        this.verifyDialogOpen = false;
        this.adminComment = '';
        await this.fetchPayments();
      } catch (err) {
        this.error = 'Failed to verify payment';
      }
    }
  },
  mounted() {
    this.fetchPayments();
  }
};
</script>

<style scoped>
.payment-management-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.payment-management-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.payment-management-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
}

.payment-search {
  margin-bottom: 24px;
}

.payment-tabs {
  margin-bottom: 24px;
}

.payment-alert {
  margin-bottom: 24px;
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

.payment-verify-dialog-content {
  padding: 20px;
}

.payment-verify-dialog-actions {
  padding: 8px 16px;
  justify-content: flex-end;
}

@media (max-width: 600px) {
  .payment-management-container {
    padding: 10px;
  }

  .payment-management-card {
    padding: 16px;
  }

  .payment-table {
    display: block;
    overflow-x: auto;
  }
}
</style> 