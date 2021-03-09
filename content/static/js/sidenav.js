'use strict';
/*!
 * @license
 * Copyright 2019-2021 The Go Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
const Key = {
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  ENTER: 'Enter',
  ASTERISK: '*',
  SPACE: ' ',
  END: 'End',
  HOME: 'Home',
  Y: 'y',
  FORWARD_SLASH: '/',
  QUESTION_MARK: '?',
};
class DocNavTreeController {
  constructor(el) {
    this.el = el;
    this.focusedIndex = 0;
    this.visibleItems = [];
    this.searchString = '';
    this.lastKeyDownTimeStamp = -Infinity;
    this.el = el;
    this.selectedEl = null;
    this.focusedIndex = 0;
    this.visibleItems = [];
    this.searchString = '';
    this.lastKeyDownTimeStamp = -Infinity;
    this.addEventListeners();
    this.updateVisibleItems();
    this.initialize();
  }
  initialize() {
    this.el.querySelectorAll(`[role='treeitem']`).forEach(el => {
      el.addEventListener('click', e => this.handleItemClick(e));
    });
    this.el.querySelectorAll('[data-aria-owns]').forEach(el => {
      var _a;
      el.setAttribute(
        'aria-owns',
        (_a = el.getAttribute('data-aria-owns')) !== null && _a !== void 0 ? _a : ''
      );
    });
  }
  addEventListeners() {
    this.el.addEventListener('keydown', e => this.handleKeyDown(e));
  }
  setFocusedIndex(index) {
    if (index === this.focusedIndex || index === -1) {
      return;
    }
    let itemEl = this.visibleItems[this.focusedIndex];
    itemEl.setAttribute('tabindex', '-1');
    itemEl = this.visibleItems[index];
    itemEl.setAttribute('tabindex', '0');
    itemEl.focus();
    this.focusedIndex = index;
  }
  setSelectedId(opt_id) {
    if (this.selectedEl) {
      this.selectedEl.removeAttribute('aria-selected');
      this.selectedEl = null;
    }
    if (opt_id) {
      this.selectedEl = this.el.querySelector(`[role='treeitem'][href='#${opt_id}']`);
    } else if (this.visibleItems.length > 0) {
      this.selectedEl = this.visibleItems[0];
    }
    if (!this.selectedEl) {
      return;
    }
    const topLevelExpanded = this.el.querySelector('[aria-level="1"][aria-expanded="true"]');
    if (topLevelExpanded && !topLevelExpanded.contains(this.selectedEl)) {
      this.collapseItem(topLevelExpanded);
    }
    if (this.selectedEl.getAttribute('aria-level') === '1') {
      this.selectedEl.setAttribute('aria-expanded', 'true');
    }
    this.selectedEl.setAttribute('aria-selected', 'true');
    this.expandAllParents(this.selectedEl);
    this.scrollElementIntoView(this.selectedEl);
  }
  expandAllSiblingItems(el) {
    const level = el.getAttribute('aria-level');
    this.el.querySelectorAll(`[aria-level='${level}'][aria-expanded='false']`).forEach(el => {
      el.setAttribute('aria-expanded', 'true');
    });
    this.updateVisibleItems();
    this.focusedIndex = this.visibleItems.indexOf(el);
  }
  expandAllParents(el) {
    if (!this.visibleItems.includes(el)) {
      let owningItemEl = this.owningItem(el);
      while (owningItemEl) {
        this.expandItem(owningItemEl);
        owningItemEl = this.owningItem(owningItemEl);
      }
    }
  }
  scrollElementIntoView(el) {
    const STICKY_HEADER_HEIGHT_PX = 55;
    const viewportHeightPx = document.documentElement.clientHeight;
    const elRect = el.getBoundingClientRect();
    const verticalCenterPointPx = (viewportHeightPx - STICKY_HEADER_HEIGHT_PX) / 2;
    if (elRect.top < STICKY_HEADER_HEIGHT_PX) {
      this.el.scrollTop -=
        STICKY_HEADER_HEIGHT_PX - elRect.top - elRect.height + verticalCenterPointPx;
    } else if (elRect.bottom > viewportHeightPx) {
      this.el.scrollTop = elRect.bottom - viewportHeightPx + verticalCenterPointPx;
    } else {
      return;
    }
  }
  handleItemClick(e) {
    const el = e.target;
    this.setFocusedIndex(this.visibleItems.indexOf(el));
    if (el.hasAttribute('aria-expanded')) {
      this.toggleItemExpandedState(el);
    }
    this.closeInactiveDocNavGroups(el);
  }
  closeInactiveDocNavGroups(el) {
    if (el.hasAttribute('aria-expanded')) {
      const level = el.getAttribute('aria-level');
      document.querySelectorAll(`[aria-level="${level}"]`).forEach(nav => {
        if (nav.getAttribute('aria-expanded') === 'true' && nav !== el) {
          nav.setAttribute('aria-expanded', 'false');
        }
      });
      this.updateVisibleItems();
      this.focusedIndex = this.visibleItems.indexOf(el);
    }
  }
  handleKeyDown(e) {
    const targetEl = e.target;
    switch (e.key) {
      case Key.ASTERISK:
        if (targetEl) {
          this.expandAllSiblingItems(targetEl);
        }
        e.stopPropagation();
        e.preventDefault();
        return;
      case Key.FORWARD_SLASH:
      case Key.QUESTION_MARK:
        return;
      case Key.DOWN:
        this.focusNextItem();
        break;
      case Key.UP:
        this.focusPreviousItem();
        break;
      case Key.LEFT:
        if (
          (targetEl === null || targetEl === void 0
            ? void 0
            : targetEl.getAttribute('aria-expanded')) === 'true'
        ) {
          this.collapseItem(targetEl);
        } else {
          this.focusParentItem(targetEl);
        }
        break;
      case Key.RIGHT: {
        switch (
          targetEl === null || targetEl === void 0 ? void 0 : targetEl.getAttribute('aria-expanded')
        ) {
          case 'false':
            this.expandItem(targetEl);
            break;
          case 'true':
            this.focusNextItem();
            break;
        }
        break;
      }
      case Key.HOME:
        this.setFocusedIndex(0);
        break;
      case Key.END:
        this.setFocusedIndex(this.visibleItems.length - 1);
        break;
      case Key.ENTER:
        if ((targetEl === null || targetEl === void 0 ? void 0 : targetEl.tagName) === 'A') {
          return;
        }
      case Key.SPACE:
        targetEl === null || targetEl === void 0 ? void 0 : targetEl.click();
        break;
      default:
        this.handleSearch(e);
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  }
  handleSearch(e) {
    var _a;
    if (
      e.metaKey ||
      e.altKey ||
      e.ctrlKey ||
      e.isComposing ||
      e.key.length > 1 ||
      !e.key.match(/\S/)
    ) {
      return;
    }
    const MAX_TYPEAHEAD_THRESHOLD_MS = 1000;
    if (e.timeStamp - this.lastKeyDownTimeStamp > MAX_TYPEAHEAD_THRESHOLD_MS) {
      this.searchString = '';
    }
    this.lastKeyDownTimeStamp = e.timeStamp;
    this.searchString += e.key.toLocaleLowerCase();
    const focusedElementText =
      (_a = this.visibleItems[this.focusedIndex].textContent) === null || _a === void 0
        ? void 0
        : _a.toLocaleLowerCase();
    if (
      this.searchString.length === 1 ||
      !(focusedElementText === null || focusedElementText === void 0
        ? void 0
        : focusedElementText.startsWith(this.searchString))
    ) {
      this.focusNextItemWithPrefix(this.searchString);
    }
    e.stopPropagation();
    e.preventDefault();
  }
  focusNextItemWithPrefix(prefix) {
    var _a;
    let i = this.focusedIndex + 1;
    if (i > this.visibleItems.length - 1) {
      i = 0;
    }
    while (i !== this.focusedIndex) {
      if (
        (_a = this.visibleItems[i].textContent) === null || _a === void 0
          ? void 0
          : _a.toLocaleLowerCase().startsWith(prefix)
      ) {
        this.setFocusedIndex(i);
        return;
      }
      if (i >= this.visibleItems.length - 1) {
        i = 0;
      } else {
        i++;
      }
    }
  }
  toggleItemExpandedState(el) {
    el.getAttribute('aria-expanded') === 'true' ? this.collapseItem(el) : this.expandItem(el);
  }
  focusPreviousItem() {
    this.setFocusedIndex(Math.max(0, this.focusedIndex - 1));
  }
  focusNextItem() {
    this.setFocusedIndex(Math.min(this.visibleItems.length - 1, this.focusedIndex + 1));
  }
  collapseItem(el) {
    el.setAttribute('aria-expanded', 'false');
    this.updateVisibleItems();
  }
  expandItem(el) {
    el.setAttribute('aria-expanded', 'true');
    this.updateVisibleItems();
  }
  focusParentItem(el) {
    const owningItemEl = this.owningItem(el);
    if (owningItemEl) {
      this.setFocusedIndex(this.visibleItems.indexOf(owningItemEl));
    }
  }
  owningItem(el) {
    var _a;
    const groupEl = el === null || el === void 0 ? void 0 : el.closest(`[role='group']`);
    if (!groupEl) {
      return null;
    }
    return (_a = groupEl.parentElement) === null || _a === void 0
      ? void 0
      : _a.querySelector(`[aria-owns='${groupEl.id}']`);
  }
  updateVisibleItems() {
    const allEls = Array.from(this.el.querySelectorAll(`[role='treeitem']`));
    const hiddenEls = Array.from(
      this.el.querySelectorAll(`[aria-expanded='false'] + [role='group'] [role='treeitem']`)
    );
    this.visibleItems = allEls.filter(el => !hiddenEls.includes(el));
  }
}
class DocPageController {
  constructor(sideNavEl, mobileNavEl, contentEl) {
    this.contentEl = contentEl;
    if (!sideNavEl || !contentEl) {
      console.warn('Unable to find all elements needed for navigation');
      return;
    }
    this.navController = new DocNavTreeController(sideNavEl);
    if (mobileNavEl) {
      this.mobileNavController = new MobileNavController(mobileNavEl);
    }
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.updateSelectedIdFromWindowHash();
  }
  handleHashChange() {
    this.updateSelectedIdFromWindowHash();
  }
  updateSelectedIdFromWindowHash() {
    var _a, _b;
    const targetId = this.targetIdFromLocationHash();
    (_a = this.navController) === null || _a === void 0 ? void 0 : _a.setSelectedId(targetId);
    if (this.mobileNavController) {
      this.mobileNavController.setSelectedId(targetId);
    }
    if (targetId !== '') {
      const targetEl =
        (_b = this.contentEl) === null || _b === void 0
          ? void 0
          : _b.querySelector(`[id='${targetId}']`);
      if (targetEl) {
        targetEl.focus();
      }
    }
  }
  targetIdFromLocationHash() {
    return window.location.hash && window.location.hash.substr(1);
  }
}
class MobileNavController {
  constructor(el) {
    var _a;
    this.el = el;
    this.selectEl = el.querySelector('select');
    this.labelTextEl = el.querySelector('.js-mobileNavSelectText');
    (_a = this.selectEl) === null || _a === void 0
      ? void 0
      : _a.addEventListener('change', e => this.handleSelectChange(e));
    const ROOT_TOP_MARGIN = '-57px';
    this.intersectionObserver = new IntersectionObserver(
      entries => this.intersectionObserverCallback(entries),
      {
        rootMargin: `${ROOT_TOP_MARGIN} 0px 0px 0px`,
        threshold: 1.0,
      }
    );
    this.intersectionObserver.observe(this.el);
  }
  setSelectedId(id) {
    if (!this.selectEl) return;
    this.selectEl.value = id;
    this.updateLabelText();
  }
  updateLabelText() {
    var _a;
    if (!this.labelTextEl || !this.selectEl) return;
    const selectedIndex =
      (_a = this.selectEl) === null || _a === void 0 ? void 0 : _a.selectedIndex;
    if (selectedIndex === -1) {
      this.labelTextEl.textContent = '';
      return;
    }
    this.labelTextEl.textContent = this.selectEl.options[selectedIndex].textContent;
  }
  handleSelectChange(e) {
    window.location.hash = `#${e.target.value}`;
    this.updateLabelText();
  }
  intersectionObserverCallback(entries) {
    const SHADOW_CSS_CLASS = 'DocNavMobile--withShadow';
    entries.forEach(entry => {
      const fullyInView = entry.intersectionRatio === 1.0;
      entry.target.classList.toggle(SHADOW_CSS_CLASS, !fullyInView);
    });
  }
}
new DocPageController(
  document.querySelector('.js-tree'),
  document.querySelector('.js-mobileNav'),
  document.querySelector('.js-unitDetailsContent')
);
//# sourceMappingURL=sidenav.js.map
