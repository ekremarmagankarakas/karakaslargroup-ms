import StarIcon from '@mui/icons-material/Star';
import {
  Box,
  Collapse,
  Grid,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useFavoriteProjects } from '../../hooks/construction/useConstructionFavorites';
import type { ConstructionProject, UserRole } from '../../types';
import { ProjectCard } from './ProjectCard';

interface Props {
  userRole: UserRole;
  onEdit: (project: ConstructionProject) => void;
  onDelete: (project: ConstructionProject) => void;
}

export function FavoriteProjectsSection({ userRole, onEdit, onDelete }: Props) {
  const { data: favorites = [] } = useFavoriteProjects();
  const [expanded, setExpanded] = useState(false);

  if (favorites.length === 0) return null;

  return (
    <Box mb={3}>
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        mb={1}
        sx={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <StarIcon fontSize="small" sx={{ color: 'warning.main' }} />
        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
          Favori Projeler ({favorites.length})
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {expanded ? '▲ Gizle' : '▼ Göster'}
        </Typography>
      </Box>
      <Collapse in={expanded}>
        <Grid container spacing={2}>
          {favorites.map((project) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={project.id}>
              <ProjectCard
                project={project}
                userRole={userRole}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </Grid>
          ))}
        </Grid>
      </Collapse>
    </Box>
  );
}
