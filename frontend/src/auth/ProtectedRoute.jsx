import {
  Navigate
} from "react-router-dom";

import {
  useAuth
} from "./AuthContext";


export default function ProtectedRoute({
  children,
  roles
}) {

  const {
    user,
    loading
  } = useAuth();


  if (loading) {

    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }


  if (!user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (
    roles
    &&
    !roles.includes(
      user.role
    )
  ) {

    if (
      user.role
      === "employee"
    ) {

      return (
        <Navigate
          to="/employee"
          replace
        />
      );

    }

    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }


  return children;
}