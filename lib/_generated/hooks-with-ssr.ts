import { SubscriptionHookOptions } from '@apollo/react-hooks'
import { useSubscriptionWithSSR } from '../hooks'
import {
  CounterIndexDocument,
  CounterIndexSubscription,
  CounterIndexSubscriptionVariables,
} from './graphql'

export const useCounterIndexSubscription = (
  baseOptions?: SubscriptionHookOptions<
    CounterIndexSubscription,
    CounterIndexSubscriptionVariables
  >
) =>
  useSubscriptionWithSSR<
    CounterIndexSubscription,
    CounterIndexSubscriptionVariables
  >(CounterIndexDocument, baseOptions)
