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
import { GridInfo } from "./grid_info_type";
import { EventContext, Reducer, RemoteReducers, RemoteTables } from ".";

/**
 * Table handle for the table `grid_info`.
 *
 * Obtain a handle from the [`gridInfo`] property on [`RemoteTables`],
 * like `ctx.db.gridInfo`.
 *
 * Users are encouraged not to explicitly reference this type,
 * but to directly chain method calls,
 * like `ctx.db.gridInfo.on_insert(...)`.
 */
export class GridInfoTableHandle {
  tableCache: TableCache<GridInfo>;

  constructor(tableCache: TableCache<GridInfo>) {
    this.tableCache = tableCache;
  }

  count(): number {
    return this.tableCache.count();
  }

  iter(): Iterable<GridInfo> {
    return this.tableCache.iter();
  }
  /**
   * Access to the `gridid` unique index on the table `grid_info`,
   * which allows point queries on the field of the same name
   * via the [`GridInfoGrididUnique.find`] method.
   *
   * Users are encouraged not to explicitly reference this type,
   * but to directly chain method calls,
   * like `ctx.db.gridInfo.gridid().find(...)`.
   *
   * Get a handle on the `gridid` unique index on the table `grid_info`.
   */
  gridid = {
    // Find the subscribed row whose `gridid` column value is equal to `col_val`,
    // if such a row is present in the client cache.
    find: (col_val: number): GridInfo | undefined => {
      for (let row of this.tableCache.iter()) {
        if (deepEqual(row.gridid, col_val)) {
          return row;
        }
      }
    },
  };

  onInsert = (cb: (ctx: EventContext, row: GridInfo) => void) => {
    return this.tableCache.onInsert(cb);
  }

  removeOnInsert = (cb: (ctx: EventContext, row: GridInfo) => void) => {
    return this.tableCache.removeOnInsert(cb);
  }

  onDelete = (cb: (ctx: EventContext, row: GridInfo) => void) => {
    return this.tableCache.onDelete(cb);
  }

  removeOnDelete = (cb: (ctx: EventContext, row: GridInfo) => void) => {
    return this.tableCache.removeOnDelete(cb);
  }

  // Updates are only defined for tables with primary keys.
  onUpdate = (cb: (ctx: EventContext, oldRow: GridInfo, newRow: GridInfo) => void) => {
    return this.tableCache.onUpdate(cb);
  }

  removeOnUpdate = (cb: (ctx: EventContext, onRow: GridInfo, newRow: GridInfo) => void) => {
    return this.tableCache.removeOnUpdate(cb);
  }}
