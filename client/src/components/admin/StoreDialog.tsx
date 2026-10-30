import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField,
} from '@mui/material';
import api, { getErrorMessage } from '../../api/client';
import { decodeEntities } from '../../utils/format';
import type { AdminStore, StoreOwner } from '../../types/admin';

const schema = yup.object({
  name: yup.string().min(20, 'Store name must be at least 20 characters').max(60, 'Store name must be at most 60 characters').required('Store name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  address: yup.string().max(400, 'Address must be at most 400 characters').required('Address is required'),
});
type StoreForm = yup.InferType<typeof schema>;

interface Props {
  mode: 'create' | 'edit';
  store?: AdminStore;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function StoreDialog({ mode, store, onClose, onSaved }: Props) {
  const [owners, setOwners] = useState<StoreOwner[]>([]);
  const [ownerId, setOwnerId] = useState<number | ''>('');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StoreForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: decodeEntities(store?.name),
      email: store?.email ?? '',
      address: decodeEntities(store?.address),
    },
  });

  // When creating, load the store owners who don't have a store yet
  useEffect(() => {
    if (mode !== 'create') return;
    api
      .get<{ storeOwners: StoreOwner[] }>('/admin/store-owners')
      .then((res) => setOwners(res.data.storeOwners))
      .catch((err) => setServerError(getErrorMessage(err)));
  }, [mode]);

  const field = (name: keyof StoreForm) => {
    const { ref, ...rest } = register(name);
    return {
      ...rest,
      inputRef: ref,
      error: !!errors[name],
      helperText: errors[name]?.message,
    };
  };

  const onSubmit = async (values: StoreForm) => {
    setServerError(null);
    try {
      if (mode === 'create') {
        // Leave ownerId out entirely when no owner is chosen
        await api.post('/stores', { ...values, ownerId: ownerId || undefined });
        onSaved('Store created');
      } else {
        await api.put(`/stores/${store!.id}`, values);
        onSaved('Store updated');
      }
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'create' ? 'Add store' : 'Edit store'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <TextField
            label="Store name"
            fullWidth
            {...field('name')}
            helperText={errors.name?.message ?? '20–60 characters'}
          />
          <TextField label="Store email" type="email" fullWidth {...field('email')} />
          <TextField label="Address" multiline minRows={2} fullWidth {...field('address')} />

          {mode === 'create' && (
            <TextField
              select
              label="Owner (optional)"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value === '' ? '' : Number(e.target.value))}
              helperText={
                owners.length === 0
                  ? 'No store owners without a store yet. Create a user with the Store owner role first.'
                  : 'Only store owners who do not have a store yet are listed'
              }
              fullWidth
            >
              <MenuItem value="">No owner</MenuItem>
              {owners.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {decodeEntities(o.name)} ({o.email})
                </MenuItem>
              ))}
            </TextField>
          )}
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