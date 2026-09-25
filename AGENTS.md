<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep imported GLB visuals isolated in `SceneModel`-based shells while physics uses canonical metric constants, so models remain replaceable.
- Render replay-only ball visuals on the overlay layer with a separate material, so review color and position cannot alter the live ball.
