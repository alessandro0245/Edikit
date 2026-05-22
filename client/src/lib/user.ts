import axios from 'axios';
import { baseUrl } from '@/utils/constant';

export const userApi = {
  updateProfile: async (data: { fullName?: string; avatar?: string }) => {
    try {
      const response = await axios.put(`${baseUrl}/user/profile`, data, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  updatePassword: async (currentPassword: string | undefined, newPassword: string) => {
    try {
      const response = await axios.put(
        `${baseUrl}/user/password`,
        { currentPassword, newPassword },
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },

  deleteAccount: async () => {
    try {
      const response = await axios.delete(`${baseUrl}/user/account`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  },
};
