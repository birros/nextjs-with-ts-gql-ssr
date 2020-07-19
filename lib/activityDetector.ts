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

export const useActivityInterval = (
  interval: Function,
  idleTimeout: number,
  intervalTimeout: number
) => {
  let timer: NodeJS.Timeout | undefined = undefined

  useActivityDetector({
    onIdle: () => timer && clearInterval(timer),
    onActivity: () => {
      timer && clearInterval(timer)

      interval()
      timer = setInterval(() => interval(), intervalTimeout)
    },
    timeout: idleTimeout,
  })
}

export const useIdleInterval = (
  interval: Function,
  idleTimeout: number,
  intervalTimeout: number
) => {
  let timer: NodeJS.Timeout | undefined = undefined

  useActivityDetector({
    onActivity: () => timer && clearInterval(timer),
    onIdle: () => {
      timer && clearInterval(timer)

      interval()
      timer = setInterval(() => interval(), intervalTimeout)
    },
    timeout: idleTimeout,
  })
}
