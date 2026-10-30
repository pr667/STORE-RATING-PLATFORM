import { useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Alert, Button, Container, Link, Paper, Stack, TextField, Typography,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../api/client';
import { homePathForRole } from '../utils/roles';

// These rules mirror the backend's validation.js exactly
const passwordRule = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/;

const schema = yup.object({
  name: yup.string().trim().min(20, 'Name must be at least 20 characters').max(60, 'Name must be at most 60 characters').required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  address: yup.string().max(400, 'Address must be at most 400 characters').required('Address is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must be at most 16 characters')
    .matches(passwordRule, 'Include at least one uppercase letter and one special character')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});
type RegisterForm = yup.InferType<typeof schema>;

export default function Register() {
  const { user, register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: yupResolver(schema) });

  const field = (name: keyof RegisterForm) => {
    const { ref, ...rest } = register(name);
    return {
      ...rest,
      inputRef: ref,
      error: !!errors[name],
      helperText: errors[name]?.message,
    };
  };

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    try {
      // confirmPassword is only for the form; the backend doesn't need it
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        address: values.address,
      });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  if (user) return <Navigate to={homePathForRole(user.role)} replace />;

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Create an account
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <TextField label="Full name" fullWidth {...field('name')} />
            <TextField label="Email" type="email" autoComplete="email" fullWidth {...field('email')} />
            <TextField label="Address" multiline minRows={2} fullWidth {...field('address')} />
            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              fullWidth
              {...field('password')}
              helperText={errors.password?.message ?? '8–16 characters, one uppercase letter, one special character'}
            />
            <TextField label="Confirm password" type="password" autoComplete="new-password" fullWidth {...field('confirmPassword')} />

            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Sign up'}
            </Button>

            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">
                Log in
              </Link>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
