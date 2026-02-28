import React, {
  StrictMode,
  useState,
  useEffect,
  createContext,
  Component,
} from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import axios from "axios";
import "./api/axiosInstance";

export const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

let root = null;

function render() {
  const container = document.getElementById("root");
  if (!root) {
    root = createRoot(container);
  }

  root.render(
    <ErrorBoundary>
      <StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </StrictMode>
    </ErrorBoundary>,
  );
}

// Configure global axios defaults for runtime requests (production-ready)
try {
  axios.defaults.baseURL =
    import.meta.env.VITE_API_BASE_URL || axios.defaults.baseURL;
  const token = localStorage.getItem("token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
} catch (err) {
  // keep silent if running outside browser environment
}

render();

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    render();
  });
}
