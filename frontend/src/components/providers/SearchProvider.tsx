import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface Hit {
  uuid: string;
  title: string;
  date: Date;
  url: string;
  excerpt: string[];
  score: number;
  entities: Array<{
    BeginOffset: number;
    EndOffset: number;
    Score: number;
    Text: string;
    Type: string;
  }>;
}

type Results = Array<{
  excerpt: string[];
  id: string;
  score: number;
  source: {
    date: string;
    items: {
      bucket: string;
      key: string;
    };
    media: string;
    title: string;
    transcript: string;
    entities: Hit["entities"];
  };
}>;

type Cache = Record<
  string,
  {
    age: number;
    data: Hit[];
  }
>;

const SearchContext = createContext<{
  search: (terms: string) => void;
  loading: boolean;
  results?: Hit[];
  error?: string;
}>({
  search: () => {},
  loading: false,
});

const handleError = (data: any) => {
  if (data.name === "ConnectionError")
    throw new Error("Service unavailable, please retry later.");
  if (data.name === "ResponseError") {
    if (data.meta?.body?.error?.reason)
      throw new Error(
        `${data.meta?.body?.error?.type}, ${data.meta?.body?.error?.reason}`
      );
    throw new Error("Unknown error, please retry later.");
  }
};

const SearchProvider: FC<{ cacheTTL: number } & PropsWithChildren> = ({
  cacheTTL,
  children,
}) => {
  const cache = useRef<Cache>({}).current;
  const [terms, setTerms] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Hit[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    setError(undefined);
    (async () => {
      if (!terms) return;

      if (
        typeof cache[terms] !== "undefined" &&
        Date.now() - cache[terms].age < cacheTTL * 1000
      ) {
        setResults(cache[terms].data);
        return;
      }

      setLoading(true);

      try {
        const data: Results = await (
          await fetch(
            `${process.env.REACT_APP_API!}/search?terms=${encodeURIComponent(
              terms
            )}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
        ).json();

        if (typeof data === "string") {
          handleError(JSON.parse(data));
        }

        const mapped = data.map((hit) => ({
          uuid: hit.id,
          title: hit.source.title,
          date: new Date(parseInt(hit.source.date)),
          url: hit.source.media,
          excerpt: hit.excerpt,
          entities: hit.source.entities,
          score: +hit.score,
        }));
        setResults(mapped);
        cache[terms] = { age: Date.now(), data: mapped };
      } catch (error) {
        setError(`${error}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [terms]);

  return (
    <SearchContext.Provider
      value={{ search: setTerms, loading, results, error }}
    >
      {children}
    </SearchContext.Provider>
  );
};

const useSearch = () => {
  return useContext(SearchContext);
};

export default SearchProvider;
export { useSearch, SearchProvider, SearchContext };
