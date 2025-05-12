"use client"

import { useState } from "react"
import { useRouter, usePathname } from 'next/navigation'
import Link from "next/link"
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Alert, AlertDescription } from "./ui/alert"
import { cn } from "../lib/utils"
import { AuthBackground } from "./background"
import { Separator } from "./ui/separator"
import { createUser, signInWithRedirectGoogle, signInWithMicrosoft } from '../client/actions'
import { useSignUp } from '../hooks/useSignUp'
import { handleInternalRoute } from '../route-handler/internal-route'
import { 
  SignInResponse,
  getErrorAlertVariant,
} from "@tern-secure/types"

export interface SignUpProps {
    redirectUrl?: string
    onError?: (error: Error) => void
    onSuccess?: () => void
    tenantId? : string
}

export interface PasswordRequirement {
  text: string
  satisfied: boolean
}


export function SignUp({
    redirectUrl, 
    onError,
    onSuccess,
 }: SignUpProps) {
  const pathname = usePathname()
  const InternalComponent = handleInternalRoute(pathname)
  const { setEmail: setContextEmail } = useSignUp()

  if (InternalComponent) {
    return <InternalComponent />
  }

  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<SignInResponse | null>(null)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const router = useRouter()

  const passwordRequirements: PasswordRequirement[] = [
    {
      text: "At least 8 characters long",
      satisfied: formData.password.length >= 8,
    },
    {
      text: "Contains at least one uppercase letter",
      satisfied: /[A-Z]/.test(formData.password),
    },
    {
      text: "Contains at least one lowercase letter",
      satisfied: /[a-z]/.test(formData.password),
    },
    {
      text: "Contains at least one number",
      satisfied: /\d/.test(formData.password),
    },
    {
      text: "Contains at least one special character",
      satisfied: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    },
    {
      text: "Passwords match",
      satisfied: formData.password === formData.confirmPassword && formData.password !== "",
    },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const isFormValid = () => {
    return formData.email.length > 0 && passwordRequirements.every((req) => req.satisfied)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return

    setLoading(true)
    setError(null)
    try {
     const result = await createUser(formData.email, formData.password)
     if(result.success) {
        setContextEmail(formData.email)

        onSuccess?.()

        router.push(`sign-up/verify`)
     } else {
      setError(result)
     }
    } catch (error) {
      const errorMessage = error as SignInResponse
      setError(errorMessage)
      onError?.(error instanceof Error ? error : new Error('Failed to create account'))
    } finally {
      setLoading(false)
    }
  }


  const handleSocialSignIn = async (provider: 'google' | 'microsoft') => {
    setLoading(true)
    try {
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('signInRedirect', 'true')
      window.history.replaceState({}, '', currentUrl.toString())

      const result = provider === 'google' ? await signInWithRedirectGoogle() : await signInWithMicrosoft()
      if (!result.success) {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err as SignInResponse
      setError(errorMessage)
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('signInRedirect')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <AuthBackground />
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your information below to create your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant={getErrorAlertVariant(error)} className="animate-in fade-in-50">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2 relative flex-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2 relative flex-1">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />}
                  <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>

            {/* Password Requirements */}
            <div
              className={cn(
                "rounded-lg border bg-card text-card-foreground shadow-sm",
                "p-4 transition-all duration-200",
                passwordFocused ? "opacity-100" : "opacity-70",
              )}
            >
              <div className="grid gap-2 text-sm">
                {passwordRequirements.map((requirement, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-2",
                      requirement.satisfied ? "text-green-500" : "text-muted-foreground",
                    )}
                  >
                    {requirement.satisfied ? (
                      <Check className="h-4 w-4 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 shrink-0" />
                    )}
                    <span className="text-sm">{requirement.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={!isFormValid() || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary underline-offset-4 transition-colors hover:underline">
                Sign in
              </Link> or sign up with email
            </p>
          </CardFooter>
          </form>
          <Separator className="my-4 px-6" />
          <div className="px-6 pb-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button 
                variant="outline" 
                disabled={isLoading}
                onClick={() => handleSocialSignIn('google')} 
                className="flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </Button>
              <Button 
                variant="outline" 
                disabled={isLoading}
                onClick={() => handleSocialSignIn('microsoft')} 
                className="flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                Microsoft
              </Button>
            </div>
          </div>
      </Card>
    </div>
  )
}
