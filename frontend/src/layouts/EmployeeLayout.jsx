import {
  NavLink,
  Outlet
} from "react-router-dom";

import {
  useAuth
} from "../auth/AuthContext";


const menu = [
  ["Dashboard", "/employee"],
  ["My Tasks", "/employee/tasks"],
  ["Daily Work", "/employee/work"],
  ["My Performance", "/employee/performance"],
  ["Profile", "/employee/profile"]
];


export default function EmployeeLayout() {

  const {
    user,
    logout
  } = useAuth();


  return (
    <div className="min-h-screen flex bg-gray-100">

      <aside className="w-64 bg-slate-900 text-white">

        <div className="p-6 border-b border-slate-700">

          <h1 className="font-bold text-lg">
            Employee Portal
          </h1>

        </div>


        <nav className="p-3">

          {menu.map(
            ([label, path]) => (

              <NavLink
                key={path}
                to={path}
                end={
                  path
                  === "/employee"
                }
                className={
                  ({ isActive }) =>
                    `block px-4 py-3 rounded-lg mb-1 ${
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


      <div className="flex-1">

        <header className="bg-white border-b px-7 py-4 flex justify-between">

          <h2 className="font-semibold">
            My Workspace
          </h2>


          <div className="flex gap-4 items-center">

            <span>
              {user?.username}
            </span>

            <button
              onClick={logout}
              className="bg-gray-100 px-4 py-2 rounded-lg"
            >
              Logout
            </button>

          </div>

        </header>


        <main className="p-6">

          <Outlet />

        </main>

      </div>

    </div>
  );
}