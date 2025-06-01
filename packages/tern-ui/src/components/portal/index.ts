import ReactDOM from "react-dom";
import type { AvailableComponentProps } from "../types";

interface PortalRendererProps {
  node: HTMLDivElement;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PortalRenderer({ 
  node, children, fallback 
}: PortalRendererProps) {
  return ReactDOM.createPortal(children, node);
};