interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  size?: number;
}

const STAR_COUNT = 5;

// Renders half-star-capable rating widget. Clicking the left half of a star
// sets a .5 value, the right half sets a whole value.
export function StarRating({ value, onChange, size = 22 }: StarRatingProps) {
  const rating = value ?? 0;
  const interactive = !!onChange;

  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined}>
      {Array.from({ length: STAR_COUNT }).map((_, i) => {
        const starIndex = i + 1;
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <div key={i} className="relative" style={{ width: size, height: size }}>
            <svg
              viewBox="0 0 24 24"
              width={size}
              height={size}
              className="absolute inset-0 text-royal/25"
              fill="currentColor"
            >
              <path d={STAR_PATH} />
            </svg>
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 24 24" width={size} height={size} className="text-royal" fill="currentColor">
                <path d={STAR_PATH} />
              </svg>
            </div>
            {interactive && (
              <div className="absolute inset-0 flex">
                <button
                  type="button"
                  aria-label={`Rate ${starIndex - 0.5} stars`}
                  className="h-full w-1/2 cursor-pointer"
                  onClick={() => onChange!(starIndex - 0.5)}
                />
                <button
                  type="button"
                  aria-label={`Rate ${starIndex} stars`}
                  className="h-full w-1/2 cursor-pointer"
                  onClick={() => onChange!(starIndex)}
                />
              </div>
            )}
          </div>
        );
      })}
      {value != null && <span className="ml-1.5 text-sm text-ink-soft">{value.toFixed(1)}</span>}
    </div>
  );
}

const STAR_PATH =
  "M12 2.5l2.9 6.14 6.6.68-4.95 4.6 1.33 6.58L12 17.3l-5.88 3.2 1.33-6.58-4.95-4.6 6.6-.68z";
