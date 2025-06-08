import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

export const shopService = {
  // Get all C5 shops
  async getC5Shops() {
    try {
      const response = await axios.get(`${API_URL}/shops/c5`);
      return response.data;
    } catch (error) {
      console.error('Error fetching C5 shops:', error);
      throw error;
    }
  },

  // Get all D1 shops
  async getD1Shops() {
    try {
      const response = await axios.get(`${API_URL}/shops/d1`);
      return response.data;
    } catch (error) {
      console.error('Error fetching D1 shops:', error);
      throw error;
    }
  },

  // Get all Dormity shops
  async getDormityShops() {
    try {
      const response = await axios.get(`${API_URL}/shops/dormity`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Dormity shops:', error);
      throw error;
    }
  },
  //get all e1 shops
  async getE1Shops() {
    try {
      const response = await axios.get(`${API_URL}/shops/e1`);
      return response.data;
    } catch (error) {
      console.error('Error fetching E1 shops:', error);
      throw error;
    }
  },  
  // Get all E2 shops
  async getE2Shops() {
    try {
      const response = await axios.get(`${API_URL}/shops/e2`);
      return response.data;
    } catch (error) {
      console.error('Error fetching E2 shops:', error);
      throw error;
    }
  },
  //get all epark shops
  async getEparkShops() {
    try {
      const response = await axios.get(`${API_URL}/shops/epark`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Epark shops:', error);
      throw error;
    }
  },
  //get all msquare shops
  async getMsquareShops() {
    try {
      const response = await axios.get(`${API_URL}/shops/msquare`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Msquare shops:', error);
      throw error;
    }
  },
  //get all ruemrim shops
  async getRuemRimShops() {
    try {
      const response = await axios.get(`${API_URL}/shops/ruemrim`);
      return response.data;
    } catch (error) {
      console.error('Error fetching RuemRim shops:', error);
      throw error;
    }
  },
  //get all S2 shops  
  async getS2Shops() {
    try {
      const response = await axios.get(`${API_URL}/shops/s2`);
      return response.data;
    } catch (error) {
      console.error('Error fetching S2 shops:', error);
      throw error;
    }
  },
  // Create new shop
  async createShop(shopData) {
    try {
      const response = await axios.post(`${API_URL}/shops`, shopData);
      return response.data;
    } catch (error) {
      console.error('Error creating shop:', error);
      throw error;
    }
  },

  // Update shop
  async updateShop(id, shopData) {
    try {
      const response = await axios.put(`${API_URL}/shops/${id}`, shopData);
      return response.data;
    } catch (error) {
      console.error('Error updating shop:', error);
      throw error;
    }
  },

  // Delete shop
  async deleteShop(id) {
    try {
      const response = await axios.delete(`${API_URL}/shops/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting shop:', error);
      throw error;
    }
  },

  // Get single shop
  async getShop(id) {
    try {
      const response = await axios.get(`${API_URL}/shops/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching shop:', error);
      throw error;
    }
  },

  // Update shop password
  async updatePassword(id, password) {
    try {
      const response = await axios.patch(`${API_URL}/shops/${id}/password`, { password });
      return response.data;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
};