import { Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import Account from './pages/Account'
import PublicTrainers from './pages/PublicTrainers'
import PublicTrainerDetail from './pages/PublicTrainerDetail'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import TrainerDashboard from './pages/trainer/TrainerDashboard'
import TrainerSchedule from './pages/trainer/TrainerSchedule'
import TrainerPatients from './pages/trainer/TrainerPatients'
import TrainerPlaces from './pages/trainer/TrainerPlaces'
import TrainerProfile from './pages/trainer/TrainerProfile'
import TrainerRequests from './pages/trainer/TrainerRequests'

import TraineeTrainers from './pages/trainee/TraineeTrainers'
import TraineeBookTrainer from './pages/trainee/TraineeBookTrainer'
import TraineeBookings from './pages/trainee/TraineeBookings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/trainers" element={<PublicTrainers />} />
      <Route path="/trainers/:trainerId" element={<PublicTrainerDetail />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/account" element={<Account />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="trainer" />}>
        <Route element={<Layout />}>
          <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
          <Route path="/trainer/schedule" element={<TrainerSchedule />} />
          <Route path="/trainer/patients" element={<TrainerPatients />} />
          <Route path="/trainer/places" element={<TrainerPlaces />} />
          <Route path="/trainer/profile" element={<TrainerProfile />} />
          <Route path="/trainer/requests" element={<TrainerRequests />} />
        </Route>
      </Route>

      {/* Trainee-capability routes: available to trainees, and to trainers acting as someone else's patient */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/trainee/trainers" element={<TraineeTrainers />} />
          <Route path="/trainee/trainers/:trainerId" element={<TraineeBookTrainer />} />
          <Route path="/trainee/bookings" element={<TraineeBookings />} />
        </Route>
      </Route>

      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
