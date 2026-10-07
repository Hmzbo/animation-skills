# Examples — drop-in scenes for Motion Canvas v3

Copy a file into `<video-project>/src/scenes/`, register it in `src/project.ts`:

```ts
import titleCard from './scenes/title-card?scene';
export default makeProject({scenes: [titleCard]});
```

`npm run build` must pass before previewing. Both scenes use only
`references/motion-canvas-api.md` primitives so they compile against the template.
