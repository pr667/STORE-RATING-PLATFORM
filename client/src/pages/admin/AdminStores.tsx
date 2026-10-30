import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, IconButton, MenuItem,
  Pagination as MuiPagination, Paper, Rating, Snackbar, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField,
  Tooltip, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api, { getErrorMessage } from '../../api/client';
import StoreDialog from '../../components/admin/StoreDialog';
import { decodeEntities, formatRating } from '../../utils/format';
import type { Pagination } from '../../types';
import type { AdminStore } from '../../types/admin';

interface StoresResponse {
  stores: AdminStore[];
  pagination: Pagination;
}

type DialogState = { mode: 'create' } | { mode: 'edit'; store: AdminStore } | null;

export default function AdminStores() {
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState<'name' | 'email' | 'address'>('name');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    api
      .get<StoresResponse>('/admin/stores', {
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

    return () => {
      cancelled = true;
    };
  }, [page, sortBy, sortOrder, search, searchBy, refreshKey]);

  const handleSort = (fieldName: string) => {
    if (sortBy === fieldName) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(fieldName);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const sortHeader = (fieldName: string, label: string) => (
    <TableSortLabel
      active={sortBy === fieldName}
      direction={sortBy === fieldName ? sortOrder : 'asc'}
      onClick={() => handleSort(fieldName)}
    >
      {label}
    </TableSortLabel>
  );

  const handleDelete = async (s: AdminStore) => {
    if (!window.confirm(`Delete "${decodeEntities(s.name)}"? Its ratings will be deleted too.`)) return;
    try {
      await api.delete(`/stores/${s.id}`);
      setToast('Store deleted');
      if (stores.length === 1 && page > 1) setPage(page - 1);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Stores</Typography>
        <Button variant="contained" onClick={() => setDialog({ mode: 'create' })}>
          Add store
        </Button>
      </Stack>

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
            setSearchBy(e.target.value as 'name' | 'email' | 'address');
            setPage(1);
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="email">Email</MenuItem>
          <MenuItem value="address">Address</MenuItem>
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{sortHeader('name', 'Store')}</TableCell>
              <TableCell>{sortHeader('email', 'Email')}</TableCell>
              <TableCell>{sortHeader('address', 'Address')}</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>{sortHeader('average_rating', 'Rating')}</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No stores found.
                </TableCell>
              </TableRow>
            ) : (
              stores.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>{decodeEntities(s.name)}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{decodeEntities(s.address)}</TableCell>
                  <TableCell>
                    {s.owner.name ? (
                      <>
                        <Typography variant="body2">{decodeEntities(s.owner.name)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.owner.email}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No owner
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                   <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Rating value={Number(s.average_rating) || 0} precision={0.5} size="small" readOnly />
                      <Typography variant="body2">
                        {formatRating(s.average_rating)} ({s.total_ratings})
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setDialog({ mode: 'edit', store: s })}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(s)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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

      {dialog && (
        <StoreDialog
          key={dialog.mode === 'edit' ? dialog.store.id : 'new'}
          mode={dialog.mode}
          store={dialog.mode === 'edit' ? dialog.store : undefined}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null);
            setToast(message);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} message={toast} />
    </Box>
  );
}
