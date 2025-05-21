'use client'

import React, { createContext, useContext } from 'react';

/**
 * Assert that the context value exists, otherwise throw an error.
 *
 * @internal
 */
export function assertContextExists(contextVal: unknown, msgOrCtx: string | React.Context<any>): asserts contextVal {
  if (!contextVal) {
    throw typeof msgOrCtx === 'string' ? new Error(msgOrCtx) : new Error(`${msgOrCtx.displayName} not found`);
  }
}
type Options = { assertCtxFn?: (v: unknown, msg: string) => void };
type ContextAndHook<T> = React.Context<{ value: T } | undefined>;
type UseCtxFn<T> = () => T;

/**
 * Create and return a Context and two hooks that return the context value.
 * The Context type is derived from the type passed in by the user.
 *
 * The first hook returned guarantees that the context exists so the returned value is always `CtxValue`
 * The second hook makes no guarantees, so the returned value can be `CtxValue | undefined`
 *
 * @internal
 */

export const createContextAndHook = <CtxValue>(
  displayName: string,
  options?: Options,
): [ContextAndHook<CtxValue>, UseCtxFn<CtxValue>, UseCtxFn<CtxValue | Partial<CtxValue>>] => {
  const { assertCtxFn = assertContextExists } = options || {};
  const Ctx = createContext<{ value: CtxValue } | undefined >(undefined);
  Ctx.displayName = displayName;

  const useHook = () => {
    const ctx = useContext(Ctx);
    assertCtxFn(ctx, `${displayName} not found`);
    return (ctx as any).value as CtxValue;
  };

  const useCtxWithoutGuarantee = () => {
    const ctx = useContext(Ctx);
    return ctx ? ctx.value : {}
  };

    /**
     * Assert that the context value exists, otherwise throw an error.
    if (ctx === undefined) {
      throw new Error(`use${name} must be used within a ${name}Provider`);
    }
    return ctx.value;
    */

  return [Ctx, useHook, useCtxWithoutGuarantee];
}