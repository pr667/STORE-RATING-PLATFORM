import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';

// Which menu items each role sees
const navByRole: Record<Role, { label: string; to: string }[]> = {
  NORMAL_USER: [
    { label: 'Stores', to: '/stores' },
    { label: 'My Ratings', to: '/my-ratings' },
    { label: 'Profile', to: '/profile' },
  ],
  STORE_OWNER: [
    { label: 'My Store', to: '/owner' },
    { label: 'Profile', to: '/profile' },
  ],
  SYSTEM_ADMIN: [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Users', to: '/admin/users' },
    { label: 'Stores', to: '/admin/stores' },
    { label: 'Profile', to: '/profile' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <Typography variant="h6" sx={{ mr: 3 }}>
            Store Rating
          </Typography>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            {navByRole[user.role].map((item) => (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                color="inherit"
                sx={{
                  borderBottom: pathname === item.to ? '2px solid white' : '2px solid transparent',
                  borderRadius: 0,
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
            {user.name}
          </Typography>
          <Button color="inherit" variant="outlined" size="small" onClick={logout}>
            Log out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}