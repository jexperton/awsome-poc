import { createRef, FC, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";
import { Box, Button, Switch, Text } from "@chakra-ui/react";

import { Subscribable, Transcription as TranscriptionType } from "../types";
import { daysAgo } from "../utils";
import useEntry from "../hooks/useEntry";
import Layout from "../components/Layout";
import Transcript from "../components/transcription/Transcript";
import Player from "../components/transcription/Player";
import { ArrowDownIcon, DownloadIcon } from "@chakra-ui/icons";

class Position implements Subscribable<number> {
  subscribers: ((callback: number) => void)[] = [];
  subscribe(fn: (callback: number) => void) {
    this.subscribers.push(fn);
  }
  emit(value: number) {
    for (const subscriber of this.subscribers) subscriber(value);
  }
}

const InnerTranscription: FC<{ url: string }> = ({ url }) => {
  const { data: entry, isValidating } = useEntry(url);
  const [showWLC, setShowWLC] = useState(false);
  const playerRef = createRef<HTMLAudioElement>();
  const currentPositionRef = useRef<HTMLSpanElement | null>(null);
  const position = new Position();

  const seekTo = (item: TranscriptionType["results"]["items"][0]) => {
    if (!playerRef.current) return;
    playerRef.current.currentTime = item.start_time;
    playerRef.current.play();
  };

  return entry ? (
    <Box>
      <Helmet title={`${entry.title}, ${entry.date.toDateString()}`} />
      <Player
        audioFileUrl={entry.audioFileUrl}
        playerRef={playerRef}
        position={position}
      />
      <Box
        marginTop="8"
        marginBottom="8"
        paddingBottom="8"
        borderBottom="1px"
        borderColor="gray.200"
      >
        <Text fontWeight="bold" fontSize="2xl" color="gray.600">
          {entry.title}
        </Text>
        <Text
          marginBottom="4"
          textTransform="uppercase"
          fontWeight="bold"
          color="gray.500"
        >
          {`${entry.date.toDateString()} - ${daysAgo(entry.date)} days ago`}
        </Text>
        <Button
          size="sm"
          marginRight="1"
          leftIcon={<DownloadIcon />}
          onClick={() => window.location.replace(entry.audioFileUrl)}
        >
          audio
        </Button>
        <Button
          size="sm"
          marginRight="1"
          leftIcon={<ArrowDownIcon />}
          onClick={() => {
            if (currentPositionRef.current) {
              window.scroll(0, currentPositionRef.current.offsetTop - 200);
            }
          }}
        >
          scroll to position
        </Button>
        <Button
          size="sm"
          leftIcon={
            <Switch
              colorScheme="teal"
              size="sm"
              isChecked={showWLC}
              pointerEvents="none"
            />
          }
          onClick={() => setShowWLC(!showWLC)}
        >
          WLC
        </Button>
      </Box>

      <Transcript
        currentPositionRef={currentPositionRef}
        entry={entry}
        position={position}
        seekTo={seekTo}
        showWLC={showWLC}
      />
    </Box>
  ) : (
    <></>
  );
};

const Transcription: FC<{}> = () => {
  const { url } = useParams();
  return (
    <Layout>
      {url && <InnerTranscription url={decodeURIComponent(url)} />}
    </Layout>
  );
};

export default Transcription;
