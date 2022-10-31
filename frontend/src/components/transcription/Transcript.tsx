import { FC, Fragment, MutableRefObject } from "react";
import { Box, Text } from "@chakra-ui/react";

import { Entry, Subscribable, Transcription } from "../../types";
import useTranscript from "../../hooks/useTranscript";
import Spinner from "../Spinner";
import Item from "./Item";

const Transcript: FC<{
  currentPositionRef: MutableRefObject<HTMLSpanElement | null>;
  entry: Entry;
  position: Subscribable<number>;
  seekTo: (item: Transcription["results"]["items"][0]) => void;
  showWLC: boolean;
}> = ({ currentPositionRef, entry, position, seekTo, showWLC }) => {
  const { data: transcript } = useTranscript(entry.transcriptFileUrl);
  const regexp = /[.!?]/;

  return (
    <Box>
      {transcript ? (
        <Text fontSize={16} align="left">
          {transcript.results.items.map((item, index) => (
            <Fragment key={`${item.alternatives[0].content}-${index}`}>
              {item.type !== "pronunciation" ? "" : " "}
              <Item
                {...item}
                showWLC={showWLC}
                onClick={() => seekTo(item)}
                position={position}
                currentPositionRef={currentPositionRef}
              />
              {item.type !== "pronunciation" &&
                transcript.results.items[index - 1].alternatives[0].content
                  .length > 1 &&
                regexp.test(item.alternatives[0].content) && (
                  <>
                    <br />
                    <br />
                  </>
                )}
            </Fragment>
          ))}
        </Text>
      ) : (
        <Spinner />
      )}
    </Box>
  );
};

export default Transcript;
