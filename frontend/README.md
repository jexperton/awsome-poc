## Config

`REACT_APP_SEARCH_CACHE_TTL`: TTL in seconds of a cached search result (default: 10)


## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

## Router

Use [React Router](https://reactrouter.com/en/main/start/tutorial)

## UI Kit

Use [Chakra UI](https://chakra-ui.com/getting-started)

## CSS-in-JS Library

Use [Emotion](https://emotion.sh/docs/introduction).

Prefer *styled components* when possible:

```javascript
import styled from '@emotion/styled'

const Button = styled.button`
  padding: 32px;
  background-color: hotpink;
  font-size: 24px;
  border-radius: 4px;
  color: black;
  font-weight: bold;
  &:hover {
    color: white;
  }
`

render(<Button>This my button component.</Button>)
```

Alternatively, use the `css` prop:


```javascript
import { css } from '@emotion/react'

const color = 'white'

render(
  <div
    css={css`
      padding: 32px;
      background-color: hotpink;
      font-size: 24px;
      border-radius: 4px;
      &:hover {
        color: ${color};
      }
    `}
  >
    Hover to change color.
  </div>
)
```

