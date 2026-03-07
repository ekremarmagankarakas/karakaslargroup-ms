import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
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

  const activeCount = [
    filters.search,
    filters.user_id,
    filters.status,
    filters.paid !== undefined ? true : undefined,
    filters.month,
    filters.year,
  ].filter(Boolean).length;

  const clearFilters = () => onChange({ page: 1, limit: filters.limit });

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        alignItems: 'center',
        mb: 2,
      }}
    >
      {/* Search */}
      <TextField
        placeholder="Ara..."
        size="small"
        value={filters.search ?? ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value || undefined, page: 1 })}
        sx={{ width: 200 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 17, color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Separator */}
      <Box sx={{ width: 1, height: 32, bgcolor: 'divider', mx: 0.5 }} />

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
              <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>
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
            <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 95 }}>
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
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {activeCount > 0 && (
        <Tooltip title="Tüm filtreleri temizle">
          <Button
            size="small"
            onClick={clearFilters}
            sx={{
              color: 'text.secondary',
              borderColor: 'divider',
              ml: 0.5,
              height: 40,
              px: 1.5,
              minWidth: 0,
              border: '1px solid',
              borderRadius: 2,
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
            }}
          >
            <TuneIcon sx={{ fontSize: 16, mr: 0.75 }} />
            <Typography variant="caption" fontWeight={600}>
              Temizle ({activeCount})
            </Typography>
          </Button>
        </Tooltip>
      )}
    </Box>
  );
}
