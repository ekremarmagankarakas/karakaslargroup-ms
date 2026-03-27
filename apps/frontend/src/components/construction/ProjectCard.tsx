import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Fade,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectHealth } from '../../hooks/construction/useConstruction';
import { useToggleProjectFavorite } from '../../hooks/construction/useConstructionFavorites';
import { ProjectStatusChip } from '../common/StatusChip';
import type { ConstructionProject, ConstructionProjectType, UserRole } from '../../types';

const TYPE_LABELS: Record<ConstructionProjectType, string> = {
  shopping_mall: 'AVM',
  residential: 'Konut',
  office: 'Ofis',
  mixed_use: 'Karma',
  hotel: 'Otel',
  industrial: 'Endüstriyel',
  other: 'Diğer',
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
  const toggleFavorite = useToggleProjectFavorite();
  const { data: health } = useProjectHealth(project.id);

  const ragColor = health
    ? health.overall === 'red'
      ? '#ef4444'
      : health.overall === 'amber'
        ? '#f59e0b'
        : '#22c55e'
    : null;

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  return (
    <Fade in timeout={350}>
    <Card
      variant="outlined"
      sx={{
        bgcolor: 'background.paper',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 4 },
      }}
    >
      <CardActionArea onClick={() => navigate(`/construction/${project.id}`)} sx={{ flexGrow: 1 }}>
        <CardContent sx={{ pb: 1 }}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
            <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center">
              {ragColor && (
                <Tooltip title={`Proje sağlığı: ${health!.overall === 'red' ? 'Kritik' : health!.overall === 'amber' ? 'Uyarı' : 'Normal'}`}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: ragColor,
                      flexShrink: 0,
                    }}
                  />
                </Tooltip>
              )}
              <ProjectStatusChip status={project.status} />
              {project.project_type && project.project_type !== 'other' && (
                <Chip
                  label={TYPE_LABELS[project.project_type]}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: 'divider', color: 'text.secondary' }}
                />
              )}
            </Box>
            <Box display="flex" alignItems="center" sx={{ mt: -0.5, mr: -1 }}>
              <Tooltip title={project.is_favorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite.mutate(project.id);
                  }}
                  sx={{ color: project.is_favorite ? 'warning.main' : 'text.secondary' }}
                >
                  {project.is_favorite ? (
                    <StarIcon fontSize="small" />
                  ) : (
                    <StarBorderIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
              {canEdit && (
                <IconButton
                  size="small"
                  onClick={handleMenuClick}
                  sx={{ color: 'text.secondary', flexShrink: 0 }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
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

          <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
            {project.budget ? (
              <Typography variant="caption" color="text.secondary">
                Bütçe: ₺{parseFloat(project.budget).toLocaleString('tr-TR')}
              </Typography>
            ) : <Box />}
            {project.team_count > 0 && (
              <Tooltip title={`${project.team_count} ekip üyesi`}>
                <Box display="flex" alignItems="center" gap={0.25}>
                  <GroupIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    {project.team_count}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
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
    </Fade>
  );
}
