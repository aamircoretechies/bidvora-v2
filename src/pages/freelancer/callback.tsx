import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { freelancerService } from '@/services/freelancer.service';
import { toast } from 'sonner';

export const FreelancerCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setStatus('error');
      setErrorMessage('Freelancer authorization code is missing.');
      return;
    }

    const connectAccount = async () => {
      try {
        const response = await freelancerService.connectFreelancerCallback(code);
        
        if (response.success && response.data.connected) {
          setStatus('success');
          toast.success('Freelancer account connected successfully.');
          
          // If opened in popup
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'FREELANCER_CONNECTED' }, window.location.origin);
            window.close();
          } else {
            // Fallback redirect
            navigate('/', { replace: true });
          }
        } else {
          setStatus('error');
          setErrorMessage('Unable to connect Freelancer account. Please try again.');
        }
      } catch (error: any) {
        setStatus('error');
        // Handle specific status codes based on requirements
        const statusCode = error?.response?.status || (error.message.includes('expired') ? 401 : 500);
        
        if (statusCode === 401) {
          setErrorMessage('Your session has expired. Please log in again.');
        } else if (statusCode === 400 && error?.response?.data?.message) {
          setErrorMessage(error.response.data.message);
        } else if (statusCode === 422 && error?.response?.data?.message) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage(error?.message || 'Unable to connect Freelancer account. Please try again.');
        }
      }
    };

    connectAccount();
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-secondary-foreground">Connecting Freelancer account...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-success/20 text-success rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-medium text-success">Freelancer account connected successfully.</p>
          <p className="text-sm text-secondary-foreground">You can safely close this window.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-destructive/20 text-destructive rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-lg font-medium text-destructive">{errorMessage}</p>
          <button 
            onClick={() => window.close()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Close Window
          </button>
        </div>
      )}
    </div>
  );
};
