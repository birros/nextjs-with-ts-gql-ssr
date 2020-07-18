import { ApolloClient } from 'apollo-client'

const useActivityDetector = ({
  onIdle,
  onActivity,
  timeout,
}: {
  onIdle: Function
  onActivity: Function
  timeout: number
}) => {
  if (process.browser) {
    let timer: NodeJS.Timeout | undefined = undefined

    const refreshTimer = () => {
      if (!timer) {
        onActivity()
      }

      if (timer) {
        clearTimeout(timer)
      }

      timer = setTimeout(() => {
        timer = undefined
        onIdle()
      }, timeout)
    }

    refreshTimer()
    document.addEventListener('mousemove', refreshTimer)
    document.addEventListener('keypress', refreshTimer)
  }
}

const useActivityInterval = (interval: Function, timeout: number) => {
  let timer: NodeJS.Timeout | undefined = undefined

  useActivityDetector({
    onIdle: () => {
      if (timer) {
        clearInterval(timer)
      }
    },
    onActivity: () => {
      interval()

      if (timer) {
        clearInterval(timer)
      }
      timer = setInterval(() => interval(), timeout)
    },
    timeout,
  })
}

export type RefreshCallback = (client: ApolloClient<any>) => Promise<boolean>

export const useAutoRefresh = (
  client: ApolloClient<any>,
  refresh: RefreshCallback,
  timeout: number
) => {
  let connected = false
  const cb = async () => {
    if (!process.browser) {
      return
    }

    connected = await refresh(client)
  }
  cb()
  useActivityInterval(() => connected && cb(), timeout)
}
