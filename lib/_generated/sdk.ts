import { GraphQLClient } from 'graphql-request';
import { print } from 'graphql';
import gql from 'graphql-tag';
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
export const HelloIndexDocument = gql`
    query HelloIndex {
  hello
}
    `;
export const CounterIndexDocument = gql`
    subscription CounterIndex {
  counter {
    count
    countStr
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: () => Promise<T>) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = sdkFunction => sdkFunction();
export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    LoginApi(variables: LoginApiMutationVariables): Promise<LoginApiMutation> {
      return withWrapper(() => client.request<LoginApiMutation>(print(LoginApiDocument), variables));
    },
    HelloIndex(variables?: HelloIndexQueryVariables): Promise<HelloIndexQuery> {
      return withWrapper(() => client.request<HelloIndexQuery>(print(HelloIndexDocument), variables));
    },
    CounterIndex(variables?: CounterIndexSubscriptionVariables): Promise<CounterIndexSubscription> {
      return withWrapper(() => client.request<CounterIndexSubscription>(print(CounterIndexDocument), variables));
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;