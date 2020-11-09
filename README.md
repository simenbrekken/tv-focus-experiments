## Thoughs on possible focus principles

Restricting ourselves to a tree composed of single-dimension branches makes things easier:

```ts
interface Node {
  id: string;
  orientation?: 'horizontal' | 'vertical';
  parent?: string;
  children?: [Node];
}

const frontPage: Node = {
  id: 'front-page',
  orientation: 'vertical',
  children: [
    {
      id: 'menu',
      orientation: 'horizontal',
      parent: 'front-page',
      children: [
        { id: 'home', parent: 'menu' },
        { id: 'live', parent: 'menu' },
      ],
    },
    {
      id: 'sections',
      orientation: 'vertical',
      parent: 'front-page',
      children: [
        {
          id: 'section-1',
          orientation: 'horizontal',
          parent: 'sections',
          children: [
            {
              id: 'section-1-plug-1',
              parent: 'section-1',
            },
            // ...
          ],
        },
        // ...
      ],
    },
  ],
};
```

Modeling something like the above in multiple dimensions makes the above a lot more complicated as you can't easily represent a grid without adding a `width` or something similar.

We need a way to remember for each parent what child was active when focus left. If no active child has been set it should default to the first focusable child.

## Navigating the tree (inspired by BBC's LRUD)

- From the currently focused Node find its closest parent container
- Find the index of the currently focused in its list of children
- If the container's orientation matches the desired direction to move in set focus to the next/previous child

- If the container's orientation does _not_ match the direction move up the tree until a parent with a matching orientation is found
  - If the parent has children, set focus to the active or first child
  - If the parent doesn't have children, continue down the tree
