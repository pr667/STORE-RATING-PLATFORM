import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, MenuItem,
  Pagination as MuiPagination, Paper, Snackbar, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField,
  Tooltip, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import api, { getErrorMessage } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import UserDialog from '../../components/admin/UserDialog';
import { decodeEntities, formatRating } from '../../utils/format';
import { ROLES, roleLabels } from '../../utils/roles';
import type { Pagination, Role } from '../../types';
import type { AdminUser } from '../../types/admin';

interface UsersResponse {
  users: AdminUser[];
  pagination: Pagination;
}

type DialogState = { mode: 'create' } | { mode: 'edit'; user: AdminUser } | null;

interface UserDetails extends AdminUser {
  store_id: number | null;
  created_at: string;
}

const roleColors: Record<Role, 'error' | 'warning' | 'primary'> = {
  SYSTEM_ADMIN: 'error',
  STORE_OWNER: 'warning',
  NORMAL_USER: 'primary',
};

export default function AdminUsers() {
  const { user: me } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState<'name' | 'email' | 'address'>('name');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
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
    // Loading state tracks this external fetch lifecycle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    api
      .get<UsersResponse>('/admin/users', {
        params: { page, limit: 10, sortBy, sortOrder, search, searchBy, role: roleFilter },
      })
      .then((res) => {
        if (cancelled) return;
        setUsers(res.data.users);
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
  }, [page, sortBy, sortOrder, search, searchBy, roleFilter, refreshKey]);

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

  const handleDelete = async (u: AdminUser) => {
    if (!window.confirm(`Delete ${decodeEntities(u.name)}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      setToast('User deleted');
      // Deleted the last row on this page? Step back one page.
      if (users.length === 1 && page > 1) setPage(page - 1);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const showDetails = async (u: AdminUser) => {
    setDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);
    try {
      const res = await api.get<{ user: UserDetails }>(`/users/${u.id}`);
      setDetails(res.data.user);
    } catch (err) {
      setDetailsError(getErrorMessage(err));
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Users</Typography>
        <Button variant="contained" onClick={() => setDialog({ mode: 'create' })}>
          Add user
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
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
        <TextField
          select
          label="Role"
          size="small"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as Role | '');
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All roles</MenuItem>
          {ROLES.map((r) => (
            <MenuItem key={r} value={r}>
              {roleLabels[r]}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{sortHeader('name', 'Name')}</TableCell>
              <TableCell>{sortHeader('email', 'Email')}</TableCell>
              <TableCell>{sortHeader('address', 'Address')}</TableCell>
              <TableCell>{sortHeader('role', 'Role')}</TableCell>
              <TableCell>Store rating</TableCell>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{decodeEntities(u.name)}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{decodeEntities(u.address)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={roleLabels[u.role] ?? u.role} color={roleColors[u.role] ?? 'default'} />
                  </TableCell>
                  <TableCell>{u.store_rating != null ? formatRating(u.store_rating) : '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => void showDetails(u)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setDialog({ mode: 'edit', user: u })}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {u.id !== me?.id && (
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(u)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
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
        <UserDialog
          key={dialog.mode === 'edit' ? dialog.user.id : 'new'}
          mode={dialog.mode}
          user={dialog.mode === 'edit' ? dialog.user : undefined}
          isSelf={dialog.mode === 'edit' && dialog.user.id === me?.id}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null);
            setToast(message);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      <Dialog open={detailsLoading || !!details || !!detailsError} onClose={() => {
        setDetails(null);
        setDetailsError(null);
      }} fullWidth maxWidth="sm">
        <DialogTitle>User details</DialogTitle>
        <DialogContent>
          {detailsLoading && <CircularProgress size={28} />}
          {detailsError && <Alert severity="error">{detailsError}</Alert>}
          {details && (
            <Stack spacing={1} sx={{ py: 1 }}>
              <Typography><strong>Name:</strong> {decodeEntities(details.name)}</Typography>
              <Typography><strong>Email:</strong> {details.email}</Typography>
              <Typography><strong>Address:</strong> {decodeEntities(details.address)}</Typography>
              <Typography><strong>Role:</strong> {roleLabels[details.role] ?? details.role}</Typography>
              <Typography><strong>Created:</strong> {new Date(details.created_at).toLocaleString()}</Typography>
              {details.role === 'STORE_OWNER' && (
                <>
                  <Typography><strong>Store:</strong> {details.store_name ? decodeEntities(details.store_name) : 'No store assigned'}</Typography>
                  <Typography><strong>Average rating:</strong> {details.store_rating == null ? 'No ratings' : formatRating(details.store_rating)}</Typography>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} message={toast} />
    </Box>
  );
}
