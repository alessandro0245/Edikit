import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/user';
import { setUser, clearUser } from '@/redux/slices/authSlice';
import type { AppDispatch } from '@/redux/store';

export function useProfileSettings(initialUsername: string, initialEmail: string) {
  const [name, setName] = useState(initialUsername);
  const [emailValue, setEmailValue] = useState(initialEmail);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  useEffect(() => {
    setName(initialUsername);
    setEmailValue(initialEmail);
  }, [initialUsername, initialEmail]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (!name) {
      setError('Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await userApi.updateProfile({ fullName: name });
      dispatch(setUser(updatedUser));
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
   
      try {
        await userApi.deleteAccount();
        // Clear tokens from local storage if any
        localStorage.removeItem('user_token');
        // Clear redux state
        dispatch(clearUser());
        // Redirect to home/login
        router.push('/');
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to delete account');
      }
    
  };

  return {
    name,
    setName,
    emailValue,
    setEmailValue,
    isSaving,
    error,
    success,
    handleSave,
    handleDeleteAccount,
  };
}
