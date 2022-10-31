import { createElement, FC } from "react";
import { Text } from "@chakra-ui/react";
import { CheckIcon, TimeIcon } from "@chakra-ui/icons";

import { TranscriptionStatus } from "../../types";
import { Spinner } from "../Spinner";

interface Props {
  status: TranscriptionStatus;
}

const NullIcon: FC<void> = () => <Text>?</Text>;

const StatusIcon: FC<Props> = ({ status }) => {
  return createElement(
    {
      [TranscriptionStatus.COMPLETED]: CheckIcon,
      [TranscriptionStatus.IN_PROGRESS]: Spinner,
      [TranscriptionStatus.NEW]: TimeIcon,
    }[status] || NullIcon,
    {
      color: {
        [TranscriptionStatus.COMPLETED]: "green.400",
        [TranscriptionStatus.IN_PROGRESS]: "blue.500",
        [TranscriptionStatus.NEW]: "gray.500",
      }[status],
    }
  );
};

export default StatusIcon;
