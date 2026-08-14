const LEVEL_LABEL = { easy: "쉬움", mid: "보통", hard: "도전" };

export default function LevelDots({ level }) {
  return (
    <span className={`lvl ${level}`}>
      <span className="dots">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </span>
      {LEVEL_LABEL[level] || level}
    </span>
  );
}
