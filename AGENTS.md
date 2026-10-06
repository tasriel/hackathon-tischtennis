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
- Keep the court net as a single alpha-cutout texture plane using canonical net height, so the XR scene avoids a costly decorative net model without changing ball collisions.
- Drive target celebrations from far-table impact events and keep floor markings hidden only during replay capture, so visual feedback is frame-rate-independent and the main hall retains its markings.
- Draw the opaque review frame and image last in the transparent render queue without depth testing, so transparent nets and scene labels cannot cover the XR review panel.
- Model opponent rubbers as physics constants (grip, restitution, spin retention) in constants.ts and keep the opponent racket a SceneModel visual, so rubber behaviour and textures stay independently swappable.
- Generate opponent spin through the shared Coulomb-limited contact model and explicitly assist teaching-ball aim and Anti near-bounce damping, so guaranteed accessible returns are not mistaken for an unassisted physics simulation.
- Keep opponent arm and wrist animation in its replaceable racket shell and derive preparation/contact/follow-through from the simulation plan, so visible motion follows the same contact timeline.
