import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  CircularProgress,
  Skeleton,
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
        <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />
      ) : comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" mb={2}>
          Henüz yorum yapılmamış.
        </Typography>
      ) : (
        <Stack spacing={1.5} mb={2}>
          {comments.map((comment) => {
            const isOwn = comment.user_id === currentUserId;
            const canDelete = isOwn || canModerate;
            return (
              <Box
                key={comment.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={0.25}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="body2" fontWeight={600}>{comment.username ?? 'Bilinmiyor'}</Typography>
                    <Typography variant="caption" color="text.disabled">{formatDate(comment.created_at)}</Typography>
                  </Box>
                  {canDelete && (
                    <Tooltip title="Sil">
                      <IconButton size="small" color="error" onClick={() => deleteComment.mutate({ projectId, commentId: comment.id })}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {comment.content}
                </Typography>
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
