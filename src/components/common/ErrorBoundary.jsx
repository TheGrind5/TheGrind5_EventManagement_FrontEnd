import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Stack,
  Alert,
  AlertTitle
} from '@mui/material';
import { 
  Error as ErrorIcon, 
  Refresh as RefreshIcon,
  Home as HomeIcon 
} from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and potentially to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            p: 3
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center'
            }}
          >
            <Stack spacing={3} alignItems="center">
              <ErrorIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'error.main' 
                }} 
              />
              
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Oops! Something went wrong
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  We're sorry, but something unexpected happened. 
                  Our team has been notified and is working to fix this issue.
                </Typography>
              </Box>

              <Alert severity="error" sx={{ width: '100%' }}>
                <AlertTitle>Error Details</AlertTitle>
                {this.state.error && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {this.state.error.toString()}
                  </Typography>
                )}
              </Alert>

              <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  sx={{ flex: 1 }}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                  sx={{ flex: 1 }}
                >
                  Go Home
                </Button>
              </Stack>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Box sx={{ mt: 3, width: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Development Error Details:
                  </Typography>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'grey.100', 
                      textAlign: 'left',
                      overflow: 'auto',
                      maxHeight: 300
                    }}
                  >
                    <pre style={{ margin: 0, fontSize: '12px' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Stack>
          </Paper>
        </Box>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
