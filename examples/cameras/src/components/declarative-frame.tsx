import { FunctionalComponent, h } from "preact";
import ReactDOM, { useState } from "preact/compat";

export const DeclarativeFrame: FunctionalComponent = ({
    children,
    ref: _,
    ...props
}) => {
    const [ref, setRef] = useState<HTMLIFrameElement | null>(null);
    const body = ref?.contentWindow?.document.body;

    return (
        // `ref` in this instance doesn't work well in Firefox; use onLoad instead
        // FIXME: using anything but `ref={setRef}` causes infinite loop in Firefox???
        <iframe {...props} ref={setRef}>
            {body && ReactDOM.createPortal(<div>{children}</div>, body)}
        </iframe>
    );
};
