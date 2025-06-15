"use client"

import { useState, useEffect, use } from "react"
import { 
    LoaderCircle, 
    MailCheck, 
    ChevronLeft, 
    RefreshCw, 
    ArrowRight 
} from '../../components/icons'
import {
    Alert,
    AlertDescription, 
    Button,
    Card, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardContent,
    Separator
} from '../../components/elements'
import { cn } from "../../lib/utils"
import { useAuthSignUp } from '../../ctx/TernAuthContext'
import { useTernSecure } from "@tern-secure/shared/react/index"

const RESEND_COOLDOWN = 59 // 59 seconds cooldown for resend
const MAX_RESEND_ATTEMPTS = 3

function RedirectToSignUp() {
    const ternSecure = useTernSecure()
    void ternSecure.redirectAfterSignUp()
}



export function Verify() {
    const { email } = useAuthSignUp()
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [resendCooldown, setResendCooldown] = useState(0)
    const [isResending, setIsResending] = useState(false)
    const [resendAttempts, setResendAttempts] = useState(0)
  
    // Redirect if no email in context
    useEffect(() => {
      if (!email) {
        RedirectToSignUp()
      }
    }, [email])

  
    if (!email) {
      return null // Will redirect in useEffect
    }
  
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-primary/20 blur-lg" />
                <div className="relative rounded-full bg-primary/10 p-3">
                  <MailCheck className="h-8 w-8 text-primary" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-center">Check your email</CardTitle>
            <CardDescription className="text-center">
              We&apos;ve sent a verification link to
              <br />
              <span className="font-medium">{email}</span>
            </CardDescription>
          </CardHeader>
  
          <CardContent className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in-50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

{success && (
  <Alert 
    variant="default" 
    className={cn(
      "animate-in fade-in-50",
      success.includes("already verified") ? "bg-green-50" : "bg-blue-50"
    )}
  >
    <AlertDescription 
      className={success.includes("already verified") ? "text-green-800" : "text-blue-800"}
    >
      {success}
    </AlertDescription>
  </Alert>
)}
  
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-start space-x-4">
                  <div className="mt-1">
                    <MailCheck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Already verified?</p>
                    <p className="text-sm text-muted-foreground">
                      If you&apos;ve already clicked the verification link in your email, you can proceed to sign in.
                    </p>
                  </div>
                </div>
              </div>
  
              <Button className="w-full" variant="outline">
                Continue to sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
  
              <Separator />
  
              <div className="space-y-2">
                <div className="space-y-2">
                  <p className="text-sm text-center text-muted-foreground">
                    Didn&apos;t receive the email? Check your spam folder or request a new link
                    {resendCooldown > 0 && ` in ${resendCooldown}s`}
                  </p>
                  {resendAttempts >= MAX_RESEND_ATTEMPTS ? (
                    <Alert>
                      <AlertDescription>
                        Maximum resend attempts reached. Please try signing up again or contact support.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Button
                      className="w-full"
                      disabled={isResending || resendCooldown > 0 || resendAttempts >= MAX_RESEND_ATTEMPTS}
                    >
                      {isResending ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Resend verification email
                          {resendAttempts > 0 && ` (${MAX_RESEND_ATTEMPTS - resendAttempts} left)`}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }