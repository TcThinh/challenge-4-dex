"use client";

import { useTheme } from "~~/components/providers/ThemeProvider";

export const ThemeToggle = () => {
  const { theme, setTheme, actualTheme } = useTheme();

  const themes = [
    { value: "light" as const, label: "Light Theme", icon: "☀️" },
    { value: "dark" as const, label: "Dark Theme", icon: "🌙" },
    { value: "auto" as const, label: "Auto", icon: "🎨" },
  ];

  const currentIcon =
    theme === "auto"
      ? actualTheme === "dark"
        ? "🌙"
        : "☀️"
      : themes.find((t) => t.value === theme)?.icon || "🌙";

  return (
    <div className="dropdown dropdown-end">
      <label
        tabIndex={0}
        className="btn btn-ghost btn-circle btn-sm hover:bg-base-300/50 transition-all duration-200"
        title={`Current theme: ${theme}`}
      >
        <span className="text-lg">{currentIcon}</span>
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100/95 backdrop-blur-md rounded-box w-52 border border-base-300/50"
      >
        {themes.map((themeOption) => (
          <li key={themeOption.value}>
            <button
              className={`flex items-center gap-3 hover:bg-base-300/50 transition-colors ${
                theme === themeOption.value
                  ? "bg-primary/10 text-primary font-semibold"
                  : ""
              }`}
              onClick={() => setTheme(themeOption.value)}
            >
              <span className="text-lg">{themeOption.icon}</span>
              <span>{themeOption.label}</span>
              {theme === themeOption.value && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
