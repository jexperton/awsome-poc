import { FC, RefObject } from "react";
import { Box } from "@chakra-ui/react";

import { Subscribable } from "../../types";

const Player: FC<{
  audioFileUrl: string;
  position: Subscribable<number>;
  playerRef: RefObject<HTMLAudioElement>;
}> = ({ audioFileUrl, position, playerRef }) => {
  return (
    <Box marginBottom="4">
      <audio
        ref={playerRef}
        controls
        onTimeUpdate={() => position.emit(playerRef.current?.currentTime || 0)}
      >
        <source src={audioFileUrl} />
      </audio>
    </Box>
  );
};

export default Player;
