import {
  NavLink,
  Outlet
} from "react-router-dom";

import {
  useAuth
} from "../auth/AuthContext";


const menu = [
  ["Dashboard", "/admin"],
  ["Employees", "/admin/employees"],
  ["Projects", "/admin/projects"],
  ["Tasks", "/admin/tasks"],
  ["Work Records", "/admin/work-records"],
  ["Employee Performance", "/admin/performance"],
  ["Live Activity", "/admin/activity"],
  ["Reports", "/admin/reports"],
  ["ML Analytics", "/admin/ml"]
];


export default function AdminLayout() {

  const {
    user,
    logout
  } = useAuth();


  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* SIDEBAR */}

      <aside className="w-64 bg-slate-900 text-white min-h-screen">

        <div className="p-6 border-b border-slate-700">

          <h1 className="font-bold text-lg">
            EMS Admin
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Management Portal
          </p>

        </div>


        <nav className="p-3">

          {menu.map(
            ([label, path]) => (

              <NavLink
                key={path}
                to={path}
                end={
                  path === "/admin"
                }
                className={
                  ({ isActive }) =>
                    `block px-4 py-3 rounded-lg mb-1 transition ${
                      isActive
                        ? "bg-blue-600"
                        : "hover:bg-slate-800"
                    }`
                }
              >

                {label}

              </NavLink>

            )
          )}

        </nav>

      </aside>


      {/* MAIN AREA */}

      <div className="flex-1 min-w-0">

        {/* HEADER */}

        <header className="bg-white border-b px-7 py-4 flex justify-between items-center">

          <div>

            <h2 className="font-semibold text-gray-900">
              Employee Management System
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Administration Portal
            </p>

          </div>


          <div className="flex items-center gap-4">

            <div className="text-right">

              <div className="text-sm font-medium text-gray-900">
                {user?.username}
              </div>

              <div className="text-xs text-gray-500 capitalize">
                {user?.role}
              </div>

            </div>


            <button
              onClick={logout}
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm"
            >
              Logout
            </button>

          </div>

        </header>


        {/* PAGE CONTENT */}

        <main className="p-6">

          <Outlet />

        </main>

      </div>

    </div>
  );
}