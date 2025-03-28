// THIS FILE IS AUTOMATICALLY GENERATED BY SPACETIMEDB. EDITS TO THIS FILE
// WILL NOT BE SAVED. MODIFY TABLES IN YOUR MODULE SOURCE CODE INSTEAD.

/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
import {
  AlgebraicType,
  AlgebraicValue,
  BinaryReader,
  BinaryWriter,
  CallReducerFlags,
  ConnectionId,
  DbConnectionBuilder,
  DbConnectionImpl,
  DbContext,
  ErrorContextInterface,
  Event,
  EventContextInterface,
  Identity,
  ProductType,
  ProductTypeElement,
  ReducerEventContextInterface,
  SubscriptionBuilderImpl,
  SubscriptionEventContextInterface,
  SumType,
  SumTypeVariant,
  TableCache,
  TimeDuration,
  Timestamp,
  deepEqual,
} from "@clockworklabs/spacetimedb-sdk";
import { PreviousGrid } from "./previous_grid_type";
import { EventContext, Reducer, RemoteReducers, RemoteTables } from ".";

/**
 * Table handle for the table `previous_grid`.
 *
 * Obtain a handle from the [`previousGrid`] property on [`RemoteTables`],
 * like `ctx.db.previousGrid`.
 *
 * Users are encouraged not to explicitly reference this type,
 * but to directly chain method calls,
 * like `ctx.db.previousGrid.on_insert(...)`.
 */
export class PreviousGridTableHandle {
  tableCache: TableCache<PreviousGrid>;

  constructor(tableCache: TableCache<PreviousGrid>) {
    this.tableCache = tableCache;
  }

  count(): number {
    return this.tableCache.count();
  }

  iter(): Iterable<PreviousGrid> {
    return this.tableCache.iter();
  }
  /**
   * Access to the `gridid` unique index on the table `previous_grid`,
   * which allows point queries on the field of the same name
   * via the [`PreviousGridGrididUnique.find`] method.
   *
   * Users are encouraged not to explicitly reference this type,
   * but to directly chain method calls,
   * like `ctx.db.previousGrid.gridid().find(...)`.
   *
   * Get a handle on the `gridid` unique index on the table `previous_grid`.
   */
  gridid = {
    // Find the subscribed row whose `gridid` column value is equal to `col_val`,
    // if such a row is present in the client cache.
    find: (col_val: number): PreviousGrid | undefined => {
      for (let row of this.tableCache.iter()) {
        if (deepEqual(row.gridid, col_val)) {
          return row;
        }
      }
    },
  };

  onInsert = (cb: (ctx: EventContext, row: PreviousGrid) => void) => {
    return this.tableCache.onInsert(cb);
  }

  removeOnInsert = (cb: (ctx: EventContext, row: PreviousGrid) => void) => {
    return this.tableCache.removeOnInsert(cb);
  }

  onDelete = (cb: (ctx: EventContext, row: PreviousGrid) => void) => {
    return this.tableCache.onDelete(cb);
  }

  removeOnDelete = (cb: (ctx: EventContext, row: PreviousGrid) => void) => {
    return this.tableCache.removeOnDelete(cb);
  }

  // Updates are only defined for tables with primary keys.
  onUpdate = (cb: (ctx: EventContext, oldRow: PreviousGrid, newRow: PreviousGrid) => void) => {
    return this.tableCache.onUpdate(cb);
  }

  removeOnUpdate = (cb: (ctx: EventContext, onRow: PreviousGrid, newRow: PreviousGrid) => void) => {
    return this.tableCache.removeOnUpdate(cb);
  }}
