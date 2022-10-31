import {
  createContext,
  FC,
  ForwardedRef,
  forwardRef,
  ForwardRefExoticComponent,
  PropsWithChildren,
  PropsWithoutRef,
  RefAttributes,
  useContext,
  useEffect,
  useState,
} from "react";
import { signInUrl } from "../../utils";

const ACCESS_TOKEN = "ACCESS_TOKEN";

const AuthContext = createContext<{
  token?: string | null;
  setToken: (value: string | null) => void;
  onAuthError: (error: any) => void;
}>({
  token: undefined,
  setToken: () => {},
  onAuthError: () => {},
});

const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<string | null>();

  const onAuthError = (error: { status: number }) => {
    window.location.replace(signInUrl);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem(ACCESS_TOKEN);
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem(ACCESS_TOKEN, token);
    else if (token === null) localStorage.removeItem(ACCESS_TOKEN);
  }, [token]);

  return typeof token === "undefined" ? (
    <></>
  ) : (
    <AuthContext.Provider value={{ token, setToken, onAuthError }}>
      {children}
    </AuthContext.Provider>
  );
};

function withToken<T>(
  Component: FC<T>
): ForwardRefExoticComponent<PropsWithoutRef<T> & RefAttributes<unknown>> {
  const WithAuthProvider = forwardRef<unknown, T>(
    (props: T, ref: ForwardedRef<unknown>): JSX.Element => {
      return (
        <AuthProvider>
          <Component {...props} ref={ref} />
        </AuthProvider>
      );
    }
  );

  WithAuthProvider.displayName = "WithAuthProvider";

  return WithAuthProvider;
}

const useToken = () => {
  return useContext(AuthContext);
};

export default AuthProvider;
export { useToken, withToken, AuthProvider, AuthContext };
