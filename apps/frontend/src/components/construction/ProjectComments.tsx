import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from '../../hooks/construction/useConstructionComments';
import type { UserRole } from '../../types';
import { formatDate } from '../../utils/formatters';

interface Props {
  projectId: number;
  currentUserId: number;
  userRole: UserRole;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

export function ProjectComments({ projectId, currentUserId, userRole }: Props) {
  const { data: comments = [], isLoading } = useComments(projectId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const [text, setText] = useState('');

  const canModerate = userRole === 'admin' || userRole === 'manager';

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await createComment.mutateAsync({ projectId, body: { content: trimmed } });
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} mb={2}>
        Yorumlar
      </Typography>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={28} />
        </Box>
      ) : comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" mb={2}>
          Henüz yorum yapılmamış.
        </Typography>
      ) : (
        <Stack spacing={1.5} mb={2}>
          {comments.map((comment) => {
            const isOwn = comment.user_id === currentUserId;
            const canDelete = isOwn || canModerate;
            const initials = getInitials(comment.username ?? '?');

            return (
              <Box
                key={comment.id}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  alignItems: 'flex-start',
                }}
              >
                <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>
                  {initials}
                </Avatar>
                <Box flexGrow={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="body2" fontWeight={600}>
                      {comment.username ?? 'Bilinmiyor'}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatDate(comment.created_at)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" mt={0.25} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {comment.content}
                  </Typography>
                </Box>
                {canDelete && (
                  <Tooltip title="Sil">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        deleteComment.mutate({ projectId, commentId: comment.id })
                      }
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Stack>
      )}

      {/* Input */}
      <TextField
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Yorum yazın... (Enter ile gönder)"
        multiline
        minRows={2}
        maxRows={6}
        fullWidth
        size="small"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end" sx={{ alignSelf: 'flex-end', mb: 0.5 }}>
              <Tooltip title="Gönder">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    disabled={!text.trim() || createComment.isPending}
                    onClick={handleSend}
                  >
                    {createComment.isPending ? (
                      <CircularProgress size={18} />
                    ) : (
                      <SendIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
}
