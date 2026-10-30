import { useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Rating, Stack, TextField, Typography,
} from '@mui/material';
import api, { getErrorMessage } from '../api/client';
import { decodeEntities } from '../utils/format';

interface Props {
  storeId: number;
  storeName: string;
  initialRating: number | null;
  initialComment?: string | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

// Render this only while it is needed (e.g. {selected && <RateDialog key=... />})
// so its form state starts fresh from the props each time it opens.
export default function RateDialog({
  storeId, storeName, initialRating, initialComment, onClose, onSaved,
}: Props) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [comment, setComment] = useState(initialComment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = initialRating !== null;

  const handleSave = async () => {
    if (!rating) return;
    setSaving(true);
    setError(null);
    try {
      // The backend's validator wants storeId in the body for both POST and PUT
      const payload = { storeId, rating, comment: comment.trim() || undefined };
      if (isEdit) {
        await api.put(`/ratings/${storeId}`, payload);
      } else {
        await api.post('/ratings', payload);
      }
      onSaved(isEdit ? 'Rating updated' : 'Rating submitted');
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete your rating for this store?')) return;
    setSaving(true);
    setError(null);
    try {
      await api.delete(`/ratings/${storeId}`);
      onSaved('Rating deleted');
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isEdit ? 'Edit your rating' : 'Rate this store'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="subtitle1">{decodeEntities(storeName)}</Typography>
          {error && <Alert severity="error">{error}</Alert>}

          <Rating
            size="large"
            value={rating}
            onChange={(_, value) => setRating(value)}
          />

          <TextField
            label="Comment (optional)"
            multiline
            minRows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {isEdit && (
          <Button color="error" onClick={handleDelete} disabled={saving} sx={{ mr: 'auto' }}>
            Delete
          </Button>
        )}
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !rating}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}