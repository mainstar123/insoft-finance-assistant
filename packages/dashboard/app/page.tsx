"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState } from "react"
import { AuthForm } from "@/components/auth/auth-form"
import { useRouter } from "next/navigation"

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSuccess = (data: any) => {
    // Store tokens in localStorage or secure cookie
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Redirect to dashboard
    router.push('/dashboard');
  };

  const handleError = (error: Error) => {
    setError(error.message);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Logo header */}
      <div className="p-6 flex items-center">
        <div className="flex items-center">
          <Image src="/logo-tamy.png" alt="logo" className="h-10 mr-2" width={100} height={100} />
          {/* <span className="text-lg font-medium">midday</span> */}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md flex flex-col items-center">
          <h1 className="text-3xl font-semibold mb-6 text-center">
            {mode === 'signin' ? 'Entrar na Tamy.' : 'Criar uma conta'}
          </h1>

          <p className="text-gray-400 text-lg mb-8 text-center">
            Organize Suas Finanças em Segundos com IA no WhatsApp
          </p>

          {error && (
            <div className="w-full p-3 mb-4 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="w-full space-y-3 mb-6">
            <AuthForm
              mode={mode}
              onSuccess={handleSuccess}
              onError={handleError}
            />

            <div className="text-center mt-4">
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>

          {/* Terms text */}
          <p className="text-gray-500 text-xs text-center max-w-xs">
            By continuing, you acknowledge that you have read and agree to Tamy's{" "}
            <a href="#" className="text-gray-400 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-gray-400 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
