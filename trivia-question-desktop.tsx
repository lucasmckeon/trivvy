'use client';

import { Answer, Question } from '@/lib/schemas';
import styles from './trivia-question.module.scss';
import { memo, useEffect, useRef, useState, useLayoutEffect } from 'react';
/**
 * TriviaQuestionDesktop Component
 *
 * Renders a single trivia question and its answer options for desktop users.
 * Supports answer selection by click or keyboard shortcuts (keys 1–4).
 * Invokes the parent callback with the chosen answer.
 *
 * ---
 *
 * 🐞 **Safari Layout Note**
 * Implements a robust layout workaround for a well-documented Safari rendering bug
 * where the answer container sometimes renders too tall on first paint, then shrinks
 * after user interaction. The solution is a JavaScript "paint hack" that temporarily
 * pins the container's minHeight to its current offsetHeight on mount/update,
 * then removes it after the next animation frame to restore natural layout flow.
 * This guarantees correct sizing from the first render in Safari (macOS/iOS).
 *
 * @see Full context and solution: https://chatgpt.com/c/68701206-2e84-8012-8f38-dc06538ed8fa
 *
 * @param {Object} props
 * @param {Question} props.question - The trivia question to display.
 * @param {(answer: Answer) => void} props.onAnswer - Callback invoked when an answer is selected (click or keyboard).
 *
 * @returns {JSX.Element} The desktop trivia question/answer UI.
 */

function TriviaQuestionDesktop({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (answer: Answer) => void;
}) {
  const answers = question.answers;
  const [selected, setSelected] = useState(-1);
  const hasAnsweredRef = useRef(false);

  // Add ref for the container to pin the height
  const containerRef = useRef<HTMLFieldSetElement>(null);

  // The 100% working JS paint hack for Safari
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el) {
      // Pin the height on first paint
      el.style.minHeight = el.offsetHeight + 'px';
      // Remove the hack after one frame, restoring natural layout
      requestAnimationFrame(() => {
        el.style.minHeight = '';
      });
    }
  }, [question.text]); // Runs on every question change

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4' && !hasAnsweredRef.current) {
        const idx = Number(e.key) - 1;
        hasAnsweredRef.current = true;
        setSelected(idx);
        onAnswer(answers[idx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answers, onAnswer]);

  return (
    <div className={styles.root}>
      {/* Attach the ref here */}
      <fieldset ref={containerRef} className={styles.fieldSet}>
        <legend className={styles.question}>{question.text}</legend>
        {answers.map((ans, i) => (
          <label
            key={`${question.text}+${ans.text}`}
            className={`${ans.isCorrect ? styles.correct : styles.wrong}`}
          >
            {`${i + 1}: `}
            <input
              type="radio"
              name={`answer-${question.text}`}
              value={ans.text}
              checked={selected === i}
              onChange={() => {
                (document.activeElement as HTMLElement | null)?.blur();
                setSelected(i);
                onAnswer(ans);
              }}
              tabIndex={-1}
            />
            {ans.text}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export default memo(TriviaQuestionDesktop);
