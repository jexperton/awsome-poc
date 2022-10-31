import { FC } from "react";
import { Box, Tooltip } from "@chakra-ui/react";

import { Hit } from "../providers/SearchProvider";

interface Props {
  results: Hit[];
}

const SearchTimeline: FC<Props> = ({ results }) => {
  const sorted = results.sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = Date.now() - results[0].date.getTime();
  return (
    <Box
      height="1px"
      backgroundColor="gray.300"
      position="relative"
      marginTop="8"
      marginBottom="6"
    >
      {sorted.map((hit) => (
        <Box
          key={hit.uuid}
          color="green.400"
          position="absolute"
          width="0"
          top="-5px"
          fontSize="6xl"
          lineHeight="0"
          cursor="pointer"
          left={`${
            ((hit.date.getTime() - results[0].date.getTime()) /
              (Date.now() - results[0].date.getTime())) *
            100
          }%`}
        >
          <Tooltip label={hit.date.toLocaleDateString()} aria-label="A tooltip">
            •
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
};

export default SearchTimeline;
