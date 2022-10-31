import { FC, PropsWithChildren, ReactNode } from "react";
import { Helmet } from "react-helmet";
import { Box, Container, Flex } from "@chakra-ui/react";
import styled from "@emotion/styled";

import Navigation from "./Navigation";
import ColorModeSwitcher from "./ColorModeSwitcher";

const FlexStyled = styled(Flex)`
  padding: 10px;
`;

const Layout: FC<
  PropsWithChildren & {
    topBar?: ReactNode;
    title?: string;
  }
> = ({ children, title, topBar }) => {
  return (
    <Box>
      {title ? <Helmet title={title} /> : <></>}
      <FlexStyled justifyContent={"space-between"}>
        <Flex alignItems="center">
          <Navigation />
          {topBar}
        </Flex>
        <ColorModeSwitcher justifySelf="flex-end" />
      </FlexStyled>
      <Container maxWidth="4xl" marginTop={5}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
