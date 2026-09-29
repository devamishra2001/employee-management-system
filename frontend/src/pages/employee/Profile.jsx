import { useAuth } from "../../auth/AuthContext";


export default function Profile() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          My Profile
        </h1>

        <p className="text-gray-500 mt-2">
          View your account and employee information.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-2xl">
        <div className="space-y-5">

          <div>
            <p className="text-sm text-gray-500">
              Username
            </p>

            <p className="font-medium text-gray-900">
              {user?.username || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Role
            </p>

            <p className="font-medium text-gray-900 capitalize">
              {user?.role || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              User ID
            </p>

            <p className="font-medium text-gray-900">
              {user?.user_id || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Employee ID
            </p>

            <p className="font-medium text-gray-900">
              {user?.employee_id || "-"}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
