"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { userLogin } from "../../firebase/firebaseAuth";
import { useAuth } from "../../context/AuthHook";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAdmin } from "../../api/admin";


export default function Home() {
  const {setUser, setUserMDB } = useAuth();

  const router = useRouter()

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await userLogin(email, password);
      setUser(res.user);

      const res2 = getAdmin(res.user.uid)
        .then((res) => {
          setUserMDB(res.payload)
          router.push('/home')
        })
        .catch((err) => console.log(err))
    } catch (err: any) {
      console.error("Login failed:", err);
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (errorMessage) setErrorMessage(null); // Clear error when typing
  };

  // utility function to map Firebase errors
  const getFriendlyErrorMessage = (error: any) => {
    if (!error || !error.code) return "Login failed. Please try again.";

    switch (error.code) {
      case "auth/invalid-email":
        return "The email address is invalid.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/too-many-requests":
        return "Too many login attempts. Please try again later.";
      case "auth/invalid-credential":
        return "Invalid login credentials.";
      default:
        return "Login failed. Please try again.";
    }
  };


  return (
    <main className="flex min-h-screen">
      {/* Left side */}
      <section className="flex flex-col justify-center items-center bg-gray-100 w-1/2 p-16">
        <Image
          src="/assets/images/app_logo.png"
          alt="App Logo"
          width={400}
          height={135}
          className="mb-6"
        />
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-8 text-center max-w-xs">
          Manage your platform with tools and insights.
        </p>
        <div className="flex space-x-6">
          <button className="bg-white shadow-md rounded-md p-4 w-40 text-left">
            <p className="text-blue-600 font-semibold mb-1">Company Verification</p>
            <p className="text-sm">Review and approve applications</p>
          </button>
          <button className="bg-white shadow-md rounded-md p-4 w-40 text-left">
            <p className="text-purple-600 font-semibold mb-1">Analytics and Reports</p>
            <p className="text-sm">Track platform performance</p>
          </button>
        </div>
      </section>

      {/* Right side */}
      <section className="flex flex-col justify-center items-center w-1/2 bg-gradient-to-b from-indigo-600 to-purple-600 text-white p-16">
        <div className="max-w-sm w-full">
          <h2 className="text-3xl font-bold mb-2">Welcome back,</h2>
          <p className="mb-8">Admin</p>

          {/* Error modal */}
          {errorMessage && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{errorMessage}</span>
              <button
                type="button"
                className="absolute top-1 right-2 text-red-700 font-bold"
                onClick={() => setErrorMessage(null)}
              >
                ×
              </button>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block font-semibold mb-1">
                Login
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleInputChange(setEmail)}
                placeholder="johndoe@gmail.com"
                className={`w-full rounded-md p-2 ${errorMessage ? "border-2 border-red-500 bg-red-50 text-black" : "bg-white text-black"
                  }`}
                required
              />
            </div>

            <div className="flex flex-col mb-4">
              <label htmlFor="password" className="block font-semibold mb-1">
                Password
              </label>
              <div className="flex items-center border rounded-md overflow-hidden bg-white">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handleInputChange(setPassword)}
                  placeholder="Enter admin password"
                  className={`flex-1 p-2 text-black focus:outline-none ${errorMessage ? "border-red-500 bg-red-50" : ""}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-md py-2 font-semibold text-center block"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="flex justify-between mt-2 text-sm">
              <Link href="/forgot-password" className="underline">
                Forgot password?
              </Link>
          
            </div>
          </form>

          <p className="mt-12 text-center text-sm">© 2025 Copyright</p>
        </div>
      </section>
    </main>
  );
}
