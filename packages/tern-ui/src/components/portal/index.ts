import ReactDOM from "react-dom";

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