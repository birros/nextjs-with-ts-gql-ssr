const fs = require('fs')

const regex = /export function use(?<name>.*)Subscription\(baseOptions\?: ApolloReactHooks.SubscriptionHookOptions/

/**
 * @param {String} content
 */
const extractSubscriptionNames = (content) =>
  content
    .split(/\n/)
    .filter((l) => regex.test(l))
    .map((l) => regex.exec(l).groups.name)

/**
 * @param {String[]} names
 */
const printImports = (names) => {
  const imports = names.flatMap((n) => [
    `${n}Document`,
    `${n}Subscription`,
    `${n}SubscriptionVariables`,
  ])
  return imports.join(',\n').concat(',')
}

/**
 * @param {String} name
 */
const printHook = (name) => `
export const use${name}Subscription = (
  baseOptions?: SubscriptionHookOptions<
    ${name}Subscription,
    ${name}SubscriptionVariables
  >
) =>
  useSubscriptionWithSSR<
    ${name}Subscription,
    ${name}SubscriptionVariables
  >(${name}Document, baseOptions)
`

/**
 * @param {String[]} names
 */
const printHooks = (names) => {
  const hooks = names.map((n) => printHook(n))
  return hooks.join('')
}

/**
 * @param {String[]} names
 */
const printTemplate = (names) =>
  names.length > 0
    ? `
import { SubscriptionHookOptions } from '@apollo/react-hooks'
import { useSubscriptionWithSSR } from '../hooks'
import {
  ${printImports(names).replace(/,\n/g, ',\n  ')}
} from './graphql'

${printHooks(names).substring(1).slice(0, -1)}
`.substring(1)
    : ''

/**
 * @param {String} inputFile
 * @param {String} outputFile
 */
const generateHooksSSR = (inputFile, outputFile) => {
  const content = fs.readFileSync(inputFile, 'utf8')
  const names = extractSubscriptionNames(content)
  const hooksWithSSR = printTemplate(names)
  if (hooksWithSSR.length > 0) {
    fs.writeFileSync(outputFile, hooksWithSSR, 'utf8')
  } else if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile)
  }
}

const main = () => {
  generateHooksSSR(
    './lib/_generated/graphql.ts',
    './lib/_generated/hooks-with-ssr.ts'
  )
}
main()
