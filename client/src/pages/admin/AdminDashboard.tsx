import { useEffect, useState, type ReactNode } from 'react';
import {
  Alert, Box, CircularProgress, Paper, Rating, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import api, { getErrorMessage } from '../../api/client';
import { decodeEntities, formatDate, formatRating } from '../../utils/format';
import { roleLabels } from '../../utils/roles';
import type { Role } from '../../types';

interface DashboardData {
  stats: {
    total_users: string | number;
    normal_users: string | number;
    store_owners: string | number;
    admin_users: string | number;
    total_stores: string | number;
    total_ratings: string | number;
    average_rating: string | number;
    stores_with_ratings: string | number;
  };
  recentActivities: {
    users: { id: number; name: string; email: string; role: Role; created_at: string }[];
    stores: {
      id: number;
      name: string;
      email: string;
      average_rating: string | number;
      total_ratings: number;
      created_at: string;
      owner_name: string | null;
    }[];
    ratings: { id: number; rating: number; created_at: string; user_name: string; store_name: string }[];
  };
}

function StatCard({ label, value, caption }: { label: string; value: string | number; caption?: string }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4">{value}</Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Paper>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">{children}</Table>
      </TableContainer>
    </Box>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardData>('/admin/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { stats, recentActivities } = data;

  return (
    <Stack spacing={4}>
      <Typography variant="h4">Dashboard</Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        }}
      >
        <StatCard
          label="Total users"
          value={Number(stats.total_users)}
          caption={`${Number(stats.normal_users)} users · ${Number(stats.store_owners)} owners · ${Number(stats.admin_users)} admins`}
        />
        <StatCard
          label="Total stores"
          value={Number(stats.total_stores)}
          caption={`${Number(stats.stores_with_ratings)} with ratings`}
        />
        <StatCard label="Total ratings" value={Number(stats.total_ratings)} />
        <StatCard label="Average rating" value={formatRating(stats.average_rating)} caption="across all ratings" />
      </Box>

      <Section title="Newest users">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Joined</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {recentActivities.users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{decodeEntities(u.name)}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{roleLabels[u.role] ?? u.role}</TableCell>
              <TableCell>{formatDate(u.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Section>

      <Section title="Newest stores">
        <TableHead>
          <TableRow>
            <TableCell>Store</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Added</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {recentActivities.stores.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{decodeEntities(s.name)}</TableCell>
              <TableCell>{s.owner_name ? decodeEntities(s.owner_name) : '—'}</TableCell>
              <TableCell>
                {formatRating(s.average_rating)} ({s.total_ratings})
              </TableCell>
              <TableCell>{formatDate(s.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Section>

      <Section title="Latest ratings">
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Store</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {recentActivities.ratings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center">
                No ratings yet.
              </TableCell>
            </TableRow>
          ) : (
            recentActivities.ratings.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{decodeEntities(r.user_name)}</TableCell>
                <TableCell>{decodeEntities(r.store_name)}</TableCell>
                <TableCell>
                  <Rating value={r.rating} size="small" readOnly />
                </TableCell>
                <TableCell>{formatDate(r.created_at)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Section>
    </Stack>
  );
}