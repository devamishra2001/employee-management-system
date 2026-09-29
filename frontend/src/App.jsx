import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import {
  AuthProvider
} from "./auth/AuthContext";

import ProtectedRoute
  from "./auth/ProtectedRoute";

import Login
  from "./pages/Login";

import AdminLayout
  from "./layouts/AdminLayout";

import EmployeeLayout
  from "./layouts/EmployeeLayout";


// ============================================================
// ADMIN PAGES
// ============================================================

import AdminDashboard
  from "./pages/admin/AdminDashboard";

import Employees
  from "./pages/admin/Employees";

import Projects
  from "./pages/admin/Projects";

import Tasks
  from "./pages/admin/Tasks";

import WorkRecords
  from "./pages/admin/WorkRecords";

import EmployeePerformance
  from "./pages/admin/EmployeePerformance";

import LiveActivity
  from "./pages/admin/LiveActivity";

import Reports
  from "./pages/admin/Reports";

import MLAnalytics
  from "./pages/admin/MLAnalytics";


// ============================================================
// EMPLOYEE PAGES
// ============================================================

import EmployeeDashboard
  from "./pages/employee/EmployeeDashboard";

import MyTasks
  from "./pages/employee/MyTasks";

import DailyWork
  from "./pages/employee/DailyWork";

import MyPerformance
  from "./pages/employee/MyPerformance";

import Profile
  from "./pages/employee/Profile";


function App() {

  return (

    <BrowserRouter>

      <AuthProvider>

        <Routes>


          {/* ================================================= */}
          {/* LOGIN */}
          {/* ================================================= */}

          <Route
            path="/login"
            element={
              <Login />
            }
          />


          {/* ================================================= */}
          {/* ADMIN */}
          {/* ================================================= */}

          <Route
            path="/admin"
            element={

              <ProtectedRoute
                roles={[
                  "admin",
                  "manager"
                ]}
              >

                <AdminLayout />

              </ProtectedRoute>

            }
          >


            <Route
              index
              element={
                <AdminDashboard />
              }
            />


            <Route
              path="employees"
              element={
                <Employees />
              }
            />


            <Route
              path="projects"
              element={
                <Projects />
              }
            />


            <Route
              path="tasks"
              element={
                <Tasks />
              }
            />


            <Route
              path="work-records"
              element={
                <WorkRecords />
              }
            />


            <Route
              path="performance"
              element={
                <EmployeePerformance />
              }
            />


            <Route
              path="activity"
              element={
                <LiveActivity />
              }
            />


            <Route
              path="reports"
              element={
                <Reports />
              }
            />


            <Route
              path="ml"
              element={
                <MLAnalytics />
              }
            />


          </Route>


          {/* ================================================= */}
          {/* EMPLOYEE */}
          {/* ================================================= */}

          <Route
            path="/employee"
            element={

              <ProtectedRoute
                roles={[
                  "employee"
                ]}
              >

                <EmployeeLayout />

              </ProtectedRoute>

            }
          >


            <Route
              index
              element={
                <EmployeeDashboard />
              }
            />


            <Route
              path="tasks"
              element={
                <MyTasks />
              }
            />


            <Route
              path="work"
              element={
                <DailyWork />
              }
            />


            <Route
              path="performance"
              element={
                <MyPerformance />
              }
            />


            <Route
              path="profile"
              element={
                <Profile />
              }
            />


          </Route>


          {/* ================================================= */}
          {/* ROOT */}
          {/* ================================================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />


          {/* ================================================= */}
          {/* FALLBACK */}
          {/* ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

         <Route
           path="ml"
           element={
         <MLAnalytics />
        }
      />  


        </Routes>

      </AuthProvider>

    </BrowserRouter>

  );
}


export default App;