import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, MenuItem, Pagination as MuiPagination,
  Paper, Rating, Snackbar, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, TextField, Typography,
} from '@mui/material';
import api, { getErrorMessage } from '../api/client';
import RateDialog from '../components/RateDialog';
import { decodeEntities, formatRating } from '../utils/format';
import type { Pagination, Store } from '../types';

interface StoresResponse {
  stores: Store[];
  pagination: Pagination;
}

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState<'name' | 'address'>('name');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<Store | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Debounce: wait 400ms after the user stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load stores whenever any of these change
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    api
      .get<StoresResponse>('/stores', {
        params: { page, limit: 10, sortBy, sortOrder, search, searchBy },
      })
      .then((res) => {
        if (cancelled) return;
        setStores(res.data.stores);
        setPagination(res.data.pagination);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // If the inputs change before the request finishes, ignore the old answer
    return () => {
      cancelled = true;
    };
  }, [page, sortBy, sortOrder, search, searchBy, refreshKey]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Stores
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search"
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <TextField
          select
          label="Search by"
          size="small"
          value={searchBy}
          onChange={(e) => {
            setSearchBy(e.target.value as 'name' | 'address');
            setPage(1);
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="address">Address</MenuItem>
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortBy === 'name' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortBy === 'name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Store
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'address'}
                  direction={sortBy === 'address' ? sortOrder : 'asc'}
                  onClick={() => handleSort('address')}
                >
                  Address
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === 'average_rating' ? sortOrder : false}>
                <TableSortLabel
                  active={sortBy === 'average_rating'}
                  direction={sortBy === 'average_rating' ? sortOrder : 'asc'}
                  onClick={() => handleSort('average_rating')}
                >
                  Overall rating
                </TableSortLabel>
              </TableCell>
              <TableCell>Your rating</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No stores found.
                </TableCell>
              </TableRow>
            ) : (
              stores.map((store) => (
                <TableRow key={store.id} hover>
                  <TableCell>{decodeEntities(store.name)}</TableCell>
                  <TableCell>{decodeEntities(store.address)}</TableCell>
                  <TableCell>
                   <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Rating
                        value={Number(store.average_rating) || 0}
                        precision={0.5}
                        size="small"
                        readOnly
                      />
                      <Typography variant="body2">
                        {formatRating(store.average_rating)} ({store.total_ratings})
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {store.user_rating ? (
                      <Rating value={store.user_rating} size="small" readOnly />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not rated
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => setSelected(store)}>
                      {store.user_rating ? 'Edit rating' : 'Rate'}
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
          storeId={selected.id}
          storeName={selected.name}
          initialRating={selected.user_rating ?? null}
          onClose={() => setSelected(null)}
          onSaved={(message) => {
            setSelected(null);
            setToast(message);
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
