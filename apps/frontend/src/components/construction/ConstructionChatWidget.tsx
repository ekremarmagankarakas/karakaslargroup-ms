import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  CircularProgress,
  Fab,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Paper,
  Slide,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendConstructionChat } from '../../api/endpoints/construction/chat';
import type { ChatMessage } from '../../types';

const SUGGESTIONS = [
  'Aktif projeler hangileri?',
  'Gecikmiş aşamalar var mı?',
  'Açık kritik sorunlar neler?',
  'Portföy bütçe özeti',
];

export function ConstructionChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const next: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendConstructionChat(next);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Bir hata oluştu, lütfen tekrar deneyin.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Tooltip title="İnşaat Asistanı" placement="left">
        <Fab
          color="secondary"
          onClick={() => setOpen((v) => !v)}
          sx={{ position: 'fixed', bottom: 28, left: 28, zIndex: 1200 }}
          size="medium"
        >
          {open ? <CloseIcon /> : <AutoAwesomeIcon />}
        </Fab>
      </Tooltip>

      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 88,
            left: 28,
            width: 360,
            height: 480,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1200,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <AutoAwesomeIcon sx={{ color: 'white', fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'white', flex: 1 }}>
              İnşaat Asistanı
            </Typography>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 2,
              py: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {messages.length === 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  İnşaat projeleri hakkında soru sorabilirsiniz.
                </Typography>
                {SUGGESTIONS.map((s) => (
                  <Box
                    key={s}
                    onClick={() => send(s)}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      mb: 0.75,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: 'text.secondary',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'secondary.main',
                        color: 'secondary.main',
                      },
                    }}
                  >
                    {s}
                  </Box>
                ))}
              </Box>
            )}

            {messages.map((m, i) => (
              <Box
                key={i}
                sx={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  px: 1.5,
                  py: 1,
                  borderRadius:
                    m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  bgcolor: m.role === 'user' ? 'secondary.main' : 'action.hover',
                  color: m.role === 'user' ? 'white' : 'text.primary',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  '& p': { m: 0, mb: 0.5 },
                  '& p:last-child': { mb: 0 },
                  '& strong': { fontWeight: 700 },
                  '& ul, & ol': { pl: 2, my: 0.5 },
                  '& li': { mb: 0.25 },
                }}
              >
                {m.role === 'user' ? (
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: 'inherit' }}
                  >
                    {m.content}
                  </Typography>
                ) : (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                )}
              </Box>
            ))}

            {loading && (
              <Box sx={{ alignSelf: 'flex-start', px: 1.5, py: 1 }}>
                <CircularProgress size={16} />
              </Box>
            )}

            <div ref={bottomRef} />
          </Box>

          {/* Input */}
          <Box sx={{ px: 1.5, py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
            <OutlinedInput
              fullWidth
              size="small"
              placeholder="Mesaj yazın..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              disabled={loading}
              sx={{ borderRadius: 2, fontSize: '0.875rem' }}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => send(input)}
                    disabled={!input.trim() || loading}
                    color="secondary"
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              }
            />
          </Box>
        </Paper>
      </Slide>
    </>
  );
}
