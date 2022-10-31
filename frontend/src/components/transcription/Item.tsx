import {
  createRef,
  FC,
  MouseEventHandler,
  MutableRefObject,
  useEffect,
  useState,
} from "react";
import styled from "@emotion/styled";
import { Subscribable, Transcription } from "../../types";

type ItemType = Transcription["results"]["items"][0];

const getConfidence = (score: number) => {
  if (score >= 90) return "#C6F6D5";
  if (score >= 80) return "#FAF089";
  return "#FEB2B2";
};

const Word = styled.span<{
  confidence: string;
  active: boolean;
  children: string;
}>`
  background-color: ${({ confidence }) => confidence};
  outline: 2px solid ${({ confidence }) => confidence};
  text-decoration: ${({ active }) => (active ? "underline" : "none")};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const Item: FC<
  ItemType & {
    onClick: MouseEventHandler<HTMLElement>;
    position: Subscribable<number>;
    currentPositionRef: MutableRefObject<HTMLSpanElement | null>;
    showWLC: boolean;
  }
> = ({
  showWLC,
  type,
  position,
  currentPositionRef,
  start_time,
  end_time,
  alternatives,
  onClick,
}) => {
  const [active, setActive] = useState(false);
  const ref = createRef<HTMLSpanElement>();
  const confidence =
    showWLC && type === "pronunciation"
      ? getConfidence(alternatives[0].confidence)
      : "transparent";

  if (type === "pronunciation") {
    position.subscribe((value: number) => {
      setActive(value + 0.1 >= start_time && value + 0.1 <= end_time);
    });
  }

  useEffect(() => {
    if (active) currentPositionRef.current = ref.current;
  }, [active, ref, currentPositionRef]);

  return showWLC ? (
    <Word
      ref={ref}
      title={`${alternatives[0].confidence}%`}
      active={active}
      confidence={confidence}
      onClick={onClick}
      id={active ? "currentAudioPosition" : undefined}
    >
      {alternatives[0].content}
    </Word>
  ) : (
    <Word ref={ref} active={active} confidence={confidence} onClick={onClick}>
      {alternatives[0].content}
    </Word>
  );
};

export default Item;
