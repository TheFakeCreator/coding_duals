import { useState, useRef, useEffect } from "react";

export default function useTimer(initialTime) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timerRef = useRef(null);

  const startTimer = () => {
    if (timerRef.current) return; // Prevent multiple timers
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopTimer(); // Cleanup on unmount
  }, []);

  return { timeLeft, startTimer, stopTimer };
}
