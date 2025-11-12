import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
  Stack,
  IconButton,
  CircularProgress,
  Alert,
  Collapse
} from '@mui/material';
import {
  Send,
  ThumbUp,
  ThumbDown,
  Reply,
  Delete,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { commentsAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const FeedbackSection = ({ eventId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await commentsAPI.getByEventId(eventId, page, 20);
      if (response.success) {
        setComments(response.data.comments || []);
        setHasMore(response.data.page < response.data.totalPages);
      }
    } catch (err) {
      setError('Không thể tải bình luận. Vui lòng thử lại sau.');
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId, page]);

  useEffect(() => {
    if (eventId) {
      loadComments();
    }
  }, [eventId, loadComments]);

  const handleCommentChange = (e) => {
    const textarea = e.target;
    if (textarea) {
      textarea.setAttribute('dir', 'ltr');
      textarea.style.direction = 'ltr';
      textarea.style.textAlign = 'left';
    }
    setNewComment(e.target.value);
  };

  const handleCommentInput = (e) => {
    const textarea = e.target;
    if (textarea) {
      textarea.setAttribute('dir', 'ltr');
      textarea.style.direction = 'ltr';
      textarea.style.textAlign = 'left';
    }
  };

  const handleCommentFocus = (e) => {
    const textarea = e.target;
    if (textarea) {
      textarea.setAttribute('dir', 'ltr');
      textarea.style.direction = 'ltr';
      textarea.style.textAlign = 'left';
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để bình luận.');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const response = await commentsAPI.create(eventId, newComment.trim());
      if (response.success) {
        setNewComment('');
        await loadComments(); // Reload comments
      }
    } catch (err) {
      setError(err.message || 'Không thể gửi bình luận. Vui lòng thử lại sau.');
      console.error('Error submitting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId) => {
    const content = replyContent[parentCommentId]?.trim();
    if (!content) return;

    if (!user) {
      alert('Vui lòng đăng nhập để trả lời.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const response = await commentsAPI.create(eventId, content, parentCommentId);
      if (response.success) {
        setReplyContent({ ...replyContent, [parentCommentId]: '' });
        setReplyingTo(null);
        await loadComments(); // Reload comments
      }
    } catch (err) {
      setError(err.message || 'Không thể gửi phản hồi. Vui lòng thử lại sau.');
      console.error('Error submitting reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    try {
      setError(null);
      const response = await commentsAPI.delete(commentId);
      if (response.success) {
        await loadComments(); // Reload comments
      }
    } catch (err) {
      setError(err.message || 'Không thể xóa bình luận. Vui lòng thử lại sau.');
      console.error('Error deleting comment:', err);
    }
  };

  const handleToggleReaction = async (commentId, reactionType) => {
    if (!user) {
      alert('Vui lòng đăng nhập để like/dislike.');
      return;
    }

    try {
      const response = await commentsAPI.toggleReaction(commentId, reactionType);
      if (response.success) {
        await loadComments(); // Reload comments to update reaction counts
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `http://localhost:5000${avatar.startsWith('/') ? '' : '/'}${avatar}`;
  };

  const CommentItem = ({ comment, isReply = false }) => {
    const avatarUrl = getAvatarUrl(comment.userAvatar);
    const isExpanded = expandedReplies[comment.commentId] || false;
    const replyText = replyContent[comment.commentId] || '';
    const replyInputRef = useRef(null);
    const wasReplyingRef = useRef(false);

    // Focus vào input khi reply box mở và set direction
    // Chỉ focus khi reply box vừa mới mở, không phải mỗi lần re-render
    useEffect(() => {
      const isCurrentlyReplying = replyingTo === comment.commentId;
      
      // Chỉ focus khi reply box vừa mới mở (chuyển từ false sang true)
      if (isCurrentlyReplying && !wasReplyingRef.current && replyInputRef.current) {
        wasReplyingRef.current = true;
        
        // Chỉ focus nếu không có input nào khác đang được focus
        setTimeout(() => {
          const activeElement = document.activeElement;
          const isInputFocused = activeElement && (
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.tagName === 'INPUT'
          );
          
          const textarea = replyInputRef.current?.querySelector('textarea') || replyInputRef.current;
          if (textarea) {
            textarea.setAttribute('dir', 'ltr');
            textarea.style.direction = 'ltr';
            textarea.style.textAlign = 'left';
            
            // Chỉ focus nếu không có input nào khác đang được focus
            if (!isInputFocused) {
              replyInputRef.current?.focus();
            }
          }
        }, 100);
      } else if (!isCurrentlyReplying) {
        // Reset flag khi reply box đóng
        wasReplyingRef.current = false;
      } else if (isCurrentlyReplying && replyInputRef.current) {
        // Vẫn set direction khi reply box đang mở nhưng không focus
        setTimeout(() => {
          const textarea = replyInputRef.current?.querySelector('textarea') || replyInputRef.current;
          if (textarea) {
            textarea.setAttribute('dir', 'ltr');
            textarea.style.direction = 'ltr';
            textarea.style.textAlign = 'left';
          }
        }, 0);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [replyingTo, comment.commentId]);

    // Handler cho onChange reply với useCallback để tránh re-render không cần thiết
    const handleReplyChange = useCallback((e) => {
      const textarea = e.target;
      if (textarea) {
        // Force LTR direction - giống như comment input
        textarea.setAttribute('dir', 'ltr');
        textarea.style.direction = 'ltr';
        textarea.style.textAlign = 'left';
      }
      const value = e.target.value;
      setReplyContent(prev => ({ ...prev, [comment.commentId]: value }));
    }, [comment.commentId]);

    // Handler onInput để đảm bảo direction được set mỗi khi gõ
    const handleReplyInput = useCallback((e) => {
      const textarea = e.target;
      if (textarea) {
        textarea.setAttribute('dir', 'ltr');
        textarea.style.direction = 'ltr';
        textarea.style.textAlign = 'left';
      }
    }, []);

    // Handler để đảm bảo direction luôn là ltr khi focus
    const handleReplyFocus = useCallback((e) => {
      const textarea = e.target;
      if (textarea) {
        textarea.setAttribute('dir', 'ltr');
        textarea.style.direction = 'ltr';
        textarea.style.textAlign = 'left';
      }
    }, []);

    return (
      <Box sx={{ mb: 2, ml: isReply ? 4 : 0 }}>
        <Card variant="outlined" sx={{ bgcolor: isReply ? 'grey.50' : 'background.paper' }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar
                src={avatarUrl}
                alt={comment.userName}
                sx={{ width: 40, height: 40 }}
              >
                {comment.userName?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {comment.userName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(comment.createdAt)}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                  {comment.content}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton
                    size="small"
                    onClick={() => handleToggleReaction(comment.commentId, 'Like')}
                    color={comment.currentUserReaction === 'Like' ? 'primary' : 'default'}
                  >
                    <ThumbUp fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary">
                    {comment.likeCount || 0}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleReaction(comment.commentId, 'Dislike')}
                    color={comment.currentUserReaction === 'Dislike' ? 'error' : 'default'}
                  >
                    <ThumbDown fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary">
                    {comment.dislikeCount || 0}
                  </Typography>
                  {!isReply && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newReplyingTo = replyingTo === comment.commentId ? null : comment.commentId;
                        setReplyingTo(newReplyingTo);
                      }}
                    >
                      <Reply fontSize="small" />
                    </IconButton>
                  )}
                  {comment.canDelete && (
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(comment.commentId)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
                
                {/* Reply input */}
                {!isReply && replyingTo === comment.commentId && (
                  <Box sx={{ mt: 2, direction: 'ltr' }}>
                    <TextField
                      inputRef={replyInputRef}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Viết phản hồi..."
                      value={replyText}
                      onChange={handleReplyChange}
                      onInput={handleReplyInput}
                      onFocus={handleReplyFocus}
                      size="small"
                      sx={{ 
                        mb: 1, 
                        direction: 'ltr', 
                        '& textarea': { 
                          direction: 'ltr !important',
                          textAlign: 'left !important'
                        },
                        '& input': {
                          direction: 'ltr !important',
                          textAlign: 'left !important'
                        }
                      }}
                      InputProps={{
                        style: { direction: 'ltr', textAlign: 'left' }
                      }}
                      inputProps={{ 
                        dir: 'ltr', 
                        style: { 
                          direction: 'ltr', 
                          textAlign: 'left'
                        },
                        onFocus: handleReplyFocus,
                        onInput: handleReplyInput
                      }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleReply(comment.commentId)}
                        disabled={submitting || !replyText.trim()}
                      >
                        Gửi
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent(prev => {
                            const newContent = { ...prev };
                            delete newContent[comment.commentId];
                            return newContent;
                          });
                        }}
                      >
                        Hủy
                      </Button>
                    </Stack>
                  </Box>
                )}

                {/* Replies */}
                {!isReply && comment.replies && comment.replies.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                      onClick={() => setExpandedReplies({ ...expandedReplies, [comment.commentId]: !isExpanded })}
                    >
                      {isExpanded ? 'Ẩn' : 'Hiện'} {comment.replies.length} phản hồi
                    </Button>
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 1 }}>
                        {comment.replies.map((reply) => (
                          <CommentItem key={reply.commentId} comment={reply} isReply={true} />
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        Feedback
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Comment input */}
      {user && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Stack spacing={2} sx={{ direction: 'ltr' }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Viết bình luận của bạn..."
                value={newComment}
                onChange={handleCommentChange}
                onInput={handleCommentInput}
                onFocus={handleCommentFocus}
                disabled={submitting}
                sx={{ 
                  direction: 'ltr', 
                  '& textarea': { 
                    direction: 'ltr !important',
                    textAlign: 'left !important'
                  },
                  '& input': {
                    direction: 'ltr !important',
                    textAlign: 'left !important'
                  }
                }}
                InputProps={{
                  style: { direction: 'ltr', textAlign: 'left' }
                }}
                inputProps={{ 
                  dir: 'ltr', 
                  style: { 
                    direction: 'ltr', 
                    textAlign: 'left'
                  },
                  onFocus: handleCommentFocus,
                  onInput: handleCommentInput
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
                  onClick={handleSubmitComment}
                  disabled={submitting || !newComment.trim()}
                >
                  Gửi bình luận
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {!user && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Vui lòng đăng nhập để bình luận.
        </Alert>
      )}

      {/* Comments list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : comments.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary" align="center">
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {comments.map((comment) => (
            <CommentItem key={comment.commentId} comment={comment} />
          ))}
          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button onClick={() => setPage(page + 1)}>Tải thêm bình luận</Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FeedbackSection;

