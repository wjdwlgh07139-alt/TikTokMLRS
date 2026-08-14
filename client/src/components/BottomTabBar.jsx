export default function BottomTabBar({ currentPath, onNavigate }) {
  const norm = currentPath.startsWith("/prep")
    ? "/prep"
    : currentPath === ""
    ? "/"
    : currentPath === "/careendtemplate" ||
      currentPath === "/careendtemplete" ||
      currentPath === "/contact/closing"
    ? "/contact/matching"
    : currentPath;

  const tabs = [
    { id: "/", label: "리허설", icon: "🎭" },
    { id: "/prep", label: "수업 준비", icon: "📋" },
    { id: "/contact/matching", label: "첫 연락", icon: "🤝" },
  ];

  return (
    <nav className="bottom-tabbar" aria-label="하단 네비게이션">
      {tabs.map((tab) => {
        const isActive = norm === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`bottom-tab-item ${isActive ? "active" : ""}`}
            onClick={() => onNavigate(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
