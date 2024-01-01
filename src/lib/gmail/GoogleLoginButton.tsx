import Image from 'next/image'

import { Button } from '~/components/ui/button'

interface GoogleLoginButtonProps {
  onClick: () => void
  className?: string
  buttonText?: string
}
export function GoogleLoginButton({
  className,
  onClick,
  buttonText = 'Sign in with Google',
}: GoogleLoginButtonProps) {
  return (
    <Button variant="outline" className={className} onClick={onClick}>
      <Image
        src="/images/google-logo.svg"
        alt="Google Logo"
        width={24}
        height={24}
        className="mr-2 h-6 w-6"
      />
      <span className="font-medium text-gray-700">{buttonText}</span>
    </Button>
  )
}
