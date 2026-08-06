import { useState, useEffect } from "react";

export const DigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const format2Digit = (num: number) => num.toString().padStart(2, "0");
  const d = format2Digit(time.getDate());
  const m = format2Digit(time.getMonth() + 1);
  const y = time.getFullYear();
  const hrs = format2Digit(time.getHours());
  const mins = format2Digit(time.getMinutes());
  const secs = format2Digit(time.getSeconds());

  return (
    <div className="font-mono text-[10px] tracking-widest text-[#B3C5DF] tabular-nums">
      {d}-{m}-{y} &nbsp;&nbsp; {hrs}:{mins}:{secs}
    </div>
  );
};
