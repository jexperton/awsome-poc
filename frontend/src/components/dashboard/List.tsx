import { FC, useState } from "react";
import { Link } from "react-router-dom";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Button,
  Tooltip,
} from "@chakra-ui/react";
import { InfoOutlineIcon, RepeatClockIcon } from "@chakra-ui/icons";

import { Entry, TranscriptionStatus } from "../../types";
import useEntries from "../../hooks/useEntries";
import useIndex from "../../hooks/useIndex";
import Loader from "../Loader";
import Details from "./Details";
import StatusIcon from "./StatusIcon";

const List: FC<{}> = () => {
  const { data: entries, mutate } = useEntries();
  const [activeEntry, setActiveEntry] = useState<Entry>();
  const disclosure = useDisclosure();
  const reindexEntry = useIndex();

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const open = (entry: Entry) => {
    setActiveEntry(entry);
    disclosure.onOpen();
  };

  return (
    <>
      <Details {...disclosure} entry={activeEntry} />
      {entries ? (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Title</Th>
                <Th textAlign="center">Status</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {entries.map((entry) => (
                <Tr key={entry.uuid}>
                  <Td>{formatDate(entry.date)}</Td>
                  <Td color="blue.500" textDecoration="underline">
                    <Link
                      to={`/transcription/${encodeURIComponent(entry.url)}`}
                    >
                      {entry.title}
                    </Link>
                  </Td>
                  <Td textAlign="center">
                    <StatusIcon status={entry.transcriptionStatus} />
                  </Td>
                  <Td>
                    <Tooltip label="show details" openDelay={800}>
                      <Button
                        onClick={() => open(entry)}
                        fontSize={14}
                        variant="outline"
                      >
                        <InfoOutlineIcon />
                      </Button>
                    </Tooltip>
                    {entry.transcriptionStatus ===
                    TranscriptionStatus.COMPLETED ? (
                      <Tooltip label="reindex" openDelay={800}>
                        <Button
                          onClick={() => reindexEntry(entry)}
                          fontSize={14}
                          variant="outline"
                          marginLeft={2}
                        >
                          <RepeatClockIcon />
                        </Button>
                      </Tooltip>
                    ) : (
                      <></>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      ) : (
        <Loader />
      )}
    </>
  );
};

export default List;
