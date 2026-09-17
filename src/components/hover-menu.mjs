export function initHoverMenu(menu, canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let keyboardInteraction = false;
  let pointerType = 'mouse';

  menu.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && canHover()) menu.open = true;
  });
  menu.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse' || !canHover()) return;
    if (!keyboardInteraction || !menu.contains(menu.ownerDocument.activeElement)) menu.open = false;
  });
  menu.addEventListener('keydown', () => { keyboardInteraction = true; });
  menu.addEventListener('pointerdown', event => {
    keyboardInteraction = false;
    pointerType = event.pointerType;
  });
  menu.querySelector('summary').addEventListener('click', event => {
    if (event.detail > 0 && pointerType === 'mouse' && canHover()) {
      event.preventDefault();
      menu.open = true;
    }
  });
}
