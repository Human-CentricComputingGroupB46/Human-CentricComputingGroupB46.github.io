import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './routes/HomePage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
