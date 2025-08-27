/**
 * SoloTriviaQuestionnaire Component
 *
 * This component orchestrates a solo real-time trivia match.
 * It manages the game flow: initial countdown, question timer, answer submission,
 * and displaying results. After finishing, it offers to start a new game.
 *
 * ---
 *
 * 🔧 **Architecture Summary**
 *
 * - Manages `current` question index and collected `answers` in local state.
 * - Uses `useCountdownTimer` to drive countdown display and timer resets.
 * - Detects device type via `useIsProbablyDesktop` to render mobile or desktop question UI.
 * - Blocks navigation via `usePreventNavigation` (inherited globally).
 *
 * ---
 *
 * ⏱️ **Game Flow**
 *
 * 1. On mount, begins an initial "Starting in" countdown (5 seconds).
 * 2. After countdown, displays each question with a countdown timer (`timeLimit`).
 * 3. Player selects an answer or timer expires.
 *    - On answer: records immediately, waits 500ms for CSS animation, then advances.
 *    - On timeout: if not already answered, records a blank incorrect answer and advances.
 *
 * ---
 *
 * ✅ **Answer Handling**
 *
 * - `hasAnsweredRef` prevents double submissions from rapid clicks or simultaneous timeout.
 * - `handleAnswer` sets the ref, queues answer + advance after `animationBuffer` ms.
 * - `handleCountdownEnd` submits blank answer if none was given by timeout.
 *
 * ---
 *
 * 🔄 **Results**
 *
 * - When all questions answered, renders `TriviaResults` in solo mode.
 * - Provides "End Current Trivia And Start New" button throughout to restart via `onNewGame`.
 */
'use client';

import { Answer, Trivia } from '@/lib/schemas';
import TriviaQuestionMobile from './trivia-question-mobile';
import { useCallback, useEffect, useRef, useState } from 'react';
import TriviaResults from './trivia-results';
import styles from './trivia-questionnaire.module.scss';

import Countdown from './countdown';
import { useIsProbablyDesktop } from '@/hooks/useIsProbablyDesktop';
import TriviaQuestionDesktop from './trivia-question-desktop';
import { useCountdownTimer } from '@/hooks/useCountdownTimer';
export default function SoloTriviaQuestionnaire({
  trivia,
  timeLimit,
  onNewGame,
}: {
  trivia: Trivia;
  timeLimit: number;
  onNewGame: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const questions = trivia.questions;
  const [countDown, beginCountdown] = useCountdownTimer();
  const isDesktop = useIsProbablyDesktop();
  const isGameFinished = current === questions.length;
  useEffect(() => beginCountdown(5), [beginCountdown]);

  // Prevents handleCountdownEnd from recording a duplicate blank answer
  const hasAnsweredRef = useRef(false);
  // Reset when current question changes
  useEffect(() => {
    hasAnsweredRef.current = false;
  }, [current]);
  // Add a 500ms buffer so our wrong / correct css animation has time to run
  const animationBuffer = 500;
  /**
   * Called when the countdown timer hits zero before the player has answered.
   *
   * This function handles the case where the player runs out of time.
   * However, due to animations and input timing, there's a chance that the
   * player clicked an answer at the *same moment* the timer expired.
   *
   * To prevent both a real answer and an auto-submitted blank answer from being recorded,
   * we use `hasAnsweredRef` as a guard. If the user *already answered*:
   *   - `hasAnsweredRef.current` will be true
   *   - We reset it and bail early (no blank answer is added)
   *
   * If no answer was given:
   *   - We append a blank, incorrect answer
   *   - We advance to the next question
   *   - And notify the opponent via data channel
   *
   * @see onAnswer — The user input path sets `hasAnsweredRef.current = true` before appending an answer.
   * @see hasAnsweredRef — A ref that tracks whether the player already answered to avoid duplicates.
   */
  const handleCountdownEnd = useCallback(() => {
    // If the player already answered manually, skip this countdown-triggered fallback
    if (hasAnsweredRef.current) {
      hasAnsweredRef.current = false; // Reset for next question
      return;
    }
    // No answer was given in time — record a blank, incorrect response
    setAnswers((prevAnswers) => [
      ...prevAnswers,
      { text: '', isCorrect: false },
    ]);
    // Move to the next question
    setCurrent((c) => c + 1);
  }, []);
  const handleAnswer = useCallback(
    (a: Answer) => {
      if (hasAnsweredRef.current) return;
      hasAnsweredRef.current = true;
      setTimeout(() => {
        setAnswers((prev) => [...prev, a]);
        setCurrent((c) => c + 1);
      }, animationBuffer);
    },
    [setAnswers, setCurrent]
  );
  const isTimerIdle = countDown < 0;
  if (isTimerIdle) return null;
  return (
    <>
      {countDown === 0 && (
        <button
          className={`secondary`}
          style={{
            alignSelf: 'flex-end',
          }}
          onClick={() => onNewGame()}
        >
          End Current Trivia And Start New
        </button>
      )}
      {isGameFinished ? (
        <div className={styles.results}>
          <TriviaResults
            isSolo={true}
            questions={questions}
            answers={answers}
            opponentCorrectCount={0}
          />
          <button
            className={'secondary'}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Back to Top
          </button>
        </div>
      ) : (
        <>
          {countDown === 0 ? (
            <div className={styles.game}>
              <div className={styles.info}>
                <p>Question: {`${current + 1} / ${questions.length}`}</p>
                <Countdown
                  timeLimit={timeLimit}
                  key={current}
                  onCountdownEnd={handleCountdownEnd}
                />
              </div>
              {isDesktop ? (
                <TriviaQuestionDesktop
                  key={questions[current].text}
                  question={questions[current]}
                  onAnswer={handleAnswer}
                />
              ) : (
                <TriviaQuestionMobile
                  key={questions[current].text}
                  question={questions[current]}
                  onAnswer={handleAnswer}
                />
              )}
            </div>
          ) : (
            <p key={countDown} className={styles.countdown}>
              Starting in: {countDown} seconds
            </p>
          )}
        </>
      )}
    </>
  );
}
