import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, rtdb } from "../firebase";
import { path } from "../backend.paths";
import { useToast } from "../hooks/useToast";
import Header from "../components/ui/Header";
import Button from "../components/ui/Button";

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      toast.warning("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const uid = userCredential.user.uid;

      // Check user role to determine redirect destination
      const roleRef = ref(rtdb, path("users", uid, "role"));
      const roleSnapshot = await get(roleRef);
      const userRole = roleSnapshot.val();

      toast.success("Logged in successfully!");

      // Wait for auth state to settle before navigating
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect supervisors to supervisor hub, others to dashboard
      if (userRole === "supervisor") {
        navigate("/supervisor-hub");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);

      // Handle specific Firebase auth errors
      switch (error.code) {
        case "auth/wrong-password":
          toast.error("Incorrect password. Please try again.");
          break;
        case "auth/user-not-found":
          toast.error("No account found with this email.");
          break;
        case "auth/user-disabled":
          toast.error("This account has been disabled. Contact your supervisor.");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email format.");
          break;
        case "auth/too-many-requests":
          toast.error("Too many failed attempts. Please try again later.");
          break;
        case "auth/network-request-failed":
          toast.error("Network error. Check your connection.");
          break;
        default:
          toast.error("Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = resetEmail.trim();

    if (!trimmedEmail) {
      toast.warning("Please enter your email address");
      return;
    }

    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Password reset error:", error);

      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found with this email.");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email format.");
          break;
        default:
          toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Sign In" subtitle="Equipment Inspection System" />

      <div className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
          {!showForgotPassword ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@company.com"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-xl border-2 border-slate-200 p-4 text-lg shadow-sm transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password <span className="text-error">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full rounded-xl border-2 border-slate-200 p-4 text-lg shadow-sm transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => {
                    setShowForgotPassword(true);
                    setResetEmail(email);
                  }}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors underline"
                >
                  Forgot Password?
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your.email@company.com"
                    autoComplete="email"
                    disabled={sendingReset}
                    className="w-full rounded-xl border-2 border-slate-200 p-4 text-lg shadow-sm transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <Button
                  onClick={handleForgotPassword}
                  className="w-full"
                  size="lg"
                  loading={sendingReset}
                  disabled={sendingReset}
                >
                  {sendingReset ? "Sending..." : "Send Reset Link"}
                </Button>

                <button
                  onClick={() => setShowForgotPassword(false)}
                  disabled={sendingReset}
                  className="w-full text-sm text-slate-600 hover:text-slate-700 font-medium transition-colors underline disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Back to Sign In
                </button>
              </div>
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <div className="font-semibold flex items-center gap-2 mb-2">
              <span>â„¹ï¸</span> Need an Account?
            </div>
            <p className="text-xs leading-relaxed">
              Contact your supervisor to create an account for you. All employee accounts are managed by supervisors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

