// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ProjectList from "./pages/ProjectList";
import ProjectContainer from "./pages/ProjectContainer";
import ProjectDetail from "./pages/ProjectDetail";
import KanbanBoard from "./pages/KanbanBoard";
import Backlog from "./pages/Backlog";
import SprintList from "./pages/SprintList";
import IssueList from "./pages/IssueList";
import IssueDetail from "./pages/IssueDetail";
import BPMNList from "./pages/BPMNList";
import BPMNEditor from "./pages/BPMNEditor";
import BPMNViewerPage from "./pages/BPMNViewer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BPMNDiffViewerPage from "./pages/BPMNDiffViewerPage"; //

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* ------------------ Public Routes ------------------ */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/*-------------------Protected Routes --------------- */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* ProjectList */}
              <Route path="/" element={<ProjectList />} />

              {/* ProjectContainer */}
              <Route path="/project/:projectId" element={<ProjectContainer />}>
                {/* ProjectDetail */}
                <Route index element={<ProjectDetail />} />

                {/* KanbanBoard */}
                <Route path="board" element={<KanbanBoard />} />

                {/* Backlog */}
                <Route path="backlog" element={<Backlog />} />

                {/* SprintList */}
                <Route path="sprints" element={<SprintList />} />

                {/* IssueList */}
                <Route path="issues" element={<IssueList />} />

                {/* IssueDetail */}
                <Route path="issues/:issueId" element={<IssueDetail />} />

                {/* BPMNList */}
                <Route path="bpmn" element={<BPMNList />} />
                <Route path="bpmn/:diagramId" element={<BPMNEditor />} />
                <Route
                  path="bpmn/:diagramId/view"
                  element={<BPMNViewerPage />}
                />

                {/* add new route  */}
                <Route
                  path="bpmn/:diagramId/diff"
                  element={<BPMNDiffViewerPage />}
                />
              </Route>
            </Route>
          </Route>

          {/* 404 */}
          {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
