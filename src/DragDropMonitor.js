import invariant from 'invariant';
import isArray from 'lodash/isArray';
import matchesType from './utils/matchesType';
import HandlerRegistry from './HandlerRegistry';
import { getSourceClientOffset, getDifferenceFromInitialOffset } from './reducers/dragOffset';
import { areDirty } from './reducers/dirtyHandlerIds';

export default class DragDropMonitor {
  constructor(store) {
    this.store = store;
    this.registry = new HandlerRegistry(store);
  }

  subscribeToStateChange(listener, options = {}) {
    const { handlerIds } = options;
    invariant(
      typeof listener === 'function',
      'listener must be a function.',
    );
    invariant(
      typeof handlerIds === 'undefined' || isArray(handlerIds),
      'handlerIds, when specified, must be an array of strings.',
    );

    let prevStateId = /* TODO: JSFIX could not patch the breaking change:
    Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
    this.store.getState().stateId;
    const handleChange = () => {
      const state = /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.getState();
      const currentStateId = state.stateId;
      try {
        const canSkipListener = currentStateId === prevStateId || (
          currentStateId === prevStateId + 1 &&
          !areDirty(state.dirtyHandlerIds, handlerIds)
        );

        if (!canSkipListener) {
          listener();
        }
      } finally {
        prevStateId = currentStateId;
      }
    };

    return (
      /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.subscribe(handleChange)
    );
  }

  subscribeToOffsetChange(listener) {
    invariant(
      typeof listener === 'function',
      'listener must be a function.',
    );

    let previousState = /* TODO: JSFIX could not patch the breaking change:
    Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
    this.store.getState().dragOffset;
    const handleChange = () => {
      const nextState = /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.getState().dragOffset;
      if (nextState === previousState) {
        return;
      }

      previousState = nextState;
      listener();
    };

    return (
      /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.subscribe(handleChange)
    );
  }

  canDragSource(sourceId) {
    const source = this.registry.getSource(sourceId);
    invariant(source, 'Expected to find a valid source.');

    if (this.isDragging()) {
      return false;
    }

    return source.canDrag(this, sourceId);
  }

  canDropOnTarget(targetId) {
    const target = this.registry.getTarget(targetId);
    invariant(target, 'Expected to find a valid target.');

    if (!this.isDragging() || this.didDrop()) {
      return false;
    }

    const targetType = this.registry.getTargetType(targetId);
    const draggedItemType = this.getItemType();
    return matchesType(targetType, draggedItemType) &&
           target.canDrop(this, targetId);
  }

  isDragging() {
    return Boolean(this.getItemType());
  }

  isDraggingSource(sourceId) {
    const source = this.registry.getSource(sourceId, true);
    invariant(source, 'Expected to find a valid source.');

    if (!this.isDragging() || !this.isSourcePublic()) {
      return false;
    }

    const sourceType = this.registry.getSourceType(sourceId);
    const draggedItemType = this.getItemType();
    if (sourceType !== draggedItemType) {
      return false;
    }

    return source.isDragging(this, sourceId);
  }

  isOverTarget(targetId, options = { shallow: false }) {
    const { shallow } = options;
    if (!this.isDragging()) {
      return false;
    }

    const targetType = this.registry.getTargetType(targetId);
    const draggedItemType = this.getItemType();
    if (!matchesType(targetType, draggedItemType)) {
      return false;
    }

    const targetIds = this.getTargetIds();
    if (!targetIds.length) {
      return false;
    }

    const index = targetIds.indexOf(targetId);
    if (shallow) {
      return index === targetIds.length - 1;
    } else {
      return index > -1;
    }
  }

  getItemType() {
    return (
      /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.getState().dragOperation.itemType
    );
  }

  getItem() {
    return (
      /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.getState().dragOperation.item
    );
  }

  getSourceId() {
    return (
      /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.getState().dragOperation.sourceId
    );
  }

  getTargetIds() {
    return (
      /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.getState().dragOperation.targetIds
    );
  }

  getDropResult() {
    return (
      /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.getState().dragOperation.dropResult
    );
  }

  didDrop() {
    return (
      /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.getState().dragOperation.didDrop
    );
  }

  isSourcePublic() {
    return (
      /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.getState().dragOperation.isSourcePublic
    );
  }

  getInitialClientOffset() {
    return (
      /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.getState().dragOffset.initialClientOffset
    );
  }

  getInitialSourceClientOffset() {
    return (
      /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.getState().dragOffset.initialSourceClientOffset
    );
  }

  getClientOffset() {
    return (
      /* TODO: JSFIX could not patch the breaking change:
      Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
      this.store.getState().dragOffset.clientOffset
    );
  }

  getSourceClientOffset() {
    return getSourceClientOffset(/* TODO: JSFIX could not patch the breaking change:
    Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
    this.store.getState().dragOffset);
  }

  getDifferenceFromInitialOffset() {
    return getDifferenceFromInitialOffset(/* TODO: JSFIX could not patch the breaking change:
    Throw if getState, subscribe, or unsubscribe called while dispatching (including inside a reducer) (#1569 by @mjw56) */
    this.store.getState().dragOffset);
  }
}
