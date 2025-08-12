import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserForm } from './components/generated/UserForm';
import DashboardLayout from './components/DashboardLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Dashboard Layout as parent route */}
        <Route path="/" element={<DashboardLayout />}>
          {/* Dashboard home */}
          <Route index element={<div>Welcome to the Dashboard</div>} />

          {/* Example child routes */}
          <Route path="userform" element={<UserForm />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
