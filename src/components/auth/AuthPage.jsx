import { useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { llogin, lregister } from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login: localLogin } = useAuth(); // login trong AuthContext

  useEffect(() => {
    const handleOAuth = async () => {
      // console.log("Raw fragment:", window.location.hash);

      // ----------- PARSE TOKEN TỪ SUPABASE -----------
      const params = new URLSearchParams(window.location.hash.slice(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token) return navigate("/login");

      // ----------- SET SUPABASE SESSION -----------
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        console.error("❌ Error setSession:", error);
        return navigate("/login");
      }

      // console.log("Supabase session:", data);

      const supaUser = data.user;
      const email = supaUser.email;
      const name =
        supaUser.user_metadata.full_name ||
        supaUser.user_metadata.name ||
        "User";

      const defaultPassword = "123456";

      // ----------- GỌI BACKEND REGISTER -----------
      try {
        // console.log("👉 Sending lregister request to backend...");

        const reg = await lregister({
          name,
          email,
          password: defaultPassword,

          promodeCode: null,
          fromSupabase: true, // ✔ phải gửi đúng lên backend
        });

        // console.log("Signup backend result:", reg);

        if(reg.user && reg.user.status === "Pending") {
          localStorage.setItem("pendingEmail", email); // Lưu email vào máy người dùng
          // navigate("/pending");
          return navigate("/pending");
        }
        // backend có 3 trạng thái:
        // - user mới → success
        // - user cũ + có password → vẫn success vì fromSupabase:true
        // - user cũ + có password nhưng lregister bị chặn → code EMAIL_Exist_with_Password
        if (reg.code === "EMAIL_Exist_with_Password") {
          // Không bao giờ xảy ra vì fromSupabase:true luôn bypass
          // console.warn("Blocked lregister:", reg);
        }
      } catch (err) {
        // console.error("❌ Backend lregister failed:", err);
        return navigate("/login");
      }

      // ----------- GỌI LOGIN BACKEND (SSO PASSWORD) -----------
      let backendLoginResponse;
      try {
        backendLoginResponse = await llogin(email, defaultPassword);
      } catch (err) {
        console.error("❌ Backend login failed:", err);
        return navigate("/login");
      }

      const { token, user } = backendLoginResponse;

      // ----------- LƯU TOKEN FE -----------
      localLogin(user, token);
      // ----------- REDIRECT -----------
      // navigate("/login");
    };

    handleOAuth();
  }, []);

  return <div>Đang xử lý đăng nhập...</div>;
}
