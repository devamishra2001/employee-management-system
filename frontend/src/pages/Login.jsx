import {
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  useAuth
} from "../auth/AuthContext";


export default function Login() {

  const [
    username,
    setUsername
  ] = useState("");

  const [
    password,
    setPassword
  ] = useState("");

  const [
    error,
    setError
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);


  const {
    login
  } = useAuth();


  const navigate =
    useNavigate();


  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setLoading(true);
      setError("");

      try {

        const result =
          await login(
            username,
            password
          );

        if (
          result.role
          === "employee"
        ) {

          navigate(
            "/employee"
          );

        } else {

          navigate(
            "/admin"
          );

        }

      } catch {

        setError(
          "Invalid username or password."
        );

      } finally {

        setLoading(false);

      }
    };


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">

        <h1 className="text-2xl font-bold">
          Employee Management
        </h1>

        <p className="text-gray-500 mt-2 mb-7">
          Sign in to continue
        </p>


        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}


        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >

          <div>

            <label className="block text-sm font-medium mb-2">
              Username
            </label>

            <input
              value={username}
              onChange={
                (event) =>
                  setUsername(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-4 py-3"
              placeholder="Username"
              required
            />

          </div>


          <div>

            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={
                (event) =>
                  setPassword(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-4 py-3"
              placeholder="Password"
              required
            />

          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-semibold"
          >

            {
              loading
                ? "Signing in..."
                : "Login"
            }

          </button>

        </form>

      </div>

    </div>
  );
}