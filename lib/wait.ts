export const wait = async (seconds: number) =>
  await new Promise((res) => setTimeout(res, seconds * 1000))
