export default function MoodGauge({ mood }) {
  return (
    <div className="mood-gauge" aria-label={`편안함 정도 ${mood} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className={`cell${n <= mood ? " filled" : ""}`} />
      ))}
    </div>
  );
}
