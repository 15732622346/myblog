import request from '../utils/request';

export interface UpdateProfileData {
  email?: string;
  nickname?: string;
  bio?: string;
  avatar?: string;
}

export const updateProfile = async (data: UpdateProfileData) => {
  const response = await request.patch('/users/profile', data);
  return response.data;
};

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export const changePassword = async (data: ChangePasswordData) => {
  const response = await request.post('/users/change-password', data);
  return response.data;
}; 