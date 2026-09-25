import { baseUrl } from "@/utils/constant";
import api from "./api";
import { clearUser, setUser } from "@/redux/slices/authSlice";
import { setCredits, clearCredits } from "@/redux/slices/creditsSlice";
import { AppDispatch } from "@/redux/store";
import { getInitialsAvatar } from "@/utils/getInitialsAvatar";
import { creditsApi } from "./credits";

declare global {
  interface Window {
    AppleID: {
      auth: {
        signIn: () => Promise<{
          authorization: {
            id_token: string;
          };
          user?: {
            name?: {
              firstName?: string;
              lastName?: string;
            };
          };
        }>;
      };
    };
  }
}

export default api;

//login user endpoint
export const loginUser = async (
  email: string,
  password: string,
  dispatch: AppDispatch
) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });

    const avatar = data.avatar?.startsWith("http")
      ? data.avatar
      : getInitialsAvatar(data.fullName);

    const userWithAvatar = { ...data, avatar };
    dispatch(setUser(userWithAvatar));
    
    // Fetch and set credits data
    try {
      const creditsData = await creditsApi.getCreditsData();
      dispatch(setCredits(creditsData));
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

export const refreshUser = async (dispatch: AppDispatch) => {
  console.log("🔄 refreshUser called");

  try {
    const { data } = await api.get("/auth/me");
    console.log("✅ /auth/me success:", data);

    const avatar = data.avatar?.startsWith("http")
      ? data.avatar
      : getInitialsAvatar(data.fullName);
    dispatch(setUser({ ...data, avatar }));
    
    // Fetch and set credits data
    try {
      const creditsData = await creditsApi.getCreditsData();
      dispatch(setCredits(creditsData));
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
  } catch (error: unknown) {
    console.log("❌ /auth/me failed", error);
    dispatch(clearUser());
    dispatch(clearCredits());
  }
};

//signup user endpoint
export const signupUser = async (
  fullName: string,
  email: string,
  password: string,
  dispatch: AppDispatch
) => {
  const { data } = await api.post("/auth/register", {
    fullName,
    email,
    password,
  });

  const avatar = data.avatar?.startsWith("http")
    ? data.avatar
    : getInitialsAvatar(data.fullName);

  const userWithAvatar = { ...data, avatar };
  dispatch(setUser(userWithAvatar));
  
  // Fetch and set credits data
  try {
    const creditsData = await creditsApi.getCreditsData();
    dispatch(setCredits(creditsData));
  } catch (error) {
    console.error("Failed to fetch credits:", error);
  }

  return data;
};

export const appleLogin = async (dispatch: AppDispatch) => {
  const response = await window.AppleID.auth.signIn();

  const res = await fetch(`${baseUrl}/auth/apple`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      identityToken: response.authorization.id_token,
      fullName:
        response.user?.name?.firstName + " " + response.user?.name?.lastName,
    }),
  });

  const data = await res.json();

  if (res.ok && data) {
    const avatar = data.avatar?.startsWith("http")
      ? data.avatar
      : getInitialsAvatar(data.fullName);
    dispatch(setUser({ ...data, avatar }));
    
    // Fetch and set credits data
    try {
      const creditsData = await creditsApi.getCreditsData();
      dispatch(setCredits(creditsData));
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
  }

  console.log("Logged in user:", data);
  return data;
};

export const logoutUser = async (dispatch: AppDispatch) => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Logout request error:", error);
  } finally {
    dispatch(clearUser());
    dispatch(clearCredits());
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
};

export const handleGoogleLogin = () => {
  window.location.href = `${baseUrl}/auth/google`;
};
