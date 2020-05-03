import gql from 'graphql-tag';
import * as ApolloReactCommon from '@apollo/react-common';
import * as ApolloReactHooks from '@apollo/react-hooks';
export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Upload: any;
};


export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}

export type Counter = {
   __typename?: 'Counter';
  count: Scalars['Int'];
  countStr?: Maybe<Scalars['String']>;
};

export type LoginInput = {
  username: Scalars['String'];
  password: Scalars['String'];
};

export type LoginResult = {
   __typename?: 'LoginResult';
  bearer: Scalars['String'];
};

export type Mutation = {
   __typename?: 'Mutation';
  login?: Maybe<LoginResult>;
};


export type MutationLoginArgs = {
  input: LoginInput;
};

export type Query = {
   __typename?: 'Query';
  hello: Scalars['String'];
  counter: Counter;
};

export type Subscription = {
   __typename?: 'Subscription';
  counter: Counter;
};


export type LoginApiMutationVariables = {
  username: Scalars['String'];
  password: Scalars['String'];
};


export type LoginApiMutation = (
  { __typename?: 'Mutation' }
  & { login?: Maybe<(
    { __typename?: 'LoginResult' }
    & Pick<LoginResult, 'bearer'>
  )> }
);

export type HelloIndexQueryVariables = {};


export type HelloIndexQuery = (
  { __typename?: 'Query' }
  & Pick<Query, 'hello'>
);

export type CounterIndexSubscriptionVariables = {};


export type CounterIndexSubscription = (
  { __typename?: 'Subscription' }
  & { counter: (
    { __typename?: 'Counter' }
    & Pick<Counter, 'count' | 'countStr'>
  ) }
);


export const LoginApiDocument = gql`
    mutation LoginApi($username: String!, $password: String!) {
  login(input: {username: $username, password: $password}) {
    bearer
  }
}
    `;
export type LoginApiMutationFn = ApolloReactCommon.MutationFunction<LoginApiMutation, LoginApiMutationVariables>;

/**
 * __useLoginApiMutation__
 *
 * To run a mutation, you first call `useLoginApiMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginApiMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginApiMutation, { data, loading, error }] = useLoginApiMutation({
 *   variables: {
 *      username: // value for 'username'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginApiMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LoginApiMutation, LoginApiMutationVariables>) {
        return ApolloReactHooks.useMutation<LoginApiMutation, LoginApiMutationVariables>(LoginApiDocument, baseOptions);
      }
export type LoginApiMutationHookResult = ReturnType<typeof useLoginApiMutation>;
export type LoginApiMutationResult = ApolloReactCommon.MutationResult<LoginApiMutation>;
export type LoginApiMutationOptions = ApolloReactCommon.BaseMutationOptions<LoginApiMutation, LoginApiMutationVariables>;
export const HelloIndexDocument = gql`
    query HelloIndex {
  hello
}
    `;

/**
 * __useHelloIndexQuery__
 *
 * To run a query within a React component, call `useHelloIndexQuery` and pass it any options that fit your needs.
 * When your component renders, `useHelloIndexQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHelloIndexQuery({
 *   variables: {
 *   },
 * });
 */
export function useHelloIndexQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<HelloIndexQuery, HelloIndexQueryVariables>) {
        return ApolloReactHooks.useQuery<HelloIndexQuery, HelloIndexQueryVariables>(HelloIndexDocument, baseOptions);
      }
export function useHelloIndexLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<HelloIndexQuery, HelloIndexQueryVariables>) {
          return ApolloReactHooks.useLazyQuery<HelloIndexQuery, HelloIndexQueryVariables>(HelloIndexDocument, baseOptions);
        }
export type HelloIndexQueryHookResult = ReturnType<typeof useHelloIndexQuery>;
export type HelloIndexLazyQueryHookResult = ReturnType<typeof useHelloIndexLazyQuery>;
export type HelloIndexQueryResult = ApolloReactCommon.QueryResult<HelloIndexQuery, HelloIndexQueryVariables>;
export const CounterIndexDocument = gql`
    subscription CounterIndex {
  counter {
    count
    countStr
  }
}
    `;

/**
 * __useCounterIndexSubscription__
 *
 * To run a query within a React component, call `useCounterIndexSubscription` and pass it any options that fit your needs.
 * When your component renders, `useCounterIndexSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCounterIndexSubscription({
 *   variables: {
 *   },
 * });
 */
export function useCounterIndexSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<CounterIndexSubscription, CounterIndexSubscriptionVariables>) {
        return ApolloReactHooks.useSubscription<CounterIndexSubscription, CounterIndexSubscriptionVariables>(CounterIndexDocument, baseOptions);
      }
export type CounterIndexSubscriptionHookResult = ReturnType<typeof useCounterIndexSubscription>;
export type CounterIndexSubscriptionResult = ApolloReactCommon.SubscriptionResult<CounterIndexSubscription>;