"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // Automatically sign in the user after successful registration
        const signInResult = await signIn("credentials", {
          username,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError("Error signing in after registration");
        } else {
          router.push("/");
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to register");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950 font-sans">
      <main className="flex flex-col w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
        
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            Create an Account
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm">
            Sign up to securely save and access your color palettes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-center border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-500 transition-all text-zinc-900 dark:text-white font-medium"
              placeholder="e.g. graf_designer"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-500 transition-all text-zinc-900 dark:text-white font-medium"
              placeholder="••••••••"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-500 ml-1">Must be at least 3 characters.</span>
          </div>

          <button
            type="submit"
            disabled={loading || !username || password.length < 3}
            className="w-full py-3 px-6 mt-4 text-white bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 rounded-full font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : "Register"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/api/auth/signin" className="font-semibold text-zinc-900 dark:text-white hover:underline">
              Log in instead
            </Link>
          </p>
        </div>

      </main>
    </div>
  );
}
