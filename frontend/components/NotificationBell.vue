<template>
  <div class="notification-bell">
    <!-- Bell Icon with Badge -->
    <v-badge
      :content="unreadCount"
      :value="unreadCount > 0"
      color="error"
      overlap
    >
      <v-btn
        icon
        @click="toggleNotifications"
      >
        <v-icon>mdi-bell</v-icon>
      </v-btn>
    </v-badge>

    <!-- Notification Popup -->
    <v-menu
      v-model="showNotifications"
      :close-on-content-click="false"
      :nudge-width="300"
      offset-y
      max-width="400"
    >
      <v-card>
        <v-card-title class="d-flex justify-space-between">
          <span>การแจ้งเตือน</span>
          <v-btn
            v-if="unreadCount > 0"
            text
            small
            color="primary"
            @click="markAllAsRead"
          >
            อ่านทั้งหมด
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-list
          three-line
          max-height="400"
          class="overflow-y-auto"
        >
          <template v-if="notifications.length > 0">
            <v-list-item
              v-for="notification in notifications"
              :key="notification._id"
              :class="{ 'unread': !notification.isRead }"
              @click="markAsRead(notification._id)"
            >
              <v-list-item-content>
                <v-list-item-title class="font-weight-medium">
                  {{ notification.title }}
                </v-list-item-title>
                <v-list-item-subtitle style="white-space: pre-line;">
                  {{ notification.message }}
                </v-list-item-subtitle>
                <v-list-item-subtitle class="text-caption">
                  {{ formatDate(notification.createdAt) }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>
          <v-list-item v-else>
            <v-list-item-content>
              <v-list-item-title class="text-center">
                ไม่มีการแจ้งเตือน
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: 'NotificationBell',
  
  data: () => ({
    showNotifications: false,
    notifications: [],
    unreadCount: 0,
    polling: null
  }),

  created() {
    this.fetchNotifications();
    // Poll for new notifications every minute
    this.polling = setInterval(this.fetchNotifications, 60000);
  },

  beforeDestroy() {
    if (this.polling) {
      clearInterval(this.polling);
    }
  },

  methods: {
    async fetchNotifications() {
      try {
        console.log('🔄 Fetching notifications...');
        const response = await this.$axios.get('/api/notifications/user');
        console.log('📊 API Response:', response.data);
        
        this.notifications = response.data.data || [];
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
        
        console.log('📋 Notifications loaded:', this.notifications.length);
        console.log('📋 Unread count:', this.unreadCount);
        console.log('📋 Notifications:', this.notifications.map(n => ({
          id: n._id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt
        })));
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        if (error.response) {
          console.error('Server error:', error.response.data);
        }
      }
    },

    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
    },

    async markAsRead(notificationId) {
      try {
        await this.$axios.put(`/api/notifications/${notificationId}/read`);
        await this.fetchNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    },

    async markAllAsRead() {
      try {
        await this.$axios.put('/api/notifications/read-all');
        await this.fetchNotifications();
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.unread {
  background-color: #f5f5f5;
}

.v-list {
  padding: 0;
}

.v-list-item {
  border-bottom: 1px solid #e0e0e0;
}

.v-list-item:last-child {
  border-bottom: none;
}
</style> 