import { Box, Pagination } from '@mui/material';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function PaginationControls({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <Box display="flex" justifyContent="center" mt={2}>
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, value) => onChange(value)}
        color="primary"
      />
    </Box>
  );
}
