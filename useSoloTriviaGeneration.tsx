import { GameDetails } from '@/components/solo-game';
import {
  ANON_FTGR_LIMIT_EXCEEDED_ERROR,
  REGISTERED_FTGR_LIMIT_EXCEEDED_ERROR,
} from '@/lib/constants';
import {
  SoloGenerateFormSchema,
  SoloGenerateFormType,
  Trivia,
  TriviaSchema,
} from '@/lib/schemas';
import { useCallback, useRef, useState } from 'react';
import { useRefreshCredits } from './useRefreshCredits';

export function useSoloTriviaGeneration() {
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAborted, setIsAborted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [trivia, setTrivia] = useState<Trivia | null>();
  const submissionIdRef = useRef<string | null>(null);
  const refreshCredits = useRefreshCredits();
  const reset = useCallback(() => {
    setTrivia(null);
    setError('');
    setIsCancelling(false);
    setIsAborted(false);
    setIsGenerating(false);
    submissionIdRef.current = null;
  }, []);
  const cancel = useCallback(async () => {
    if (!submissionIdRef.current) {
      setError('Cancellation failed: No submission id.');
      return;
    }
    setIsCancelling(true);
    const formData = new FormData();
    formData.append('submissionId', submissionIdRef.current);
    try {
      const res = await fetch('/api/trivia/cancel', {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json()) as {
        submissionId: string;
      };
      const cancelSubmissionId = data.submissionId;
      if (!cancelSubmissionId) {
        console.error('Submission id missing from cancel response');
        setError(
          'Cancellation failed: No submission id. Please refresh page to reset the website.'
        );
        return;
      }
      if (cancelSubmissionId !== submissionIdRef.current) {
        // Return early if cancel response comes back after we started a new generation
        return;
      }
      if (!res.ok) {
        setIsCancelling(false);
        throw new Error(`Cancel failed: ${res.status} ${res.statusText}`);
      } else {
        setIsGenerating(false);
        setIsCancelling(false);
      }
    } catch (error) {
      console.error('Cancel generate trivia error', error);
      setError('There was an error cancelling your trivia generation.');
    }
  }, []);
  const generate = useCallback(
    async ({ topic, numberOfQuestions }: GameDetails) => {
      setError('');
      submissionIdRef.current = crypto.randomUUID();
      const payload: SoloGenerateFormType = {
        topic,
        numberOfQuestions,
        submissionId: submissionIdRef.current,
      };

      const validation = SoloGenerateFormSchema.safeParse(payload);
      if (!validation.success) {
        setError('Invalid form submission');
        return;
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      setIsGenerating(true);
      let generateSubmissionId = null;
      try {
        const response = await fetch('/api/trivia/generate-solo', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        generateSubmissionId = data.submissionId;
        if (!generateSubmissionId) {
          console.error('Submission id missing from generate response');
          setError(
            'Generation failed: No submission id. Please refresh page to reset the website.'
          );
          return;
        }
        if (generateSubmissionId !== submissionIdRef.current) {
          // Return early if generate response comes back after we started a new generation
          return;
        }
        if (data.error) {
          //TODO should I have data.limit_exceeded instead of .error?
          if (data.error === ANON_FTGR_LIMIT_EXCEEDED_ERROR) {
            setError(
              'You’ve used all 5 free trivia plays for anon accounts. Sign up for free to get 5 more.'
            );
            return;
          } else if (data.error === REGISTERED_FTGR_LIMIT_EXCEEDED_ERROR) {
            setError(
              'You’ve used all 10 free trivia credits for registered accounts. Please buy credits to continue generating and playing trivia.'
            );
            return;
          }
          setError(data.error);
          return;
        } else if (data.aborted) {
          setIsAborted(true);
          return;
        }
        //Throw if any other errors
        if (!response.ok) {
          throw Error();
        }

        const validatedFields = TriviaSchema.safeParse(data);
        if (!validatedFields.success) {
          setError('Generated trivia has incorrect format.');
          return;
        }
        //Reset error again so that we clear it if there was an error that occurred while cancelling
        setError('');
        setTrivia(validatedFields.data);
      } catch (error) {
        console.log(error);
        setError(
          'Error generating trivia. Please refresh the website and try again.'
        );
      } finally {
        if (generateSubmissionId === submissionIdRef.current) {
          setIsGenerating(false);
        }
        // Refresh our credits view no matter what happens after a generate call
        refreshCredits();
      }
    },
    [refreshCredits]
  );
  return {
    generate,
    cancel,
    trivia,
    isGenerating,
    isAborted,
    isCancelling,
    error,
    reset,
  };
}
