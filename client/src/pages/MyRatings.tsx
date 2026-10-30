import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Pagination as MuiPagination, Paper,
  Rating, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TableSortLabel, Typography,
} from '@mui/material';
import api, { getErrorMessage } from '../api/client';
import RateDialog from '../components/RateDialog';
import { decodeEntities, formatDate, formatRating } from '../utils/format';
import type { MyRating, Pagination } from '../types';

interface MyRatingsResponse {
  ratings: MyRating[];
  pagination: Pagination;
}

export default function MyRatings() {
  const [ratings, setRatings] = useState<MyRating[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<MyRating | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Loading state tracks this external fetch lifecycle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    api
      .get<MyRatingsResponse>('/ratings/my-ratings', {
        params: { page, limit: 10, sortBy, sortOrder },
      })
      .then((res) => {
        if (cancelled) return;
        setRatings(res.data.ratings);
        setPagination(res.data.pagination);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, refreshKey, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const sortHeader = (field: string, label: string) => (
    <TableSortLabel
      active={sortBy === field}
      direction={sortBy === field ? sortOrder : 'asc'}
      onClick={() => handleSort(field)}
    >
      {label}
    </TableSortLabel>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Ratings
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{sortHeader('store_name', 'Store')}</TableCell>
              <TableCell>{sortHeader('rating', 'Your rating')}</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Store average</TableCell>
              <TableCell>{sortHeader('created_at', 'Date')}</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : ratings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  You haven't rated any stores yet.
                </TableCell>
              </TableRow>
            ) : (
              ratings.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography variant="body2">{decodeEntities(r.store_name)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {decodeEntities(r.store_address)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Rating value={r.rating} size="small" readOnly />
                  </TableCell>
                  <TableCell>{r.comment || '—'}</TableCell>
                  <TableCell>{formatRating(r.store_average_rating)}</TableCell>
                  <TableCell>{formatDate(r.updated_at || r.created_at)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => setSelected(r)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <MuiPagination
            count={pagination.totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {selected && (
        <RateDialog
          key={selected.id}
          storeId={selected.store_id}
          storeName={selected.store_name}
          initialRating={selected.rating}
          initialComment={selected.comment}
          onClose={() => setSelected(null)}
          onSaved={(message) => {
            setSelected(null);
            setToast(message);
            // If we just deleted the last item on this page, step back one page
            if (message === 'Rating deleted' && ratings.length === 1 && page > 1) {
              setPage(page - 1);
            }
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast}
      />
    </Box>
  );
}
