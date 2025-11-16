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
  Grid,
  LinearProgress
} from '@mui/material';
import {
  Send,
  ThumbUp,
  ThumbDown,
  Delete,
  Star,
  StarBorder,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';
import { commentsAPI, ratingsAPI, ticketsAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const FeedbackSection = ({ eventId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loadingRating, setLoadingRating] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [userHasCommented, setUserHasCommented] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await commentsAPI.getByEventId(eventId, page, 20);
      if (response.success) {
        setComments(response.data.comments || []);
        setHasMore(response.data.page < response.data.totalPages);
        
        // Check if current user has already commented
        if (user) {
          const userComment = response.data.comments.find(c => c.userId === user.id);
          setUserHasCommented(!!userComment);
          if (userComment?.ratingStars) {
            setSelectedRating(userComment.ratingStars);
          }
        }
      }
    } catch (err) {
      setError('Không thể tải bình luận. Vui lòng thử lại sau.');
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId, page, user]);

  const loadRatingSummary = useCallback(async () => {
    try {
      setLoadingRating(true);
      const response = await ratingsAPI.getSummary(eventId);
      if (response.success) {
        setRatingSummary(response.data);
        if (response.data.currentUserStars) {
          setSelectedRating(response.data.currentUserStars);
        }
      }
    } catch (err) {
      console.error('Error loading rating summary:', err);
    } finally {
      setLoadingRating(false);
    }
  }, [eventId]);

  // Ticket status check removed for testing - all users can comment

  useEffect(() => {
    if (eventId) {
      loadComments();
      loadRatingSummary();
    }
  }, [eventId, loadComments, loadRatingSummary]);

  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
    
    // Đảm bảo con trỏ luôn ở cuối sau khi gõ
    const textarea = e.target;
    if (textarea) {
      setTimeout(() => {
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }, 0);
    }
  };

  const handleCommentInput = (e) => {
    const textarea = e.target;
    if (textarea) {
      setTimeout(() => {
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }, 0);
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

    // Ticket requirement removed for testing - all users can comment

    try {
      setSubmitting(true);
      setError(null);
      const response = await commentsAPI.create(eventId, newComment.trim());
      if (response.success) {
        setNewComment('');
        
        // If user selected a rating, submit it after comment is created
        if (selectedRating > 0) {
          await handleRatingSubmit();
        } else {
          await loadRatingSummary(); // Just reload rating summary if no rating
        }
        
        await loadComments(); // Reload comments
      }
    } catch (err) {
      setError(err.message || 'Không thể gửi bình luận. Vui lòng thử lại sau.');
      console.error('Error submitting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để đánh giá.');
      return;
    }

    // Ticket requirement removed for testing - all users can rate

    if (selectedRating < 1 || selectedRating > 5) {
      setError('Vui lòng chọn số sao từ 1 đến 5.');
      return;
    }

    try {
      setSubmittingRating(true);
      setError(null);
      const response = await ratingsAPI.rateEvent(eventId, selectedRating);
      if (response.success) {
        setRatingSummary(response.data);
        await loadComments(); // Reload comments to update rating stars
      }
    } catch (err) {
      setError(err.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
      console.error('Error submitting rating:', err);
    } finally {
      setSubmittingRating(false);
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

  const handleEditComment = (comment) => {
    setEditingComment(comment.commentId);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const response = await commentsAPI.update(editingComment, { content: editContent.trim() });
      if (response.success) {
        setEditingComment(null);
        setEditContent('');
        await loadComments(); // Reload comments
      }
    } catch (err) {
      setError(err.message || 'Không thể cập nhật bình luận. Vui lòng thử lại sau.');
      console.error('Error updating comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleReaction = async (commentId, reactionType) => {
    if (!user) {
      // Thay alert bằng thông báo đẹp hơn
      setError('Vui lòng đăng nhập để thực hiện chức năng này.');
      return;
    }

    try {
      const response = await commentsAPI.toggleReaction(commentId, reactionType);
      if (response.success) {
        await loadComments(); // Reload comments to update reaction counts
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
      setError(err.message || 'Không thể thực hiện thao tác. Vui lòng thử lại sau.');
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

  const CommentItem = ({ comment }) => {
    const avatarUrl = getAvatarUrl(comment.userAvatar);
    const isEditing = editingComment === comment.commentId;

    return (
      <Box sx={{ mb: 2 }}>
        <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
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
                
                {isEditing ? (
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      disabled={submitting}
                      size="small"
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={submitting ? <CircularProgress size={16} /> : <Save />}
                        onClick={handleSaveEdit}
                        disabled={submitting || !editContent.trim()}
                      >
                        Lưu
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Cancel />}
                        onClick={handleCancelEdit}
                        disabled={submitting}
                      >
                        Hủy
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                      {comment.content}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
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
                      {comment.canDelete && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleEditComment(comment)}
                            color="primary"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(comment.commentId)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                    
                    {/* Display rating stars below "Hay" */}
                    {comment.ratingStars && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                          Đánh giá:
                        </Typography>
                        <Stack direction="row" spacing={0.2}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              sx={{
                                fontSize: 16,
                                color: star <= comment.ratingStars ? '#ffc107' : '#e0e0e0'
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </>
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

      {/* Rating Summary - Google Maps Style */}
      {!loadingRating && ratingSummary && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Star sx={{ fontSize: 48, color: '#ffc107', mr: 1 }} />
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#ffc107' }}>
                      {ratingSummary.averageStars.toFixed(1)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Điểm {ratingSummary.averageStars.toFixed(1)} SAO trên tổng số {ratingSummary.totalRatings} lượt đánh giá
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = star === 5 ? ratingSummary.fiveStarCount :
                                  star === 4 ? ratingSummary.fourStarCount :
                                  star === 3 ? ratingSummary.threeStarCount :
                                  star === 2 ? ratingSummary.twoStarCount :
                                  ratingSummary.oneStarCount;
                    const percentage = ratingSummary.totalRatings > 0 ? (count / ratingSummary.totalRatings) * 100 : 0;
                    return (
                      <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ width: 60 }}>
                          {star} sao
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            flex: 1,
                            mx: 2,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'grey.300',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#ffc107'
                            }
                          }}
                        />
                        <Typography variant="body2" sx={{ width: 60, textAlign: 'right' }}>
                          {count}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Comment input */}
      {user && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              {/* Ticket status check removed - all users can comment */}
              <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Viết bình luận của bạn..."
                    value={newComment}
                    onChange={handleCommentChange}
                    onInput={handleCommentInput}
                    disabled={submitting || userHasCommented}
                    inputProps={{ 
                      style: { 
                        direction: 'ltr',
                        textAlign: 'left'
                      },
                      autoCapitalize: 'sentences',
                      spellCheck: 'true'
                    }}
                  />
                  
                  {/* Rating stars - only show after user types content */}
                  {newComment.trim() && !userHasCommented && (
                    <Box sx={{ py: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
                        Đánh giá của bạn:
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <IconButton
                            key={star}
                            onClick={() => setSelectedRating(star)}
                            disabled={submittingRating}
                            sx={{ p: 0.5 }}
                          >
                            {star <= selectedRating ? (
                              <Star sx={{ fontSize: 32, color: '#ffc107' }} />
                            ) : (
                              <StarBorder sx={{ fontSize: 32, color: '#e0e0e0' }} />
                            )}
                          </IconButton>
                        ))}
                      </Box>
                      {selectedRating > 0 && (
                        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                          Bạn đã chọn {selectedRating} sao
                        </Typography>
                      )}
                    </Box>
                  )}

                  {userHasCommented && (
                    <Alert severity="info">
                      Mỗi sự kiện chỉ được comment 1 lần
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
                      onClick={handleSubmitComment}
                      disabled={submitting || !newComment.trim() || userHasCommented}
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

