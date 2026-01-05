# anti-devtools

Advanced detection and prevention of DevTools usage for web applications.
Supports Vanilla JS, React, and Vue.

## Installation

```bash
npm install @evelocore/anti-devtools
# or
yarn add @evelocore/anti-devtools
# or
pnpm add @evelocore/anti-devtools
```

## Usage

### Vanilla JS

```javascript
import { AntiDevtools } from '@evelocore/anti-devtools';

const anti = new AntiDevtools({
  ondevtoolopen: () => {
    console.log('DevTools opened!');
    // Redirect or clear content
    window.location.href = "about:blank";
  },
  ondevtoolclose: () => {
    console.log('DevTools closed');
  },
  interval: 500 // check interval in ms
});

// To stop detection
// anti.destroy();
```

### React

```tsx
import { useAntiDevtools } from '@evelocore/anti-devtools/react';

function App() {
  useAntiDevtools({
    ondevtoolopen: () => {
      alert('DevTools detected!');
    }
  });

  return (
    <div>
      <h1>Protected App</h1>
    </div>
  );
}
```

### Vue

```vue
<script setup>
import { useAntiDevtools } from '@evelocore/anti-devtools/vue';

useAntiDevtools({
  ondevtoolopen: () => {
    alert('DevTools detected!');
  }
});
</script>

<template>
  <h1>Protected App</h1>
</template>
```

## Configuration

| Option | Type | Default | Description |
|Params|Type|Default|Description|
|---|---|---|---|
| `ondevtoolopen` | `() => void` | `window.location.href = "about:blank"` | Callback when DevTools is detected opening. |
| `ondevtoolclose` | `() => void` | `undefined` | Callback when DevTools is detected closing. |
| `interval` | `number` | `500` | Detection check interval in milliseconds. |
| `clearIntervalWhenDevOpenTrigger` | `boolean` | `false` | Stop checking after first detection. |

## License

ISC

## Author

[Evelocore](https://evelocore.com)

