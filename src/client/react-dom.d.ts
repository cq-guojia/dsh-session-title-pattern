/** react-dom 由宿主模块表提供，本地只有运行时、没有 @types/react-dom。 */
declare module 'react-dom' {
  import type { ReactNode, ReactPortal } from 'react';

  export function createPortal(
    children: ReactNode,
    container: Element | DocumentFragment,
  ): ReactPortal;
}
