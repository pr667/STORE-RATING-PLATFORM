import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField,
} from '@mui/material';
import api, { getErrorMessage } from '../../api/client';
import { decodeEntities } from '../../utils/format';
import { ROLES, roleLabels } from '../../utils/roles';
import type { Role } from '../../types';
import type { AdminUser } from '../../types/admin';

// Same password rule as the backend's validation.js
const passwordRule = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/;

const schema = yup.object({
  name: yup.string().trim().min(20, 'Name must be at least 20 characters').max(60, 'Name must be at most 60 characters').required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  address: yup.string().max(400, 'Address must be at most 400 characters').required('Address is required'),
  // The password is only checked when creating a user (see context.mode)
  password: yup
    .string()
    .default('')
    .test('password-rules', 'Invalid password', function (value) {
      if (this.options.context?.mode !== 'create') return true;
      const v = value ?? '';
      if (v.length < 8 || v.length > 16) {
        return this.createError({ message: 'Password must be 8–16 characters' });
      }
      if (!passwordRule.test(v)) {
        return this.createError({ message: 'Include at least one uppercase letter and one special character' });
      }
      return true;
    }),
});
type UserForm = yup.InferType<typeof schema>;

interface Props {
  mode: 'create' | 'edit';
  user?: AdminUser;
  isSelf?: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function UserDialog({ mode, user, isSelf = false, onClose, onSaved }: Props) {
  const [role, setRole] = useState<Role>(user?.role ?? 'NORMAL_USER');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserForm>({
    resolver: yupResolver(schema),
    context: { mode },
    defaultValues: {
      name: decodeEntities(user?.name),
      email: user?.email ?? '',
      address: decodeEntities(user?.address),
      password: '',
    },
  });

  const field = (name: keyof UserForm) => {
    const { ref, ...rest } = register(name);
    return {
      ...rest,
      inputRef: ref,
      error: !!errors[name],
      helperText: errors[name]?.message,
    };
  };

  const onSubmit = async (values: UserForm) => {
    setServerError(null);
    try {
      if (mode === 'create') {
        await api.post('/admin/users', {
          name: values.name,
          email: values.email,
          password: values.password,
          address: values.address,
          role,
        });
        onSaved('User created');
      } else {
        await api.put(`/users/${user!.id}`, {
          name: values.name,
          email: values.email,
          address: values.address,
          role,
        });
        onSaved('User updated');
      }
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'create' ? 'Add user' : 'Edit user'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <TextField label="Full name" fullWidth {...field('name')} />
          <TextField label="Email" type="email" fullWidth {...field('email')} />
          <TextField label="Address" multiline minRows={2} fullWidth {...field('address')} />

          {mode === 'create' && (
            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              fullWidth
              {...field('password')}
              helperText={errors.password?.message ?? '8–16 characters, one uppercase letter, one special character'}
            />
          )}

          <TextField
            select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={isSelf}
            helperText={isSelf ? "You can't change your own role" : undefined}
            fullWidth
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {roleLabels[r]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
