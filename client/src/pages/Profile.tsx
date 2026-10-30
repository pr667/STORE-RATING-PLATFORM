import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Alert, Button, Divider, Paper, Stack, TextField, Typography,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api, { getErrorMessage } from '../api/client';
import { decodeEntities } from '../utils/format';

// Same password rule as the backend's validation.js
const passwordRule = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/;

const schema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must be at most 16 characters')
    .matches(passwordRule, 'Include at least one uppercase letter and one special character')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm your new password'),
});
type PasswordForm = yup.InferType<typeof schema>;

const roleLabels = {
  NORMAL_USER: 'Normal user',
  STORE_OWNER: 'Store owner',
  SYSTEM_ADMIN: 'System admin',
} as const;

export default function Profile() {
  const { user } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: yupResolver(schema) });

  const field = (name: keyof PasswordForm) => {
    const { ref, ...rest } = register(name);
    return {
      ...rest,
      inputRef: ref,
      error: !!errors[name],
      helperText: errors[name]?.message,
    };
  };

  const onSubmit = async (values: PasswordForm) => {
    setServerError(null);
    setSuccess(false);
    try {
      // The backend expects all three fields
      await api.post('/auth/change-password', values);
      setSuccess(true);
      reset();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  if (!user) return null;

  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <Typography variant="h4">Profile</Typography>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography><strong>Name:</strong> {decodeEntities(user.name)}</Typography>
          <Typography><strong>Email:</strong> {user.email}</Typography>
          <Typography><strong>Address:</strong> {decodeEntities(user.address)}</Typography>
          <Typography><strong>Role:</strong> {roleLabels[user.role]}</Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Change password
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            {success && <Alert severity="success">Password updated successfully.</Alert>}

            <TextField label="Current password" type="password" autoComplete="current-password" fullWidth {...field('currentPassword')} />
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              fullWidth
              {...field('newPassword')}
              helperText={errors.newPassword?.message ?? '8–16 characters, one uppercase letter, one special character'}
            />
            <TextField label="Confirm new password" type="password" autoComplete="new-password" fullWidth {...field('confirmPassword')} />

            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update password'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}