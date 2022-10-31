import { FC, PropsWithChildren } from "react";
import { Box } from "@chakra-ui/react";

const FieldBox: FC<PropsWithChildren> = ({ children }) => {
  return <Box marginBottom={3}>{children}</Box>;
};

export default FieldBox;
