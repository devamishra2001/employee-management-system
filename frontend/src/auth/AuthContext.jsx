import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import {
  loginUser,
  getCurrentUser
} from "../services/api";


const AuthContext =
  createContext(null);


export function AuthProvider({
  children
}) {

  const [
    user,
    setUser
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);


  useEffect(() => {

    const loadUser =
      async () => {

        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {

          setLoading(false);

          return;
        }

        try {

          const userData =
            await getCurrentUser();

          setUser(userData);

        } catch {

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "user"
          );

        } finally {

          setLoading(false);

        }
      };


    loadUser();

  }, []);


  const login =
    async (
      username,
      password
    ) => {

      const result =
        await loginUser(
          username,
          password
        );

      localStorage.setItem(
        "access_token",
        result.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(result)
      );

      setUser(result);

      return result;
    };


  const logout = () => {

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "user"
    );

    setUser(null);
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout
      }}
    >

      {children}

    </AuthContext.Provider>
  );
}


export function useAuth() {

  return useContext(
    AuthContext
  );
}