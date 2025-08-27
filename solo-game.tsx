'use client';

import { useSoloTriviaGeneration } from '@/hooks/useSoloTriviaGeneration';
import { useCallback, useEffect, useRef, useState } from 'react';
import SoloTriviaQuestionnaire from './solo-trivia-questionnaire';
import { z } from 'zod';
import styles from './solo-game.module.scss';

const FormSchema = z.object({
  topic: z.string().min(1, { message: 'Topic is required' }),
  numberOfQuestions: z.coerce
    .number({ invalid_type_error: 'Number of Questions must be a number' })
    .int({ message: 'Must be a whole number' })
    .positive({ message: 'Must be greater than 0' }),
  timeLimit: z.coerce
    .number({ invalid_type_error: 'Time Limit must be a number' })
    .int({ message: 'Must be a whole number' })
    .positive({ message: 'Must be greater than 0' }),
});
export type GameDetails = z.infer<typeof FormSchema>;
export default function SoloGame({ topic }: { topic?: string }) {
  const {
    generate,
    cancel,
    trivia,
    isGenerating,
    isAborted,
    isCancelling,
    error,
    reset,
  } = useSoloTriviaGeneration();

  const topicInputRef = useRef<HTMLInputElement>(null);
  const numberOfQuestionsRef = useRef<HTMLInputElement>(null);
  const timeLimitRef = useRef<HTMLInputElement>(null);
  const lastValuesRef = useRef<GameDetails>({
    topic: topic ?? '',
    numberOfQuestions: 10,
    timeLimit: 10,
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(
    topic ? lastValuesRef.current : null
  );

  useEffect(() => {
    if (gameDetails && !trivia) {
      generate(gameDetails);
    }
  }, [generate, gameDetails, trivia]);
  useEffect(() => {
    if (isAborted) {
      setFormErrors([]);
      setGameDetails(null);
    }
  }, [isAborted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = {
      topic: topicInputRef.current?.value,
      numberOfQuestions: numberOfQuestionsRef.current?.value,
      timeLimit: timeLimitRef.current?.value,
    };
    const result = FormSchema.safeParse(raw);
    if (!result.success) {
      // collect all Zod error messages into an array
      const issues = result.error.issues.map((i) => i.message);
      setFormErrors(issues);
      return;
    }
    reset();
    lastValuesRef.current = result.data;
    setFormErrors([]);
    setGameDetails(result.data);
  };
  const handleNewGame = useCallback(() => {
    reset();
    setFormErrors([]);
    setGameDetails(null);
    lastValuesRef.current = { ...lastValuesRef.current, topic: '' };
  }, [reset]);
  return (
    <div className={styles.root}>
      {trivia ? (
        <SoloTriviaQuestionnaire
          onNewGame={handleNewGame}
          trivia={trivia}
          timeLimit={gameDetails?.timeLimit || 10}
        />
      ) : (
        <form onSubmit={handleSubmit} className={styles.generateForm}>
          <h1>Generate trivia</h1>
          <label>
            Number of questions
            <input
              type="number"
              name="numberOfQuestions"
              defaultValue={lastValuesRef.current.numberOfQuestions}
              disabled={isGenerating}
              ref={numberOfQuestionsRef}
            />
          </label>
          <label>
            Time per question (s)
            <input
              type="number"
              name="timeLimit"
              defaultValue={lastValuesRef.current.timeLimit}
              disabled={isGenerating}
              ref={timeLimitRef}
            />
          </label>
          <label>
            Topic
            <input
              name="topic"
              type="text"
              id="topic"
              placeholder="Enter trivia topic"
              defaultValue={lastValuesRef.current.topic}
              disabled={isGenerating}
              ref={topicInputRef}
              required
            />
          </label>
          {formErrors.length > 0 && (
            <ul>
              {formErrors.map((msg, i) => (
                //TODO no correlation between input and error message
                <li key={i} className={styles.error}>
                  {msg}
                </li>
              ))}
            </ul>
          )}
          <button type="submit" className="primary" disabled={isGenerating}>
            {isGenerating ? 'Loading...' : 'Submit'}
          </button>
          {isGenerating && (
            <button type="button" onClick={cancel} disabled={isCancelling}>
              {isCancelling ? 'Cancelling...' : 'Cancel generation'}
            </button>
          )}
        </form>
      )}
      {error && <p className={styles.error}>Error: {error}</p>}
    </div>
  );
}
