import { FC, PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { Box, IconButton, Menu, MenuButton, MenuList } from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";

import { useToken } from "./providers/AuthProvider";

const LinkBox: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box
      padding={1}
      paddingLeft={3}
      paddingRight={3}
      _hover={{ textDecoration: "underline" }}
    >
      {children}
    </Box>
  );
};

const Navigation: FC<{}> = () => {
  const { token, setToken } = useToken();
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label="Options"
        icon={<HamburgerIcon />}
        variant="outline"
      />
      <MenuList>
        <LinkBox>
          <Link to="/">Search</Link>
        </LinkBox>
        <LinkBox>
          <Link to="/dashboard">Dashboard</Link>
        </LinkBox>
        <LinkBox>
          {token ? (
            <Link to="/signout">Sign out</Link>
          ) : (
            <Link to="/signin">Sign in</Link>
          )}
        </LinkBox>
      </MenuList>
    </Menu>
  );
};

export default Navigation;
