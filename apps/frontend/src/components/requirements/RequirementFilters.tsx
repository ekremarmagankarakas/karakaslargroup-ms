import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import type { RequirementFilters, RequirementStatus, UserDropdownItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i);

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

interface Props {
  filters: RequirementFilters;
  users: UserDropdownItem[];
  onChange: (filters: RequirementFilters) => void;
}

export function RequirementFilters({ filters, users, onChange }: Props) {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const isAccountant = user?.role === 'accountant';

  return (
    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
      <TextField
        label="Ara"
        size="small"
        value={filters.search ?? ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value || undefined, page: 1 })}
        sx={{ minWidth: 150 }}
      />

      {!isEmployee && (
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Kullanıcı</InputLabel>
          <Select
            value={filters.user_id ?? ''}
            label="Kullanıcı"
            onChange={(e) =>
              onChange({ ...filters, user_id: e.target.value ? Number(e.target.value) : undefined, page: 1 })
            }
          >
            <MenuItem value="">Tümü</MenuItem>
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.username}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {!isAccountant && (
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Durum</InputLabel>
          <Select
            value={filters.status ?? ''}
            label="Durum"
            onChange={(e) =>
              onChange({ ...filters, status: (e.target.value as RequirementStatus) || undefined, page: 1 })
            }
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="pending">Beklemede</MenuItem>
            <MenuItem value="accepted">Onaylandı</MenuItem>
            <MenuItem value="declined">Reddedildi</MenuItem>
          </Select>
        </FormControl>
      )}

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Ödeme</InputLabel>
        <Select
          value={filters.paid === undefined ? '' : String(filters.paid)}
          label="Ödeme"
          onChange={(e) =>
            onChange({
              ...filters,
              paid: e.target.value === '' ? undefined : e.target.value === 'true',
              page: 1,
            })
          }
        >
          <MenuItem value="">Tümü</MenuItem>
          <MenuItem value="true">Ödendi</MenuItem>
          <MenuItem value="false">Ödenmedi</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 110 }}>
        <InputLabel>Ay</InputLabel>
        <Select
          value={filters.month ?? ''}
          label="Ay"
          onChange={(e) =>
            onChange({ ...filters, month: e.target.value ? Number(e.target.value) : undefined, page: 1 })
          }
        >
          <MenuItem value="">Tümü</MenuItem>
          {MONTHS.map((m, i) => (
            <MenuItem key={i + 1} value={i + 1}>
              {m}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel>Yıl</InputLabel>
        <Select
          value={filters.year ?? ''}
          label="Yıl"
          onChange={(e) =>
            onChange({ ...filters, year: e.target.value ? Number(e.target.value) : undefined, page: 1 })
          }
        >
          <MenuItem value="">Tümü</MenuItem>
          {years.map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
