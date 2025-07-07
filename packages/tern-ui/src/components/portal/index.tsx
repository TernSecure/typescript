import ReactDOM from "react-dom";
import { PathRouter } from "../router/PathRouter";
import type { AvailableComponentCtx } from "../../types";

type PortalRendererProps = {
  node: HTMLDivElement;
  children: React.ReactNode;
} & AvailableComponentCtx;

export function PortalRenderer({ 
  node, 
  children,
  ...contextProps
}: PortalRendererProps) {
  return ReactDOM.createPortal(
    <PathRouter>
      {children}
    </PathRouter>,
    node
  );
};
