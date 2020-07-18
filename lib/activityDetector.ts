export const useActivityDetector = ({
  onIdle,
  onActivity,
  timeout,
}: {
  onIdle: Function
  onActivity: Function
  timeout: number
}) => {
  if (!process.browser) {
    return
  }

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

export const useActivityInterval = (interval: Function, timeout: number) => {
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
