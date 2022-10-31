import { FC, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Input,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
  Fade,
} from "@chakra-ui/react";
import styled from "@emotion/styled";
import { SearchIcon } from "@chakra-ui/icons";

import Results from "../components/search/Results";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import SearchTimeline from "../components/search/SearchTimeline";
import { useSearch } from "../components/providers/SearchProvider";

interface Alternative {
  confidence: string;
  content: string;
}

export interface Item {
  start_time: string;
  end_time: string;
  alternatives: Array<Alternative>;
  type: string;
}

export interface MappedItem {
  start_time: number;
  end_time: number;
  alternatives: Array<Alternative>;
  type: string;
}

export interface MappedResult {
  date: string;
  title: string;
  transcript: string;
  words: Array<MappedItem>;
  excerpt: string;
}

const SearchButton = styled(Button)`
  margin-left: 5px;
  margin-right: 5px;
`;

const Root: FC<{}> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { search, loading, results, error } = useSearch();
  const [searchTerm, setSearchTerm] = useState("");

  const onChange = (e: any) => {
    setSearchTerm(e.target.value);
  };

  const onKeyUp = (e: any) => {
    e.keyCode === 13 && getSearchResults(searchTerm);
  };

  const getSearchResults = async (term: string) => {
    if (loading || term.length < 2) return;
    navigate(`/?terms=${encodeURIComponent(term)}`);
    search(term);
  };

  useEffect(() => {
    const terms = new URLSearchParams(location.search.slice(1)).get("terms");
    if (terms) {
      setSearchTerm(terms);
      search(terms);
    }
  }, [location]);

  return (
    <Layout title="Search in audio content with AnyCompany">
      <Container
        display="flex"
        justifyContent="center"
        marginTop="12"
        marginBottom="10"
      >
        <img src="/logo.png" style={{ width: "280px", height: "auto" }} />
      </Container>
      <Container maxW="md" display="flex" justifyContent="center">
        <Input
          placeholder="Type here"
          value={searchTerm}
          onChange={onChange}
          onKeyUp={onKeyUp}
        />
        <SearchButton
          minWidth={10}
          onClick={() => getSearchResults(searchTerm)}
          variant={loading ? "solid" : "solid"}
        >
          {loading ? <Spinner /> : <SearchIcon />}
        </SearchButton>
      </Container>
      <Container
        maxW="2xl"
        alignItems="center"
        marginTop="16"
        marginBottom="16"
      >
        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
        {results && results.length > 0 && <SearchTimeline results={results} />}
        {results && results.length === 0 && (
          <Text align="center">Your search did not match any documents.</Text>
        )}
      </Container>
      {results &&
        results.map((hit) => (
          <Fade in={!loading}>
            <Container maxW="2xl" justifyContent="left">
              <Results
                key={hit.uuid}
                hit={hit}
                search={(term: string) => {
                  setSearchTerm(term);
                  getSearchResults(term);
                }}
              />
            </Container>
          </Fade>
        ))}
    </Layout>
  );
};

export default Root;
