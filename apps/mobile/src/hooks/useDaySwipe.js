import { useMemo, useRef } from "react";
import { PanResponder } from "react-native";

const useDaySwipe = ({ onSwipeLeft, onSwipeRight }) => {
    const handlers = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_evt, gestureState) => {
                const { dx, dy } = gestureState;
                const adx = Math.abs(dx);
                const ady = Math.abs(dy);

                if (adx < 24) return false;
                return adx > ady + 10;
            },
            onPanResponderRelease: (_evt, gestureState) => {
                const { dx } = gestureState;

                if (dx <= -80) {
                    onSwipeLeft?.();
                } else if (dx >= 80) {
                    onSwipeRight?.();
                }
            },
        })
    ).current;

    return useMemo(() => handlers.panHandlers, [handlers]);
};

export { useDaySwipe };