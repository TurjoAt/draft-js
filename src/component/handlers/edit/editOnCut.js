/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule editOnCut
 * @flow
 */

'use strict';

const DraftModifier = require('DraftModifier');
const EditorState = require('EditorState');
const Style = require('Style');

const getFragmentFromSelection = require('getFragmentFromSelection');
const getScrollPosition = require('getScrollPosition');

/**
 * On `cut` events, native behavior is allowed to occur so that the system
 * clipboard is set properly. This means that we need to take steps to recover
 * the editor DOM state after the `cut` has occurred in order to maintain
 * control of the component.
 *
 * In addition, we can keep a copy of the removed fragment, including all
 * styles and entities, for use as an internal paste.
 */
function editOnCut(e: SyntheticClipboardEvent): void {
  const editorState = this.props.editorState;
  const selection = editorState.getSelection();

  // No selection, so there's nothing to cut.
  if (selection.isCollapsed()) {
    e.preventDefault();
    return;
  }

  // Track the current scroll position so that it can be forced back in place
  // after the editor regains control of the DOM.
  const scrollParent = Style.getScrollParent(e.target);
  const {x, y} = getScrollPosition(scrollParent);

  const fragment = getFragmentFromSelection(editorState);
  this.setClipboard(fragment);

  // Set `cut` mode to disable all event handling temporarily.
  this.setMode('cut');

  // Let native `cut` behavior occur, then recover control.
  setTimeout(() => {
    this.restoreEditorDOM({x, y});
    this.exitCurrentMode();
    this.update(removeFragment(editorState));
  }, 0);
}

function removeFragment(editorState: EditorState): EditorState {
  const newContent = DraftModifier.removeRange(
    editorState.getCurrentContent(),
    editorState.getSelection(),
    'forward'
  );
  return EditorState.push(editorState, newContent, 'remove-range');
}

module.exports = editOnCut;
