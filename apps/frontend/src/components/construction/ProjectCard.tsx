import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConstructionProject, ConstructionProjectStatus, ConstructionProjectType, UserRole } from '../../types';

const STATUS_LABELS: Record<ConstructionProjectStatus, string> = {
  planning: 'Planlama',
  active: 'Aktif',
  on_hold: 'Beklemede',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

const TYPE_LABELS: Record<ConstructionProjectType, string> = {
  shopping_mall: 'AVM',
  residential: 'Konut',
  office: 'Ofis',
  mixed_use: 'Karma',
  hotel: 'Otel',
  industrial: 'Endüstriyel',
  other: 'Diğer',
};

const STATUS_COLORS: Record<ConstructionProjectStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  planning: 'info',
  active: 'success',
  on_hold: 'warning',
  completed: 'default',
  cancelled: 'error',
};

interface Props {
  project: ConstructionProject;
  userRole: UserRole;
  onEdit: (project: ConstructionProject) => void;
  onDelete: (project: ConstructionProject) => void;
}

export function ProjectCard({ project, userRole, onEdit, onDelete }: Props) {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const canEdit = userRole === 'admin' || userRole === 'manager';

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: 'background.paper',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <CardActionArea onClick={() => navigate(`/construction/${project.id}`)} sx={{ flexGrow: 1 }}>
        <CardContent sx={{ pb: 1 }}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
            <Box display="flex" gap={0.5} flexWrap="wrap">
              <Chip
                label={STATUS_LABELS[project.status]}
                color={STATUS_COLORS[project.status]}
                size="small"
                variant="outlined"
              />
              {project.project_type && project.project_type !== 'other' && (
                <Chip
                  label={TYPE_LABELS[project.project_type]}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: 'divider', color: 'text.secondary' }}
                />
              )}
            </Box>
            {canEdit && (
              <IconButton
                size="small"
                onClick={handleMenuClick}
                sx={{ mt: -0.5, mr: -1, color: 'text.secondary', flexShrink: 0 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          <Typography variant="subtitle1" fontWeight={700} mb={0.5} sx={{ lineHeight: 1.3 }}>
            {project.name}
          </Typography>

          {project.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              mb={1}
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {project.description}
            </Typography>
          )}

          <Box display="flex" flexDirection="column" gap={0.5} mb={1.5}>
            {project.location_name && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <LocationOnIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  {project.location_name}
                </Typography>
              </Box>
            )}
            {(project.start_date || project.end_date) && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  {project.start_date ?? '?'} → {project.end_date ?? '?'}
                </Typography>
              </Box>
            )}
            <Box display="flex" alignItems="center" gap={0.5}>
              <BusinessIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                {project.created_by_username}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                İlerleme
              </Typography>
              <Typography variant="caption" fontWeight={700} color="primary.main">
                {project.progress_pct}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={project.progress_pct}
              sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover' }}
            />
          </Box>

          {project.budget && (
            <Typography variant="caption" color="text.secondary" mt={1} display="block">
              Bütçe: ₺{parseFloat(project.budget).toLocaleString('tr-TR')}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onEdit(project);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Düzenle
        </MenuItem>
        {userRole === 'admin' && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onDelete(project);
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Sil
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}
