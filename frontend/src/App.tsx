import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MainLayout } from "./layouts/MainLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { VideoSummarizerPage } from "./pages/VideoSummarizerPage";
import { DocumentSummarizerPage } from "./pages/DocumentSummarizerPage";
import { RagChatPage } from "./pages/RagChatPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="Application Error Encountered">
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route
                path="video"
                element={
                  <ErrorBoundary fallbackTitle="Video Summarizer Encountered an Issue">
                    <VideoSummarizerPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="document"
                element={
                  <ErrorBoundary fallbackTitle="Document Summarizer Encountered an Issue">
                    <DocumentSummarizerPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="rag"
                element={
                  <ErrorBoundary fallbackTitle="RAG Knowledge Chat Encountered an Issue">
                    <RagChatPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="history"
                element={
                  <ErrorBoundary fallbackTitle="History View Encountered an Issue">
                    <HistoryPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="settings"
                element={
                  <ErrorBoundary fallbackTitle="Settings View Encountered an Issue">
                    <SettingsPage />
                  </ErrorBoundary>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
