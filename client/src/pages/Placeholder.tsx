import { Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function Placeholder({ title }: { title: string }) {
  const { user } = useAuth();

  return (
    <>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      <Typography>
        Logged in as {user?.name} ({user?.role})
      </Typography>
    </>
  );
}