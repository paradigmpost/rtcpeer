import { FunctionalComponent, h } from "preact";
import { useState } from "preact/compat";
import { JSXInternal } from "preact/src/jsx";

export const Video: FunctionalComponent<JSXInternal.HTMLAttributes<
    HTMLVideoElement
> & { autoplay: boolean; srcObject: MediaStream }> = ({
    children: _1,
    ref: _2,
    ...props
}) => {
    const { autoplay, srcObject, ...videoAttrs } = props;
    const [ref, setRef] = useState<HTMLVideoElement | null>(null);

    if (ref) {
        ref.autoplay = autoplay;
        ref.srcObject = srcObject;
    }

    return <video {...videoAttrs} ref={setRef}></video>;
};
