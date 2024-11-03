import { useEffect, useState } from 'react'
import Router from 'next/router'
import useSWR from 'swr'
import { getLoginSession } from '../lib/auth'
import { getTokenCookie } from '../lib/auth-cookies'

interface IUseUser {
    redirectTo: string | undefined;
    redirectIfFound: boolean | undefined;
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      return { user: data?.user || null }
    })

export function useUser({ redirectTo, redirectIfFound } = {} as IUseUser) {
  const [mounted, setMounted] = useState(false);
  const { data, error } = useSWR('/api/users/find', fetcher)
  
  const user = data?.user
  const finished = Boolean(data)
  const hasUser = Boolean(user)

  useEffect(() => {
    if (!redirectTo || !finished) return
    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !hasUser) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && hasUser)
    ) {
      setMounted(true)
      Router.replace(redirectTo);
    }

  }, [redirectTo, redirectIfFound, finished, hasUser])

  return error ? null : {...user, mounted}
}