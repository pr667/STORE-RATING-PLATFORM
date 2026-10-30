import { useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Alert, Button, Container, Link, Paper, Stack, TextField, Typography,
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../api/client';
import { homePathForRole } from '../utils/roles';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});
type LoginForm = yup.InferType<typeof schema>;

export default function Login() {
  const { user, login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: yupResolver(schema) });

  // Helper: wires a form field to React Hook Form + MUI error display
  const field = (name: keyof LoginForm) => {
    const { ref, ...rest } = register(name);
    return {
      ...rest,
      inputRef: ref,
      error: !!errors[name],
      helperText: errors[name]?.message,
    };
  };

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  // Already logged in? Go to your home page.
  if (user) return <Navigate to={homePathForRole(user.role)} replace />;

  return (
    <Container maxWidth="xs" sx={{ mt: { xs: 6, sm: 9 } }}>
      <Stack
        component="header"
        direction="row"
        spacing={1.25}
        sx={{ alignItems: 'center', justifyContent: 'center', mb: 3 }}
      >
        <StorefrontOutlinedIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" component="h1" fontWeight={700} color="primary.main">
          Store Rating Platform
        </Typography>
      </Stack>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Log in
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <TextField label="Email" type="email" autoComplete="email" fullWidth {...field('email')} />
            <TextField label="Password" type="password" autoComplete="current-password" fullWidth {...field('password')} />

            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </Button>

            <Typography variant="body2">
              New here?{' '}
              <Link component={RouterLink} to="/register">
                Create an account
              </Link>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
