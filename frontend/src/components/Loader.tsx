import { Container } from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";
import Spinner from "./Spinner";

const Loader: FC<{}> = () => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setOpacity(1);
  });

  return (
    <Container
      alignItems="center"
      background="rgba(255,255,255, .9)"
      bottom="0"
      display="flex"
      justifyContent="center"
      left="0"
      margin="0"
      maxWidth="200%"
      opacity={opacity}
      padding="0"
      position="fixed"
      right="0"
      top="0"
      transition=" opacity .5s"
      zIndex="9999"
    >
      <Spinner fontSize={64} marginTop={-16} color="teal" opacity={0.6} />
    </Container>
  );
};

export default Loader;
