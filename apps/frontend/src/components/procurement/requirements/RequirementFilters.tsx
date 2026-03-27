import DownloadIcon from '@mui/icons-material/Download';
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
} from '@mui/material';
import type { RequirementFilters, RequirementPriority, RequirementStatus, UserDropdownItem } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { exportRequirements } from '../../../api/endpoints/procurement/requirements';
import { useLocations } from '../../../hooks/useLocations';
import { useCategories } from '../../../hooks/procurement/useCategories';

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
  const canExport = user?.role === 'manager' || user?.role === 'accountant' || user?.role === 'admin';
  const showLocationFilter = !isEmployee;
  const { data: locations = [] } = useLocations();
  const { data: categories = [] } = useCategories();

  const activeCount = [
    filters.search,
    filters.user_id,
    filters.status,
    filters.priority,
    filters.paid !== undefined ? true : undefined,
    filters.month,
    filters.year,
    filters.location_id,
    filters.category_id,
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
        <InputLabel>Öncelik</InputLabel>
        <Select
          value={filters.priority ?? ''}
          label="Öncelik"
          onChange={(e) =>
            onChange({ ...filters, priority: (e.target.value as RequirementPriority) || undefined, page: 1 })
          }
        >
          <MenuItem value="">Tümü</MenuItem>
          <MenuItem value="low">Düşük</MenuItem>
          <MenuItem value="normal">Normal</MenuItem>
          <MenuItem value="high">Yüksek</MenuItem>
          <MenuItem value="urgent">Acil</MenuItem>
        </Select>
      </FormControl>

      {categories.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Kategori</InputLabel>
          <Select
            value={filters.category_id ?? ''}
            label="Kategori"
            onChange={(e) =>
              onChange({ ...filters, category_id: e.target.value ? Number(e.target.value) : undefined, page: 1 })
            }
          >
            <MenuItem value="">Tümü</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
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

      {showLocationFilter && locations.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Lokasyon</InputLabel>
          <Select
            value={filters.location_id ?? ''}
            label="Lokasyon"
            onChange={(e) =>
              onChange({ ...filters, location_id: e.target.value ? Number(e.target.value) : undefined, page: 1 })
            }
          >
            <MenuItem value="">Tümü</MenuItem>
            {locations.map((loc) => (
              <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {activeCount > 0 && (
        <Button
          size="small"
          variant="outlined"
          onClick={clearFilters}
          startIcon={<TuneIcon sx={{ fontSize: 15 }} />}
          sx={{ color: 'text.secondary', borderColor: 'divider' }}
        >
          Temizle ({activeCount})
        </Button>
      )}

      {canExport && (
        <Button
          size="small"
          variant="outlined"
          onClick={() => exportRequirements(filters)}
          startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
          sx={{ color: 'text.secondary', borderColor: 'divider', ml: 'auto' }}
        >
          CSV İndir
        </Button>
      )}
    </Box>
  );
}
