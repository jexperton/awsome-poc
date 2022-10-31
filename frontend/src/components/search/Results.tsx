import { createRef, Dispatch, FC, memo, SetStateAction } from "react";
import { Link } from "react-router-dom";
import { Box, Tag, Text } from "@chakra-ui/react";
import styled from "@emotion/styled";

import { Hit } from "../providers/SearchProvider";
import { daysAgo } from "../../utils";

const Word = styled.span<{
  confidence: string;
  match: boolean;
  active: boolean;
}>`
  background-color: ${({ confidence, match }) =>
    match ? "yellow" : confidence};
  outline: 2px solid
    ${({ confidence, match }) => (match ? "yellow" : confidence)};
  font-weight: ${({ match }) => (match ? "bold" : "normal")};
  text-decoration: ${({ active }) => (active ? "underline" : "none")};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const Audio = styled.audio`
  margin-top: 1em;
  margin-bottom: 2em;
`;

const Excerpt = styled(Text)`
  em {
    background-color: yellow;
    font-weight: bold;
  }
`;

const Results: FC<{
  hit: Hit;
  search: (term: string) => void;
}> = ({
  hit: { title, uuid, date, excerpt, url, score, entities },
  search,
}) => {
  const playerRef = createRef<HTMLAudioElement>();

  const onTagClick = (entity: string) => {
    window.scrollTo(0, 0);
    search(entity);
  };

  return (
    <Box
      paddingBottom="8"
      marginBottom="8"
      borderBottom="1px"
      borderColor="gray.200"
    >
      <Audio ref={playerRef} controls>
        <source src={`${url}`} />
      </Audio>
      <Text
        textTransform="uppercase"
        fontWeight="bold"
        fontSize="smaller"
        color="gray.500"
        marginBottom="4"
        textDecoration="underline"
      >
        <Link to={`/transcription/${encodeURIComponent(url)}`}>
          {`${title}, on ${date.toDateString()} - ${daysAgo(date)} days ago`}
        </Link>
      </Text>
      <Box>
        {excerpt.map((hit: string) => (
          <Excerpt
            key={hit}
            fontSize="md"
            marginBottom="4"
            align="left"
            dangerouslySetInnerHTML={{ __html: hit }}
          />
        ))}
      </Box>
      <Box>
        {entities
          .reduce(
            (acc: Array<{ type: string; values: Set<string> }>, entity) => {
              const i = acc.findIndex((group) => group.type === entity.Type);
              if (
                entity.Score <= 0.99 ||
                !["PERSON", "ORGANIZATION", "LOCATION"].includes(entity.Type) ||
                (entity.Type === "PERSON" && !/\s/.test(entity.Text))
              )
                return acc;

              if (i > -1 && acc[i]) acc[i].values.add(entity.Text);
              else
                acc.push({ type: entity.Type, values: new Set([entity.Text]) });
              return acc;
            },
            []
          )
          .map(({ values: entities, type }, i) => (
            <Box key={`${type}-${i}`}>
              <Text
                textTransform="capitalize"
                fontWeight="bold"
                marginTop="4"
                marginBottom="2"
              >
                {type.toLowerCase()}s:
              </Text>
              {Array.from(entities).map((entity) => (
                <Tag
                  key={`${type}-${i}-${entity}`}
                  onClick={() => onTagClick(entity)}
                  cursor="pointer"
                  margin="1"
                  marginRight="2"
                  marginLeft="0"
                >
                  {entity}
                </Tag>
              ))}
            </Box>
          ))}
      </Box>
    </Box>
  );
};

const MemoizedResults = memo(Results);

export default MemoizedResults;
