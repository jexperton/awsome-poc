import { FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import { useToken } from "../components/providers/AuthProvider";
import { signInUrl } from "../utils";

const SignIn: FC<{}> = () => {
  const { token, setToken } = useToken();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get("id_token");

      if (accessToken) {
        setToken(accessToken);
        setTimeout(() => navigate("/dashboard"), 100);
      }
    } else if (!token) {
      console.log(signInUrl);
      window.location.replace(signInUrl);
    }
  }, [token, setToken, navigate]);

  return <Layout title="Sign-in"></Layout>;
};

export default SignIn;
