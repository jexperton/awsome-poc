import { FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import { useToken } from "../components/providers/AuthProvider";
import { signOutUrl } from "../utils";

const SignOut: FC<{}> = () => {
  const { token, setToken } = useToken();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return navigate("/");
    setToken(null);
    window.location.replace(signOutUrl);
  }, [setToken, navigate]);

  return <Layout title="Sign-out"></Layout>;
};

export default SignOut;
