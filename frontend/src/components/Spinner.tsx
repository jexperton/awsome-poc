import { SpinnerIcon } from "@chakra-ui/icons";
import styled from "@emotion/styled";

export const Spinner = styled(SpinnerIcon)`
  animation-name: spin;
  animation-duration: 900ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export default Spinner;
