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
import { sendChat } from '../../api/endpoints/chat';
import type { ChatMessage } from '../../types';

const SUGGESTIONS = [
  'Bu ay kaç talebim var?',
  'Bekleyen taleplerim neler?',
  'Toplam harcamam ne kadar?',
];

export function ChatWidget() {
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
      const reply = await sendChat(next);
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
      {/* Floating button */}
      <Tooltip title="Asistan" placement="left">
        <Fab
          color="primary"
          onClick={() => setOpen((v) => !v)}
          sx={{ position: 'fixed', bottom: 28, left: 28, zIndex: 1200 }}
          size="medium"
        >
          {open ? <CloseIcon /> : <AutoAwesomeIcon />}
        </Fab>
      </Tooltip>

      {/* Chat panel */}
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
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <AutoAwesomeIcon sx={{ color: 'white', fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'white', flex: 1 }}>
              Asistan
            </Typography>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.length === 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  Merhaba! Size nasıl yardımcı olabilirim?
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
                      '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main', color: 'primary.main' },
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
                  borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  bgcolor: m.role === 'user' ? 'primary.main' : 'action.hover',
                  color: m.role === 'user' ? 'white' : 'text.primary',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  '& p': { m: 0, mb: 0.5 },
                  '& p:last-child': { mb: 0 },
                  '& table': {
                    borderCollapse: 'collapse',
                    width: '100%',
                    fontSize: '0.8rem',
                    mt: 0.5,
                  },
                  '& th, & td': {
                    border: '1px solid',
                    borderColor: m.role === 'user' ? 'rgba(255,255,255,0.3)' : '#cbd5e1',
                    px: 1,
                    py: 0.5,
                    textAlign: 'left',
                  },
                  '& th': { fontWeight: 700, bgcolor: m.role === 'user' ? 'rgba(255,255,255,0.15)' : 'action.selected' },
                  '& strong': { fontWeight: 700 },
                  '& ul, & ol': { pl: 2, my: 0.5 },
                  '& li': { mb: 0.25 },
                  '& code': {
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    bgcolor: m.role === 'user' ? 'rgba(255,255,255,0.2)' : 'action.selected',
                    px: 0.5,
                    borderRadius: 0.5,
                  },
                }}
              >
                {m.role === 'user' ? (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: 'inherit' }}>
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
                    color="primary"
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
