import { useEffect, useState } from 'react';
import {
  Alert, Box, CircularProgress, Pagination as MuiPagination, Paper, Rating,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Typography,
} from '@mui/material';
import api, { getErrorMessage } from '../../api/client';
import { decodeEntities, formatDate, formatRating } from '../../utils/format';
import type { Pagination } from '../../types';

interface OwnerStoreData {
  id: number;
  name: string;
  email: string;
  address: string;
  average_rating: string | number;
  total_ratings: number;
  created_at: string;
}

interface OwnerRating {
  id: number;
  rating: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
}

interface RatingsResponse {
  ratings: OwnerRating[];
  total: number;
  pagination: Pagination;
}

export default function OwnerStore() {
  const [store, setStore] = useState<OwnerStoreData | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

  const [ratings, setRatings] = useState<OwnerRating[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [ratingsError, setRatingsError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load the store details once
  useEffect(() => {
    api
      .get<OwnerStoreData>('/stores/my-store')
      .then((res) => setStore(res.data))
      .catch((err) => setStoreError(getErrorMessage(err)));
  }, []);

  // Load ratings whenever the page or sort changes
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRatingsLoading(true);

    api
      // The backend reads sort_by and sort_order (with underscores) on this route
      .get<RatingsResponse>('/stores/my-store/ratings', {
        params: { page, limit: 10, sort_by: sortBy, sort_order: sortOrder },
      })
      .then((res) => {
        if (cancelled) return;
        setRatings(res.data.ratings);
        setPagination(res.data.pagination);
        setRatingsError(null);
      })
      .catch((err) => {
        if (!cancelled) setRatingsError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setRatingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
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

  // Owner has no store yet (or the request failed): show the message and stop
  if (storeError) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          My Store
        </Typography>
        <Alert severity="info">{storeError}</Alert>
      </Box>
    );
  }

  if (!store) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4">My Store</Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {decodeEntities(store.name)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {decodeEntities(store.address)}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {store.email}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 2 }}>
          <Rating value={Number(store.average_rating) || 0} precision={0.5} readOnly />
          <Typography variant="h6">{formatRating(store.average_rating)}</Typography>
          <Typography variant="body2" color="text.secondary">
            from {store.total_ratings} {store.total_ratings === 1 ? 'rating' : 'ratings'}
          </Typography>
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h6" gutterBottom>
          Who rated your store
        </Typography>

        {ratingsError && <Alert severity="error" sx={{ mb: 2 }}>{ratingsError}</Alert>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{sortHeader('user_name', 'Name')}</TableCell>
                <TableCell>{sortHeader('user_email', 'Email')}</TableCell>
                <TableCell>{sortHeader('rating', 'Rating')}</TableCell>
                <TableCell>{sortHeader('created_at', 'Date')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ratingsLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : ratings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No ratings yet.
                  </TableCell>
                </TableRow>
              ) : (
                ratings.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{decodeEntities(r.user_name)}</TableCell>
                    <TableCell>{r.user_email}</TableCell>
                    <TableCell>
                      <Rating value={r.rating} size="small" readOnly />
                    </TableCell>
                    <TableCell>{formatDate(r.created_at)}</TableCell>
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
      </Box>
    </Stack>
  );
}
